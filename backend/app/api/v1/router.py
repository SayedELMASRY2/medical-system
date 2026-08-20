"""
API v1 router — aggregates all sub-routers under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.patients import router as patients_router
from app.api.v1.vitals import router as vitals_router
from app.api.v1.chat import router as chat_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(patients_router)
api_v1_router.include_router(vitals_router)
api_v1_router.include_router(chat_router)
