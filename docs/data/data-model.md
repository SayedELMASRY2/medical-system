# Longitudinal Data Model

## Core Concept
The Materna system treats a pregnancy as a longitudinal timeline spanning roughly 40 weeks. Data is not simply a snapshot; rather, it is a sequence of observations that provide context and trend information.

## Data Types
- **Pregnancy Info**: LMP, EDD, multiple gestation, static baseline parameters.
- **Gestational Week**: The fundamental unit of time on the X-axis for all measurements.
- **Symptoms**: Categorical or subjective severity (e.g., headaches, blurred vision).
- **Vital Signs**: Numerical parameters captured repeatedly (Blood Pressure, Heart Rate, Weight, Temperature).
- **Lab Results**: Point-in-time chemical or biological analyses (Proteinuria, Platelets).
- **Medications & Historical Measurements**: Historical context shaping baseline risks.

## Record Structure
The system flattens data access through a generalized time-series approach:
- `patient_id` / `pregnancy_id`
- `measurement_type` (vital, lab, symptom)
- `value` (numeric or categorical)
- `unit`
- `timestamp`
- `gestational_week`
- `source`

## Time-Series Storage Design for PostgreSQL
Data is normalized into dedicated tables (`vital_signs`, `symptoms`, `lab_results`), allowing efficient B-Tree indexing on `(pregnancy_id, gestational_week)`. This allows rapid reconstruction of a patient's timeline via SQL JOINs or UNIONs.

## Gestational-Age-Specific Reference Ranges
Measurements such as BP or fundal height are evaluated dynamically. A value that is normal at Week 12 might be an anomaly at Week 36. The data model inherently ties every observation to its gestational week to facilitate age-specific validation and risk evaluation.
