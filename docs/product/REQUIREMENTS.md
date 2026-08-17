# System Requirements: Materna

This document details the functional and non-functional requirements for the Materna platform.

## Functional Requirements

### F-FND: Foundation
*   **F-FND-01 [Critical]:** Project initialized with Docker and `docker-compose` for local development.
*   **F-FND-02 [High]:** Continuous Integration (CI) setup for linting and basic testing.

### F-BE: Backend
*   **F-BE-01 [Critical]:** FastAPI application structure with PostgreSQL integration.
*   **F-BE-02 [Critical]:** JWT-based Authentication system.
*   **F-BE-03 [High]:** Role-Based Access Control (RBAC) supporting `doctor`, `patient`, and `admin` roles.
*   **F-BE-04 [Critical]:** Pydantic models acting as OpenAPI contracts for all endpoints.

### F-DATA: Data Pipeline
*   **F-DATA-01 [Critical]:** CRUD endpoints for Patient Pregnancy Profiles.
*   **F-DATA-02 [Critical]:** Ingestion API for daily symptoms and vitals.
*   **F-DATA-03 [Medium]:** Laboratory results ingestion schema.
*   **F-DATA-04 [Critical]:** Data validation and normalization pipelines.
*   **F-DATA-05 [Critical]:** Timeline construction logic combining vitals, symptoms, and labs sequentially.

### F-TREND: Trend Analytics
*   **F-TREND-01 [Critical]:** Calculate delta (absolute and percentage) between current and previous vitals.
*   **F-TREND-02 [High]:** Calculate rate of change over a specified time window (e.g., 3 days, 7 days).
*   **F-TREND-03 [Medium]:** Compute rolling averages for specific metrics.
*   **F-TREND-04 [High]:** Track consecutive abnormal readings.

### F-RISK: Risk Engine
*   **F-RISK-01 [Critical]:** Hardcoded, deterministic clinical rules engine (isolated from LLM).
*   **F-RISK-02 [Critical]:** Threshold evaluation for single data points (e.g., Systolic > 160).
*   **F-RISK-03 [Critical]:** Signal combination evaluation (e.g., rising BP + proteinuria + headache).
*   **F-RISK-04 [Critical]:** Output structured risk levels (LOW, MONITOR, CLINICAL REVIEW, HIGH PRIORITY).
*   **F-RISK-05 [High]:** Output machine-readable rationale for the triggered rule.

### F-RAG: RAG Pipeline
*   **F-RAG-01 [Critical]:** Document ingestion and text extraction script.
*   **F-RAG-02 [Critical]:** Semantic chunking of medical guidelines with metadata preservation.
*   **F-RAG-03 [Critical]:** Embedding generation and storage in pgvector.
*   **F-RAG-04 [High]:** BM25 index implementation for keyword search.
*   **F-RAG-05 [Critical]:** Hybrid retrieval strategy (Vector + BM25) with reranking.
*   **F-RAG-06 [High]:** Output traceable citations mapping back to original documents.

### F-AGT: AI Agents (LangGraph)
*   **F-AGT-01 [Critical]:** Supervisor Agent to route tasks based on the Risk Engine's output.
*   **F-AGT-02 [High]:** Timeline Agent to summarize and analyze longitudinal trends.
*   **F-AGT-03 [Critical]:** RAG Agent to query the vector database and retrieve clinical evidence.
*   **F-AGT-04 [Critical]:** Triage Agent to synthesize timeline data, risk triggers, and RAG evidence into a cohesive explanation.

### F-FE: Frontend
*   **F-FE-01 [High]:** Patient onboarding and pregnancy profile setup UI.
*   **F-FE-02 [Critical]:** Patient Daily Check-in form (vitals and symptoms).
*   **F-FE-03 [Medium]:** Patient history and timeline view.
*   **F-FE-04 [Critical]:** Doctor Dashboard displaying a prioritized list of patients based on risk level.
*   **F-FE-05 [High]:** Detail view for doctors showing patient timeline, risk signals, AI explanation, and cited evidence.

### F-INT: Integration
*   **F-INT-01 [High]:** Server-Sent Events (SSE) streaming for real-time dashboard updates.
*   **F-INT-02 [Critical]:** End-to-end testing of the DETECT → EXPLAIN → ESCALATE workflow.

---

## Non-Functional Requirements

*   **Performance:** 
    *   API response times for standard CRUD operations must be < 200ms.
    *   Risk Engine evaluation must take < 50ms.
    *   AI Agent workflow (including RAG) should complete in < 8 seconds.
*   **Security:**
    *   All endpoints must enforce JWT validation.
    *   Patient data must be segmented (a patient can only view their own data).
    *   Architecture must be designed with HIPAA compliance considerations (e.g., encryption at rest and in transit).
*   **Reliability:**
    *   Graceful degradation: If the LangGraph service is down, the Risk Engine must still push standard alerts to the dashboard.
*   **Safety:**
    *   Strict adherence to CDSS disclaimers. 
    *   The LLM must be explicitly prompted to refuse generating diagnoses.
*   **Scalability:**
    *   While the MVP focuses on a local Docker deployment, the architecture (stateless APIs, external DB) must be ready for cloud containerization.
