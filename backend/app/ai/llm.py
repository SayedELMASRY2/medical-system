from langchain_openai import ChatOpenAI
from app.core.config import settings

def get_generic_llm(model: str = None, temperature: float = 0.1, max_tokens: int = 1000) -> ChatOpenAI:
    """
    Factory function to initialize ChatOpenAI client pointing to OpenRouter API.
    """
    selected_model = model or settings.MODEL_SUPERVISOR
    api_key = settings.LLM_API_KEY
    base_url = settings.LLM_BASE_URL

    return ChatOpenAI(
        model=selected_model,
        temperature=temperature,
        max_tokens=max_tokens,
        api_key=api_key,
        base_url=base_url,
        default_headers={
            "HTTP-Referer": "https://materna-health.local",
            "X-Title": "Materna Pregnancy CDSS"
        }
    )

# Pre-configured agent LLM instances
def get_supervisor_llm() -> ChatOpenAI:
    return get_generic_llm(model=settings.MODEL_SUPERVISOR, temperature=0.1, max_tokens=500)

def get_timeline_llm() -> ChatOpenAI:
    return get_generic_llm(model=settings.MODEL_TIMELINE, temperature=0.1, max_tokens=1500)

def get_rag_llm() -> ChatOpenAI:
    return get_generic_llm(model=settings.MODEL_RAG, temperature=0.1, max_tokens=1000)

def get_triage_llm() -> ChatOpenAI:
    return get_generic_llm(model=settings.MODEL_TRIAGE, temperature=0.2, max_tokens=2000)

def get_vision_llm() -> ChatOpenAI:
    return get_generic_llm(model=settings.MODEL_VISION, temperature=0.1, max_tokens=1500)
