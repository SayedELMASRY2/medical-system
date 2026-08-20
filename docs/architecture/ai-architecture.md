# AI Subsystem Architecture

## Layered Design
1. **Input Layer:** Patient demographics, vitals, symptoms, labs, risk engine outputs.
2. **LangGraph Orchestration:** Manages state transitions, agent routing, and memory.
3. **Agent Layer:** Supervisor, Triage, RAG, Timeline.
4. **Tool Layer:** Database access, vector search, guideline retrieval.
5. **LLM Layer:** GPT-4o, GPT-4o-mini.

## Agent Specifications

### 1. Supervisor / Orchestrator Agent
- **Role:** Routes tasks, coordinates workflow, manages shared state.
- **Constraint:** NOT a medical decision maker.
- **Model:** GPT-4o-mini (Temperature: 0.1)
- **Outputs:** Routing decisions, state updates.

### 2. Triage Agent
- **Role:** Synthesizes patient context, clinical rules, trends, and RAG evidence into a cohesive clinical explanation.
- **Inputs:** Patient context, pregnancy week, deterministic rule results, historical data, RAG evidence.
- **Model:** GPT-4o (Temperature: 0.2)
- **Outputs:** Structured clinical explanation.

### 3. Medical RAG Agent
- **Role:** Formulates queries and retrieves relevant medical evidence from approved guidelines (WHO, ACOG, etc.).
- **Constraint:** Does NOT make final risk decisions.
- **Model:** GPT-4o-mini (Temperature: 0.1)
- **Outputs:** Retrieved chunks, citation metadata.

### 4. Timeline Agent
- **Role:** Analyzes longitudinal data, compares current vs. historical states, detects trends.
- **Model:** GPT-4o-mini (Temperature: 0.1)
- **Outputs:** Structured temporal features and trend analysis.

## LLM Configuration

| Agent | Model | Temperature | Max Tokens |
|-------|-------|-------------|------------|
| Supervisor | gpt-4o-mini | 0.1 | 500 |
| Triage | gpt-4o | 0.2 | 2000 |
| RAG | gpt-4o-mini | 0.1 | 1000 |
| Timeline | gpt-4o-mini | 0.1 | 1500 |

## Prompt Engineering Standards
Every prompt must include the CDSS safety prefix:
> "You are an AI assistant within Materna, a Clinical Decision Support System. You do not make autonomous diagnoses. Your role is to explain the deterministic risk assessment provided to you based on evidence. Always maintain a professional, objective tone."

## Output Schemas (Pydantic)
```python
class ExplanationOutput(BaseModel):
    summary: str
    clinical_reasoning: List[str]
    evidence_citations: List[str]
    recommended_next_steps: List[str]
    risk_level_acknowledgement: str
```

## Failure Modes & Fallbacks
- **LLM Timeout/Error:** System gracefully degrades to displaying ONLY the deterministic Risk Engine output (e.g., "Risk: HIGH PRIORITY - Blood pressure exceeds 160/110").
- **Empty RAG Retrieval:** Triage agent explicitly notes that no specific guideline was retrieved and relies solely on basic medical principles and rule explanations.

## SSE Streaming Event Taxonomy
- `agent_started`: Agent begins execution.
- `agent_thinking`: Intermediate reasoning steps or tool calls.
- `agent_complete`: Agent finishes its specific task.
- `analysis_complete`: Final payload delivered to the client.

## CDSS Safety Guardrails
- **No Overrides:** The LLM cannot change a 🔴 HIGH PRIORITY flag to 🟢 LOW.
- **Mandatory Disclaimers:** UI must clearly state "AI-generated explanation. Review with a clinician."
