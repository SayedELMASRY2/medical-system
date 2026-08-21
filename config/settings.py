from typing import Literal, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):

    llm_provider: Literal["groq", "openrouter", "openai", "anthropic"] = Field(default="groq")
    llm_model: str = Field(default="llama-3.3-70b-versatile")
    llm_temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    llm_max_tokens: int = Field(default=4096, ge=256, le=32768)

    groq_api_key: str = Field(default="")
    openrouter_api_key: str = Field(default="")
    openai_api_key: str = Field(default="")
    anthropic_api_key: str = Field(default="")

    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1")
    vision_model: str = Field(default="google/gemma-3-27b-it:free")

    cohere_api_key: str = Field(default="")
    cohere_embed_model: str = Field(default="embed-v4.0")
    cohere_rerank_model: str = Field(default="rerank-v4.0-pro")
    embedding_dimension: int = Field(default=1024)

    qdrant_url: str = Field(default="")
    qdrant_api_key: str = Field(default="")
    qdrant_collection: str = Field(default="materna_medical_corpus_v1")

    memory_backend: Literal["local", "postgres"] = Field(default="local")
    database_url: str = Field(default="sqlite:///./pregnancy_tracker.db")

    app_name: str = Field(default="Materna Medical System")
    app_debug: bool = Field(default=True)
    app_log_level: str = Field(default="INFO")
    default_country: str = Field(default="EG")
    default_timezone: str = Field(default="Africa/Cairo")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    def get_api_key(self) -> str:
        key_map = {
            "groq": self.groq_api_key,
            "openrouter": self.openrouter_api_key,
            "openai": self.openai_api_key,
            "anthropic": self.anthropic_api_key,
        }
        key = key_map.get(self.llm_provider, "")
        if not key:
            raise ValueError(
                f"API key not found for provider '{self.llm_provider}'. "
                f"Set {self.llm_provider.upper()}_API_KEY in your .env file."
            )
        return key


settings = Settings()
