# 16. Deployment & Infrastructure

## Local Development & Deployment
The system is fully containerized for local development and potential production deployment using Docker and Docker Compose.

### Containers
1.  **Backend Container:**
    *   **Dockerfile:** `backend/Dockerfile`
    *   **Base Image:** `python:3.11-slim`
    *   **System Dependencies:** Installs `build-essential`, `libpq-dev`, and `tesseract-ocr` (used for backup OCR processing).
    *   **Command:** Runs `uvicorn app.main:app` on port 8000.
2.  **Database Container:**
    *   **Base Image:** PostgreSQL extended with `pgvector` (`pgvector/pgvector:pg16`).
    *   **Port:** Exposes 5432.
3.  **Frontend Container:**
    *   While Next.js is typically developed locally via `npm run dev`, it is architecturally separate and runs on port 3000.

### Environment Configuration
Managed via a `.env` file containing:
*   `DATABASE_URL` (e.g., `postgresql+asyncpg://user:password@db:5432/materna`)
*   `LLM_API_KEY` (e.g., OpenAI API Key)
*   `JWT_SECRET_KEY`

### Missing / Unverified Components
*   **Production Deployment:** No Terraform files, Kubernetes manifests, or cloud provider configurations (AWS/GCP/Azure) were found.
*   **CI/CD:** No GitHub Actions workflows or GitLab CI files were found.
*   **Monitoring:** No Prometheus, Grafana, or Datadog integrations were verified in the codebase.

## Deployment Architecture Diagram

```mermaid
flowchart TD
    subgraph Docker Network [Docker Compose Network]
        Backend[Backend Container \n FastAPI (Port 8000)]
        DB[(Database Container \n pgvector (Port 5432))]
    end
    
    subgraph Host Machine
        Frontend[Frontend Process \n Next.js (Port 3000)]
    end
    
    Frontend -- "HTTP / WS" --> Backend
    Backend -- "SQLAlchemy Async" --> DB
```
