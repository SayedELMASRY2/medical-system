from typing import Annotated, List, Optional, Dict, Any
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

class RuleResult(BaseModel):
    rule_id: str
    rule_name: str
    severity: str  # "LOW", "MONITOR", "CLINICAL_REVIEW", "HIGH_PRIORITY"
    matched_conditions: List[str]

class Citation(BaseModel):
    chunk_id: str
    text_snippet: str
    source_title: str
    organization: str  # "WHO", "ACOG", "NICE", "SMFM"

class AgentOutput(BaseModel):
    agent_name: str
    timestamp: str
    payload: Dict[str, Any]

class AgentState(BaseModel):
    # 1. Core Patient Context
    patient_id: str
    gestational_age_weeks: int
    current_vitals: VitalSigns
    reported_symptoms: List[str] = Field(default_factory=list)
    longitudinal_history: List[Dict[str, Any]] = Field(default_factory=list)

    # 2. Pipeline Results
    timeline_trends: Optional[List[TrendFeature]] = None
    deterministic_risk_level: Optional[str] = None  # "LOW", "MONITOR", "CLINICAL_REVIEW", "HIGH_PRIORITY"
    evaluated_rules: Optional[List[RuleResult]] = None
    retrieved_citations: Optional[List[Citation]] = None
    triage_explanation: Optional[str] = None
    recommended_clinical_actions: Optional[List[str]] = None

    # 3. Parallel Accumulators
    agent_outputs: Annotated[List[AgentOutput], operator.add] = Field(default_factory=list)
    agent_errors: Annotated[List[str], operator.add] = Field(default_factory=list)

    # 4. Metadata & Status
    execution_id: str
    status: str = "IN_PROGRESS"  # "IN_PROGRESS", "SUCCESS", "DEGRADED", "FAILED"
