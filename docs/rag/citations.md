# Citation Traceability

## Overview
In a clinical setting, trust is built on traceability. Every piece of medical evidence retrieved by the RAG system and utilized by the Triage Agent MUST preserve an unbroken citation chain back to the source document.

## Preserved Metadata
Every evidence item must retain the following fields:
- `source_id`: Unique identifier for the document.
- `document_title`: Full title (e.g., "ACOG Practice Bulletin No. 222").
- `organization`: Authoring body (e.g., ACOG, WHO).
- `section`: The document section from which the chunk was extracted.
- `page`: Page number (if available from PDF extraction).
- `chunk_id`: Unique DB identifier for the exact text block.
- `retrieved_content`: The raw text used by the LLM.
- `relevance_score`: Final reranking score.
- `source_url`: URL linking to the original document (if applicable).

## Citation Chain
1. **Source Document** ingested and metadata mapped.
2. Document split into **Sections**.
3. Sections split into **Chunks** (`chunk_id`).
4. **Retrieved Passage** matched to Query.
5. Bound into an **Evidence Item**.
6. Referenced in the **Risk Explanation** by the Triage Agent.

## 🛑 Strict Citation Rules
- **NEVER generate fake citations.** The system must strictly output only metadata associated with retrieved chunks.
- If no evidence passes the relevance threshold, the Triage Agent must state: "No specific guideline reference matched the current signals."

## Citation Validation
A post-generation validation check ensures that any citation index (e.g., `[1]`) used by the Triage Agent in its text corresponds exactly to an `EvidenceItem` in the `EvidenceCollection`.

## Display Format
On the frontend UI, citations should be formatted cleanly:
*"{Organization} - {Document_Title}, Section: {Section}, Page: {Page}"*

## Pydantic Models

```python
from pydantic import BaseModel
from typing import Optional, List

class Citation(BaseModel):
    citation_index: int
    organization: str
    document_title: str
    section: str
    page: Optional[int]
    url: Optional[str]

class CitationChain(BaseModel):
    citations: List[Citation]
```
