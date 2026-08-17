# Materna AI Agents Overview

## Agent Taxonomy

The Materna AI system follows a strict, minimized agent taxonomy to reduce complexity and ensure deterministic control over critical path execution. We define **4 core agents**:

1. **Supervisor Agent**: Orchestrates workflow and routing.
2. **Timeline Agent**: Analyzes longitudinal data.
3. **Medical RAG Agent**: Retrieves verified medical evidence.
4. **Triage Agent**: Synthesizes and explains clinical context.

Unless there is a strong architectural justification, no additional agents should be introduced. This constraint ensures predictability and auditability in the system's operation.

## AgentNode Protocol

All agents must implement the standard `AgentNode` protocol. This provides a unified interface for the LangGraph orchestrator:

```python
from typing import Protocol
from state import AgentState

class AgentNode(Protocol):
    async def process(self, state: AgentState) -> AgentState:
        ...
```

## System Prompt Constraints

**CRITICAL RULE:** All agents *must* include the following common CDSS system prompt prefix to ensure compliance with medical safety standards:

> "You are part of a Clinical Decision Support System for pregnancy monitoring. You do NOT diagnose patients. You do NOT prescribe medications. You provide structured analysis to support clinical evaluation by qualified healthcare professionals."

## Agent Taxonomy Table

| Agent Name | Model | Responsibility | Input | Output |
| --- | --- | --- | --- | --- |
| **Supervisor** | GPT-4o-mini | Route tasks, coordinate workflow | Incoming event, partial state | RoutingDecision, next agent |
| **Timeline** | GPT-4o-mini | Longitudinal data & trend analysis | Patient history, current vitals | TimelineAnalysis, trend features |
| **Medical RAG** | GPT-4o-mini | Medical evidence retrieval | Risk signals, clinical context | EvidenceCollection (verified) |
| **Triage** | GPT-4o | Clinical explanation & synthesis | Full context, risk level, evidence | ExplainableRiskSignal |

## Agent Testing Strategy

All agents are subject to a rigorous, multi-tiered testing strategy:
- **Unit Tests**: Mocked inputs to verify Pydantic model parsing and deterministic output structure.
- **Contract Tests**: Verification that the `AgentNode` protocol and input/output contracts are strictly met.
- **Integration Tests**: Running agents through a simulated LangGraph execution pipeline with mock risk engine outputs.
- **Safety Tests**: Adversarial prompt injection tests and strict verification that the LLM *never* sets the risk score independently.

## Safety Constraints

1. **No Autonomous Diagnosis**: Agents must never output a diagnosis.
2. **Immutable Risk Levels**: The LLM cannot change or influence the risk score calculated by the deterministic Risk Assessment Engine.
3. **No Prescriptions**: The system must never recommend medications or therapeutic interventions.
4. **Traceability**: All medical claims must be cited using the Medical RAG Agent's output.
