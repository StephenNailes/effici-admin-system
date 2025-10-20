#!/usr/bin/env bash

# Production Optimization Script for EFFICI Admin System
# Run this before deployment to ensure everything is production-ready

echo "🚀 EFFICI Admin System - Production Optimization"
echo "================================================"
echo ""

# Check if we're in the sad directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: Please run this script from the sad/ directory"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
composer install --optimize-autoloader --no-dev
npm ci

echo ""
echo "🏗️  Step 2: Building frontend assets..."
npm run build

echo ""
echo "🧹 Step 3: Clearing caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo ""
echo "⚙️  Step 4: Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo ""
echo "🔐 Step 5: Checking environment..."
if grep -q "APP_DEBUG=true" .env; then
    echo "⚠️  WARNING: APP_DEBUG is true. Set to false for production!"
fi

if grep -q "APP_ENV=local" .env; then
    echo "⚠️  WARNING: APP_ENV is local. Set to production!"
fi

if ! grep -q "APP_KEY=base64:" .env; then
    echo "❌ ERROR: APP_KEY is not set or invalid!"
    echo "   Run: php artisan key:generate"
fi

echo ""
echo "📊 Step 6: Checking database migrations..."
php artisan migrate:status

echo ""
echo "✅ Production optimization complete!"
echo ""
echo "📋 Pre-deployment checklist:"
echo "  [ ] APP_ENV=production in .env"
echo "  [ ] APP_DEBUG=false in .env"
echo "  [ ] APP_KEY is set and unique"
echo "  [ ] Database credentials configured"
echo "  [ ] All migrations tested"
echo "  [ ] Git commits are up to date"
echo ""
echo "🚀 Ready to deploy to Railway!"
echo ""
