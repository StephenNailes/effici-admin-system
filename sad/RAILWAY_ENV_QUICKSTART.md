# Railway Environment Variables - Quick Reference

Copy and paste this into Railway's "Raw Editor" in the Variables tab.
Replace values marked with `<<<` as needed.

```env
# === APPLICATION ===
APP_NAME="EFFICI Admin System"
APP_ENV=production
APP_KEY=<<< PASTE YOUR KEY FROM: php artisan key:generate --show >>>
APP_DEBUG=false
APP_URL=<<< YOUR RAILWAY URL: https://your-app.up.railway.app >>>

# === DATABASE (Railway MySQL Plugin - DO NOT CHANGE) ===
DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

# === SESSION & CACHE ===
SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database

# === MAIL (Development/Testing) ===
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@effici.edu
MAIL_FROM_NAME="${APP_NAME}"

# === SECURITY ===
BCRYPT_ROUNDS=12

# === FILESYSTEM ===
FILESYSTEM_DISK=public

# === BROADCASTING (Not used, but required) ===
BROADCAST_CONNECTION=log
```

---

## ⚙️ How to Use

### Step 1: Generate APP_KEY
```powershell
cd c:\xampp\htdocs\effici-admin-system\sad
php artisan key:generate --show
```
Copy the output (e.g., `base64:abc123xyz...`)

### Step 2: Get Railway URL
1. Go to Railway project
2. Settings → Domains
3. Copy the Railway-provided URL (e.g., `https://yourapp.up.railway.app`)

### Step 3: Paste in Railway
1. Click your web service in Railway
2. Go to "Variables" tab
3. Click "Raw Editor" button (top right)
4. Paste the template above
5. Replace `<<<` sections with your values
6. Click outside the editor to save
7. Click "Deploy" button to apply

---

## 🔍 Variable Explanations

| Variable | Value | Purpose |
|----------|-------|---------|
| `APP_KEY` | base64:... | Encryption key (MUST be unique!) |
| `APP_URL` | https://... | Your Railway app URL |
| `DB_*` | ${{...}} | Railway template variables (auto-filled) |
| `MAIL_MAILER` | log | Emails written to logs (testing) |

---

## ✅ Verification

After setting variables, check deployment logs:

```powershell
railway logs
```

Look for:
- ✅ "Configuration cached successfully"
- ✅ "Routes cached successfully"
- ✅ "Migration table created successfully"
- ✅ No APP_KEY errors

---

## 🔄 Alternative Mail Providers

### Option 1: Resend (Free: 100 emails/day)
```env
MAIL_MAILER=resend
RESEND_API_KEY=<<< YOUR RESEND API KEY >>>
```

### Option 2: Keep log (Testing only)
```env
MAIL_MAILER=log
```
Emails appear in Railway logs (`railway logs`)

---

## 🆘 Common Issues

### "APP_KEY not set" error
➡️ Ensure APP_KEY starts with `base64:`
➡️ No spaces or quotes around the value

### "Database connection failed"
➡️ Ensure MySQL plugin is added to project
➡️ Database variables use `${{...}}` syntax (Railway templates)

### "SQLSTATE[HY000] [2002]"
➡️ Wait 30 seconds for MySQL to initialize
➡️ Check MySQL service is "Active" in Railway

### Changes not applying
➡️ Click "Deploy" button after changing variables
➡️ Wait for new deployment to complete

---

## 📝 Notes

- **Never commit .env to Git** (already in .gitignore)
- **APP_KEY must be unique** per environment (dev, production)
- **Database variables** are auto-managed by Railway
- **HTTPS** is automatic on Railway (no config needed)

---

**Need more help?**
- Full guide: `RAILWAY_ENV_SETUP.md`
- Deployment steps: `DEPLOYMENT_CHECKLIST.md`
