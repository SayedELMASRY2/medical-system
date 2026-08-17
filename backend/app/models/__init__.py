"""
Materna CDSS — SQLAlchemy ORM Models.

All models inherit from the shared Base (declarative_base) defined in base.py.
Import models here so that Alembic autogenerate and relationship resolution
can discover them from a single entry point.
"""

from app.models.base import Base  # noqa: F401

# Domain models
from app.models.user import User, UserRole  # noqa: F401
from app.models.patient import PatientProfile, BloodType  # noqa: F401
from app.models.daily_checkin import (  # noqa: F401
    DailyCheckIn,
    DietQuality,
    ActivityLevel,
    SleepQuality,
    HeadacheSeverity,
    FetalMovement,
)

# RAG / Vector DB models
from app.models.document import DocumentChunk  # noqa: F401
