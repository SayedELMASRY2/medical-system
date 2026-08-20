# Materna Patient Application Specification

The Materna patient-facing application is designed to be a reassuring, easy-to-use interface for pregnant women to log their daily symptoms, vitals, and track their pregnancy journey. It prioritizes clarity, accessibility, and safe communication of potential risks.

## Screens

### 1. Onboarding
- **Welcome**: A warm greeting explaining the purpose of the app.
- **Basic Profile Setup**: Name, age, and contact information.
- **Pregnancy Information**:
  - Last Menstrual Period (LMP) or Estimated Due Date (EDD).
  - First pregnancy indicator.
  - Multiples indicator (twins, triplets, etc.).
  - Pre-existing conditions (e.g., chronic hypertension, diabetes).

### 2. Pregnancy Profile
- **Current Status**: Displays the current gestational week and a trimester indicator.
- **Milestones**: Estimated due date and key pregnancy details.
- **Care Team**: Information about the assigned doctor or clinic.

### 3. Daily Check-In
A guided symptom reporting form designed to be quick and comprehensive.
- **General Well-being**: "How are you feeling today?" (Good / Okay / Not Well).
- **Symptom Checklist**: Includes headache, visual changes, swelling, abdominal pain, bleeding, decreased baby movement, nausea, dizziness, chest pain, shortness of breath.
- **Details**:
  - Severity selector (Mild / Moderate / Severe).
  - Duration input (e.g., hours, days).
  - Optional free-text notes for additional context.

### 4. Vital Signs Entry
- **Inputs**: Simple, validated input fields for:
  - Blood pressure (systolic/diastolic).
  - Heart rate.
  - Temperature.
  - Weight.
- **Feedback**: Inline historical comparison to show recent trends.

### 5. Risk Status
- **Indicator**: Current risk level with a prominent color-coded indicator (🟢 Low, 🟡 Monitor, 🟠 Clinical Review, 🔴 High Priority).
- **Explanation**: Plain-language explanation of the current status (e.g., "Your blood pressure is slightly elevated"). Patient sees a simplified version without full clinical jargon.
- **Actions**: Recommended next steps based on the risk level.
- **Alert**: 🔴 HIGH PRIORITY status shows a prominent message: "Please contact your healthcare provider immediately."
- **Timestamp**: Date and time of the last assessment.

### 6. History
- **Timeline View**: Chronological view of past check-ins.
- **Trends**: Simple charts showing vitals over time (e.g., weight gain, blood pressure).
- **Log**: Symptom history and risk level changes.

## Design Principles
- **Mobile-first**: Responsive design optimized for smartphone usage.
- **Reassuring Language**: Clear, empathetic, and non-clinical jargon to avoid unnecessary anxiety.
- **Accessibility**: Adherence to WCAG 2.1 AA standards for contrast, tap targets, and screen reader support.
- **Navigation**: Simple bottom tab bar (Home, Check-In, History, Profile).
- **Consistent Indicators**: Risk colors (🟢🟡🟠🔴) used consistently throughout the app.

## Optional WOW Feature: Voice Input (MVP Stretch Goal)
Support for voice input in Egyptian Arabic to log symptoms naturally.
- **User Action**: User speaks into the app (e.g., "رجلي منفخة جامد من امبارح").
- **Pipeline**:
  1. Speech-to-Text conversion.
  2. Symptom Extraction via LLM.
  3. Mapping to Structured Medical Event.
- **Output**: JSON representation `{"symptom": "leg_swelling", "severity": "severe", "duration": "1 day"}` used to auto-fill the check-in form.

## Core Components
- `OnboardingFlow`: Manages the step-by-step initial data collection.
- `GestationalProgress`: Visual component showing current week and trimester.
- `DailyCheckInForm`: The multi-step form for reporting symptoms and vitals.
- `SeveritySelector`: UI control for selecting mild/moderate/severe.
- `VitalSignInput`: Specialized numerical input with validation and historical trend sparkline.
- `RiskStatusCard`: Displays the current risk level, explanation, and action items.
- `HistoryTimeline`: Renders the chronological list of past events and logged data.
- `TrendChart`: Simple line chart component for visualizing vital trends.
