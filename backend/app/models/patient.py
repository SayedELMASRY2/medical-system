import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class BloodType(str, enum.Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"


class PatientProfile(Base):
    """
    Clinical pregnancy profile for a patient.
    """
    __tablename__ = "patient_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Link to User (patient account)
    user_id = Column(
        String(36),
        ForeignKey("users.id"),
        unique=True,
        nullable=True,
        index=True,
    )

    # Demographics
    full_name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)

    # Obstetric data
    gestational_age_weeks = Column(Integer, nullable=False)
    last_menstrual_period = Column(Date, nullable=True)
    estimated_due_date = Column(Date, nullable=True)
    gravida = Column(Integer, default=1, nullable=False)
    para = Column(Integer, default=0, nullable=False)

    # Medical history (stored as JSON string for SQLite)
    chronic_conditions = Column(Text, default="[]", nullable=False)
    current_medications = Column(Text, default="[]", nullable=False)

    # Baselines
    baseline_weight_kg = Column(Float, nullable=True)
    baseline_systolic_bp = Column(Integer, nullable=True)
    baseline_diastolic_bp = Column(Integer, nullable=True)

    blood_type = Column(Enum(BloodType), nullable=True)

    risk_status = Column(String(20), default="low", nullable=False)
    clinical_trend_summary = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship(
        "User",
        back_populates="patient_profile",
        foreign_keys=[user_id],
    )
    daily_checkins = relationship(
        "DailyCheckIn",
        back_populates="patient",
        order_by="DailyCheckIn.checkin_date.desc()",
    )

    def __repr__(self):
        return (
            f"<PatientProfile(id={self.id}, name='{self.full_name}', "
            f"week={self.gestational_age_weeks}, risk='{self.risk_status}')>"
        )
