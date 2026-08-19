# 🧠 Multi-Agent Architecture (Timeline-First)

The Materna CDSS AI layer utilizes a robust **Timeline-First** multi-agent topology using LangGraph. This ensures that every interaction is grounded in longitudinal clinical context before any routing or medical reasoning occurs.

## The 5-Node Topology

```mermaid
flowchart TD
    %% Styling
    classDef agent fill:#1e40af,stroke:#60a5fa,stroke-width:2px,color:white;
    classDef engine fill:#b91c1c,stroke:#f87171,stroke-width:2px,color:white;
    classDef start fill:#047857,stroke:#34d399,stroke-width:2px,color:white;
    classDef decision fill:#6b7280,stroke:#9ca3af,stroke-width:2px,color:white;

    User(["User Input: Text / OCR / Vitals"]):::start --> Cache{"Is there NEW clinical data?"}:::decision
    
    subgraph S0 ["Phase 1: Context Building"]
        Cache -- "Yes (New Data)" --> Timeline["Agent 0: Timeline Agent <br> Rebuilds JSON Trends"]:::agent
        Cache -- "No (Just Chatting)" --> Fetch["Fetch Cached Context <br> from DB (0.1s)"]:::decision
        Timeline --> SuperInput
        Fetch --> SuperInput
    end
    
    subgraph S1 ["Phase 2: Orchestration"]
        SuperInput("Full AgentState") --> Supervisor["Agent 1: Supervisor <br> Determines Route strictly"]:::agent
    end
    
    subgraph S2 ["Phase 3: Medical & Safety Evaluation"]
        Supervisor -- "Route: Medical Query" --> Triage["Risk Engine / Triage <br> Evaluates Strict Rules"]:::engine
        Supervisor -- "Route: Medical Query" --> RAG["Agent 2: Medical RAG <br> Fetches Guidelines"]:::agent
        
        Triage -- "🔴 Critical Emergency (e.g. Bleeding)" --> FastTrack(("Fast-Track <br> Skip RAG Delay")):::engine
    end
    
    subgraph S3 ["Phase 4: Generation & Escalation"]
        RAG --> Chat["Agent 4: Chat Response <br> Safe Natural Language Gen"]:::agent
        Triage -. "Safe / Warning" .-> Chat
        FastTrack --> Chat
        Supervisor -- "Route: General Chat" --> Chat
        
        Chat --> Output(["Send Safe Response to User"]):::start
        Triage -. "If High Risk" .-> Dash(["Alert Doctor Dashboard"]):::engine
    end
```

## Agents Overview

1. **Agent 0: Timeline Agent**
   - **Role**: Longitudinal summarization.
   - **Action**: Converts raw vitals and history into a structured `TimelineContext`.

2. **Agent 1: Supervisor (Router)**
   - **Role**: Traffic Controller.
   - **Action**: Receives the `TimelineContext` and user message, then routes the flow. Does NOT perform medical reasoning.

3. **Agent 2: Medical RAG Agent**
   - **Role**: Knowledge Retrieval.
   - **Action**: Queries the `pgvector` database for WHO/ACOG guidelines.

4. **Agent 3: Triage / Risk Engine**
   - **Role**: Safety & Deterministic Logic.
   - **Action**: Applies hardcoded thresholds (e.g., BP > 160). Can trigger the "Fast-Track" emergency escape hatch.

5. **Agent 4: Chat Response Agent**
   - **Role**: Natural Language Generation.
   - **Action**: Synthesizes the final message to the patient, ensuring empathetic tone and strict adherence to the triage safety level.
