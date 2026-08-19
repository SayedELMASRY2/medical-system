from langchain_openai import ChatOpenAI
from app.core.config import settings

def get_generic_llm(model: str, temperature: float = 0.1, max_tokens: int = 1000) -> ChatOpenAI:
    """
    Factory function to initialize ChatOpenAI client (can point to OpenAI, Ollama, Groq, etc.).
    """
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        openai_api_key=settings.LLM_API_KEY,
        openai_api_base=settings.LLM_BASE_URL,
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
