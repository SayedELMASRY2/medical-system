# ADR-004: Implementation of RAG for Medical Evidence

## Status: Accepted
## Date: 2026-08-17

## Context
A core tenet of the Materna CDSS is that it must explain its findings using trusted medical evidence. Large Language Models (LLMs) contain broad medical knowledge, but their training data may be outdated, they cannot provide verifiable citations, and they are prone to hallucinating sources. For a clinical system, evidence must be traceable, verifiable, and drawn directly from current, trusted guidelines (e.g., ACOG, WHO).

## Decision
We will implement a hybrid Retrieval-Augmented Generation (RAG) system to supply the Triage Agent with medical evidence. The system will use:
- Vector search for semantic matching.
- BM25 for keyword matching.
- A reranker to ensure the most relevant clinical guidelines are surfaced.
- Strict citation traceability linking the LLM output directly to the retrieved source documents.

## Consequences

**Positive:**
- **Traceability:** Every piece of evidence presented to the doctor can be traced back to a specific, verifiable source document.
- **Up-to-date Knowledge:** Clinical guidelines can be updated in the vector database without requiring costly retraining or fine-tuning of the LLM.
- **Reduced Hallucinations:** Grounding the LLM's explanation in retrieved text significantly reduces the likelihood of fabricated medical claims.

**Negative:**
- **Latency:** The retrieval process adds latency to the overall response time of the AI analysis pipeline.
- **Complexity:** Requires managing a vector database, embedding models, and chunking strategies for complex medical documents.

## Alternatives Considered
- **Relying on LLM Internal Knowledge:** Rejected due to unacceptable risks of hallucination and the inability to provide verifiable, up-to-date citations.
- **Fine-Tuning:** Fine-tuning an LLM on medical guidelines. Rejected because it is expensive, difficult to update as guidelines change, and still does not guarantee exact, verifiable citations in the output.
