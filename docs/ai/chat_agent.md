# 💬 Agent 4: Chat Response Agent

The Chat Response Agent is the **only** agent in the Materna CDSS that communicates directly with the patient. It serves as the final Natural Language Generation (NLG) step.

## Core Responsibility
To generate a safe, empathetic, and medically accurate response to the patient based strictly on the outputs of the preceding agents (RAG, Triage, Supervisor). It must NEVER invent medical advice.

## Input Context
It receives the full `AgentState` after all prior agents have executed:
1. `timeline`: The patient's longitudinal context.
2. `triage`: The deterministic risk level and hard rules triggered.
3. `retrieved_citations`: Medical evidence fetched by the RAG agent (if applicable).
4. `supervisor`: The initial route and reasoning.

## Guardrails & Output
* **Empathy:** Must acknowledge the patient's feelings.
* **Safety Protocol:** If `triage.highest_severity` is "high" or "clinical_review", the agent MUST explicitly instruct the patient to seek medical attention or inform them that their doctor has been notified.
* **Citation Adherence:** If the route was `medical_rag`, the response must be grounded entirely in `retrieved_citations`.
* **No Diagnosis:** The agent must never say "You have pre-eclampsia." It should say "Your blood pressure is elevated, which requires review."
