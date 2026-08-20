"""
Materna CDSS — Lab Report & Lab Result Item Models.

Stores OCR-extracted lab results persistently in the database,
linked to the patient who uploaded them.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import Base


class LabReportType(str, enum.Enum):
    """Classification of lab report types, auto-detected by AI from OCR content."""
    BLOOD = "BLOOD"           # CBC, Hemoglobin, RBC, WBC, Platelets
    URINE = "URINE"           # Urinalysis, Proteinuria
    KIDNEY = "KIDNEY"         # Creatinine, BUN, eGFR
    LIVER = "LIVER"           # AST, ALT, Bilirubin, Albumin
    GLUCOSE = "GLUCOSE"       # Fasting Glucose, HbA1c, OGTT
    THYROID = "THYROID"       # TSH, T3, T4
    COAGULATION = "COAGULATION"  # PT, INR, aPTT
    OTHER = "OTHER"


class LabReport(Base):
    """
    A single lab report document uploaded by a patient (via OCR scan).
    Each report contains multiple individual test results (LabResultItem).
    """
    __tablename__ = "lab_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Link to the patient who owns this report
    patient_id = Column(
        String(36),
        ForeignKey("patient_profiles.id"),
        nullable=False,
        index=True,
    )

    # AI-detected report classification
    report_type = Column(Enum(LabReportType), default=LabReportType.OTHER, nullable=False)

    # Report metadata
    report_date = Column(Date, nullable=True)
    source_filename = Column(String(255), nullable=True)
    ocr_raw_text = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient = relationship(
        "PatientProfile",
        back_populates="lab_reports",
    )
    result_items = relationship(
        "LabResultItem",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="LabResultItem.test_name",
    )

    def __repr__(self):
        return (
            f"<LabReport(id={self.id}, patient_id={self.patient_id}, "
            f"type='{self.report_type}', date={self.report_date})>"
        )


class LabResultItem(Base):
    """
    A single test result within a lab report.
    Example: Hemoglobin = 11.5 g/dL (abnormal).
    """
    __tablename__ = "lab_result_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Link to parent report
    report_id = Column(
        String(36),
        ForeignKey("lab_reports.id"),
        nullable=False,
        index=True,
    )

    # Test data
    test_name = Column(String(255), nullable=False)
    value = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=True)
    reference_range = Column(String(100), nullable=True)
    is_abnormal = Column(Boolean, default=False, nullable=False)

    # Relationships
    report = relationship(
        "LabReport",
        back_populates="result_items",
    )

    def __repr__(self):
        return (
            f"<LabResultItem(id={self.id}, test='{self.test_name}', "
            f"value='{self.value}', abnormal={self.is_abnormal})>"
        )
