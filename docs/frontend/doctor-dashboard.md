# Materna Doctor Dashboard Specification

The Materna doctor-facing dashboard is designed to provide healthcare professionals with a clear, prioritized view of their patients' longitudinal pregnancy data. It emphasizes actionable insights, transparent AI explanations, and evidence-backed risk assessments.

## Screens

### 1. Dashboard (Home)
- **Summary Stats**: Total active patients, active pregnancies, high-priority count, and pending reviews.
- **Priority Queue**: 🔴 HIGH PRIORITY patients list, sorted by urgency and time since last alert.
- **Alerts**: Recent alerts requiring clinical review.
- **Overview**: Patients grouped by their current risk level.

### 2. Patient List
- **Table View**: Searchable and filterable table of all assigned patients.
- **Columns**: Patient Name, Gestational Week, Current Risk Level, Last Check-in Date, Last Assessment Date.
- **Filters**: Filter by risk level, trimester, alert status (pending review).
- **Sorting**: Sort by risk priority, name, or gestational week.

### 3. Patient Profile
- **Demographics & History**: Patient demographic information and relevant obstetric history.
- **Active Pregnancy**: Details of the current pregnancy (LMP, EDD, multiples, baseline vitals).
- **Risk Status**: Prominent color-coded indicator of the current risk level.
- **Quick Actions**: Buttons to Run Analysis, View Timeline, View Evidence, or Add Clinical Note.

### 4. Pregnancy Timeline
- **Visual Timeline**: A chronological view from LMP to EDD.
- **Plotted Events**: Visual markers for vitals logs, reported symptoms, lab results, system alerts, and past risk assessments.
- **Interactivity**: Clickable events that expand to show full details.
- **Trend Overlay**: Blood pressure or weight trend chart overlaid on the timeline.
- **Risk Bands**: Background color bands indicating periods of different risk levels throughout the pregnancy.

### 5. Risk Signals
- **Status Indicator**: Current risk level accompanied by a clear explanation.
- **Active Signals**: List of active risk signals categorized by severity.
- **Rule Traceability**: Rule IDs and descriptions that triggered the risk signals.
- **AI Explanation**: AI-generated summary of the clinical picture, clearly labeled as AI output.
- **Trending**: Indicators showing whether risk factors are worsening, stable, or improving.

### 6. Evidence
- **Evidence Cards**: Displays information retrieved via RAG supporting the current risk assessment.
  - Source title and publishing organization (e.g., ACOG, WHO).
  - Relevant section or page number.
  - Retrieved content excerpt.
  - Relevance score.
  - Direct link to the source document (if available).
- **Traceability**: Each piece of evidence must be clearly linked to a specific risk signal or AI explanation.

### 7. AI Explanation
- **Structured Display**: Output from the Triage Agent presented in a readable, structured format.
- **Key Factors**: Bulleted list of key clinical factors with checkmarks or warning icons.
- **Citations**: Inline citations linking back to the Evidence cards.
- **Safety Disclaimer**: A permanently visible CDSS disclaimer: *"This is an AI-generated analysis. Clinical judgment is required."*

### 8. Case Review
- **Alert Details**: Full context of the alert requiring review.
- **Review Form**: Input fields for the doctor's clinical notes and chosen action (Acknowledge, Schedule Follow-up, Refer to Specialist, Emergency Protocol).
- **History**: Log of past reviews and actions taken by the care team.

## Real-time Features
- **SSE Streaming**: Server-Sent Events used during active analysis to show agent activity cards (e.g., "Agent started", "Thinking", "Complete").
- **Live Updates**: Risk levels and new alerts update in real-time without page reloads.
- **Notifications**: Visual badges on the dashboard indicating new, unreviewed alerts.

## Core Components
- `DashboardStatsRow`: Displays high-level metrics and counts.
- `PriorityPatientList`: Specialized list view for high-priority cases requiring immediate attention.
- `PatientDataTable`: Comprehensive, filterable table component for managing the patient panel.
- `PatientProfileHeader`: Summary card with demographics and current pregnancy status.
- `LongitudinalTimeline`: Complex D3/Canvas component for visualizing events over the gestational period.
- `RiskSignalCard`: Displays individual risk factors, triggered rules, and severity.
- `EvidenceCitation`: Component for displaying retrieved medical guidelines and source excerpts.
- `AIExplanationBlock`: Styled container for displaying the Triage Agent's reasoning with safety disclaimers.
- `CaseReviewModal`: Form interface for doctors to log their review and decisions.
- `AgentActivityStream`: Real-time UI indicator showing the progress of background AI analysis.
