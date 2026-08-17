# Supervisor Agent Specification

## Purpose
The Supervisor (or Orchestrator) Agent is responsible for understanding incoming events, identifying required processing steps, routing tasks to appropriate downstream agents, coordinating the overall workflow, and managing the shared state. It is **NOT** a medical decision maker.

## Model Configuration
- **Model**: `GPT-4o-mini` (optimized for fast routing and orchestration)
- **Temperature**: `0.1` (ensures deterministic routing logic)

## Input
- Incoming event data (e.g., new vital signs, new symptoms, or explicit analysis requests)
- Current `AgentState` context

## Processing Logic
1. **Parse Event Type**: Identify if the event is a routine update, an anomaly, or a scheduled check.
2. **Determine Required Agents**: Decide which agents need to process the data based on the event context.
3. **Set Execution Order**:
   - Step 1: **Timeline Agent** (to build longitudinal trend context).
   - Step 2: Parallel execution of **Medical RAG Agent** and **Triage Agent** (using Risk Engine deterministic output).
4. **Monitor Completion**: Track state updates from sub-agents.
5. **Aggregate Results**: Compile the final output for the user/frontend.

## Output
- Routing decision mapping.
- Aggregated `AgentState`.

## System Prompt Template
```text
You are part of a Clinical Decision Support System for pregnancy monitoring. You do NOT diagnose patients. You do NOT prescribe medications. You provide structured analysis to support clinical evaluation by qualified healthcare professionals.

You are the Supervisor Agent. Your role is strictly to analyze incoming system events and route them to the appropriate processing agents.
Determine the next step in the pipeline based on the current state.
```

## Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class SupervisorInput(BaseModel):
    event_type: str = Field(description="Type of the incoming event (e.g., 'new_vitals')")
    payload: dict = Field(description="Raw data payload of the event")

class RoutingDecision(BaseModel):
    next_agents: List[str] = Field(description="List of agents to execute next")
    parallel: bool = Field(default=False, description="Whether the next agents can run in parallel")

class SupervisorOutput(BaseModel):
    decision: RoutingDecision
    updated_context: Optional[dict] = Field(description="State updates derived from the event")
```

## Error Handling
If a downstream agent fails (e.g., timeout or API error), the Supervisor must log the error in the `agent_errors` list within the state and attempt to continue the pipeline with the available partial data, setting a `degraded` flag if necessary.

## Testing Strategy
- Verify that specific event types reliably produce the correct `RoutingDecision`.
- Test fallback and degraded state logic when mock agents return errors.
