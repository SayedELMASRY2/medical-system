from typing import List, Tuple
from app.ai.state import VitalSigns, TrendFeature, RuleResult

class DeterministicRiskEngine:
    """
    Pure Python Deterministic Clinical Risk Assessment Engine.
    Evaluates gestational thresholds, velocity of vital signs, and symptom matrices.
    CRITICAL CDSS SAFETY RULE: LLMs cannot override the output of this engine.
    """

    @staticmethod
    def evaluate(
        gestational_age_weeks: int | None,
        vitals: VitalSigns | None,
        symptoms: List[str],
        trends: List[TrendFeature] = None,
        lab_results: dict | None = None
    ) -> Tuple[str, List[RuleResult]]:
        triggered_rules: List[RuleResult] = []
        highest_severity = "low"

        # Severity Rank: LOW (0) < MONITOR (1) < CLINICAL_REVIEW (2) < HIGH_PRIORITY (3)
        severity_ranks = {"low": 0, "monitor": 1, "clinical_review": 2, "high": 3}

        # Rule 1: Severe Hypertension Threshold (>160/110) - High Priority
        if vitals and (vitals.systolic_bp >= 160 or vitals.diastolic_bp >= 110):
            rule = RuleResult(
                rule_id="R-HTN-01",
                rule_name="Severe Obstetric Hypertension",
                severity="high",
                matched_conditions=[
                    f"BP {vitals.systolic_bp}/{vitals.diastolic_bp} exceeds 160/110 mmHg threshold"
                ]
            )
            triggered_rules.append(rule)

        # Rule 2: Gestational Hypertension (>140/90 after 20 weeks)
        elif vitals and gestational_age_weeks and (vitals.systolic_bp >= 140 or vitals.diastolic_bp >= 90) and gestational_age_weeks >= 20:
            matched = [f"BP {vitals.systolic_bp}/{vitals.diastolic_bp} >= 140/90 mmHg at week {gestational_age_weeks}"]
            severity = "clinical_review"

            # Check for co-occurring pre-eclampsia red flag symptoms
            preeclampsia_symptoms = {"severe headache", "visual disturbances", "epigastric pain", "blurred vision", "swelling"}
            detected_symptoms = [s for s in symptoms if s.lower() in preeclampsia_symptoms]
            
            if detected_symptoms:
                severity = "high"
                matched.append(f"Red flag symptoms present: {', '.join(detected_symptoms)}")

            if vitals.proteinuria in ["+1", "+2", "+3"]:
                severity = "high"
                matched.append(f"Significant proteinuria detected: {vitals.proteinuria}")

            rule = RuleResult(
                rule_id="R-HTN-02",
                rule_name="Gestational Hypertension with Symptoms / Proteinuria",
                severity=severity,
                matched_conditions=matched
            )
            triggered_rules.append(rule)

        # Rule 3: Accelerating Blood Pressure Velocity from Timeline Trends
        if trends:
            for trend in trends:
                if "systolic_bp" in trend.metric and trend.delta_previous >= 15 and trend.is_accelerating:
                    rule = RuleResult(
                        rule_id="R-TREND-01",
                        rule_name="Accelerating Systolic Blood Pressure Trend",
                        severity="monitor",
                        matched_conditions=[
                            f"Systolic BP increased by +{trend.delta_previous} mmHg over baseline"
                        ]
                    )
                    triggered_rules.append(rule)
                    
        # Rule 4: Lab Results evaluation
        if lab_results:
            # Case insensitive key search
            lab_keys = {k.lower().replace(" ", "_"): k for k in lab_results.keys()}
            
            # R-LAB-01 Platelets
            platelets_key = lab_keys.get("platelets") or lab_keys.get("plt") or lab_keys.get("platelet_count")
            if platelets_key:
                val_str = str(lab_results[platelets_key]).replace(",", "")
                try:
                    plt_val = float(val_str)
                    if plt_val < 100000:
                        rule = RuleResult(
                            rule_id="R-LAB-01",
                            rule_name="Severe Thrombocytopenia (Preeclampsia/HELLP Risk)",
                            severity="high",
                            matched_conditions=[f"Platelets: {plt_val} (Threshold < 100,000)"]
                        )
                        triggered_rules.append(rule)
                    elif plt_val < 150000:
                        rule = RuleResult(
                            rule_id="R-LAB-01",
                            rule_name="Mild Thrombocytopenia",
                            severity="monitor",
                            matched_conditions=[f"Platelets: {plt_val} (Threshold < 150,000)"]
                        )
                        triggered_rules.append(rule)
                except ValueError:
                    pass
            
            # R-LAB-02 D-Dimer
            ddimer_key = lab_keys.get("d_dimer") or lab_keys.get("ddimer") or lab_keys.get("d-dimer")
            if ddimer_key:
                try:
                    ddimer_val = float(str(lab_results[ddimer_key]).replace(",", ""))
                    if ddimer_val > 0.5:
                        rule = RuleResult(
                            rule_id="R-LAB-02",
                            rule_name="Elevated D-Dimer (VTE Risk)",
                            severity="clinical_review",
                            matched_conditions=[f"D-Dimer: {ddimer_val} (Threshold > 0.5)"]
                        )
                        triggered_rules.append(rule)
                except ValueError:
                    pass

        # Determine highest triggered risk level
        for r in triggered_rules:
            if severity_ranks.get(r.severity, 0) > severity_ranks.get(highest_severity, 0):
                highest_severity = r.severity

        return highest_severity, triggered_rules
