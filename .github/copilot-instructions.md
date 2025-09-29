# EFFICI Admin System - AI Coding Assistant Instructions

## Project Architecture

This is a **Laravel-Inertia.js-React-TypeScript** application for an educational facility management system. The stack includes:
- **Backend**: Laravel 12 (PHP 8.2+) with MySQL 8+/MariaDB database
- **Frontend**: React 19 + TypeScript with Inertia.js for SPA behavior
- **Styling**: TailwindCSS v4 with Framer Motion animations
- **Build Tools**: Vite 7 with Laravel integration (SSR prepared)

### Key Directory Structure
```
sad/                           # Main application directory
├── app/Models/               # Laravel Eloquent models
├── app/Http/Controllers/     # Backend controllers 
├── resources/js/pages/       # React pages (mapped by Inertia routing)
├── resources/js/layouts/     # React layout components
├── resources/js/components/  # Shared React components
├── routes/web.php           # All routes (no separate api.php used)
└── database/migrations/     # Database schema
```

## Business Domain

**Three-role approval system** for academic activities and equipment:
- **Students**: Submit activity plans and equipment requests
- **Admin Assistants**: Initial review and approval
- **Deans**: Final approval authority

Core entities (from current schema/models):
- Requests & approvals: `ActivityPlan`, `EquipmentRequest`, `RequestApproval`, `EquipmentRequestItem`
- Inventory: `Equipment`, `EquipmentCategory`
- Users & communication: `User`, `Notification`
- Social/content: `Announcement`, `Event`, `Comment` (polymorphic), `Like` (polymorphic), `PostImage` (polymorphic images)

Status enums used in DB:
- `ActivityPlan.status`: `pending`, `under_revision`, `approved`, `completed`
- `EquipmentRequest.status`: `pending`, `under_revision`, `approved`, `completed`, `denied`, `cancelled`, `checked_out`, `returned`, `overdue`
- `RequestApproval.status`: `pending`, `approved`, `revision_requested`

RequestApproval scope:
- `request_type`: `equipment` | `activity_plan`
- `approver_role`: `admin_assistant` | `dean`

## Development Patterns

### Laravel-Inertia Integration
- **No API endpoints**: Use Inertia controllers returning `Inertia::render()` 
- **Shared data**: Global props set in `HandleInertiaRequests` middleware
- **Page routing**: React pages in `resources/js/pages/` auto-resolved by filename
- **Forms**: Use Inertia forms with `useForm()` hook, not Fetch API

SSR:
- SSR entry is configured (`resources/js/ssr.tsx`) and Vite SSR build is wired. Use only if needed; most flows are CSR.

### React/TypeScript Conventions
- **File naming**: PascalCase for components (`ActivityHistory.tsx`)
- **Layout pattern**: Wrap pages with `<MainLayout>` for consistent sidebar/navigation
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Icons**: Lucide React icons throughout (`import { Eye, Check } from "lucide-react"`)
- **Styling**: TailwindCSS utility classes with red theme (`text-red-600`, `bg-red-50`)

### Database & Models
- **Complex queries**: Use Query Builder in controllers (see `ApprovalController`)
- **Role-based data**: Filter by user role in controllers, not middleware
- **Status normalization**: Map enum values to human labels in the UI (examples):
	- `under_revision` → "Under Revision"
	- `checked_out` → "Checked Out"
	- `returned` → "Returned"
	- `overdue` → "Overdue"
	- `cancelled` → "Cancelled"
	- `denied` → "Denied"
- **Relationships**:
	- Polymorphic: `Comment`, `Like`, and `PostImage` attach to `Announcement` and `Event` via morphs
	- Approvals: `RequestApproval` targets either `EquipmentRequest` or `ActivityPlan` by `(request_type, request_id)` and tracks `approver_role`
- **Schema notes**:
	- IDs: Most tables use `bigIncrements`, but `equipment_requests` and `equipment_request_items` use `increments` (int). Be careful with joins/casts.
	- The `equipment` table includes `category_id`, `is_consumable`, `total_quantity`, `is_active`. The current `Equipment` model does not expose all these fields for mass-assignment and mentions `available_quantity` which isn't in the migration.

### State Management
- **No global state library**: Use React state + Inertia shared data
- **API calls**: Rare - prefer Inertia form submissions and page visits
- **Real-time**: Not implemented (no WebSockets/polling)

## Critical Workflows

### Development Setup
```bash
cd sad/
composer install
npm install
cp .env.example .env
php artisan key:generate

# Configure MySQL in .env (XAMPP defaults shown)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=sadproject_improved
# DB_USERNAME=root
# DB_PASSWORD=

# Optionally create the DB (adjust credentials if needed)
# mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS sadproject_improved CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

php artisan migrate
npm run dev          # Frontend dev server
php artisan serve    # Backend server (port 8000)
```

Convenience scripts:
- `composer run dev` starts PHP server, queue listener, and Vite together (uses `concurrently`).
- `composer run dev:ssr` adds SSR server (`php artisan inertia:start-ssr`) alongside.

### Common Tasks
- **New page**: Create in `resources/js/pages/` + add route in `web.php`
- **New model**: Use `php artisan make:model` + migration
- **Database changes**: Always create migration, never edit directly
- **Styling**: Use existing TailwindCSS patterns, maintain red color scheme
- **Forms**: Use Inertia `useForm()`, handle validation in Laravel controllers

### Code Quality
- **TypeScript**: Configured with strict mode, use proper typing
- **Formatting**: Prettier + ESLint configured (`npm run lint`, `npm run format`)
- **Testing**: Pest PHP configured but minimal test coverage

## Integration Points

### File Uploads
- **Storage**: `public/storage` symlink for user uploads
- **Profile pictures**: Handled via `ProfileController` with validation
- **Activity files**: Associated with activity plans via `ActivityPlanFile`
- **Post images**: Use `PostImage` polymorphic model for `Announcement` and `Event` images. Files are deleted when the image model is deleted.

### Email System
- **Default**: `log` mailer in development (emails are written to logs)
- **Providers configured**: SES, Postmark, Resend (see `config/mail.php` and `config/services.php`). Slack notifications config present.
- **Verification**: Built-in Laravel email verification flow (user model implements `MustVerifyEmail`).

### Authentication
- **System**: Laravel authentication with Inertia pages (email verification enabled)
- **Roles**: String-based (`student`, `admin_assistant`, `dean`)  
- **Middleware**: Standard Laravel auth; role checks are enforced in controllers (not middleware)
- **Registration**: Custom profile fields stored on `users` (name parts, contact, address, school ID)

## Performance Notes

- **Database**: MySQL 8+/MariaDB for development (XAMPP). Consider PostgreSQL for production if preferred.
- **Assets**: Vite handles hot reload and production builds
- **Caching**: Not extensively configured, uses Laravel defaults
- **Pagination**: Basic implementation, could be enhanced for large datasets

## When Editing Code

1. **Always check role-based access** in controllers before data operations
2. **Maintain consistent error handling** - use Inertia error pages
3. **Follow existing animation patterns** with Framer Motion
4. **Keep TypeScript strict** - don't use `any` types
5. **Test role switching** when modifying approval workflows
6. **Preserve the red color theme** in UI changes

Additional guidance tied to current schema:
- Normalize and display request statuses using the enums above; avoid introducing new ad-hoc status strings.
- When implementing approvals, create/read `RequestApproval` records keyed by `(request_type, request_id)` and advance per `approver_role`.
- Use polymorphic helpers for comments/likes/images to keep the content feed consistent between announcements and events.