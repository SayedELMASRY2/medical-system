import json
from typing import Any
from datetime import datetime
from langchain_core.messages import HumanMessage, SystemMessage
from config.model_factory import create_llm
from core.tools.dashboard_tools import generate_dashboard_json
from prompts.dashboard_prompt import DASHBOARD_SYSTEM_PROMPT


DASHBOARD_TOOLS = [generate_dashboard_json]


def create_dashboard_agent(llm=None):
    if llm is None:
        llm = create_llm()

    llm_with_tools = llm.bind_tools(DASHBOARD_TOOLS)

    def dashboard_node(state: dict[str, Any]) -> dict[str, Any]:
        messages = list(state.get("messages", []))
        patient = state.get("patient", {})
        timeline = state.get("timeline", [])
        triage = state.get("triage")

        report = _build_report(patient, timeline, triage)

        context_msg = HumanMessage(content=(
            f"Generate a comprehensive dashboard report.\n\n"
            f"Patient: {patient.get('name', 'Unknown')} | "
            f"GA: {patient.get('gestational_age_weeks', 'N/A')}w\n"
            f"Timeline entries: {len(timeline)}\n"
            f"Triage status: {'Available' if triage else 'Not assessed'}\n\n"
            f"Use the generate_dashboard_json tool with the current data."
        ))

        response = llm_with_tools.invoke([
            SystemMessage(content=DASHBOARD_SYSTEM_PROMPT),
            context_msg,
        ])

        messages.append(context_msg)
        messages.append(response)

        return {
            "messages": messages,
            "dashboard_output": report,
            "chat_response": json.dumps(report, ensure_ascii=False),
            "current_agent": "dashboard_agent",
        }

    return dashboard_node


def _build_report(patient: dict, timeline: list, triage: dict | None) -> dict:
    latest_entry = timeline[-1] if timeline else {}

    vitals_trend = {"weight": [], "bp_systolic": [], "bp_diastolic": []}
    for entry in timeline[-10:]:
        vitals = entry.get("vitals", {})
        date_str = entry.get("date", "")
        if "weight" in vitals:
            vitals_trend["weight"].append({"date": date_str, "value": vitals["weight"]})
        bp = vitals.get("blood_pressure", {})
        if isinstance(bp, dict):
            if "systolic" in bp:
                vitals_trend["bp_systolic"].append({"date": date_str, "value": bp["systolic"]})
            if "diastolic" in bp:
                vitals_trend["bp_diastolic"].append({"date": date_str, "value": bp["diastolic"]})

    weeks = patient.get("gestational_age_weeks", 0)
    if weeks <= 12:
        trimester = "first"
    elif weeks <= 27:
        trimester = "second"
    else:
        trimester = "third"

    risk = {
        "level": "not_assessed",
        "score": 0.0,
        "factors": [],
        "requires_attention": False,
    }
    if triage:
        risk = {
            "level": triage.get("risk_level", "unknown"),
            "score": triage.get("risk_score", 0.0),
            "factors": triage.get("risk_factors", []),
            "recommendations": triage.get("recommendations", []),
            "requires_attention": triage.get("requires_immediate_attention", False),
        }

    return {
        "report_id": f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.now().isoformat(),
        "patient_summary": {
            "id": patient.get("patient_id", "unknown"),
            "name": patient.get("name", ""),
            "gestational_age": weeks,
            "edd": patient.get("edd", ""),
            "trimester": trimester,
        },
        "latest_entry": {
            "date": latest_entry.get("date", ""),
            "symptoms": latest_entry.get("symptoms", []),
            "vitals": latest_entry.get("vitals", {}),
            "notes": latest_entry.get("notes", ""),
        },
        "vitals_trend": vitals_trend,
        "risk_assessment": risk,
        "timeline_count": len(timeline),
        "status": "active",
    }
