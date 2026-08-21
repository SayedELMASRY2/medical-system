from datetime import datetime
from typing import Any
from langchain_core.tools import tool


@tool
def generate_dashboard_json(
    patient_data: dict,
    timeline_data: list[dict],
    triage_data: dict | None = None,
) -> dict:
    """Generate a structured JSON dashboard report combining all patient data. Args: patient_data: Core patient profile. timeline_data: List of timeline entries. triage_data: Optional triage results."""
    latest_entry = timeline_data[-1] if timeline_data else {}

    vitals_trend = _extract_vitals_trend(timeline_data)

    risk_summary = _build_risk_summary(triage_data)

    return {
        "report_id": f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.now().isoformat(),
        "patient_summary": {
            "id": patient_data.get("patient_id", "unknown"),
            "name": patient_data.get("name", ""),
            "gestational_age": patient_data.get("gestational_age_weeks", 0),
            "edd": patient_data.get("edd", ""),
            "trimester": _get_trimester(patient_data.get("gestational_age_weeks", 0)),
        },
        "latest_entry": {
            "date": latest_entry.get("date", ""),
            "symptoms": latest_entry.get("symptoms", []),
            "vitals": latest_entry.get("vitals", {}),
            "notes": latest_entry.get("notes", ""),
        },
        "vitals_trend": vitals_trend,
        "risk_assessment": risk_summary,
        "timeline_count": len(timeline_data),
        "status": "active",
    }


def _extract_vitals_trend(entries: list[dict]) -> dict:
    weights = []
    bp_systolic = []
    bp_diastolic = []

    for entry in entries:
        vitals = entry.get("vitals", {})
        if "weight" in vitals:
            weights.append({"date": entry.get("date", ""), "value": vitals["weight"]})
        if "blood_pressure" in vitals:
            bp = vitals["blood_pressure"]
            if isinstance(bp, dict):
                bp_systolic.append({"date": entry.get("date", ""), "value": bp.get("systolic", 0)})
                bp_diastolic.append({"date": entry.get("date", ""), "value": bp.get("diastolic", 0)})

    return {
        "weight": weights[-10:],
        "bp_systolic": bp_systolic[-10:],
        "bp_diastolic": bp_diastolic[-10:],
    }


def _build_risk_summary(triage: dict | None) -> dict:
    if not triage:
        return {
            "level": "not_assessed",
            "score": 0.0,
            "factors": [],
            "requires_attention": False,
        }

    return {
        "level": triage.get("risk_level", "unknown"),
        "score": triage.get("risk_score", 0.0),
        "factors": triage.get("risk_factors", []),
        "recommendations": triage.get("recommendations", []),
        "requires_attention": triage.get("requires_immediate_attention", False),
        "assessed_at": triage.get("assessed_at", ""),
    }


def _get_trimester(weeks: int) -> str:
    if weeks <= 12:
        return "first"
    elif weeks <= 27:
        return "second"
    else:
        return "third"
