# Docker Deployment Guide

## Quick Start

### 1. Setup Environment
```bash
# Copy the example env file
cp .env.docker.example .env.docker

# Edit .env.docker with your values
# - Set secure database passwords
# - Update UIC API credentials if needed
```

### 2. Build and Run
```bash
# Build the Docker image
docker-compose build

# Start the containers
docker-compose up -d

# Run migrations and create storage link
docker-compose exec app php artisan migrate --force
docker-compose exec app php artisan storage:link
```

### 3. Access Application
- Application: http://localhost:8080
- Database: localhost:3306 (from host machine)

## Production Deployment

### Railway Deployment

1. **Create `railway.toml`:**
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "php artisan migrate --force && /usr/bin/supervisord -c /etc/supervisord.conf"
healthcheckPath = "/health"
restartPolicyType = "on-failure"
```

2. **Set Environment Variables in Railway:**
```bash
APP_NAME=EfficiAdmin
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:T9ck26iheJWk7rVlcD6fPRDmv+DxLYADtMby0QuTors=
APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Database (from Railway MySQL plugin)
DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

# Session, Cache, Queue
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# UIC API
UIC_API_BASE_URL=https://api.uic.edu.ph/api/v2
UIC_API_CLIENT_ID=your_client_id
UIC_API_CLIENT_SECRET=your_client_secret

# Assets
ASSET_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
VITE_APP_NAME=EfficiAdmin

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error
```

3. **Deploy:**
   - Push to GitHub
   - Railway will auto-detect Dockerfile and deploy

### Other Cloud Platforms

#### Google Cloud Run
```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/effici-admin
gcloud run deploy effici-admin --image gcr.io/PROJECT_ID/effici-admin --port 8080
```

#### AWS ECS/Fargate
```bash
# Build and push to ECR
docker build -t effici-admin .
docker tag effici-admin:latest AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/effici-admin:latest
docker push AWS_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/effici-admin:latest
```

#### DigitalOcean App Platform
- Connect GitHub repository
- Set Dockerfile path: `Dockerfile`
- Set port: 8080
- Add environment variables

## Container Details

### Services
- **Nginx**: Web server on port 8080
- **PHP-FPM**: PHP application runtime
- **Queue Worker**: Laravel queue processing (Supervisor managed)

### Volumes
- `storage`: Persistent storage for uploads/logs
- `mysql_data`: Database data persistence

### Health Check
- Endpoint: `/health`
- Checks every 30 seconds
- Application ready after ~40 seconds

## Common Commands

```bash
# View logs
docker-compose logs -f app

# Run artisan commands
docker-compose exec app php artisan [command]

# Access container shell
docker-compose exec app sh

# Rebuild after code changes
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Database backup
docker-compose exec db mysqldump -u effici_user -p effici_admin > backup.sql

# Stop and remove everything
docker-compose down -v
```

## Performance Optimization

The Docker image includes:
- ✅ PHP OPcache enabled
- ✅ Nginx gzip compression
- ✅ Asset caching (1 year)
- ✅ Laravel config/route/view caching
- ✅ Multi-stage build (smaller image)
- ✅ Alpine Linux (minimal footprint)

## Troubleshooting

### Container won't start
```bash
docker-compose logs app
docker-compose exec app php artisan config:clear
```

### Database connection issues
```bash
# Check database is ready
docker-compose exec db mysqladmin ping -h localhost
```

### Permission issues
```bash
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chmod -R 755 /var/www/html/storage
```

## Security Notes

- Never commit `.env.docker` with real credentials
- Use strong database passwords in production
- Keep `APP_DEBUG=false` in production
- Regularly update base images for security patches
