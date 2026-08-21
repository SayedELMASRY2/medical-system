# 04. User Journeys

## Journey 1: The Daily Check-In (Happy Path)

**Actor:** Patient
↓
**Action:** Submits daily vitals (BP: 110/70, Weight: 65kg, Symptoms: None).
↓
**System (Frontend):** Next.js sends `POST /api/v1/patients/{id}/vitals` with JWT.
↓
**Processing (API/Backend):** 
1. Validates JWT and patient ownership.
2. Checks for duplicates today.
3. Saves vitals to PostgreSQL.
4. Calls `DeterministicRiskEngine.evaluate()`.
5. Engine returns `severity: low`.
6. Updates patient `risk_status` in DB.
↓
**Result:** Returns `201 Created` with `risk_assessment`.
↓
**UI Result:** Patient sees a "Thank you, your vitals are normal" success screen.

---

## Journey 2: The Critical Anomaly Detection (Alternative Path)

**Actor:** Patient
↓
**Action:** Submits daily vitals (BP: 160/100, Symptoms: Severe Headache).
↓
**System (Frontend):** Sends `POST /api/v1/patients/{id}/vitals`.
↓
**Processing (API/Backend):**
1. Validates and saves vitals.
2. `DeterministicRiskEngine.evaluate()` detects extreme BP and severe symptom.
3. Engine returns `severity: high` and triggers rules (e.g., "Severe Hypertension").
4. Updates patient `risk_status` in DB.
↓
**Result:** Returns `201 Created` with High Risk assessment.
↓
**UI Result:** Patient sees an alert: "Please contact your healthcare provider immediately." Doctor dashboard is instantly updated with this patient at the top of the Triage Queue.

---

## Journey 3: Doctor Triage Review

**Actor:** Doctor
↓
**Action:** Logs into the system in the morning and opens the Triage Dashboard.
↓
**System (Frontend):** Sends `GET /api/v1/dashboard/triage?min_severity=monitor`.
↓
**Processing (API/Backend):**
1. Validates Doctor JWT.
2. Queries database for patients ordered by `risk_status` severity.
↓
**Result:** Returns list of high-risk patients.
↓
**UI Result:** Doctor sees a prioritized list, clicks on the highest risk patient to view their timeline, and makes an informed phone call to the patient.

---

## Journey 4: AI Medical Inquiry & OCR

**Actor:** Patient
↓
**Action:** Uploads a PDF lab report and asks, "Are my protein levels normal?"
↓
**System (Frontend):** 
1. Sends PDF to `POST /api/v1/chat/upload`. 
2. Receives extracted JSON lab results.
3. Sends chat message + JSON context to `POST /api/v1/chat/stream`.
↓
**Processing (Agent / LLM):**
1. **Supervisor Node:** Identifies this as a medical query and routes to RAG.
2. **Timeline Agent:** (Pass-through).
3. **RAG Agent:** Retrieves clinical guidelines on proteinuria.
4. **Risk Engine:** Evaluates the lab results deterministically.
5. **Synthesizer Node:** Takes the user query, the OCR JSON data, and the RAG guidelines, and formulates a response using OpenAI.
↓
**Result:** SSE Stream of text chunks.
↓
**UI Result:** Patient sees the AI typing out a reassuring response explaining their exact lab values in the context of clinical guidelines.

---

## Journey 5: Failed Authentication (Failure Path)

**Actor:** Unauthorized User (or Patient trying to access another patient's data)
↓
**Action:** Attempts to GET `/api/v1/patients/OTHER_ID/vitals`.
↓
**System (Frontend):** Sends request with Patient A's JWT.
↓
**Processing (API/Backend):**
1. `get_current_user` decodes JWT (Valid).
2. Route logic checks: `if current_user.role == "PATIENT" and patient.user_id != current_user.id`.
3. Condition is met.
↓
**Result:** Raises `403 Forbidden` ("You can only view your own check-in history").
↓
**UI Result:** User sees an access denied message, preventing data leakage.
