"""
Dashboard summary endpoint for patient home view.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.patient import PatientProfile
from app.models.daily_checkin import DailyCheckIn

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", summary="Get patient dashboard summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns summary data for the authenticated patient's dashboard."""
    # Get patient profile
    result = await db.execute(
        select(PatientProfile).where(PatientProfile.user_id == str(current_user.id))
    )
    patient = result.scalar_one_or_none()

    if not patient:
        return {
            "has_profile": False,
            "message": "Please complete onboarding first.",
        }

    # Get latest check-in
    latest_result = await db.execute(
        select(DailyCheckIn)
        .where(DailyCheckIn.patient_id == str(patient.id))
        .order_by(DailyCheckIn.checkin_date.desc())
        .limit(1)
    )
    latest_checkin = latest_result.scalar_one_or_none()

    # Get total check-ins count
    count_result = await db.execute(
        select(func.count(DailyCheckIn.id))
        .where(DailyCheckIn.patient_id == str(patient.id))
    )
    total_checkins = count_result.scalar() or 0

    # Get recent 7 check-ins for chart data
    recent_result = await db.execute(
        select(DailyCheckIn)
        .where(DailyCheckIn.patient_id == str(patient.id))
        .order_by(DailyCheckIn.checkin_date.desc())
        .limit(7)
    )
    recent_checkins = recent_result.scalars().all()

    chart_data = [
        {
            "date": c.checkin_date.isoformat() if c.checkin_date else None,
            "systolic_bp": c.systolic_bp,
            "diastolic_bp": c.diastolic_bp,
            "weight_kg": c.weight_kg,
            "heart_rate": c.heart_rate,
        }
        for c in reversed(list(recent_checkins))
    ]

    return {
        "has_profile": True,
        "patient": {
            "id": str(patient.id),
            "full_name": patient.full_name,
            "gestational_age_weeks": patient.gestational_age_weeks,
            "risk_status": patient.risk_status,
            "estimated_due_date": patient.estimated_due_date.isoformat() if patient.estimated_due_date else None,
        },
        "stats": {
            "total_checkins": total_checkins,
            "latest_weight": latest_checkin.weight_kg if latest_checkin else None,
            "latest_bp": f"{latest_checkin.systolic_bp}/{latest_checkin.diastolic_bp}" if latest_checkin and latest_checkin.systolic_bp else None,
            "latest_heart_rate": latest_checkin.heart_rate if latest_checkin else None,
            "latest_hydration": latest_checkin.hydration_liters if latest_checkin else None,
        },
        "chart_data": chart_data,
    }


@router.get("/doctor/patients", summary="Get doctor's patient list")
async def get_doctor_patients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns patients assigned to this doctor + unassigned patients, sorted by risk level."""
    from app.models.user import UserRole
    from sqlalchemy import or_
    if current_user.role not in (UserRole.DOCTOR, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Doctor or Admin access required.")

    # Admins see all patients; Doctors see their assigned + unassigned
    if current_user.role == UserRole.ADMIN:
        query = select(PatientProfile).where(PatientProfile.is_active == True)
    else:
        query = select(PatientProfile).where(
            PatientProfile.is_active == True,
            or_(
                PatientProfile.assigned_doctor_id == str(current_user.id),
                PatientProfile.assigned_doctor_id == None,
            )
        )

    result = await db.execute(query.order_by(PatientProfile.risk_status.desc()))
    patients = result.scalars().all()

    patient_data = []
    for p in patients:
        # Fetch latest checkin for this patient
        checkin_result = await db.execute(
            select(DailyCheckIn)
            .where(DailyCheckIn.patient_id == str(p.id))
            .order_by(DailyCheckIn.checkin_date.desc())
            .limit(1)
        )
        latest_checkin = checkin_result.scalar_one_or_none()
        
        patient_data.append({
            "id": str(p.id),
            "full_name": p.full_name,
            "age": p.age,
            "gestational_age_weeks": p.gestational_age_weeks,
            "risk_status": p.risk_status,
            "estimated_due_date": p.estimated_due_date.isoformat() if p.estimated_due_date else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "assigned_doctor_id": p.assigned_doctor_id,
            "latest_bp": f"{latest_checkin.systolic_bp}/{latest_checkin.diastolic_bp}" if latest_checkin and latest_checkin.systolic_bp else "N/A",
            "latest_heart_rate": latest_checkin.heart_rate if latest_checkin and latest_checkin.heart_rate else 0,
        })

    return {
        "patients": patient_data,
        "total": len(patients),
    }
