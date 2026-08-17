# Daily Patient Check-in Requirements

To ensure comprehensive longitudinal monitoring and accurate risk assessment for maternal health (e.g., Preeclampsia, Gestational Diabetes), the system requires a **Daily Check-in Form** for the patient. 

This data will be consumed by the **Timeline Agent** to detect behavioral and physical trends, and by the **Risk Engine** to flag immediate clinical dangers.

## 📝 Required Data Fields

### 1. Basic Vitals (القياسات الحيوية)
*   **Weight (الوزن):** Crucial for detecting sudden fluid retention (a primary sign of preeclampsia).
*   **Blood Pressure (ضغط الدم):** Systolic and Diastolic readings (e.g., 120/80).
*   **Blood Sugar (سكر الدم - Optional):** Fasting or post-prandial (crucial for Gestational Diabetes patients).

### 2. Nutrition & Hydration (التغذية والسوائل)
*   **Diet Quality (نوعية الأكل):** Free-text summary or tags (e.g., High Protein, High Carbs, High Sodium, Balanced).
*   **Hydration (معدل شرب المياه):** Number of cups or liters consumed today.

### 3. Lifestyle & Activity (المجهود والنشاط)
*   **Physical Activity Level (مستوى المجهود):** Dropdown (Resting, Light/Walking, Moderate/Exercise, Strenuous).
*   **Sleep Quality (جودة النوم):** Hours of sleep and quality (Poor, Fair, Good).

### 4. Medications & Supplements (العلاجات والمكملات)
*   **Prenatal Vitamins & Minerals:** (Iron, Calcium, Folic Acid) - Checkboxes.
*   **Specific Medications:** (e.g., Low-dose Aspirin, Labetalol for BP, Insulin) - Dynamic list based on patient profile.

### 5. Symptoms & Warning Signs (الأعراض وعلامات الخطر)
*   **Swelling / Edema (تورم):** Hands, Face, or Legs. (Sudden swelling in face/hands is a red flag).
*   **Headache (صداع):** None, Mild, Severe/Unrelenting.
*   **Vision Changes (زغللة/تغير في الرؤية):** Yes/No.
*   **Abdominal Pain (ألم في البطن):** Especially right upper quadrant (liver area).
*   **Vaginal Bleeding/Spotting (نزيف):** Yes/No.

### 6. Fetal Monitoring (متابعة الجنين) *Applicable if > 28 Weeks*
*   **Fetal Movement (حركة الجنين):** Normal, Decreased, None. (Kick counts can be an optional numeric field).

---

## ⚙️ System Impact & Team Tasks

*   **Frontend (Dev 5):** Needs to build a user-friendly, multi-step daily form (wizard style) using sliders, toggles, and simple inputs to make it easy for pregnant women to fill out in < 2 minutes.
*   **Backend (Dev 4):** Needs to update the PostgreSQL schema (`PatientCheckIn` model) to store these fields.
*   **Risk Engine (Dev 3):** Needs rules to catch critical combinations (e.g., High Sodium Diet + Sudden Weight Gain + Mild Headache -> Yellow Alert).
*   **AI Timeline Agent (Dev 1):** Needs to summarize weekly trends (e.g., "Patient has been consistently under-hydrated for 4 days, leading to increased mild headaches").
