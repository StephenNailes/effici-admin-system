# EFFICI Admin System - Production Deployment Guide

## 🚀 Quick Deployment to Railway (1-Week Production)

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Git installed locally

### Step 1: Prepare Your Code

1. **Commit all changes:**
```powershell
cd c:\xampp\htdocs\effici-admin-system\sad
git add .
git commit -m "Production-ready: migrations, config, and optimizations"
```

2. **Push to GitHub:**
```powershell
git push origin main
```

### Step 2: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account if not already connected
5. Select your `effici-admin-system` repository
6. Railway will detect the Laravel app

### Step 3: Configure Root Directory

Since your Laravel app is in the `sad/` subdirectory:

1. In Railway project settings, go to "Settings" tab
2. Set **Root Directory** to: `sad`
3. Save changes

### Step 4: Add MySQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add MySQL"
3. Railway will automatically create database and connection variables
4. No manual configuration needed - template variables auto-populate

### Step 5: Set Environment Variables

1. Click on your web service
2. Go to "Variables" tab
3. Click "Raw Editor"
4. Copy and paste from `RAILWAY_ENV_SETUP.md` (adjust values):

```env
APP_NAME="EFFICI Admin System"
APP_ENV=production
APP_KEY=base64:YOUR_GENERATED_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-app-name.up.railway.app

DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@effici.edu
MAIL_FROM_NAME="${APP_NAME}"

BCRYPT_ROUNDS=12
FILESYSTEM_DISK=public
BROADCAST_CONNECTION=log
```

5. **Generate APP_KEY** locally:
```powershell
cd c:\xampp\htdocs\effici-admin-system\sad
php artisan key:generate --show
```
Copy the output and replace `YOUR_GENERATED_KEY_HERE`

6. Click "Deploy" to apply variables

### Step 6: Deploy

Railway will automatically:
- Install PHP dependencies (composer)
- Install Node dependencies (npm)
- Build frontend assets (Vite)
- Run migrations
- Cache configurations
- Start the web server

Monitor deployment in the "Deployments" tab.

### Step 7: Verify Deployment

1. **Check build logs** for errors
2. **Get your public URL** from Railway dashboard
3. **Test key pages:**
   - Homepage: `https://your-app.railway.app`
   - Login: `https://your-app.railway.app/login`
   - Register: `https://your-app.railway.app/register`

### Step 8: Seed Initial Data (Optional)

If you want sample equipment and admin users:

```powershell
# Using Railway CLI
railway run php artisan db:seed
```

Or via Railway dashboard:
1. Go to "Settings" → "Deploy"
2. Under "Custom Start Command", temporarily add:
   ```
   php artisan db:seed && vendor/bin/heroku-php-apache2 public/
   ```
3. After deployment, revert to original start command

### Step 9: Create Admin Accounts

**Option A: Via Seeder (Development mode only)**
The seeder creates:
- `admin@effici.edu` / password: `password`
- `dean@effici.edu` / password: `password`

**Option B: Manual Registration**
1. Register normally at `/register`
2. Access database via Railway dashboard
3. Update user role manually:
```sql
UPDATE users SET role='admin_assistant' WHERE email='your-email@example.com';
UPDATE users SET email_verified_at=NOW() WHERE email='your-email@example.com';
```

## 📊 Monitoring

### View Logs
```powershell
railway logs
```

Or via Railway dashboard → "Deployments" → Click deployment → "View Logs"

### Check Database
1. Railway dashboard → MySQL service
2. Click "Data" tab
3. Or use "Connect" to get CLI credentials

### Performance Metrics
Railway dashboard shows:
- CPU usage
- Memory usage
- Request count
- Response times

## 🔒 Security Checklist

- [x] `APP_DEBUG=false` in production
- [x] `APP_ENV=production`
- [x] Unique `APP_KEY` generated
- [x] Database credentials secure (auto-managed by Railway)
- [x] HTTPS enforced (automatic on Railway)
- [x] Cache optimizations enabled
- [x] No `.env` in repository

## 🛠️ Troubleshooting

### Build Fails
**Check:**
- Root directory is set to `sad`
- All dependencies in `composer.json` and `package.json`
- Build logs for specific errors

**Common fixes:**
```powershell
# Locally test production build
composer install --optimize-autoloader --no-dev
npm ci
npm run build
```

### Migration Errors
**Check:**
- Database plugin is connected
- Database variables are set correctly
- Migration files exist in `database/migrations/`

**Fix:**
```powershell
# Via Railway CLI
railway run php artisan migrate:status
railway run php artisan migrate --force
```

### 500 Errors
**Check logs:**
```powershell
railway logs --tail
```

**Common causes:**
- Missing `APP_KEY`
- Database connection issues
- Permission errors (storage/cache)

**Fix:**
```powershell
railway run php artisan config:clear
railway run php artisan cache:clear
railway run php artisan route:clear
```

### Static Assets Not Loading
**Check:**
- `npm run build` completed successfully
- `public/build/` directory exists in deployment
- Asset URLs in blade/React components

**Fix:**
Redeploy after verifying local build:
```powershell
npm run build
git add public/build/
git commit -m "Add built assets"
git push
```

## 💰 Cost Estimation (1-Week Deployment)

Railway free tier includes:
- $5 usage credit per month
- Automatic sleep after inactivity (Hobby plan required for 24/7)

**Estimated costs for 1-week:**
- Web service: ~$2-3
- MySQL database: ~$1-2
- **Total: ~$3-5** (within free tier)

**To minimize costs:**
1. Use free tier credits
2. Delete services after 1 week
3. Monitor usage in Railway dashboard

## 🗑️ Cleanup After 1 Week

1. Go to Railway dashboard
2. Click on your project
3. Project Settings → "Danger" tab
4. Click "Delete Project"
5. Confirm deletion

**Before deletion:**
- Export important data
- Download logs if needed
- Take screenshots for documentation

## 📝 Post-Deployment Tasks

- [ ] Test all user roles (student, admin_assistant, dean)
- [ ] Test equipment request workflow
- [ ] Test activity plan submission
- [ ] Test approval system
- [ ] Test notifications
- [ ] Test announcements/events
- [ ] Verify email notifications (if using real mailer)
- [ ] Check file uploads work
- [ ] Test role handover system

## 🆘 Support

**Railway Documentation:**
- https://docs.railway.app

**Laravel Deployment:**
- https://laravel.com/docs/deployment

**Issues:**
- Check Railway community: https://help.railway.app
- Review logs: `railway logs`
- Database console: Railway dashboard → MySQL → "Data"

---

**Deployment Date:** ___________
**Railway URL:** ___________
**Deployment Duration:** 1 week (until ___________)
**Estimated Cost:** $3-5
