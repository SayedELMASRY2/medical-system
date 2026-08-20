# Risk Assessment Engine Overview

## Purpose
The Risk Assessment Engine evaluates deterministic clinical rules, thresholds, signal combinations, and trends to produce a structured risk level.
**Critical Principle:** This engine is completely separated from LLM reasoning. It uses standard Boolean logic, threshold checks, and predefined clinical state machines.

## Architecture Pipeline
1. **Patient Data**: Vitals, symptoms, labs.
2. **Validation**: Check for data anomalies or extreme out-of-bounds inputs.
3. **Normalization**: Align data to expected formats based on gestational age.
4. **Trend Analytics**: Incorporate features from the Timeline Agent.
5. **Clinical Rules**: Evaluate against the deterministic rule set.
6. **Risk Assessment Engine**: Compute the final aggregate score.
7. **Risk Level**: Output the deterministic level (e.g., `HIGH_PRIORITY`).
*(Only AFTER this pipeline completes does the LLM step in to explain the result).*

## Components
- `RuleEngine`: Executes individual boolean/threshold rules.
- `ThresholdEvaluator`: Compares vitals to gestational baselines.
- `TrendAnalyzer`: Evaluates longitudinal shifts (e.g., consecutive rising BP).
- `SignalCombiner`: Aggregates overlapping rules (e.g., BP + Symptom).
- `RiskClassifier`: Maps final signals to one of the 4 risk levels.

## Input / Output
**Input**: `PregnancyContext` + Current Vitals + Current Symptoms + Trend Features.

**Output**: `RiskAssessmentResult`
```json
{
  "risk_level": "HIGH_PRIORITY",
  "signals": [
    "elevated_blood_pressure",
    "increasing_bp_trend",
    "severe_headache",
    "visual_disturbance"
  ],
  "rule_ids": [
    "RULE_BP_001",
    "RULE_SYMPTOM_002"
  ],
  "confidence": 1.0
}
```

## Strict LLM Boundary
The LLM **MUST NOT** modify the raw rule result. It is strictly a consumer of the `RiskAssessmentResult`. It explains the "Why", but the Engine dictates the "What".

## Mermaid Architecture Diagram

```mermaid
graph TD
    Data[Patient Data Input] --> Norm[Normalization & Validation]
    Norm --> Trend[Trend Analytics]
    Trend --> Rules[Clinical Rule Engine]
    Norm --> Rules
    
    Rules --> Combine[Signal Combiner]
    Combine --> Classify[Risk Classifier]
    
    Classify --> Result[{RiskAssessmentResult}]
    Result --> LLM[LLM Triage Agent for Explanation]
    
    style Result fill:#ff9999,stroke:#333,stroke-width:2px
    style LLM fill:#99ccff,stroke:#333,stroke-width:2px
```
