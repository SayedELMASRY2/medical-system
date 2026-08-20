import hashlib
import json
import re
import time
from typing import Any, Optional

from rag.config import (
    COHERE_API_KEY,
    COHERE_EMBED_MODEL,
    COHERE_RERANK_MODEL,
    COHERE_INPUT_TYPE_QUERY,
    EMBEDDING_DIMENSION,
    QDRANT_URL,
    QDRANT_API_KEY,
    COLLECTION_NAME,
    DENSE_VECTOR_NAME,
    SPARSE_VECTOR_NAME,
    PREFETCH_LIMIT,
    FINAL_LIMIT,
    RERANK_CANDIDATE_K,
    RERANK_TOP_K,
    RERANK_MAX_TOKENS_PER_DOC,
    QDRANT_REQUEST_TIMEOUT,
)
from rag.schemas import Citation, RetrievalResult

NON_CLINICAL_SECTION_TITLES = {"references", "assessments", "key terms"}
NON_CLINICAL_CHAPTER_TITLES = {"answer key", "index", "glossary", "bibliography"}


def normalize_title(value: Any) -> str:
    val = str(value or "").lower().strip()
    val = re.sub(r"[^a-z0-9\s.\-]", " ", val)
    return re.sub(r"\s+", " ", val).strip()


def is_non_clinical(payload: dict[str, Any]) -> bool:
    section = normalize_title(payload.get("section_title") or payload.get("section"))
    chapter = normalize_title(payload.get("chapter_title") or payload.get("chapter"))
    return section in NON_CLINICAL_SECTION_TITLES or chapter in NON_CLINICAL_CHAPTER_TITLES


def filter_non_clinical(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [item for item in items if not is_non_clinical(item.get("payload") or {})]


def detect_query_mode(query: str) -> str:
    q = query.lower().strip()
    if re.search(r"\b(difference|differences|compare|comparison|versus|vs|distinguish)\b", q):
        return "comparison"
    if re.search(r"\bnon[-\s]?severe\b", q):
        return "explicit_non_severe"
    if re.search(r"\bsevere\b", q):
        return "explicit_severe"
    if any(x in q for x in ("routine antenatal", "antenatal care", "prenatal care", "anc")):
        return "recommendation"
    if any(x in q for x in ("monitor", "monitoring", "self-monitor", "blood pressure")):
        return "monitoring"
    return "general"


def intent_adjustment(item: dict[str, Any], query: str) -> float:
    payload = item.get("payload") or {}
    text = str(payload.get("text") or payload.get("content") or "").lower()
    section = normalize_title(payload.get("section_title") or payload.get("section"))
    q = query.lower().strip()
    bonus = 1.0

    if "hypertension" in q:
        if "pregnancy" in section or "preeclampsia" in text or "hypertension" in text:
            bonus *= 1.10

    if any(term in q for term in ("routine", "antenatal", "prenatal")):
        if any(term in text for term in ("prenatal", "antenatal", "care", "visit")):
            bonus *= 1.08

    return min(1.15, max(0.85, bonus))


class MedicalRAGRetriever:

    def __init__(self):
        self._qdrant = None
        self._cohere = None

    @property
    def qdrant(self):
        if self._qdrant is None:
            from qdrant_client import QdrantClient
            if not QDRANT_URL or not QDRANT_API_KEY:
                raise RuntimeError("QDRANT_URL and QDRANT_API_KEY must be configured.")
            self._qdrant = QdrantClient(
                url=QDRANT_URL,
                api_key=QDRANT_API_KEY,
                timeout=QDRANT_REQUEST_TIMEOUT,
            )
        return self._qdrant

    @property
    def cohere(self):
        if self._cohere is None:
            import cohere
            if not COHERE_API_KEY:
                raise RuntimeError("COHERE_API_KEY must be configured.")
            self._cohere = cohere.ClientV2(api_key=COHERE_API_KEY)
        return self._cohere

    def embed_query(self, query: str) -> list[float]:
        response = self.cohere.embed(
            texts=[query],
            model=COHERE_EMBED_MODEL,
            input_type=COHERE_INPUT_TYPE_QUERY,
            embedding_types=["float"],
            output_dimension=EMBEDDING_DIMENSION,
        )
        embeddings = getattr(response.embeddings, "float_", None)
        if not embeddings:
            raise RuntimeError("Cohere returned no query embedding.")
        vector = [float(x) for x in embeddings[0]]
        if len(vector) != EMBEDDING_DIMENSION:
            raise RuntimeError(f"Expected {EMBEDDING_DIMENSION}D, got {len(vector)}D")
        return vector

    def hybrid_search(self, query: str, limit: int = RERANK_CANDIDATE_K) -> list[dict]:
        from qdrant_client import models

        query_vector = self.embed_query(query)

        results = self.qdrant.query_points(
            collection_name=COLLECTION_NAME,
            prefetch=[
                models.Prefetch(
                    query=query_vector,
                    using=DENSE_VECTOR_NAME,
                    limit=PREFETCH_LIMIT,
                ),
                models.Prefetch(
                    query=models.SparseVector(indices=[], values=[]),
                    using=SPARSE_VECTOR_NAME,
                    limit=PREFETCH_LIMIT,
                ),
            ],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=limit,
            with_payload=True,
            timeout=QDRANT_REQUEST_TIMEOUT,
        )

        candidates = []
        for point in results.points:
            payload = point.payload or {}
            candidates.append({
                "id": str(point.id),
                "score": point.score,
                "payload": payload,
            })

        return candidates

    def rerank(self, query: str, candidates: list[dict]) -> list[Citation]:
        if not candidates:
            return []

        candidates = filter_non_clinical(candidates)
        if not candidates:
            return []

        documents = []
        for c in candidates:
            payload = c.get("payload", {})
            text = str(payload.get("text", payload.get("content", ""))).strip()
            if text:
                documents.append(text)
            else:
                documents.append(json.dumps(payload))

        response = self.cohere.rerank(
            model=COHERE_RERANK_MODEL,
            query=query,
            documents=documents,
            top_n=min(RERANK_TOP_K * 2, len(documents)),
            max_tokens_per_doc=RERANK_MAX_TOKENS_PER_DOC,
        )

        scored_candidates = []
        for result in response.results:
            idx = result.index
            if idx < len(candidates):
                item = candidates[idx]
                payload = item.get("payload", {})
                rel_score = float(result.relevance_score)
                multiplier = intent_adjustment(item, query)
                adjusted_score = rel_score * multiplier

                scored_candidates.append({
                    "chunk_id": str(payload.get("chunk_id", item.get("id", ""))),
                    "text_snippet": documents[idx][:500],
                    "source_title": str(payload.get("source", payload.get("document_id", "WHO Guideline"))),
                    "organization": str(payload.get("organization", "WHO / ACOG")),
                    "relevance_score": round(adjusted_score, 4),
                    "raw_score": round(rel_score, 4),
                })

        scored_candidates.sort(key=lambda x: x["relevance_score"], reverse=True)

        seen_sources = {}
        citations = []
        for c in scored_candidates:
            if len(citations) >= RERANK_TOP_K:
                break
            src = c["source_title"]
            if seen_sources.get(src, 0) >= 2 and len(citations) < RERANK_TOP_K - 1:
                continue

            seen_sources[src] = seen_sources.get(src, 0) + 1
            citations.append(Citation(
                chunk_id=c["chunk_id"],
                text_snippet=c["text_snippet"],
                source_title=c["source_title"],
                organization=c["organization"],
                relevance_score=c["relevance_score"],
            ))

        return citations

    def retrieve(self, query: str, clinical_context: str = None) -> RetrievalResult:
        search_query = query
        if clinical_context:
            search_query = f"{clinical_context} — {query}"

        candidates = self.hybrid_search(search_query)
        citations = self.rerank(search_query, candidates)

        return RetrievalResult(
            query=query,
            citations=citations,
            total_candidates=len(candidates),
            mode=detect_query_mode(query),
        )


_retriever_instance: Optional[MedicalRAGRetriever] = None


def get_retriever() -> MedicalRAGRetriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = MedicalRAGRetriever()
    return _retriever_instance
