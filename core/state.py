from typing import Annotated, Any, Optional, Sequence, Literal
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field


class VitalSigns(BaseModel):
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    heart_rate: Optional[int] = None
    fetal_heart_rate: Optional[int] = None
    weight_kg: Optional[float] = None
    blood_glucose: Optional[float] = None
    proteinuria: Optional[str] = None
    temperature: Optional[float] = None


class TrendFeature(BaseModel):
    metric: str
    delta_previous: float
    rate_of_change_per_week: float
    is_accelerating: bool
    baseline_value: float


class RuleResult(BaseModel):
    rule_id: str
    rule_name: str
    severity: Literal["low", "monitor", "clinical_review", "high"]
    matched_conditions: list[str]


class Citation(BaseModel):
    chunk_id: str
    text_snippet: str
    source_title: str
    organization: str


class PatientProfile(TypedDict, total=False):
    patient_id: str
    name: str
    age: int
    country: str
    city: str
    gestational_age_weeks: int
    gestational_age_days: int
    lmp_date: str
    edd: str
    blood_type: str
    weight_kg: float
    height_cm: float
    medical_history: list[str]
    allergies: list[str]
    current_medications: list[str]


class TimelineEntry(TypedDict, total=False):
    date: str
    week: int
    day: int
    symptoms: list[str]
    vitals: dict[str, Any]
    notes: str
    form_source: str
    parsed_at: str


class AgentState(TypedDict, total=False):
    messages: Annotated[Sequence[BaseMessage], add_messages]

    patient: PatientProfile
    timeline: list[TimelineEntry]

    current_agent: str
    next_agent: str
    task_type: str

    raw_md_input: str
    parsed_form_data: dict[str, Any]

    image_input: Optional[str]
    pdf_input: Optional[str]
    lab_results: Optional[dict[str, Any]]

    current_vitals: Optional[dict[str, Any]]
    reported_symptoms: list[str]
    gestational_age_weeks: Optional[int]
    timeline_trends: list[dict[str, Any]]

    deterministic_risk_level: Optional[str]
    evaluated_rules: list[dict[str, Any]]
    triage_explanation: Optional[str]

    retrieved_citations: list[dict[str, Any]]
    search_query: Optional[str]

    dashboard_output: dict[str, Any]
    chat_response: str

    error: Optional[str]
    metadata: dict[str, Any]
    status: str
