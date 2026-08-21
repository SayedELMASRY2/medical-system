from typing import Any
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from config.model_factory import create_llm
from core.memory import memory_manager
from prompts.chatbot_prompt import CHATBOT_SYSTEM_PROMPT


def create_chatbot_agent(llm=None):
    if llm is None:
        llm = create_llm()

    def chatbot_node(state: dict[str, Any]) -> dict[str, Any]:
        messages = list(state.get("messages", []))
        patient = state.get("patient", {})
        timeline = state.get("timeline", [])
        triage = state.get("triage")
        patient_id = patient.get("patient_id", "default")

        long_term_context = _load_long_term_context(patient_id)

        context_block = _build_context_block(patient, timeline, triage, long_term_context)

        system_with_context = (
            f"{CHATBOT_SYSTEM_PROMPT}\n\n"
            f"## Current Patient Context\n{context_block}"
        )

        response = llm.invoke([
            SystemMessage(content=system_with_context),
            *messages[-20:],
        ])

        messages.append(response)

        _save_interaction_context(patient_id, messages)

        return {
            "messages": messages,
            "chat_response": response.content,
            "current_agent": "chatbot_agent",
        }

    return chatbot_node


def _build_context_block(
    patient: dict,
    timeline: list,
    triage: dict | None,
    long_term: dict | None,
) -> str:
    parts = []

    if patient:
        name = patient.get("name", "the patient")
        parts.append(f"**Patient**: {name}")
        if patient.get("gestational_age_weeks"):
            parts.append(f"**Gestational Age**: {patient['gestational_age_weeks']}w "
                        f"{patient.get('gestational_age_days', 0)}d")
        if patient.get("edd"):
            parts.append(f"**Due Date**: {patient['edd']}")
        if patient.get("country"):
            parts.append(f"**Country**: {patient['country']}")

    if timeline:
        latest = timeline[-1]
        parts.append(f"\n**Latest Entry** ({latest.get('date', 'unknown date')}):")
        if latest.get("symptoms"):
            parts.append(f"  Symptoms: {', '.join(latest['symptoms'])}")
        if latest.get("notes"):
            parts.append(f"  Notes: {latest['notes']}")
        parts.append(f"  Total entries: {len(timeline)}")

    if triage:
        risk = triage.get("risk_level", "unknown")
        parts.append(f"\n**Risk Level**: {risk}")
        if triage.get("risk_factors"):
            parts.append(f"  Factors: {', '.join(triage['risk_factors'])}")

    if long_term:
        if long_term.get("preferences"):
            parts.append(f"\n**Patient Preferences**: {long_term['preferences']}")
        if long_term.get("interaction_count"):
            parts.append(f"**Previous Interactions**: {long_term['interaction_count']}")

    return "\n".join(parts) if parts else "No patient context available."


def _load_long_term_context(patient_id: str) -> dict | None:
    try:
        return memory_manager.get_chat_context(patient_id, "interaction_history")
    except Exception:
        return None


def _save_interaction_context(patient_id: str, messages: list) -> None:
    try:
        existing = memory_manager.get_chat_context(patient_id, "interaction_history") or {}
        count = existing.get("interaction_count", 0) + 1

        memory_manager.save_chat_context(
            patient_id,
            "interaction_history",
            {
                "interaction_count": count,
                "last_message_count": len(messages),
                "last_interaction": __import__("datetime").datetime.now().isoformat(),
            },
        )
    except Exception:
        pass
