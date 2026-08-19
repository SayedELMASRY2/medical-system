from typing import Annotated, List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
import operator

class VitalSigns(BaseModel):
    systolic_bp: int
    diastolic_bp: int
    heart_rate: int
    fetal_heart_rate: Optional[int] = None
    weight_kg: float
    blood_glucose: Optional[float] = None
    proteinuria: Optional[str] = None  # "+1", "+2", "trace", "negative"

class TrendFeature(BaseModel):
    metric: str
    delta_previous: float
    rate_of_change_per_week: float
    is_accelerating: bool
    baseline_value: float

class TimelineContext(BaseModel):
    """Output of the Timeline Agent."""
    patient_context_summary: str
    trends: List[TrendFeature] = Field(default_factory=list)
    active_conditions: List[str] = Field(default_factory=list)
    recent_symptoms: List[str] = Field(default_factory=list)
    missing_critical_data: List[str] = Field(default_factory=list)

class SupervisorDecision(BaseModel):
    """Output of the Supervisor Router."""
    route: Literal["medical_rag", "general_chat", "clarify_intent"]
    reasoning: str
    urgency_level: str

class RuleResult(BaseModel):
    rule_id: str
    rule_name: str
    severity: Literal["low", "monitor", "clinical_review", "high"]
    matched_conditions: List[str]

class TriageDisposition(BaseModel):
    """Output of the Triage/Safety Agent (Deterministic Risk Engine rules applied)."""
    highest_severity: Literal["low", "monitor", "clinical_review", "high"]
    hard_rules_triggered: List[RuleResult] = Field(default_factory=list)
    requires_fast_track: bool = False

class Citation(BaseModel):
    chunk_id: str
    text_snippet: str
    source_title: str
    organization: str

class AgentOutput(BaseModel):
    agent_name: str
    timestamp: str
    payload: Dict[str, Any]

class AgentState(BaseModel):
    # 1. Inputs
    execution_id: str
    patient_id: str
    user_message: str
    current_vitals: Optional[VitalSigns] = None
    gestational_age_weeks: Optional[int] = None
    reported_symptoms: List[str] = Field(default_factory=list)
    timeline_trends: List[TrendFeature] = Field(default_factory=list)
    deterministic_risk_level: Optional[str] = None
    
    # 2. Sequential Agent Outputs
    timeline: Optional[TimelineContext] = None
    supervisor: Optional[SupervisorDecision] = None
    triage: Optional[TriageDisposition] = None
    
    # 3. RAG Context
    retrieved_citations: List[Citation] = Field(default_factory=list)
    
    # 4. Final Outputs
    final_chat_response: Optional[str] = None
    doctor_dashboard_alert: Optional[str] = None
    
    # 5. Graph System Accumulators
    agent_errors: Annotated[List[str], operator.add] = Field(default_factory=list)
    status: str = "IN_PROGRESS"
