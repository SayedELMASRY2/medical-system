# 15. Security

## Security Architecture

### Authentication
*   **Mechanism:** Stateless JSON Web Tokens (JWT).
*   **Flow:** Users submit email/password to `/api/v1/auth/login`. The server verifies the password against a `bcrypt` hash and returns an `access_token`.
*   **Implementation:** Handled via FastAPI's `OAuth2PasswordBearer` and `Depends(get_current_user)`.

### Authorization & Roles
*   **Roles:** `PATIENT`, `DOCTOR`, `MIDWIFE`.
*   **Access Control:** Embedded directly into the controller routes. 
    *   Example: A `PATIENT` attempting to GET `/patients/{id}/vitals` will be rejected (`403 Forbidden`) if the `{id}` does not match the UUID associated with their JWT.
    *   `DOCTOR` and `MIDWIFE` roles bypass this restriction and can view any patient.

### Data Protection
*   **Passwords:** Securely hashed using `passlib` (bcrypt). Plaintext passwords are never logged or stored.
*   **SQL Injection:** Mitigated by SQLAlchemy's parameterized queries in the ORM.

### Identified Potential Risks & Gaps
*   **[POTENTIAL ISSUE] Missing Auth on Chat:** The endpoints in `backend/app/api/v1/chat.py` (`/upload`, `/`, `/stream`) do not currently have `Depends(get_current_user)` in their function signatures. This means the AI Chat and OCR upload capabilities might be publicly accessible without a token.
*   **[POTENTIAL ISSUE] Permissive CORS:** The `main.py` file configures CORS with `allow_origins=["*"]`. This is acceptable for local development but presents a Cross-Origin Resource Sharing risk in production.
*   **Secrets Management:** API Keys (`LLM_API_KEY`) are managed via `.env` files, which is standard, but no cloud secret manager (like AWS Secrets Manager) is currently implemented in the codebase.
