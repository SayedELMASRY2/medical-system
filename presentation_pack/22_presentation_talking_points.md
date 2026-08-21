# 22. Presentation Talking Points

## Topic: System Architecture
*   **Point 1:** We chose an Asynchronous FastAPI backend because it allows a single container to efficiently juggle slow I/O tasks like LLM inference and database queries without blocking other users.
*   **Point 2:** Our database is Postgres, but we specifically use the `pgvector` extension. This prevents us from having to manage and pay for a separate vector database just for our RAG feature.
*   **Point 3:** The entire application is containerized with Docker, meaning it can be deployed on a standard VM or a Kubernetes cluster with zero code changes.

## Topic: Dual-Layer Intelligence
*   **Point 1:** We have a strict separation of concerns when it comes to "Intelligence". We never let the LLM make medical diagnoses.
*   **Point 2:** Clinical safety is handled by a Deterministic Risk Engine. It’s pure Python math. If blood pressure is over 140, it flags the patient. Period. No hallucination risk.
*   **Point 3:** We reserve the LLM for what it’s good at: extracting text via OCR, retrieving relevant guidelines, and synthesizing reassuring, conversational text for the patient.

## Topic: The OCR Pipeline
*   **Point 1:** When a user uploads a lab report, we don't just blindly send it to a Vision LLM. We first try to extract the text locally using `pypdf`, which is incredibly fast and free.
*   **Point 2:** We only fall back to the expensive Vision LLM if the document is an image format.
*   **Point 3:** We force the LLM to output strict JSON, which we parse and inject into the LangGraph state so the AI Agent can reason about the specific numerical values.

## Topic: Business Value
*   **Point 1:** By automating the daily check-ins, we are effectively multiplying the capacity of the nursing staff. They only spend time on patients who the system flags as high-risk.
*   **Point 2:** The system provides a "premium" feel to patients, giving them a 24/7 AI companion that is context-aware of their actual lab results and vitals history.
