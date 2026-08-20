from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from app.core.config import settings
from datetime import date, datetime, timezone

engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def create_tables():
    """Create all tables and seed default users on startup."""
    from app.models.base import Base
    import app.models  # noqa: F401 — ensure all models are imported
    from app.models.user import User, UserRole
    from app.models.patient import PatientProfile
    from app.models.daily_checkin import DailyCheckIn, DietQuality, ActivityLevel, SleepQuality
    from app.core.security import hash_password

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default data
    async with AsyncSessionLocal() as db:
        # Check if admin user exists
        admin_check = await db.execute(select(User).where(User.email == "admin@materna.ai"))
        if admin_check.scalar_one_or_none() is None:
            admin_user = User(
                email="admin@materna.ai",
                hashed_password=hash_password("Ali&8122004"),
                full_name="Admin",
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin_user)

            doctor_user = User(
                email="dr.hassan@example.com",
                hashed_password=hash_password("Ali&8122004"),
                full_name="Dr. Hassan Omar",
                role=UserRole.DOCTOR,
                is_active=True,
            )
            db.add(doctor_user)

            patient_1 = User(
                email="amina@example.com",
                hashed_password=hash_password("Ali&8122004"),
                full_name="Amina Ali",
                role=UserRole.PATIENT,
                is_active=True,
            )
            db.add(patient_1)

            patient_2 = User(
                email="sarah@example.com",
                hashed_password=hash_password("Ali&8122004"),
                full_name="Sarah Ahmed",
                role=UserRole.PATIENT,
                is_active=True,
            )
            db.add(patient_2)

            patient_3 = User(
                email="fatima@example.com",
                hashed_password=hash_password("Ali&8122004"),
                full_name="Fatima Said",
                role=UserRole.PATIENT,
                is_active=True,
            )
            db.add(patient_3)

            await db.commit()

            # Add Patient Profiles — all assigned to Dr. Hassan
            profile_1 = PatientProfile(
                user_id=str(patient_1.id),
                full_name="Amina Ali",
                age=27,
                gestational_age_weeks=14,
                estimated_due_date=date(2027, 2, 19),
                risk_status="low",
                baseline_weight_kg=72.0,
                baseline_systolic_bp=118,
                baseline_diastolic_bp=76,
                assigned_doctor_id=str(doctor_user.id),
            )
            db.add(profile_1)

            profile_2 = PatientProfile(
                user_id=str(patient_2.id),
                full_name="Sarah Ahmed",
                age=29,
                gestational_age_weeks=32,
                estimated_due_date=date(2026, 10, 12),
                risk_status="high",
                baseline_weight_kg=68.5,
                baseline_systolic_bp=135,
                baseline_diastolic_bp=88,
                assigned_doctor_id=str(doctor_user.id),
            )
            db.add(profile_2)

            profile_3 = PatientProfile(
                user_id=str(patient_3.id),
                full_name="Fatima Said",
                age=34,
                gestational_age_weeks=28,
                estimated_due_date=date(2026, 11, 5),
                risk_status="clinical_review",
                baseline_weight_kg=75.0,
                baseline_systolic_bp=128,
                baseline_diastolic_bp=82,
                assigned_doctor_id=str(doctor_user.id),
            )
            db.add(profile_3)

            await db.commit()

            # Add Daily Check-in for Amina
            checkin_1 = DailyCheckIn(
                patient_id=str(profile_1.id),
                checkin_date=date.today(),
                weight_kg=72.5,
                systolic_bp=118,
                diastolic_bp=76,
                heart_rate=78,
                blood_glucose=95.0,
                proteinuria="negative",
                diet_quality=DietQuality.BALANCED,
                hydration_liters=2.2,
                activity_level=ActivityLevel.LIGHT,
                sleep_hours=8.0,
                sleep_quality=SleepQuality.GOOD,
                notes="Feeling great today!",
            )
            db.add(checkin_1)
            await db.commit()

            # ── Seed Sample Lab Reports for Demo ──
            from app.models.lab_report import LabReport, LabResultItem, LabReportType

            # Lab Report 1: Blood test for Sarah (high risk patient)
            blood_report = LabReport(
                patient_id=str(profile_2.id),
                report_type=LabReportType.BLOOD,
                report_date=date.today(),
                source_filename="sarah_cbc_report.pdf",
                ocr_raw_text="CBC Report - Sarah Ahmed\nHemoglobin: 9.8 g/dL\nPlatelets: 98,000 /uL\nWBC: 11.2 x10^3/uL",
            )
            db.add(blood_report)
            await db.flush()

            for test_name, value, unit, abnormal in [
                ("Hemoglobin", "9.8", "g/dL", True),
                ("Platelets", "98,000", "/uL", True),
                ("WBC", "11.2", "x10^3/uL", False),
                ("RBC", "3.9", "x10^6/uL", False),
                ("Hematocrit", "31.2", "%", True),
            ]:
                db.add(LabResultItem(
                    report_id=blood_report.id,
                    test_name=test_name, value=value, unit=unit, is_abnormal=abnormal,
                ))

            # Lab Report 2: Urine test for Fatima
            urine_report = LabReport(
                patient_id=str(profile_3.id),
                report_type=LabReportType.URINE,
                report_date=date.today(),
                source_filename="fatima_urinalysis.pdf",
                ocr_raw_text="Urinalysis - Fatima Said\nProteinuria: 2+ (100 mg/dL)\npH: 6.0",
            )
            db.add(urine_report)
            await db.flush()

            for test_name, value, unit, abnormal in [
                ("Proteinuria", "2+", "(100 mg/dL)", True),
                ("pH", "6.0", "", False),
                ("Specific Gravity", "1.025", "", False),
            ]:
                db.add(LabResultItem(
                    report_id=urine_report.id,
                    test_name=test_name, value=value, unit=unit, is_abnormal=abnormal,
                ))

            await db.commit()
            print("Successfully seeded Admin (admin@materna.ai / Ali&8122004), Doctor, Patients, and Sample Lab Reports!")
