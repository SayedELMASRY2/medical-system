# 02. Business Overview

## Business Perspective
Materna is designed to transform prenatal care from a reactive, intermittent model to a proactive, continuous model. It leverages automation and AI to scale clinical operations without sacrificing patient safety.

### Business Problem
*   **Intermittent Monitoring:** Pregnant patients only see their doctors periodically. Life-threatening conditions like preeclampsia can develop rapidly between these visits.
*   **High Operational Overhead:** Clinical staff (nurses, midwives) spend countless hours conducting routine phone follow-ups to check on patients.
*   **Manual Data Entry:** Lab reports arrive as physical papers, PDFs, or images, requiring manual transcription into Electronic Health Records (EHR), which is slow and error-prone.

### Current Pain Points
*   Delayed detection of clinical anomalies.
*   Nurse burnout from repetitive follow-up tasks.
*   Lack of 24/7 patient support.

### Proposed Solution
An automated, patient-facing application that collects daily health metrics and lab reports, evaluates them instantly using a deterministic risk engine, and surfaces high-risk patients to a clinical dashboard, all while providing an AI assistant to handle routine patient queries.

### Target Users
*   **Primary:** Obstetric Clinics, Hospitals, and Maternity Wards (B2B).
*   **End Users:** Pregnant Patients, Doctors, Midwives.

### Business Goals
1.  **Reduce Malpractice & Clinical Risk:** Catch complications early before they become emergencies.
2.  **Increase Clinic Capacity:** Automate triage so the same number of staff can manage a larger pool of patients.
3.  **Enhance Patient Satisfaction:** Provide a modern, app-based care experience with 24/7 AI support.

### Business Value
*   **Cost Reduction:** Less time spent on manual data entry and routine phone calls.
*   **Revenue Generation:** Enables clinics to bill for Remote Patient Monitoring (RPM) codes.
*   **Competitive Advantage:** Clinics offering "continuous AI monitoring" stand out in the healthcare market.

### Main Use Cases
1.  **Automated Daily Monitoring:** Patient submits vitals -> System calculates risk -> Doctor is alerted if high risk.
2.  **Lab Report Digitization:** Patient uploads PDF lab report -> System extracts data via Vision AI.
3.  **24/7 Patient Support:** Patient asks a medical question -> AI Assistant searches guidelines and provides a reassuring answer.

### Expected Outcomes
*   Significant reduction in undetected prenatal complications.
*   Decrease in administrative hours per patient.
*   Higher patient engagement rates.

---

## Business Flow
**The End-to-End Clinic Journey:**

1.  **Onboarding:** A clinic registers a new pregnant patient (PATIENT role) into the Materna system.
2.  **Daily Engagement:** The patient receives a reminder to log their vitals (Blood Pressure, Weight, Symptoms) via the Next.js web app.
3.  **Automated Processing (The Value Add):** 
    *   The backend receives the data and immediately runs it through the Deterministic Risk Engine.
    *   *No human intervention is required at this stage.*
4.  **Triage & Alerting:** 
    *   If the system detects a safe, low-risk state, the data is simply logged.
    *   If the system detects a danger (e.g., high BP + severe headache), it generates a Triage Alert.
5.  **Clinical Review:** The Doctor logs into the system in the morning, opens the Triage Dashboard, and instantly sees a prioritized list of only the patients who require attention today.
6.  **AI Support:** Concurrently, if the patient has questions about diet or uploads a new lab report, the LangGraph AI Assistant handles the interaction, extracting the data and providing guidance, further reducing the burden on the clinic's phone lines.
