import asyncio
from app.ai.graph import materna_graph
from app.ai.state import AgentState
import uuid
import sys
import traceback

async def test():
    state = AgentState(
        execution_id=str(uuid.uuid4()),
        patient_id="test",
        user_message="hi"
    )
    try:
        async for event in materna_graph.astream(state):
            print(event)
    except Exception as e:
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
