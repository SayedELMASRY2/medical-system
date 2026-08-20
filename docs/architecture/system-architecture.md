# System Architecture

## C4 Context Diagram

```mermaid
C4Context
    title System Context for Materna

    Person(patient, "Expectant Mother", "Enters symptoms, vitals, logs daily updates")
    Person(doctor, "OB-GYN / Midwife", "Monitors patients, reviews alerts and risk assessments")
    
    System(materna, "Materna System", "AI-Powered Longitudinal Pregnancy Monitoring & Early-Warning CDSS")
    
    System_Ext(openai, "OpenAI API", "Provides LLM capabilities (GPT-4o)")
    System_Ext(cohere, "Cohere API", "Provides Reranking for RAG")
    
    Rel(patient, materna, "Submits daily check-ins, views timeline")
    Rel(doctor, materna, "Reviews high-priority escalations, views patient history")
    Rel(materna, openai, "Generates explanations, orchestrates agents")
    Rel(materna, cohere, "Reranks medical literature for retrieval")
```

## 7-Layer Architecture Breakdown

1. **Client Layer:** Patient App (mobile-first), Doctor Dashboard (desktop-optimized). Next.js UI components.
2. **API Gateway:** Nginx reverse proxy handling SSL, routing, and SSE support (proxy buffering disabled).
3. **API Layer:** FastAPI exposing RESTful endpoints and Server-Sent Events (SSE) streaming endpoints.
4. **Service Layer:** Core business logic (PatientService, PregnancyService, TimelineService, AnalysisService, EvidenceService).
5. **AI Orchestration Layer:** LangGraph coordinating 4 specialized agents.
6. **Risk Engine Layer:** Deterministic evaluation combining Clinical Rules, Thresholds, and the Trend Analyzer.
7. **Data Layer:** PostgreSQL with pgvector for relational data and time-series embeddings.

## Full System Block Diagram

```mermaid
graph TD
    subgraph Client Layer
        PA[Patient App]
        DD[Doctor Dashboard]
    end

    subgraph API Gateway
        Nginx[Nginx Reverse Proxy]
    end

    subgraph Backend API Layer
        FA[FastAPI Router]
        SSE[SSE Streamer]
    end

    subgraph Service Layer
        PS[Patient Service]
        TS[Timeline Service]
        AS[Analysis Service]
    end

    subgraph Risk Engine Layer
        RE[Rule Engine]
        TE[Trend Evaluator]
    end

    subgraph AI Orchestration Layer
        LG[LangGraph Orchestrator]
        SA[Supervisor Agent]
        TA[Triage Agent]
        RA[RAG Agent]
        TLA[Timeline Agent]
    end

    subgraph Data Layer
        DB[(PostgreSQL + pgvector)]
    end

    PA & DD --> Nginx
    Nginx --> FA & SSE
    FA --> PS & TS & AS
    AS --> RE & TE
    AS --> LG
    LG --> SA
    SA --> TA & RA & TLA
    PS & TS & RE --> DB
    RA --> DB
```

## Communication Patterns
- **REST (CRUD):** Standard synchronous requests for data fetching, user profiles, and manual inputs.
- **SSE (Server-Sent Events):** Asynchronous one-way streaming from Backend to Frontend to deliver real-time agent execution status and final AI explanations.
- **In-process:** Python service layer calls, LangGraph state transitions.

## End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    participant Doc as Doctor
    participant API as FastAPI
    participant PS as PregnancyService
    participant TS as TimelineService
    participant RE as RiskEngine
    participant LG as LangGraph
    participant DB as Database

    Doc->>API: Request Analysis
    API->>PS: Get Patient Data
    PS->>DB: Query
    DB-->>PS: Data
    API->>TS: Build Timeline
    TS->>DB: Query History
    DB-->>TS: History
    API->>RE: Evaluate Risk (Data + History)
    RE-->>API: Risk Level (e.g., HIGH PRIORITY)
    API->>LG: Trigger Orchestration
    LG->>LG: Agents Execute (Supervisor -> Triage, RAG, Timeline)
    LG-->>API: Stream Events
    API-->>Doc: SSE (agent_started, agent_thinking)
    LG-->>API: Final Explanation
    API->>DB: Persist Assessment
    API-->>Doc: SSE (analysis_complete)
```

## Scalability Considerations (Post-MVP)
- **Database Scaling:** Read replicas for PostgreSQL to handle intensive vector searches.
- **Async Workers:** Moving AI Orchestration to Celery/RabbitMQ if SSE connection holding becomes a bottleneck under high load.
- **Microservices:** Separating the Risk Engine into a standalone Go/Rust service for extremely high-throughput rule evaluation.
