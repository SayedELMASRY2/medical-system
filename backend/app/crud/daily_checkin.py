"""CRUD operations for the DailyCheckIn model."""

from datetime import date, timezone
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.daily_checkin import DailyCheckIn
from app.schemas.daily_checkin import DailyCheckInCreate


async def get_checkin_by_id(db: AsyncSession, checkin_id: UUID) -> DailyCheckIn | None:
    """Fetch a single check-in by primary key."""
    result = await db.execute(
        select(DailyCheckIn).where(DailyCheckIn.id == checkin_id)
    )
    return result.scalar_one_or_none()


async def get_checkin_by_patient_and_date(
    db: AsyncSession,
    patient_id: UUID,
    checkin_date: date,
) -> DailyCheckIn | None:
    """Fetch a check-in for a specific patient on a specific date."""
    result = await db.execute(
        select(DailyCheckIn).where(
            DailyCheckIn.patient_id == patient_id,
            DailyCheckIn.checkin_date == checkin_date,
        )
    )
    return result.scalar_one_or_none()


async def get_checkins_for_patient(
    db: AsyncSession,
    patient_id: UUID,
    *,
    skip: int = 0,
    limit: int = 30,
) -> Tuple[List[DailyCheckIn], int]:
    """
    Fetch paginated check-in history for a patient, newest first.

    Returns:
        Tuple of (list of check-ins, total count).
    """
    base = select(DailyCheckIn).where(DailyCheckIn.patient_id == patient_id)
    count_query = select(func.count()).select_from(DailyCheckIn).where(
        DailyCheckIn.patient_id == patient_id
    )

    query = base.order_by(DailyCheckIn.checkin_date.desc()).offset(skip).limit(limit)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    result = await db.execute(query)
    checkins = list(result.scalars().all())

    return checkins, total


async def create_checkin(
    db: AsyncSession,
    patient_id: UUID,
    checkin_in: DailyCheckInCreate,
) -> DailyCheckIn:
    """
    Create a new daily check-in record for a patient.

    If checkin_date is None, defaults to today (UTC).
    """
    from datetime import datetime

    checkin_date = checkin_in.checkin_date
    if checkin_date is None:
        checkin_date = datetime.now(timezone.utc).date()

    checkin = DailyCheckIn(
        patient_id=patient_id,
        checkin_date=checkin_date,
        # §1 Vitals
        weight_kg=checkin_in.weight_kg,
        systolic_bp=checkin_in.systolic_bp,
        diastolic_bp=checkin_in.diastolic_bp,
        heart_rate=checkin_in.heart_rate,
        blood_glucose=checkin_in.blood_glucose,
        proteinuria=checkin_in.proteinuria,
        # §2 Nutrition
        diet_quality=checkin_in.diet_quality,
        hydration_liters=checkin_in.hydration_liters,
        # §3 Lifestyle
        activity_level=checkin_in.activity_level,
        sleep_hours=checkin_in.sleep_hours,
        sleep_quality=checkin_in.sleep_quality,
        # §4 Medications
        medications_taken=checkin_in.medications_taken,
        supplements_taken=checkin_in.supplements_taken,
        # §5 Symptoms
        edema_location=checkin_in.edema_location,
        headache_severity=checkin_in.headache_severity,
        vision_changes=checkin_in.vision_changes,
        abdominal_pain=checkin_in.abdominal_pain,
        vaginal_bleeding=checkin_in.vaginal_bleeding,
        # §6 Fetal
        fetal_movement=checkin_in.fetal_movement,
        kick_count=checkin_in.kick_count,
        fetal_heart_rate=checkin_in.fetal_heart_rate,
        # Metadata
        notes=checkin_in.notes,
    )
    db.add(checkin)
    await db.commit()
    await db.refresh(checkin)
    return checkin
