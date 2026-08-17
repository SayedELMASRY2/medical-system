# Deployment Architecture

## Deployment Topology
The system runs as a Docker Compose multi-container stack.

- **materna-nginx:** Nginx reverse proxy.
- **materna-frontend:** Next.js 14 App Router.
- **materna-backend:** FastAPI application.
- **materna-db:** PostgreSQL 15 with vector capabilities.

## Nginx Configuration
- Reverse proxy to frontend (port 3000) and backend (port 8000).
- **SSE Support:** `proxy_buffering off;` and `proxy_cache off;` configured for the `/api/stream` routes to allow real-time event streaming.

## Docker Strategy
- **Multi-stage Builds:** Used for both `materna-frontend` and `materna-backend` to minimize final image sizes.
- **Backend Environment:** The backend Dockerfile explicitly installs:
  - Python 3.11
  - `tesseract-ocr` (for lab processing)
  - `poppler-utils` (for PDF processing)
  - `pdfplumber` dependencies

## PostgreSQL Initialization
The `materna-db` container runs init scripts on startup to enable necessary extensions:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```
Data is persisted using Docker Named Volumes (`materna-db-data`).

## Health Checks
- **Backend:** `GET /health` returns `{ "status": "ok" }`.
- **Frontend:** `GET /` (or specific health endpoint) to verify Next.js server is responsive.
- Docker compose utilizes the `healthcheck` directive to manage dependency startup order.

## Environment & Secrets
Configuration is managed via `.env` files (e.g., `.env.development`, `.env.production`). 
- Secrets (OpenAI keys, Cohere keys, DB passwords) are injected securely.

## Service Naming Convention
All services and containers are strictly prefixed with `materna-`. 
*Note: Any legacy `medical_ai` naming is deprecated and must not be used.*
