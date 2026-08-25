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
*(More modules will be added here as we build them)*
