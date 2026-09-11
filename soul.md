# Modoo ERP — Project Soul

> **This file is the persistent project memory. It is automatically updated after every implementation step.**
> Last updated: 2026-09-03

---

## Project Identity

- **Name**: Modoo
- **Type**: Modular Monolith ERP
- **Backend**: Laravel 13.26.1 (PHP 8.5.8)
- **Frontend**: React 18.3.1 (TypeScript, Vite 6, Tailwind CSS, React Router v6, Axios)
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
| 2 | Employee | ✅ Implemented | Department, Employee | EmployeeService, DepartmentService | EmployeeController, DepartmentController | ✅ |
| 3 | Attendance | ✅ Implemented | Attendance | AttendanceService | AttendanceController | ✅ |
| 4 | Project | ✅ Implemented | Project, ProjectMember | ProjectService | ProjectController | ✅ |
| 5 | Task | ✅ Implemented | Task, TaskComment | TaskService | TaskController | ✅ |
| 6 | Customer | ✅ Implemented | Customer | CustomerService | CustomerController | ✅ |
| 7 | Quotation | ✅ Implemented | Quotation, QuotationItem | QuotationServices | QuotationController | ✅ |
| 8 | Invoice | ✅ Implemented | Invoice, InvoiceItem | InvoiceService | InvoiceController | ✅ |
| 9 | Payment | ✅ Implemented | Payment | PaymentService, NotchPayGateway | PaymentController | ✅ |
| 10 | Notification | ⬜ Not started | — | — | — | — |
| 11 | AIAssistant | ✅ Implemented | AgentRequest | AssistantService | AIAssistantController | ✅ |

---

## Database Tables

| Table | Module | Status | Description |
|-------|--------|--------|-------------|
| `users` | Authentication | ✅ Exists | User accounts with role column |
| `personal_access_tokens` | Authentication | ✅ Exists | Sanctum API tokens |
| `sessions` | Core Laravel | ✅ Exists | Session management |
| `cache` | Core Laravel | ✅ Exists | Cache storage |
| `jobs` | Core Laravel | ✅ Exists | Queue jobs |
| `departments` | Employee | ✅ Exists | — |
| `employees` | Employee | ✅ Exists | — |
| `attendances` | Attendance | ✅ Exists | — |
| `projects` | Project | ✅ Exists | — |
| `tasks` | Task | ✅ Exists | — |
| `task_assignments` | Task | ✅ Exists | — |
| `comments` | Task | ✅ Exists | — |
| `customers` | Customer | ✅ Exists | Company/contact info, linked to user account |
| `quotations` | Quotation | ✅ Exists | Quotations for customers |
| `quotation_items` | Quotation | ✅ Exists | Items inside a quotation |
| `invoices` | Invoice | ✅ Exists | Invoices for customers |
| `invoice_items` | Invoice | ✅ Exists | Line items inside an invoice |
| `payments` | Payment | ✅ Exists | NotchPay integration (MTN MoMo, Orange Money, Visa/card) |
| `notifications` | Notification | ⬜ Pending | — |
| `agent_requests` | AIAssistant | ✅ Exists | AI assistant conversation log (NVIDIA GPT-OSS 20B) |

---

## API Endpoints

### Authentication Module ✅

| Method | Endpoint | Auth | Controller Method |
|--------|----------|:----:|-------------------|
| POST | `/api/auth/register` | ❌ | AuthController@register |
| POST | `/api/auth/login` | ❌ | AuthController@login |
| GET | `/api/auth/profile` | ✅ | AuthController@profile |
| POST | `/api/auth/logout` | ✅ | AuthController@logout |

### AIAssistant Module ✅

| Method | Endpoint | Auth | Controller Method |
|--------|----------|:----:|-------------------|
| POST | `/api/assistant/ask` | ✅ | AIAssistantController@ask |
| GET | `/api/assistant/history` | ✅ | AIAssistantController@history |
| GET | `/api/assistant/request/{id}` | ✅ | AIAssistantController@getRequest |

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
| 11 | NotchPay process/verify use `transaction.reference` | Merchant `PAY-xxx` is not NotchPay's payment id; using it causes `Payment Not Found` | 2026-09-01 |
| 12 | Visa/card via NotchPay hosted checkout (`cm.card`) | Card numbers stay off our API (PCI); customer pays on `authorization_url` | 2026-09-01 |
| 13 | NVIDIA GPT-OSS 20B for AI Assistant | Free-tier, OpenAI-compatible NIM API, 21B MoE with reasoning_effort support | 2026-09-03 |
| 14 | Vichy Color Palette for Frontend Design | Brand system utilizing `#05AD98` (Primary Teal), `#BBBFBF` (Silver border), `#878787` (Neutral Gray), `#FFFFFF` (White) | 2026-09-04 |
| 15 | Role-Based Dynamic Navigation & State | Centralized `AuthContext` with JWT storage and role-aware navigation filtering for Admin, HR, PM, Employee, Accountant, Customer | 2026-09-04 |
| 16 | Dark Mode Support & Theme Toggle | Persistent ThemeContext with localStorage, system preference detection, and class-based Tailwind dark mode | 2026-09-10 |
| 17 | Sticky Sidebar Navigation Layout | Independent content scroll architecture (`h-screen overflow-hidden`) with stationary sidebar | 2026-09-10 |
| 18 | Full Module Pages & API Integration | Interactive React pages for Employees, Attendance, Projects, Tasks, Customers, Quotations, Invoices, Payments, and AI Assistant | 2026-09-10 |
| 19 | Odoo ERP Clean Interface Architecture | Breadcrumbs, action toolbars, view switchers (Kanban/List/Cards), and crisp light palette | 2026-09-10 |
| 20 | Light Mode Focus | Clean, high-contrast, uncluttered light interface (dark mode removed per UX requirement) | 2026-09-10 |
| 21 | Interactive Drag & Drop Kanban with Custom Stages & Fields | HTML5 task drag & drop, manager/admin stage creation, column reordering, and custom task fields | 2026-09-10 |
| 22 | Comprehensive Mock Demo Data Fallback | Pre-seeded rich mock data across all ERP domains ensuring instant evaluation without blank states | 2026-09-10 |
| 23 | Streamlined Copy & Clean Vendor Branding | Removed vendor clutter (NotchPay, NVIDIA technical tags) replaced with clean ERP terms | 2026-09-10 |

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
9. ✅ Employee module implemented (EmploymentStatus enum, migrations, Models, Services, Controllers, routes)
10. ✅ Attendance module implemented (QR Code integration, geolocation verification)
11. ✅ API testing documentation created and updated (`backend/docs/api-testing.md`)
12. ✅ Customer module implemented (CRUD, linked to users)
13. ✅ AI Assistant module implemented (NVIDIA GPT-OSS 20B via NIM API, conversation history)
14. ✅ React TypeScript Frontend initialized in `frontend/` (Vite, Tailwind CSS, Lucide icons, React Router, Axios)
15. ✅ Vichy design system components created (Button, Input, Alert, Badge, Responsive Layout, Navbar, Sidebar)
16. ✅ Authentication pages (Login, Signup/Register) built consuming backend API endpoints with validation
17. ✅ Role-based dynamic dashboard and responsive multi-screen navigation implemented for all ERP modules
18. ✅ Sticky left navigation layout implemented with independently scrolling content area
19. ✅ Full interactive ERP module pages built consuming all backend REST APIs (Employees, Attendance, Projects, Tasks, Customers, Quotations, Invoices, Payments, AI Assistant)
20. ✅ Odoo ERP clean layout styling with top breadcrumbs, action toolbars, and List/Cards/Kanban view switchers
21. ✅ Complete Drag-and-Drop Kanban board with dynamic custom stages creation, column reordering, and custom fields
22. ✅ Preloaded realistic mock data fallback for all business modules (Employees, Projects, Tasks, Customers, Invoices, Payments, Attendance)
23. ✅ Streamlined UI copy and removed redundant vendor tags (e.g. NotchPay branding)
24. ✅ Resolved Login and Signup form integration issues, restored robust backend validation error reporting, and refined instant demo session handling

---

## Current Phase

**Next**: Notification Module (SMTP) & Full End-to-End Live Integration

---

## Pending Modules (in order)

1. ✅ Employee Module (departments, employees)
2. ✅ Attendance Module (check-in/out, QR code)
3. ✅ Project Module (projects, project members)
4. ✅ Task Module (tasks, comments, Drag & Drop Kanban, Custom Stages & Fields)
5. ✅ Customer Module
6. ✅ Quotation Module
7. ✅ Invoice Module
8. ✅ Payment Module (Orange Money, MTN MoMo, Visa/card)
9. ⬜ Notification Module (SMTP)
10. ✅ AI Assistant Module
11. ✅ Dashboard / KPIs (Odoo-style app launcher & role metrics)
12. ✅ React Frontend (Odoo Clean Style, Pure Light Theme, Full Demo Seed Data)
