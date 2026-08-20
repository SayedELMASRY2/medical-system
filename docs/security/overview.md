# Materna Security Architecture Overview

This document outlines the security architecture and practices implemented in the Materna system to protect patient data and ensure secure access.

## Authentication & Authorization
- **Authentication**: Implemented using JSON Web Tokens (JWT).
  - Algorithm: HS256.
  - Access Tokens: Short-lived (expire in 30 minutes).
  - Refresh Tokens: Longer-lived (expire in 7 days).
- **Authorization**: Role-Based Access Control (RBAC) is enforced across all endpoints.
  - Roles: `patient`, `doctor`, `admin`.
  - Endpoints strictly validate the user's role before granting access to resources.

## Data Protection
- **In Transit**: All communication between the client and server must occur over HTTPS (TLS 1.2+).
- **At Rest**: Database encryption at rest is enforced for the PostgreSQL instance.
- **Sensitive Data Handling**: 
  - Passwords are hashed using bcrypt with a secure work factor.
  - Protected Health Information (PHI) is strictly excluded from application logs.

## Application Security
- **Input Validation**: Pydantic v2 is used for strict, type-safe validation on all FastAPI endpoints, preventing malformed data from entering the system.
- **Rate Limiting**: Implemented per endpoint category to prevent brute-force attacks and abuse.
- **CORS Configuration**: Cross-Origin Resource Sharing is strictly configured to allow requests only from trusted frontend domains.
- **Injection Prevention**: 
  - SQL Injection is mitigated by using SQLAlchemy ORM and parameterized queries exclusively.
  - Cross-Site Scripting (XSS) is prevented by Next.js's built-in escaping mechanisms.
- **CSRF Protection**: Implemented for state-changing operations.

## Infrastructure Security
- **External Services**: API keys for external services (OpenAI, Cohere) are managed securely via environment variables and are never committed to version control.
- **Container Security**: 
  - Docker images use minimal base images (e.g., Alpine or distroless).
  - Containers run as non-root users to limit potential privilege escalation.
- **Audit Logging**: All critical actions (authentication events, data access, clinical reviews) are logged with timestamps and user IDs for auditability.

## MVP vs. Production Considerations
While the MVP implements strong foundational security, a production deployment will require:
- Full HIPAA/GDPR compliance audits.
- Implementation of fine-grained attribute-based access control (ABAC).
- Advanced Threat Protection and WAF configuration.
- Regular penetration testing and vulnerability scanning.
