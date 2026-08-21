from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessageCreate

def create_chat_message(db: Session, message: ChatMessageCreate) -> ChatMessage:
    db_message = ChatMessage(
        patient_id=message.patient_id,
        role=message.role,
        content=message.content,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_chat_history(db: Session, patient_id: str, limit: int = 100) -> List[ChatMessage]:
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.patient_id == patient_id)
        .order_by(asc(ChatMessage.created_at))
        .limit(limit)
        .all()
    )
