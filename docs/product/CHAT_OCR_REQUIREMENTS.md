# Patient Chat & Lab Test OCR Requirements

To provide continuous support outside of the structured "Daily Check-in", the system will feature a **24/7 Smart Chatbot** interface for the patient. This chat acts as an empathetic medical assistant capable of answering questions, calming anxieties, and parsing unstructured medical documents (like lab test images).

## 💬 1. Conversational AI Chat
*   **Availability:** Accessible at any time from the patient dashboard.
*   **Knowledge Base:** The chat will be connected to the **RAG Pipeline (Medical Guidelines)** to ensure it provides scientifically accurate advice.
*   **Context-Aware:** The chat AI will have access to the patient's `AgentState` (current vitals, gestational week, risk level). For example, if she asks "Is my blood pressure okay today?", it knows her readings without her having to retype them.
*   **Safety Guardrails:** The AI must append a strict disclaimer that it is an assistant, not a doctor. If the patient describes severe symptoms in the chat (e.g., "my vision is blurry"), the chat must trigger an immediate **Red Alert** in the Risk Engine and advise her to go to the ER.

## 📄 2. Lab Test Upload & OCR (Optical Character Recognition)
*   **File Upload:** The chat interface must support image uploads (JPEG, PNG, PDF) for lab test results (e.g., Complete Blood Count, Urine Protein tests).
*   **OCR Pipeline:** 
    *   Images sent to the backend will be processed through an OCR engine (e.g., OpenAI Vision, Tesseract, or AWS Textract).
*   **Data Cleaning & Extraction:**
    *   Raw OCR text is often messy. The system will use an LLM extraction prompt to **clean** the raw text and extract structured JSON data (e.g., `{"hemoglobin": 11.2, "platelets": 150000}`).
*   **Integration with Risk Engine:**
    *   The cleaned JSON data is automatically saved to the patient's database and fed into the deterministic **Risk Engine** to evaluate if the lab results cross any dangerous thresholds.

---

## ⚙️ Team Tasks Integration
*   **Dev 1 (AI Engineer):** Build the `ChatAgent` node in LangGraph and write the OCR-cleaning extraction prompts.
*   **Dev 3 (Risk Engine):** Add rules to evaluate the structured lab data extracted from the OCR.
*   **Dev 4 (Backend):** Create the file upload API (`POST /chat/upload`) and integrate the OCR service.
*   **Dev 5 (Frontend):** Build the chat UI with image upload capabilities and typing indicators.
