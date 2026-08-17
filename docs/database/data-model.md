# Database Data Model Specifications

This document outlines the purpose, schema rules, and definitions for all 16 entities in the Materna system.

## Entities
1. **users**: System actors (doctors, patients, admins). Email is unique.
2. **patients**: Core demographics. Doctor ID is nullable (SET NULL).
3. **pregnancies**: The primary longitudinal hub linking all events and observations to a gestational timeline. Cascade on delete from patient.
4. **pregnancy_events**: Timeline events logging any significant change.
5. **symptoms**: Subjective patient-reported or doctor-observed issues, normalized by week.
6. **vital_signs**: Quantitative measurements per gestational week. Core inputs for risk engine.
7. **lab_reports**: PDFs or raw data extracts. Status tracks OCR/ETL pipelines.
8. **lab_results**: Normalized key-value measurements extracted from lab reports.
9. **risk_assessments**: Point-in-time calculation by the AI system indicating pregnancy risk based on the current week's inputs.
10. **risk_signals**: Sub-components of an assessment pinpointing specific anomalies.
11. **clinical_rules**: Logic definitions evaluated during risk assessment.
12. **medical_documents**: Source reference guidelines used for RAG operations.
13. **document_chunks**: Vectorized components of medical documents.
14. **evidence**: Explainability links connecting AI outputs in assessments to grounded medical documents.
15. **alerts**: High-level notifications triggered by critical risk assessments.
16. **doctor_reviews**: Feedback loop where a doctor reviews alerts and marks actions.

## State Transition Diagrams

### Pregnancy Status
`active` -> `delivered` -> `postpartum` -> `archived`

### Risk Assessment Status
`pending` -> `running` -> `completed` / `failed`

## JSONB Schemas
- **medical_history**: `{ "conditions": ["string"], "surgeries": ["string"] }`
- **chronic_conditions**: `[{"condition": "string", "diagnosed_year": "number"}]`
- **input_summary**: `{"vitals": {}, "labs": {}, "symptoms": {}}`
- **trend_features**: `{"systolic_bp_trend": "increasing", "consecutive_high_bp": 3}`
- **rule_results**: `[{"rule_id": "string", "passed": boolean}]`
- **ai_explanation**: `{"summary": "string", "confidence_score": 0.95}`
- **conditions**: Logic DSL for rules engine.
- **event_data** & **signal_data**: Flexible schema for storing context payload.

## Validation Rules
- Gestational week must be between 0 and 42.
- BP must follow medical plausibility (e.g., Systolic > Diastolic, ranges 50-250).
- Lab result units must conform to standardized lists.
