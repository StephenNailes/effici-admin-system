# Railway Environment Variables Configuration

## Required Environment Variables

Set these in your Railway project settings under the "Variables" tab:

### Application Settings
```
APP_NAME="EFFICI Admin System"
APP_ENV=production
APP_KEY=                          # Generate with: php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://your-app.railway.app
```

### Database (Railway MySQL Plugin)
```
DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}           # Railway will auto-fill this
DB_PORT=${{MYSQLPORT}}           # Railway will auto-fill this
DB_DATABASE=${{MYSQLDATABASE}}   # Railway will auto-fill this
DB_USERNAME=${{MYSQLUSER}}       # Railway will auto-fill this
DB_PASSWORD=${{MYSQLPASSWORD}}   # Railway will auto-fill this
```

### Session & Cache
```
SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### Mail Configuration (Choose one provider)

#### Option 1: Resend (Recommended for free tier)
```
MAIL_MAILER=resend
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
RESEND_API_KEY=your_resend_api_key_here
```

#### Option 2: Log (Development/Testing only)
```
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Security (IMPORTANT!)
```
BCRYPT_ROUNDS=12
```

### Broadcasting (Optional - currently not used)
```
BROADCAST_CONNECTION=log
```

### Filesystem
```
FILESYSTEM_DISK=public
```

## How to Set Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Click "Raw Editor" for easier bulk paste
5. Copy and paste the variables above
6. Update values as needed (especially APP_KEY)
7. Click "Deploy" to apply changes

## Generating APP_KEY

Run locally:
```bash
cd sad
php artisan key:generate --show
```

Copy the output (e.g., `base64:abc123...`) and paste as APP_KEY value in Railway.

## Database Setup

Railway's MySQL plugin automatically creates and connects the database.
The variables `${{MYSQLHOST}}`, `${{MYSQLPORT}}`, etc. are Railway's template 
variables that auto-populate from the MySQL plugin.

## Mail Setup

### Using Resend (Free tier: 100 emails/day)
1. Sign up at https://resend.com
2. Create an API key
3. Set RESEND_API_KEY in Railway variables
4. Verify your sending domain

### Using Log (for testing)
- Emails will be written to logs
- Check logs with: `railway logs`

## Post-Deployment

After first deployment, check logs:
```bash
railway logs
```

Look for:
- ✅ Migration success
- ✅ Cache cleared
- ✅ Routes cached
- ❌ Any errors

## Testing Production

Test these URLs after deployment:
- https://your-app.railway.app (should redirect to /login)
- https://your-app.railway.app/login
- https://your-app.railway.app/register

## Important Notes

1. **Never commit .env file** - It's already in .gitignore
2. **APP_KEY must be unique** - Generate fresh for production
3. **APP_DEBUG=false** - Never enable in production
4. **Database credentials** - Use Railway's template variables
5. **Storage link** - Automatically created on deployment
