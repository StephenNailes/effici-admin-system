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
php artisan db:show || echo "WARNING: Database connection failed"

# Show Laravel version
php artisan --version

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisord.conf
