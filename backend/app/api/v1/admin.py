"""
Admin endpoints: user management, logs, token usage, settings, delete user.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from typing import Optional

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.daily_checkin import DailyCheckIn

router = APIRouter(prefix="/admin", tags=["Admin"])


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return current_user


@router.get("/stats", summary="Get system overview stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_patients = (await db.execute(select(func.count(PatientProfile.id)))).scalar() or 0
    total_checkins = (await db.execute(select(func.count(DailyCheckIn.id)))).scalar() or 0
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active == True))).scalar() or 0

    high_risk = (await db.execute(
        select(func.count(PatientProfile.id)).where(PatientProfile.risk_status == "high")
    )).scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_patients": total_patients,
        "total_checkins": total_checkins,
        "high_risk_patients": high_risk,
    }


@router.get("/users", summary="List all users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(User).offset(skip).limit(limit).order_by(User.created_at.desc())
    if role:
        query = query.where(User.role == role)

    result = await db.execute(query)
    users = result.scalars().all()

    total = (await db.execute(select(func.count(User.id)))).scalar() or 0

    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role.value if u.role else "UNKNOWN",
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "updated_at": u.updated_at.isoformat() if u.updated_at else None,
            }
            for u in users
        ],
        "total": total,
    }


@router.put("/users/{user_id}/toggle-block", summary="Block or unblock a user")
async def toggle_block_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot block yourself.")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "is_active": user.is_active,
        "message": f"User {'unblocked' if user.is_active else 'blocked'} successfully.",
    }


@router.delete("/users/{user_id}", summary="Delete user permanently from database")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    # Delete associated patient profile & check-ins if exists
    profile_result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    if profile:
        await db.execute(delete(DailyCheckIn).where(DailyCheckIn.patient_id == str(profile.id)))
        await db.delete(profile)

    await db.delete(user)
    await db.commit()

    return {"message": f"User {user.email} and all associated records permanently removed from database."}


@router.post("/reset-database", summary="Reset system database to clean default state")
async def reset_database(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from app.core.database import create_tables
    await db.execute(delete(DailyCheckIn))
    await db.execute(delete(PatientProfile))
    await db.execute(delete(User).where(User.id != str(admin.id)))
    await db.commit()
    return {"message": "Database reset to baseline state successfully."}


@router.get("/tokens", summary="Get token usage statistics (mock)")
async def get_token_usage(
    admin: User = Depends(require_admin),
):
    return {
        "total_tokens_used": 1_250_000,
        "total_cost_usd": 4.75,
        "models": [
            {"model": "qwen/qwen3.6-27b", "tokens": 800_000, "cost": 2.40, "calls": 450},
            {"model": "google/gemma-3-27b-it", "tokens": 350_000, "cost": 1.75, "calls": 120},
            {"model": "cohere/embed-english-v3.0", "tokens": 100_000, "cost": 0.60, "calls": 200},
        ],
        "daily_usage": [
            {"date": "2026-08-14", "tokens": 150_000, "cost": 0.55},
            {"date": "2026-08-15", "tokens": 180_000, "cost": 0.68},
            {"date": "2026-08-16", "tokens": 200_000, "cost": 0.75},
            {"date": "2026-08-17", "tokens": 160_000, "cost": 0.60},
            {"date": "2026-08-18", "tokens": 220_000, "cost": 0.82},
            {"date": "2026-08-19", "tokens": 190_000, "cost": 0.72},
            {"date": "2026-08-20", "tokens": 150_000, "cost": 0.63},
        ],
    }


@router.get("/logs", summary="Get system activity logs (mock)")
async def get_system_logs(
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(require_admin),
):
    return {
        "logs": [
            {"timestamp": "2026-08-20T01:30:00Z", "level": "INFO", "event": "User registered", "user": "fatima@example.com", "details": "Role: PATIENT"},
            {"timestamp": "2026-08-20T01:28:00Z", "level": "INFO", "event": "Check-in submitted", "user": "amina@example.com", "details": "Risk: LOW"},
            {"timestamp": "2026-08-20T01:25:00Z", "level": "WARNING", "event": "High risk detected", "user": "sarah@example.com", "details": "BP 165/108, Risk: HIGH"},
            {"timestamp": "2026-08-20T01:20:00Z", "level": "INFO", "event": "OCR extraction", "user": "fatima@example.com", "details": "Lab report processed"},
            {"timestamp": "2026-08-20T01:15:00Z", "level": "INFO", "event": "Chat message", "user": "amina@example.com", "details": "Agent: Medical RAG"},
            {"timestamp": "2026-08-20T01:10:00Z", "level": "ERROR", "event": "API rate limit", "user": "system", "details": "OpenRouter 429"},
            {"timestamp": "2026-08-20T01:05:00Z", "level": "INFO", "event": "User login", "user": "dr.hassan@example.com", "details": "Role: DOCTOR"},
            {"timestamp": "2026-08-20T01:00:00Z", "level": "INFO", "event": "System startup", "user": "admin@materna.ai", "details": "Admin initialized"},
        ],
        "total": 8,
    }
