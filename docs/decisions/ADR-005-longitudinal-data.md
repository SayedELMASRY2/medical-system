# ADR-005: Centrality of Longitudinal Data Architecture

## Status: Accepted
## Date: 2026-08-17

## Context
Pregnancy monitoring is inherently a longitudinal process spanning approximately 40 weeks. Evaluating a single point in time (e.g., one blood pressure reading) provides limited clinical value compared to observing trends (e.g., blood pressure trending upward over three consecutive weeks). The core problem Materna solves is detecting these subtle, developing changes between visits that might indicate emerging risks like preeclampsia. Therefore, the data model and the AI analysis must be fundamentally oriented around time and gestational progress.

## Decision
We will design the entire data model, API layer, and UI around longitudinal records. 
- Gestational week (and day) will serve as the primary temporal axis for all data points (vitals, symptoms, labs).
- The Timeline Agent will be explicitly designed to analyze deltas and trends across this temporal axis, rather than just evaluating isolated incidents.

## Consequences

**Positive:**
- **Clinical Relevance:** Aligns the system's architecture with actual obstetric care, enabling the detection of crucial trends and patterns.
- **Rich Context:** Provides the AI agents (and the doctors) with a complete, contextualized history of the pregnancy, improving the quality of explanations and risk assessments.

**Negative:**
- **Storage Complexity:** Requires database schemas optimized for time-series data and event logging.
- **Query Complexity:** Retrieving and formatting data for the frontend timeline and the AI agents is more complex than fetching simple user profiles.
- **Frontend Complexity:** Demands robust charting and timeline visualization components on the client side.

## Alternatives Considered
- **Snapshot-based Analysis:** Only analyzing the most recent data submitted by the patient. Rejected because it misses the primary clinical value of a monitoring system—detecting negative trends before they become acute emergencies.
