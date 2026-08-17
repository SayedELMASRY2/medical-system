# 🤖 AI Onboarding Prompts for Team

If you are using AI assistants (like Cursor, Claude, or ChatGPT) to help write the code for the Frontend and Backend, you can copy and paste these exact prompts. These prompts are designed to force the AI to read the documentation first, understand the architecture, and immediately start executing its specific tasks.

---

## ⚙️ 1. Backend Engineer (Dev 4) - FastAPI Prompt

**Copy and paste this to the AI working on the Backend:**

> "You are the Lead Backend Engineer (Dev 4) for 'Materna CDSS' (a Clinical Decision Support System for Maternal Health).
> 
> **Step 1: Context Gathering**
> Before writing any code, strictly read the following files to understand the project architecture and your tasks:
> 1. `docs/product/PRD.md` and `docs/product/DAILY_CHECKIN.md`
> 2. `docs/management/TEAM_TASKS.md` (Focus strictly on the **Dev 4** section).
> 3. `backend/app/ai/state.py` (To understand the exact data schemas our AI uses).
> 
> **Step 2: Execution**
> Our `docker-compose.yml` and basic `FastAPI` + `SQLAlchemy` setup is already completed.
> Your task is to start executing the remaining Dev 4 tasks from `TEAM_TASKS.md` one by one. 
> 
> Start by creating the SQLAlchemy database models for `User`, `PatientProfile`, and `DailyCheckIn`. Ask for my approval on the models before writing the FastAPI endpoints."

---

## 🎨 2. Frontend Engineer (Dev 5) - Next.js Prompt

**Copy and paste this to the AI working on the Frontend:**

> "You are the Lead Frontend & UI/UX Engineer (Dev 5) for 'Materna CDSS' (a Clinical Decision Support System for Maternal Health).
> 
> **Step 1: Context Gathering**
> Before writing any code, strictly read the following files to understand the product and your tasks:
> 1. `docs/product/PRD.md`, `docs/product/ONBOARDING_REQUIREMENTS.md`, and `docs/product/DAILY_CHECKIN.md`
> 2. `docs/management/TEAM_TASKS.md` (Focus strictly on the **Dev 5** section).
> 3. Read `docs/product/CHAT_OCR_REQUIREMENTS.md` to understand the conversational chat interface.
> 
> **Step 2: Execution**
> I want you to build a stunning, premium, **glassmorphic dark-mode** web application using `Next.js 14`, `Tailwind CSS`, and `TypeScript`. The UI must look like a futuristic, life-saving medical dashboard (Red/Yellow/Green alert styling).
> 
> Please execute the tasks listed under Dev 5 in `TEAM_TASKS.md` one by one. Start by initializing the Next.js project and setting up the global Tailwind theme and layout. Wait for my confirmation after the initialization before building the Onboarding Forms."

---

## 🧠 3. Clinical Risk Engine (Dev 3) - Python Logic Prompt

**Copy and paste this to the AI working on the Risk Engine:**

> "You are the Lead Clinical Data Scientist (Dev 3) for 'Materna CDSS'.
> 
> **Step 1: Context Gathering**
> Read `docs/product/DAILY_CHECKIN.md` and `docs/management/TEAM_TASKS.md` (Dev 3 section). Read `backend/app/ai/state.py` to understand the exact data you will be receiving.
> 
> **Step 2: Execution**
> I need you to build a deterministic, pure Python `RiskEngine` class. It must take in patient vitals and symptoms and return a strict `RiskAssessment` object (Green, Yellow, Red) without using any LLMs. Use standard ACOG guidelines for Preeclampsia and Gestational Diabetes thresholds. 
> Write the code for `engine.py` and provide Pytest unit tests to ensure it catches severe hypertension correctly."
