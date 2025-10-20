# Production Optimization Script for EFFICI Admin System (Windows)
# Run this before deployment to ensure everything is production-ready

Write-Host "🚀 EFFICI Admin System - Production Optimization" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the sad directory
if (-not (Test-Path "artisan")) {
    Write-Host "❌ Error: Please run this script from the sad/ directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
composer install --optimize-autoloader --no-dev
npm ci

Write-Host ""
Write-Host "🏗️  Step 2: Building frontend assets..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "🧹 Step 3: Clearing caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

Write-Host ""
Write-Host "⚙️  Step 4: Optimizing for production..." -ForegroundColor Yellow
php artisan config:cache
php artisan route:cache
php artisan view:cache

Write-Host ""
Write-Host "🔐 Step 5: Checking environment..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw

if ($envContent -match "APP_DEBUG=true") {
    Write-Host "⚠️  WARNING: APP_DEBUG is true. Set to false for production!" -ForegroundColor Yellow
}

if ($envContent -match "APP_ENV=local") {
    Write-Host "⚠️  WARNING: APP_ENV is local. Set to production!" -ForegroundColor Yellow
}

if ($envContent -notmatch "APP_KEY=base64:") {
    Write-Host "❌ ERROR: APP_KEY is not set or invalid!" -ForegroundColor Red
    Write-Host "   Run: php artisan key:generate" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 Step 6: Checking database migrations..." -ForegroundColor Yellow
php artisan migrate:status

Write-Host ""
Write-Host "✅ Production optimization complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Pre-deployment checklist:" -ForegroundColor Cyan
Write-Host "  [ ] APP_ENV=production in .env"
Write-Host "  [ ] APP_DEBUG=false in .env"
Write-Host "  [ ] APP_KEY is set and unique"
Write-Host "  [ ] Database credentials configured"
Write-Host "  [ ] All migrations tested"
Write-Host "  [ ] Git commits are up to date"
Write-Host ""
Write-Host "🚀 Ready to deploy to Railway!" -ForegroundColor Green
Write-Host ""
