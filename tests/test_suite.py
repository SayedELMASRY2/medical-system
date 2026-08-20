import unittest
from config import settings, get_model_info
from core.state import AgentState
from risk_engine.engine import DeterministicRiskEngine
from core.tools.date_tools import get_pregnancy_dates, get_nearest_appointment
from core.tools.form_parser import parse_md_form
from core.tools.ocr_tools import parse_lab_results_from_text
from graph.pregnancy_graph import build_pregnancy_graph, _route_from_supervisor
from api.app import create_api_app
from fastapi.testclient import TestClient


class TestMaternaMedicalSystem(unittest.TestCase):

    def test_01_configuration(self):
        info = get_model_info()
        self.assertIn("provider", info)
        self.assertIn("cohere_embed", info)
        self.assertEqual(info["qdrant_collection"], "materna_medical_corpus_v1")
        self.assertTrue(settings.cohere_api_key)
        self.assertTrue(settings.qdrant_url)

    def test_02_risk_engine_severe_hypertension(self):
        level, rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=24,
            vitals={"systolic_bp": 165, "diastolic_bp": 112},
            symptoms=["severe headache", "blurry vision"],
            lab_results={"Platelets": 95000, "Hemoglobin": 8.5},
        )
        self.assertEqual(level, "high")
        rule_ids = [r.rule_id for r in rules]
        self.assertIn("R-HTN-01", rule_ids)
        self.assertIn("R-LAB-01", rule_ids)

    def test_03_risk_engine_normal(self):
        level, rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=14,
            vitals={"systolic_bp": 118, "diastolic_bp": 75},
            symptoms=[],
            lab_results={"Hemoglobin": 12.5, "Platelets": 240000},
        )
        self.assertEqual(level, "low")
        self.assertEqual(len(rules), 0)

    def test_04_date_tools(self):
        res = get_pregnancy_dates.invoke({"lmp_date": "2026-05-15", "country": "EG"})
        self.assertIn("edd", res)
        self.assertIn("gestational_age", res)
        self.assertEqual(res["gestational_age"]["weeks"], 13)

    def test_05_form_parser(self):
        with open("examples/sample_form_en.md", encoding="utf-8") as f:
            content = f.read()
        res = parse_md_form.invoke({"md_content": content})
        self.assertIn("symptoms", res)

    def test_06_ocr_text_parser(self):
        raw = "Hemoglobin: 11.2 g/dL\nPlatelets: 185,000 /uL\nGlucose: 95 mg/dL"
        parsed = parse_lab_results_from_text(raw)
        self.assertIn("Hemoglobin", parsed)
        self.assertIn("Glucose", parsed)

    def test_07_graph_topology(self):
        graph = build_pregnancy_graph()
        nodes = list(graph.get_graph().nodes.keys())
        expected_nodes = [
            "__start__", "ocr_agent", "supervisor",
            "timeline_agent", "medical_agent", "triage_agent",
            "chatbot_agent", "dashboard_agent", "__end__",
        ]
        for node in expected_nodes:
            self.assertIn(node, nodes)

    def test_08_supervisor_routing(self):
        self.assertEqual(_route_from_supervisor({"next_agent": "medical_agent"}), "medical_agent")
        self.assertEqual(_route_from_supervisor({"next_agent": "triage_agent"}), "triage_agent")
        self.assertEqual(_route_from_supervisor({"next_agent": "unknown"}), "chatbot_agent")

    def test_09_fastapi_health(self):
        client = TestClient(create_api_app())
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_10_fastapi_details(self):
        client = TestClient(create_api_app())
        res = client.get("/api/v1/health/details")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["cohere_configured"])
        self.assertTrue(data["qdrant_configured"])


if __name__ == "__main__":
    unittest.main()
