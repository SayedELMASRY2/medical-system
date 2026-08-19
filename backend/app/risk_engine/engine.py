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
        gestational_age_weeks: int,
        vitals: VitalSigns,
        symptoms: List[str],
        trends: List[TrendFeature] = None
    ) -> Tuple[str, List[RuleResult]]:
        triggered_rules: List[RuleResult] = []
        highest_severity = "low"

        # Severity Rank: LOW (0) < MONITOR (1) < CLINICAL_REVIEW (2) < HIGH_PRIORITY (3)
        severity_ranks = {"low": 0, "monitor": 1, "clinical_review": 2, "high": 3}

        # Rule 1: Severe Hypertension Threshold (>160/110) - High Priority
        if vitals.systolic_bp >= 160 or vitals.diastolic_bp >= 110:
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
        elif (vitals.systolic_bp >= 140 or vitals.diastolic_bp >= 90) and gestational_age_weeks >= 20:
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

        # Determine highest triggered risk level
        for r in triggered_rules:
            if severity_ranks.get(r.severity, 0) > severity_ranks.get(highest_severity, 0):
                highest_severity = r.severity

        return highest_severity, triggered_rules
