# Modoo ERP — Project Soul

> **This file is the persistent project memory. It is automatically updated after every implementation step.**
> Last updated: 2026-08-25

---

## Project Identity

- **Name**: Modoo
- **Type**: Modular Monolith ERP
- **Backend**: Laravel 13.26.1 (PHP 8.5.8)
- **Frontend**: React (not started)
- **Database**: PostgreSQL 18.1 — database name: `modoo`
- **Module System**: nwidart/laravel-modules v13
- **API Auth**: Laravel Sanctum (token-based)
- **Repository**: Level-2-Defense (GitHub)

---

## Architecture

- Single Laravel application with logical business modules
- Backend exposes REST API consumed by React
- No microservices, no separate databases per module
- **SOLID Principles enforced**: Controllers are thin (HTTP layer only). Business logic lives in Service classes. This pattern applies to ALL modules.
- Pattern per module: `Route → Controller (HTTP) → Service (Business Logic) → Model (Data) → Database`

### Project Structure

```
Level-2-Defense/
├── backend/                         ← Laravel API (Modoo)
│   ├── app/Models/                  ← Core models (User)
│   ├── Modules/                     ← Business modules
│   │   ├── Authentication/
│   │   ├── Employee/
│   │   ├── Attendance/
│   │   ├── Project/
│   │   ├── Task/
│   │   ├── Customer/
│   │   ├── Quotation/
│   │   ├── Invoice/
│   │   ├── Payment/
│   │   ├── Notification/
│   │   └── AIAssistant/
│   └── docs/
│       └── api-testing.md           ← API testing guide (Postman + HTTPie)
├── frontend/                        ← React app (future)
└── soul.md                          ← This file
```

---

## Modules Progress

| # | Module | Status | Models | Services | Controllers | Routes |
|---|--------|--------|--------|----------|-------------|--------|
| 1 | Authentication | ✅ Implemented | User (core) | AuthService | AuthController | ✅ |
| 2 | Employee | ⬜ Not started | — | — | — | — |
| 3 | Attendance | ⬜ Not started | — | — | — | — |
| 4 | Project | ⬜ Not started | — | — | — | — |
| 5 | Task | ⬜ Not started | — | — | — | — |
| 6 | Customer | ⬜ Not started | — | — | — | — |
| 7 | Quotation | ⬜ Not started | — | — | — | — |
| 8 | Invoice | ⬜ Not started | — | — | — | — |
| 9 | Payment | ⬜ Not started | — | — | — | — |
| 10 | Notification | ⬜ Not started | — | — | — | — |
| 11 | AIAssistant | ⬜ Not started | — | — | — | — |

---

## Database Tables

| Table | Module | Status | Description |
|-------|--------|--------|-------------|
| `users` | Authentication | ✅ Exists | User accounts with role column |
| `personal_access_tokens` | Authentication | ✅ Exists | Sanctum API tokens |
| `sessions` | Core Laravel | ✅ Exists | Session management |
| `cache` | Core Laravel | ✅ Exists | Cache storage |
| `jobs` | Core Laravel | ✅ Exists | Queue jobs |
| `departments` | Employee | ⬜ Pending | — |
| `employees` | Employee | ⬜ Pending | — |
| `attendances` | Attendance | ⬜ Pending | — |
| `projects` | Project | ⬜ Pending | — |
| `tasks` | Task | ⬜ Pending | — |
| `task_assignments` | Task | ⬜ Pending | — |
| `comments` | Task | ⬜ Pending | — |
| `customers` | Customer | ⬜ Pending | — |
| `quotations` | Quotation | ⬜ Pending | — |
| `invoices` | Invoice | ⬜ Pending | — |
| `payments` | Payment | ⬜ Pending | — |
| `notifications` | Notification | ⬜ Pending | — |

---

## API Endpoints

### Authentication Module ✅

| Method | Endpoint | Auth | Controller Method |
|--------|----------|:----:|-------------------|
| POST | `/api/auth/register` | ❌ | AuthController@register |
| POST | `/api/auth/login` | ❌ | AuthController@login |
| GET | `/api/auth/profile` | ✅ | AuthController@profile |
| POST | `/api/auth/logout` | ✅ | AuthController@logout |

---

## Roles (from UML)

| Role | Enum Value | Description |
|------|-----------|-------------|
| ADMIN | `admin` | Full system access, user management |
| HR_MANAGER | `hr_manager` | Employee management, attendance |
| PROJECT_MANAGER | `project_manager` | Project & task management |
| EMPLOYEE | `employee` | Task work, attendance, profile |
| INTERN | `intern` | Same as employee with limited scope |
| ACCOUNTANT | `accountant` | Customers, quotations, invoices, payments |
| CUSTOMER | `customer` | View invoices, respond to quotations, make payments |

---

## Key Decisions Log

| # | Decision | Reason | Date |
|---|----------|--------|------|
| 1 | Composer merge plugin for module autoloading | nwidart v13 uses `app/` subfolder — merge plugin resolves PSR-4 paths | 2026-08-24 |
| 2 | SOLID Principles enforced in all modules | Controllers handle HTTP only; Services handle business logic | 2026-08-24 |
| 3 | No separate Reports module | Dashboard reads from operational data directly | 2026-08-24 |
| 4 | QR code is a library tool, not a business module | Simple library integration, not a domain entity | 2026-08-24 |
| 5 | Backend enforces all authorization | Frontend hides UI for UX, backend is the authority | 2026-08-24 |
| 6 | Sanctum for API authentication | Token-based auth for SPA + API, built into Laravel | 2026-08-24 |
| 7 | Single active session (tokens revoked on new login) | Security — one active token per user at a time | 2026-08-24 |
| 8 | Default role is `employee` on registration | Most users are employees; admins assign special roles | 2026-08-24 |
| 9 | API testing docs auto-generated | `backend/docs/api-testing.md` updated per module | 2026-08-25 |
| 10 | soul.md auto-updated | Progress tracked automatically after each step | 2026-08-25 |

---

## Completed Implementation Steps

1. ✅ Environment verified (PHP 8.5.8, Composer 2.10.2, PostgreSQL 18.1, Node 24.11.1)
2. ✅ Laravel 13.26.1 project created in `backend/`
3. ✅ PostgreSQL database `modoo` connected
4. ✅ Default migrations run
5. ✅ nwidart/laravel-modules v13 installed with composer-merge-plugin
6. ✅ Sanctum installed via `artisan install:api`
7. ✅ All 11 module skeletons created
8. ✅ Authentication module implemented (Role enum, migration, User model, AuthService, AuthController, routes)
9. ✅ API testing documentation created (`backend/docs/api-testing.md`)

---

## Current Phase

**Next**: Employee Module (departments, employees, employment status)

---

## Pending Modules (in order)

1. ⬜ Employee Module (departments, employees)
2. ⬜ Attendance Module (check-in/out, QR code)
3. ⬜ Project Module (projects, project managers)
4. ⬜ Task Module (tasks, assignments, comments)
5. ⬜ Customer Module
6. ⬜ Quotation Module
7. ⬜ Invoice Module
8. ⬜ Payment Module (external API integration)
9. ⬜ Notification Module (SMTP)
10. ⬜ AI Assistant Module (Claude API)
11. ⬜ Dashboard / KPIs
12. ⬜ React Frontend
