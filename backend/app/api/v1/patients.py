"""
Patient profile CRUD endpoints.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.crud.patient import (
    create_patient,
    get_patient_by_id,
    get_patients,
    update_patient,
)
from app.models.user import User
from app.schemas.patient import (
    PatientProfileCreate,
    PatientProfileList,
    PatientProfileResponse,
    PatientProfileUpdate,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new patient profile",
)
async def create_patient_profile(
    patient_in: PatientProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new pregnancy profile for a patient.

    - If the authenticated user is a **PATIENT**, the profile is linked to their account.

    """
    user_id = current_user.id

    patient = await create_patient(db, patient_in, user_id=user_id)
    return patient


@router.get(
    "",
    response_model=PatientProfileList,
    summary="List patient profiles",
)
async def list_patients(
        is_active: Optional[bool] = Query(default=True, description="Filter by active status"),
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=50, ge=1, le=100, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a paginated list of patient profiles.

    Results are ordered by risk severity (HIGH_PRIORITY first)
    to support the Doctor Dashboard.


    - **PATIENT**: Only sees their own profile (if it exists).
    """
    if True:
        # Patients can only see their own profile
        if current_user.patient_profile:
            return PatientProfileList(
                patients=[PatientProfileResponse.model_validate(current_user.patient_profile)],
                total=1,
            )
        return PatientProfileList(patients=[], total=0)

    patients, total = await get_patients(
        db,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )
    return PatientProfileList(
        patients=[PatientProfileResponse.model_validate(p) for p in patients],
        total=total,
    )


@router.get(
    "/{patient_id}",
    response_model=PatientProfileResponse,
    summary="Get a patient profile by ID",
)
async def get_patient_profile(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a single patient profile by its UUID.


    - **PATIENT**: Can only access their own profile.
    """
    patient = await get_patient_by_id(db, patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient profile '{patient_id}' not found.",
        )

    # Patients can only view their own profile
    if patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own profile.",
        )

    return patient


@router.put(
    "/{patient_id}",
    response_model=PatientProfileResponse,
    summary="Update a patient profile",
)
async def update_patient_profile(
    patient_id: UUID,
    patient_in: PatientProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing patient profile. Only provided fields are modified.


    - **PATIENT**: Can update their own profile (limited fields enforced at frontend).
    """
    patient = await get_patient_by_id(db, patient_id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient profile '{patient_id}' not found.",
        )

    if patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile.",
        )

    patient = await update_patient(db, patient, patient_in)
    return patient
