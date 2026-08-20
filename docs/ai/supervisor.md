# 🚦 Agent 1: Supervisor Agent

The Supervisor Agent acts as the central router for the AI system.

## Architectural Position
* **Runs Second:** The Supervisor runs *after* the Timeline Agent has built the clinical context.
* **Does NOT Diagnose:** It strictly evaluates the user's intent to route them to the correct subsystem.

## Input Context
It receives the `TimelineContext` and the `user_message`. By having the `TimelineContext`, the Supervisor can detect hidden urgencies (e.g., if a user says "I have a headache", but the Timeline shows their BP is increasing, the Supervisor knows this is a medical query, not a general chat).

## Routing Logic
The Supervisor outputs a `SupervisorDecision` containing the routing choice:
1. `general_chat`: For casual conversation, greetings, or non-medical questions. Routes to the Chat Response Agent.
2. `medical_rag`: For symptoms, medical questions, or concerning vitals. Routes to Medical RAG and Triage.
3. `clarify_intent`: If the message is completely ambiguous (e.g., "Yes"). Routes back to Chat Response Agent to ask for clarification.
