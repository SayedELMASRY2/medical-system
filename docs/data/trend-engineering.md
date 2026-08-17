# Trend Feature Engineering

## MVP Trend Features
The risk engine converts raw data points into derived features representing trends over time.

- **Latest value**: The most recent measurement.
- **Previous value**: The measurement prior to the latest.
- **Change (delta)**: Absolute difference (Latest - Previous).
- **Percentage change**: `(Delta / Previous) * 100`.
- **Direction**: `increasing`, `decreasing`, or `stable`.
- **Rate of change**: Delta normalized per week (e.g., +2 mmHg/week).
- **Rolling average**: Mean of the last 3 measurements.
- **Number of consecutive abnormal measurements**: Count of sequential readings beyond normal thresholds.
- **Threshold violations count**: Total readings exceeding the limit.
- **Time since last normal reading**: Weeks elapsed since a non-anomalous result.

## Example: BP Data Analysis
Given the following sequence:
- Week 24: 118/74
- Week 27: 121/76
- Week 29: 128/81
- Week 30: 137/88
- Week 31: 143/91

**Derived Features at Week 31:**
- `upward_trend`: true
- `consecutive_increase`: 4
- `latest_threshold_violation`: true (assuming >140 is a threshold)
- `change_from_baseline`: +25 systolic, +17 diastolic (using Week 24 as baseline)
- `rate_of_change`: ~+3.6 systolic / +2.4 diastolic per week

## Feature Output Schema
```python
from pydantic import BaseModel

class TrendFeatureSet(BaseModel):
    upward_trend: bool
    consecutive_increase: int
    latest_threshold_violation: bool
    change_from_baseline: float
    rate_of_change: float
```

## Integration with Risk Engine
These trend features are stored in the `risk_assessments.trend_features` JSONB column. Clinical rules evaluate these specific keys (e.g., `IF consecutive_increase >= 3 AND latest > 140 THEN Trigger PreEclampsia Warning`).

**NOTE:** Do not overengineer for MVP. Keep window functions and time-series aggregations simple, relying on raw deltas and basic rolling averages.
