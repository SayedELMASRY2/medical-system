from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class PatientModel(Base):
    __tablename__ = "patients"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    country = Column(String(50), default="EG")
    city = Column(String(50), default="Cairo")
    lmp_date = Column(String(10), nullable=True)
    edd = Column(String(10), nullable=True)
    blood_type = Column(String(5), nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    medical_history = Column(JSON, default=list)
    allergies = Column(JSON, default=list)
    current_medications = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    timeline_entries = relationship("TimelineModel", back_populates="patient", cascade="all, delete-orphan")
    lab_results = relationship("LabResultModel", back_populates="patient", cascade="all, delete-orphan")
    triage_assessments = relationship("TriageModel", back_populates="patient", cascade="all, delete-orphan")
    daily_checkins = relationship("PatientCheckInModel", back_populates="patient", cascade="all, delete-orphan")


class TimelineModel(Base):
    __tablename__ = "timeline_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)
    week = Column(Integer, nullable=True)
    day = Column(Integer, nullable=True)
    symptoms = Column(JSON, default=list)
    vitals = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)
    form_source = Column(String(50), default="form")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientModel", back_populates="timeline_entries")


class LabResultModel(Base):
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)
    lab_name = Column(String(100), nullable=True)
    results = Column(JSON, nullable=False)
    ocr_source = Column(String(50), default="vision_llm")
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientModel", back_populates="lab_results")


class TriageModel(Base):
    __tablename__ = "triage_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    risk_level = Column(String(20), nullable=False, index=True)
    triggered_rules = Column(JSON, default=list)
    triage_alert = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientModel", back_populates="triage_assessments")


class PatientCheckInModel(Base):
    __tablename__ = "daily_checkins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), ForeignKey("patients.id"), nullable=False, index=True)
    checkin_date = Column(String(10), nullable=False, index=True)

    # 1. Basic Vitals
    weight_kg = Column(Float, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    blood_sugar_mg_dl = Column(Float, nullable=True)

    # 2. Nutrition & Hydration
    diet_quality = Column(String(50), nullable=True)
    water_intake_cups = Column(Integer, default=0)

    # 3. Lifestyle & Activity
    activity_level = Column(String(50), nullable=True)
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(String(20), nullable=True)

    # 4. Medications & Supplements
    prenatal_vitamins = Column(JSON, default=list)
    specific_medications = Column(JSON, default=list)

    # 5. Symptoms & Warning Signs
    swelling_edema = Column(String(50), default="None")
    headache = Column(String(50), default="None")
    vision_changes = Column(JSON, default=dict)
    right_upper_quadrant_pain = Column(JSON, default=dict)
    vaginal_bleeding = Column(JSON, default=dict)

    # 6. Fetal Monitoring
    fetal_movement = Column(String(50), default="Normal")
    kick_count = Column(Integer, nullable=True)

    # Computed Risk Output
    risk_level = Column(String(20), default="low")
    triggered_rules = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("PatientModel", back_populates="daily_checkins")

