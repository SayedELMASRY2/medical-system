# ADR-007: Architecture with Four Core Agents

## Status: Accepted
## Date: 2026-08-17

## Context
The previous architectural iteration of the generic medical platform included five or more distinct agents, including a 'Critic' to review findings and a 'Judge' to resolve diagnostic debates. While this debate-style architecture might be suitable for complex, ambiguous differential diagnoses, it proved to be overengineered, slow, and prone to endless loops for the focused task of longitudinal pregnancy monitoring. Materna requires a streamlined, reliable, and faster pipeline.

## Decision
We will simplify the AI architecture to use exactly four core agents, each with a single, clear responsibility:
1. **Supervisor Agent:** Handles routing, state management, and orchestration of the other agents within the LangGraph.
2. **Timeline Agent:** Specializes in temporal analysis, calculating deltas, and identifying trends in longitudinal data.
3. **Triage Agent:** Synthesizes findings, structures the final explanation of the deterministic risk level, and formats the output for the UI.
4. **RAG Agent:** Dedicated exclusively to retrieving and formatting medical evidence from the vector database.

## Consequences

**Positive:**
- **Separation of Concerns:** Each agent has a clearly defined, narrow scope, making them easier to prompt, test, and debug.
- **Performance:** Fewer agents mean fewer LLM calls, reducing overall system latency and cost.
- **Manageable Complexity:** The interactions between four agents are significantly easier to orchestrate and monitor, which is critical for delivering a stable MVP within a 5-day timeframe.
- **Clear Ownership:** Easy to assign development tasks per agent.

**Negative:**
- **Less Internal Validation:** Removes the 'Critic' agent, meaning the system relies more heavily on the deterministic Rule Engine and the RAG constraints to ensure accuracy, rather than an LLM double-checking another LLM.

## Alternatives Considered
- **More Specialized Agents:** E.g., separate agents for vitals, symptoms, and labs. Rejected as it increases orchestration complexity and latency without significant qualitative benefit.
- **Fewer Agents:** Combining Timeline and Triage into one agent. Rejected because it muddles responsibilities and makes the prompt too complex, increasing the risk of instruction drift.
- **Single Monolithic Agent:** Rejected because it loses all modularity and makes it impossible to run tasks (like timeline analysis and evidence retrieval) in parallel.
