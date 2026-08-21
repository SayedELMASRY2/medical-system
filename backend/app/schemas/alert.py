from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.alert import AlertSeverity


class CDSSAlertBase(BaseModel):
    severity: AlertSeverity
    message: str


class CDSSAlertCreate(CDSSAlertBase):
    patient_id: str


class CDSSAlertResponse(CDSSAlertBase):
    id: str
    patient_id: str
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True
