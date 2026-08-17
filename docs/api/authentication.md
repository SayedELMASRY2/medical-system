# Authentication API

Materna uses JSON Web Tokens (JWT) for authentication and Role-Based Access Control (RBAC) for authorization.

## Authentication Mechanisms
- **Algorithm**: HS256
- **Access Token Expiry**: 30 minutes
- **Refresh Token Expiry**: 7 days
- **Password Hashing**: bcrypt

## RBAC Roles
- **doctor**: Full clinical access to their assigned patients.
- **patient**: Access only to their own personal and pregnancy data.
- **admin**: System management, onboarding, and overall administrative access.

---

## `POST /api/v1/auth/register`
Register a new user.

### Request Body
```json
{
  "email": "doctor@materna.com",
  "password": "StrongPassword123!",
  "full_name": "Dr. Sarah Smith",
  "role": "doctor",
  "specialty": "Obstetrics"
}
```
*Validation*: Password must be min 8 chars, contain uppercase, and a number. Email must be valid format.

### Response `201 Created`
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "u-123",
      "email": "doctor@materna.com",
      "full_name": "Dr. Sarah Smith",
      "role": "doctor"
    },
    "access_token": "eyJhb...",
    "refresh_token": "def456...",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "meta": null,
  "error": null
}
```

---

## `POST /api/v1/auth/login`
Authenticate and obtain tokens.

### Request Body
```json
{
  "email": "doctor@materna.com",
  "password": "StrongPassword123!"
}
```

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhb...",
    "refresh_token": "def456...",
    "token_type": "bearer",
    "expires_in": 1800
  },
  "meta": null,
  "error": null
}
```

---

## `POST /api/v1/auth/refresh`
Refresh an expired access token.

### Request Body
```json
{
  "refresh_token": "def456..."
}
```

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhb_new...",
    "refresh_token": "def456_new..."
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/auth/me`
Retrieve the current authenticated user's profile.

### Headers
`Authorization: Bearer <access_token>`

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "u-123",
    "email": "doctor@materna.com",
    "full_name": "Dr. Sarah Smith",
    "role": "doctor",
    "specialty": "Obstetrics",
    "created_at": "2023-10-01T12:00:00Z"
  },
  "meta": null,
  "error": null
}
```
