#!/bin/sh
set -e

echo "Starting EFFICI Admin System..."
echo "Environment: ${APP_ENV:-production}"

# Check if APP_KEY is set
if [ -z "$APP_KEY" ]; then
    echo "ERROR: APP_KEY is not set!"
    exit 1
fi

# Test database connection
echo "Testing database connection..."
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connected successfully';" || {
    echo "ERROR: Database connection failed!"
    exit 1
}

# Show Laravel version
php artisan --version

# Clear all caches (important for fresh start)
echo "Clearing caches..."
php artisan cache:clear || true
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Note: Not caching config in Docker because it causes cache path issues
# Laravel will work fine without cached config, just slightly slower

echo "Application ready!"

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisord.conf
