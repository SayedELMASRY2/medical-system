"""
Lab Results API — CRUD endpoints with Row-Level Security.

- Patients can only view their own lab reports.
- Doctors can only view reports of patients assigned to them.
- Auto-assignment: first doctor to view a patient's profile gets assigned.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.lab_report import LabReport, LabResultItem

router = APIRouter(prefix="/lab-results", tags=["Lab Results"])


# ──────────────────────────────────────────────────────────
# Helper: Get patient profile for the current user
# ──────────────────────────────────────────────────────────

async def _get_my_patient_profile(db: AsyncSession, user: User) -> PatientProfile:
    """Get the patient profile for the current user, or raise 404."""
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == str(user.id))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found. Complete onboarding first.")
    return patient


async def _verify_doctor_access(db: AsyncSession, doctor: User, patient_id: str) -> PatientProfile:
    """
    Verify that the doctor has access to this patient.
    If the patient has no assigned doctor, auto-assign this doctor (first-touch).
    """
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.id == patient_id)
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Auto-assignment: first doctor to access gets assigned
    if patient.assigned_doctor_id is None:
        patient.assigned_doctor_id = str(doctor.id)
        await db.commit()
        await db.refresh(patient)
    elif patient.assigned_doctor_id != str(doctor.id):
        # Admin override: admins can see everything
        if doctor.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Access denied. This patient is assigned to another physician."
            )

    return patient


# ──────────────────────────────────────────────────────────
# GET /lab-results/my — Patient views their own reports
# ──────────────────────────────────────────────────────────

@router.get("/my", summary="Get my lab reports (patient)")
async def get_my_lab_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all lab reports for the authenticated patient."""
    patient = await _get_my_patient_profile(db, current_user)

    result = await db.execute(
        select(LabReport)
        .where(LabReport.patient_id == str(patient.id))
        .order_by(LabReport.report_date.desc())
    )
    reports = result.scalars().all()

    return {
        "reports": [
            {
                "id": r.id,
                "report_type": r.report_type.value if r.report_type else "OTHER",
                "report_date": r.report_date.isoformat() if r.report_date else None,
                "source_filename": r.source_filename,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ],
        "total": len(reports),
    }


# ──────────────────────────────────────────────────────────
# GET /lab-results/patient/{patient_id} — Doctor views patient's reports
# ──────────────────────────────────────────────────────────

@router.get("/patient/{patient_id}", summary="Get patient lab reports (doctor)")
async def get_patient_lab_reports(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns lab reports for a specific patient. Doctor must be assigned."""
    if current_user.role not in (UserRole.DOCTOR, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Doctor or Admin access required.")

    # Verify access + auto-assign
    patient = await _verify_doctor_access(db, current_user, patient_id)

    result = await db.execute(
        select(LabReport)
        .where(LabReport.patient_id == str(patient.id))
        .order_by(LabReport.report_date.desc())
    )
    reports = result.scalars().all()

    return {
        "patient_name": patient.full_name,
        "reports": [
            {
                "id": r.id,
                "report_type": r.report_type.value if r.report_type else "OTHER",
                "report_date": r.report_date.isoformat() if r.report_date else None,
                "source_filename": r.source_filename,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ],
        "total": len(reports),
    }


# ──────────────────────────────────────────────────────────
# GET /lab-results/{report_id} — View detailed report with all result items
# ──────────────────────────────────────────────────────────

@router.get("/{report_id}", summary="Get detailed lab report")
async def get_lab_report_detail(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns a single lab report with all individual test results."""
    result = await db.execute(
        select(LabReport).where(LabReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found.")

    # Authorization check: patient owner or assigned doctor
    if current_user.role == UserRole.PATIENT:
        patient = await _get_my_patient_profile(db, current_user)
        if report.patient_id != str(patient.id):
            raise HTTPException(status_code=403, detail="Access denied.")
    elif current_user.role == UserRole.DOCTOR:
        await _verify_doctor_access(db, current_user, report.patient_id)
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Fetch result items
    items_result = await db.execute(
        select(LabResultItem)
        .where(LabResultItem.report_id == report_id)
        .order_by(LabResultItem.test_name)
    )
    items = items_result.scalars().all()

    return {
        "id": report.id,
        "report_type": report.report_type.value if report.report_type else "OTHER",
        "report_date": report.report_date.isoformat() if report.report_date else None,
        "source_filename": report.source_filename,
        "ocr_raw_text": report.ocr_raw_text,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "results": [
            {
                "id": item.id,
                "test_name": item.test_name,
                "value": item.value,
                "unit": item.unit,
                "reference_range": item.reference_range,
                "is_abnormal": item.is_abnormal,
            }
            for item in items
        ],
        "total_tests": len(items),
    }


# ──────────────────────────────────────────────────────────
# DELETE /lab-results/{report_id} — Admin only
# ──────────────────────────────────────────────────────────

@router.delete("/{report_id}", summary="Delete lab report (admin only)")
async def delete_lab_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a lab report and all its result items. Admin only."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required.")

    result = await db.execute(
        select(LabReport).where(LabReport.id == report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Lab report not found.")

    await db.delete(report)  # cascade deletes LabResultItems
    await db.commit()

    return {"message": "Lab report deleted successfully."}
