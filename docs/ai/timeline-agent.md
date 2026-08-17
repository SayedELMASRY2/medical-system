# Timeline Agent Specification

## Purpose
The Timeline Agent analyzes longitudinal patient data to detect changes over time and generate temporal features. Pregnancy is a dynamic state; understanding the rate of change of vital signs and symptoms relative to gestational age is critical for early warning.

## Model Configuration
- **Model**: `GPT-4o-mini` (efficient for data parsing and trend extraction)
- **Temperature**: `0.1` (requires highly analytical and deterministic output)

## Input
- `patient_id`, `pregnancy_id`
- Current measurements (vitals, labs, symptoms)
- Historical measurements (time-series data)

## Processing Logic
1. **Retrieve Timeline**: Fetch the patient's historical records from the database/state.
2. **Organize Data**: Group measurements by type (e.g., Blood Pressure, Weight, Fundal Height) and align them with the exact gestational week.
3. **Calculate Features**: Compute trend features for each measurement type (e.g., percentage change, rate of change).
4. **Identify Changes**: Flag significant temporal changes (e.g., a sudden spike in BP compared to a rolling average).
5. **Baseline Comparison**: Compare current values to expected gestational-age-specific baselines.
6. **Generate Context**: Produce a structured temporal context report.

## Output
Generates a `TimelineAnalysis` object containing measurement trends, significant changes, and contextual summaries.

## Trend Features per Measurement
The agent computes and outputs the following metrics for longitudinal numeric data:
- `latest_value`: The most recent reading.
- `previous_value`: The immediate prior reading.
- `change`: Absolute difference.
- `pct_change`: Percentage difference.
- `direction`: `increasing`, `decreasing`, or `stable`.
- `rate_of_change`: Change per unit time (e.g., per week).
- `rolling_avg`: Average over the last N readings.
- `consecutive_abnormal_count`: Number of consecutive readings outside normal bounds.
- `threshold_violations`: Specific deterministic limits breached.

## Example: BP Trend Analysis (Week 24 to 31)
```json
{
  "measurement": "systolic_bp",
  "latest_value": 138,
  "previous_value": 125,
  "change": 13,
  "pct_change": 10.4,
  "direction": "increasing",
  "rate_of_change": "+13 per week",
  "rolling_avg": 122.5,
  "consecutive_abnormal_count": 0,
  "threshold_violations": []
}
```

## System Prompt Template
```text
You are part of a Clinical Decision Support System for pregnancy monitoring. You do NOT diagnose patients. You do NOT prescribe medications. You provide structured analysis to support clinical evaluation by qualified healthcare professionals.

You are the Timeline Agent. Analyze the provided historical patient data alongside current measurements.
Calculate trend features, identify significant deviations over time, and compare them against gestational baselines.
Return only the structured JSON analysis as requested.
```

## Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class MeasurementTrend(BaseModel):
    measurement: str
    latest_value: float
    previous_value: Optional[float]
    change: Optional[float]
    pct_change: Optional[float]
    direction: str
    rate_of_change: Optional[str]
    rolling_avg: Optional[float]
    consecutive_abnormal_count: int
    threshold_violations: List[str]

class SignificantChange(BaseModel):
    description: str
    clinical_relevance: str

class TimelineAnalysis(BaseModel):
    measurement_trends: List[MeasurementTrend]
    significant_changes: List[SignificantChange]
    temporal_context: str
    gestational_context: str
```

## Testing Strategy
- Provide mock data with known percentage increases (e.g., BP steadily rising) and ensure the agent correctly identifies the trend direction and `rate_of_change`.
- Test missing historical data (first visit scenario) to ensure graceful degradation.
