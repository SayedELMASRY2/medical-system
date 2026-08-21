from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from app.core.config import settings
from datetime import date, datetime, timezone, timedelta
import random

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
    """Create all tables and seed comprehensive demo data on startup."""
    from app.models.base import Base
    import app.models  # noqa: F401 — ensure all models are imported
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default data
    async with AsyncSessionLocal() as db:
        from app.models.user import User, UserRole
        from app.core.security import hash_password
        
        # 1. Check if admin user exists (if yes, db is likely already seeded)
        admin_check = await db.execute(select(User).where(User.email == "admin@materna.ai"))
        if admin_check.scalar_one_or_none() is not None:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database with comprehensive demo data...")
        
        # 2. Seed Users (Admin, 3 Doctors, 10 Patients)
        admin, doctors, patients = await _seed_users(db, hash_password)
        
        # 3. Seed Patient Profiles (Linked to doctors)
        profiles = await _seed_patients(db, patients, doctors)
        
        # 4. Seed Daily Check-ins (Multiple per patient)
        await _seed_checkins(db, profiles)
        
        # 5. Seed Lab Reports & Results
        await _seed_lab_reports(db, profiles)
        
        print("Database seeding completed successfully!")


async def _seed_users(db: AsyncSession, hash_pwd_func):
    from app.models.user import User, UserRole
    
    # Admin
    admin = User(
        email="admin@materna.ai",
        hashed_password=hash_pwd_func("Ali&8122004"),
        full_name="Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)

    # Doctors
    doctor_data = [
        ("dr.hassan@example.com", "Dr. Hassan Omar"),
        ("dr.mona@example.com", "Dr. Mona Khalil"),
        ("dr.youssef@example.com", "Dr. Youssef Nabil")
    ]
    doctors = []
    for email, name in doctor_data:
        doc = User(email=email, hashed_password=hash_pwd_func("Ali&8122004"), full_name=name, role=UserRole.DOCTOR)
        db.add(doc)
        doctors.append(doc)

    # Patients
    patient_data = [
        ("amina@example.com", "Amina Ali"),
        ("sarah@example.com", "Sarah Ahmed"),
        ("fatima@example.com", "Fatima Said"),
        ("nour@example.com", "Nour Mahmoud"),
        ("layla@example.com", "Layla Ibrahim"),
        ("hana@example.com", "Hana Mostafa"),
        ("yasmin@example.com", "Yasmin Adel"),
        ("mariam@example.com", "Mariam Hassan"),
        ("dina@example.com", "Dina Fouad"),
        ("rania@example.com", "Rania Samir")
    ]
    patients = []
    for email, name in patient_data:
        pat = User(email=email, hashed_password=hash_pwd_func("Ali&8122004"), full_name=name, role=UserRole.PATIENT)
        db.add(pat)
        patients.append(pat)

    await db.commit()
    return admin, doctors, patients


async def _seed_patients(db: AsyncSession, patients, doctors):
    from app.models.patient import PatientProfile
    
    # Doctor assignment:
    # Dr. Hassan gets first 4
    # Dr. Mona gets next 3
    # Dr. Youssef gets last 3
    
    profile_data = [
        # (user_idx, age, weeks, risk, doc_idx, sys, dia, weight)
        (0, 27, 14, "low", 0, 118, 76, 72.0),
        (1, 29, 32, "high", 0, 135, 88, 68.5),
        (2, 34, 28, "clinical_review", 0, 128, 82, 75.0),
        (3, 25, 20, "low", 0, 115, 75, 65.0),
        
        (4, 31, 36, "high", 1, 142, 92, 85.0),
        (5, 28, 24, "low", 1, 120, 80, 70.0),
        (6, 38, 30, "clinical_review", 1, 130, 85, 78.0),
        
        (7, 22, 12, "low", 2, 110, 70, 60.0),
        (8, 33, 26, "monitor", 2, 125, 82, 82.0),
        (9, 30, 34, "high", 2, 140, 90, 74.0),
    ]
    
    profiles = {}
    for p_idx, age, weeks, risk, d_idx, sys, dia, weight in profile_data:
        # roughly calculate edd
        edd = date.today() + timedelta(weeks=40 - weeks)
        
        prof = PatientProfile(
            user_id=str(patients[p_idx].id),
            full_name=patients[p_idx].full_name,
            age=age,
            gestational_age_weeks=weeks,
            estimated_due_date=edd,
            risk_status=risk,
            baseline_weight_kg=weight,
            baseline_systolic_bp=sys,
            baseline_diastolic_bp=dia,
            assigned_doctor_id=str(doctors[d_idx].id),
        )
        db.add(prof)
        profiles[patients[p_idx].full_name] = prof
        
    await db.commit()
    return profiles


async def _seed_checkins(db: AsyncSession, profiles):
    from app.models.daily_checkin import DailyCheckIn, DietQuality, ActivityLevel, SleepQuality
    
    today = date.today()
    
    for name, prof in profiles.items():
        # Generate 3 days of check-ins for each
        for days_ago in range(3, 0, -1):
            checkin_date = today - timedelta(days=days_ago)
            
            # Add some slight variation to vitals based on baseline
            sys = prof.baseline_systolic_bp + random.randint(-5, 5)
            dia = prof.baseline_diastolic_bp + random.randint(-3, 3)
            weight = prof.baseline_weight_kg + random.uniform(-0.5, 0.5)
            hr = random.randint(70, 95)
            
            glucose = random.uniform(85, 110)
            if prof.risk_status == "high":
                glucose += 20
                hr += 10
            
            checkin = DailyCheckIn(
                patient_id=str(prof.id),
                checkin_date=checkin_date,
                weight_kg=round(weight, 1),
                systolic_bp=sys,
                diastolic_bp=dia,
                heart_rate=hr,
                blood_glucose=round(glucose, 1),
                proteinuria="negative" if prof.risk_status == "low" else "trace",
                diet_quality=DietQuality.BALANCED,
                hydration_liters=round(random.uniform(1.5, 2.5), 1),
                activity_level=ActivityLevel.LIGHT,
                sleep_hours=round(random.uniform(6.0, 8.5), 1),
                sleep_quality=SleepQuality.GOOD if prof.risk_status == "low" else SleepQuality.FAIR,
                notes=f"Check-in for {checkin_date.strftime('%Y-%m-%d')}"
            )
            db.add(checkin)
    
    await db.commit()


async def _seed_lab_reports(db: AsyncSession, profiles):
    from app.models.lab_report import LabReport, LabResultItem, LabReportType
    
    reports_to_create = [
        # Sarah Ahmed (High Risk) - CBC
        (profiles["Sarah Ahmed"], LabReportType.BLOOD, "sarah_cbc_report.pdf", 
         "CBC Report\nHemoglobin: 9.8 g/dL\nPlatelets: 98,000 /uL\nWBC: 11.2 x10^3/uL",
         [("Hemoglobin", "9.8", "g/dL", True), ("Platelets", "98,000", "/uL", True), 
          ("WBC", "11.2", "x10^3/uL", False), ("Hematocrit", "31.2", "%", True)]),
          
        # Sarah Ahmed (High Risk) - Glucose
        (profiles["Sarah Ahmed"], LabReportType.GLUCOSE, "sarah_glucose.pdf", 
         "Glucose Panel\nFasting Glucose: 142 mg/dL\nHbA1c: 6.8%",
         [("Fasting Glucose", "142", "mg/dL", True), ("HbA1c", "6.8", "%", True)]),

        # Fatima Said (Clinical Review) - Urine
        (profiles["Fatima Said"], LabReportType.URINE, "fatima_urinalysis.pdf",
         "Urinalysis\nProteinuria: 2+ (100 mg/dL)\npH: 6.0",
         [("Proteinuria", "2+", "(100 mg/dL)", True), ("pH", "6.0", "", False), 
          ("Specific Gravity", "1.025", "", False)]),
          
        # Fatima Said (Clinical Review) - Kidney
        (profiles["Fatima Said"], LabReportType.KIDNEY, "fatima_kidney_function.pdf",
         "Kidney Function\nCreatinine: 1.4 mg/dL\nBUN: 28 mg/dL",
         [("Creatinine", "1.4", "mg/dL", True), ("BUN", "28", "mg/dL", True)]),

        # Layla Ibrahim (High Risk) - Liver
        (profiles["Layla Ibrahim"], LabReportType.LIVER, "layla_liver_panel.pdf",
         "Liver Panel\nAST: 78 U/L\nALT: 65 U/L",
         [("AST", "78", "U/L", True), ("ALT", "65", "U/L", True), ("Bilirubin", "1.2", "mg/dL", False)]),

        # Yasmin Adel (Clinical Review) - Glucose
        (profiles["Yasmin Adel"], LabReportType.GLUCOSE, "yasmin_ogtt.pdf",
         "OGTT Result\n1 Hour Glucose: 195 mg/dL",
         [("1 Hr Glucose (OGTT)", "195", "mg/dL", True)]),

        # Rania Samir (High Risk) - Blood & Urine
        (profiles["Rania Samir"], LabReportType.BLOOD, "rania_cbc.pdf",
         "CBC\nPlatelets: 85,000 /uL",
         [("Platelets", "85,000", "/uL", True), ("Hemoglobin", "11.2", "g/dL", False)]),
        (profiles["Rania Samir"], LabReportType.URINE, "rania_urine.pdf",
         "Urinalysis\nProteinuria: 3+",
         [("Proteinuria", "3+", "", True)]),

        # Normal Reports (Amina, Nour, Hana)
        (profiles["Amina Ali"], LabReportType.BLOOD, "amina_cbc.pdf",
         "CBC Normal\nHemoglobin: 12.5 g/dL",
         [("Hemoglobin", "12.5", "g/dL", False), ("Platelets", "250,000", "/uL", False)]),
        (profiles["Nour Mahmoud"], LabReportType.GLUCOSE, "nour_glucose.pdf",
         "Fasting Glucose: 88 mg/dL",
         [("Fasting Glucose", "88", "mg/dL", False)]),
        (profiles["Hana Mostafa"], LabReportType.URINE, "hana_urine.pdf",
         "Urinalysis\nProteinuria: Negative",
         [("Proteinuria", "Negative", "", False)]),
    ]

    for prof, rtype, fname, text, items in reports_to_create:
        report = LabReport(
            patient_id=str(prof.id),
            report_type=rtype,
            report_date=date.today() - timedelta(days=random.randint(1, 10)),
            source_filename=fname,
            ocr_raw_text=text,
        )
        db.add(report)
        await db.flush()

        for test_name, value, unit, abnormal in items:
            db.add(LabResultItem(
                report_id=report.id,
                test_name=test_name, 
                value=value, 
                unit=unit, 
                is_abnormal=abnormal,
            ))

    await db.commit()
