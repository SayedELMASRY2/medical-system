# 21. Presentation Content Map

## Slide 1: Title & Vision
*   **Purpose:** Introduce Materna.
*   **Content:**
    *   System Name: Materna AI CDSS.
    *   One-line value proposition: "Automating prenatal risk detection and remote triage."

## Slide 2: The Problem
*   **Purpose:** Set the stage for why this system was built.
*   **Content:**
    *   Intermittent clinical visits leave blind spots.
    *   Routine follow-up calls drain clinical staff.
    *   Manual data entry of lab reports is inefficient.

## Slide 3: The Solution (High-Level)
*   **Purpose:** Explain the core concept simply.
*   **Content:**
    *   Patient app for daily vitals and chat.
    *   Instant deterministic risk classification.
    *   Doctor dashboard for prioritized triage.

## Slide 4: System Architecture
*   **Purpose:** Show the technical foundation.
*   **Content:**
    *   Include Diagram 1 (System Architecture).
    *   Next.js + FastAPI + Postgres `pgvector`.

## Slide 5: The Deterministic Risk Engine
*   **Purpose:** Explain the clinical safety layer.
*   **Content:**
    *   How it works: Synchronous, Non-LLM, Rule-based.
    *   Business value: Mitigates malpractice risk.

## Slide 6: The AI Agent Architecture (LangGraph)
*   **Purpose:** Deep dive into the AI capabilities.
*   **Content:**
    *   Include Diagram 2 (Agent Architecture).
    *   Explain the Supervisor -> RAG -> Synthesizer flow.

## Slide 7: OCR & Lab Report Ingestion
*   **Purpose:** Showcase advanced AI features.
*   **Content:**
    *   Include Diagram 4 (OCR Pipeline).
    *   Hybrid approach: `pypdf` + Vision LLM.

## Slide 8: Technical Decisions & Trade-offs
*   **Purpose:** Demonstrate architectural thought process.
*   **Content:**
    *   Monolithic Async vs Microservices.
    *   Deterministic Rules vs LLM Decision Making.

## Slide 9: End-to-End Value (Summary)
*   **Purpose:** Conclude the presentation.
*   **Content:**
    *   Higher patient engagement.
    *   Reduced clinical overhead.
    *   Proactive risk mitigation.
