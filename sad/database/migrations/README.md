# Database Migration Guide

This directory contains Laravel migration files generated from the `sadproject_improved.sql` database dump.

## What Was Created

### 1. Cleaned SQL Structure File
- **Location**: `database/schema/sadproject_structure.sql`
- **Purpose**: Reference file containing only table structures with equipment seed data
- **Note**: This is NOT meant to be imported directly. Use Laravel migrations instead.

### 2. Migration Files Created

The following migration files were created in chronological order based on table dependencies:

#### Core Laravel Tables
- `0001_01_01_000000_create_users_table.php` - Users, password resets, and sessions
- `0001_01_01_000001_create_cache_table.php` - Cache and cache locks
- `0001_01_01_000002_create_jobs_table.php` - Queue jobs, job batches, and failed jobs

#### Application Tables (in dependency order)
1. `2024_01_01_000000_create_equipment_tables.php` - Equipment categories and equipment
2. `2024_02_01_000000_create_activity_plans_table.php` - Activity plans, files, and signatures
3. `2024_03_01_000000_create_budget_requests_table.php` - Budget requests, files, and signatures
4. `2024_04_01_000000_create_equipment_requests_table.php` - Equipment requests and items
5. `2024_05_01_000000_create_request_approvals_table.php` - Approval workflow tracking
6. `2024_06_01_000000_create_notifications_table.php` - User notifications
7. `2024_07_01_000000_create_announcements_and_events_table.php` - Announcements and events
8. `2024_08_01_000000_create_comments_likes_post_images_table.php` - Social features
9. `2024_09_01_000000_create_role_update_requests_table.php` - Role change requests
10. `2024_10_01_000000_create_pdf_comments_table.php` - PDF annotation comments

### 3. Seeder File
- **Location**: `database/seeders/EquipmentSeeder.php`
- **Purpose**: Seeds initial equipment categories and equipment data

## How to Use

### Fresh Installation

If you're setting up the database from scratch:

```bash
# 1. Configure your .env database connection
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sadproject_improved
DB_USERNAME=root
DB_PASSWORD=

# 2. Create the database
# Via phpMyAdmin or MySQL CLI:
# CREATE DATABASE sadproject_improved;

# 3. Run migrations
php artisan migrate

# 4. Seed equipment data
php artisan db:seed --class=EquipmentSeeder
```

### Refreshing Database (Development)

To reset and rebuild the entire database:

```bash
# This will DROP all tables and recreate them
php artisan migrate:fresh

# Then seed equipment data
php artisan db:seed --class=EquipmentSeeder
```

### Rollback Migrations

To undo the last batch of migrations:

```bash
php artisan migrate:rollback
```

To rollback all migrations:

```bash
php artisan migrate:reset
```

## Important Notes

### Existing Migration Files

You already have migration files in your `database/migrations` directory dated from October 2025. These are modification migrations that:
- Add columns to existing tables
- Update enum values
- Restructure certain tables

**Decision Point**: You should:

1. **Option A - Fresh Start (Recommended for new environments)**
   - Delete all existing migration files
   - Use only the new base migration files provided
   - This gives you a clean foundation

2. **Option B - Keep Existing (If you have production data)**
   - Keep the existing migrations
   - The new migrations are numbered to run BEFORE your existing ones
   - Your existing migrations may fail if they reference tables differently

### Table Structure Differences

The migration files match your current SQL schema exactly, including:
- `equipment_requests.id` and `equipment_request_items.id` use `INT` (via `increments()`)
- `request_approvals.id` uses `BIGINT` 
- All timestamp columns use Laravel conventions with `useCurrent()` and `useCurrentOnUpdate()`
- Foreign key constraints match your current schema
- Indexes and unique constraints are preserved

### Equipment Data

The equipment seeder includes:
- 3 equipment categories (Audio, Visual, Accessories)
- 4 equipment items (TV, Speaker, Projector, HDMI Cable)

To modify this data, edit `database/seeders/EquipmentSeeder.php`.

## Testing Your Migrations

After running migrations, verify the structure:

```bash
# Check tables were created
php artisan db:show

# Check specific table structure
php artisan db:table users
php artisan db:table equipment

# Run a quick test query
php artisan tinker
>>> DB::table('equipment_categories')->count();
>>> DB::table('equipment')->count();
```

## Troubleshooting

### Foreign Key Errors

If you get foreign key constraint errors:
1. Ensure migrations run in the correct order (they're dated to ensure this)
2. Check that referenced tables exist before dependent tables are created

### Table Already Exists

If you see "table already exists" errors:
```bash
# Drop all tables and start fresh
php artisan migrate:fresh
```

### UTF8MB4 Character Set Issues

If you have character set issues, ensure your `config/database.php` has:
```php
'charset' => 'utf8mb4',
'collation' => 'utf8mb4_unicode_ci',
```

## Next Steps

After successfully migrating:

1. **Create Admin User**: Use your existing seeders or create manually
2. **Test Equipment**: Verify equipment data loaded correctly
3. **Configure Storage**: Run `php artisan storage:link` for file uploads
4. **Run Application**: Start your dev server with `php artisan serve`

## Reference

Original SQL dump: `sadproject_improved.sql`
Clean structure: `database/schema/sadproject_structure.sql`
