"""
Vital signs logging endpoint — Task 4.3.

POST /patients/{patient_id}/vitals  — Log a daily check-in.
GET  /patients/{patient_id}/vitals  — Retrieve check-in history.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.crud.daily_checkin import (
    create_checkin,
    get_checkin_by_patient_and_date,
    get_checkins_for_patient,
)
from app.crud.patient import get_patient_by_id
from app.models.user import User
from app.ai.state import VitalSigns
from app.risk_engine.engine import DeterministicRiskEngine
from app.schemas.daily_checkin import (
    DailyCheckInCreate,
    DailyCheckInList,
    DailyCheckInResponse,
    VitalsLogResponse,
)

router = APIRouter(prefix="/patients", tags=["Vitals"])


@router.post(
    "/{patient_id}/vitals",
    response_model=VitalsLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a daily check-in (vital signs, symptoms, lifestyle)",
)
async def log_vitals(
    patient_id: UUID,
    checkin_in: DailyCheckInCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a daily check-in record for a patient, covering all sections
    defined in DAILY_CHECKIN.md:

    - **§1 Basic Vitals:** weight, BP, heart rate, blood glucose, proteinuria
    - **§2 Nutrition:** diet quality, hydration
    - **§3 Lifestyle:** activity level, sleep
    - **§4 Medications:** medications taken, supplements
    - **§5 Symptoms:** edema, headache, vision changes, abdominal pain, bleeding
    - **§6 Fetal Monitoring:** fetal movement, kick count, fetal heart rate

    One check-in per patient per day is enforced. Submitting again for the
    same date returns **409 Conflict**.

    **Authorization:**
    - **PATIENT**: Can only log vitals for their own profile.
    - **DOCTOR/MIDWIFE**: Can log vitals for any patient.
    """
    # 1. Validate that the patient exists
    patient = await get_patient_by_id(db, patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient profile '{patient_id}' not found.",
        )

    # 2. Authorization — patients can only log for themselves
    if current_user.role.value == "PATIENT" and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only log vitals for your own profile.",
        )

    # 3. Resolve the check-in date (default to today UTC)
    from datetime import datetime, timezone as tz

    checkin_date = checkin_in.checkin_date
    if checkin_date is None:
        checkin_date = datetime.now(tz.utc).date()

    # 4. Check for duplicate check-in on the same date
    existing = await get_checkin_by_patient_and_date(db, patient_id, checkin_date)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A check-in already exists for patient '{patient_id}' on {checkin_date}.",
        )

    # 5. Persist the check-in
    # Override the date in the schema to the resolved value
    checkin_in.checkin_date = checkin_date
    checkin = await create_checkin(db, patient_id, checkin_in)

    # 6. RiskEngine Integration
    risk_assessment = None
    if all(
        v is not None for v in [
            checkin_in.systolic_bp,
            checkin_in.diastolic_bp,
            checkin_in.heart_rate,
            checkin_in.weight_kg,
        ]
    ):
        vitals_obj = VitalSigns(
            systolic_bp=checkin_in.systolic_bp,
            diastolic_bp=checkin_in.diastolic_bp,
            heart_rate=checkin_in.heart_rate,
            weight_kg=checkin_in.weight_kg,
            fetal_heart_rate=checkin_in.fetal_heart_rate,
            blood_glucose=checkin_in.blood_glucose,
            proteinuria=checkin_in.proteinuria,
        )

        symptoms = []
        if checkin_in.headache_severity and checkin_in.headache_severity.value == "SEVERE":
            symptoms.append("severe headache")
        if checkin_in.vision_changes:
            symptoms.append("visual disturbances")
        if checkin_in.abdominal_pain:
            symptoms.append("epigastric pain")
        if checkin_in.edema_location:
            symptoms.append("swelling")

        severity, rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=patient.gestational_age_weeks,
            vitals=vitals_obj,
            symptoms=symptoms,
            trends=None,
        )

        # Persist the new risk level
        patient.risk_status = severity
        await db.commit()
        await db.refresh(patient)

        risk_assessment = {
            "highest_severity": severity,
            "triggered_rules": [r.model_dump() for r in rules],
        }

    return VitalsLogResponse(
        checkin=DailyCheckInResponse.model_validate(checkin),
        risk_assessment=risk_assessment,
    )


@router.get(
    "/{patient_id}/vitals",
    response_model=DailyCheckInList,
    summary="Retrieve check-in history for a patient",
)
async def get_vitals_history(
    patient_id: UUID,
    skip: int = Query(default=0, ge=0, description="Records to skip"),
    limit: int = Query(default=30, ge=1, le=100, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve the paginated check-in history for a patient, ordered newest first.

    **Authorization:**
    - **PATIENT**: Can only view their own check-in history.
    - **DOCTOR/MIDWIFE**: Can view any patient's history.
    """
    # 1. Validate that the patient exists
    patient = await get_patient_by_id(db, patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient profile '{patient_id}' not found.",
        )

    # 2. Authorization
    if current_user.role.value == "PATIENT" and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own check-in history.",
        )

    # 3. Fetch paginated history
    checkins, total = await get_checkins_for_patient(
        db, patient_id, skip=skip, limit=limit,
    )

    return DailyCheckInList(
        checkins=[DailyCheckInResponse.model_validate(c) for c in checkins],
        total=total,
    )
