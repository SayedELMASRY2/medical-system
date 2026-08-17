# LangGraph Orchestration

## Overview
The workflow in Materna is coordinated using LangGraph's `StateGraph`. This allows for explicit, cyclic or acyclic routing of the `AgentState` between various deterministic and LLM-driven nodes.

## Graph Definition
The graph is typed with `StateGraph[AgentState]`. It dictates the exact execution topology, ensuring that the deterministic Risk Engine always runs before the explanatory Triage Agent.

## Node Definitions
1. **`supervisor_node`**: Parses inputs and initiates routing.
2. **`timeline_agent_node`**: Computes longitudinal trends.
3. **`risk_engine_node`**: **(Deterministic, NON-LLM)** Evaluates clinical rules and sets the `risk_level`.
4. **`triage_agent_node`**: Explains the risk based on the engine's output.
5. **`rag_agent_node`**: Fetches clinical evidence.
6. **`explanation_synthesizer`**: Simple fan-in node to combine Triage explanations with RAG citations.

## Edge Topology
The execution flow strictly follows:
- `START` → `supervisor`
- `supervisor` → `timeline_agent`
- `timeline_agent` → `risk_engine` (deterministic)
- `risk_engine` → `[triage_agent, rag_agent]` (Parallel Fan-out)
- `[triage_agent, rag_agent]` → `explanation_synthesizer` (Fan-in)
- `explanation_synthesizer` → `END`

## Mermaid Graph Diagram

```mermaid
graph TD
    START((START)) --> Supervisor[Supervisor Node]
    Supervisor --> Timeline[Timeline Agent]
    Timeline --> RiskEngine{Risk Engine<br/>(Deterministic)}
    
    RiskEngine --> Triage[Triage Agent]
    RiskEngine --> RAG[RAG Agent]
    
    Triage --> Synth[Explanation Synthesizer]
    RAG --> Synth
    
    Synth --> END((END))
```

## StreamCallback for SSE Events
To provide real-time updates to the UI, the graph uses a custom streaming callback handler.

```python
from langchain_core.callbacks import BaseCallbackHandler

class StreamCallback(BaseCallbackHandler):
    def on_node_start(self, node_name: str, **kwargs):
        # Emit SSE: Agent started
        pass
        
    def on_node_end(self, node_name: str, output: dict, **kwargs):
        # Emit SSE: Agent finished
        pass
        
    def on_node_error(self, node_name: str, error: Exception, **kwargs):
        # Emit SSE: Agent failed
        pass
```

## Configuration & Error Handling
- **Timeouts**: Each LLM node has a strict 15-second timeout.
- **Retries**: Network errors trigger up to 2 retries with exponential backoff.
- **Partial Results**: If the RAG Agent fails but the Triage Agent succeeds, the graph proceeds to the `END` state with a `degraded` status, returning the explanation without citations.

## Code Structure Example

```python
from langgraph.graph import StateGraph, END
from state import AgentState

workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("timeline_agent", timeline_agent_node)
workflow.add_node("risk_engine", risk_engine_node)
workflow.add_node("triage_agent", triage_agent_node)
workflow.add_node("rag_agent", rag_agent_node)
workflow.add_node("explanation_synthesizer", explanation_synthesizer_node)

# Add edges
workflow.set_entry_point("supervisor")
workflow.add_edge("supervisor", "timeline_agent")
workflow.add_edge("timeline_agent", "risk_engine")
workflow.add_edge("risk_engine", "triage_agent")
workflow.add_edge("risk_engine", "rag_agent")
workflow.add_edge("triage_agent", "explanation_synthesizer")
workflow.add_edge("rag_agent", "explanation_synthesizer")
workflow.add_edge("explanation_synthesizer", END)

app = workflow.compile()
```
