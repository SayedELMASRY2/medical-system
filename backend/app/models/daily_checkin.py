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
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


# ---------------------------------------------------------------------------
# Enums — derived from DAILY_CHECKIN.md sections
# ---------------------------------------------------------------------------

class DietQuality(str, enum.Enum):
    """§2 Nutrition — Diet Quality tags."""
    BALANCED = "BALANCED"
    HIGH_PROTEIN = "HIGH_PROTEIN"
    HIGH_CARBS = "HIGH_CARBS"
    HIGH_SODIUM = "HIGH_SODIUM"
    POOR = "POOR"


class ActivityLevel(str, enum.Enum):
    """§3 Lifestyle — Physical Activity Level."""
    RESTING = "RESTING"
    LIGHT = "LIGHT"
    MODERATE = "MODERATE"
    STRENUOUS = "STRENUOUS"


class SleepQuality(str, enum.Enum):
    """§3 Lifestyle — Sleep Quality."""
    POOR = "POOR"
    FAIR = "FAIR"
    GOOD = "GOOD"


class HeadacheSeverity(str, enum.Enum):
    """§5 Symptoms — Headache severity."""
    NONE = "NONE"
    MILD = "MILD"
    SEVERE = "SEVERE"


class FetalMovement(str, enum.Enum):
    """§6 Fetal Monitoring — Fetal movement assessment (applicable if >28 weeks)."""
    NORMAL = "NORMAL"
    DECREASED = "DECREASED"
    NONE = "NONE"


# ---------------------------------------------------------------------------
# DailyCheckIn Model
# ---------------------------------------------------------------------------

class DailyCheckIn(Base):
    """
    Daily patient check-in record storing vitals, nutrition, lifestyle,
    medications, symptoms, and fetal monitoring data.

    Maps to:
      - VitalSigns  (state.py) — systolic_bp, diastolic_bp, heart_rate,
        fetal_heart_rate, weight_kg, blood_glucose, proteinuria
      - AgentState.longitudinal_history — built by querying check-in records
      - DeterministicRiskEngine.evaluate() — vitals + structured symptoms
    """
    __tablename__ = "daily_checkins"

    __table_args__ = (
        UniqueConstraint(
            "patient_id", "checkin_date",
            name="uq_patient_checkin_date",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(
        UUID(as_uuid=True),
        ForeignKey("patient_profiles.id"),
        nullable=False,
        index=True,
    )
    checkin_date = Column(Date, nullable=False, index=True)

    # ── §1 Basic Vitals ──────────────────────────────────────────────────
    weight_kg = Column(Float, nullable=True)
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    blood_glucose = Column(Float, nullable=True)

    # Required by VitalSigns (state.py) and DeterministicRiskEngine (engine.py:49)
    # Values: "+1", "+2", "+3", "trace", "negative"
    proteinuria = Column(String(20), nullable=True)

    # ── §2 Nutrition & Hydration ─────────────────────────────────────────
    diet_quality = Column(Enum(DietQuality), nullable=True)
    hydration_liters = Column(Float, nullable=True)

    # ── §3 Lifestyle & Activity ──────────────────────────────────────────
    activity_level = Column(Enum(ActivityLevel), nullable=True)
    sleep_hours = Column(Float, nullable=True)
    sleep_quality = Column(Enum(SleepQuality), nullable=True)

    # ── §4 Medications & Supplements ─────────────────────────────────────
    medications_taken = Column(JSON, default=list, nullable=True)
    supplements_taken = Column(JSON, default=list, nullable=True)

    # ── §5 Symptoms & Warning Signs ──────────────────────────────────────
    edema_location = Column(JSON, default=list, nullable=True)  # e.g. ["hands", "face", "legs"]
    headache_severity = Column(Enum(HeadacheSeverity), nullable=True)
    vision_changes = Column(Boolean, default=False, nullable=False)
    abdominal_pain = Column(Boolean, default=False, nullable=False)
    vaginal_bleeding = Column(Boolean, default=False, nullable=False)

    # ── §6 Fetal Monitoring (applicable if >28 weeks) ────────────────────
    fetal_movement = Column(Enum(FetalMovement), nullable=True)
    kick_count = Column(Integer, nullable=True)
    fetal_heart_rate = Column(Integer, nullable=True)

    # ── Metadata ─────────────────────────────────────────────────────────
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient = relationship(
        "PatientProfile",
        back_populates="daily_checkins",
    )

    def __repr__(self):
        return (
            f"<DailyCheckIn(id={self.id}, patient_id={self.patient_id}, "
            f"date={self.checkin_date})>"
        )
