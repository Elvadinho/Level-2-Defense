# Modoo ERP — API Reference

**Base URL:** `http://localhost:8000/api`  
**Auth Header:** `Authorization: Bearer {{token}}`

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
*(More modules will be added here as we build them)*
