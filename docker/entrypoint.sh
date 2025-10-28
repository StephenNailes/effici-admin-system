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

# Clear any cached config and optimize for production
echo "Optimizing application..."
php artisan config:clear || true
php artisan cache:clear || true
php artisan view:clear || true
php artisan config:cache || echo "WARNING: Config cache failed"
php artisan route:cache || echo "WARNING: Route cache failed"
php artisan view:cache || echo "WARNING: View cache failed"

echo "Application ready!"

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisord.conf
