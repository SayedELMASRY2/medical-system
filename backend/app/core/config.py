from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Materna CDSS Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security / Auth
    SECRET_KEY: str = "super-secret-dev-key-change-in-production-12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[Union[str, AnyHttpUrl]] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "materna_user"
    POSTGRES_PASSWORD: str = "materna_password"
    POSTGRES_DB: str = "materna_db"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # AI & LLMs (OpenRouter)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    COHERE_API_KEY: str = ""
    
    # Model IDs on OpenRouter
    MODEL_SUPERVISOR: str = "openai/gpt-4o-mini"
    MODEL_TIMELINE: str = "openai/gpt-4o-mini"
    MODEL_RAG: str = "openai/gpt-4o-mini"
    MODEL_TRIAGE: str = "openai/gpt-4o"
    
    # CDSS Rules
    CDSS_SAFETY_DISCLAIMER: str = "AI-generated explanation. Clinical Decision Support only. Review with attending clinician."

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
