from typing import Any
from langchain_core.messages import HumanMessage, SystemMessage
from config.model_factory import create_llm
from risk_engine.engine import DeterministicRiskEngine
from prompts.triage_prompt import TRIAGE_SYSTEM_PROMPT


def create_triage_agent(llm=None):
    if llm is None:
        llm = create_llm()

    def triage_node(state: dict[str, Any]) -> dict[str, Any]:
        messages = list(state.get("messages", []))
        patient = state.get("patient", {})
        lab_results = state.get("lab_results")
        current_vitals = state.get("current_vitals")
        symptoms = state.get("reported_symptoms", [])
        trends = state.get("timeline_trends", [])
        ga_weeks = state.get("gestational_age_weeks") or patient.get("gestational_age_weeks")

        risk_level, triggered_rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=ga_weeks,
            vitals=current_vitals,
            symptoms=symptoms,
            trends=trends,
            lab_results=_normalize_lab_for_risk(lab_results),
        )

        rules_data = [
            {"rule_id": r.rule_id, "rule_name": r.rule_name, "severity": r.severity, "conditions": r.matched_conditions}
            for r in triggered_rules
        ]

        triage_explanation = ""
        if risk_level != "low":
            rules_str = "\n".join([
                f"- [{r.severity.upper()}] {r.rule_name}: {', '.join(r.matched_conditions)}"
                for r in triggered_rules
            ])

            prompt_msg = HumanMessage(content=(
                f"Risk Level: {risk_level.upper()}\n\n"
                f"Triggered Clinical Rules:\n{rules_str}\n\n"
                f"Patient: {patient.get('name', 'Unknown')} | "
                f"GA: {ga_weeks or 'unknown'}w\n"
                f"Lab Results: {'Available' if lab_results else 'None'}\n\n"
                f"Write a Clinical Triage Alert."
            ))

            response = llm.invoke([
                SystemMessage(content=TRIAGE_SYSTEM_PROMPT),
                prompt_msg,
            ])

            triage_explanation = response.content
            messages.append(prompt_msg)
            messages.append(response)

        if patient and patient.get("patient_id"):
            try:
                from database import get_session_factory, save_triage_assessment
                SessionLocal = get_session_factory()
                with SessionLocal() as db:
                    save_triage_assessment(
                        db=db,
                        patient_id=patient["patient_id"],
                        risk_level=risk_level,
                        triggered_rules=rules_data,
                        triage_alert=triage_explanation,
                    )
            except Exception:
                pass

        return {
            "messages": messages,
            "deterministic_risk_level": risk_level,
            "evaluated_rules": rules_data,
            "triage_explanation": triage_explanation,
            "current_agent": "triage_agent",
        }

    return triage_node


def _normalize_lab_for_risk(lab_results: dict | None) -> dict | None:
    if not lab_results:
        return None

    results = lab_results.get("results", lab_results)
    if not isinstance(results, dict):
        return None

    normalized = {}
    for key, val in results.items():
        if isinstance(val, dict):
            normalized[key] = val.get("value", val)
        else:
            normalized[key] = val

    return normalized
