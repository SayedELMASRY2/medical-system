import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.base import Base


class ChatRole(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class ChatMessage(Base):
    """
    Stores a single chat message between the patient and the AI Medical Assistant.
    """
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Link to the patient profile
    patient_id = Column(
        String(36),
        ForeignKey("patient_profiles.id"),
        nullable=False,
        index=True,
    )

    role = Column(Enum(ChatRole), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    patient = relationship(
        "PatientProfile",
        backref="chat_messages",
    )

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role='{self.role}', patient_id='{self.patient_id}')>"
