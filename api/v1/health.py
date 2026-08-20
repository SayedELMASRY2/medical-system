from fastapi import APIRouter
from config import settings, get_model_info

router = APIRouter(tags=["Health"])


@router.get("/health/details")
async def health_details():
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "model_info": get_model_info(),
        "cohere_configured": bool(settings.cohere_api_key),
        "qdrant_configured": bool(settings.qdrant_url and settings.qdrant_api_key),
    }
