# 20. Presentation Diagrams Aggregation

This document aggregates all Mermaid diagrams generated in the previous documents, providing a single source for the presentation builder to copy/paste visual assets.

---

### Diagram 1: System Architecture (from Document 05)
*   **Purpose:** Show the high-level technical layout of the system.
*   **When to use it:** Technical Overview slides.

```mermaid
flowchart TD
    Client[Next.js Frontend \n Patients & Doctors]
    
    subgraph Backend Container [FastAPI Backend - Docker]
        API[API Gateway / Routers \n /api/v1/]
        Auth[JWT Auth Middleware \n deps.py]
        
        subgraph Business Logic Layer
            RiskEngine[Deterministic Risk Engine \n Pure Python]
            CRUD[CRUD Operations \n SQLAlchemy Async]
        end
        
        subgraph AI Agent Layer [LangGraph Orchestrator]
            Supervisor[Supervisor Router]
            RAG[Hybrid RAG Agent]
            Synthesizer[LLM Synthesizer]
            OCR[OCR Pipeline \n pypdf / Vision LLM]
        end
    end
    
    subgraph Storage Container [PostgreSQL - Docker]
        DB[(PostgreSQL + pgvector)]
    end
    
    subgraph External Services
        OpenAI[OpenAI API \n LLM / Vision]
    end

    Client -- "HTTP REST & SSE" --> API
    API --> Auth
    Auth --> RiskEngine
    Auth --> CRUD
    Auth --> Supervisor
    API --> OCR
    RiskEngine --> CRUD
    CRUD <--> DB
    Supervisor --> RAG
    RAG --> Synthesizer
    Supervisor --> Synthesizer
    Synthesizer <--> OpenAI
    OCR <--> OpenAI
```

---

### Diagram 2: Agent Architecture & Workflows (from Document 06/07)
*   **Purpose:** Explain the sequential AI flow inside the LangGraph state machine.
*   **When to use it:** Deep dive into the AI Chat Assistant capabilities.

```mermaid
sequenceDiagram
    participant User
    participant StreamAPI as /chat/stream
    participant Supervisor
    participant RAG as RAG Agent
    participant Risk as Risk Engine
    participant Synth as Synthesizer
    
    User->>StreamAPI: Message + (Optional OCR Data)
    StreamAPI->>Supervisor: Init AgentState
    
    Supervisor->>Supervisor: Prompt LLM for Intent
    alt Casual Intent
        Supervisor-->>Synth: Route directly
    else Medical Intent
        Supervisor->>RAG: search_query
        RAG->>RAG: HybridRetriever.retrieve()
        RAG->>Risk: citations + lab_data
        Risk->>Risk: Deterministic Evaluation
        
        alt High Risk
            Risk->>Synth: Risk Level + Triage Alert
        else Low Risk
            Risk->>Synth: Risk Level
        end
    end
    
    Synth->>Synth: Synthesize Context
    Synth-->>StreamAPI: final_chat_response
    StreamAPI-->>User: SSE Chunked Response
```

---

### Diagram 3: Data Flow (from Document 09)
*   **Purpose:** Show how clinical data moves from user input to storage.
*   **When to use it:** Explaining data privacy, security, and persistence.

```mermaid
flowchart LR
    subgraph Client
        UI_Vitals[Vitals Form]
        UI_Doc[Lab Document Upload]
    end

    subgraph API Gateway
        API_Vitals[POST /vitals]
        API_Upload[POST /chat/upload]
    end

    subgraph Processing
        Engine[Risk Engine]
        OCR[OCR Extractor]
        LangGraph[AI Agents]
    end

    subgraph Storage
        DB[(PostgreSQL)]
    end

    UI_Vitals --> API_Vitals
    API_Vitals --> Engine
    Engine --> DB
    UI_Doc --> API_Upload
    API_Upload --> OCR
    OCR -- "JSON Extracted" --> LangGraph
    DB -. "Doctor Dashboard Read" .-> UI_Vitals
```

---

### Diagram 4: OCR Ingestion Pipeline (from Document 10)
*   **Purpose:** Highlight the complex logic behind the robust document parsing.
*   **When to use it:** AI technical deep dive.

```mermaid
flowchart TD
    Upload([File Upload]) --> Branch{Is PDF or Image?}
    
    Branch -- PDF --> PyPDF[pypdf: Extract Text]
    PyPDF --> LLM_Text[Generic LLM: Prompt for JSON]
    LLM_Text -- Success --> Return([Return JSON])
    LLM_Text -- Fails --> Regex[Regex Parser Fallback]
    Regex --> Return
    
    Branch -- Image --> B64[Base64 Encode]
    B64 --> Vision[Vision LLM OCR]
    Vision -- Success --> Return
    Vision -- Fails --> Fallback[Dynamic Hash Generator]
    Fallback --> Return
```

---

### Diagram 5: Backend API Flow (from Document 12)
*   **Purpose:** Show standard HTTP request lifecycle.
*   **When to use it:** Explaining standard non-AI backend operations.

```mermaid
sequenceDiagram
    participant Frontend
    participant API as Router (vitals.py)
    participant Auth as Auth (deps.py)
    participant Engine as DeterministicRiskEngine
    participant CRUD as Database Layer
    
    Frontend->>API: POST /patients/{id}/vitals
    API->>Auth: Depends(get_current_user)
    Auth->>CRUD: Fetch User
    CRUD-->>Auth: User Object
    Auth-->>API: Validated User
    API->>API: Check Role Authorization
    API->>Engine: evaluate(vitals)
    Engine-->>API: Risk Level
    API->>CRUD: db.add(checkin) & db.commit()
    CRUD-->>API: Saved Entity
    API-->>Frontend: 201 Created (JSON)
```

---

### Diagram 6: Database ERD (from Document 13)
*   **Purpose:** Show database relational structure.
*   **When to use it:** Data modeling discussions.

```mermaid
erDiagram
    USER {
        uuid id PK
        string email
        string hashed_password
        enum role
        boolean is_active
    }
    
    PATIENT_PROFILE {
        uuid id PK
        uuid user_id FK
        date last_menstrual_period
        int gestational_age_weeks
        enum risk_status
    }
    
    DAILY_CHECK_IN {
        uuid id PK
        uuid patient_id FK
        date checkin_date
        int systolic_bp
        int diastolic_bp
        float weight_kg
    }

    USER ||--o| PATIENT_PROFILE : "has one"
    PATIENT_PROFILE ||--o{ DAILY_CHECK_IN : "has many"
```
