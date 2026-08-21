from typing import Optional, Any
from pydantic import BaseModel, Field
from datetime import date, datetime


class VitalsSchema(BaseModel):
    weight_kg: Optional[float] = None
    blood_pressure: Optional[dict[str, int]] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    fetal_movement: Optional[str] = None


class TimelineEntrySchema(BaseModel):
    entry_id: str = Field(default="")
    date: date
    week: int = Field(ge=1, le=42)
    day: int = Field(ge=0, le=6)
    symptoms: list[str] = Field(default_factory=list)
    vitals: VitalsSchema = Field(default_factory=VitalsSchema)
    medications: list[str] = Field(default_factory=list)
    mood: Optional[str] = None
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    notes: str = Field(default="")
    lab_results: Optional[dict[str, Any]] = None
    form_source: str = Field(default="manual", description="manual | ocr | form")
    parsed_at: datetime = Field(default_factory=datetime.now)


class TimelineResponse(BaseModel):
    patient_id: str
    total_entries: int
    entries: list[TimelineEntrySchema]
    current_week: int
    edd: str
    progress_percentage: float
