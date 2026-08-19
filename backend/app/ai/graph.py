from langgraph.graph import StateGraph, END
from typing import List, Dict, Any
from app.ai.state import AgentState, TrendFeature, SupervisorDecision
from app.risk_engine.engine import DeterministicRiskEngine
from app.ai.llm import get_generic_llm
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.rag.retriever import HybridRetriever
import json

# Node 1: Supervisor (Intent & Routing)
async def supervisor_node(state: AgentState) -> Dict[str, Any]:
    try:
        from app.core.config import settings
        llm = get_generic_llm(model=settings.MODEL_RAG, max_tokens=200)
        
        prompt = f"""You are a clinical supervisor routing queries. 
Read the user's message and determine the intent.
If they are just saying hi, saying thanks, or engaging in casual non-medical chat, the route is "casual_chat".
If they are asking a medical question, uploading lab results, or discussing symptoms, the route is "medical_rag".

Also, if the route is "medical_rag", convert their message into a concise medical search query (incorporating any provided lab results context). If "casual_chat", leave search query empty.

User Message: {state.user_message}
Lab Results: {state.lab_results}

Output MUST be a valid JSON object matching this schema:
{{
  "route": "casual_chat" | "medical_rag",
  "search_query": "concise search string or empty"
}}"""
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        
        # Parse JSON
        content_str = response.content.strip().strip("```json").strip("```").strip()
        data = json.loads(content_str)
        
        route = data.get("route", "medical_rag")
        search_query = data.get("search_query", state.user_message)
        
        decision = SupervisorDecision(route=route, reasoning="LLM choice", urgency_level="normal")
        
        return {
            "supervisor": decision,
            "search_query": search_query,
            "status": "IN_PROGRESS"
        }
    except Exception as e:
        print(f"Supervisor Error: {e}")
        return {
            "supervisor": SupervisorDecision(route="medical_rag", reasoning="Fallback", urgency_level="normal"),
            "search_query": state.user_message,
            "status": "IN_PROGRESS"
        }

# Node 2: Timeline Agent
async def timeline_agent_node(state: AgentState) -> Dict[str, Any]:
    # Simulate a patient's historical data for the demo
    # We pretend the patient had a baseline BP of 110/70, but it recently spiked.
    # The risk engine looks for delta_previous >= 15 and is_accelerating=True
    
    mock_trends = [
        TrendFeature(
            metric="systolic_bp",
            delta_previous=20.0,
            rate_of_change_per_week=10.0,
            is_accelerating=True,
            baseline_value=110.0
        )
    ]
    return {"timeline_trends": mock_trends}

# Node 3: Risk Engine Node (Deterministic Non-LLM)
async def risk_engine_node(state: AgentState) -> Dict[str, Any]:
    risk_level, triggered_rules = DeterministicRiskEngine.evaluate(
        gestational_age_weeks=state.gestational_age_weeks,
        vitals=state.current_vitals,
        symptoms=state.reported_symptoms,
        trends=state.timeline_trends,
        lab_results=state.lab_results
    )
    return {
        "deterministic_risk_level": risk_level,
        "evaluated_rules": triggered_rules
    }

# Node 4a: Triage Agent
async def triage_agent_node(state: AgentState) -> Dict[str, Any]:
    try:
        from app.core.config import settings
        llm = get_generic_llm(model=settings.MODEL_TRIAGE, max_tokens=300)
        
        # We pass the deterministic risk evaluations to the LLM to write a readable summary
        rules_str = ", ".join([r.rule_name for r in state.evaluated_rules]) if hasattr(state, 'evaluated_rules') and state.evaluated_rules else "None"
        
        prompt = f"""You are the Materna Triage Agent. A patient has been evaluated by the deterministic risk engine.
Risk Level: {state.deterministic_risk_level}
Triggered Rules: {rules_str}
Lab Results: {state.lab_results}

Write a concise, professional Clinical Triage Alert (2-3 sentences) summarizing why this patient is at risk and what immediate action is recommended. This will be shown to the doctor or appended as an urgent note."""

        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return {"triage_explanation": response.content}
    except Exception as e:
        return {"triage_explanation": f"System Triage Alert: Risk level {state.deterministic_risk_level}."}

# Node 4b: Medical RAG Agent
async def rag_agent_node(state: AgentState) -> Dict[str, Any]:
    # Fetches evidence from guideline index
    try:
        retriever = HybridRetriever()
        citations = await retriever.retrieve(query=state.search_query or state.user_message)
        return {"retrieved_citations": citations}
    except Exception as e:
        print(f"RAG Error: {e}")
        return {"retrieved_citations": []}

# Node 5: Synthesizer
async def explanation_synthesizer_node(state: AgentState) -> Dict[str, Any]:
    try:
        from app.core.config import settings
        llm = get_generic_llm(model=settings.MODEL_RAG, max_tokens=1000)
        
        system_prompt = "You are a helpful AI assistant for the Materna Pregnancy CDSS. Provide a concise, clear response to the user's query."
        
        # If it's a casual chat, we don't need clinical context
        is_casual = state.supervisor and state.supervisor.route == "casual_chat"
        
        if not is_casual:
            if state.lab_results:
                system_prompt += f"\n\nThe following structured lab data was extracted from the user's uploaded image:\n{state.lab_results}\nInterpret this data carefully."
                
            if hasattr(state, 'triage_explanation') and state.triage_explanation and state.deterministic_risk_level != "low":
                system_prompt += f"\n\n[URGENT TRIAGE ALERT]: {state.triage_explanation}\nNote: Make sure to communicate this urgency to the user appropriately and advise consulting a doctor."
                
            if state.retrieved_citations:
                context = "\n\n".join([f"Source: {c.source_title}\n{c.text_snippet}" for c in state.retrieved_citations])
                system_prompt += f"\n\nUse the following retrieved clinical guidelines to inform your answer:\n{context}"
            
        messages = [SystemMessage(content=system_prompt)]
        
        if hasattr(state, 'chat_history') and state.chat_history:
            for msg in state.chat_history:
                if msg.get("role") == "user":
                    messages.append(HumanMessage(content=msg.get("content", "")))
                elif msg.get("role") == "assistant":
                    messages.append(AIMessage(content=msg.get("content", "")))
                    
        messages.append(HumanMessage(content=state.user_message))
        
        response = await llm.ainvoke(messages)
        final_text = response.content
    except Exception as e:
        final_text = f"Sorry, I encountered an error generating a response: {str(e)}"
        
    return {
        "final_chat_response": final_text,
        "status": "SUCCESS"
    }

# Conditional routing functions
def route_after_supervisor(state: AgentState) -> str:
    if state.supervisor and state.supervisor.route == "casual_chat":
        return "synthesizer"
    return "timeline_agent"

def route_after_risk_engine(state: AgentState) -> str:
    if state.deterministic_risk_level in ["monitor", "clinical_review", "high"]:
        return "triage_agent"
    return "synthesizer"

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
    
    # Route from supervisor
    workflow.add_conditional_edges(
        "supervisor",
        route_after_supervisor,
        {
            "timeline_agent": "timeline_agent",
            "synthesizer": "synthesizer"
        }
    )
    
    # Sequential flow for medical path to prevent duplicate synthesizer execution
    workflow.add_edge("timeline_agent", "rag_agent")
    workflow.add_edge("rag_agent", "risk_engine")

    # Risk Engine conditional route
    workflow.add_conditional_edges(
        "risk_engine",
        route_after_risk_engine,
        {
            "triage_agent": "triage_agent",
            "synthesizer": "synthesizer"
        }
    )

    # Re-converge at Synthesizer
    workflow.add_edge("triage_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()

materna_graph = build_materna_graph()
