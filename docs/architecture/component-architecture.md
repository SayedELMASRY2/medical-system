# Component Architecture

## Component Breakdown

- **Frontend Module:** Next.js 14 App Router, segmented into Patient routes (`/patient/*`) and Doctor routes (`/doctor/*`).
- **Backend API Module:** FastAPI routers handling validation and request lifecycle.
- **Service Layer:**
  - `PatientService`: Demographics, onboarding.
  - `PregnancyService`: Gestational tracking.
  - `TimelineService`: Aggregating temporal records.
  - `RiskService`: Invokes Risk Engine.
  - `AnalysisService`: Orchestrates the Risk Engine + AI workflow.
  - `EvidenceService`: Interfaces with RAG pipelines.
- **Risk Engine Module:** 
  - `RuleEngine`: Strict clinical thresholds.
  - `TrendAnalyzer`: Moving averages, variance.
  - `RiskClassifier`: Outputs LOW, MONITOR, CLINICAL REVIEW, HIGH PRIORITY.
- **AI Orchestration Module:** LangGraph state graph with Supervisor, Triage, Timeline, and RAG nodes.
- **RAG Module:** Ingestion scripts, embedding generation, vector search.
- **Document Processing Module:** PDF extraction (pdfplumber) and OCR (Tesseract) for lab reports.

## Frozen Inter-Component Contract Registry

To support 5-developer parallel work, interfaces are frozen:

| ID | Interface | Technology/Format | Description |
|---|---|---|---|
| **C-001** | Frontend ↔ Backend | OpenAPI 3.1, JSON | REST HTTP contracts for all CRUD operations. |
| **C-002** | Backend ↔ AI Orchestration | `AgentState` TypedDict | LangGraph state dictionary schema. |
| **C-003** | Backend ↔ Risk Engine | `RiskInput` → `RiskOutput` | Pydantic models for raw vitals to risk classification. |
| **C-004** | AI Agents ↔ RAG | `EvidenceQuery` → `EvidenceResult` | Query strings to structured chunk + citation lists. |
| **C-005** | Backend ↔ Database | SQLAlchemy Models | ORM definitions mapped to Postgres tables. |
| **C-006** | AI Agents ↔ Risk Engine | `TrendFeatures` + `RuleResults` | Deterministic outputs injected into AI prompts. |

## Component Interaction Matrix

| Caller \ Callee | Service Layer | Risk Engine | AI Orchestration | DB Layer |
|-----------------|---------------|-------------|------------------|----------|
| **API Layer** | Direct Call | - | - | - |
| **Service Layer** | Internal Call | Direct Call | Direct Call | SQLAlchemy |
| **AI Orchestration** | - | - | - | Tools/SQLAlchemy |

## Dependency Injection Patterns
FastAPI's `Depends()` is heavily utilized to inject database sessions, external API clients (OpenAI, Cohere), and core services into route handlers and background tasks, ensuring modularity and testability.
