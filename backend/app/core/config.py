import os
from typing import List, Union
from pydantic import AnyHttpUrl
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

    # AI & LLMs Configuration
    OPENROUTER_API_KEY: str = "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"
    OPENROUTER_BASE_URL: str = "https://api.openrouter.ai/v1"
    GROQ_API_KEY: str = "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"
    COHERE_API_KEY: str = "EfpCXWlhv9wp8J5eibTDJirHsqnHc4YiFfFYNCUy"
    
    @property
    def LLM_API_KEY(self) -> str:
        return os.getenv("OPENROUTER_API_KEY") or self.OPENROUTER_API_KEY or os.getenv("GROQ_API_KEY") or self.GROQ_API_KEY

    @property
    def LLM_BASE_URL(self) -> str:
        return os.getenv("OPENROUTER_BASE_URL") or self.OPENROUTER_BASE_URL

    # Model IDs
    MODEL_SUPERVISOR: str = "qwen/qwen-2.5-72b-instruct"
    MODEL_TIMELINE: str = "qwen/qwen-2.5-72b-instruct"
    MODEL_RAG: str = "qwen/qwen-2.5-72b-instruct"
    MODEL_TRIAGE: str = "qwen/qwen-2.5-72b-instruct"
    MODEL_VISION: str = "qwen/qwen-2-vl-72b-instruct"

    # CDSS Rules
    CDSS_SAFETY_DISCLAIMER: str = "AI-generated explanation. Clinical Decision Support only. Review with attending clinician."

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
