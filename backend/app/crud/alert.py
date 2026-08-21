from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.alert import CDSSAlert
from app.schemas.alert import CDSSAlertCreate

def create_alert(db: Session, alert: CDSSAlertCreate) -> CDSSAlert:
    db_alert = CDSSAlert(
        patient_id=alert.patient_id,
        severity=alert.severity,
        message=alert.message,
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


def get_patient_alerts(db: Session, patient_id: str, limit: int = 50) -> List[CDSSAlert]:
    return (
        db.query(CDSSAlert)
        .filter(CDSSAlert.patient_id == patient_id)
        .order_by(desc(CDSSAlert.created_at))
        .limit(limit)
        .all()
    )
