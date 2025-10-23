# EFFICI Admin System - AI Coding Assistant Instructions

## Project Architecture

This is a **Laravel-Inertia.js-React-TypeScript** application for an educational facility management system (EFFICI Admin System). The stack includes:
- **Backend**: Laravel 12 (PHP 8.2+) with MariaDB 10.4.32 database (XAMPP environment)
- **Frontend**: React 19 + TypeScript with Inertia.js for SPA behavior
- **Styling**: TailwindCSS v4 with Framer Motion animations, shadcn/ui components (Radix UI primitives)
- **Build Tools**: Vite 7 with Laravel integration (SSR configured but disabled by default)
- **PDF Generation**: Spatie Browsershot with Puppeteer for activity plan PDFs
- **Email**: Resend (configured) with log mailer for development

### Key Directory Structure
```
sad/                           # Main application directory
├── app/
│   ├── Models/               # Eloquent models (19 models)
│   ├── Http/
│   │   ├── Controllers/      # Backend controllers (23+ controllers)
│   │   └── Middleware/       # Custom middleware (EnsureRole, HandleInertiaRequests)
│   ├── Services/             # Business logic services (HandoverService, NotificationService, PdfSignatureService)
│   └── Mail/                 # Mailable classes (HandoverInvitation, RoleUpdateApproved)
├── resources/
│   ├── js/
│   │   ├── pages/            # React pages organized by role (student/, admin_assistant/, dean/, Auth/)
│   │   ├── layouts/          # Layout components (mainlayout.tsx)
│   │   ├── components/       # Shared React components (24+ components)
│   │   └── lib/              # Utility functions (utils.ts, csrf.ts)
│   └── css/                  # Global styles
├── routes/web.php            # All routes (no separate api.php)
├── database/
│   ├── migrations/           # Database schema migrations
│   └── seeders/              # Database seeders (AdminSeeder, RoleCurrentHoldersSeeder)
├── public/
│   ├── storage/              # Symlinked storage for uploads
│   └── build/                # Production assets
└── config/                   # Configuration files
```

## Business Domain

**Multi-role approval system** for academic activities and equipment in an educational facility:

### User Roles
- **Students** (`student`): Basic students who can submit equipment requests
- **Student Officers** (`student_officer`): Officers who can create activity plans and equipment requests
- **Admin Assistants** (`admin_assistant`): Initial review and approval, equipment management
- **Deans** (`dean`): Final approval authority for activity plans
- **Inactive roles**: `inactive_admin_assistant`, `inactive_dean` (revoked access after handover)

### Core Entities (19 Models)
**Requests & Approvals:**
- `ActivityPlan`: Student officer-created event plans requiring dual approval
- `EquipmentRequest`, `EquipmentRequestItem`: Equipment borrowing requests
- `RequestApproval`: Tracks approval workflow (admin assistant → dean)

**Role Management:**
- `RoleCurrentHolder`: Tracks who currently holds admin_assistant and dean roles
- `RoleHandoverLog`: Audit trail of role transfers
- `RoleUpdateRequest`: Student requests to become student_officer
- `InvitationToken`: Email-based role handover invitations

**Inventory:**
- `Equipment`, `EquipmentCategory`: Equipment catalog and categories

**Users & Communication:**
- `User`: All system users with role-based access
- `Notification`: In-app notification system with priority levels

**Social/Content:**
- `Announcement`, `Event`: Admin/dean-posted content
- `Comment` (polymorphic): Comments on events/announcements
- `Like` (polymorphic): Likes on events/announcements  
- `PostImage` (polymorphic): Images attached to events/announcements

**Activity Plan Documents:**
- `ActivityPlanFile`: Uploaded/generated PDF files for activity plans
- `ActivityPlanDeanSignature`: Dean digital signatures on approved plans

### Status Enums
- `ActivityPlan.status`: `draft`, `pending`, `under_revision`, `approved`, `completed`
- `EquipmentRequest.status`: `pending`, `under_revision`, `approved`, `completed`, `denied`, `cancelled`, `checked_out`, `returned`, `overdue`
- `RequestApproval.status`: `pending`, `approved`, `revision_requested`
- `RoleUpdateRequest.status`: `pending`, `approved`, `rejected`

### Approval Workflow
- `RequestApproval.request_type`: `equipment` | `activity_plan`
- `RequestApproval.approver_role`: `admin_assistant` | `dean`
- Activity plans require sequential approval: admin_assistant → dean
- Equipment requests require only admin_assistant approval

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

# Configure MySQL/MariaDB in .env (XAMPP defaults)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sadproject_improved
DB_USERNAME=root
DB_PASSWORD=

# Session must use database driver (required for Inertia)
SESSION_DRIVER=database

# Create database (via phpMyAdmin or mysql CLI)
# Or import: sadproject_improved.sql

php artisan migrate
php artisan storage:link  # Link public/storage to storage/app/public

# Development servers
npm run dev              # Frontend dev server (Vite)
php artisan serve        # Backend server (port 8000)
```

**Convenience scripts:**
- `composer run dev` - Starts PHP server, queue listener, and Vite concurrently (uses `concurrently`)
- `composer run dev:ssr` - Adds SSR server (`php artisan inertia:start-ssr`) + Pail logs alongside dev servers
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run types` - TypeScript type checking (no emit)

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
- **Roles**: String-based (`student`, `admin_assistant`, `dean`, `student_officer`, etc.)  
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