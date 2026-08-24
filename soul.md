# Modoo ERP — Project Soul

## Project Identity

- **Name**: Modoo
- **Type**: Modular Monolith ERP
- **Backend**: Laravel 13.26.1 (PHP 8.5.8)
- **Frontend**: React (not started)
- **Database**: PostgreSQL 18.1
- **Module System**: nwidart/laravel-modules v13
- **API Auth**: Laravel Sanctum (token-based)
- **Repository**: Level-2-Defense (GitHub)

## Architecture

- Single Laravel application with logical business modules
- Backend exposes REST API consumed by React
- No microservices, no separate databases per module
- Route → Controller → Request Validation → Service (when needed) → Model → Database

## Project Structure

Level-2-Defense/ ├── backend/ ← Laravel API (Modoo) │ ├── Modules/ ← Business modules │ └── app/ ← Core Laravel app ├── frontend/ ← React app (future) └── soul.md ← This file

## Modules Created

| #   | Module         | Status                    |
| --- | -------------- | ------------------------- |
| 1   | Authentication | Created — not implemented |
| 2   | Employee       | Created — not implemented |
| 3   | Attendance     | Created — not implemented |
| 4   | Project        | Created — not implemented |
| 5   | Task           | Created — not implemented |
| 6   | Customer       | Created — not implemented |
| 7   | Quotation      | Created — not implemented |
| 8   | Invoice        | Created — not implemented |
| 9   | Payment        | Created — not implemented |
| 10  | Notification   | Created — not implemented |
| 11  | AIAssistant    | Created — not implemented |

## Database Tables

- `users` — default Laravel migration (exists)
- `personal_access_tokens` — Sanctum (exists)
- `sessions` — default Laravel (exists)
- `cache` — default Laravel (exists)
- `jobs` — default Laravel (exists)

## Completed Steps

1. ✅ Environment verified (PHP 8.5.8, Composer 2.10.2, PostgreSQL 18.1, Node 24.11.1)
2. ✅ Laravel project created in `backend/`
3. ✅ PostgreSQL database `modoo` connected
4. ✅ Default migrations run
5. ✅ nwidart/laravel-modules installed with composer-merge-plugin
6. ✅ Sanctum installed via `artisan install:api`
7. ✅ All 11 modules created

## API Conventions

- Base URL: `/api`
- Auth endpoints: `/api/auth/*`
- Resource endpoints: `/api/{resource}`
- JSON responses
- Sanctum token authentication

## Roles (from UML)

ADMIN, HR_MANAGER, PROJECT_MANAGER, EMPLOYEE, INTERN, ACCOUNTANT, CUSTOMER

## Key Decisions

- Composer merge plugin used to autoload modules (app/ subfolder structure)
- No separate Reports module — dashboard reads operational data
- QR code is a library tool, not a business module
- Backend enforces all authorization — frontend only hides UI

## Current Phase

**Phase 3**: Authentication module implementation

## Pending

- Authentication module (register, login, logout, roles)
- All other modules
- React frontend
