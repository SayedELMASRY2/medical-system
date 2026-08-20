from typing import Optional
from pydantic import BaseModel, Field
from datetime import date


class PatientCreate(BaseModel):
    patient_id: str = Field(..., description="Unique patient identifier")
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=12, le=60)
    country: str = Field(default="EG", min_length=2, max_length=3)
    city: str = Field(default="")
    lmp_date: date = Field(..., description="Last Menstrual Period date")
    blood_type: Optional[str] = Field(default=None, pattern=r"^(A|B|AB|O)[+-]$")
    weight_kg: Optional[float] = Field(default=None, ge=30, le=250)
    height_cm: Optional[float] = Field(default=None, ge=100, le=250)
    medical_history: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    current_medications: list[str] = Field(default_factory=list)


class PatientResponse(BaseModel):
    patient_id: str
    name: str
    age: int
    country: str
    city: str
    gestational_age_display: str
    edd: str
    trimester: int
    blood_type: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
