"""Pydantic request/response schemas for PatientProfile."""

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict
from pydantic.alias_generators import to_camel

from app.models.patient import BloodType


# ---------------------------------------------------------------------------
# Patient request schemas
# ---------------------------------------------------------------------------

class PatientProfileCreate(BaseModel):
    """Schema for POST /patients — creating a new pregnancy profile."""
    full_name: str = Field(..., max_length=255, examples=["Fatma Ali Mohamed"])
    age: int = Field(..., ge=14, le=60, examples=[28])
    gestational_age_weeks: int = Field(..., ge=1, le=45, examples=[24])
    last_menstrual_period: Optional[date] = None
    estimated_due_date: Optional[date] = None
    gravida: int = Field(default=1, ge=1)
    para: int = Field(default=0, ge=0)
    chronic_conditions: List[str] = Field(default_factory=list)
    current_medications: List[str] = Field(default_factory=list)
    baseline_weight_kg: Optional[float] = Field(default=None, ge=30, le=300)
    baseline_systolic_bp: Optional[int] = Field(default=None, ge=60, le=250)
    baseline_diastolic_bp: Optional[int] = Field(default=None, ge=30, le=180)
    blood_type: Optional[BloodType] = None


class PatientProfileUpdate(BaseModel):
    """Schema for PUT /patients/{id} — partial update."""
    full_name: Optional[str] = Field(default=None, max_length=255)
    age: Optional[int] = Field(default=None, ge=14, le=60)
    gestational_age_weeks: Optional[int] = Field(default=None, ge=1, le=45)
    last_menstrual_period: Optional[date] = None
    estimated_due_date: Optional[date] = None
    gravida: Optional[int] = Field(default=None, ge=1)
    para: Optional[int] = Field(default=None, ge=0)
    chronic_conditions: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    baseline_weight_kg: Optional[float] = Field(default=None, ge=30, le=300)
    baseline_systolic_bp: Optional[int] = Field(default=None, ge=60, le=250)
    baseline_diastolic_bp: Optional[int] = Field(default=None, ge=30, le=180)
    blood_type: Optional[BloodType] = None
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Patient response schemas
# ---------------------------------------------------------------------------

class PatientProfileResponse(BaseModel):
    """Schema returned by GET /patients/{id}."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    id: UUID
    user_id: Optional[UUID] = None
    full_name: str
    age: int
    gestational_age_weeks: int
    last_menstrual_period: Optional[date] = None
    estimated_due_date: Optional[date] = None
    gravida: int
    para: int
    chronic_conditions: List[str]
    current_medications: List[str]
    baseline_weight_kg: Optional[float] = None
    baseline_systolic_bp: Optional[int] = None
    baseline_diastolic_bp: Optional[int] = None
    blood_type: Optional[BloodType] = None
    risk_level: str = Field(alias="riskLevel", validation_alias="risk_status")
    clinical_trend_summary: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PatientProfileList(BaseModel):
    """Schema for GET /patients — paginated list."""
    patients: List[PatientProfileResponse]
    total: int
