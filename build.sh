#!/bin/bash

# Navigate to the Laravel app directory
cd sad

# Install PHP dependencies
echo "Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies
echo "Installing NPM dependencies..."
npm ci --silent

# Build frontend assets
echo "Building frontend assets..."
npm run build

# Cache Laravel configurations for production
echo "Caching Laravel configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Build completed successfully!"
