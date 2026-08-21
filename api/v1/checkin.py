from typing import Any, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database.connection import get_db
from database.crud import (
    save_daily_checkin, get_patient_daily_checkins,
    add_timeline_entry, save_triage_assessment, get_patient,
)
from risk_engine.engine import DeterministicRiskEngine
from core.tools.date_tools import summarize_checkin_trends

router = APIRouter(prefix="/checkin", tags=["Daily Check-in"])


class DailyCheckInRequest(BaseModel):
    patient_id: str = "PT-001"
    checkin_date: Optional[str] = None
    
    # 1. Basic Vitals
    weight_kg: Optional[float] = Field(default=None, description="Weight in kg")
    systolic_bp: Optional[int] = Field(default=None, description="Systolic blood pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(default=None, description="Diastolic blood pressure (mmHg)")
    blood_sugar_mg_dl: Optional[float] = Field(default=None, description="Fasting/post-prandial blood sugar (mg/dL)")
    
    # 2. Nutrition & Hydration
    diet_quality: Optional[str] = Field(default="Balanced", description="High Protein, High Carbs, High Sodium, Balanced")
    water_intake_cups: int = Field(default=8, description="Water cups consumed today")
    
    # 3. Lifestyle & Activity
    activity_level: Optional[str] = Field(default="Light/Walking", description="Resting, Light/Walking, Moderate/Exercise, Strenuous")
    sleep_hours: Optional[float] = Field(default=7.5, description="Hours of sleep")
    sleep_quality: Optional[str] = Field(default="Good", description="Poor, Fair, Good")
    
    # 4. Medications & Supplements
    prenatal_vitamins: list[str] = Field(default_factory=lambda: ["Iron", "Folic Acid", "Calcium"])
    specific_medications: list[str] = Field(default_factory=list, description="e.g. Aspirin, Labetalol, Insulin")
    
    # 5. Symptoms & Warning Signs
    swelling_edema: str = Field(default="None", description="None, Legs, Hands/Face")
    headache: str = Field(default="None", description="None, Mild, Severe/Unrelenting")
    vision_changes: bool = Field(default=False, description="Blurry vision, visual spots")
    right_upper_quadrant_pain: bool = Field(default=False, description="Abdominal pain in liver area")
    vaginal_bleeding: bool = Field(default=False, description="Bleeding or spotting")
    
    # 6. Fetal Monitoring (>28 Weeks)
    fetal_movement: str = Field(default="Normal", description="Normal, Decreased, None")
    kick_count: Optional[int] = Field(default=None, description="Kick count in 2 hours")


@router.post("/")
async def submit_daily_checkin(req: DailyCheckInRequest, db: Session = Depends(get_db)):
    patient = get_patient(db, req.patient_id)
    ga_weeks = 14  # Default baseline gestational week
    if patient and patient.lmp_date:
        from core.tools.date_tools import get_pregnancy_dates
        try:
            dates = get_pregnancy_dates.invoke({"lmp_date": patient.lmp_date})
            ga_weeks = dates.get("gestational_age", {}).get("weeks", 14)
        except Exception:
            pass

    checkin_dict = req.model_dump()
    vitals_dict = {}
    if req.systolic_bp and req.diastolic_bp:
        vitals_dict["systolic_bp"] = req.systolic_bp
        vitals_dict["diastolic_bp"] = req.diastolic_bp

    symptoms_list = []
    if req.headache != "None":
        symptoms_list.append(f"{req.headache} headache")
    if req.swelling_edema != "None":
        symptoms_list.append(f"Swelling in {req.swelling_edema}")
    if req.vision_changes:
        symptoms_list.append("Vision changes")
    if req.right_upper_quadrant_pain:
        symptoms_list.append("Right upper quadrant pain")
    if req.vaginal_bleeding:
        symptoms_list.append("Vaginal bleeding")

    risk_level, rule_objects = DeterministicRiskEngine.evaluate(
        gestational_age_weeks=ga_weeks,
        vitals=vitals_dict,
        symptoms=symptoms_list,
        checkin_data=checkin_dict,
    )

    triggered_rules = [
        {
            "rule_id": r.rule_id,
            "rule_name": r.rule_name,
            "severity": r.severity,
            "matched_conditions": r.matched_conditions,
        }
        for r in rule_objects
    ]

    checkin_dict["risk_level"] = risk_level
    checkin_dict["triggered_rules"] = triggered_rules

    record = save_daily_checkin(db, req.patient_id, checkin_dict)

    add_timeline_entry(db, req.patient_id, {
        "date": record.checkin_date,
        "week": ga_weeks,
        "symptoms": symptoms_list,
        "vitals": vitals_dict,
        "notes": f"Daily Check-in: Diet ({req.diet_quality}), Water ({req.water_intake_cups} cups), Activity ({req.activity_level})",
        "form_source": "daily_checkin",
    })

    if risk_level in ["high", "clinical_review"]:
        alert_msg = f"Alert triggered during daily check-in ({risk_level.upper()}): " + ", ".join([r["rule_name"] for r in triggered_rules])
        save_triage_assessment(db, req.patient_id, risk_level, triggered_rules, alert_msg)

    return {
        "status": "success",
        "message": "Daily check-in recorded successfully",
        "risk_level": risk_level,
        "triggered_rules": triggered_rules,
        "checkin": {
            "id": record.id,
            "date": record.checkin_date,
            "weight_kg": record.weight_kg,
            "blood_pressure": f"{record.systolic_bp}/{record.diastolic_bp}" if record.systolic_bp else "Not entered",
            "water_intake_cups": record.water_intake_cups,
            "diet_quality": record.diet_quality,
            "swelling_edema": record.swelling_edema,
            "headache": record.headache,
            "fetal_movement": record.fetal_movement,
        }
    }


@router.get("/history")
async def get_checkin_history(patient_id: str = "PT-001", db: Session = Depends(get_db)):
    records = get_patient_daily_checkins(db, patient_id)
    return {
        "status": "success",
        "patient_id": patient_id,
        "total_checkins": len(records),
        "history": [
            {
                "id": r.id,
                "checkin_date": r.checkin_date,
                "weight_kg": r.weight_kg,
                "systolic_bp": r.systolic_bp,
                "diastolic_bp": r.diastolic_bp,
                "blood_sugar_mg_dl": r.blood_sugar_mg_dl,
                "diet_quality": r.diet_quality,
                "water_intake_cups": r.water_intake_cups,
                "activity_level": r.activity_level,
                "sleep_hours": r.sleep_hours,
                "sleep_quality": r.sleep_quality,
                "swelling_edema": r.swelling_edema,
                "headache": r.headache,
                "fetal_movement": r.fetal_movement,
                "risk_level": r.risk_level,
                "triggered_rules": r.triggered_rules,
            }
            for r in records
        ]
    }


@router.get("/trends")
async def get_checkin_trends(patient_id: str = "PT-001", db: Session = Depends(get_db)):
    records = get_patient_daily_checkins(db, patient_id)
    checkins_data = [
        {
            "checkin_date": r.checkin_date,
            "water_intake_cups": r.water_intake_cups,
            "headache": r.headache,
            "diet_quality": r.diet_quality,
            "swelling_edema": r.swelling_edema,
        }
        for r in records
    ]
    analysis = summarize_checkin_trends.invoke({"checkins": checkins_data})
    return {
        "status": "success",
        "patient_id": patient_id,
        "analysis": analysis,
    }
