# 03. Features Inventory

## Core Features

### 1. Daily Check-In Logging
*   **Purpose:** Allows patients to submit daily vital signs and symptoms.
*   **User:** Patient (or Doctor/Midwife on behalf of patient).
*   **Input:** JSON payload with BP, heart rate, weight, symptoms, etc.
*   **Processing:** Validates data, ensures only one entry per day (idempotency), enriches with gestational age.
*   **Output:** `VitalsLogResponse` (Database record).
*   **Dependencies:** `crud/daily_checkin.py`, PostgreSQL.
*   **Status:** VERIFIED (Fully implemented in `vitals.py`).

### 2. Deterministic Risk Engine
*   **Purpose:** Evaluates clinical risk based on strict medical rules (Non-LLM).
*   **User:** System (Background synchronous process triggered by check-in).
*   **Input:** Gestational age, vitals, symptoms.
*   **Processing:** Applies hardcoded clinical logic (e.g., if BP > 140 -> Monitor).
*   **Output:** Risk Severity (`low`, `monitor`, `clinical_review`, `high`), Triggered rules list.
*   **Dependencies:** `risk_engine/engine.py`.
*   **Status:** VERIFIED (Fully implemented).

---

## Admin / Doctor Features

### 3. Triage Dashboard
*   **Purpose:** Displays a prioritized queue of patients requiring clinical review.
*   **User:** Doctor, Midwife.
*   **Input:** JWT Auth token, filtering parameters (e.g., `min_severity`).
*   **Processing:** Queries the database for patients with high risk status.
*   **Output:** List of `PatientProfile` models sorted by risk severity.
*   **Dependencies:** `api/v1/dashboard.py`.
*   **Status:** VERIFIED (Fully implemented).

---

## AI & Agent Features

### 4. Multi-Agent Chat Assistant
*   **Purpose:** Provides a conversational interface for patient support and medical queries.
*   **User:** Patient.
*   **Input:** Natural language message, optional lab results context.
*   **Processing:** LangGraph orchestrates routing, retrieval (RAG), triage alerting, and synthesis.
*   **Output:** Streaming (SSE) or JSON text response.
*   **Dependencies:** `ai/graph.py`, OpenAI/Cohere API.
*   **Status:** VERIFIED (Fully implemented via `chat.py`).

### 5. Lab Report OCR Extraction
*   **Purpose:** Extracts structured numerical data from unstructured lab documents.
*   **User:** Patient.
*   **Input:** PDF or Image upload (Multipart form data).
*   **Processing:** Uses `pypdf` for text, Vision LLM for images, and a fallback regex/hash generator. Prompts LLM to return strict JSON.
*   **Output:** Extracted JSON dictionary of lab values.
*   **Dependencies:** Vision LLM, `api/v1/chat.py` `/upload` endpoint.
*   **Status:** PARTIALLY IMPLEMENTED (Data is extracted and returned to the UI/passed to chat state, but it is **not persisted** to the PostgreSQL database).

---

## User-Facing Features

### 6. Check-In History Retrieval
*   **Purpose:** Allows viewing past check-ins for a specific patient.
*   **User:** Patient, Doctor, Midwife.
*   **Input:** `patient_id`, pagination params (`skip`, `limit`).
*   **Processing:** Database query ordered by newest first.
*   **Output:** Paginated `DailyCheckInList`.
*   **Dependencies:** `api/v1/vitals.py` `GET`.
*   **Status:** VERIFIED.

---

## Security & Integration Features

### 7. JWT Authentication & Role Management
*   **Purpose:** Secures endpoints and enforces Role-Based Access Control (RBAC).
*   **User:** All users.
*   **Input:** Email / Password.
*   **Processing:** Hashes password, generates JWT with `sub` and `role`. Route dependencies validate the token.
*   **Output:** Bearer Token.
*   **Dependencies:** `api/v1/auth.py`, `api/deps.py`.
*   **Status:** VERIFIED (Note: Missing on `/chat` endpoints).

### 8. LangGraph State Memory
*   **Purpose:** Maintains conversation and contextual memory during a chat session.
*   **User:** System.
*   **Input:** `AgentState`.
*   **Processing:** Passes the state object through multiple graph nodes, accumulating outputs (e.g., citations, triage alerts).
*   **Output:** Final populated `AgentState`.
*   **Dependencies:** `ai/state.py`.
*   **Status:** VERIFIED.
