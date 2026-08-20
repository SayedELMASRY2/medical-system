"""
MATERNAL MEDICAL RAG
Stage 04 — Gold Test Set Scaffolding

This file used to be a byte-for-byte duplicate of verify_documents.py
(a PDF inspector) and did not actually extract anything Q&A-related.
This is the real implementation.

Purpose:
    Build the scaffold for the Gold Test Set required before any
    retrieval evaluation (Master Spec Section 61-62): a set of clinical
    questions/signals, each with the chunk(s) that SHOULD be retrieved
    for it, so Recall@K / Precision@K / nDCG@5 can be measured.

This script does NOT invent clinical questions on its own — a medical
RAG must never fabricate its own ground truth. What it does:

    1. Scans the indexed chunks for candidate "recommendation-bearing"
       or "threshold-bearing" passages — the content most likely to be
       the correct answer to a real clinical question.
    2. For each candidate, generates a *draft* gold case with the
       source chunk pre-filled and an empty `question` field, so a
       clinician only has to write the question, not go hunting for
       which chunk answers it.
    3. Writes everything to a template file that a human reviewer edits
       before it is treated as ground truth. Nothing here is used for
       evaluation until a clinician has filled in and approved it.

Input:
    processed/03_chunks/*.jsonl

Output:
    processed/04_quality/gold_test_set_template.json
    processed/04_quality/candidate_review_report.json
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

INPUT_DIR = PROJECT_ROOT / "processed" / "03_chunks"
OUTPUT_DIR = PROJECT_ROOT / "processed" / "04_quality"

GOLD_TEMPLATE_PATH = OUTPUT_DIR / "gold_test_set_template.json"
REVIEW_REPORT_PATH = OUTPUT_DIR / "candidate_review_report.json"


# ============================================================
# CONFIGURATION
# ============================================================

# A chunk is a "recommendation candidate" if it contains explicit
# guideline language. This is intentionally narrow — better to miss a
# few candidates than to bury the reviewer in noise.
RECOMMENDATION_PATTERNS = [
    r"\brecommend(s|ed|ation)?\b",
    r"\bshould\s+(be|receive|not)\b",
    r"\bis\s+not\s+recommended\b",
    r"\badvised\b",
]

RECOMMENDATION_RE = re.compile("|".join(RECOMMENDATION_PATTERNS), re.IGNORECASE)

# Target number of candidates per document, spread across chunk types,
# so one long document doesn't dominate the gold set.
MAX_CANDIDATES_PER_DOCUMENT = 15

# Minimum target for the overall gold set per Master Spec Section 61.
GOLD_SET_TARGET_MIN = 50
GOLD_SET_TARGET_MAX = 100


# ============================================================
# CANDIDATE SELECTION
# ============================================================

def load_chunks(path: Path) -> list[dict[str, Any]]:
    chunks = []
    with path.open("r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if line:
                chunks.append(json.loads(line))
    return chunks


def score_candidate(chunk: dict[str, Any]) -> int:
    """
    Simple, transparent scoring — higher score = more likely to be a
    useful gold-set anchor. Not a machine-learned ranker on purpose:
    every point here should be explainable to a clinical reviewer.
    """

    score = 0
    text = chunk.get("text", "")

    if chunk.get("needs_clinical_review"):
        score += 2

    if chunk.get("contains_threshold_value"):
        score += 2

    if RECOMMENDATION_RE.search(text):
        score += 3

    if chunk.get("chunk_type") == "table":
        # Tables are important evidence but harder to turn into a single
        # clean question; keep them eligible but not over-weighted.
        score += 1

    return score


def select_candidates(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    scored = [(score_candidate(c), c) for c in chunks]
    scored = [(s, c) for s, c in scored if s > 0]
    scored.sort(key=lambda item: item[0], reverse=True)

    return [c for _, c in scored[:MAX_CANDIDATES_PER_DOCUMENT]]


# ============================================================
# GOLD CASE TEMPLATE
# ============================================================

def build_gold_case(case_id: str, chunk: dict[str, Any]) -> dict[str, Any]:
    """
    Matches the Master Spec Section 61 gold-case shape:
        - clinical signal / question   (left blank for the clinician)
        - expected relevant chunks
        - expected source
        - expected retrieval behavior
    """

    return {
        "case_id": case_id,
        # To be filled in by a clinician. Deliberately empty: this
        # script must never invent the ground-truth question itself.
        "question": "",
        "clinical_signal": {
            "gestational_age": None,
            "symptoms": [],
            "vitals": {},
        },
        "expected_chunk_ids": [chunk["chunk_id"]],
        "expected_document_id": chunk["document_id"],
        "expected_source": chunk.get("source"),
        "expected_retrieval_status": "success",
        "candidate_evidence_preview": chunk["text"][:280],
        "chunk_type": chunk.get("chunk_type"),
        "needs_clinical_review": chunk.get("needs_clinical_review", False),
        "reviewed_by": None,
        "approved": False,
    }


# ============================================================
# MAIN
# ============================================================

def main() -> None:

    print("=" * 80)
    print("MATERNAL MEDICAL RAG")
    print("STAGE 04 — GOLD TEST SET SCAFFOLDING")
    print("=" * 80)
    print(f"Input directory : {INPUT_DIR}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    if not INPUT_DIR.exists():
        raise FileNotFoundError(
            f"Input directory not found:\n{INPUT_DIR}\nRun chunk_documents.py first."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    chunk_files = sorted(INPUT_DIR.glob("*_chunks.jsonl"))

    if not chunk_files:
        raise FileNotFoundError(f"No chunk files found in:\n{INPUT_DIR}")

    print(f"Chunk files found: {len(chunk_files)}")

    all_candidates: list[dict[str, Any]] = []
    per_document_counts: dict[str, int] = {}

    for path in chunk_files:
        chunks = load_chunks(path)
        candidates = select_candidates(chunks)

        document_id = chunks[0]["document_id"] if chunks else path.stem
        per_document_counts[document_id] = len(candidates)

        print(f"  {document_id}: {len(chunks)} chunks -> {len(candidates)} candidates")

        all_candidates.extend(candidates)

    gold_cases = [
        build_gold_case(f"case_{index:04d}", chunk)
        for index, chunk in enumerate(all_candidates, start=1)
    ]

    gold_template = {
        "status": "DRAFT — requires clinical review before use in evaluation",
        "instructions": (
            "For each case: write the `question` a clinician would actually "
            "ask, verify `expected_chunk_ids` is correct and complete (add "
            "IDs if more than one chunk should be retrieved), set "
            "`reviewed_by`, and set `approved` to true. Cases with "
            "`approved: false` must be excluded from retrieval metrics."
        ),
        "total_cases": len(gold_cases),
        "target_range": [GOLD_SET_TARGET_MIN, GOLD_SET_TARGET_MAX],
        "cases": gold_cases,
    }

    with GOLD_TEMPLATE_PATH.open("w", encoding="utf-8") as file:
        json.dump(gold_template, file, ensure_ascii=False, indent=2)

    review_report = {
        "chunk_files_scanned": len(chunk_files),
        "total_chunks_scanned": sum(
            per_document_counts.get(doc_id, 0) for doc_id in per_document_counts
        ),
        "candidates_per_document": per_document_counts,
        "total_candidates_selected": len(all_candidates),
        "gold_set_target_range": [GOLD_SET_TARGET_MIN, GOLD_SET_TARGET_MAX],
        "within_target_range": (
            GOLD_SET_TARGET_MIN <= len(gold_cases) <= GOLD_SET_TARGET_MAX
        ),
    }

    with REVIEW_REPORT_PATH.open("w", encoding="utf-8") as file:
        json.dump(review_report, file, ensure_ascii=False, indent=2)

    print()
    print("=" * 80)
    print("GOLD TEST SET SCAFFOLDING COMPLETE")
    print("=" * 80)
    print(f"Total draft cases  : {len(gold_cases)}")
    print(f"Target range       : {GOLD_SET_TARGET_MIN}-{GOLD_SET_TARGET_MAX}")
    print(f"Gold template      : {GOLD_TEMPLATE_PATH}")
    print(f"Review report      : {REVIEW_REPORT_PATH}")

    if not review_report["within_target_range"]:
        print()
        print(
            "⚠️  Candidate count is outside the Section 61 target range. "
            "Adjust MAX_CANDIDATES_PER_DOCUMENT or add manual cases."
        )

    print()
    print(
        "STATUS: ⚠️ DRAFT ONLY — every case needs a clinician-written "
        "question and `approved: true` before it counts as gold data."
    )


if __name__ == "__main__":
    main()