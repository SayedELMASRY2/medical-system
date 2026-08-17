# Phases & Roadmap

This document outlines the execution plan for the Materna project, starting with the intensive 5-day MVP sprint, followed by the 8-week extended roadmap.

## 5-Day MVP Sprint Plan

### DAY 1 - Foundation
*   **Dev 1 (AI):** Set up LangGraph environment, define the `AgentState` schema, and build the Supervisor routing skeleton.
*   **Dev 2 (RAG):** Set up pgvector database, create the document ingestion pipeline skeleton, and establish the embedding pipeline.
*   **Dev 3 (Risk):** Build the pure Python Risk Engine skeleton, define the clinical rules framework, and hardcode initial threshold definitions.
*   **Dev 4 (Backend):** Initialize FastAPI project, configure Docker, design PostgreSQL schemas, set up Alembic migrations, and implement Auth + basic Patient/Pregnancy CRUD APIs.
*   **Dev 5 (Frontend):** Initialize Next.js app, configure Tailwind CSS, set up global layouts, build authentication pages, and implement basic routing.

### DAY 2 - Data Pipeline
*   **Dev 1 (AI):** Implement the Timeline Agent to process and format trend feature extraction for LLM consumption.
*   **Dev 2 (RAG):** Implement document chunking strategies, enrich chunks with metadata, and set up the BM25 lexical index.
*   **Dev 3 (Risk):** Implement specific clinical rules (e.g., blood pressure rules, symptom combination matrices) and gestational-age-specific thresholds.
*   **Dev 4 (Backend):** Build APIs for Symptoms, Vitals, Labs, and the Timeline construction logic (including data validation and normalization).
*   **Dev 5 (Frontend):** Build the Patient onboarding flow, pregnancy profile UI, and the daily check-in form for symptoms and vitals.

### DAY 3 - AI Core
*   **Dev 1 (AI):** Implement the Triage Agent, integrate the RAG Agent, connect the full LangGraph workflow, and begin SSE streaming setup.
*   **Dev 2 (RAG):** Implement Hybrid retrieval (pgvector + BM25), add the reranking step, and establish the citation chaining logic.
*   **Dev 3 (Risk):** Integrate the Risk Assessment engine with the backend, refine signal combination logic, and finalize escalation rules.
*   **Dev 4 (Backend):** Implement Risk API, Analysis API, Evidence API, Doctor Dashboard API, and setup alert persistence in PostgreSQL.
*   **Dev 5 (Frontend):** Build the patient risk status display, implement timeline visualization charts, and design evidence cards.

### DAY 4 - Integration
*   **Dev 1 (AI):** Finalize end-to-end agent workflow, format AI explanations for frontend consumption, and harden error handling.
*   **Dev 2 (RAG):** Finalize evidence display pipeline, verify sources, and format citations perfectly for the frontend.
*   **Dev 3 (Risk):** Conduct edge case testing, validate rules against test datasets, and verify the escalation flow logic.
*   **Dev 4 (Backend):** Finalize SSE streaming endpoints, perform backend integration testing, and seed the database with demo scenarios.
*   **Dev 5 (Frontend):** Build the Doctor dashboard, patient list sorting, alert notifications, and integrate SSE real-time updates.

### DAY 5 - QA + Demo
*   **All Devs:** Comprehensive bug fixing, system testing, UI/UX polish, generation of a compelling demo dataset, finalize documentation, and presentation preparation.

---

## 8-Week Extended Roadmap (Post-MVP)

*   **M1: Foundation (Week 1)**
    *   Stabilize MVP codebase.
    *   Setup staging and production cloud environments.
    *   Enhance CI/CD pipelines and test coverage.

*   **M2: Core Data & Pipeline (Week 2)**
    *   Expand data models to include complex lab results and ultrasound metadata.
    *   Implement HL7/FHIR compatibility layers for future EMR integration.

*   **M3: AI & Risk Intelligence (Week 3)**
    *   Expand the RAG knowledge base with comprehensive clinical guidelines.
    *   Refine LangGraph prompts for higher accuracy and conciseness.
    *   Implement advanced temporal reasoning in the Risk Engine.

*   **M4: Pregnancy Care Room (Week 4)**
    *   Enhance the Doctor Dashboard with detailed collaborative tools.
    *   Add secure messaging between patient and care team.

*   **M5: Longitudinal Intelligence (Week 5)**
    *   Implement advanced predictive analytics based on population-level trends (anonymized).
    *   Refine the Trend Engine's sensitivity and specificity to reduce alert fatigue.

*   **M6: Clinical Evaluation (Week 6)**
    *   Shadow deployment with clinical partners.
    *   Gather qualitative feedback on AI explanation utility.
    *   Tune risk thresholds based on real-world edge cases.

*   **M7 - M8: Hardening, Voice Input, Advanced Features (Weeks 7-8)**
    *   Implement the "WOW" feature: Voice input in Egyptian Arabic for symptom logging.
    *   Rigorous security audits (HIPAA compliance readiness).
    *   Performance optimization and final launch preparations.
