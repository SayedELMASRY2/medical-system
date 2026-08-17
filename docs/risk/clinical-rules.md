# Clinical Rules Specification

## Rule Format
All deterministic rules follow a strict schema:
`{rule_id, rule_name, conditions, output_severity, source_reference}`

## MVP Clinical Rules
Every rule implemented in the Risk Engine must have a documented clinical source.

### Blood Pressure Rules
- **`RULE_BP_001`**: Elevated BP (Systolic ≥ 140 OR Diastolic ≥ 90) → `warning`
- **`RULE_BP_002`**: Severe hypertension (Systolic ≥ 160 OR Diastolic ≥ 110) → `critical`
- **`RULE_BP_003`**: Rising BP trend (consecutive increases over 3+ measurements) → `warning`

### Symptom Rules
- **`RULE_SYMPTOM_001`**: Severe headache + Elevated BP → `critical`
- **`RULE_SYMPTOM_002`**: Visual disturbance + Elevated BP → `critical`
- **`RULE_SYMPTOM_003`**: Significant edema + Elevated BP + Headache → `critical`
- **`RULE_SYMPTOM_004`**: Vaginal bleeding in 2nd/3rd trimester → `critical`
- **`RULE_SYMPTOM_005`**: Decreased fetal movement → `warning`
- **`RULE_SYMPTOM_006`**: Severe abdominal pain → `warning`

### Lab Rules
- **`RULE_LAB_001`**: Proteinuria + Elevated BP → `critical` (Preeclampsia indicator)
- **`RULE_LAB_002`**: Abnormal glucose tolerance → `warning` (GDM indicator)

### Combination / Trend Rules
- **`RULE_COMBO_001`**: ≥3 `warning` signals simultaneously → escalate to `critical`
- **`RULE_TREND_001`**: Any measurement with ≥4 consecutive abnormal readings → `warning`

## Rule Evaluation Logic
The engine evaluates rules using boolean logic (AND/OR). It iterates through the dataset and collects a list of all triggered rules. 
- Combination rules (like `RULE_COMBO_001`) run in a secondary pass after the primary rules trigger.

## Source References
All thresholds must map to authoritative guidelines:
- BP Thresholds: ACOG Practice Bulletin No. 222
- Decreased fetal movement: WHO / ACOG guidelines
- Bleeding: ACOG Practice Bulletin No. 64

## Adding New Rules
1. Propose the rule logic.
2. Provide the clinical citation.
3. Add the rule to the JSON rule registry.
4. Write a unit test ensuring the exact condition triggers the expected severity.

## Testing Strategy
- Unit test each rule individually with boundary conditions (e.g., exactly 139/89 vs 140/90).
- Test combination logic to ensure multiple warnings correctly escalate to critical.
