# Materna API Overview

Materna is an AI-Powered Longitudinal Pregnancy Monitoring & Early-Warning System. The Materna API follows RESTful conventions and provides endpoints for managing patients, pregnancies, clinical data, and AI-driven risk assessments.

## Base URL
All API endpoints are relative to:
```
/api/v1
```

## API Specifications
- **OpenAPI**: 3.1
- **Authentication**: JWT Bearer Tokens
- **Data Format**: JSON (`application/json`)

## Standard JSON Response Envelopes

All responses follow a standard envelope structure to ensure consistency.

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Jane Doe"
  },
  "meta": null,
  "error": null
}
```

### Paginated List Response
```json
{
  "status": "success",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Jane Doe"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 10,
    "total": 45,
    "total_pages": 5
  },
  "error": null
}
```

### Error Response
```json
{
  "status": "error",
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "issue": "Must be a valid email address"
      }
    ]
  }
}
```

## HTTP Status Codes

| Code | Description | Use Case |
|------|-------------|----------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Validation errors, malformed syntax |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Insufficient permissions (RBAC) |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Resource state conflict (e.g., duplicate email) |
| `422` | Unprocessable Entity | Pydantic validation errors |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server errors |

## Pagination, Sorting, and Filtering

### Pagination
List endpoints accept `page` and `page_size` query parameters.
- `page`: Page number, 1-indexed (default: `1`)
- `page_size`: Number of items per page (default: `20`, max: `100`)

### Sorting
- `sort_by`: Field to sort by (e.g., `created_at`)
- `sort_order`: `asc` or `desc` (default: `desc`)

### Filtering
Filters are applied via query parameters. Example: `?status=active&risk_level=high`

## Rate Limiting

Rate limits are enforced per user (by JWT) or per IP (unauthenticated).

| Endpoint Category | Limit | Example Endpoints |
|-------------------|-------|-------------------|
| Authentication | 10/min | `/auth/login`, `/auth/register` |
| CRUD Operations | 100/min | `/patients`, `/pregnancies`, `/vitals` |
| Search | 30/min | `/evidence/search` |
| Analysis | 5/min | `/pregnancies/{id}/analyze` |

## CORS Configuration
Cross-Origin Resource Sharing is enabled for authorized frontend domains (e.g., Materna web portal and mobile apps). Ensure requests include appropriate Origin headers.

## Versioning Strategy
The API is versioned in the URL (`/api/v1`). Breaking changes will result in a new major version (`/api/v2`). Minor backward-compatible additions will not bump the version number.
