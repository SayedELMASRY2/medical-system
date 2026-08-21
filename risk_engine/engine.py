from typing import Optional
from core.state import VitalSigns, TrendFeature, RuleResult


class DeterministicRiskEngine:

    @staticmethod
    def evaluate(
        gestational_age_weeks: int | None,
        vitals: VitalSigns | dict | None,
        symptoms: list[str],
        trends: list[TrendFeature | dict] | None = None,
        lab_results: dict | None = None,
        checkin_data: dict | None = None,
    ) -> tuple[str, list[RuleResult]]:
        triggered_rules: list[RuleResult] = []
        highest_severity = "low"
        severity_ranks = {"low": 0, "monitor": 1, "clinical_review": 2, "high": 3}

        if isinstance(vitals, dict):
            systolic = vitals.get("systolic_bp", 0)
            diastolic = vitals.get("diastolic_bp", 0)
            proteinuria = vitals.get("proteinuria")
        elif vitals and isinstance(vitals, VitalSigns):
            systolic = vitals.systolic_bp or 0
            diastolic = vitals.diastolic_bp or 0
            proteinuria = vitals.proteinuria
        else:
            systolic = diastolic = 0
            proteinuria = None

        if systolic >= 160 or diastolic >= 110:
            triggered_rules.append(RuleResult(
                rule_id="R-HTN-01",
                rule_name="Severe Obstetric Hypertension",
                severity="high",
                matched_conditions=[f"BP {systolic}/{diastolic} exceeds 160/110 mmHg threshold"],
            ))

        elif gestational_age_weeks and (systolic >= 140 or diastolic >= 90) and gestational_age_weeks >= 20:
            matched = [f"BP {systolic}/{diastolic} >= 140/90 mmHg at week {gestational_age_weeks}"]
            severity = "clinical_review"

            preeclampsia_symptoms = {"severe headache", "visual disturbances", "epigastric pain", "blurred vision", "swelling"}
            detected = [s for s in symptoms if s.lower() in preeclampsia_symptoms]

            if detected:
                severity = "high"
                matched.append(f"Red flag symptoms: {', '.join(detected)}")

            if proteinuria in ["+1", "+2", "+3"]:
                severity = "high"
                matched.append(f"Significant proteinuria: {proteinuria}")

            triggered_rules.append(RuleResult(
                rule_id="R-HTN-02",
                rule_name="Gestational Hypertension with Symptoms/Proteinuria",
                severity=severity,
                matched_conditions=matched,
            ))

        if trends:
            for trend in trends:
                if isinstance(trend, dict):
                    metric = trend.get("metric", "")
                    delta = trend.get("delta_previous", 0)
                    accel = trend.get("is_accelerating", False)
                else:
                    metric = trend.metric
                    delta = trend.delta_previous
                    accel = trend.is_accelerating

                if "systolic_bp" in metric and delta >= 15 and accel:
                    triggered_rules.append(RuleResult(
                        rule_id="R-TREND-01",
                        rule_name="Accelerating Systolic Blood Pressure Trend",
                        severity="monitor",
                        matched_conditions=[f"Systolic BP increased by +{delta} mmHg over baseline"],
                    ))

        if lab_results:
            lab_keys = {k.lower().replace(" ", "_"): k for k in lab_results.keys()}

            _check_platelets(lab_results, lab_keys, triggered_rules)
            _check_ddimer(lab_results, lab_keys, triggered_rules)
            _check_hemoglobin(lab_results, lab_keys, triggered_rules)
            _check_blood_glucose(lab_results, lab_keys, triggered_rules)
            _check_liver_enzymes(lab_results, lab_keys, triggered_rules)

        if checkin_data:
            _check_daily_checkin(checkin_data, gestational_age_weeks, triggered_rules)

        for r in triggered_rules:
            if severity_ranks.get(r.severity, 0) > severity_ranks.get(highest_severity, 0):
                highest_severity = r.severity

        return highest_severity, triggered_rules


def _get_numeric(lab_results: dict, lab_keys: dict, *candidate_keys: str) -> Optional[float]:
    for key in candidate_keys:
        actual_key = lab_keys.get(key)
        if actual_key:
            val = lab_results[actual_key]
            if isinstance(val, dict):
                val = val.get("value", val)
            try:
                return float(str(val).replace(",", ""))
            except (ValueError, TypeError):
                continue
    return None


def _check_platelets(lab_results, lab_keys, rules):
    val = _get_numeric(lab_results, lab_keys, "platelets", "plt", "platelet_count")
    if val is None:
        return
    if val < 100000:
        rules.append(RuleResult(
            rule_id="R-LAB-01", rule_name="Severe Thrombocytopenia (HELLP Risk)",
            severity="high", matched_conditions=[f"Platelets: {val} (< 100,000)"],
        ))
    elif val < 150000:
        rules.append(RuleResult(
            rule_id="R-LAB-01", rule_name="Mild Thrombocytopenia",
            severity="monitor", matched_conditions=[f"Platelets: {val} (< 150,000)"],
        ))


def _check_ddimer(lab_results, lab_keys, rules):
    val = _get_numeric(lab_results, lab_keys, "d_dimer", "ddimer", "d-dimer")
    if val is not None and val > 0.5:
        rules.append(RuleResult(
            rule_id="R-LAB-02", rule_name="Elevated D-Dimer (VTE Risk)",
            severity="clinical_review", matched_conditions=[f"D-Dimer: {val} (> 0.5)"],
        ))


def _check_hemoglobin(lab_results, lab_keys, rules):
    val = _get_numeric(lab_results, lab_keys, "hemoglobin", "hgb", "hb")
    if val is None:
        return
    if val < 7.0:
        rules.append(RuleResult(
            rule_id="R-LAB-03", rule_name="Severe Anemia",
            severity="high", matched_conditions=[f"Hemoglobin: {val} g/dL (< 7.0)"],
        ))
    elif val < 10.0:
        rules.append(RuleResult(
            rule_id="R-LAB-03", rule_name="Moderate Anemia",
            severity="clinical_review", matched_conditions=[f"Hemoglobin: {val} g/dL (< 10.0)"],
        ))
    elif val < 11.0:
        rules.append(RuleResult(
            rule_id="R-LAB-03", rule_name="Mild Anemia",
            severity="monitor", matched_conditions=[f"Hemoglobin: {val} g/dL (< 11.0)"],
        ))


def _check_blood_glucose(lab_results, lab_keys, rules):
    val = _get_numeric(lab_results, lab_keys, "blood_glucose", "glucose", "fasting_glucose", "fbs")
    if val is not None and val > 126:
        rules.append(RuleResult(
            rule_id="R-LAB-04", rule_name="Elevated Fasting Blood Glucose",
            severity="clinical_review", matched_conditions=[f"Glucose: {val} mg/dL (> 126)"],
        ))


def _check_liver_enzymes(lab_results, lab_keys, rules):
    alt = _get_numeric(lab_results, lab_keys, "alt", "sgpt", "alanine_aminotransferase")
    ast = _get_numeric(lab_results, lab_keys, "ast", "sgot", "aspartate_aminotransferase")
    if alt is not None and alt > 70:
        rules.append(RuleResult(
            rule_id="R-LAB-05", rule_name="Elevated ALT (Liver Concern)",
            severity="clinical_review", matched_conditions=[f"ALT: {alt} U/L (> 70)"],
        ))
    if ast is not None and ast > 70:
        rules.append(RuleResult(
            rule_id="R-LAB-06", rule_name="Elevated AST (Liver Concern)",
            severity="clinical_review", matched_conditions=[f"AST: {ast} U/L (> 70)"],
        ))


def _check_daily_checkin(data: dict, gestational_age_weeks: int | None, rules: list):
    headache = str(data.get("headache", "None")).strip()
    edema = str(data.get("swelling_edema", "None")).strip()
    vision = data.get("vision_changes")
    vision_active = bool(vision.get("present")) if isinstance(vision, dict) else bool(vision)
    ruq_pain = data.get("right_upper_quadrant_pain")
    ruq_active = bool(ruq_pain.get("present")) if isinstance(ruq_pain, dict) else bool(ruq_pain)
    bleeding = data.get("vaginal_bleeding")
    bleeding_active = bool(bleeding.get("present")) if isinstance(bleeding, dict) else bool(bleeding)

    diet = str(data.get("diet_quality", "")).lower()
    water = int(data.get("water_intake_cups", 0) or 0)
    fetal_mov = str(data.get("fetal_movement", "Normal")).strip()

    # 1. Preeclampsia Triad
    if edema in ["Hands/Face", "Face", "Hands"] and headache in ["Severe", "Severe/Unrelenting"] and vision_active:
        rules.append(RuleResult(
            rule_id="R-CHK-01",
            rule_name="Preeclampsia Warning Triad",
            severity="high",
            matched_conditions=["Sudden Facial/Hand Edema + Severe Unrelenting Headache + Vision Changes"],
        ))
    elif edema in ["Hands/Face", "Face", "Hands"] and (headache != "None" or vision_active):
        rules.append(RuleResult(
            rule_id="R-CHK-01B",
            rule_name="Facial/Hand Edema with Neurological Symptoms",
            severity="clinical_review",
            matched_conditions=[f"Edema: {edema}, Headache: {headache}, Vision Changes: {vision_active}"],
        ))

    # 2. High Sodium + Edema Combo
    if "high sodium" in diet and (edema != "None" or headache != "None"):
        rules.append(RuleResult(
            rule_id="R-CHK-02",
            rule_name="High Sodium Diet with Fluid Retention / Headache",
            severity="monitor",
            matched_conditions=[f"Diet: {diet}, Edema: {edema}, Headache: {headache}"],
        ))

    # 3. Right Upper Quadrant Pain (HELLP / Liver Concern)
    if ruq_active:
        rules.append(RuleResult(
            rule_id="R-CHK-03",
            rule_name="Right Upper Quadrant Abdominal Pain (Liver Distension Concern)",
            severity="high",
            matched_conditions=["Severe Right Upper Quadrant Abdominal Pain reported"],
        ))

    # 4. Vaginal Bleeding
    if bleeding_active:
        rules.append(RuleResult(
            rule_id="R-CHK-04",
            rule_name="Vaginal Bleeding/Spotting Warning",
            severity="high",
            matched_conditions=["Vaginal Bleeding/Spotting reported"],
        ))

    # 5. Fetal Movement
    if gestational_age_weeks and gestational_age_weeks >= 28:
        if fetal_mov == "None":
            rules.append(RuleResult(
                rule_id="R-CHK-05A",
                rule_name="Critical Obstetric Alert: Zero Fetal Movement",
                severity="high",
                matched_conditions=[f"Zero fetal movement reported at week {gestational_age_weeks}"],
            ))
        elif fetal_mov == "Decreased":
            rules.append(RuleResult(
                rule_id="R-CHK-05B",
                rule_name="Decreased Fetal Movement Concern",
                severity="clinical_review",
                matched_conditions=[f"Decreased fetal movement reported at week {gestational_age_weeks}"],
            ))

    # 6. Hydration Warning
    if water > 0 and water < 4:
        rules.append(RuleResult(
            rule_id="R-CHK-06",
            rule_name="Under-hydration Risk (< 4 cups/day)",
            severity="monitor",
            matched_conditions=[f"Daily water consumption is low: {water} cups"],
        ))

