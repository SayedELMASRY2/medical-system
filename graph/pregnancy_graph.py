from typing import Any
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver

from core.state import AgentState
from core.memory import memory_manager
from agents.ocr_agent import create_ocr_agent
from agents.supervisor_agent import create_supervisor_agent
from agents.timeline_agent import create_timeline_agent
from agents.medical_agent import create_medical_agent
from agents.triage_agent import create_triage_agent
from agents.chatbot_agent import create_chatbot_agent
from agents.dashboard_agent import create_dashboard_agent
from config.model_factory import create_llm, create_vision_llm


def build_pregnancy_graph(llm=None, vision_llm=None):
    if llm is None:
        llm = create_llm()

    ocr_node = create_ocr_agent(vision_llm)
    supervisor_node = create_supervisor_agent(llm)
    timeline_node = create_timeline_agent(llm)
    medical_node = create_medical_agent(llm)
    triage_node = create_triage_agent(llm)
    chatbot_node = create_chatbot_agent(llm)
    dashboard_node = create_dashboard_agent(llm)

    graph = StateGraph(AgentState)

    graph.add_node("ocr_agent", ocr_node)
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("timeline_agent", timeline_node)
    graph.add_node("medical_agent", medical_node)
    graph.add_node("triage_agent", triage_node)
    graph.add_node("chatbot_agent", chatbot_node)
    graph.add_node("dashboard_agent", dashboard_node)

    graph.add_edge(START, "ocr_agent")
    graph.add_edge("ocr_agent", "supervisor")

    graph.add_conditional_edges(
        "supervisor",
        _route_from_supervisor,
        {
            "timeline_agent": "timeline_agent",
            "medical_agent": "medical_agent",
            "triage_agent": "triage_agent",
            "chatbot_agent": "chatbot_agent",
            "dashboard_agent": "dashboard_agent",
            "FINISH": END,
        },
    )

    graph.add_edge("timeline_agent", "supervisor")
    graph.add_edge("medical_agent", "triage_agent")
    graph.add_edge("triage_agent", "dashboard_agent")
    graph.add_edge("chatbot_agent", END)
    graph.add_edge("dashboard_agent", END)

    checkpointer = memory_manager.checkpointer

    compiled = graph.compile(checkpointer=checkpointer)

    return compiled


def _route_from_supervisor(state: dict[str, Any]) -> str:
    next_agent = state.get("next_agent", "chatbot_agent")

    valid_routes = [
        "timeline_agent", "medical_agent", "triage_agent",
        "chatbot_agent", "dashboard_agent", "FINISH",
    ]

    if next_agent in valid_routes:
        return next_agent

    return "chatbot_agent"


def run_graph(
    graph,
    message: str = "",
    md_input: str = "",
    image_input: str = "",
    pdf_input: str = "",
    patient: dict | None = None,
    thread_id: str = "default",
    task_type: str = "chat",
) -> dict[str, Any]:
    from langchain_core.messages import HumanMessage

    initial_state: dict[str, Any] = {
        "metadata": {"thread_id": thread_id},
    }

    if message:
        initial_state["messages"] = [HumanMessage(content=message)]

    if md_input:
        initial_state["raw_md_input"] = md_input

    if image_input:
        initial_state["image_input"] = image_input

    if pdf_input:
        initial_state["pdf_input"] = pdf_input

    if patient:
        initial_state["patient"] = patient

    initial_state["task_type"] = task_type

    config = {"configurable": {"thread_id": thread_id}}

    result = graph.invoke(initial_state, config=config)

    return result
