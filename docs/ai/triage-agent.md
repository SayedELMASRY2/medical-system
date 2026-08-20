# Triage Agent Specification

## Purpose
The Triage Agent acts as the clinical synthesis engine. It interprets the patient's holistic context, combines signals, and structures a clear clinical explanation of the risk level. **It does NOT set the risk score.** It only explains the score provided by the deterministic Risk Assessment Engine.

## Model Configuration
- **Model**: `GPT-4o` (high capability required for nuanced clinical reasoning and explanation)
- **Temperature**: `0.2` (allows slight variation in natural language while maintaining clinical precision)

## Input
The Triage Agent receives the full context from the `AgentState`:
- Patient context (pregnancy profile, gestational week)
- Current symptoms
- Current vital signs
- Historical data
- Trend features (from Timeline Agent)
- Deterministic rule results (from Risk Engine)
- Medical evidence (from RAG Agent)

## Processing Logic
1. **Review Signals**: Ingest all incoming patient and temporal data.
2. **Ingest Risk Level**: Read the exact risk level determined by the Risk Engine (DO NOT modify).
3. **Generate Explanation**: Create a human-readable explanation of *why* the risk level was assigned, mapping signals to clinical guidelines.
4. **Structure Explanation**: Format output using clear bullet points.
5. **Highlight Key Factors**: Identify the most critical driving factors for the assigned risk level.
6. **Cite Evidence**: Append relevant medical citations retrieved from the RAG Agent.
7. **Recommendation Text**: Generate a standardized recommendation. If the risk is `HIGH PRIORITY`, the recommendation must *always* explicitly state: `"Clinical evaluation is recommended."`

## Output format
Generates an `ExplainableRiskSignal`.

## 🛑 MUST NEVER 🛑
- Change the risk level set by the Risk Engine under any circumstances.
- Claim "patient has disease X" (no diagnostic claims).
- Prescribe treatment or specific medications.
- Make autonomous diagnostic decisions.

## Example Output (BP + Headache Scenario)
```json
{
  "risk_level": "HIGH_PRIORITY",
  "explanation": "The patient is presenting with elevated blood pressure (145/95 mmHg) combined with a severe headache and visual disturbances at 32 weeks gestation. This combination of signals triggered the HIGH_PRIORITY alert.",
  "key_factors": [
    "Systolic BP > 140 and Diastolic BP > 90",
    "Presence of severe headache",
    "Presence of visual disturbances"
  ],
  "evidence_citations": [
    "[1] ACOG Practice Bulletin No. 222: Gestational Hypertension and Preeclampsia, Section 2, Page 4."
  ],
  "recommendation": "Clinical evaluation is recommended."
}
```

## System Prompt Template
```text
You are part of a Clinical Decision Support System for pregnancy monitoring. You do NOT diagnose patients. You do NOT prescribe medications. You provide structured analysis to support clinical evaluation by qualified healthcare professionals.

You are the Triage Agent. A deterministic Risk Engine has already assigned a risk level based on clinical rules.
Your ONLY job is to explain the reasoning behind this risk level using the patient's data and the provided medical evidence.
You must NOT alter the risk level.
Structure your explanation clearly. If the risk is HIGH PRIORITY, you must include the exact phrase 'Clinical evaluation is recommended.'
```

## Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import List

class ExplainableRiskSignal(BaseModel):
    risk_level: str = Field(description="The deterministic risk level passed from the engine")
    explanation: str = Field(description="Human-readable explanation of the risk factors")
    key_factors: List[str] = Field(description="Bullet points of the most critical factors")
    evidence_citations: List[str] = Field(description="Formatted citation strings mapping to RAG evidence")
    recommendation: str = Field(description="Standardized clinical recommendation")
```

## Testing Strategy
- **Prompt Injection Testing**: Verify that the Triage Agent refuses to output a diagnosis even if prompted by a mocked malicious input.
- **Risk Level Immutability Test**: Pass `LOW_RISK` from the engine alongside severe mock symptoms, and ensure the Triage Agent does *not* escalate the risk to `HIGH_PRIORITY` (it should explain the low risk while noting the symptoms).
