# Risk Assessment & Doctor Dashboard API

Access AI-generated risk analyses, alerts, and doctor dashboards.

## Risk Levels
- `low`: Normal pregnancy progression.
- `moderate`: Elevated risk signals detected. Requires monitoring.
- `high`: Critical risk detected. Requires immediate medical intervention.

## Pydantic Models

```python
class DoctorReviewCreate(BaseModel):
    alert_id: UUID
    review_notes: str
    action_taken: str = Field(pattern="^(acknowledged|scheduled_followup|referred|emergency)$")
```

---

## `GET /api/v1/pregnancies/{id}/risk`
Get the current risk status and latest assessment summary.
**Auth**: `doctor`, `patient` (own, simplified view)

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "risk_level": "high",
    "active_signals": 2,
    "assessment_date": "2024-02-20T10:10:00Z",
    "summary": "Patient exhibits new-onset hypertension with concurrent headaches.",
    "recommendation": "Schedule urgent follow-up for preeclampsia workup."
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}/risk/history`
Get historical risk assessments.
**Auth**: `doctor`

---

## `GET /api/v1/pregnancies/{id}/risk/signals`
List specific risk signals currently active.
**Auth**: `doctor`

### Response `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "signal_code": "NEW_ONSET_HTN",
      "description": "Systolic BP > 140 at 24 weeks.",
      "severity": "high",
      "rule_id": "rule-pe-01"
    }
  ],
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}/alerts`
List alerts for a pregnancy.
**Query Parameters**: `is_acknowledged` (boolean), `priority` (low/medium/high), `page`, `page_size`
**Auth**: `doctor`

---

## `PATCH /api/v1/alerts/{id}/acknowledge`
Acknowledge a specific alert.
**Auth**: `doctor`

---

## `POST /api/v1/doctor/reviews`
Submit a doctor's review and action for an alert/risk.
**Auth**: `doctor`

### Request Body
```json
{
  "alert_id": "alt-888",
  "review_notes": "Patient advised to go to L&D triage.",
  "action_taken": "emergency"
}
```

---

## `GET /api/v1/doctor/dashboard`
Get aggregated statistics and urgent tasks for the doctor's dashboard.
**Auth**: `doctor`

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "total_patients": 45,
    "high_risk_patients": 3,
    "unacknowledged_alerts": 5,
    "recent_alerts": [
      {
        "alert_id": "alt-888",
        "patient_name": "Jane Doe",
        "priority": "high",
        "message": "Possible preeclampsia"
      }
    ]
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/doctor/patients`
List doctor's patients with current risk overview.
**Auth**: `doctor`
