# Evidence & Knowledge API

Manage and retrieve medical guidelines and evidence used by the AI engine.

## Pydantic Models

```python
class EvidenceItem(BaseModel):
    source_title: str
    organization: str
    section: str
    retrieved_content: str
    relevance_score: float
    source_url: Optional[str]
```

---

## `GET /api/v1/pregnancies/{id}/evidence`
Get the clinical evidence retrieved to support the latest risk assessment for a pregnancy.
**Auth**: `doctor`

### Response `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "source_title": "ACOG Practice Bulletin 222: Gestational Hypertension and Preeclampsia",
      "organization": "ACOG",
      "section": "Diagnosis",
      "retrieved_content": "Preeclampsia is diagnosed when systolic BP >= 140 or diastolic >= 90 on two occasions at least 4 hours apart...",
      "relevance_score": 0.95,
      "source_url": "https://www.acog.org/..."
    }
  ],
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/evidence/search`
Search the RAG (Retrieval-Augmented Generation) vector database of medical evidence manually.
**Query Parameters**: `q` (string), `topic` (string), `organization` (string), `limit` (int, default: 5)
**Auth**: `doctor`

### Response `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "source_title": "ACOG Bulletin...",
      "retrieved_content": "...",
      "relevance_score": 0.88
    }
  ],
  "meta": null,
  "error": null
}
```

---

## `POST /api/v1/knowledge/documents`
Ingest a new clinical guideline document into the vector DB. 
Triggers the ingestion pipeline: text extraction → cleaning → chunking → embedding → indexing.
**Auth**: `admin`
**Request Type**: `multipart/form-data`

### Form Fields
- `file`: PDF or Text file
- `title`: "ACOG Practice Bulletin 222"
- `organization`: "ACOG"
- `document_type`: "guideline"
- `source_url`: "https://..."

### Response `202 Accepted`
```json
{
  "status": "success",
  "data": {
    "document_id": "doc-555",
    "status": "processing",
    "message": "Document ingestion started."
  },
  "meta": null,
  "error": null
}
```

---

## `GET /api/v1/knowledge/documents`
List all ingested knowledge documents.
**Auth**: `doctor`, `admin`

---

## `GET /api/v1/knowledge/documents/{id}`
Get details for a specific ingested document, including processing status and chunk counts.
**Auth**: `doctor`, `admin`

### Response `200 OK`
```json
{
  "status": "success",
  "data": {
    "id": "doc-555",
    "title": "ACOG Practice Bulletin 222",
    "organization": "ACOG",
    "status": "indexed",
    "chunks_created": 45,
    "ingested_at": "2024-01-10T14:00:00Z"
  },
  "meta": null,
  "error": null
}
```
