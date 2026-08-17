# Product Requirements Document (PRD): Materna

## Product Vision
**Materna** is an AI-powered longitudinal pregnancy monitoring and early-warning system. It aims to eliminate the "blind spots" between scheduled prenatal visits by continuously tracking patient vitals and symptoms, identifying dangerous trends, and intelligently escalating critical cases to healthcare providers. 

## Clinical Problem Statement
Standard prenatal care involves sporadic visits. A patient might have normal blood pressure at week 20, but develop gradually increasing blood pressure by week 24, peaking dangerously at week 26. Without longitudinal tracking, subtle changes (like a creeping BP accompanied by a mild headache) are often missed until they become emergencies (e.g., Preeclampsia). 

## Target Users
*   **Obstetrician-Gynecologist (OB-GYN) / Clinician:** Needs a prioritized dashboard to quickly identify which patients require immediate attention, accompanied by clear, evidence-based reasoning.
*   **Midwife / Care Coordinator:** Monitors a larger panel of patients and conducts initial triage.
*   **Expectant Mother (Patient):** Needs a simple, reassuring interface to log daily vitals and symptoms.

## Product Positioning
Materna is strictly a **Clinical Decision Support System (CDSS)**. It is an assistive tool that augments the capabilities of healthcare providers by organizing data and highlighting risks. It is **not** an autonomous diagnostic tool.

## Core Features
1. **Pregnancy Profile Management:** Tracking gestational age, baseline vitals, and preexisting conditions.
2. **Daily Check-in:** A patient-facing interface for logging symptoms and vitals (e.g., blood pressure, weight).
3. **Longitudinal Timeline:** A unified, chronological view of the patient's data.
4. **Trend Detection:** System automatically calculates rolling averages, sudden spikes, and rates of change.
5. **Deterministic Clinical Rules:** Hardcoded thresholds (e.g., Systolic BP > 140) to guarantee safety.
6. **Risk Assessment:** 4 distinct levels:
    *   🟢 LOW / STABLE
    *   🟡 MONITOR
    *   🟠 CLINICAL REVIEW
    *   🔴 HIGH PRIORITY
7. **AI-Powered Explanation:** LangGraph agents synthesize *why* a patient is flagged (e.g., "Patient's BP has increased 15% over 3 days, accompanied by new-onset visual disturbances").
8. **Medical RAG Evidence:** Citations from medical literature (e.g., ACOG guidelines) supporting the risk flag.
9. **Smart Escalation:** Routing the alert to the appropriate provider based on severity.
10. **Doctor Dashboard:** Real-time (SSE) prioritized list of patients.
11. **Patient Risk Status View:** A limited, safe view for patients (e.g., "Please contact your doctor").

## Example Scenario
*   **Day 1-14:** Patient logs normal BP (110/70) and normal symptoms. System status: 🟢 LOW.
*   **Day 15:** Patient logs BP of 135/85 (below strict hypertension threshold) but notes a mild headache.
*   **System Action:** Trend engine detects a 22% upward shift in BP. Risk Engine flags the combination of rising BP + headache.
*   **System Status:** 🟠 CLINICAL REVIEW. 
*   **AI Action:** Triage Agent generates an explanation noting the rapid trend. RAG Agent pulls preeclampsia warning signs.
*   **Doctor Dashboard:** Patient is pushed to the top of the queue.

## What the System Must NEVER Do
*   **NEVER Diagnose:** It must not state "Patient has Preeclampsia." It must state "Data matches risk patterns associated with hypertensive disorders of pregnancy."
*   **NEVER Prescribe:** It must not suggest medications.
*   **NEVER Replace Doctors:** It is a filter and an early warning system, not a replacement for clinical judgment.

## Success Metrics
*   **Technical:** 
    *   99% accuracy in deterministic rule evaluation.
    *   AI explanation generation < 5 seconds.
    *   Zero hallucinations of medical guidelines (enforced via strict RAG grounding).
*   **MVP Execution:** Delivering all core features in a 5-day hackathon window.

## MVP Scope (5-Day Plan Summary)
A functional prototype demonstrating the end-to-end DETECT → EXPLAIN → ESCALATE pipeline using synthetic patient data, a working FastAPI backend, LangGraph orchestration, pgvector RAG, and a Next.js frontend showing both Patient and Doctor views.

## Optional WOW Feature
*   **Voice Input in Egyptian Arabic:** Allowing patients to log symptoms via voice, transcribed and translated into structured data for the backend to process.

## Safety Requirements
*   Explicit CDSS disclaimers on all UIs.
*   Audit logging of all data changes and system alerts.
*   Risk engine logic must be fully unit-tested and isolated from the LLM.
