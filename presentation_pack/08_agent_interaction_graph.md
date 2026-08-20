# 08. Agent Interaction Graph

## Agent Dependency & Communication
In Materna, agents do not communicate with each other via internal APIs or direct messaging. Instead, they interact via a **Shared State Modification** pattern managed by LangGraph. 

*   **Control Flow:** Orchestration is predefined by a Directed Acyclic Graph (DAG) built with `StateGraph(AgentState)`.
*   **Data Flow:** Each node (Agent) receives the current `AgentState`, processes it, and returns a dictionary of updates. LangGraph merges these updates into the central `AgentState` before passing it to the next node.

### Agent Dependency Breakdown
*   **RAG Agent** depends on the **Supervisor** to generate an optimized `search_query`.
*   **Triage Agent** depends heavily on the **Deterministic Risk Engine** to provide the `deterministic_risk_level` and `evaluated_rules`.
*   **Synthesizer Agent** depends on *all previous nodes*, consuming the RAG citations, the triage alert, and the routing decision to formulate the final response.

## Agent Interaction Diagram

```mermaid
flowchart TD
    %% Define Agents
    Sup[Supervisor Agent \n (Intent Extraction)]
    Time[Timeline Agent \n (Mock)]
    RAG[RAG Agent \n (Citation Retrieval)]
    Risk[Risk Engine \n (Deterministic)]
    Triage[Triage Agent \n (Alert Generation)]
    Synth[Synthesizer Agent \n (Final Response)]

    %% Shared State
    State[(Shared AgentState \n JSON Object)]

    %% Interactions
    Sup -- "Updates: route, search_query" --> State
    State -- "Reads: search_query" --> RAG
    
    RAG -- "Updates: retrieved_citations" --> State
    State -- "Reads: lab_results" --> Risk
    
    Risk -- "Updates: risk_level, evaluated_rules" --> State
    State -- "Reads: risk_level, evaluated_rules" --> Triage
    
    Triage -- "Updates: triage_explanation" --> State
    
    State -- "Reads: route, citations, \ntriage_explanation, lab_results, history" --> Synth
    Synth -- "Updates: final_chat_response" --> State

    %% Control Flow highlighting
    Sup -. "Triggers" .-> Time
    Time -. "Triggers" .-> RAG
    RAG -. "Triggers" .-> Risk
    Risk -. "If High Risk" .-> Triage
    Risk -. "If Low Risk" .-> Synth
    Triage -. "Triggers" .-> Synth
```
