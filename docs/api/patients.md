# Patients API

Manage patient records in the Materna system.

## Pydantic Models

```python
class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date
    blood_type: str
    rh_factor: str
    gravidity: int
    parity: int
    medical_history: Optional[List[str]] = []
    allergies: Optional[List[str]] = []

class PatientUpdate(BaseModel):
    full_name: Optional[str]
    blood_type: Optional[str]
    rh_factor: Optional[str]
    gravidity: Optional[int]
    parity: Optional[int]
    medical_history: Optional[List[str]]
    allergies: Optional[List[str]]

class PatientResponse(PatientCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime
```

---

## `POST /api/v1/patients`
Create a new patient record.
**Auth**: `doctor`, `admin`

### Request Body
```json
{
  "full_name": "Jane Doe",
  "date_of_birth": "1990-05-15",
  "blood_type": "O",
  "rh_factor": "positive",
  "gravidity": 2,
  "parity": 1,
  "medical_history": ["asthma"],
  "allergies": ["penicillin"]
}
```

### Response `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "p-123",
    "full_name": "Jane Doe",
    "date_of_birth": "1990-05-15",
    "blood_type": "O",
    "rh_factor": "positive",
    "gravidity": 2,
    "parity": 1,
    "medical_history": ["asthma"],
    "allergies": ["penicillin"],
    "created_at": "2023-10-15T08:30:00Z"
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/patients`
List patients.
**Auth**: `doctor` (own patients), `admin` (all)
**Query Parameters**: `search`, `page`, `page_size`, `sort_by`

### Response `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "p-123",
      "full_name": "Jane Doe",
      "date_of_birth": "1990-05-15"
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 1,
    "total_pages": 1
  },
  "error": null
}
```

---

## `GET /api/v1/patients/{id}`
Get detailed patient information including active pregnancies.
**Auth**: `doctor` (own), `patient` (self), `admin`

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "patient": {
      "id": "p-123",
      "full_name": "Jane Doe",
      "blood_type": "O",
      "rh_factor": "positive",
      "gravidity": 2,
      "parity": 1
    },
    "active_pregnancies": [
      {
        "id": "preg-456",
        "estimated_due_date": "2024-06-20",
        "current_week": 24
      }
    ]
  },
  "meta": null,
  "error": null
}
```

---

## `PATCH /api/v1/patients/{id}`
Update patient information.
**Auth**: `doctor`, `admin`

### Request Body
```json
{
  "allergies": ["penicillin", "latex"]
}
```

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "p-123",
    "allergies": ["penicillin", "latex"]
  },
  "meta": null,
  "error": null
}
```

---

## `DELETE /api/v1/patients/{id}`
Soft delete a patient record.
**Auth**: `admin`

### Response `204 No Content`
*(Empty Body)*
