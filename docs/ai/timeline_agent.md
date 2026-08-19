# 🕒 Agent 0: Timeline Agent

The Timeline Agent is the crucial entry point to the AI system in the Materna CDSS. It operates *before* any intent routing or medical retrieval takes place.

## Core Responsibility
To aggregate, synthesize, and extract longitudinal clinical trends from a patient's raw medical history, forming a complete context for the rest of the agents.

## Input Context
1. Current User Message (e.g. "I have a headache")
2. Current Vitals (e.g. BP 130/80, Weight 65kg)
3. Longitudinal History (Previous BP, Weight, Lab results over weeks/months)
4. Patient Profile (Gestational age, baseline vitals, chronic conditions)

## Output Payload
It outputs a strongly-typed `TimelineContext` Pydantic model:
```json
{
  "patient_context_summary": "A 28yo G1P0 at 24 weeks gestation with baseline BP 110/70. Currently presenting with mild headache.",
  "trends": [
    {
      "metric": "systolic_bp",
      "delta_previous": 20,
      "rate_of_change_per_week": 5,
      "is_accelerating": true,
      "baseline_value": 110
    }
  ],
  "active_conditions": ["mild_headache", "rising_bp"],
  "recent_symptoms": ["headache"],
  "missing_critical_data": ["proteinuria_status"]
}
```

## Architectural Position
* **Runs First:** Always runs immediately when a new chat or vital sign is logged.
* **Does NOT Diagnose:** It only summarizes the past. It never tells the patient what to do.
* **Database Persisted:** The `patient_context_summary` is saved to the DB as `clinical_trend_summary` so the Doctor Dashboard can view the AI's longitudinal summary.
