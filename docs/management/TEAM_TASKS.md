# 📋 Team Task Assignments (Hackathon)

This document breaks down the high-level phases into specific, actionable tasks for each team member. You can copy-paste these into Trello, Jira, GitHub Issues, or Slack.

---

## 👨‍💻 Dev 1: AI & LangGraph Engineer
**Objective:** Build the cognitive workflow and LLM prompts.

- [ ] **Task 1.1:** Setup Python environment and install `langgraph`, `langchain-openai`.
- [ ] **Task 1.2:** Create `AgentState` schema using Pydantic (defining what data moves between agents).
- [ ] **Task 1.3:** Build the `Supervisor` node logic (Route queries to Timeline, RAG, or Triage).
- [ ] **Task 1.4:** Build the `Timeline Agent` (Summarizes longitudinal patient history).
- [ ] **Task 1.5:** Build the `Triage Agent` (Combines Risk Engine output + RAG context to formulate the final explanation).
- [ ] **Task 1.6:** Build the `Chat Agent` to answer patient questions with guardrails.
- [ ] **Task 1.7:** Write LLM prompt for extracting and cleaning raw OCR text into structured lab JSON.
- [ ] **Task 1.8:** Wire all agents together in a `StateGraph` and test with mock inputs.

---

## 👨‍💻 Dev 2: RAG & Vector DB Engineer
**Objective:** Feed medical knowledge to the system and make it searchable.

- [x] **Task 2.1:** Setup `pgvector` inside PostgreSQL *(Completed)*.
- [x] **Task 2.2:** Build offline ingestion script to embed documents using Cohere *(Completed)*.
- [x] **Task 2.3:** Add BM25 indexing for keyword search alongside Vector search *(Completed)*.
- [x] **Task 2.4:** Write a Python function `retrieve_evidence(query)` that performs Hybrid Search *(Completed)*.
- [x] **Task 2.5:** Add Cohere Reranker to filter the top 5 most relevant results *(Completed)*.
- [x] **Task 2.6:** Format the final retrieved chunks with `source_id` citations *(Completed)*.

---

## 👨‍💻 Dev 3: Clinical Risk Engine
**Objective:** Build the deterministic safety net that the AI cannot override.

- [ ] **Task 3.1:** Create `engine.py` to house the `RiskEngine` Python class.
- [ ] **Task 3.2:** Write the blood pressure evaluation logic (Normal vs. Hypertension vs. Severe Preeclampsia).
- [ ] **Task 3.3:** Write symptom matrix evaluator (e.g., Headache + Visual changes = High Risk).
- [ ] **Task 3.4:** Combine lab results (Proteinuria, Platelets) into the risk threshold scoring.
- [ ] **Task 3.5:** Return a strict `RiskAssessment` object containing `severity_level` (Green, Yellow, Red) and `hard_rules_triggered`.
- [ ] **Task 3.6:** Add rules to evaluate structured lab results extracted from OCR images (e.g. Hemoglobin < 11).
- [ ] **Task 3.7:** Write Pytest unit tests to ensure the engine catches edge cases (e.g., false negatives).

---

## 👨‍💻 Dev 4: Backend API & Architecture
**Objective:** Serve the UI and connect all internal systems.

- [x] **Task 4.1:** Scaffold FastAPI project and Database connection *(Completed)*.
- [ ] **Task 4.2:** Create User & Patient CRUD endpoints (`POST /patients`, `GET /patients/{id}`).
- [ ] **Task 4.3:** Create Vital Signs logging endpoint (`POST /patients/{id}/vitals`).
- [ ] **Task 4.4:** Integrate Dev 3's `RiskEngine` inside the Vitals endpoint so every new vital triggers an assessment.
- [ ] **Task 4.5:** Implement Server-Sent Events (SSE) streaming endpoint so the UI gets real-time AI thought processes.
- [ ] **Task 4.6:** Create the File Upload API (`POST /chat/upload`) and connect to an OCR extraction service.
- [ ] **Task 4.7:** Wire Dev 1's LangGraph output to the SSE endpoint and Chat responses.

---

## 👨‍💻 Dev 5: Frontend & UI/UX Engineer
**Objective:** Build the glassmorphic, responsive interface for doctors and patients.

- [ ] **Task 5.1:** Initialize Next.js with Tailwind CSS, setup dark mode theme.
- [ ] **Task 5.2:** Build Patient Onboarding Form (Age, Gestational week, chronic conditions).
- [ ] **Task 5.3:** Build Daily Check-in Form for patients to log blood pressure, weight, and symptoms.
- [ ] **Task 5.4:** Build the Doctor Dashboard (List of patients, sorted by Risk Level: Red > Yellow > Green).
- [ ] **Task 5.5:** Build the "AI Explanation Card" that listens to the SSE stream and types out the Triage Agent's response dynamically.
- [ ] **Task 5.6:** Build the conversational Chat UI with image upload capabilities for lab tests.
- [ ] **Task 5.7:** Polish animations, add toast notifications for alerts, and ensure responsiveness on mobile devices.
