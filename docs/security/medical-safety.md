# Medical Safety & Boundaries

Materna is designed with strict adherence to medical safety guidelines. This document defines the boundaries of the system, how it communicates risk, and how data is handled safely.

## System Classification
Materna is classified as a **Clinical Decision Support System (CDSS)**. It is an assistive tool, not an autonomous medical device.

## System Boundaries

### The system does NOT:
- Diagnose patients autonomously.
- Replace doctors or healthcare professionals.
- Prescribe medications or therapies.
- Provide emergency medical care or immediate triage instructions.
- Make treatment decisions or alter care plans.
- Determine pregnancy outcomes.

### The system DOES:
- Detect potentially concerning patterns in longitudinal pregnancy data.
- Provide evidence-grounded risk signals based on established guidelines.
- Explain why a specific pattern or data point was flagged.
- Recommend clinical evaluation when appropriate based on risk levels.
- Support timely clinical decision-making by surfacing relevant information.

## Risk Output Communication
How the system communicates risk is critical to its safety profile.
- Risk outputs are **signals for clinical review**, NOT diagnoses.
- **Prohibited Language**: The system must NEVER state "You have disease X" or "The patient has [condition]".
- **Approved Language**: The system SHOULD state "High-priority risk signal detected based on the following factors. Clinical evaluation is recommended."
- The final medical decision and diagnosis always belong to a qualified healthcare professional.

## UI Safety Requirements
To ensure users understand the system's role, the following disclaimers must be present:
- **Universal**: Every AI-generated output must include a clear CDSS disclaimer.
- **Patient-Facing Views**: Must prominently display: *"This information does not replace medical advice. Contact your healthcare provider for any concerns."*
- **Doctor-Facing Views**: Must prominently display: *"AI-generated analysis. Clinical judgment is required."*
- Risk levels (🟢🟡🟠🔴) must never be labeled or referred to as "diagnoses".

## Clinical Rule Sourcing
The deterministic risk engine relies on clinical rules.
- Every clinical rule used in the Risk Engine MUST have a documented source reference.
- Developers and prompt engineers must NOT create unsupported medical thresholds.
- Thresholds must be derived directly from published, recognized clinical guidelines (e.g., ACOG, WHO, NICE, FIGO).

## Data Safety & AI Usage
- **Training Restriction**: Patient data must NOT be used for training foundational models or fine-tuning without explicit, separate consent mechanisms (not included in MVP).
- **Prompt Sanitization**: LLM prompts must be constructed to minimize the inclusion of identifying patient information, passing only the clinical data necessary for the reasoning task.
- **Evidence Verification**: All evidence retrieved and presented by the RAG system must originate from verified, trusted medical sources.
