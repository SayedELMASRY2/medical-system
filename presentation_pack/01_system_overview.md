# 01. System Overview

## System Name
Materna AI Clinical Decision Support System (CDSS)

## One-Line Description
An AI-enhanced remote monitoring platform for pregnancy that automates risk detection and triage between clinical visits.

## Problem
Intermittent prenatal care leaves critical blind spots between scheduled clinic visits, meaning complications like preeclampsia or gestational diabetes can escalate silently before a doctor is aware. Additionally, manual follow-ups and paper-based lab reports consume excessive clinical staff time.

## Solution
A continuous, asynchronous monitoring system where patients log vitals and symptoms daily. An automated deterministic rules engine evaluates this data instantly to flag risks, while an AI assistant helps extract lab data and answer patient queries.

## Target Users
1.  **Pregnant Patients:** Monitoring their health at home.
2.  **Obstetricians (Doctors):** Reviewing prioritized triage queues and patient timelines.
3.  **Midwives:** Assisting in continuous patient care.

## Main Capabilities
*   **Daily Check-in Logging:** Capture of vitals (BP, Heart Rate, Weight, etc.) and symptoms.
*   **Deterministic Risk Evaluation:** Real-time calculation of clinical risk (Low, Monitor, High).
*   **AI Conversational Assistant:** LangGraph-powered chat for patient support and medical RAG.
*   **Lab Report OCR:** Extraction of clinical metrics from uploaded PDF/Image lab reports using Vision LLMs.
*   **Triage Dashboard:** Aggregation of high-risk patients for clinical review.

## High-Level Architecture
A Next.js client communicating via HTTP REST and Server-Sent Events (SSE) with an Asynchronous FastAPI monolithic backend. Data is stored in a PostgreSQL database equipped with `pgvector` for future embedding support. AI capabilities are orchestrated using LangChain/LangGraph and powered by external LLM APIs (OpenAI/Cohere).

## Main Technologies
*   **Frontend:** Next.js, React
*   **Backend:** FastAPI (Python 3.11), SQLAlchemy (Async), Pydantic
*   **AI/LLM:** LangChain, LangGraph, OpenAI, Cohere
*   **Database:** PostgreSQL (with pgvector)
*   **Deployment:** Docker Compose

## Main Components
*   **API Gateway & Auth:** JWT-secured asynchronous REST endpoints.
*   **Risk Engine:** A pure Python deterministic clinical rules engine.
*   **Materna Graph:** The multi-agent AI orchestrator for routing, RAG, and response synthesis.
*   **OCR Pipeline:** A hybrid parser utilizing `pypdf`, Regex, and Vision LLMs.

## Main Business Value
*   **Risk Mitigation:** Automatically and instantly detects life-threatening conditions.
*   **Operational Efficiency:** Replaces manual phone calls and manual lab data entry, allowing clinics to handle more patients with the same staff.
*   **Patient Engagement:** Provides 24/7 reassuring, medically sound AI interaction.

---

## Explanations

### 30-Second Explanation
Materna is a remote care platform that bridges the gap between prenatal clinic visits. Patients use a web app to log their daily vitals and chat with an AI assistant. Behind the scenes, a strict clinical rules engine instantly evaluates their data. If anything looks dangerous, like a sudden spike in blood pressure, the system immediately flags the patient on a triage dashboard so their doctor can intervene.

### 1-Minute Explanation
Prenatal care typically involves seeing a doctor once every few weeks, but complications can develop in a matter of days. Materna solves this by providing a continuous, AI-powered monitoring platform. 

Patients log their vitals, report symptoms, and even upload lab reports from their phones. The system uses a FastAPI backend to route this data through a Deterministic Risk Engine that applies strict clinical rules. Simultaneously, a multi-agent AI orchestrated by LangGraph can answer patient questions and extract structured data from lab reports.

For the clinic, this means no more manual phone calls to check on patients. Doctors simply log into the Materna dashboard and see a prioritized triage queue of only the patients who need immediate attention, improving both safety and operational efficiency.

### 2-Minute Explanation
Materna is a comprehensive AI Clinical Decision Support System designed to modernize prenatal care. The core problem it solves is the "blind spot" between scheduled appointments, where conditions like preeclampsia can silently escalate.

The architecture is built on a modern stack: a Next.js frontend, an Asynchronous FastAPI backend, and a PostgreSQL database. The system has two primary intelligence layers. The first is a Deterministic Risk Engine—a strict, non-LLM Python module that evaluates daily vitals and symptoms against established clinical guidelines to generate a risk severity level. The second is the "Materna Graph", a LangGraph-powered multi-agent system. This AI layer handles conversational support, medical retrieval-augmented generation (RAG), and can synthesize complex clinical context into reassuring advice.

Additionally, the system features an OCR pipeline capable of extracting structured numerical data from unstructured PDFs and images using a combination of `pypdf` and Vision LLMs. 

From a business perspective, Materna delivers massive value by automating triage. Instead of nurses calling 50 patients a day, the system passively collects data and highlights only the high-risk individuals on a dashboard. This reduces malpractice risk, cuts operational overhead, and provides patients with a superior, 24/7 care experience.
