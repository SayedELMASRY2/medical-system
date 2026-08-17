# Pregnancy API

Manage pregnancies, track progress, and trigger AI analysis.

## Pydantic Models

```python
class PregnancyCreate(BaseModel):
    patient_id: UUID
    lmp_date: date
    is_multiple: bool = False
    chronic_conditions: Optional[List[str]] = []
    notes: Optional[str]

class PregnancyUpdate(BaseModel):
    status: Optional[str]
    risk_level: Optional[str]
    notes: Optional[str]
    chronic_conditions: Optional[List[str]]
```

---

## `POST /api/v1/pregnancies`
Create a new pregnancy record. Auto-calculates EDD (LMP + 280 days).
**Auth**: `doctor`

### Request Body
```json
{
  "patient_id": "p-123",
  "lmp_date": "2023-09-14",
  "is_multiple": false,
  "chronic_conditions": ["hypertension"]
}
```

### Response `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "preg-456",
    "patient_id": "p-123",
    "lmp_date": "2023-09-14",
    "estimated_due_date": "2024-06-20",
    "status": "active",
    "is_multiple": false,
    "chronic_conditions": ["hypertension"],
    "created_at": "2023-11-01T10:00:00Z"
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}`
Get pregnancy details, current gestational week, and latest clinical data.
**Auth**: `doctor`, `patient` (own)

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "preg-456",
    "patient_id": "p-123",
    "estimated_due_date": "2024-06-20",
    "current_gestational_week": 24,
    "current_risk_level": "moderate",
    "latest_vitals": {
      "blood_pressure": "135/85",
      "date": "2024-02-15T09:00:00Z"
    },
    "latest_symptoms": [
      {"code": "headache", "severity": "mild"}
    ]
  },
  "meta": null,
  "error": null
}
```

---

## `PATCH /api/v1/pregnancies/{id}`
Update pregnancy information.
**Auth**: `doctor`

---

## `GET /api/v1/patients/{patient_id}/pregnancies`
List a patient's pregnancies.
**Query Parameters**: `status` (active/delivered/terminated), `page`, `page_size`
**Auth**: `doctor`, `patient` (own)

---

## `POST /api/v1/pregnancies/{id}/analyze`
Trigger the full AI risk analysis pipeline (timeline → trends → rules → risk engine → agents → evidence → explanation).
**Auth**: `doctor`

### Response `202 Accepted`
```json
{
  "status": "success",
  "data": {
    "analysis_id": "an-789",
    "status": "pending",
    "message": "Analysis pipeline initiated."
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}/analyze/stream`
Server-Sent Events (SSE) endpoint to stream ongoing analysis status.
**Auth**: `doctor`

### SSE Events Streamed
- `analysis_started`
- `agent_started`
- `agent_thinking`
- `evidence_retrieved`
- `risk_determined`
- `explanation_ready`
- `agent_complete`
- `analysis_complete`

**Example Event**:
```text
event: agent_thinking
data: {"agent": "ClinicalRules", "message": "Evaluating BP trends...", "timestamp": "2024-02-20T10:05:02Z"}
```
