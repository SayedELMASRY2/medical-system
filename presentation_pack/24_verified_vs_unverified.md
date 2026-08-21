# 24. Verified vs. Unverified Audit

This document acts as an integrity check to separate what is actually functioning in the `backend/app/` codebase versus what might be missing or partially implemented.

## VERIFIED (Fully Implemented in Code)
*   **FastAPI Async Architecture:** The backend correctly uses `AsyncSession` and `async def` throughout `backend/app/api/v1`.
*   **Auth System:** JWT authentication and role-based restrictions (`PATIENT`, `DOCTOR`) are actively functioning via `deps.py` and `oauth2_scheme`.
*   **Deterministic Risk Engine:** Exists and is actively called synchronously when vitals are submitted.
*   **LangGraph Orchestration:** The `materna_graph` is fully coded with multiple nodes (Supervisor, RAG, Triage, Synthesizer) passing an `AgentState`.
*   **OCR Parsing Flow:** The `/upload` endpoint actively uses `pypdf` and Vision LLMs (or regex fallbacks) to extract JSON data.

## PARTIALLY IMPLEMENTED
*   **Timeline Agent:** The `timeline_agent_node` in the graph is partially implemented; it currently returns a hardcoded mock `TrendFeature` rather than calculating real historical deltas.
*   **OCR Persistence:** While OCR extraction is fully functional and the data is passed to the AI to answer questions, **there is no database code** saving the extracted lab values to PostgreSQL.

## DOCUMENTED BUT NOT VERIFIED (Not Found in Code)
*   **Background Workers (Celery/RabbitMQ):** Although scaling strategies might suggest background workers, everything currently runs synchronously in the FastAPI event loop.
*   **Midwife Role Logic:** The `MIDWIFE` role exists in the Enum, but specific differential logic separating what a Midwife can do versus a `DOCTOR` is not explicitly fleshed out in the API dependencies.

## POTENTIAL ISSUES (Code Inconsistencies)
*   **Missing Auth on AI Chat:** The AI endpoints in `chat.py` (`/`, `/stream`, `/upload`) do not implement `Depends(get_current_user)`. They are functionally open to unauthenticated requests.
*   **CORS Configuration:** `main.py` is set to `allow_origins=["*"]`, which is insecure for production.
*   **Dual Codebase Confusion:** The repository contains a root `api/` and `database/` folder which appears to be a synchronous prototype, while the actual Dockerized application lives entirely inside `backend/app/`. This could confuse developers not familiar with the structure.
