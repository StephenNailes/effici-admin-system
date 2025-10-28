# Build stage for frontend assets
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY sad/package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy necessary Laravel files for Vite build
COPY sad/artisan ./artisan
COPY sad/vite.config.ts ./vite.config.ts
COPY sad/tsconfig.json ./tsconfig.json

# Copy frontend source
COPY sad/resources ./resources
COPY sad/public ./public

# Copy composer files and install Ziggy (required for Vite build)
COPY sad/composer.json sad/composer.lock ./
RUN apk add --no-cache php83 php83-tokenizer php83-xml php83-dom php83-xmlwriter php83-simplexml \
    && ln -sf /usr/bin/php83 /usr/bin/php \
    && php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
    && rm composer-setup.php \
    && composer install --no-dev --no-scripts --no-autoloader --prefer-dist \
    && composer dump-autoload

# Create .env file for Vite build (Vite needs this)
RUN echo "VITE_APP_NAME=EfficiAdmin" > .env

# Build frontend assets
RUN npm run build

# Production stage
FROM php:8.3-fpm-alpine

# Install system dependencies in single layer
RUN apk add --no-cache \
    nginx \
    supervisor \
    mysql-client \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libpng \
    libjpeg-turbo \
    libwebp \
    icu-libs \
    && rm -rf /var/cache/apk/*

# Install build dependencies and PHP extensions, then remove build deps
RUN apk add --no-cache --virtual .build-deps \
    freetype-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    libwebp-dev \
    libxpm-dev \
    icu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql bcmath opcache intl \
    && apk del .build-deps \
    && rm -rf /tmp/* /var/cache/apk/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy only composer files first (for better caching)
COPY sad/composer.json sad/composer.lock ./

# Install PHP dependencies (cached if composer files unchanged)
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist --no-scripts --no-autoloader

# Copy application files
COPY sad/ .

# Copy built frontend assets from builder
COPY --from=frontend-builder /app/public/build ./public/build

# Complete Composer installation and set permissions in single layer
RUN composer dump-autoload --optimize --no-dev \
    && chown -R www-data:www-data /var/www/html \
    && mkdir -p storage/logs \
    && mkdir -p storage/framework/cache/data \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/app/public \
    && mkdir -p bootstrap/cache \
    && chmod -R 775 storage \
    && chmod -R 775 bootstrap/cache \
    && chown -R www-data:www-data storage \
    && chown -R www-data:www-data bootstrap/cache \
    && mkdir -p /var/log/supervisor \
    && chown -R www-data:www-data /var/log/supervisor \
    && php artisan storage:link || true

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Configure PHP and permissions in single layer
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/opcache.ini

# Set Chromium environment for Browsershot
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start supervisor
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
