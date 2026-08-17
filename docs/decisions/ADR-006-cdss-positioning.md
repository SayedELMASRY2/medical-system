# ADR-006: Positioning as Clinical Decision Support System (CDSS)

## Status: Accepted
## Date: 2026-08-17

## Context
Developing AI for healthcare involves significant regulatory, ethical, and safety considerations. If Materna were positioned as a system that diagnoses patients or prescribes treatment autonomously, it would face extreme liability risks and require extensive clinical trials and regulatory clearance (e.g., FDA Class III) before deployment. Furthermore, current AI technology is not safe enough to replace human clinical judgment in complex obstetric scenarios.

## Decision
Materna will be strictly positioned, designed, and communicated as a **Clinical Decision Support System (CDSS)**. The system's mandate is limited to:
- **Detecting** anomalies based on established rules.
- **Explaining** findings using retrieved evidence.
- **Escalating** cases for human review.
The system will never make autonomous diagnoses or treatment decisions. The final medical decision always belongs to a qualified healthcare professional.

## Consequences

**Positive:**
- **Clear Safety Boundaries:** Establishes a safe operating paradigm for the AI components.
- **Reduced Liability:** Clarifies that the system is an assistive tool, reducing legal and regulatory exposure.
- **Faster Go-to-Market:** CDSS tools typically have a clearer and faster regulatory pathway compared to autonomous diagnostic medical devices.

**Negative:**
- **Communication Overhead:** Requires strict enforcement of language and disclaimers throughout the UI and documentation to ensure users understand the system's limitations.
- **Restricted Feature Set:** Prevents the implementation of features that might automatically alter a patient's care plan, even if technically feasible.

## Alternatives Considered
- **Autonomous Diagnostic System:** Rejected due to unacceptable patient safety risks, massive regulatory barriers, and high liability.
