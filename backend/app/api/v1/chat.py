import asyncio
import json
from uuid import UUID
from fastapi import APIRouter, Depends, File, UploadFile, Query
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/upload")
async def upload_file_for_ocr(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Mock endpoint for Task 4.6 (OCR File Upload).
    In production, this would call GPT-4o Vision or Tesseract.
    """
    # Simulate processing time
    await asyncio.sleep(1.5)
    
    mock_ocr_result = {
        "text": f"Extracted text from {file.filename}\\nPlatelets: 150,000\\nHemoglobin: 11.2",
        "structured_data": {
            "platelets": 150000,
            "hemoglobin": 11.2
        }
    }
    return {"message": "File processed successfully", "ocrResult": mock_ocr_result}


@router.get("/stream")
async def chat_stream(
    message: str = Query(...),
    patient_id: str = Query(...),
    escalate: bool = Query(False)
):
    """
    Mock endpoint for Task 4.5 (SSE Stream).
    Simulates LangGraph thought process yielding events over Server-Sent Events.
    """
    async def event_generator():
        # 1. Timeline Agent
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Timeline'})}\n\n"
        await asyncio.sleep(0.5)
        yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Timeline', 'content': 'Fetching longitudinal trends...'})}\n\n"
        await asyncio.sleep(0.5)
        yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Timeline', 'content': 'Found baseline BP 110/70. Synthesizing context.'})}\n\n"
        await asyncio.sleep(0.5)

        # 2. Supervisor Agent
        yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Supervisor'})}\n\n"
        await asyncio.sleep(0.5)
        yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Supervisor', 'content': 'Analyzing intent...'})}\n\n"
        await asyncio.sleep(0.5)
        
        if escalate:
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Supervisor', 'content': 'Medical query detected. Routing to RAG and Triage.'})}\n\n"
            await asyncio.sleep(0.5)
            
            # 3. RAG Agent
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Medical RAG'})}\n\n"
            await asyncio.sleep(0.5)
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Medical RAG', 'content': 'Querying pgvector for guidelines...'})}\n\n"
            await asyncio.sleep(0.8)
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Medical RAG', 'content': 'Found ACOG guidelines on Severe Hypertension.'})}\n\n"
            await asyncio.sleep(0.5)
            
            # 4. Triage Agent
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Triage'})}\n\n"
            await asyncio.sleep(0.5)
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Triage', 'content': 'Evaluating deterministic risk engine...'})}\n\n"
            await asyncio.sleep(0.5)
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Triage', 'content': '⚠️ HIGH RISK detected based on symptoms!'})}\n\n"
            await asyncio.sleep(0.5)
            
            # 5. Chat Agent (Final Response)
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Chat Response'})}\n\n"
            await asyncio.sleep(0.5)
            final_message = "I notice you mentioned some concerning symptoms. Based on ACOG guidelines, severe headaches or blurry vision require immediate clinical review. Please contact your doctor or visit the emergency room immediately."
            
        else:
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'Supervisor', 'content': 'General chat detected. Routing to Chat Agent.'})}\n\n"
            await asyncio.sleep(0.5)
            
            # 5. Chat Agent (Final Response)
            yield f"data: {json.dumps({'event': 'agent_start', 'agent': 'Chat Response'})}\n\n"
            await asyncio.sleep(0.5)
            final_message = f"I'm here to help! You asked: '{message}'. How else can I assist you with your pregnancy journey today?"
        
        # Stream the final response word by word
        words = final_message.split(" ")
        for word in words:
            yield f"data: {json.dumps({'event': 'chat_chunk', 'content': word + ' '})}\n\n"
            await asyncio.sleep(0.05)
            
        # Done
        yield f"data: {json.dumps({'event': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
