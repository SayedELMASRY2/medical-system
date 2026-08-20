"""Pydantic request/response schemas for DailyCheckIn (vital signs logging)."""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, computed_field
from pydantic.alias_generators import to_camel

from app.models.daily_checkin import (
    ActivityLevel,
    DietQuality,
    FetalMovement,
    HeadacheSeverity,
    SleepQuality,
)


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class DailyCheckInCreate(BaseModel):
    """
    Schema for POST /patients/{patient_id}/vitals — logging a daily check-in.

    Maps to all 6 sections of DAILY_CHECKIN.md:
      §1 Basic Vitals, §2 Nutrition, §3 Lifestyle,
      §4 Medications, §5 Symptoms, §6 Fetal Monitoring.
    """
    # Date of the check-in (defaults to today on the server if omitted)
    checkin_date: Optional[date] = None

    # §1 Basic Vitals
    weight_kg: Optional[float] = Field(default=None, ge=20, le=300, description="Weight in kg")
    systolic_bp: Optional[int] = Field(default=None, ge=50, le=250, description="Systolic blood pressure mmHg")
    diastolic_bp: Optional[int] = Field(default=None, ge=20, le=180, description="Diastolic blood pressure mmHg")
    heart_rate: Optional[int] = Field(default=None, ge=30, le=220, description="Heart rate bpm")
    blood_glucose: Optional[float] = Field(default=None, ge=0, le=600, description="Blood glucose mg/dL")
    proteinuria: Optional[str] = Field(
        default=None,
        max_length=20,
        description='Urine protein level: "+1", "+2", "+3", "trace", "negative"',
    )

    # §2 Nutrition & Hydration
    diet_quality: Optional[DietQuality] = None
    hydration_liters: Optional[float] = Field(default=None, ge=0, le=10)

    # §3 Lifestyle & Activity
    activity_level: Optional[ActivityLevel] = None
    sleep_hours: Optional[float] = Field(default=None, ge=0, le=24)
    sleep_quality: Optional[SleepQuality] = None

    # §4 Medications & Supplements
    medications_taken: Optional[List[str]] = None
    supplements_taken: Optional[List[str]] = None

    # §5 Symptoms & Warning Signs
    edema_location: Optional[List[str]] = None
    headache_severity: Optional[HeadacheSeverity] = None
    vision_changes: bool = False
    abdominal_pain: bool = False
    vaginal_bleeding: bool = False

    # §6 Fetal Monitoring (applicable if > 28 weeks)
    fetal_movement: Optional[FetalMovement] = None
    kick_count: Optional[int] = Field(default=None, ge=0)
    fetal_heart_rate: Optional[int] = Field(default=None, ge=60, le=220)

    # Free-text notes
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class DailyCheckInResponse(BaseModel):
    """Schema returned after creating or retrieving a check-in."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    id: UUID
    patient_id: UUID
    checkin_date: date

    # §1 Basic Vitals
    weight_kg: Optional[float] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    blood_glucose: Optional[float] = None
    proteinuria: Optional[str] = None

    # §2 Nutrition & Hydration
    diet_quality: Optional[DietQuality] = None
    hydration_liters: Optional[float] = None

    # §3 Lifestyle & Activity
    activity_level: Optional[ActivityLevel] = None
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[SleepQuality] = None

    # §4 Medications & Supplements
    medications_taken: Optional[List[str]] = None
    supplements_taken: Optional[List[str]] = None

    # §5 Symptoms & Warning Signs
    edema_location: Optional[List[str]] = None
    headache_severity: Optional[HeadacheSeverity] = None
    vision_changes: bool
    abdominal_pain: bool
    vaginal_bleeding: bool

    # §6 Fetal Monitoring
    fetal_movement: Optional[FetalMovement] = None
    kick_count: Optional[int] = None
    fetal_heart_rate: Optional[int] = None

    # Metadata
    notes: Optional[str] = None
    created_at: datetime

    @computed_field
    @property
    def blood_pressure(self) -> Optional[str]:
        if self.systolic_bp and self.diastolic_bp:
            return f"{self.systolic_bp}/{self.diastolic_bp}"
        return None


class DailyCheckInList(BaseModel):
    """Schema for listing a patient's check-in history."""
    checkins: List[DailyCheckInResponse]
    total: int


class RuleResultResponse(BaseModel):
    """Schema for a single triggered risk rule."""
    rule_id: str
    rule_name: str
    severity: str
    matched_conditions: List[str]

    model_config = {"from_attributes": True}


class RiskAssessmentResult(BaseModel):
    """Schema for the result of the DeterministicRiskEngine."""
    highest_severity: str
    triggered_rules: List[RuleResultResponse]


class VitalsLogResponse(BaseModel):
    """
    Response schema for POST /vitals.
    Contains the created check-in and optionally the risk assessment
    if the engine was triggered by sufficient data.
    """
    checkin: DailyCheckInResponse
    risk_assessment: Optional[RiskAssessmentResult] = None
