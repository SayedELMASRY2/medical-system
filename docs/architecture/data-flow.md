# Data Flow Architectures

## Flow 1: Patient Onboarding & Pregnancy Registration
```mermaid
sequenceDiagram
    Patient->>PatientApp: Submit Details
    PatientApp->>API: POST /patients
    API->>Validation: Validate Pydantic Model
    Validation->>PatientService: Create Patient
    PatientService->>PregnancyService: Init Pregnancy Timeline
    PregnancyService->>PostgreSQL: INSERT
```

## Flow 2: Daily Check-In (Symptoms + Vitals)
```mermaid
sequenceDiagram
    Patient->>PatientApp: Submit Check-in
    PatientApp->>API: POST /checkin
    API->>Validation: Validate
    Validation->>API: Normalization
    API->>PostgreSQL: Store Vital/Symptom
    API->>TimelineService: Update Timeline
    TimelineService->>RiskEngine: Check Thresholds
    alt Threshold Violated
        RiskEngine-->>API: Trigger Risk Analysis
    end
```

## Flow 3: Lab Report Processing
```mermaid
sequenceDiagram
    User->>PatientApp: Upload PDF
    PatientApp->>API: POST /labs/upload
    API->>DocumentProcessing: Send PDF
    DocumentProcessing->>DocumentProcessing: Extract text (pdfplumber/OCR)
    DocumentProcessing-->>API: Structured Results
    API->>PostgreSQL: Store Lab Results
    API->>TimelineService: Update Timeline
```

## Flow 4: Risk Analysis Pipeline (Core Flow)
```mermaid
sequenceDiagram
    Trigger->>TimelineService: Initiate Analysis
    TimelineService->>TimelineService: Build Patient Timeline
    TimelineService->>TrendEngine: Extract Features
    TrendEngine->>RiskEngine: Evaluate Rules
    RiskEngine-->>LangGraph: Risk Level + Deterministic Data
    LangGraph->>Supervisor: Route Tasks
    Supervisor->>TimelineAgent: Temporal Context
    Supervisor->>RAGAgent: Retrieve Evidence
    Supervisor->>TriageAgent: Generate Explanation
    LangGraph-->>API: Persist Assessment
    API-->>Frontend: SSE Stream
    alt HIGH PRIORITY
        API->>AlertService: Smart Escalation
    end
```

## Flow 5: Evidence Retrieval (Hybrid RAG)
```mermaid
sequenceDiagram
    RAGAgent->>RAGModule: Query
    RAGModule->>RAGModule: Query Expansion
    par Vector Search
        RAGModule->>pgvector: Cosine Similarity (top-20)
    and Keyword Search
        RAGModule->>BM25: Keyword Match (top-20)
    end
    RAGModule->>RAGModule: Reciprocal Rank Fusion (k=60)
    RAGModule->>Cohere: Reranking (top-5)
    Cohere-->>RAGModule: Reranked Evidence
    RAGModule-->>RAGAgent: Selected Evidence + Citations
```

## Data Lifecycle Rules
- **Immutable Clinical Records:** Once written, vitals and assessments are append-only. Corrections require a new entry.
- **Cascade Deletion:** Patient deletion cascades to pregnancies, timelines, and assessments.
- **Audit Trail:** All risk assessments and the deterministic data used to generate them are permanently logged.
