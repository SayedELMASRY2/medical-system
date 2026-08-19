from langgraph.graph import StateGraph, END
from typing import List, Dict, Any
from app.ai.state import AgentState
from app.risk_engine.engine import DeterministicRiskEngine

# Node 1: Supervisor
async def supervisor_node(state: AgentState) -> Dict[str, Any]:
    # Validate context and initialize execution routing
    return {"status": "IN_PROGRESS"}

# Node 2: Timeline Agent
async def timeline_agent_node(state: AgentState) -> Dict[str, Any]:
    # Placeholder for longitudinal calculations
    return {"timeline_trends": []}

# Node 3: Risk Engine Node (Deterministic Non-LLM)
async def risk_engine_node(state: AgentState) -> Dict[str, Any]:
    risk_level, triggered_rules = DeterministicRiskEngine.evaluate(
        gestational_age_weeks=state.gestational_age_weeks,
        vitals=state.current_vitals,
        symptoms=state.reported_symptoms,
        trends=state.timeline_trends
    )
    return {
        "deterministic_risk_level": risk_level,
        "evaluated_rules": triggered_rules
    }

# Node 4a: Triage Agent
async def triage_agent_node(state: AgentState) -> Dict[str, Any]:
    # Synthesizes clinical explanation
    explanation = f"Patient presents with risk level {state.deterministic_risk_level} at gestational week {state.gestational_age_weeks}."
    return {"triage_explanation": explanation}

# Node 4b: Medical RAG Agent
async def rag_agent_node(state: AgentState) -> Dict[str, Any]:
    # Fetches evidence from guideline index
    return {"retrieved_citations": []}

# Node 5: Synthesizer
async def explanation_synthesizer_node(state: AgentState) -> Dict[str, Any]:
    return {"status": "SUCCESS"}

# Conditional routing function
def route_after_risk_engine(state: AgentState) -> List[str]:
    if state.deterministic_risk_level in ["monitor", "clinical_review", "high"]:
        return ["triage_agent", "rag_agent"]
    return ["synthesizer"]

# Build StateGraph
def build_materna_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("timeline_agent", timeline_agent_node)
    workflow.add_node("risk_engine", risk_engine_node)
    workflow.add_node("triage_agent", triage_agent_node)
    workflow.add_node("rag_agent", rag_agent_node)
    workflow.add_node("synthesizer", explanation_synthesizer_node)

    workflow.set_entry_point("supervisor")
    workflow.add_edge("supervisor", "timeline_agent")
    workflow.add_edge("timeline_agent", "risk_engine")

    workflow.add_conditional_edges(
        "risk_engine",
        route_after_risk_engine,
        {
            "triage_agent": "triage_agent",
            "rag_agent": "rag_agent",
            "synthesizer": "synthesizer"
        }
    )

    workflow.add_edge("triage_agent", "synthesizer")
    workflow.add_edge("rag_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()

materna_graph = build_materna_graph()
