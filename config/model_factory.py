from typing import Optional
from langchain_core.language_models import BaseChatModel
from config.settings import settings


def create_llm(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
    **kwargs,
) -> BaseChatModel:
    _provider = (provider or settings.llm_provider).lower()
    _model = model or settings.llm_model
    _temperature = temperature if temperature is not None else settings.llm_temperature
    _max_tokens = max_tokens or settings.llm_max_tokens

    if _provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=_model,
            temperature=_temperature,
            max_tokens=_max_tokens,
            api_key=settings.groq_api_key,
            **kwargs,
        )

    elif _provider == "openrouter":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=_model,
            temperature=_temperature,
            max_tokens=_max_tokens,
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            default_headers={
                "HTTP-Referer": "https://materna-health.local",
                "X-Title": "Materna Pregnancy CDSS",
            },
            **kwargs,
        )

    elif _provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=_model,
            temperature=_temperature,
            max_tokens=_max_tokens,
            api_key=settings.openai_api_key,
            **kwargs,
        )

    elif _provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=_model,
            temperature=_temperature,
            max_tokens=_max_tokens,
            api_key=settings.anthropic_api_key,
            **kwargs,
        )

    else:
        raise ValueError(
            f"Unsupported LLM provider: '{_provider}'. "
            f"Choose from: groq, openrouter, openai, anthropic"
        )


def create_vision_llm(
    model: Optional[str] = None,
    max_tokens: int = 2000,
) -> BaseChatModel:
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(
        model=model or settings.vision_model,
        temperature=0.1,
        max_tokens=max_tokens,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers={
            "HTTP-Referer": "https://materna-health.local",
            "X-Title": "Materna Pregnancy CDSS",
        },
    )


def get_model_info() -> dict:
    return {
        "provider": settings.llm_provider,
        "model": settings.llm_model,
        "temperature": settings.llm_temperature,
        "max_tokens": settings.llm_max_tokens,
        "vision_model": settings.vision_model,
        "cohere_embed": settings.cohere_embed_model,
        "cohere_rerank": settings.cohere_rerank_model,
        "qdrant_collection": settings.qdrant_collection,
    }
