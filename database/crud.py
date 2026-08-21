from datetime import datetime
from typing import Any, Optional
from sqlalchemy.orm import Session
from database.models import PatientModel, TimelineModel, LabResultModel, TriageModel, PatientCheckInModel


def upsert_patient(db: Session, data: dict[str, Any]) -> PatientModel:
    patient_id = data.get("patient_id") or data.get("id") or "PT-DEFAULT"
    patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()

    if not patient:
        patient = PatientModel(
            id=patient_id,
            name=data.get("name", "Unknown Patient"),
            age=data.get("age"),
            country=data.get("country", "EG"),
            city=data.get("city", "Cairo"),
            lmp_date=data.get("lmp_date"),
            edd=data.get("edd"),
            blood_type=data.get("blood_type"),
            weight_kg=data.get("weight_kg"),
            height_cm=data.get("height_cm"),
            medical_history=data.get("medical_history", []),
            allergies=data.get("allergies", []),
            current_medications=data.get("current_medications", []),
        )
        db.add(patient)
    else:
        for key in ["name", "age", "country", "city", "lmp_date", "edd", "blood_type", "weight_kg", "height_cm"]:
            if key in data and data[key] is not None:
                setattr(patient, key, data[key])
        if "medical_history" in data:
            patient.medical_history = data["medical_history"]
        if "allergies" in data:
            patient.allergies = data["allergies"]
        if "current_medications" in data:
            patient.current_medications = data["current_medications"]

    db.commit()
    db.refresh(patient)
    return patient


def get_patient(db: Session, patient_id: str) -> Optional[PatientModel]:
    return db.query(PatientModel).filter(PatientModel.id == patient_id).first()


def add_timeline_entry(db: Session, patient_id: str, entry: dict[str, Any]) -> TimelineModel:
    model = TimelineModel(
        patient_id=patient_id,
        date=entry.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        week=entry.get("week"),
        day=entry.get("day"),
        symptoms=entry.get("symptoms", []),
        vitals=entry.get("vitals", {}),
        notes=entry.get("notes"),
        form_source=entry.get("form_source", "form"),
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def get_patient_timeline(db: Session, patient_id: str) -> list[TimelineModel]:
    return db.query(TimelineModel).filter(TimelineModel.patient_id == patient_id).order_by(TimelineModel.id.asc()).all()


def save_lab_result(db: Session, patient_id: str, lab_data: dict[str, Any]) -> LabResultModel:
    model = LabResultModel(
        patient_id=patient_id,
        date=lab_data.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
        lab_name=lab_data.get("lab_name"),
        results=lab_data.get("results", lab_data),
        ocr_source=lab_data.get("source", "vision_llm"),
        confidence=lab_data.get("confidence", 1.0),
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def save_triage_assessment(
    db: Session,
    patient_id: str,
    risk_level: str,
    triggered_rules: list[dict[str, Any]],
    triage_alert: Optional[str] = None,
) -> TriageModel:
    model = TriageModel(
        patient_id=patient_id,
        risk_level=risk_level,
        triggered_rules=triggered_rules,
        triage_alert=triage_alert,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def get_patient_dashboard_summary(db: Session, patient_id: str) -> dict[str, Any]:
    patient = get_patient(db, patient_id)
    timeline = get_patient_timeline(db, patient_id)
    labs = db.query(LabResultModel).filter(LabResultModel.patient_id == patient_id).order_by(LabResultModel.id.desc()).all()
    triages = db.query(TriageModel).filter(TriageModel.patient_id == patient_id).order_by(TriageModel.id.desc()).all()

    return {
        "patient": {
            "id": patient.id if patient else patient_id,
            "name": patient.name if patient else "Unknown",
            "age": patient.age if patient else None,
            "country": patient.country if patient else "EG",
            "lmp_date": patient.lmp_date if patient else None,
            "edd": patient.edd if patient else None,
        } if patient else {},
        "timeline_count": len(timeline),
        "latest_vitals": timeline[-1].vitals if timeline else {},
        "latest_lab_results": labs[0].results if labs else {},
        "latest_triage": {
            "risk_level": triages[0].risk_level,
            "triage_alert": triages[0].triage_alert,
            "triggered_rules": triages[0].triggered_rules,
        } if triages else {},
    }


def save_daily_checkin(db: Session, patient_id: str, data: dict[str, Any]) -> PatientCheckInModel:
    checkin_date = data.get("checkin_date") or datetime.utcnow().strftime("%Y-%m-%d")
    existing = db.query(PatientCheckInModel).filter(
        PatientCheckInModel.patient_id == patient_id,
        PatientCheckInModel.checkin_date == checkin_date
    ).first()

    if not existing:
        model = PatientCheckInModel(
            patient_id=patient_id,
            checkin_date=checkin_date,
            weight_kg=data.get("weight_kg"),
            systolic_bp=data.get("systolic_bp"),
            diastolic_bp=data.get("diastolic_bp"),
            blood_sugar_mg_dl=data.get("blood_sugar_mg_dl"),
            diet_quality=data.get("diet_quality"),
            water_intake_cups=data.get("water_intake_cups", 0),
            activity_level=data.get("activity_level"),
            sleep_hours=data.get("sleep_hours"),
            sleep_quality=data.get("sleep_quality"),
            prenatal_vitamins=data.get("prenatal_vitamins", []),
            specific_medications=data.get("specific_medications", []),
            swelling_edema=data.get("swelling_edema", "None"),
            headache=data.get("headache", "None"),
            vision_changes=data.get("vision_changes", {}),
            right_upper_quadrant_pain=data.get("right_upper_quadrant_pain", {}),
            vaginal_bleeding=data.get("vaginal_bleeding", {}),
            fetal_movement=data.get("fetal_movement", "Normal"),
            kick_count=data.get("kick_count"),
            risk_level=data.get("risk_level", "low"),
            triggered_rules=data.get("triggered_rules", []),
        )
        db.add(model)
    else:
        for field in [
            "weight_kg", "systolic_bp", "diastolic_bp", "blood_sugar_mg_dl",
            "diet_quality", "water_intake_cups", "activity_level", "sleep_hours",
            "sleep_quality", "prenatal_vitamins", "specific_medications",
            "swelling_edema", "headache", "vision_changes", "right_upper_quadrant_pain",
            "vaginal_bleeding", "fetal_movement", "kick_count", "risk_level", "triggered_rules"
        ]:
            if field in data and data[field] is not None:
                setattr(existing, field, data[field])
        model = existing

    db.commit()
    db.refresh(model)
    return model


def get_patient_daily_checkins(db: Session, patient_id: str) -> list[PatientCheckInModel]:
    return db.query(PatientCheckInModel).filter(
        PatientCheckInModel.patient_id == patient_id
    ).order_by(PatientCheckInModel.checkin_date.asc()).all()

