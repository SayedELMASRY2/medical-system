from typing import Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from graph.pregnancy_graph import build_pregnancy_graph, run_graph

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardRequest(BaseModel):
    patient: dict[str, Any]
    thread_id: str = "dashboard-session"


@router.post("/")
async def get_dashboard_report(req: DashboardRequest):
    graph = build_pregnancy_graph()
    result = run_graph(
        graph,
        message="Generate a comprehensive patient dashboard report",
        patient=req.patient,
        thread_id=req.thread_id,
        task_type="dashboard_report",
    )

    return {
        "status": "success",
        "dashboard": result.get("dashboard_output", {}),
        "risk_level": result.get("deterministic_risk_level"),
        "triage_alert": result.get("triage_explanation"),
    }
