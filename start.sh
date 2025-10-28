#!/bin/bash

# Navigate to the Laravel app directory
cd sad

# Start PHP built-in server
php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
