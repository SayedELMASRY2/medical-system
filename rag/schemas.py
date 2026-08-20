from dataclasses import dataclass, field
from typing import Any


@dataclass
class Citation:
    chunk_id: str
    text_snippet: str
    source_title: str
    organization: str
    relevance_score: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "text_snippet": self.text_snippet,
            "source_title": self.source_title,
            "organization": self.organization,
            "relevance_score": self.relevance_score,
        }


@dataclass
class RetrievalResult:
    query: str
    citations: list[Citation] = field(default_factory=list)
    total_candidates: int = 0
    mode: str = "general"

    def to_dict(self) -> dict[str, Any]:
        return {
            "query": self.query,
            "citations": [c.to_dict() for c in self.citations],
            "total_candidates": self.total_candidates,
            "mode": self.mode,
        }
