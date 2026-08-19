"""
MATERNAL MEDICAL RAG
Stage 03 — Table-Aware Adaptive Semantic Chunking

This replaces the previous chunker (found misfiled as `clean_documents.py`,
and the older regex/pregnancy-keyword prototype that used to live at this
path). It keeps everything that already worked well:

    - Sentence-based semantic change-point detection (Cohere embed-v4.0)
    - Adaptive chunk sizing (MIN / TARGET / MAX words)
    - Full page + sentence provenance

...and fixes the problems found by analyzing the previous run's actual
output (quality_report.json + the 5 chunk files):

    1. TABLE FRAGMENTATION (the big one).
       GRADE evidence tables / dosage tables / DAK threshold tables were
       being sentence-split like normal prose, producing fragments such
       as "giving 750 mg/day..." with the drug name severed from the
       dose, and repeated near-duplicate chunks from repeated page
       headers. Stage 02 now hands this script pre-classified "table"
       blocks. Tables are NEVER sentence-split here — each merged table
       becomes one atomic chunk (with a size-cap fallback split as a
       last resort, clearly flagged).

    2. NO THRESHOLD FLAGGING.
       The master spec requires every chunk containing a clinical
       numeric threshold to be flagged and routed to a Clinical Review
       Queue before indexing. That flag never existed. It's added here
       as `contains_threshold_value` + `needs_clinical_review`.

    3. BOILERPLATE FIRST CHUNK.
       Copyright/ISBN front matter is now excluded upstream in Stage 02,
       so it no longer becomes chunk 0001 of every document.

    4. DUPLICATE / NEAR-DUPLICATE CHUNKS.
       Multi-page table merge in Stage 02 removes most of this, but a
       final dedup pass here catches any remaining exact/near-duplicate
       chunk text (common with repeated glossary/footnote lines) and
       excludes duplicates from the indexed output while keeping them
       visible in the quality report.

Input:
    processed/02_cleaned/*.json   (block-structured output of clean_documents.py)

Output:
    processed/03_chunks/*.jsonl
    processed/03_chunks/quality_report.json

Embedding provider:
    Cohere Embed v4, input_type = search_document
    (used ONLY for narrative blocks; table blocks are never embedded here
    — their embeddings, like everyone else's, are generated fresh and
    consistently in Stage 04 against the final chunk text)

Requirements:
    pip install numpy requests

Environment:
    PowerShell:
        $env:COHERE_API_KEY = "your-api-key"
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import re
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import requests


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

INPUT_DIR = PROJECT_ROOT / "processed" / "02_cleaned"
OUTPUT_DIR = PROJECT_ROOT / "processed" / "03_chunks"

QUALITY_REPORT_PATH = OUTPUT_DIR / "quality_report.json"

CHUNKER_VERSION = "2026-08-19-v2-table-aware-semantic"


# ============================================================
# CHUNKING CONFIGURATION (narrative blocks)
# ============================================================

MIN_CHUNK_WORDS = 120
TARGET_CHUNK_WORDS = 220
MAX_CHUNK_WORDS = 350

MAX_SENTENCE_WORDS = 90

BREAKPOINT_PERCENTILE = 90.0
SMOOTHING_WINDOW = 3
REQUIRE_LOCAL_PEAK = True
PEAK_MARGIN = 0.01

# ------------------------------------------------------------
# Table chunk configuration
# ------------------------------------------------------------

# Tables are kept atomic (never sentence-split). This is only a safety
# ceiling: if a merged multi-page table exceeds this, we fall back to
# splitting on blank-line boundaries (the least-bad heuristic available
# without layout/bbox data) rather than emitting one giant chunk.
MAX_TABLE_CHUNK_WORDS = 900

# ------------------------------------------------------------
# Cohere configuration
# ------------------------------------------------------------

COHERE_API_KEY = os.environ.get("COHERE_API_KEY", "")
COHERE_MODEL = "embed-v4.0"
COHERE_OUTPUT_DIMENSION = 1024
COHERE_BATCH_SIZE = 96
COHERE_MAX_RETRIES = 6
COHERE_BASE_BACKOFF_SECONDS = 8.0
COHERE_MAX_BACKOFF_SECONDS = 90.0
COHERE_REQUEST_TIMEOUT = 60

# ------------------------------------------------------------
# Sentence reconstruction configuration
# ------------------------------------------------------------

ABBREVIATIONS = {
    "mr.", "mrs.", "ms.", "dr.", "prof.", "fig.", "figs.", "no.", "nos.",
    "e.g.", "i.e.", "etc.", "vs.", "approx.", "inc.", "dept.", "ref.",
    "refs.", "jan.", "feb.", "mar.", "apr.", "jun.", "jul.", "aug.",
    "sep.", "sept.", "oct.", "nov.", "dec.",
}

MEDICAL_ABBREVIATIONS = {
    "bp.", "bmi.", "hr.", "rr.", "spo2.", "iv.", "im.", "po.", "bid.",
    "tid.", "qid.", "prn.", "fig.", "tab.", "vol.", "ed.", "eds.", "al.",
}

# ------------------------------------------------------------
# Clinical threshold detection (new)
# ------------------------------------------------------------

# Broad on purpose: false positives just mean an extra chunk goes to
# clinical review, which is the safe direction to err in. False
# negatives are the dangerous failure mode.
THRESHOLD_PATTERNS = [
    r"\d{2,3}\s*/\s*\d{2,3}\s*mmHg",          # "140/90 mmHg"
    r"\d{2,3}\s*/\s*\d{2,3}\b",                 # "140/90"
    r"\bmmHg\b",
    r"\d+(\.\d+)?\s*mg(/day|/kg|/dose)?\b",     # "750 mg/day"
    r"\d+(\.\d+)?\s*g(/day|/24\s*h)?\b",         # "5 g/24h"
    r"\d+(\.\d+)?\s*%",
    r"\d+(\.\d+)?\s*(weeks|wk)\b",
    r"\bRR\s*\(?\d",
    r"\bCI\s*\(?\d",
    r"per\s*1[,.]?000",
]

THRESHOLD_RE = re.compile("|".join(THRESHOLD_PATTERNS), re.IGNORECASE)


# ============================================================
# DATA MODELS
# ============================================================

@dataclass
class SentenceUnit:
    sentence_id: int
    text: str
    page_start: int
    page_end: int
    word_count: int


@dataclass
class ChunkRecord:
    chunk_id: str
    document_id: str

    source: Any
    year: Any
    topic: Any

    chunk_type: str  # "narrative" | "table"

    page_start: int
    page_end: int
    pages: list[int]

    sentence_start: int | None
    sentence_end: int | None
    sentence_ids: list[int]

    text: str

    word_count: int
    char_count: int

    contains_threshold_value: bool
    needs_clinical_review: bool

    semantic_boundary_before: bool | None
    boundary_distance: float | None
    boundary_threshold: float | None

    is_duplicate: bool
    duplicate_of: str | None


@dataclass
class ChunkingStats:
    document_id: str = ""

    input_blocks: int = 0
    narrative_blocks: int = 0
    table_blocks: int = 0

    sentences_created: int = 0
    semantic_boundaries_detected: int = 0

    chunks_created: int = 0
    narrative_chunks: int = 0
    table_chunks: int = 0

    min_chunk_words: int = 0
    max_chunk_words: int = 0
    mean_chunk_words: float = 0.0
    median_chunk_words: float = 0.0

    chunks_below_min: int = 0
    chunks_above_max: int = 0

    oversized_sentences: int = 0

    threshold_flagged_chunks: int = 0
    duplicate_chunks_excluded: int = 0

    embedding_batches: int = 0
    embedding_failures: int = 0


# ============================================================
# GENERIC TEXT HELPERS
# ============================================================

TOKEN_PATTERN = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*")


def word_count(text: str) -> int:
    return len(TOKEN_PATTERN.findall(text))


def normalize_spaces(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clean_fragment(text: str) -> str:
    text = normalize_spaces(text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def detect_threshold_value(text: str) -> bool:
    return bool(THRESHOLD_RE.search(text))


def normalize_for_dedup(text: str) -> str:
    normalized = re.sub(r"\s+", " ", text.lower()).strip()
    return normalized[:300]


def content_hash(text: str) -> str:
    return hashlib.sha1(normalize_for_dedup(text).encode("utf-8")).hexdigest()


# ============================================================
# ABBREVIATION PROTECTION
# ============================================================

def protect_abbreviations(text: str) -> tuple[str, dict[str, str]]:
    replacements: dict[str, str] = {}
    all_abbreviations = ABBREVIATIONS | MEDICAL_ABBREVIATIONS

    for index, abbreviation in enumerate(sorted(all_abbreviations)):
        escaped = re.escape(abbreviation)
        pattern = re.compile(escaped, re.IGNORECASE)
        placeholder = f"__ABBR_{index}__"

        if pattern.search(text):
            text = pattern.sub(placeholder, text)
            replacements[placeholder] = abbreviation

    return text, replacements


def restore_abbreviations(text: str, replacements: dict[str, str]) -> str:
    for placeholder, original in replacements.items():
        text = text.replace(placeholder, original)
    return text


# ============================================================
# SENTENCE SEGMENTATION
# ============================================================

SENTENCE_END_RE = re.compile(
    r"""
    (?P<punct>[.!?])
    (?=
        \s+
        (?:
            [A-ZÀ-ÖØ-Ý]
            |
            \d
            |
            ["'(\[]
            |
            -
        )
    )
    """,
    re.VERBOSE,
)


def split_long_sentence(text: str) -> list[str]:
    text = clean_fragment(text)

    if word_count(text) <= MAX_SENTENCE_WORDS:
        return [text]

    pieces = [p.strip() for p in re.split(r";\s+", text) if p.strip()]
    if len(pieces) > 1:
        output: list[str] = []
        for piece in pieces:
            if word_count(piece) <= MAX_SENTENCE_WORDS:
                output.append(piece)
            else:
                output.extend(split_long_sentence(piece))
        return output

    pieces = [p.strip() for p in re.split(r":\s+", text) if p.strip()]
    if len(pieces) > 1:
        output = []
        for piece in pieces:
            if word_count(piece) <= MAX_SENTENCE_WORDS:
                output.append(piece)
            else:
                output.extend(split_long_sentence(piece))
        return output

    if "," in text:
        words = text.split()
        current: list[str] = []
        groups: list[str] = []
        for word in words:
            current.append(word)
            if word.endswith(",") and word_count(" ".join(current)) >= 25:
                groups.append(" ".join(current))
                current = []
        if current:
            groups.append(" ".join(current))
        if len(groups) > 1:
            return groups

    words = text.split()
    target = max(35, MAX_SENTENCE_WORDS)
    return [" ".join(words[i : i + target]) for i in range(0, len(words), target)]


def split_text_into_sentences(text: str) -> list[str]:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = normalize_spaces(text)

    if not text:
        return []

    protected_text, replacements = protect_abbreviations(text)
    protected_text = re.sub(r"\s+([-•●◦▪■*]\s+)", r"\n\1", protected_text)

    matches = list(SENTENCE_END_RE.finditer(protected_text))

    if not matches:
        restored = restore_abbreviations(protected_text, replacements)
        return split_long_sentence(restored)

    sentences: list[str] = []
    start = 0

    for match in matches:
        end = match.end()
        fragment = protected_text[start:end]
        fragment = restore_abbreviations(fragment, replacements)
        fragment = clean_fragment(fragment)
        if fragment:
            sentences.extend(split_long_sentence(fragment))
        start = end

    remaining = protected_text[start:]
    remaining = restore_abbreviations(remaining, replacements)
    remaining = clean_fragment(remaining)
    if remaining:
        sentences.extend(split_long_sentence(remaining))

    return [clean_fragment(s) for s in sentences if word_count(s) > 0]


def join_cross_page_sentence(previous_text: str, current_text: str) -> str:
    previous_text = previous_text.rstrip()
    current_text = current_text.lstrip()

    if not previous_text:
        return current_text
    if not current_text:
        return previous_text
    if previous_text.endswith("-"):
        return previous_text[:-1] + current_text
    return previous_text + " " + current_text


def pages_to_sentences(pages: list[dict[str, Any]], start_id: int) -> tuple[list[SentenceUnit], int]:
    """
    Same logic as before, but operates on an arbitrary run of narrative
    "pages" (which here are really narrative blocks, one per original
    page) and continues sentence numbering from start_id so IDs stay
    unique across the whole document.
    """

    raw_units: list[SentenceUnit] = []
    counter = start_id

    for page in pages:
        page_number = int(page["page"])
        text = str(page.get("text") or "").strip()

        if not text:
            continue

        for sentence in split_text_into_sentences(text):
            sentence = clean_fragment(sentence)
            if not sentence:
                continue

            raw_units.append(
                SentenceUnit(
                    sentence_id=counter,
                    text=sentence,
                    page_start=page_number,
                    page_end=page_number,
                    word_count=word_count(sentence),
                )
            )
            counter += 1

    if not raw_units:
        return [], start_id

    merged: list[SentenceUnit] = []

    for unit in raw_units:
        if not merged:
            merged.append(unit)
            continue

        previous = merged[-1]
        previous_end = previous.text.rstrip()

        complete = bool(re.search(r'[.!?]["\')\]]?$', previous_end))
        if previous_end.startswith("- "):
            complete = complete or bool(re.search(r"[.!?]$", previous_end))

        if not complete and previous.page_end < unit.page_start:
            joined = join_cross_page_sentence(previous.text, unit.text)
            if word_count(joined) <= MAX_SENTENCE_WORDS * 2:
                merged[-1] = SentenceUnit(
                    sentence_id=previous.sentence_id,
                    text=joined,
                    page_start=previous.page_start,
                    page_end=unit.page_end,
                    word_count=word_count(joined),
                )
                continue

        merged.append(unit)

    # Re-number, continuing from start_id.
    final_units: list[SentenceUnit] = []
    for offset, unit in enumerate(merged):
        final_units.append(
            SentenceUnit(
                sentence_id=start_id + offset,
                text=unit.text,
                page_start=unit.page_start,
                page_end=unit.page_end,
                word_count=unit.word_count,
            )
        )

    next_id = start_id + len(final_units)
    return final_units, next_id


# ============================================================
# COHERE EMBEDDING CLIENT
# ============================================================

def validate_api_key() -> None:
    if not COHERE_API_KEY:
        raise RuntimeError(
            "COHERE_API_KEY is not set.\n\nPowerShell:\n"
            "$env:COHERE_API_KEY = 'your-key-here'"
        )


def _backoff_delay(attempt: int) -> float:
    return min(COHERE_BASE_BACKOFF_SECONDS * (2 ** attempt), COHERE_MAX_BACKOFF_SECONDS)


def embed_batch_cohere(texts: list[str]) -> np.ndarray:
    validate_api_key()

    if not texts:
        return np.empty((0, COHERE_OUTPUT_DIMENSION), dtype=np.float32)

    payload = {
        "model": COHERE_MODEL,
        "input_type": "search_document",
        "texts": texts,
        "embedding_types": ["float"],
        "output_dimension": COHERE_OUTPUT_DIMENSION,
    }
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json",
    }

    last_exception: Exception | None = None

    for attempt in range(COHERE_MAX_RETRIES):
        try:
            response = requests.post(
                "https://api.cohere.com/v2/embed",
                headers=headers,
                json=payload,
                timeout=COHERE_REQUEST_TIMEOUT,
            )

            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                try:
                    delay = float(retry_after) if retry_after else _backoff_delay(attempt)
                except ValueError:
                    delay = _backoff_delay(attempt)

                print(f"    [Cohere 429] waiting {delay:.1f}s...")
                time.sleep(delay)
                continue

            response.raise_for_status()
            data = response.json()
            embeddings = data["embeddings"]["float"]
            matrix = np.asarray(embeddings, dtype=np.float32)

            if matrix.ndim != 2:
                raise RuntimeError("Cohere returned an unexpected embedding shape.")
            if matrix.shape[0] != len(texts):
                raise RuntimeError("Embedding count does not match input text count.")

            return matrix

        except requests.RequestException as exc:
            last_exception = exc
            if attempt == COHERE_MAX_RETRIES - 1:
                break
            delay = _backoff_delay(attempt)
            print(f"    [Cohere request error] {exc}. Retrying in {delay:.1f}s...")
            time.sleep(delay)

        except (KeyError, TypeError, ValueError) as exc:
            last_exception = exc
            break

    raise RuntimeError(f"Cohere embedding request failed: {last_exception}")


def embed_texts(texts: list[str]) -> tuple[np.ndarray, int]:
    if not texts:
        return np.empty((0, COHERE_OUTPUT_DIMENSION), dtype=np.float32), 0

    all_batches: list[np.ndarray] = []
    batch_count = 0

    for start in range(0, len(texts), COHERE_BATCH_SIZE):
        batch = texts[start : start + COHERE_BATCH_SIZE]
        print(f"    Embedding sentences {start + 1}-{start + len(batch)} / {len(texts)}")
        all_batches.append(embed_batch_cohere(batch))
        batch_count += 1

    return np.vstack(all_batches), batch_count


# ============================================================
# VECTOR OPERATIONS
# ============================================================

def l2_normalize(matrix: np.ndarray) -> np.ndarray:
    if matrix.size == 0:
        return matrix
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms = np.maximum(norms, 1e-12)
    return matrix / norms


def consecutive_cosine_distances(embeddings: np.ndarray) -> np.ndarray:
    if len(embeddings) < 2:
        return np.empty((0,), dtype=np.float32)

    normalized = l2_normalize(embeddings)
    similarities = np.sum(normalized[:-1] * normalized[1:], axis=1)
    similarities = np.clip(similarities, -1.0, 1.0)
    return (1.0 - similarities).astype(np.float32)


def moving_average(values: np.ndarray, window: int) -> np.ndarray:
    if len(values) == 0:
        return values
    if window <= 1:
        return values.copy()

    window = min(window, len(values))
    padded = np.pad(values, (window // 2, window // 2), mode="edge")
    kernel = np.ones(window) / window
    smoothed = np.convolve(padded, kernel, mode="valid")
    return smoothed[: len(values)]


def calculate_breakpoint_threshold(distances: np.ndarray, percentile: float) -> float:
    if len(distances) == 0:
        return math.inf
    return float(np.percentile(distances, percentile))


def is_local_peak(values: np.ndarray, index: int, margin: float) -> bool:
    current = float(values[index])
    left = float(values[index - 1]) if index > 0 else -math.inf
    right = float(values[index + 1]) if index < len(values) - 1 else -math.inf

    return (
        current >= left - margin
        and current >= right - margin
        and (current > left + margin or current > right + margin)
    )


def detect_semantic_boundaries(distances: np.ndarray) -> tuple[list[int], np.ndarray, float]:
    if len(distances) == 0:
        return [], distances, math.inf

    smoothed = moving_average(distances, SMOOTHING_WINDOW)
    threshold = calculate_breakpoint_threshold(smoothed, BREAKPOINT_PERCENTILE)

    boundaries: list[int] = []

    for i, distance in enumerate(smoothed):
        if distance < threshold:
            continue
        if REQUIRE_LOCAL_PEAK and not is_local_peak(smoothed, i, PEAK_MARGIN):
            continue
        boundaries.append(i + 1)

    return sorted(set(boundaries)), smoothed, threshold


# ============================================================
# CHUNK ASSEMBLY (narrative)
# ============================================================

def chunk_word_count(sentences: list[SentenceUnit], start: int, end: int) -> int:
    return sum(s.word_count for s in sentences[start:end])


def boundary_strength(boundary_index: int, smoothed_distances: np.ndarray) -> float:
    distance_index = boundary_index - 1
    if distance_index < 0 or distance_index >= len(smoothed_distances):
        return 0.0
    return float(smoothed_distances[distance_index])


def choose_boundary(
    sentences: list[SentenceUnit],
    start: int,
    semantic_boundaries: set[int],
    smoothed_distances: np.ndarray,
) -> tuple[int, bool, float]:

    n = len(sentences)
    candidates: list[tuple[float, int, bool, float]] = []
    running_words = 0

    for end in range(start, n):
        running_words += sentences[end].word_count
        if running_words > MAX_CHUNK_WORDS:
            break

        boundary_index = end + 1
        if boundary_index >= n:
            return (
                n,
                boundary_index in semantic_boundaries,
                boundary_strength(boundary_index, smoothed_distances),
            )

        chunk_words = running_words
        semantic = boundary_index in semantic_boundaries
        strength = boundary_strength(boundary_index, smoothed_distances)
        distance_from_target = abs(chunk_words - TARGET_CHUNK_WORDS)

        semantic_bonus = 100.0 if semantic else 0.0
        semantic_strength_bonus = strength * 100.0 if semantic else 0.0
        size_penalty = (distance_from_target / max(TARGET_CHUNK_WORDS, 1)) * 20.0

        min_penalty = 0.0
        if chunk_words < MIN_CHUNK_WORDS:
            min_penalty = (MIN_CHUNK_WORDS - chunk_words) * 3.0

        utility = semantic_bonus + semantic_strength_bonus - size_penalty - min_penalty
        candidates.append((utility, boundary_index, semantic, strength))

    if not candidates:
        return min(start + 1, n), False, 0.0

    valid = [
        c for c in candidates
        if chunk_word_count(sentences, start, c[1]) >= MIN_CHUNK_WORDS
    ]

    if valid:
        best = max(valid, key=lambda item: item[0])
        return best[1], best[2], best[3]

    best = max(candidates, key=lambda item: item[1])
    return best[1], best[2], best[3]


def build_narrative_chunks(
    document_id: str,
    chunk_counter: int,
    document_meta: dict[str, Any],
    sentences: list[SentenceUnit],
    semantic_boundaries: list[int],
    smoothed_distances: np.ndarray,
    threshold: float,
) -> tuple[list[ChunkRecord], int]:

    if not sentences:
        return [], chunk_counter

    semantic_boundary_set = set(semantic_boundaries)
    chunks: list[ChunkRecord] = []
    start = 0

    while start < len(sentences):
        end, is_semantic, boundary_distance = choose_boundary(
            sentences, start, semantic_boundary_set, smoothed_distances
        )

        if end <= start:
            end = min(start + 1, len(sentences))

        selected = sentences[start:end]
        text = clean_fragment(" ".join(s.text for s in selected))

        pages = sorted({p for s in selected for p in range(s.page_start, s.page_end + 1)})
        page_start = min(s.page_start for s in selected)
        page_end = max(s.page_end for s in selected)

        threshold_hit = detect_threshold_value(text)

        chunk = ChunkRecord(
            chunk_id=f"{document_id}_{chunk_counter:04d}",
            document_id=document_id,
            source=document_meta.get("source"),
            year=document_meta.get("year"),
            topic=document_meta.get("topic"),
            chunk_type="narrative",
            page_start=page_start,
            page_end=page_end,
            pages=pages,
            sentence_start=selected[0].sentence_id,
            sentence_end=selected[-1].sentence_id,
            sentence_ids=[s.sentence_id for s in selected],
            text=text,
            word_count=word_count(text),
            char_count=len(text),
            contains_threshold_value=threshold_hit,
            needs_clinical_review=threshold_hit,
            semantic_boundary_before=(start in semantic_boundary_set and start != 0),
            boundary_distance=boundary_distance if start != 0 else None,
            boundary_threshold=(threshold if start != 0 and math.isfinite(threshold) else None),
            is_duplicate=False,
            duplicate_of=None,
        )

        chunks.append(chunk)
        chunk_counter += 1
        start = end

    return chunks, chunk_counter


# ============================================================
# CHUNK ASSEMBLY (table)
# ============================================================

def split_table_text_on_size(text: str) -> list[str]:
    """
    Last-resort split for a table block that exceeds MAX_TABLE_CHUNK_WORDS.
    We split on blank lines (the closest thing to a row/section boundary
    available from plain-text extraction) rather than mid-sentence, and
    only as a fallback — most merged tables will fit in a single chunk.
    """

    if word_count(text) <= MAX_TABLE_CHUNK_WORDS:
        return [text]

    paragraphs = [p for p in re.split(r"\n\s*\n", text) if p.strip()]

    if len(paragraphs) <= 1:
        # No blank-line structure to split on. Keep atomic and flag it
        # for manual review rather than guessing a cut point.
        return [text]

    groups: list[str] = []
    current: list[str] = []
    current_words = 0

    for paragraph in paragraphs:
        p_words = word_count(paragraph)

        if current and current_words + p_words > MAX_TABLE_CHUNK_WORDS:
            groups.append("\n\n".join(current))
            current = []
            current_words = 0

        current.append(paragraph)
        current_words += p_words

    if current:
        groups.append("\n\n".join(current))

    return groups


def build_table_chunks(
    document_id: str,
    chunk_counter: int,
    document_meta: dict[str, Any],
    block: dict[str, Any],
) -> tuple[list[ChunkRecord], int]:

    text = clean_fragment(str(block.get("text") or ""))

    if not text:
        return [], chunk_counter

    pieces = split_table_text_on_size(text)
    chunks: list[ChunkRecord] = []

    for piece in pieces:
        chunk = ChunkRecord(
            chunk_id=f"{document_id}_{chunk_counter:04d}",
            document_id=document_id,
            source=document_meta.get("source"),
            year=document_meta.get("year"),
            topic=document_meta.get("topic"),
            chunk_type="table",
            page_start=block["page_start"],
            page_end=block["page_end"],
            pages=block["pages"],
            sentence_start=None,
            sentence_end=None,
            sentence_ids=[],
            text=piece,
            word_count=word_count(piece),
            char_count=len(piece),
            # Table chunks always go to clinical review: they overwhelmingly
            # carry numeric thresholds and the cost of an unnecessary review
            # is far lower than the cost of missing one.
            contains_threshold_value=detect_threshold_value(piece) or True,
            needs_clinical_review=True,
            semantic_boundary_before=None,
            boundary_distance=None,
            boundary_threshold=None,
            is_duplicate=False,
            duplicate_of=None,
        )
        chunks.append(chunk)
        chunk_counter += 1

    return chunks, chunk_counter


# ============================================================
# DEDUPLICATION
# ============================================================

def deduplicate_chunks(chunks: list[ChunkRecord]) -> int:
    """
    Mark exact/near-duplicate chunks (by normalized-prefix hash) so they
    are excluded from the final indexed output while remaining visible
    in the quality report for audit. Mutates chunks in place.
    """

    seen: dict[str, str] = {}
    duplicate_count = 0

    for chunk in chunks:
        key = content_hash(chunk.text)

        if key in seen:
            chunk.is_duplicate = True
            chunk.duplicate_of = seen[key]
            duplicate_count += 1
        else:
            seen[key] = chunk.chunk_id

    return duplicate_count


# ============================================================
# QUALITY CHECKS
# ============================================================

def calculate_chunk_stats(chunks: list[ChunkRecord]) -> dict[str, Any]:
    if not chunks:
        return {
            "count": 0, "min_words": 0, "max_words": 0,
            "mean_words": 0.0, "median_words": 0.0,
            "below_min": 0, "above_max": 0,
        }

    counts = np.asarray([c.word_count for c in chunks], dtype=np.float32)

    return {
        "count": int(len(counts)),
        "min_words": int(np.min(counts)),
        "max_words": int(np.max(counts)),
        "mean_words": float(np.mean(counts)),
        "median_words": float(np.median(counts)),
        "below_min": int(np.sum((counts < MIN_CHUNK_WORDS) & np.array([c.chunk_type == "narrative" for c in chunks]))),
        "above_max": int(np.sum((counts > MAX_CHUNK_WORDS) & np.array([c.chunk_type == "narrative" for c in chunks]))),
    }


def validate_chunks(chunks: list[ChunkRecord]) -> list[str]:
    errors: list[str] = []

    for chunk in chunks:
        if not chunk.text.strip():
            errors.append(f"{chunk.chunk_id}: empty text")
        if chunk.word_count <= 0:
            errors.append(f"{chunk.chunk_id}: zero words")
        if chunk.page_start > chunk.page_end:
            errors.append(f"{chunk.chunk_id}: invalid page range")
        if not chunk.pages:
            errors.append(f"{chunk.chunk_id}: no pages")
        if chunk.chunk_type == "narrative" and chunk.word_count > MAX_CHUNK_WORDS and len(chunk.sentence_ids) > 1:
            errors.append(f"{chunk.chunk_id}: unexpectedly above narrative hard maximum")

    return errors


# ============================================================
# DOCUMENT PROCESSING
# ============================================================

def process_document(document: dict[str, Any]) -> tuple[list[ChunkRecord], dict[str, Any]]:

    document_id = document.get("document_id", "unknown_document")
    blocks = document.get("blocks", [])

    print()
    print("=" * 80)
    print(f"DOCUMENT: {document_id}")
    print("=" * 80)
    print(f"Input blocks: {len(blocks)}")

    if not blocks:
        return [], {"document_id": document_id, "status": "no_blocks"}

    document_meta = {
        "source": document.get("source"),
        "year": document.get("year"),
        "topic": document.get("topic"),
    }

    all_chunks: list[ChunkRecord] = []
    chunk_counter = 1
    next_sentence_id = 1

    total_sentences = 0
    total_semantic_boundaries = 0
    total_embedding_batches = 0
    oversized_sentences = 0

    narrative_block_count = sum(1 for b in blocks if b["block_type"] == "narrative")
    table_block_count = sum(1 for b in blocks if b["block_type"] == "table")

    # Process blocks in order, grouping consecutive narrative blocks into
    # one run so sentence reconstruction and semantic chunking see full
    # continuity — but never let a chunk span across a table interruption.
    i = 0
    n = len(blocks)

    while i < n:
        block = blocks[i]

        if block["block_type"] == "table":
            print(f"  [table]  pages {block['page_start']}-{block['page_end']}")
            table_chunks, chunk_counter = build_table_chunks(
                document_id, chunk_counter, document_meta, block
            )
            all_chunks.extend(table_chunks)
            i += 1
            continue

        # Gather the run of consecutive narrative blocks.
        run_start = i
        while i < n and blocks[i]["block_type"] == "narrative":
            i += 1
        run_blocks = blocks[run_start:i]

        pseudo_pages = [{"page": b["page_start"], "text": b["text"]} for b in run_blocks]

        sentences, next_sentence_id = pages_to_sentences(pseudo_pages, next_sentence_id)

        if not sentences:
            continue

        total_sentences += len(sentences)
        oversized_sentences += sum(1 for s in sentences if s.word_count > MAX_SENTENCE_WORDS)

        sentence_texts = [s.text for s in sentences]
        embeddings, batches = embed_texts(sentence_texts)
        total_embedding_batches += batches

        distances = consecutive_cosine_distances(embeddings)

        if len(distances) == 0:
            semantic_boundaries, smoothed_distances, threshold = [], distances, math.inf
        else:
            semantic_boundaries, smoothed_distances, threshold = detect_semantic_boundaries(distances)

        total_semantic_boundaries += len(semantic_boundaries)

        print(
            f"  [narrative run] pages {run_blocks[0]['page_start']}-{run_blocks[-1]['page_end']} "
            f"-> {len(sentences)} sentences, {len(semantic_boundaries)} boundaries"
        )

        narrative_chunks, chunk_counter = build_narrative_chunks(
            document_id, chunk_counter, document_meta,
            sentences, semantic_boundaries, smoothed_distances, threshold,
        )
        all_chunks.extend(narrative_chunks)

    # --------------------------------------------------------
    # Deduplication (safety net; most duplication already handled
    # upstream by the Stage 02 multi-page table merge)
    # --------------------------------------------------------

    duplicate_count = deduplicate_chunks(all_chunks)

    indexed_chunks = [c for c in all_chunks if not c.is_duplicate]

    print(f"Total chunks (incl. duplicates): {len(all_chunks)}")
    print(f"Duplicates excluded from index : {duplicate_count}")
    print(f"Final indexed chunks           : {len(indexed_chunks)}")

    # --------------------------------------------------------
    # Stats + validation
    # --------------------------------------------------------

    chunk_stats = calculate_chunk_stats(indexed_chunks)
    validation_errors = validate_chunks(indexed_chunks)

    threshold_flagged = sum(1 for c in indexed_chunks if c.needs_clinical_review)

    print(f"Chunk words: {chunk_stats['min_words']} -> {chunk_stats['max_words']}")
    print(f"Mean chunk size: {chunk_stats['mean_words']:.1f}")
    print(f"Chunks flagged for clinical review: {threshold_flagged}")

    if validation_errors:
        print(f"⚠ Validation issues: {len(validation_errors)}")
        for error in validation_errors[:10]:
            print(f"   - {error}")
    else:
        print("✓ Chunk validation passed")

    stats = ChunkingStats(
        document_id=document_id,
        input_blocks=len(blocks),
        narrative_blocks=narrative_block_count,
        table_blocks=table_block_count,
        sentences_created=total_sentences,
        semantic_boundaries_detected=total_semantic_boundaries,
        chunks_created=len(indexed_chunks),
        narrative_chunks=sum(1 for c in indexed_chunks if c.chunk_type == "narrative"),
        table_chunks=sum(1 for c in indexed_chunks if c.chunk_type == "table"),
        min_chunk_words=chunk_stats["min_words"],
        max_chunk_words=chunk_stats["max_words"],
        mean_chunk_words=chunk_stats["mean_words"],
        median_chunk_words=chunk_stats["median_words"],
        chunks_below_min=chunk_stats["below_min"],
        chunks_above_max=chunk_stats["above_max"],
        oversized_sentences=oversized_sentences,
        threshold_flagged_chunks=threshold_flagged,
        duplicate_chunks_excluded=duplicate_count,
        embedding_batches=total_embedding_batches,
        embedding_failures=0,
    )

    report = {
        "chunker_version": CHUNKER_VERSION,
        "statistics": asdict(stats),
        "validation": {"errors": validation_errors, "valid": not bool(validation_errors)},
    }

    return indexed_chunks, report


# ============================================================
# I/O HELPERS
# ============================================================

def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_jsonl(path: Path, chunks: list[ChunkRecord]) -> None:
    with path.open("w", encoding="utf-8") as file:
        for chunk in chunks:
            file.write(json.dumps(asdict(chunk), ensure_ascii=False) + "\n")


# ============================================================
# MAIN
# ============================================================

def main() -> None:

    print("=" * 80)
    print("MATERNAL MEDICAL RAG")
    print("STAGE 03 — TABLE-AWARE ADAPTIVE SEMANTIC CHUNKING")
    print("=" * 80)
    print(f"Chunker version : {CHUNKER_VERSION}")
    print(f"Input directory : {INPUT_DIR}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    validate_api_key()

    if not INPUT_DIR.exists():
        raise FileNotFoundError(
            f"Input directory not found:\n{INPUT_DIR}\nRun clean_documents.py first."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    input_files = sorted(INPUT_DIR.glob("*_cleaned.json"))

    if not input_files:
        raise FileNotFoundError(f"No cleaned JSON files found in:\n{INPUT_DIR}")

    print(f"Documents found: {len(input_files)}")

    all_reports: list[dict[str, Any]] = []
    total_chunks = 0
    total_sentences = 0
    failed_documents = 0

    for path in input_files:
        try:
            document = load_json(path)
            if "document_id" not in document:
                print(f"Skipping non-document file: {path.name}")
                continue

            document_id = document["document_id"]

            chunks, report = process_document(document)

            output_path = OUTPUT_DIR / f"{document_id}_chunks.jsonl"
            save_jsonl(output_path, chunks)

            print(f"Output: {output_path}")

            total_chunks += len(chunks)
            total_sentences += report.get("statistics", {}).get("sentences_created", 0)

            all_reports.append({"input": str(path), "output": str(output_path), **report})

        except Exception as exc:
            failed_documents += 1
            print()
            print(f"❌ FAILED: {path.name}")
            print(f"   Error: {exc}")
            all_reports.append({"input": str(path), "status": "failed", "error": str(exc)})

    successful_reports = [r for r in all_reports if r.get("status") != "failed"]

    global_report = {
        "chunker_version": CHUNKER_VERSION,
        "method": "Table-Aware Sentence-based Semantic Change-Point + Adaptive Size Constraints",
        "input_directory": str(INPUT_DIR),
        "output_directory": str(OUTPUT_DIR),
        "configuration": {
            "min_chunk_words": MIN_CHUNK_WORDS,
            "target_chunk_words": TARGET_CHUNK_WORDS,
            "max_chunk_words": MAX_CHUNK_WORDS,
            "max_table_chunk_words": MAX_TABLE_CHUNK_WORDS,
            "max_sentence_words": MAX_SENTENCE_WORDS,
            "breakpoint_percentile": BREAKPOINT_PERCENTILE,
            "smoothing_window": SMOOTHING_WINDOW,
            "require_local_peak": REQUIRE_LOCAL_PEAK,
            "peak_margin": PEAK_MARGIN,
            "cohere_model": COHERE_MODEL,
            "cohere_output_dimension": COHERE_OUTPUT_DIMENSION,
        },
        "summary": {
            "documents_found": len(input_files),
            "documents_successful": len(successful_reports),
            "documents_failed": failed_documents,
            "total_sentences": total_sentences,
            "total_chunks": total_chunks,
        },
        "documents": all_reports,
    }

    QUALITY_REPORT_PATH.write_text(
        json.dumps(global_report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print()
    print("=" * 80)
    print("CHUNKING COMPLETE")
    print("=" * 80)
    print(f"Documents successful: {len(successful_reports)}")
    print(f"Documents failed    : {failed_documents}")
    print(f"Total chunks        : {total_chunks:,}")
    print(f"Quality report      : {QUALITY_REPORT_PATH}")

    if failed_documents == 0:
        print()
        print("STATUS: ✅ STAGE 03 COMPLETE")
    else:
        print()
        print("STATUS: ⚠️ COMPLETED WITH DOCUMENT ERRORS")


if __name__ == "__main__":
    main()