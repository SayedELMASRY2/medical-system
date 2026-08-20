# Hackathon Phases & Team Distribution

This document outlines the 5-Phase execution plan (mapped to the 5 days of the hackathon) for the Materna CDSS project, specifically distributed across our 5-person engineering team.

## 👥 Team Roles & Responsibilities

1. **Dev 1 (AI & LangGraph Engineer):** Responsible for the cognitive core. Builds the Supervisor, Timeline, and Triage agents, writes prompts, and manages the StateGraph workflow.
2. **Dev 2 (RAG & Vector DB Engineer):** Responsible for knowledge retrieval. Manages `pgvector`, Cohere embeddings, chunking medical guidelines, and the BM25 hybrid search pipeline.
3. **Dev 3 (Clinical Risk Engine):** Responsible for deterministic safety. Builds the pure Python rule engine, maps clinical guidelines to hardcoded thresholds, and defines escalation matrices.
4. **Dev 4 (Backend API & Architecture):** Responsible for the system backbone. Builds FastAPI endpoints, SQLAlchemy DB models, Alembic migrations, SSE streaming, and Authentication.
5. **Dev 5 (Frontend & UI/UX Engineer):** Responsible for the user experience. Builds the Next.js app, tailwind designs, patient dashboards, doctor interfaces, and integrates real-time SSE streams.

---

## 🚀 5-Phase Execution Plan

### Phase 1: Foundation & Setup
**Goal:** Establish all base skeletons, infrastructure, and independent mock development environments.
* **Dev 1 (AI):** Set up LangGraph environment, define the `AgentState` Pydantic schema, and build the Supervisor routing skeleton with mock responses.
* **Dev 2 (RAG):** Set up pgvector database, create the document ingestion pipeline skeleton, and test Cohere embeddings with mock text.
* **Dev 3 (Risk):** Build the Risk Engine skeleton (Python classes), define the base clinical rules framework, and hardcode the first set of vital thresholds.
* **Dev 4 (Backend):** Initialize FastAPI, configure `docker-compose.yml`, design PostgreSQL schemas, set up Alembic migrations, and expose basic health APIs.
* **Dev 5 (Frontend):** Initialize Next.js app, configure Tailwind CSS, set up global layouts, and build static mockups of the authentication and patient onboarding pages.

### Phase 2: Core Data Pipelines
**Goal:** Data flowing independently in each isolated track.
* **Dev 1 (AI):** Implement the Timeline Agent to process trend features and summarize longitudinal data for the LLM.
* **Dev 2 (RAG):** Implement recursive chunking strategies, enrich chunks with metadata, and set up the BM25 lexical index.
* **Dev 3 (Risk):** Implement specific clinical rules (e.g., blood pressure rules, symptom combination matrices) mapped to gestational-age.
* **Dev 4 (Backend):** Build CRUD APIs for Symptoms, Vitals, Labs, and the Timeline construction logic (data validation and normalization).
* **Dev 5 (Frontend):** Build the functional Patient onboarding flow, pregnancy profile UI, and the daily check-in form for logging symptoms/vitals.

### Phase 3: AI & Logic Integration
**Goal:** The intelligence of the system starts making decisions.
* **Dev 1 (AI):** Implement the Triage Agent, integrate the RAG Agent context, connect the full LangGraph workflow, and begin SSE streaming setup.
* **Dev 2 (RAG):** Implement Hybrid retrieval (pgvector + BM25), add Cohere cross-encoder reranking, and establish the citation chaining logic.
* **Dev 3 (Risk):** Integrate the Risk Assessment engine with the backend data flow, refine signal combination logic, and finalize alert severity levels.
* **Dev 4 (Backend):** Implement Risk API, Analysis API, Evidence API, Doctor Dashboard API, and setup alert persistence in PostgreSQL.
* **Dev 5 (Frontend):** Build the patient risk status display, implement timeline visualization charts, and design the evidence/citation cards.

### Phase 4: Full System Integration
**Goal:** All team tracks merge. The Frontend talks to the Backend, which runs the Risk Engine and AI Graph, which hits the RAG DB.
* **Dev 1 (AI):** Finalize end-to-end agent workflow, format AI explanations perfectly for frontend consumption, and harden error handling/fallbacks.
* **Dev 2 (RAG):** Finalize evidence display pipeline, verify sources, and ensure citations are perfectly formatted for the Triage Agent.
* **Dev 3 (Risk):** Conduct edge case testing, validate rules against test clinical datasets, and verify the correct escalation flow to the frontend.
* **Dev 4 (Backend):** Finalize Server-Sent Events (SSE) streaming endpoints, perform backend integration testing, and seed the database with demo scenarios.
* **Dev 5 (Frontend):** Build the Doctor dashboard, patient list sorting, alert notifications, and connect the UI to the live SSE real-time updates.

### Phase 5: QA, Polish & Pitch Demo
**Goal:** A flawless, bug-free, visually stunning product ready for the hackathon judges.
* **Dev 1 (AI):** Tune prompts for maximum speed and minimum tokens. Ensure the CDSS disclaimer is appended to all outputs.
* **Dev 2 (RAG):** Manually review retrieval accuracy for the top 5 demo scenarios (e.g. Preeclampsia, Gestational Diabetes).
* **Dev 3 (Risk):** Verify that the deterministic engine NEVER gets overridden by the AI during the demo scenarios.
* **Dev 4 (Backend):** Optimize DB queries, ensure Docker containers spin up flawlessly for the judges, and finalize API documentation (Swagger).
* **Dev 5 (Frontend):** Final UI/UX polish, smooth animations (micro-interactions), responsive design checks, and ensure the "WOW" factor is present.
