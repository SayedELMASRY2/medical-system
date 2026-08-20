from typing import Any, Literal
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel, Field
from config.model_factory import create_llm
from prompts.supervisor_prompt import SUPERVISOR_SYSTEM_PROMPT


class RouteDecision(BaseModel):
    next_agent: Literal[
        "timeline_agent",
        "medical_agent",
        "triage_agent",
        "chatbot_agent",
        "dashboard_agent",
        "FINISH",
    ] = Field(description="The agent to route the task to")
    reason: str = Field(description="Brief explanation of why this agent was chosen")
    task_summary: str = Field(description="Condensed task description for the target agent")


def create_supervisor_agent(llm=None):
    if llm is None:
        llm = create_llm()

    router_llm = llm.with_structured_output(RouteDecision)

    def supervisor_node(state: dict[str, Any]) -> dict[str, Any]:
        messages = list(state.get("messages", []))
        patient = state.get("patient", {})
        raw_md = state.get("raw_md_input", "")
        lab_results = state.get("lab_results")

        patient_context = _build_patient_context(patient)

        if raw_md and not state.get("parsed_form_data"):
            return {
                "next_agent": "timeline_agent",
                "current_agent": "supervisor_agent",
                "metadata": {
                    **state.get("metadata", {}),
                    "routing_reason": "MD form input detected — routing to timeline_agent",
                },
            }

        if lab_results and not state.get("deterministic_risk_level"):
            return {
                "next_agent": "medical_agent",
                "current_agent": "supervisor_agent",
                "metadata": {
                    **state.get("metadata", {}),
                    "routing_reason": "Lab results detected — routing to medical_agent for analysis",
                },
            }

        last_message = ""
        for msg in reversed(messages):
            if isinstance(msg, HumanMessage):
                last_message = msg.content
                break

        if not last_message:
            return {
                "next_agent": "chatbot_agent",
                "current_agent": "supervisor_agent",
                "metadata": {
                    **state.get("metadata", {}),
                    "routing_reason": "No actionable input — defaulting to chatbot",
                },
            }

        routing_prompt = (
            f"{SUPERVISOR_SYSTEM_PROMPT}\n\n"
            f"## Current Context\n"
            f"Patient: {patient_context}\n"
            f"Timeline entries: {len(state.get('timeline', []))}\n"
            f"Lab results: {'Available' if lab_results else 'None'}\n"
            f"Risk level: {state.get('deterministic_risk_level', 'not assessed')}\n"
            f"Previous agent: {state.get('current_agent', 'none')}\n\n"
            f"## User Message\n{last_message}\n\n"
            f"Decide which agent should handle this request."
        )

        try:
            decision: RouteDecision = router_llm.invoke([
                SystemMessage(content=routing_prompt),
                HumanMessage(content=last_message),
            ])

            return {
                "next_agent": decision.next_agent,
                "current_agent": "supervisor_agent",
                "task_type": _infer_task_type(decision.next_agent),
                "search_query": last_message if decision.next_agent == "medical_agent" else None,
                "metadata": {
                    **state.get("metadata", {}),
                    "routing_reason": decision.reason,
                    "task_summary": decision.task_summary,
                },
            }
        except Exception:
            return {
                "next_agent": "chatbot_agent",
                "current_agent": "supervisor_agent",
                "metadata": {
                    **state.get("metadata", {}),
                    "routing_reason": "Routing failed — safe fallback to chatbot",
                },
            }

    return supervisor_node


def _build_patient_context(patient: dict) -> str:
    if not patient:
        return "No patient data available"

    parts = []
    if patient.get("name"):
        parts.append(f"Name: {patient['name']}")
    if patient.get("gestational_age_weeks"):
        weeks = patient["gestational_age_weeks"]
        days = patient.get("gestational_age_days", 0)
        parts.append(f"GA: {weeks}w {days}d")
    if patient.get("edd"):
        parts.append(f"EDD: {patient['edd']}")
    if patient.get("country"):
        parts.append(f"Country: {patient['country']}")

    return " | ".join(parts) if parts else "Minimal patient data"


def _infer_task_type(agent_name: str) -> str:
    mapping = {
        "timeline_agent": "timeline_parse",
        "medical_agent": "medical_rag",
        "triage_agent": "triage",
        "chatbot_agent": "chat",
        "dashboard_agent": "dashboard_report",
        "FINISH": "complete",
    }
    return mapping.get(agent_name, "unknown")
