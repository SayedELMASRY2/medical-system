import json
import unittest
from unittest.mock import patch
from config import settings
from risk_engine.engine import DeterministicRiskEngine
from core.tools.date_tools import get_pregnancy_dates
from core.tools.ocr_tools import parse_lab_results_from_text
from api.app import create_api_app
from fastapi.testclient import TestClient


SYNTHETIC_HIGH_RISK_PATIENT = {
    "patient_id": "PT-HIGH-001",
    "name": "Sarah Mansour",
    "age": 31,
    "gestational_age_weeks": 28,
    "gestational_age_days": 4,
    "country": "EG",
    "city": "Alexandria",
    "lmp_date": "2026-02-01",
    "blood_type": "O-",
    "weight_kg": 74.5,
    "medical_history": ["Chronic Hypertension"],
}

SYNTHETIC_NORMAL_PATIENT = {
    "patient_id": "PT-NORM-002",
    "name": "Nour El-Din",
    "age": 25,
    "gestational_age_weeks": 14,
    "gestational_age_days": 1,
    "country": "EG",
    "city": "Cairo",
    "lmp_date": "2026-05-15",
    "blood_type": "B+",
    "weight_kg": 62.0,
    "medical_history": [],
}

SYNTHETIC_LAB_TEXT = """
Hemoglobin 8.2 g/dL
Platelets 88000 /uL
Fasting Blood Glucose 142 mg/dL
D-Dimer 0.85 mg/L
ALT 85 U/L
AST 92 U/L
Systolic BP 165 mmHg
Diastolic BP 108 mmHg
"""


class TestSyntheticDataScenarios(unittest.TestCase):

    def test_scenario_01_deterministic_high_risk_engine(self):
        print("\n--- Running Scenario 1: Synthetic High-Risk Preeclampsia/HELLP Evaluation ---")

        vitals = {"systolic_bp": 165, "diastolic_bp": 108, "proteinuria": "+2"}
        symptoms = ["severe headache", "visual disturbances", "epigastric pain"]
        labs = parse_lab_results_from_text(SYNTHETIC_LAB_TEXT)

        risk_level, triggered_rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=SYNTHETIC_HIGH_RISK_PATIENT["gestational_age_weeks"],
            vitals=vitals,
            symptoms=symptoms,
            lab_results=labs,
        )

        self.assertEqual(risk_level, "high")
        rule_ids = [r.rule_id for r in triggered_rules]

        self.assertIn("R-HTN-01", rule_ids)  # Severe Hypertension
        self.assertIn("R-LAB-01", rule_ids)  # Severe Thrombocytopenia (<100k)
        self.assertIn("R-LAB-02", rule_ids)  # Elevated D-Dimer
        self.assertIn("R-LAB-03", rule_ids)  # Moderate Anemia (Hgb 8.2)

        print(f"✅ Risk Level: {risk_level.upper()}")
        print(f"✅ Triggered Rules Count: {len(triggered_rules)}")
        for r in triggered_rules:
            print(f"   • [{r.severity.upper()}] {r.rule_name}: {r.matched_conditions}")

    def test_scenario_02_deterministic_normal_patient(self):
        print("\n--- Running Scenario 2: Synthetic Normal Gestational Evaluation ---")

        vitals = {"systolic_bp": 116, "diastolic_bp": 74}
        symptoms = []
        labs = {"Hemoglobin": 12.4, "Platelets": 230000, "Fasting Blood Glucose": 88}

        risk_level, triggered_rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=SYNTHETIC_NORMAL_PATIENT["gestational_age_weeks"],
            vitals=vitals,
            symptoms=symptoms,
            lab_results=labs,
        )

        self.assertEqual(risk_level, "low")
        self.assertEqual(len(triggered_rules), 0)

        print(f"✅ Risk Level: {risk_level.upper()} (Zero alerts triggered)")

    def test_scenario_03_pregnancy_dates_calculation(self):
        print("\n--- Running Scenario 3: Pregnancy Dates Calculation ---")

        dates = get_pregnancy_dates.invoke({
            "lmp_date": SYNTHETIC_NORMAL_PATIENT["lmp_date"],
            "country": "EG",
        })

        self.assertEqual(dates["gestational_age"]["weeks"], 13)
        self.assertIn("edd", dates)
        self.assertIn("trimester", dates)

        print(f"✅ Estimated Due Date (EDD): {dates['edd']}")
        print(f"✅ Gestational Age: {dates['gestational_age']['weeks']}w {dates['gestational_age']['days']}d")
        print(f"✅ Current Trimester: {dates['trimester']}")

    def test_scenario_04_ocr_synthetic_lab_parser(self):
        print("\n--- Running Scenario 4: Synthetic Lab Parser ---")

        parsed = parse_lab_results_from_text(SYNTHETIC_LAB_TEXT)

        self.assertIn("Hemoglobin", parsed)
        self.assertEqual(parsed["Hemoglobin"]["value"], 8.2)
        self.assertIn("Platelets", parsed)
        self.assertEqual(parsed["Platelets"]["value"], 88000.0)

        print(f"✅ Parsed {len(parsed)} lab metrics successfully:")
        for name, data in parsed.items():
            print(f"   • {name}: {data['value']} {data.get('unit', '')}")

    def test_scenario_05_fastapi_health_and_details_synthetic(self):
        print("\n--- Running Scenario 5: FastAPI Health & Details Synthetic Check ---")

        client = TestClient(create_api_app())
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)

        details = client.get("/api/v1/health/details")
        self.assertEqual(details.status_code, 200)
        data = details.json()

        print(f"✅ Health Endpoint: 200 OK ({response.json()['service']})")
        print(f"✅ Cohere Configured: {data['cohere_configured']}")
        print(f"✅ Qdrant Configured: {data['qdrant_configured']}")


if __name__ == "__main__":
    unittest.main()
