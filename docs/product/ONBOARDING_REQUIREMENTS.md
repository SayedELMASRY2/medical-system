# Patient Onboarding Requirements (Baseline Profile)

Before the patient can start logging daily check-ins, the system requires an initial onboarding process to establish her baseline. This baseline is absolutely critical for the **Risk Engine** and **AI Agents** to accurately assess risk (e.g., a blood pressure of 130/80 is normal for some, but a dangerous spike for a patient whose baseline was 90/60).

## 📝 Required Baseline Data

### 1. Personal & Physical Basics (البيانات الأساسية والجسدية)
*   **Age (العمر):** Advanced maternal age (> 35 years) is a primary risk factor for preeclampsia and gestational diabetes.
*   **Height (الطول):** Used to calculate BMI.
*   **Pre-pregnancy Weight (الوزن قبل الحمل):** To establish baseline BMI and track total pregnancy weight gain accurately.
*   **Baseline Blood Pressure (الضغط المعتاد):** If known, before or early in pregnancy.

### 2. Pregnancy Details (تفاصيل الحمل الحالي)
*   **Expected Date of Delivery (EDD) / Last Menstrual Period (LMP):** Used to dynamically calculate the current **Gestational Week**. (The Risk Engine applies different rules depending on the trimester).
*   **Fetal Count (عدد الأجنة):** Single, Twins, or Multiples. (Twins drastically increase preeclampsia risk).

### 3. Medical History (التاريخ المرضي المزمن)
*   **Chronic Hypertension (ضغط دم مزمن):** Pre-existing before pregnancy.
*   **Pre-existing Diabetes (سكر مزمن):** Type 1 or Type 2.
*   **Kidney Disease or Autoimmune (أمراض الكلى أو المناعة):** E.g., Lupus, which increases complication risks.

### 4. Obstetric History (تاريخ الحمل السابق)
*   **Gravida/Para (عدد مرات الحمل والولادة السابقة):** First-time mothers (Nulliparous) have a higher baseline risk for preeclampsia.
*   **Previous Preeclampsia (تسمم حمل سابق):** Did she have preeclampsia in a previous pregnancy?
*   **Previous Gestational Diabetes (سكر حمل سابق):** Yes/No.

### 5. Family History (التاريخ العائلي)
*   **Family History of Preeclampsia:** (Mother or sister had it).

---

## ⚙️ System Impact

*   **Risk Engine (Dev 3):** Uses this data to set the mathematical baseline. For example, if a patient marks "Previous Preeclampsia", the engine might automatically lower the threshold for triggering a Yellow Alert from 140/90 to 135/85.
*   **AI Timeline Agent (Dev 1):** Contextualizes daily logs against this baseline. (e.g., "Patient is 35 years old with twins, making her recent sudden weight gain highly concerning for preeclampsia.")
*   **Backend (Dev 4):** Needs to create a `PatientProfile` table linked to the `User` table to store this static/semi-static data.
