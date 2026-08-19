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
    Actual endpoint for SSE Stream running the real LangGraph.
    """
    async def event_generator():
        # Initialize the state for the graph
        initial_state = AgentState(
            execution_id=str(uuid.uuid4()),
            patient_id=patient_id,
            user_message=message
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
                    
                    if "final_chat_response" in state_update and state_update["final_chat_response"]:
                        # Stream the final response word by word to mimic typing
                        words = state_update["final_chat_response"].split(" ")
                        for word in words:
                            yield f"data: {json.dumps({'event': 'chat_chunk', 'content': word + ' '})}\n\n"
                            await asyncio.sleep(0.05)
                            
            # Done
            yield f"data: {json.dumps({'event': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'event': 'agent_thought', 'agent': 'System', 'content': f'Error: {str(e)}'})}\n\n"
            yield f"data: {json.dumps({'event': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
