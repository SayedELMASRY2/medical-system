# 17. End-to-End Scenarios

## Scenario 1: The Remote Vitals Submission (High Risk)
**Trigger:** A pregnant patient feels unwell at home.
↓
**User:** Patient logs into the Next.js frontend.
↓
**Frontend:** Patient enters a blood pressure of 165/110 and checks "Severe Headache" on the symptom list.
↓
**API:** Submits payload to `POST /api/v1/patients/{id}/vitals` with the user's JWT.
↓
**Service / Agent:** The backend intercepts the request and runs it through the `DeterministicRiskEngine`.
↓
**Processing:** The engine evaluates the 165 systolic BP against gestational age rules and determines a `high` risk severity. It triggers the "Severe Hypertension" rule.
↓
**Database:** The new vitals and the `high` risk status are committed to the PostgreSQL `daily_checkin` and `patient_profile` tables via SQLAlchemy.
↓
**Response:** Backend returns a `201 Created` with a `high` risk alert.
↓
**User:** The patient's app screen turns red, advising them to contact the hospital immediately. Simultaneously, the patient appears at the top of the Doctor's Triage Dashboard.

---

## Scenario 2: The Conversational Lab Review
**Trigger:** A patient receives a lab report PDF and wants to understand the results.
↓
**User:** Patient uploads the PDF to the chat interface and types "Are my labs okay?"
↓
**Frontend:** Uploads the file via `POST /chat/upload`.
↓
**API (OCR):** The backend uses `pypdf` to extract the text, and prompts an LLM to convert it to strict JSON (e.g., `{"Hemoglobin": "10.5 g/dL"}`).
↓
**Frontend:** Sends the extracted JSON and the chat message to `POST /chat/stream`.
↓
**Agent:** The LangGraph `materna_graph` is initialized.
↓
**Processing:**
1. **Supervisor** routes to `medical_rag`.
2. **RAG** retrieves citations regarding Hemoglobin levels in pregnancy.
3. **Risk Engine** evaluates the lab data.
4. **Synthesizer** compiles the RAG guidelines, the OCR JSON data, and the chat history into a massive prompt.
↓
**Response:** The Synthesizer streams the LLM's response back to the client.
↓
**User:** The patient reads a reassuring, medically-grounded explanation of their exact lab results.

---

## Scenario 3: The Clinical Morning Triage
**Trigger:** An Obstetrician starts their morning shift.
↓
**User:** Doctor logs into the Materna portal.
↓
**API:** Requests `GET /api/v1/dashboard/triage?min_severity=clinical_review` using their JWT.
↓
**Service:** The backend validates the `DOCTOR` role via `get_current_user`.
↓
**Database:** Queries the `PatientProfile` table for any patients with elevated risk statuses.
↓
**Response:** Returns a sorted list of high-risk patients.
↓
**User:** The doctor reviews the dashboard, seeing exactly which 3 out of 100 patients require an immediate phone call, rather than manually calling all 100.
