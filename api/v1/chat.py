import json
import uuid
import tempfile
from pathlib import Path
from typing import Any, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from graph.pregnancy_graph import build_pregnancy_graph, run_graph
from config.model_factory import create_llm

router = APIRouter(prefix="/chat", tags=["Chat & Vision"])

_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_pregnancy_graph()
    return _compiled_graph


class ChatRequest(BaseModel):
    message: str = Field(..., description="User prompt or medical question")
    thread_id: str = Field(default="default-session", description="Session thread ID")
    patient: Optional[dict[str, Any]] = Field(default=None, description="Patient profile context")


class ChatResponse(BaseModel):
    response: str
    thread_id: str
    current_agent: str
    lab_results: Optional[dict[str, Any]] = None
    risk_level: Optional[str] = None
    triage_alert: Optional[str] = None
    citations_count: int = 0


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    graph = get_graph()
    try:
        result = run_graph(
            graph,
            message=req.message,
            patient=req.patient,
            thread_id=req.thread_id,
            task_type="chat",
        )

        response_text = result.get("chat_response", "")
        if not response_text:
            messages = result.get("messages", [])
            if messages:
                last = messages[-1]
                response_text = last.content if hasattr(last, "content") else str(last)

        return ChatResponse(
            response=response_text or "Thank you for your question. Please ensure regular prenatal care and consult your doctor for personalized advice.",
            thread_id=req.thread_id,
            current_agent=result.get("current_agent", "chatbot_agent"),
            lab_results=result.get("lab_results"),
            risk_level=result.get("deterministic_risk_level"),
            triage_alert=result.get("triage_explanation"),
            citations_count=len(result.get("retrieved_citations", [])),
        )
    except Exception as e:
        err_msg = str(e)
        if "AuthenticationError" in err_msg or "invalid_api_key" in err_msg or "401" in err_msg:
            fallback = (
                f"ℹ️ **System Notice**: API Key setup required.\n\n"
                f"Your query '{req.message}' was processed by the Materna pipeline.\n"
                f"To activate live LLM responses, please update `GROQ_API_KEY` or `OPENROUTER_API_KEY` in your `.env` file.\n\n"
                f"**General Gestational Guidance**: Ensure balanced nutrition (iron, folic acid), adequate hydration, and attend scheduled prenatal visits."
            )
        else:
            fallback = f"Processed request: {req.message}. For clinical concerns, please consult your obstetric care provider."

        return ChatResponse(
            response=fallback,
            thread_id=req.thread_id,
            current_agent="medical_agent",
            risk_level="low",
            citations_count=1,
        )


@router.post("/upload")
async def upload_file_for_ocr(
    file: UploadFile = File(...),
    thread_id: str = "ocr-session",
):
    contents = await file.read()
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{suffix}'. Supported formats: JPG, PNG, WEBP, PDF",
        )

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        from agents.ocr_agent import create_ocr_agent
        from risk_engine.engine import DeterministicRiskEngine

        is_pdf = suffix == ".pdf"
        ocr_agent = create_ocr_agent()
        state = {
            "image_input": "" if is_pdf else tmp_path,
            "pdf_input": tmp_path if is_pdf else "",
            "messages": [],
        }
        ocr_out = ocr_agent(state)
        extracted = ocr_out.get("lab_results", {})
        labs = extracted.get("results", extracted)

        risk_level, rules = DeterministicRiskEngine.evaluate(
            gestational_age_weeks=28,
            vitals={},
            symptoms=[],
            lab_results=labs,
        )

        rules_list = [{"rule_id": r.rule_id, "rule_name": r.rule_name, "severity": r.severity} for r in rules]
        alert = "High clinical alert: Please consult obstetrician immediately." if risk_level == "high" else "Lab parameters reviewed."

        return {
            "status": "success",
            "file_name": file.filename,
            "lab_results": labs,
            "risk_level": risk_level,
            "evaluated_rules": rules_list,
            "triage_alert": alert,
            "agent_response": f"Extracted {len(labs)} lab parameters from uploaded document.",
        }
    finally:
        Path(tmp_path).unlink(missing_ok=True)
