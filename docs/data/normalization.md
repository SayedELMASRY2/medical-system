# Data Validation and Normalization

## Input Validation Rules

### Vitals
- **Systolic BP**: 70 - 250 mmHg
- **Diastolic BP**: 40 - 150 mmHg
- Systolic must be strictly greater than Diastolic.
- **Heart Rate**: 40 - 200 bpm
- **Temperature**: 35.0 - 41.0 C
- **Weight**: 35 - 200 kg

### Symptoms
Must match predefined `symptom_code` enumerations.
Severity levels restricted to `mild`, `moderate`, `severe`.

### Labs
Must match standard LOINC or internal `test_code` lists.

## Unit Normalization
All incoming data is coerced to a standard metric schema:
- Weight: pounds (lbs) converted to kilograms (kg)
- Temperature: Fahrenheit (F) converted to Celsius (C)

## Gestational Week Validation
Calculated dynamically based on LMP/EDD but validated to fall within `0 - 42` weeks. Entries outside this range are rejected or flagged for manual review.

## Missing Data Handling
Missing values are represented as `null`. Imputation algorithms (e.g., last observation carried forward) are strictly contained within the feature engineering layer, ensuring raw data remains untouched.

## Data Quality Scoring
A confidence score is applied to risk inputs based on data completeness and source (e.g., doctor-measured BP vs. home-measured BP).

## Pydantic Validation Models
The API layer relies on Pydantic to enforce these constraints strictly before any data reaches PostgreSQL.
```python
from pydantic import BaseModel, Field

class VitalSignCreate(BaseModel):
    systolic_bp: int = Field(..., ge=70, le=250)
    diastolic_bp: int = Field(..., ge=40, le=150)
    # further validations
```
