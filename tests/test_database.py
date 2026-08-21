import os
import unittest
from database import (
    init_db, get_session_factory, upsert_patient, get_patient,
    add_timeline_entry, get_patient_timeline, save_lab_result,
    save_triage_assessment, get_patient_dashboard_summary,
)


class TestDatabaseSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        cls.SessionLocal = get_session_factory()

    def test_01_upsert_and_get_patient(self):
        with self.SessionLocal() as db:
            patient = upsert_patient(db, {
                "patient_id": "PT-DB-001",
                "name": "Yasmin Khaled",
                "age": 29,
                "country": "EG",
                "city": "Giza",
                "lmp_date": "2026-05-01",
                "blood_type": "O+",
            })
            self.assertEqual(patient.name, "Yasmin Khaled")

            retrieved = get_patient(db, "PT-DB-001")
            self.assertIsNotNone(retrieved)
            self.assertEqual(retrieved.city, "Giza")

    def test_02_timeline_persistence(self):
        with self.SessionLocal() as db:
            entry = add_timeline_entry(db, "PT-DB-001", {
                "date": "2026-08-19",
                "week": 15,
                "symptoms": ["mild nausea"],
                "vitals": {"systolic_bp": 118, "diastolic_bp": 76},
                "notes": "Routine checkup",
            })
            self.assertIsNotNone(entry.id)

            timeline = get_patient_timeline(db, "PT-DB-001")
            self.assertGreaterEqual(len(timeline), 1)
            self.assertEqual(timeline[0].week, 15)

    def test_03_lab_result_persistence(self):
        with self.SessionLocal() as db:
            lab = save_lab_result(db, "PT-DB-001", {
                "date": "2026-08-19",
                "lab_name": "Giza Lab",
                "results": {"Hemoglobin": 12.1, "Platelets": 210000},
                "confidence": 0.98,
            })
            self.assertIsNotNone(lab.id)
            self.assertEqual(lab.results["Hemoglobin"], 12.1)

    def test_04_triage_persistence(self):
        with self.SessionLocal() as db:
            triage = save_triage_assessment(
                db=db,
                patient_id="PT-DB-001",
                risk_level="high",
                triggered_rules=[{"rule_id": "R-HTN-01", "rule_name": "Severe Hypertension"}],
                triage_alert="Urgent follow-up required",
            )
            self.assertIsNotNone(triage.id)
            self.assertEqual(triage.risk_level, "high")

    def test_05_dashboard_summary(self):
        with self.SessionLocal() as db:
            summary = get_patient_dashboard_summary(db, "PT-DB-001")
            self.assertEqual(summary["patient"]["name"], "Yasmin Khaled")
            self.assertEqual(summary["latest_triage"]["risk_level"], "high")


if __name__ == "__main__":
    unittest.main()
