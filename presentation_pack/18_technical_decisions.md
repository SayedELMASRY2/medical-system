# 18. Technical Decisions

## 1. Monolithic Asynchronous FastAPI
*   **Decision:** Build the entire backend (API, Agents, DB access) as a single Async FastAPI application.
*   **Evidence:** `backend/app/main.py` and `async def` routing everywhere.
*   **Why:** Simplifies local development and deployment (one container). Asynchronous Python allows the single thread to handle multiple long-running LLM and database I/O operations simultaneously without blocking.
*   **Trade-offs:** If CPU-heavy tasks (like OCR PDF parsing) increase, the event loop might get blocked. A microservice or task queue (Celery) would scale better for CPU-bound tasks.

## 2. Dual Architecture (Agentic AI + Deterministic Rules)
*   **Decision:** Separate the Clinical Safety rules from the AI generation.
*   **Evidence:** `app/risk_engine/engine.py` (Pure Python rules) vs `app/ai/graph.py` (LLM-based LangGraph).
*   **Why:** LLMs are non-deterministic and can hallucinate. For clinical risk triage (like determining if blood pressure is dangerously high), strict medical safety rules must be guaranteed. The LLM is restricted to conversational and informational synthesis.
*   **Trade-offs:** Requires maintaining two separate logic paths and ensuring they are synchronized in the Agent State.

## 3. PostgreSQL with pgvector
*   **Decision:** Use a traditional relational database (Postgres) but add the `pgvector` extension.
*   **Evidence:** `docker-compose.yml` uses `pgvector/pgvector:pg16`.
*   **Why:** Allows storing structured relational data (Users, Daily Check-ins) alongside unstructured high-dimensional embeddings for RAG, avoiding the operational overhead of a separate Vector Database (like Pinecone or Milvus).
*   **Trade-offs:** Less scalable for massive vector similarity searches compared to dedicated clustered vector databases.

## 4. OCR Fallback Strategy (The "Dummy Hash")
*   **Decision:** Implement a deterministic mathematical fallback generating dummy lab results based on the file hash if Vision LLMs fail.
*   **Evidence:** `backend/app/api/v1/chat.py` (Lines 119-141).
*   **Why:** Ensures the demo/app never crashes during presentation or testing, providing a robust user experience even if external APIs timeout.
*   **Trade-offs:** Produces fake medical data if the LLM fails, which is unacceptable for production but excellent for a resilient demo.

## 5. LangGraph for Agent Orchestration
*   **Decision:** Use `StateGraph` to manage the multi-agent workflow rather than simple chained LLM calls.
*   **Evidence:** `app/ai/graph.py` and `app/ai/state.py`.
*   **Why:** Allows for cycles, conditional routing (e.g., skipping RAG for casual chat), and maintaining a strict, typed state object that accumulates data (citations, triage alerts, OCR data) across the workflow.
*   **Trade-offs:** Steeper learning curve and added complexity compared to basic LangChain chains.
