# EFFICI Admin System - AI Coding Assistant Instructions

## Project Architecture

This is a **Laravel-Inertia.js-React-TypeScript** application for an educational facility management system. The stack includes:
- **Backend**: Laravel 12 (PHP 8.2+) with SQLite database
- **Frontend**: React + TypeScript with Inertia.js for SPA behavior
- **Styling**: TailwindCSS with Framer Motion animations
- **Build Tools**: Vite with Laravel integration

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

Core entities: `User`, `ActivityPlan`, `EquipmentRequest`, `RequestApproval`

## Development Patterns

### Laravel-Inertia Integration
- **No API endpoints**: Use Inertia controllers returning `Inertia::render()` 
- **Shared data**: Global props set in `HandleInertiaRequests` middleware
- **Page routing**: React pages in `resources/js/pages/` auto-resolved by filename
- **Forms**: Use Inertia forms with `useForm()` hook, not Fetch API

### React/TypeScript Conventions
- **File naming**: PascalCase for components (`ActivityHistory.tsx`)
- **Layout pattern**: Wrap pages with `<MainLayout>` for consistent sidebar/navigation
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Icons**: Lucide React icons throughout (`import { Eye, Check } from "lucide-react"`)
- **Styling**: TailwindCSS utility classes with red theme (`text-red-600`, `bg-red-50`)

### Database & Models
- **Complex queries**: Use Query Builder in controllers (see `ApprovalController`)
- **Role-based data**: Filter by user role in controllers, not middleware
- **Status normalization**: Transform `under_revision` → `"Under Revision"` in frontend
- **Relationships**: Models use standard Laravel conventions but queries often use joins for performance

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
php artisan migrate
npm run dev          # Frontend dev server
php artisan serve    # Backend server (port 8000)
```

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
- **Activity files**: Associated with activity plans via `ActivityPlanFile` model

### Email System
- **Provider**: Mailtrap for testing (see `config/mail.php`)
- **Templates**: Laravel notification classes
- **Verification**: Built-in Laravel email verification flow

### Authentication
- **System**: Laravel Breeze with Inertia
- **Roles**: String-based (`student`, `admin_assistant`, `dean`)  
- **Middleware**: Standard Laravel auth, role checking in controllers
- **Registration**: Custom fields added to default Laravel registration

## Performance Notes

- **Database**: SQLite for development, consider PostgreSQL for production
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