import asyncio
import uuid
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.daily_checkin import DailyCheckIn, DietQuality, ActivityLevel, SleepQuality, HeadacheSeverity
from app.core.security import get_password_hash

async def seed_demo():
    print("Seeding database with realistic demo data...")
    async with SessionLocal() as db:
        
        # 1. Ensure a Doctor Account exists
        dr_email = "dr.sarah@materna.app"
        result = await db.execute(select(User).where(User.email == dr_email))
        doctor = result.scalar_one_or_none()
        
        if not doctor:
            print("Creating doctor account...")
            doctor = User(
                id=str(uuid.uuid4()),
                email=dr_email,
                hashed_password=get_password_hash("Ali&8122004"),
                full_name="Dr. Sarah",
                role=UserRole.DOCTOR,
                is_active=True,
            )
            db.add(doctor)
            await db.commit()
            await db.refresh(doctor)
        
        # Define 3 demo patients
        patients_data = [
            {
                "email": "fatma@materna.app",
                "name": "Fatma Mahmoud",
                "risk": "high",
                "age": 31,
                "weeks": 32,
                "bp_trend": (130, 85, 2, 1), # start_sys, start_dia, inc_sys, inc_dia
                "weight_trend": (75.0, 0.2), # start_weight, inc_weight
            },
            {
                "email": "nada@materna.app",
                "name": "Nada Ahmed",
                "risk": "monitor",
                "age": 28,
                "weeks": 24,
                "bp_trend": (120, 80, 0, 0),
                "weight_trend": (65.0, 0.05),
            },
            {
                "email": "salma@materna.app",
                "name": "Salma Hassan",
                "risk": "low",
                "age": 25,
                "weeks": 16,
                "bp_trend": (115, 75, -0.5, 0),
                "weight_trend": (60.0, 0.02),
            }
        ]

        for p_data in patients_data:
            # Check if user exists
            res = await db.execute(select(User).where(User.email == p_data["email"]))
            user = res.scalar_one_or_none()
            
            if not user:
                print(f"Creating patient user: {p_data['name']}")
                user = User(
                    id=str(uuid.uuid4()),
                    email=p_data["email"],
                    hashed_password=get_password_hash("Ali&8122004"),
                    full_name=p_data["name"],
                    role=UserRole.PATIENT,
                    is_active=True,
                )
                db.add(user)
                await db.commit()
                await db.refresh(user)

            # Check if profile exists
            res = await db.execute(select(PatientProfile).where(PatientProfile.user_id == user.id))
            profile = res.scalar_one_or_none()

            if not profile:
                print(f"Creating patient profile for: {p_data['name']}")
                profile = PatientProfile(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    full_name=p_data["name"],
                    age=p_data["age"],
                    gestational_age_weeks=p_data["weeks"],
                    risk_status=p_data["risk"],
                    assigned_doctor_id=doctor.id,
                    baseline_weight_kg=p_data["weight_trend"][0],
                    baseline_systolic_bp=p_data["bp_trend"][0],
                    baseline_diastolic_bp=p_data["bp_trend"][1],
                )
                db.add(profile)
                await db.commit()
                await db.refresh(profile)

            # Seed 7-10 days of check-ins
            print(f"Seeding checkins for: {p_data['name']}")
            num_days = 10
            now = datetime.now(timezone.utc)
            
            for i in range(num_days, 0, -1):
                checkin_date = (now - timedelta(days=i-1)).date()
                
                # Check if checkin already exists for this date
                res = await db.execute(select(DailyCheckIn).where(
                    DailyCheckIn.patient_id == profile.id,
                    DailyCheckIn.checkin_date == checkin_date
                ))
                if res.scalar_one_or_none():
                    continue
                
                sys = p_data["bp_trend"][0] + (p_data["bp_trend"][2] * (num_days - i))
                dia = p_data["bp_trend"][1] + (p_data["bp_trend"][3] * (num_days - i))
                wt = p_data["weight_trend"][0] + (p_data["weight_trend"][1] * (num_days - i))
                
                checkin = DailyCheckIn(
                    id=str(uuid.uuid4()),
                    patient_id=profile.id,
                    checkin_date=checkin_date,
                    weight_kg=round(wt, 1),
                    systolic_bp=int(sys),
                    diastolic_bp=int(dia),
                    heart_rate=80 + (2 if p_data["risk"] == "high" else 0),
                    hydration_liters=round(2.5 - (0.5 if p_data["risk"] == "high" else 0.1), 1),
                    diet_quality=DietQuality.BALANCED,
                    activity_level=ActivityLevel.LIGHT,
                    sleep_quality=SleepQuality.GOOD,
                    created_at=now - timedelta(days=i-1),
                )
                db.add(checkin)
            
            await db.commit()
            
    print("Database seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_demo())
