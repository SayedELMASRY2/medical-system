from fastapi import APIRouter
from api.v1.health import router as health_router
from api.v1.chat import router as chat_router
from api.v1.dashboard import router as dashboard_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router, prefix="")
api_v1_router.include_router(chat_router, prefix="")
api_v1_router.include_router(dashboard_router, prefix="")
