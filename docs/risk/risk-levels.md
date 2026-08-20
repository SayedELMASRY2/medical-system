# Risk Stratification Model

## Overview
The Materna Risk Engine classifies patient status into one of 4 discrete risk levels. These levels dictate the UI presentation and the automated escalation logic.

**IMPORTANT:** These are risk signals and prioritization categories, **NOT** clinical diagnoses.

## The 4 Risk Levels

### 🟢 LOW / STABLE
- **Criteria**: No concerning signals. All vitals and measurements are within normal gestational ranges. No active clinical rules triggered.
- **Action**: Routine care continues.

### 🟡 MONITOR
- **Criteria**: Potentially concerning pattern. 1 to 2 `warning`-level signals triggered (e.g., single slightly elevated BP, or isolated decreased fetal movement).
- **Action**: Recommend increased monitoring frequency (e.g., check BP again in 4 hours).

### 🟠 CLINICAL REVIEW
- **Criteria**: Pattern should be reviewed by a healthcare professional. Triggered by multiple `warning` signals, OR a single `critical` signal that has documented mitigating factors in the patient history.
- **Action**: Flag for doctor review in the next available window.

### 🔴 HIGH PRIORITY
- **Criteria**: Potentially urgent risk signal. One or more `critical` signals triggered (e.g., BP > 160/110, or BP > 140/90 + severe headache).
- **Action**: Requires prompt clinical evaluation. Immediate alert to assigned healthcare provider.

## Determination Algorithm (Rules-based)
1. Engine collects all triggered rule severities.
2. If `critical` > 0 -> `HIGH_PRIORITY`.
3. If `warning` > 2 -> `CLINICAL_REVIEW` (via `RULE_COMBO_001`).
4. If `warning` > 0 -> `MONITOR`.
5. Else -> `LOW / STABLE`.

## Transitions & History
The system tracks state transitions. A shift from `LOW` to `HIGH_PRIORITY` generates a specific type of delta alert compared to a patient who has been hovering in `CLINICAL_REVIEW` for weeks.

## UI Display Guidelines
- **LOW**: Green color palette, default dashboard view.
- **MONITOR**: Yellow color palette, highlighted cards for the specific out-of-bound vitals.
- **CLINICAL REVIEW**: Orange palette, persistent notification badge.
- **HIGH PRIORITY**: Red color palette, modal popup on the provider dashboard, immediate SMS/Push escalation.
