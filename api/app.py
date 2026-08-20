from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from config.settings import settings
from api.v1.health import router as health_router
from api.v1.chat import router as chat_router
from api.v1.dashboard import router as dashboard_router
from api.v1.checkin import router as checkin_router


def create_api_app() -> FastAPI:
    from database import init_db
    init_db()

    app = FastAPI(
        title=settings.app_name,
        description="Materna — AI-Powered Longitudinal Pregnancy Monitoring & Early-Warning CDSS",
        version="1.0.0",
        openapi_url="/api/v1/openapi.json",
    )

    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix="/api/v1")
    app.include_router(chat_router, prefix="/api/v1")
    app.include_router(dashboard_router, prefix="/api/v1")
    app.include_router(checkin_router, prefix="/api/v1")

    static_dir = Path(__file__).resolve().parent.parent / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

        @app.get("/", include_in_schema=False)
        async def serve_index():
            return FileResponse(static_dir / "index.html")

    @app.get("/favicon.ico", include_in_schema=False)
    async def favicon():
        from fastapi.responses import Response
        return Response(status_code=204)

    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": "1.0.0",
            "provider": settings.llm_provider,
            "model": settings.llm_model,
        }

    return app
