import asyncio
import json
import uuid
from uuid import UUID
from fastapi import APIRouter, Depends, File, UploadFile, Query
from fastapi.responses import StreamingResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.ai.graph import materna_graph
from app.ai.state import AgentState

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/upload")
async def upload_file_for_ocr(
    file: UploadFile = File(...)
):
    """
    Real OCR endpoint using Vision LLM.
    """
    import base64
    from langchain_core.messages import HumanMessage
    from app.ai.llm import get_vision_llm

    # Read image bytes
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode("utf-8")
    
    # Init Vision LLM
    vision_llm = get_vision_llm()
    
    # Prepare message for vision model
    messages = [
        HumanMessage(content=[
            {"type": "text", "text": "You are a medical OCR assistant. Extract the text from this lab test result image. Then, provide the structured data as a JSON object with keys like 'platelets', 'hemoglobin', 'inr', 'prothrombin_time', etc. based on what you find. Output ONLY valid JSON in this format: {\"text\": \"<extracted text>\", \"structured_data\": {<key>: <value>}}. Do not include markdown code blocks or any other text."},
            {"type": "image_url", "image_url": {"url": f"data:{file.content_type};base64,{base64_image}"}}
        ])
    ]
    
    try:
        response = await vision_llm.ainvoke(messages)
        from langchain_core.output_parsers import JsonOutputParser
        parser = JsonOutputParser()
        
        content_str = response.content
        # Sometimes models output single backslashes that invalidate JSON parsing.
        try:
            ocr_result = parser.parse(content_str)
        except Exception:
            # Fallback: escape backslashes and try again
            safe_str = content_str.replace("\\", "\\\\")
            ocr_result = parser.parse(safe_str)
            
        print(f"Vision OCR SUCCESS: {ocr_result}")
        return {"message": "File processed successfully", "ocrResult": ocr_result}
    except Exception as e:
        print(f"Vision OCR Error: {e}")
        try:
            print(f"Raw Vision OCR Output: {response.content}")
        except:
            pass
        # Fallback to mock if vision model fails or json parsing fails
        mock_ocr_result = {
            "text": f"Failed to extract text using Vision LLM. Error: {str(e)}\\nMock Data: Platelets: 150,000",
            "structured_data": {}
        }
        return {"message": "File processed with errors", "ocrResult": mock_ocr_result}


from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.crud.chat import get_chat_history
from app.schemas.chat import ChatMessageResponse

class ChatRequest(BaseModel):
    message: str
    patient_id: str
    escalate: bool = False
    chat_history: List[Dict[str, str]] = []
    lab_results: Optional[Dict[str, Any]] = None

@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """
    Actual endpoint for SSE Stream running the real LangGraph.
    """
    async def event_generator():
        # Initialize the state for the graph
        initial_state = AgentState(
            execution_id=str(uuid.uuid4()),
            patient_id=req.patient_id,
            user_message=req.message,
            chat_history=req.chat_history,
            lab_results=req.lab_results
        )
        
        # Iterate over graph events
        try:
            async for event in materna_graph.astream(initial_state):
                # event is a dict where key is the node name and value is the state update
                for node_name, state_update in event.items():
                    # Format node name for display
                    display_name = node_name.replace("_", " ").title()
                    yield f"data: {json.dumps({'event': 'agent_start', 'agent': display_name})}\n\n"
                    await asyncio.sleep(0.1) # Small delay for frontend rendering
                    
                    if state_update and isinstance(state_update, dict) and "final_chat_response" in state_update and state_update["final_chat_response"]:
                        # Stream the final response word by word to mimic typing
                        words = state_update["final_chat_response"].split(" ")
                        for word in words:
                            yield f"data: {json.dumps({'event': 'chat_chunk', 'content': word + ' '})}\n\n"
                            await asyncio.sleep(0.05)
                            
            # Done
            yield f"data: {json.dumps({'event': 'done'})}\n\n"
        except Exception as e:
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'System', 'content': f'Error: {str(e)}'})}\n\n"
            yield f"data: {json.dumps({'event': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/history/{patient_id}", response_model=List[ChatMessageResponse])
def read_chat_history(
    patient_id: str,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve chat history for a patient.
    """
    messages = get_chat_history(db, patient_id=patient_id, limit=limit)
    return messages
