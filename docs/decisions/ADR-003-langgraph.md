# ADR-003: Use of LangGraph for Orchestration

## Status: Accepted
## Date: 2026-08-17

## Context
The Materna backend requires a robust framework to orchestrate multiple AI agents (Supervisor, Timeline, Triage, RAG). The workflow involves state management across these agents, parallel execution of tasks (e.g., retrieving evidence while analyzing timelines), streaming responses to the client for real-time UI updates, and graceful error handling. We need an orchestration layer that is flexible enough to handle complex routing logic but structured enough to maintain a reliable CDSS pipeline.

## Decision
We will use **LangGraph** as the primary orchestration framework for the AI agent workflows.

## Consequences

**Positive:**
- **State Management:** LangGraph provides a built-in, robust state graph that naturally models the flow of data between our agents.
- **Streaming:** First-class support for streaming events, allowing us to push real-time agent activity updates to the frontend via Server-Sent Events (SSE).
- **Concurrency:** Built-in parallel fan-out capabilities, improving overall system latency when multiple independent analyses are required.
- **Ecosystem:** Seamless integration with existing LangChain tools and utilities we are already utilizing.

**Negative:**
- **Learning Curve:** Introduces a specific paradigm (graph-based state machines) that requires the engineering team to adapt.
- **Overhead:** May introduce slight overhead compared to simple sequential function calls, though the benefits outweigh this for complex flows.

## Alternatives Considered
- **CrewAI:** Evaluated, but found to offer less fine-grained control over the execution flow and state management compared to LangGraph's explicit graph definitions.
- **AutoGen:** Evaluated, but considered too heavy and complex for our specific, tightly controlled workflow requirements.
- **Custom Orchestration:** Building a custom orchestrator using pure Python asyncio. Rejected because it would require significant effort to rebuild features (like state checkpointing and streaming) that LangGraph provides out-of-the-box, pulling focus away from the MVP features.
