# Vitals API

Manage and retrieve vital sign measurements for pregnancies.

## Pydantic Models

```python
class VitalsCreate(BaseModel):
    gestational_week: int = Field(ge=1, le=42)
    systolic_bp: Optional[int] = Field(ge=60, le=250)
    diastolic_bp: Optional[int] = Field(ge=40, le=150)
    heart_rate: Optional[int] = Field(ge=40, le=200)
    temperature: Optional[float] = Field(ge=34.0, le=42.0)
    weight_kg: Optional[float] = Field(ge=30.0, le=200.0)
    fundal_height_cm: Optional[float]
    fetal_heart_rate: Optional[int] = Field(ge=80, le=200)
    edema_grade: Optional[int] = Field(ge=0, le=4)
    urine_protein: Optional[str]
```

---

## `POST /api/v1/pregnancies/{id}/vitals`
Record vital signs. Automatically triggers threshold checks for alerts.
**Auth**: `doctor`, `patient`

### Request Body
```json
{
  "gestational_week": 24,
  "systolic_bp": 140,
  "diastolic_bp": 90,
  "weight_kg": 75.5,
  "heart_rate": 88
}
```

### Response `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "v-101",
    "pregnancy_id": "preg-456",
    "gestational_week": 24,
    "systolic_bp": 140,
    "diastolic_bp": 90,
    "recorded_at": "2024-02-20T10:00:00Z"
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}/vitals`
Get vitals history sorted by gestational week.
**Query Parameters**: `from_week`, `to_week`, `measurement_type`, `page`, `page_size`
**Auth**: `doctor`, `patient` (own)

### Response `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "v-101",
      "gestational_week": 24,
      "systolic_bp": 140,
      "diastolic_bp": 90
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 12,
    "total_pages": 1
  },
  "error": null
}
```

---

## `GET /api/v1/pregnancies/{id}/vitals/latest`
Retrieve the single most recent vital signs record.
**Auth**: `doctor`, `patient` (own)

---

## `GET /api/v1/pregnancies/{id}/vitals/trends`
Get vital sign trends (features extracted for the risk engine).
**Auth**: `doctor`

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "blood_pressure": {
      "latest_systolic": 140,
      "previous_systolic": 130,
      "systolic_change": 10,
      "direction": "increasing",
      "is_abnormal": true
    },
    "weight": {
      "total_gain_kg": 12.5,
      "velocity_kg_per_week": 0.6
    }
  },
  "meta": null,
  "error": null
}
```
