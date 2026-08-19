"""CRUD operations for the PatientProfile model."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import PatientProfile
from app.schemas.patient import PatientProfileCreate, PatientProfileUpdate


async def get_patient_by_id(db: AsyncSession, patient_id: UUID) -> PatientProfile | None:
    """Fetch a patient profile by primary key."""
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.id == patient_id)
    )
    return result.scalar_one_or_none()


async def get_patients(
    db: AsyncSession,
    *,
    is_active: Optional[bool] = True,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[PatientProfile], int]:
    """
    Fetch a paginated list of patient profiles with optional filters.

    Returns:
        Tuple of (list of patients, total count).
    """
    query = select(PatientProfile)
    count_query = select(func.count()).select_from(PatientProfile)
    if is_active is not None:
        query = query.where(PatientProfile.is_active == is_active)
        count_query = count_query.where(PatientProfile.is_active == is_active)

    # Order by risk severity (highest first) for dashboard relevance
    # Use CASE expression for risk-based ordering
    from sqlalchemy import case
    risk_sort = case(
        (PatientProfile.risk_status == "high", 0),
        (PatientProfile.risk_status == "clinical_review", 1),
        (PatientProfile.risk_status == "monitor", 2),
        (PatientProfile.risk_status == "low", 3),
        else_=4,
    )
    query = query.order_by(risk_sort, PatientProfile.updated_at.desc())
    query = query.offset(skip).limit(limit)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    result = await db.execute(query)
    patients = list(result.scalars().all())

    return patients, total


async def create_patient(
    db: AsyncSession,
    patient_in: PatientProfileCreate,
    user_id: Optional[UUID] = None,
) -> PatientProfile:
    """
    Create a new patient profile.

    Args:
        db: Database session.
        patient_in: Validated patient data.
        user_id: Optional — links to the patient's User account.
    """
    patient = PatientProfile(
        user_id=user_id,
        full_name=patient_in.full_name,
        age=patient_in.age,
        gestational_age_weeks=patient_in.gestational_age_weeks,
        last_menstrual_period=patient_in.last_menstrual_period,
        estimated_due_date=patient_in.estimated_due_date,
        gravida=patient_in.gravida,
        para=patient_in.para,
        chronic_conditions=patient_in.chronic_conditions,
        current_medications=patient_in.current_medications,
        baseline_weight_kg=patient_in.baseline_weight_kg,
        baseline_systolic_bp=patient_in.baseline_systolic_bp,
        baseline_diastolic_bp=patient_in.baseline_diastolic_bp,
        blood_type=patient_in.blood_type,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


async def update_patient(
    db: AsyncSession,
    patient: PatientProfile,
    patient_in: PatientProfileUpdate,
) -> PatientProfile:
    """
    Update an existing patient profile with only the provided fields.
    """
    update_data = patient_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return patient
