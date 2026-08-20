from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class RiskAssessment(BaseModel):
    level: str = Field(default="not_assessed")
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    factors: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    requires_attention: bool = Field(default=False)
    assessed_at: Optional[str] = None


class VitalsTrend(BaseModel):
    weight: list[dict] = Field(default_factory=list)
    bp_systolic: list[dict] = Field(default_factory=list)
    bp_diastolic: list[dict] = Field(default_factory=list)


class PatientSummary(BaseModel):
    id: str
    name: str
    gestational_age: int
    edd: str
    trimester: str


class LatestEntry(BaseModel):
    date: str = ""
    symptoms: list[str] = Field(default_factory=list)
    vitals: dict = Field(default_factory=dict)
    notes: str = ""


class DashboardReport(BaseModel):
    report_id: str
    generated_at: datetime = Field(default_factory=datetime.now)
    patient_summary: PatientSummary
    latest_entry: LatestEntry
    vitals_trend: VitalsTrend
    risk_assessment: RiskAssessment
    timeline_count: int = 0
    status: str = "active"
