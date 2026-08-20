# Medical RAG Agent Specification

## Purpose
The Medical RAG (Retrieval-Augmented Generation) Agent retrieves highly relevant, verified medical evidence to contextualize the patient's risk signals. It ensures that the Triage Agent's explanations are grounded in authoritative obstetric guidelines.

## Model Configuration
- **Model**: `GPT-4o-mini` (used solely for search query formulation and result parsing)
- **Temperature**: `0.1` (strict adherence to search intent and extraction)

## Input
- Current risk signals (identified by the Risk Engine)
- Clinical context (gestational week, patient history)

## Processing Logic
1. **Analyze Signals**: Review the risk signals and clinical context to understand the medical concept in question.
2. **Formulate Queries**: Generate optimized search queries (expanding medical terminology if necessary).
3. **Execute Retrieval**: Trigger the external hybrid retrieval pipeline (Vector + BM25).
4. **Rerank Results**: Utilize cross-encoder reranking to surface the most relevant chunks.
5. **Select Evidence**: Pick the top-k most relevant evidence items.
6. **Preserve Citation Chain**: Ensure exact sourcing (document, section, page) is maintained.

## Output
An `EvidenceCollection` containing distinct `EvidenceItem` objects. Each item strictly tracks provenance.

## Knowledge Sources
The RAG pipeline is restricted to processing verified clinical guidelines:
- WHO (World Health Organization) Maternal Health Guidelines
- ACOG (American College of Obstetricians and Gynecologists) Practice Bulletins
- NICE (National Institute for Health and Care Excellence) Antenatal Care Guidelines
- FIGO (International Federation of Gynecology and Obstetrics) Publications
- SMFM (Society for Maternal-Fetal Medicine) Guidelines

## 🛑 MUST NEVER 🛑
- Generate fake or "hallucinated" citations.
- Paraphrase source text in a way that alters the clinical meaning.
- Make independent risk decisions based on the text.
- Reference external knowledge not present in the retrieved context.

## System Prompt Template
```text
You are part of a Clinical Decision Support System for pregnancy monitoring. You do NOT diagnose patients. You do NOT prescribe medications. You provide structured analysis to support clinical evaluation by qualified healthcare professionals.

You are the Medical RAG Agent. Given the current clinical context, formulate precise queries to retrieve relevant medical guidelines.
Once retrieved, extract the exact evidence snippets that apply to the context. You MUST preserve the exact citation metadata provided by the retrieval engine. Do not invent citations.
```

## Pydantic Models

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class EvidenceQuery(BaseModel):
    query_string: str = Field(description="The formulated search query")
    clinical_focus: str = Field(description="The primary clinical concept being searched")

class EvidenceItem(BaseModel):
    source_id: str
    document_title: str
    organization: str
    section: str
    page: Optional[int]
    chunk_id: str
    retrieved_content: str
    relevance_score: float
    source_url: Optional[str]

class EvidenceCollection(BaseModel):
    queries_executed: List[EvidenceQuery]
    evidence_items: List[EvidenceItem]
```

## Testing Strategy
- **Hallucination Tests**: Force the RAG Agent to search for non-existent conditions and verify it returns an empty evidence list rather than hallucinating.
- **Citation Preservation**: Ensure that the output `EvidenceItem` perfectly matches the metadata of the raw chunk retrieved from the database.
