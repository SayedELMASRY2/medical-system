# Database Entity-Relationship Diagram

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        user_role role
        VARCHAR full_name
        VARCHAR specialty
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    patients {
        UUID id PK
        UUID doctor_id FK
        VARCHAR full_name
        DATE date_of_birth
        VARCHAR blood_type
        VARCHAR rh_factor
        INT gravidity
        INT parity
        JSONB medical_history
        JSONB allergies
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
        TIMESTAMPTZ deleted_at
    }

    pregnancies {
        UUID id PK
        UUID patient_id FK
        UUID doctor_id FK
        DATE lmp_date
        DATE estimated_due_date
        pregnancy_status status
        risk_level risk_level
        BOOLEAN is_multiple
        JSONB chronic_conditions
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    pregnancy_events {
        UUID id PK
        UUID pregnancy_id FK
        INT gestational_week
        event_type event_type
        JSONB event_data
        TIMESTAMPTZ event_date
    }

    symptoms {
        UUID id PK
        UUID pregnancy_id FK
        INT gestational_week
        VARCHAR symptom_code
        TEXT description
        symptom_severity severity
        VARCHAR duration
        VARCHAR source
        TIMESTAMPTZ recorded_at
    }

    vital_signs {
        UUID id PK
        UUID pregnancy_id FK
        INT gestational_week
        INT systolic_bp
        INT diastolic_bp
        FLOAT heart_rate
        FLOAT temperature
        FLOAT weight_kg
        FLOAT fundal_height_cm
        INT fetal_heart_rate
        VARCHAR edema_grade
        VARCHAR urine_protein
        TIMESTAMPTZ recorded_at
    }

    lab_reports {
        UUID id PK
        UUID pregnancy_id FK
        TEXT report_file_url
        extraction_status extraction_status
        DATE report_date
        TIMESTAMPTZ created_at
    }

    lab_results {
        UUID id PK
        UUID lab_report_id FK
        VARCHAR test_name
        VARCHAR test_code
        FLOAT value
        VARCHAR unit
        FLOAT ref_range_low
        FLOAT ref_range_high
        lab_result_status status
        INT gestational_week
        TIMESTAMPTZ created_at
    }

    risk_assessments {
        UUID id PK
        UUID pregnancy_id FK
        INT gestational_week
        risk_level risk_level
        JSONB input_summary
        JSONB trend_features
        JSONB rule_results
        JSONB ai_explanation
        analysis_status status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ completed_at
    }

    risk_signals {
        UUID id PK
        UUID risk_assessment_id FK
        VARCHAR signal_code
        TEXT signal_description
        VARCHAR rule_id
        signal_severity severity
        JSONB signal_data
        TIMESTAMPTZ created_at
    }

    clinical_rules {
        UUID id PK
        VARCHAR rule_id UK
        VARCHAR rule_name
        TEXT description
        JSONB conditions
        signal_severity output_severity
        TEXT source_reference
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    medical_documents {
        UUID id PK
        VARCHAR title
        VARCHAR organization
        VARCHAR document_type
        TEXT source_url
        JSONB metadata
        TIMESTAMPTZ ingested_at
    }

    document_chunks {
        UUID id PK
        UUID document_id FK
        INT chunk_index
        TEXT content
        VECTOR embedding
        VARCHAR section
        INT page_number
        JSONB metadata
    }

    evidence {
        UUID id PK
        UUID risk_assessment_id FK
        UUID chunk_id FK
        VARCHAR source_title
        VARCHAR organization
        VARCHAR section
        TEXT retrieved_content
        FLOAT relevance_score
        TIMESTAMPTZ created_at
    }

    alerts {
        UUID id PK
        UUID pregnancy_id FK
        UUID risk_assessment_id FK
        alert_priority priority
        VARCHAR title
        TEXT description
        BOOLEAN is_acknowledged
        TIMESTAMPTZ created_at
    }

    doctor_reviews {
        UUID id PK
        UUID alert_id FK
        UUID doctor_id FK
        TEXT review_notes
        review_action action_taken
        TIMESTAMPTZ reviewed_at
    }

    users ||--o{ patients : "manages"
    users ||--o{ pregnancies : "monitors"
    users ||--o{ doctor_reviews : "creates"
    
    patients ||--o{ pregnancies : "has"
    
    pregnancies ||--o{ pregnancy_events : "contains"
    pregnancies ||--o{ symptoms : "experiences"
    pregnancies ||--o{ vital_signs : "records"
    pregnancies ||--o{ lab_reports : "has"
    pregnancies ||--o{ risk_assessments : "undergoes"
    pregnancies ||--o{ alerts : "triggers"
    
    lab_reports ||--o{ lab_results : "contains"
    
    risk_assessments ||--o{ risk_signals : "generates"
    risk_assessments ||--o{ evidence : "uses"
    risk_assessments ||--o{ alerts : "causes"
    
    medical_documents ||--o{ document_chunks : "split into"
    document_chunks ||--o{ evidence : "referenced in"
    
    alerts ||--o{ doctor_reviews : "reviewed in"

```

## Description

The Materna database centers on `pregnancies`, tying a `patient` to temporal measurements like `vital_signs`, `symptoms`, and `lab_reports`. The `risk_assessments` table captures longitudinal evaluation by processing trends and features, producing `risk_signals` and `alerts`. AI insights use `evidence` sourced from vector `document_chunks` belonging to `medical_documents`. Cascade deletes ensure clean longitudinal records when a core entity is removed.
