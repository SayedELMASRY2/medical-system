from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.chat import ChatRole


class ChatMessageBase(BaseModel):
    role: ChatRole
    content: str


class ChatMessageCreate(ChatMessageBase):
    patient_id: str


class ChatMessageResponse(ChatMessageBase):
    id: str
    patient_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]
