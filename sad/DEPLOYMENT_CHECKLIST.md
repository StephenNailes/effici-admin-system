# ✅ Railway Deployment Checklist - EFFICI Admin System

## Pre-Deployment (Local Setup)

### 1. Code Preparation
- [x] All migrations created (19 tables)
- [x] Priority system updated (low/medium/high)
- [x] Dashboard fixes applied
- [x] Database seeder ready
- [ ] **All changes committed to Git**
  ```powershell
  cd c:\xampp\htdocs\effici-admin-system\sad
  git status
  git add .
  git commit -m "Production ready: migrations and deployment config"
  ```

### 2. GitHub Repository
- [ ] **Repository created on GitHub** (if not exists)
- [ ] **Code pushed to main branch**
  ```powershell
  git remote -v  # Verify remote
  git push origin main
  ```

### 3. Generate Production APP_KEY
- [ ] **Run locally and save output:**
  ```powershell
  php artisan key:generate --show
  ```
  Copy this - you'll need it for Railway! Format: `base64:xxxxx...`

---

## Railway Setup (railway.app)

### 4. Create Account
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub account
- [ ] Verify email

### 5. Create New Project
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Authorize Railway to access your GitHub
- [ ] Select `effici-admin-system` repository
- [ ] Wait for initial detection (will fail - expected)

### 6. Configure Root Directory
- [ ] Click on your service
- [ ] Go to "Settings" tab
- [ ] Find "Root Directory"
- [ ] Set to: `sad`
- [ ] Save changes

### 7. Add MySQL Database
- [ ] In project dashboard, click "New"
- [ ] Select "Database"
- [ ] Choose "Add MySQL"
- [ ] Wait for database to provision (~30 seconds)
- [ ] Database auto-connects to your app

### 8. Set Environment Variables
- [ ] Click on your web service
- [ ] Go to "Variables" tab
- [ ] Click "Raw Editor"
- [ ] **Paste these variables (update values!):**

```env
APP_NAME="EFFICI Admin System"
APP_ENV=production
APP_KEY=base64:YOUR_KEY_FROM_STEP_3_HERE
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

- [ ] Replace `YOUR_KEY_FROM_STEP_3_HERE` with actual key
- [ ] Update `APP_URL` with your Railway domain (found in Settings > Domains)
- [ ] Click "Deploy" to apply

---

## Deployment & Testing

### 9. Monitor Deployment
- [ ] Go to "Deployments" tab
- [ ] Click on active deployment
- [ ] Click "View Logs"
- [ ] **Watch for these success messages:**
  - ✅ "Installing dependencies..."
  - ✅ "Building frontend assets..."
  - ✅ "Running migrations..."
  - ✅ "INFO  Server running on"

**Common errors and fixes:**
- ❌ "Root directory not found" → Check Settings > Root Directory = `sad`
- ❌ "APP_KEY not set" → Check Variables tab, ensure APP_KEY exists
- ❌ "Database connection failed" → Ensure MySQL plugin is added

### 10. Get Public URL
- [ ] Settings > Domains
- [ ] Copy the Railway domain (e.g., `https://yourapp.up.railway.app`)
- [ ] Test URL in browser

### 11. Verify Deployment
- [ ] **Homepage loads** (should redirect to /login)
- [ ] **Login page appears** (no errors)
- [ ] **Register page works**

---

## Post-Deployment Setup

### 12. Seed Database
- [ ] **Install Railway CLI** (if not installed):
  ```powershell
  npm install -g @railway/cli
  ```
- [ ] **Login to Railway:**
  ```powershell
  railway login
  ```
- [ ] **Link to project:**
  ```powershell
  railway link
  ```
  Select your EFFICI project
  
- [ ] **Run seeder:**
  ```powershell
  railway run php artisan db:seed
  ```
  ✅ Should create equipment categories and sample items

### 13. Create Admin Account

**Option 1: Via Registration + Database Edit**
- [ ] Go to `https://your-app.railway.app/register`
- [ ] Register with your email
- [ ] Go to Railway dashboard → MySQL service → "Data" tab
- [ ] Run this SQL (replace email):
  ```sql
  UPDATE users 
  SET role='admin_assistant', email_verified_at=NOW() 
  WHERE email='your-email@example.com';
  ```
- [ ] Create role holder record:
  ```sql
  INSERT INTO role_current_holders (role, user_id, assumed_at, created_at, updated_at)
  SELECT 'admin_assistant', id, NOW(), NOW(), NOW()
  FROM users WHERE email='your-email@example.com';
  ```

**Option 2: Via Railway CLI**
- [ ] Run tinker:
  ```powershell
  railway run php artisan tinker
  ```
- [ ] Create admin user:
  ```php
  $user = \App\Models\User::create([
      'first_name' => 'Admin',
      'middle_name' => 'A.',
      'last_name' => 'User',
      'email' => 'admin@example.com',
      'password' => bcrypt('SecurePassword123'),
      'role' => 'admin_assistant',
      'contact_number' => '09123456789',
      'address' => 'EFFICI Campus',
      'school_id' => 'ADMIN001',
      'email_verified_at' => now()
  ]);

  \App\Models\RoleCurrentHolder::create([
      'role' => 'admin_assistant',
      'user_id' => $user->id,
      'assumed_at' => now()
  ]);
  ```
- [ ] Press Ctrl+C to exit tinker

### 14. Full System Test
- [ ] **Login** with admin account
- [ ] **Create announcement** on dashboard
- [ ] **Create event** on dashboard
- [ ] **Check if announcements/events appear** on student dashboard
- [ ] **Register second user** (test student)
- [ ] **Login as student**
- [ ] **Submit equipment request**
- [ ] **Check notifications** (should appear)
- [ ] **Login as admin again**
- [ ] **Approve equipment request**
- [ ] **Verify approval workflow**

---

## Success Criteria

### ✅ Deployment Successful If:
- [x] No build errors in logs
- [ ] All migrations ran successfully (check logs)
- [ ] Homepage loads without errors
- [ ] Can register new users
- [ ] Can login
- [ ] Announcements visible on dashboard (2 most recent)
- [ ] Events visible on dashboard (2 most recent)
- [ ] Equipment request submission works
- [ ] Approval workflow functions
- [ ] Notifications appear
- [ ] File uploads work

### 📊 Expected Performance
- Page load: < 2 seconds
- API response: < 500ms
- No 500 errors
- CSS/JS assets load correctly

---

## Troubleshooting

### Build Failed
**Check:**
- [ ] Root directory set to `sad`
- [ ] `composer.json` and `package.json` exist
- [ ] Review build logs for specific error

**Fix:**
```powershell
# Test build locally
cd c:\xampp\htdocs\effici-admin-system\sad
composer install --optimize-autoloader --no-dev
npm ci
npm run build
```

### Migration Failed
**Check:**
- [ ] MySQL database is connected
- [ ] Database credentials in Variables
- [ ] Migration files exist

**Fix:**
```powershell
railway run php artisan migrate:status
railway run php artisan migrate --force
```

### 500 Error on Pages
**Check:**
- [ ] APP_KEY is set
- [ ] Database connection works
- [ ] Storage directory permissions

**Fix:**
```powershell
railway logs --tail  # Watch live logs
railway run php artisan config:clear
railway run php artisan cache:clear
```

### Assets Not Loading (CSS/JS)
**Check:**
- [ ] `npm run build` completed in deployment
- [ ] `public/build/` directory exists
- [ ] APP_URL is correct

**Fix:**
```powershell
# Force rebuild
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

---

## Monitoring (During 1-Week Period)

### Daily Checks
- [ ] Check Railway dashboard for uptime
- [ ] Monitor usage (should stay within $5 free tier)
- [ ] Test key features daily
- [ ] Review error logs if issues occur

### Access Logs
```powershell
railway logs              # Recent logs
railway logs --tail       # Live logs
railway logs --follow     # Follow logs
```

### Database Access
- Railway dashboard → MySQL → "Data" tab
- Or via CLI:
  ```powershell
  railway run mysql
  ```

---

## Cleanup After 1 Week

### Before Deletion
- [ ] Export important data (if any)
  ```powershell
  railway run php artisan db:seed --class=ExportDataSeeder
  ```
- [ ] Download logs for documentation
- [ ] Take screenshots of key features
- [ ] Document any issues encountered

### Delete Project
- [ ] Railway dashboard → Project Settings
- [ ] Scroll to "Danger Zone"
- [ ] Click "Delete Project"
- [ ] Confirm deletion
- [ ] Verify billing (should be ~$3-5 total)

---

## 🎯 Quick Reference

**Railway Dashboard:** https://railway.app/dashboard
**Your App URL:** https://_______________________.up.railway.app
**Admin Email:** _______________________
**Admin Password:** _______________________

**Important Commands:**
```powershell
# View logs
railway logs

# Run artisan
railway run php artisan migrate:status

# Database
railway run mysql

# Tinker
railway run php artisan tinker
```

---

## 📞 Support

**Stuck? Check:**
1. `DEPLOYMENT_GUIDE.md` - Detailed guide
2. `RAILWAY_ENV_SETUP.md` - Environment variables
3. `PRODUCTION_READY_SUMMARY.md` - System overview
4. Railway logs: `railway logs --tail`

**Resources:**
- Railway Docs: https://docs.railway.app
- Laravel Deployment: https://laravel.com/docs/deployment
- Railway Community: https://help.railway.app

---

**Last Updated:** January 2025
**Estimated Time:** 15-30 minutes
**Difficulty:** Beginner-Friendly ✅
