#!/bin/sh
set -e

echo "Starting EFFICI Admin System..."
echo "Environment: ${APP_ENV:-production}"

# Check if APP_KEY is set
if [ -z "$APP_KEY" ]; then
    echo "ERROR: APP_KEY is not set!"
    exit 1
fi

# Test database connection with a simple query
echo "Testing database connection..."
php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database connected successfully';" || echo "WARNING: Database connection test failed"

# Show Laravel version
php artisan --version

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisord.conf
