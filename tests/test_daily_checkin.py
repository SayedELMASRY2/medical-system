import unittest
from fastapi.testclient import TestClient
from database import init_db, get_session_factory, save_daily_checkin, get_patient_daily_checkins
from risk_engine.engine import DeterministicRiskEngine
from api.app import create_api_app


class TestDailyCheckInSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.SessionLocal = get_session_factory()
        cls.app = create_api_app()
        cls.client = TestClient(cls.app)

    def test_01_database_save_checkin(self):
        with self.SessionLocal() as db:
            record = save_daily_checkin(db, "PT-TEST-CHK", {
                "checkin_date": "2026-08-20",
                "weight_kg": 68.5,
                "systolic_bp": 122,
                "diastolic_bp": 78,
                "water_intake_cups": 8,
                "diet_quality": "Balanced",
                "activity_level": "Light/Walking",
                "sleep_hours": 8.0,
                "swelling_edema": "None",
                "headache": "None",
            })
            self.assertIsNotNone(record.id)
            self.assertEqual(record.water_intake_cups, 8)

            checkins = get_patient_daily_checkins(db, "PT-TEST-CHK")
            self.assertTrue(len(checkins) >= 1)

    def test_02_preeclampsia_triad_risk_engine(self):
        risk_level, rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=32,
            vitals={"systolic_bp": 148, "diastolic_bp": 94},
            symptoms=["Severe headache", "Vision changes", "Swelling in Hands/Face"],
            checkin_data={
                "swelling_edema": "Hands/Face",
                "headache": "Severe",
                "vision_changes": {"present": True},
                "water_intake_cups": 3,
                "diet_quality": "High Sodium",
            }
        )
        self.assertEqual(risk_level, "high")
        rule_ids = [r.rule_id for r in rules]
        self.assertIn("R-CHK-01", rule_ids)  # Preeclampsia Warning Triad

    def test_03_api_daily_checkin_flow(self):
        payload = {
            "patient_id": "PT-API-CHK",
            "weight_kg": 72.0,
            "systolic_bp": 128,
            "diastolic_bp": 82,
            "blood_sugar_mg_dl": 105.0,
            "diet_quality": "Balanced",
            "water_intake_cups": 9,
            "activity_level": "Light/Walking",
            "sleep_hours": 7.5,
            "sleep_quality": "Good",
            "prenatal_vitamins": ["Iron", "Folic Acid"],
            "specific_medications": [],
            "swelling_edema": "None",
            "headache": "None",
            "vision_changes": False,
            "right_upper_quadrant_pain": False,
            "vaginal_bleeding": False,
            "fetal_movement": "Normal",
            "kick_count": 12
        }
        res = self.client.post("/api/v1/checkin/", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["checkin"]["water_intake_cups"], 9)

        # Get history
        res_hist = self.client.get("/api/v1/checkin/history?patient_id=PT-API-CHK")
        self.assertEqual(res_hist.status_code, 200)
        hist_data = res_hist.json()
        self.assertTrue(hist_data["total_checkins"] >= 1)


if __name__ == "__main__":
    unittest.main()
