# Database Schema

## PostgreSQL DDL Script

This script initializes the Materna database, creating necessary extensions, custom ENUM types, tables, and indexes.

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Custom ENUM Types
CREATE TYPE user_role AS ENUM ('doctor', 'patient', 'admin');
CREATE TYPE pregnancy_status AS ENUM ('active', 'delivered', 'postpartum', 'archived');
CREATE TYPE risk_level AS ENUM ('low', 'monitor', 'clinical_review', 'high_priority');
CREATE TYPE extraction_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE lab_result_status AS ENUM ('normal', 'abnormal_low', 'abnormal_high', 'critical');
CREATE TYPE analysis_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE symptom_severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE alert_priority AS ENUM ('low', 'monitor', 'clinical_review', 'high_priority');
CREATE TYPE review_action AS ENUM ('acknowledged', 'scheduled_followup', 'referred', 'emergency');
CREATE TYPE signal_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE event_type AS ENUM ('visit', 'symptom', 'vital', 'lab', 'alert');

-- Tables

-- 1. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR NOT NULL,
    specialty VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR NOT NULL,
    date_of_birth DATE NOT NULL,
    blood_type VARCHAR,
    rh_factor VARCHAR,
    gravidity INT,
    parity INT,
    medical_history JSONB DEFAULT '{}',
    allergies JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. pregnancies
CREATE TABLE pregnancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lmp_date DATE,
    estimated_due_date DATE,
    status pregnancy_status NOT NULL DEFAULT 'active',
    risk_level risk_level DEFAULT 'low',
    is_multiple BOOLEAN DEFAULT false,
    chronic_conditions JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. pregnancy_events
CREATE TABLE pregnancy_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    gestational_week INT,
    event_type event_type NOT NULL,
    event_data JSONB DEFAULT '{}',
    event_date TIMESTAMPTZ DEFAULT NOW()
);

-- 5. symptoms
CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    gestational_week INT,
    symptom_code VARCHAR NOT NULL,
    description TEXT,
    severity symptom_severity,
    duration VARCHAR,
    source VARCHAR DEFAULT 'patient_reported',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. vital_signs
CREATE TABLE vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    gestational_week INT,
    systolic_bp INT,
    diस्टलic_bp INT,
    heart_rate FLOAT,
    temperature FLOAT,
    weight_kg FLOAT,
    fundal_height_cm FLOAT,
    fetal_heart_rate INT,
    edema_grade VARCHAR,
    urine_protein VARCHAR,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. lab_reports
CREATE TABLE lab_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    report_file_url TEXT,
    extraction_status extraction_status DEFAULT 'pending',
    report_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. lab_results
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_report_id UUID REFERENCES lab_reports(id) ON DELETE CASCADE,
    test_name VARCHAR NOT NULL,
    test_code VARCHAR,
    value FLOAT,
    unit VARCHAR,
    ref_range_low FLOAT,
    ref_range_high FLOAT,
    status lab_result_status,
    gestational_week INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. risk_assessments
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    gestational_week INT,
    risk_level risk_level,
    input_summary JSONB DEFAULT '{}',
    trend_features JSONB DEFAULT '{}',
    rule_results JSONB DEFAULT '[]',
    ai_explanation JSONB DEFAULT '{}',
    status analysis_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 10. risk_signals
CREATE TABLE risk_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_assessment_id UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
    signal_code VARCHAR NOT NULL,
    signal_description TEXT,
    rule_id VARCHAR,
    severity signal_severity,
    signal_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. clinical_rules
CREATE TABLE clinical_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR UNIQUE NOT NULL,
    rule_name VARCHAR NOT NULL,
    description TEXT,
    conditions JSONB DEFAULT '{}',
    output_severity signal_severity,
    source_reference TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. medical_documents
CREATE TABLE medical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    organization VARCHAR,
    document_type VARCHAR,
    source_url TEXT,
    metadata JSONB DEFAULT '{}',
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. document_chunks
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES medical_documents(id) ON DELETE CASCADE,
    chunk_index INT,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    section VARCHAR,
    page_number INT,
    metadata JSONB DEFAULT '{}'
);

-- 14. evidence
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_assessment_id UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    source_title VARCHAR,
    organization VARCHAR,
    section VARCHAR,
    retrieved_content TEXT,
    relevance_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregnancy_id UUID REFERENCES pregnancies(id) ON DELETE CASCADE,
    risk_assessment_id UUID REFERENCES risk_assessments(id) ON DELETE CASCADE,
    priority alert_priority NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    is_acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. doctor_reviews
CREATE TABLE doctor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    review_notes TEXT,
    action_taken review_action,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes

-- B-tree on all foreign keys
CREATE INDEX idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX idx_pregnancies_patient_id ON pregnancies(patient_id);
CREATE INDEX idx_pregnancies_doctor_id ON pregnancies(doctor_id);
CREATE INDEX idx_pregnancy_events_pregnancy_id ON pregnancy_events(pregnancy_id);
CREATE INDEX idx_symptoms_pregnancy_id ON symptoms(pregnancy_id);
CREATE INDEX idx_vital_signs_pregnancy_id ON vital_signs(pregnancy_id);
CREATE INDEX idx_lab_reports_pregnancy_id ON lab_reports(pregnancy_id);
CREATE INDEX idx_lab_results_lab_report_id ON lab_results(lab_report_id);
CREATE INDEX idx_risk_assessments_pregnancy_id ON risk_assessments(pregnancy_id);
CREATE INDEX idx_risk_signals_risk_assessment_id ON risk_signals(risk_assessment_id);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_evidence_risk_assessment_id ON evidence(risk_assessment_id);
CREATE INDEX idx_evidence_chunk_id ON evidence(chunk_id);
CREATE INDEX idx_alerts_pregnancy_id ON alerts(pregnancy_id);
CREATE INDEX idx_alerts_risk_assessment_id ON alerts(risk_assessment_id);
CREATE INDEX idx_doctor_reviews_alert_id ON doctor_reviews(alert_id);
CREATE INDEX idx_doctor_reviews_doctor_id ON doctor_reviews(doctor_id);

-- Custom B-tree Indexes
CREATE INDEX idx_pregnancies_patient_status ON pregnancies(patient_id, status);
CREATE INDEX idx_vital_signs_preg_week ON vital_signs(pregnancy_id, gestational_week);
CREATE INDEX idx_symptoms_preg_week ON symptoms(pregnancy_id, gestational_week);
CREATE INDEX idx_risk_assessments_preg_created ON risk_assessments(pregnancy_id, created_at);
CREATE INDEX idx_alerts_preg_ack ON alerts(pregnancy_id, is_acknowledged);

-- GIN trigram index
CREATE INDEX idx_patients_full_name_trgm ON patients USING GIN (full_name gin_trgm_ops);

-- IVFFlat for vector search
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Alembic Migration Guide
Run `alembic init alembic` to create a new migration environment. Configure `alembic.ini` with the database URI. Define SQLAlchemy models matching the DDL, and use `alembic revision --autogenerate -m "Initial schema"` to create the migration script. Finally, apply with `alembic upgrade head`.

## Seed Data Specifications
Seed data should include:
- 1 Admin user, 3 Doctors, 10 Patients.
- 10 Active Pregnancies (one for each patient, various gestational weeks).
- Representative vital signs, symptoms, and lab results over time.
- Sample clinical rules.
- Simulated risk assessments and alerts based on the demo scenario (e.g., preeclampsia progression).
