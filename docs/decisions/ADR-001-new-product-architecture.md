# ADR-001: Pivot to Materna Longitudinal Pregnancy Monitoring

## Status: Accepted
## Date: 2026-08-17

## Context
The original product vision was a generic multi-agent clinical decision support platform designed for broad differential diagnosis across various medical fields. During early development, it became clear that this approach lacked focus and attempted to solve too many diverse medical problems simultaneously. A generic diagnostic tool faces immense regulatory hurdles, struggles to provide deep value in any specific specialty, and requires an overly complex agent architecture to handle the vast variance in medical data.

Conversely, pregnancy monitoring presents a concrete, high-impact use case with well-defined data patterns. It inherently requires longitudinal tracking and relies heavily on gestational-age-specific thresholds.

## Decision
We decided to pivot the product architecture from a generic medical AI platform to **Materna**, a focused AI-Powered Longitudinal Pregnancy Monitoring & Early-Warning System. The core operating principle is strictly defined as: DETECT → EXPLAIN → ESCALATE.

## Consequences

**Positive:**
- **Narrower Scope:** Enables deeper quality and higher accuracy within a specific medical domain.
- **Simplified Architecture:** Removes the need for complex, generic agents (like the previously planned 'Critic' and 'Judge' agents).
- **Clear Value Proposition:** Solves a specific problem (tracking maternal health over 40 weeks) with a clear target user base.
- **Manageable Risk:** Focuses on monitoring and early warning rather than broad diagnostic claims.

**Negative:**
- **Domain Expertise Required:** Necessitates acquiring specific obstetric domain expertise to define rules and evaluate the system.
- **Reduced Market Breadth:** The initial addressable market is narrowed to maternal health providers, though this is a necessary trade-off for MVP success.

## Alternatives Considered
- **Continuing with Generic Platform:** Rejected due to the high risk of producing a shallow tool that fails to meet the safety and specificity requirements of any single medical specialty.
- **Pivoting to Acute Care Triage:** Considered, but longitudinal tracking provides a better showcase for our specific AI capabilities and data modeling strengths.
