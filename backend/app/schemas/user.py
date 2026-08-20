"""Pydantic request/response schemas for User and authentication."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.user import UserRole


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# User request schemas
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    email: str = Field(..., max_length=255, examples=["patient@example.com"])
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., max_length=255, examples=["Amina Ali"])
    role: UserRole = UserRole.PATIENT


# ---------------------------------------------------------------------------
# User response schemas
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
