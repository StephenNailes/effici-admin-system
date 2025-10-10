<div align="center">

# EFFICI Admin System

Three-role approval and equipment management platform for educational institutions.

</div>

## Overview

EFFICI Admin System streamlines how students, admin assistants, and deans collaborate on campus activity plans and equipment logistics. The application centralizes multi-stage approvals, inventory tracking, announcements, and notifications within a modern Laravel + Inertia.js single-page experience.

### Core capabilities

- Capture activity plans and equipment requests with supporting files and digital signatures.
- Route requests through admin assistant and dean approval stages with status visibility.
- Track inventory, equipment categories, and availability for checkout/return workflows.
- Publish announcements and events with rich media, comments, and reactions.
- Notify users about approvals, role handovers, and other critical updates.

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Backend      | Laravel 12 (PHP 8.2+), MySQL 8+/MariaDB |
| SPA bridge   | Inertia.js 2.0 |
| Frontend     | React 19 + TypeScript, TailwindCSS 4, Framer Motion |
| Tooling      | Vite 7, ESLint, Prettier, Pest PHP |

> ℹ️ The project intentionally ships without any server-side PDF generation. Use the in-app preview with the browser's “Print to PDF” feature when a PDF export is required.

## Prerequisites

- PHP 8.2+ with necessary extensions (`openssl`, `pdo_mysql`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `curl`).
- Composer 2.6+ for dependency management.
- Node.js 20+ and npm 10+ (or a compatible Node LTS release).
- MySQL 8+ or MariaDB 10.6+ instance. Default dev setup targets XAMPP/MySQL.
- Optional: Redis (for queues) if you plan to replace the default sync queue driver.

## Quick start

```powershell
# clone the repository and enter the project directory
git clone <your-fork-url> effici-admin-system
cd effici-admin-system\sad

# install backend and frontend dependencies
composer install
npm install

# configure environment
Copy-Item .env.example .env
php artisan key:generate

# update .env with database credentials (defaults assume MySQL on localhost)
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=sadproject_improved
# DB_USERNAME=root
# DB_PASSWORD=

# run database migrations
php artisan migrate

# launch the full dev environment (PHP server, queue listener, Vite)
composer run dev
```

The Vite dev server runs on port `5173`, and the Laravel application is served on `http://127.0.0.1:8000` by default. Sign in with seeded users or create accounts through the UI.

## Development workflow

- **Single services**
	- Laravel server only: `php artisan serve`
	- Vite dev server only: `npm run dev`
	- Queue worker: `php artisan queue:listen --tries=1`
- **Full stack**: `composer run dev` (recommended) starts PHP, queue listener, and Vite via `concurrently`.
- **SSR preview**: `composer run dev:ssr` builds the SSR bundle and starts the SSR server alongside dev services.

### Useful npm scripts

| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint with React & Tailwind plugins (auto-fixes enabled) |
| `npm run format` | Format `resources/` with Prettier + Tailwind sort |
| `npm run types` | Type-check the React/TypeScript codebase |
| `npm run build` | Production build for the SPA |
| `npm run build:ssr` | Client + SSR bundle build |

### Useful Composer scripts

| Command | Purpose |
|---------|---------|
| `composer run dev` | Run Laravel server, queue worker, and Vite together |
| `composer run dev:ssr` | Same as above with SSR + log viewer |
| `composer run test` | Clear config cache and execute the Laravel test suite |

## Testing & quality

```powershell
# run backend feature/unit tests (Pest)
composer run test

# run frontend linting and type checks
npm run lint
npm run types
```

Add feature coverage using Pest tests in `tests/Feature` or `tests/Unit`, and prefer Inertia form testing patterns for request workflows.

## Database & data management

- Create additional migrations with `php artisan make:migration <name>`; store them in `database/migrations/`.
- Seed data via custom seeders in `database/seeders/` and `php artisan db:seed`.
- SQLite development is supported out of the box (`database/database.sqlite`), but MySQL is the canonical environment for approvals and inventory.

## Environment notes

- Mail uses the `log` driver in development. Configure `.env` for SES, Postmark, or Resend when deploying.
- Background jobs default to the `sync` driver; switch to `database` or `redis` queues for production reliability.
- File uploads are stored under `storage/app/public` and exposed via the `public/storage` symlink (`php artisan storage:link`).

## Production build & deployment

```powershell
# run on the build server
npm run build

# on the application server
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan queue:restart
```

- Serve the Laravel app via PHP-FPM/Apache/Nginx and point your document root to `public/`.
- Configure a process manager (e.g., Supervisor) for queue workers and, if needed, the SSR service (`php artisan inertia:start-ssr`).
- Ensure `.env` mail and storage credentials are set; no PDF renderer is required.

## Project structure (highlights)

```
sad/
├── app/
│   ├── Http/Controllers/   # Inertia controllers and request orchestration
│   ├── Models/              # Eloquent models for approvals, inventory, social feed
│   └── Services/            # Domain services (handover, notifications)
├── resources/js/
│   ├── pages/               # Inertia-mapped React pages
│   ├── layouts/             # Shared layouts (sidebar, navigation)
│   └── components/          # Reusable UI, Tailwind + Framer Motion
├── database/
│   ├── migrations/          # Schema definitions
│   └── seeders/             # Data seeding
├── routes/web.php           # All web + Inertia routes (no API routes)
├── package.json             # Frontend tooling scripts
└── composer.json            # Laravel dependencies & Composer scripts
```

## Domain model snapshot

- **ActivityPlan**: Activity lifecycle (`pending`, `under_revision`, `approved`, `completed`).
- **EquipmentRequest**: Inventory checkout pipeline (`pending`, `under_revision`, `approved`, `completed`, `denied`, `cancelled`, `checked_out`, `returned`, `overdue`).
- **RequestApproval**: Tracks approver role (`admin_assistant`, `dean`) for activity plans or equipment requests.
- **Inventory**: `Equipment`, `EquipmentCategory`, `EquipmentRequestItem` manage quantities and consumables.
- **Social**: `Announcement`, `Event`, polymorphic `Comment`, `Like`, and `PostImage` records.

## Troubleshooting

- **Blank screen after login**: Ensure the Vite dev server is running (`npm run dev`) and SSL certificates are trusted if using HTTPS.
- **Queue jobs stuck**: Run `php artisan queue:work` or switch to `queue:listen` for auto-reload during development.
- **Tailwind styles not updating**: Restart Vite after editing Tailwind config or upgrading plugins.
- **Database connection errors**: Confirm `.env` credentials and verify MySQL is running (`mysqladmin ping`).

## Contributing

1. Fork the repository and create a feature branch (`git checkout -b feature/your-feature`).
2. Run the full test suite (`composer run test`, `npm run lint`, `npm run types`).
3. Submit a pull request describing your changes, screenshots (UI), and testing notes.

## License

This project is released under the MIT License. See `LICENSE` for details.
