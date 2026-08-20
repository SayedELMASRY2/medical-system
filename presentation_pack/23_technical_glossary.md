# 23. Technical Glossary

## LangGraph
*   **Meaning:** A framework by LangChain for building stateful, multi-actor applications with LLMs.
*   **How it is used:** It orchestrates the AI chat in Materna. It defines the flow from Supervisor -> RAG -> Risk Engine -> Synthesizer, managing the shared `AgentState`.

## Deterministic Risk Engine
*   **Meaning:** An algorithm that produces the exact same output for a given input, without randomness or AI.
*   **How it is used:** A Python class that evaluates vitals (BP, Heart Rate) against hardcoded thresholds to determine if a patient is high-risk.

## RAG (Retrieval-Augmented Generation)
*   **Meaning:** A technique that grounds an LLM's response by feeding it relevant documents retrieved from a database before it generates an answer.
*   **How it is used:** The `rag_agent_node` fetches medical citations and injects them into the `AgentState`, so the Synthesizer LLM bases its advice on real medical guidelines rather than generic pre-training data.

## JWT (JSON Web Token)
*   **Meaning:** A compact, URL-safe means of representing claims securely between two parties.
*   **How it is used:** Patients and Doctors receive a JWT upon login. They send it in the `Authorization` header to access protected endpoints like submitting vitals or viewing the dashboard.

## pgvector
*   **Meaning:** An open-source vector similarity search extension for PostgreSQL.
*   **How it is used:** It allows Materna to store vector embeddings (mathematical representations of text) directly inside the relational database, enabling the RAG agent to find similar medical guidelines.

## SSE (Server-Sent Events)
*   **Meaning:** A technology where a browser receives automatic updates from a server via an HTTP connection.
*   **How it is used:** Used in `/api/v1/chat/stream` to stream the AI's response chunk-by-chunk to the Next.js frontend, creating a real-time typing effect.
