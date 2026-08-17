# Symptoms API

Track patient-reported and doctor-observed symptoms.

## Reference: Symptom Codes
- `headache`
- `visual_disturbance`
- `leg_swelling`
- `abdominal_pain`
- `vaginal_bleeding`
- `decreased_fetal_movement`
- `nausea`
- `dizziness`
- `chest_pain`
- `shortness_of_breath`

## Pydantic Models

```python
class SymptomItem(BaseModel):
    symptom_code: str
    description: Optional[str]
    severity: str = Field(pattern="^(mild|moderate|severe)$")
    duration: Optional[str]

class SymptomsCreate(BaseModel):
    gestational_week: int = Field(ge=1, le=42)
    symptoms: List[SymptomItem]
```

---

## `POST /api/v1/pregnancies/{id}/symptoms`
Record new symptoms.
**Auth**: `doctor`, `patient`

### Request Body
```json
{
  "gestational_week": 24,
  "symptoms": [
    {
      "symptom_code": "headache",
      "severity": "moderate",
      "duration": "2 days",
      "description": "Frontal headache not relieved by Tylenol"
    },
    {
      "symptom_code": "visual_disturbance",
      "severity": "mild",
      "duration": "1 hour"
    }
  ]
}
```

### Response `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "sym-group-202",
    "pregnancy_id": "preg-456",
    "gestational_week": 24,
    "symptoms": [
      {
        "symptom_code": "headache",
        "severity": "moderate"
      }
    ],
    "reported_at": "2024-02-20T11:00:00Z"
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}/symptoms`
Retrieve symptom history.
**Query Parameters**: `from_week`, `to_week`, `severity`, `page`, `page_size`
**Auth**: `doctor`, `patient` (own)

### Response `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "gestational_week": 24,
      "symptom_code": "headache",
      "severity": "moderate",
      "reported_at": "2024-02-20T11:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 5,
    "total_pages": 1
  },
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}/symptoms/latest`
Retrieve the most recently reported symptoms.
**Auth**: `doctor`, `patient` (own)
