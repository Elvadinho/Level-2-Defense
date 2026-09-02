# Modoo ERP — API Reference

**Base URL:** `http://localhost:8000/api`  
**Auth Header:** `Authorization: Bearer {{jwt_token}}`

---

## Authentication Module (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:------------:|-------------|
| POST | `/register` | ❌ | Register user |
| POST | `/login` | ❌ | Login & get token |
| GET | `/profile` | ✅ | Get authenticated user |
| POST | `/logout` | ✅ | Revoke token |

### 1. Register (`POST /api/auth/register`)

**Payload:**
```json
{
    "name": "John Doe",
    "email": "john@modoo.com",
    "password": "password123",
    "password_confirmation": "password123",
    "role": "admin" // optional: admin, hr_manager, project_manager, employee, intern, accountant, customer
}
```

### 2. Login (`POST /api/auth/login`)

**Payload:**
```json
{
    "email": "john@modoo.com",
    "password": "password123"
}
```
*(Copy the `token` from the response to use in authenticated requests)*

### 3. Profile (`GET /api/auth/profile`)
*(Requires Bearer Token)*

### 4. Logout (`POST /api/auth/logout`)
*(Requires Bearer Token)*

---

## Employee Module (`/api/departments` & `/api/employees`)
*(All endpoints require Bearer Token)*

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List all departments |
| POST | `/api/departments` | Create a department |
| GET | `/api/departments/{id}` | Get specific department |
| PUT | `/api/departments/{id}` | Update department |
| DELETE | `/api/departments/{id}` | Delete department |

**POST / PUT Payload:**
```json
{
    "name": "Human Resources",
    "description": "HR department" // optional
}
```

### Employees

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create an employee |
| GET | `/api/employees/{id}` | Get specific employee |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}` | Delete employee |

**POST / PUT Payload:**
```json
{
    "user_id": 1,
    "department_id": 1,
    "job_title": "Software Engineer",
    "employment_status": "active", // optional: active, on_leave, terminated
    "hire_date": "2026-08-25"
}
```

---

## Attendance Module (`/api/attendance`)
*(All endpoints require Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/check-in` | Check in (employee) |
| POST | `/api/attendance/check-out` | Check out (employee) |
| GET | `/api/attendance/my-history` | View own history (employee) |
| GET | `/api/attendance` | List all records (Admin/HR) |
| GET | `/api/attendance/history/{id}` | View specific employee history (Admin/HR) |
| GET | `/api/attendance/qr-code` | Generate QR Code SVG (Admin/HR) |

### Check In (`POST /api/attendance/check-in`)
**Payload:**
```json
{
    "latitude": 5.3600,
    "longitude": -4.0083
}
```

### Check Out (`POST /api/attendance/check-out`)
**Payload:**
```json
{
    "latitude": 5.3600,
    "longitude": -4.0083
}
```

---

## Project Module (`/api/projects`)
*(All endpoints require Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/{id}` | Get specific project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |
| GET | `/api/projects/{id}/members` | List project members |
| POST | `/api/projects/{id}/members` | Add member to project |
| DELETE | `/api/projects/{id}/members/{employee_id}` | Remove member from project |

**POST / PUT Payload for Project:**
```json
{
    "name": "Website Redesign",
    "description": "Full redesign of the corporate website",
    "status": "planning",
    "start_date": "2026-09-01",
    "end_date": "2026-12-31",
    "manager_id": 1
}
```

**POST Payload for Project Members:**
```json
{
    "employee_id": 1,
    "role": "developer"
}
```

---

## Task Module (`/api/projects/{id}/tasks` & `/api/tasks`)
*(All endpoints require Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/tasks` | List all tasks in a project |
| POST | `/api/projects/{id}/tasks` | Create a task in a project |
| GET | `/api/tasks/{id}` | Get specific task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/tasks/{id}/comments` | List comments for a task |
| POST | `/api/tasks/{id}/comments` | Add comment to a task |

**POST / PUT Payload for Task:**
```json
{
    "title": "Design homepage mockup",
    "description": "Create Figma mockup for the new homepage",
    "status": "todo",
    "priority": "high",
    "assigned_to": 1,
    "start_date": "2026-09-02",
    "due_date": "2026-09-15",
    "order": 1
}
```

**POST Payload for Task Comments:**
```json
{
    "body": "Started working on the mockup, will share by EOD."
}
```

---

## Customer Module (`/api/customers`)
*(All endpoints require Bearer Token)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all customers |
| POST | `/api/customers` | Create a customer |
| GET | `/api/customers/{id}` | Get specific customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

**POST / PUT Payload:**
```json
{
    "user_id": 1,
    "company_name": "Acme Corp",
    "contact_name": "Jane Smith",
    "email": "jane@acme.com",
    "phone": "+225 07 00 00 00",
    "address": "123 Business Avenue",
    "city": "Abidjan",
    "country": "Côte d'Ivoire"
}
```
> `user_id` is optional — link to an existing user account with role `customer`, or omit to create a standalone customer record.

---

## Payment Module (`/api/payments`)
*(Initiate/list/show/verify require Bearer Token. Callback and webhook do not.)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Initiate payment (MTN, Orange, or Visa/card) |
| GET | `/api/payments` | List all payments |
| GET | `/api/payments/{id}` | Get a payment |
| POST | `/api/payments/{id}/verify` | Verify status with NotchPay |
| GET | `/api/payments/callback` | NotchPay redirect after card checkout |
| POST | `/api/payments/webhook` | NotchPay webhook |

**POST `/api/payments` — Mobile Money**
```json
{
    "invoice_id": 1,
    "channel": "cm.mtn",
    "phone": "+237680000000"
}
```
`channel`: `cm.mtn` or `cm.orange`. Phone is required.

**POST `/api/payments` — Visa / Mastercard**
```json
{
    "invoice_id": 1,
    "channel": "cm.card"
}
```
Response includes `authorization_url`. Open that URL to pay on NotchPay checkout (card details never go through this API). After payment, NotchPay redirects to `/api/payments/callback`.

---
