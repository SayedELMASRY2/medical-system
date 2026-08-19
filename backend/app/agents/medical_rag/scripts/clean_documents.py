"""
MATERNAL MEDICAL RAG
Stage 02 — Cleaning + Table-Aware Segmentation

This stage was previously MISSING from the pipeline. The file that used to
live at this path (`clean_documents.py`) actually contained a duplicate of
the Stage 03 chunker. This is the real Stage 02.

Input:
    processed/01_parsed/*.json      (output of parse_documents.py)

Output:
    processed/02_cleaned/*.json
    processed/02_cleaned/cleaning_report.json

What this stage does that did NOT exist before:

    1. Classifies every page as one of:
           "narrative"   -> normal prose, safe for sentence-level chunking
           "table"       -> GRADE evidence tables / DAK threshold tables /
                             dosage tables. Must NOT be sentence-split.
           "boilerplate" -> copyright / ISBN / license front-matter pages.
                             Excluded from chunking entirely.

    2. Merges consecutive "table" pages into a single continuous table
       block, and strips the duplicated header text that PDF extraction
       repeats on every page of a multi-page table. This is what caused
       chunks like "Certainty assessment No of women Effect ..." to appear
       5-7 times verbatim in the corpus.

    3. Removes running headers/footers (lines that repeat near-identically
       across many pages of the same document, e.g. the title repeated on
       the cover page, or a running footer).

Design goals (kept from the project's stated philosophy):
    - No Docling / no TableFormer / no OCR. Plain-text heuristics only,
      because PyPDFLoader gives us plain text with no layout/bbox info.
    - Page-level granularity for table detection (sub-page detection is
      not reliable without layout coordinates).
    - Never silently drop clinical content. Boilerplate exclusion is
      narrow and logged; anything ambiguous defaults to "narrative"
      rather than being dropped.

Requirements:
    pip install numpy
"""

from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import asdict, dataclass, field
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

INPUT_DIR = PROJECT_ROOT / "processed" / "01_parsed"
OUTPUT_DIR = PROJECT_ROOT / "processed" / "02_cleaned"

CLEANING_REPORT_PATH = OUTPUT_DIR / "cleaning_report.json"

CLEANER_VERSION = "2026-08-19-v1-table-aware-cleaning"


# ============================================================
# CONFIGURATION
# ============================================================

# --- Table page detection ---------------------------------------------

# A line counts as "table-like" if it is short (few words) and/or
# dominated by numbers/symbols typical of GRADE / threshold tables.
TABLE_LINE_MAX_WORDS = 8

# Regex keywords that strongly indicate a GRADE evidence table or a
# clinical threshold / dosage table.
TABLE_KEYWORDS = [
    r"certainty assessment",
    r"no\.?\s*of\s*(studies|women|patients)",
    r"risk of bias",
    r"risk ratio",
    r"\bRR\b\s*\(",
    r"confidence interval",
    r"randomi[sz]ed\s*\n?\s*trials?",
    r"⨁",
    r"◯",
    r"mmHg",
    r"mg/day",
    r"per\s*1[,.]?000",
    r"GRADE",
]

TABLE_KEYWORD_RE = re.compile("|".join(TABLE_KEYWORDS), re.IGNORECASE)

# Fraction of "table-like" lines on a page required to classify the whole
# page as a table page.
TABLE_LINE_RATIO_THRESHOLD = 0.35

# If the page contains at least this many distinct table keyword hits,
# classify it as a table page regardless of the line-ratio test.
TABLE_KEYWORD_HIT_THRESHOLD = 2

# --- Boilerplate / front-matter detection -------------------------------

BOILERPLATE_MARKERS = [
    r"ISBN\s*97[89]",
    r"Creative Commons",
    r"CC BY-NC-SA",
    r"All rights reserved",
    r"Suggested citation",
    r"WHO Library Cataloguing",
]

BOILERPLATE_RE = re.compile("|".join(BOILERPLATE_MARKERS), re.IGNORECASE)

# Only the first N pages of a document are eligible to be flagged as
# boilerplate. Legal/citation text appearing deep in a document (e.g. in
# an appendix) is NOT boilerplate and must not be dropped.
BOILERPLATE_MAX_PAGE_INDEX = 3

# A candidate boilerplate page must have a high density of marker hits
# relative to its length to be excluded (avoids nuking a real content
# page that happens to mention "Suggested citation" once in a footnote).
BOILERPLATE_MIN_MARKER_HITS = 2

# --- Running header/footer detection ------------------------------------

# A line is considered a repeating header/footer if a normalized version
# of it appears on at least this fraction of the document's pages.
REPEATED_LINE_MIN_PAGE_FRACTION = 0.4

# Only lines shorter than this are eligible (headers/footers are short;
# we never want to accidentally strip a real recurring clinical sentence).
REPEATED_LINE_MAX_WORDS = 12

# --- Multi-page table merge ---------------------------------------------

# Two consecutive table pages are merged into one continuous table block.
# When merging, we look for a repeated header: the first HEADER_PROBE_CHARS
# characters of page N's table text checked against page N-1's table text.
HEADER_PROBE_CHARS = 200
HEADER_SIMILARITY_THRESHOLD = 0.6


# ============================================================
# DATA MODELS
# ============================================================

@dataclass
class PageBlock:
    """
    One classified unit of a document: either a single narrative page,
    or a table block that may span multiple merged pages.
    """

    block_type: str  # "narrative" | "table"
    page_start: int
    page_end: int
    pages: list[int]
    text: str


@dataclass
class CleaningStats:
    document_id: str = ""
    input_pages: int = 0

    narrative_pages: int = 0
    table_pages: int = 0
    boilerplate_pages: int = 0

    table_blocks_after_merge: int = 0
    table_pages_merged: int = 0
    duplicate_headers_stripped: int = 0

    repeated_lines_removed: int = 0
    repeated_line_types: int = 0

    output_blocks: int = 0


# ============================================================
# TEXT HELPERS
# ============================================================

def normalize_line(line: str) -> str:
    line = line.strip().lower()
    line = re.sub(r"\s+", " ", line)
    line = re.sub(r"[^\w\s]", "", line)
    return line


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ0-9]+(?:[-'][A-Za-zÀ-ÖØ-öø-ÿ0-9]+)*", text))


# ============================================================
# STEP 1 — REPEATED HEADER/FOOTER REMOVAL
# ============================================================

def find_repeated_lines(pages: list[dict[str, Any]]) -> set[str]:
    """
    Find normalized lines that repeat across a large fraction of pages.
    These are almost always running headers/footers (e.g. document title
    printed on every page) rather than real content.
    """

    total_pages = len(pages)

    if total_pages == 0:
        return set()

    line_page_counts: Counter[str] = Counter()

    for page in pages:
        text = str(page.get("text") or "")
        seen_this_page: set[str] = set()

        for raw_line in text.split("\n"):
            normalized = normalize_line(raw_line)

            if not normalized:
                continue

            if word_count(raw_line) > REPEATED_LINE_MAX_WORDS:
                continue

            if normalized in seen_this_page:
                continue

            seen_this_page.add(normalized)
            line_page_counts[normalized] += 1

    threshold = max(3, int(total_pages * REPEATED_LINE_MIN_PAGE_FRACTION))

    return {
        line
        for line, count in line_page_counts.items()
        if count >= threshold
    }


def strip_repeated_lines(text: str, repeated_lines: set[str]) -> tuple[str, int]:

    if not repeated_lines:
        return text, 0

    kept_lines = []
    removed = 0

    for raw_line in text.split("\n"):
        normalized = normalize_line(raw_line)

        if normalized and normalized in repeated_lines:
            removed += 1
            continue

        kept_lines.append(raw_line)

    return "\n".join(kept_lines), removed


# ============================================================
# STEP 2 — PAGE CLASSIFICATION
# ============================================================

def classify_page(page_index: int, text: str) -> str:
    """
    Classify a single page as "boilerplate", "table", or "narrative".
    page_index is 0-based position within the document.
    """

    if not text.strip():
        return "narrative"

    # --- Boilerplate check (front matter only) ---
    if page_index <= BOILERPLATE_MAX_PAGE_INDEX:
        marker_hits = len(BOILERPLATE_RE.findall(text))

        if marker_hits >= BOILERPLATE_MIN_MARKER_HITS:
            return "boilerplate"

    # --- Table check ---
    lines = [line for line in text.split("\n") if line.strip()]

    if not lines:
        return "narrative"

    short_line_count = sum(
        1 for line in lines if word_count(line) <= TABLE_LINE_MAX_WORDS
    )

    short_line_ratio = short_line_count / len(lines)

    keyword_hits = len(set(TABLE_KEYWORD_RE.findall(text)))

    if keyword_hits >= TABLE_KEYWORD_HIT_THRESHOLD:
        return "table"

    if short_line_ratio >= TABLE_LINE_RATIO_THRESHOLD and keyword_hits >= 1:
        return "table"

    return "narrative"


# ============================================================
# STEP 3 — TABLE MERGE + DUPLICATE HEADER STRIPPING
# ============================================================

def strip_duplicate_header(previous_text: str, current_text: str) -> tuple[str, bool]:
    """
    If current_text starts with a near-duplicate of a header that already
    appears in previous_text (typical of multi-page GRADE tables where the
    column header repeats on every page), remove that duplicated prefix
    from current_text.
    """

    probe = current_text[:HEADER_PROBE_CHARS]

    if not probe.strip():
        return current_text, False

    matcher = SequenceMatcher(None, previous_text[-2000:], probe)
    match = matcher.find_longest_match(0, len(previous_text[-2000:]), 0, len(probe))

    if match.size < 30:
        return current_text, False

    matched_fragment = probe[match.b : match.b + match.size]
    similarity = SequenceMatcher(None, matched_fragment, probe[: match.size]).ratio()

    if similarity < HEADER_SIMILARITY_THRESHOLD:
        return current_text, False

    # Strip the duplicated header fragment from the start of current_text.
    cleaned = current_text[match.b + match.size :].lstrip()

    if not cleaned:
        return current_text, False

    return cleaned, True


def build_blocks(
    document_id: str,
    pages: list[dict[str, Any]],
    classifications: list[str],
) -> tuple[list[PageBlock], int, int]:
    """
    Walk pages in order and build the final block list:
        - consecutive "table" pages -> merged into one table block
        - "narrative" pages -> one block each
        - "boilerplate" pages -> excluded entirely
    """

    blocks: list[PageBlock] = []

    pages_merged = 0
    duplicate_headers_stripped = 0

    i = 0
    n = len(pages)

    while i < n:

        label = classifications[i]
        page_number = int(pages[i]["page"])
        text = str(pages[i].get("text") or "")

        if label == "boilerplate":
            i += 1
            continue

        if label == "narrative":
            if text.strip():
                blocks.append(
                    PageBlock(
                        block_type="narrative",
                        page_start=page_number,
                        page_end=page_number,
                        pages=[page_number],
                        text=text,
                    )
                )
            i += 1
            continue

        # label == "table" -> gather the run of consecutive table pages
        run_pages = [page_number]
        run_texts = [text]

        # Compare every subsequent page against the FIRST page's text
        # (not the previous page's already-cleaned text). A repeating
        # table header is identical across every page of the run, but
        # after stripping it from page N, page N no longer contains it
        # to match against for page N+1 — comparing against the first
        # page keeps the reference stable for the whole run.
        header_reference = text

        j = i + 1

        while j < n and classifications[j] == "table":
            next_page_number = int(pages[j]["page"])
            next_text = str(pages[j].get("text") or "")

            cleaned_next, stripped = strip_duplicate_header(
                header_reference,
                next_text,
            )

            if stripped:
                duplicate_headers_stripped += 1

            run_pages.append(next_page_number)
            run_texts.append(cleaned_next)

            pages_merged += 1
            j += 1

        merged_text = "\n\n".join(t for t in run_texts if t.strip())

        if merged_text.strip():
            blocks.append(
                PageBlock(
                    block_type="table",
                    page_start=run_pages[0],
                    page_end=run_pages[-1],
                    pages=run_pages,
                    text=merged_text,
                )
            )

        i = j

    return blocks, pages_merged, duplicate_headers_stripped


# ============================================================
# DOCUMENT PROCESSING
# ============================================================

def process_document(document: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:

    document_id = document.get("document_id", "unknown_document")
    pages = document.get("pages", [])

    print()
    print("=" * 80)
    print(f"DOCUMENT: {document_id}")
    print("=" * 80)
    print(f"Input pages: {len(pages)}")

    if not pages:
        report = {
            "document_id": document_id,
            "status": "no_pages",
        }
        return {"document_id": document_id, "pages": [], "blocks": []}, report

    # --------------------------------------------------------
    # 1. Remove running headers/footers
    # --------------------------------------------------------

    repeated_lines = find_repeated_lines(pages)

    total_removed = 0
    cleaned_pages: list[dict[str, Any]] = []

    for page in pages:
        text = str(page.get("text") or "")
        cleaned_text, removed = strip_repeated_lines(text, repeated_lines)
        total_removed += removed

        cleaned_pages.append(
            {
                "page": page["page"],
                "text": cleaned_text,
            }
        )

    print(f"Repeated header/footer line types found: {len(repeated_lines)}")
    print(f"Repeated lines stripped (total instances): {total_removed}")

    # --------------------------------------------------------
    # 2. Classify every page
    # --------------------------------------------------------

    classifications = [
        classify_page(idx, page["text"])
        for idx, page in enumerate(cleaned_pages)
    ]

    narrative_count = classifications.count("narrative")
    table_count = classifications.count("table")
    boilerplate_count = classifications.count("boilerplate")

    print(
        f"Page classification -> narrative: {narrative_count}, "
        f"table: {table_count}, boilerplate: {boilerplate_count}"
    )

    # --------------------------------------------------------
    # 3. Merge consecutive table pages + strip duplicate headers
    # --------------------------------------------------------

    blocks, pages_merged, duplicate_headers_stripped = build_blocks(
        document_id,
        cleaned_pages,
        classifications,
    )

    table_blocks = [b for b in blocks if b.block_type == "table"]
    narrative_blocks = [b for b in blocks if b.block_type == "narrative"]

    print(
        f"Output blocks: {len(blocks)} "
        f"(table: {len(table_blocks)}, narrative: {len(narrative_blocks)})"
    )
    print(f"Table pages merged into multi-page tables: {pages_merged}")
    print(f"Duplicate table headers stripped: {duplicate_headers_stripped}")

    # --------------------------------------------------------
    # 4. Build stats + output document
    # --------------------------------------------------------

    stats = CleaningStats(
        document_id=document_id,
        input_pages=len(pages),
        narrative_pages=narrative_count,
        table_pages=table_count,
        boilerplate_pages=boilerplate_count,
        table_blocks_after_merge=len(table_blocks),
        table_pages_merged=pages_merged,
        duplicate_headers_stripped=duplicate_headers_stripped,
        repeated_lines_removed=total_removed,
        repeated_line_types=len(repeated_lines),
        output_blocks=len(blocks),
    )

    output_document = {
        "document_id": document_id,
        "source": document.get("source"),
        "year": document.get("year"),
        "topic": document.get("topic"),
        "cleaner_version": CLEANER_VERSION,
        "blocks": [asdict(block) for block in blocks],
    }

    report = {
        "document_id": document_id,
        "status": "success",
        "statistics": asdict(stats),
    }

    return output_document, report


# ============================================================
# I/O HELPERS
# ============================================================

def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path: Path, data: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


# ============================================================
# MAIN
# ============================================================

def main() -> None:

    print("=" * 80)
    print("MATERNAL MEDICAL RAG")
    print("STAGE 02 — CLEANING + TABLE-AWARE SEGMENTATION")
    print("=" * 80)
    print(f"Cleaner version : {CLEANER_VERSION}")
    print(f"Input directory : {INPUT_DIR}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    if not INPUT_DIR.exists():
        raise FileNotFoundError(
            f"Input directory not found:\n{INPUT_DIR}\n"
            f"Run parse_documents.py first."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    input_files = sorted(INPUT_DIR.glob("*.json"))

    if not input_files:
        raise FileNotFoundError(f"No parsed JSON files found in:\n{INPUT_DIR}")

    print(f"Documents found: {len(input_files)}")

    all_reports: list[dict[str, Any]] = []
    failed_documents = 0

    for path in input_files:

        try:
            document = load_json(path)
            document_id = document.get("document_id", path.stem)

            output_document, report = process_document(document)

            output_path = OUTPUT_DIR / f"{document_id}_cleaned.json"
            save_json(output_path, output_document)

            print(f"Output: {output_path}")

            all_reports.append({"input": str(path), "output": str(output_path), **report})

        except Exception as exc:
            failed_documents += 1
            print()
            print(f"❌ FAILED: {path.name}")
            print(f"   Error: {exc}")

            all_reports.append({"input": str(path), "status": "failed", "error": str(exc)})

    global_report = {
        "cleaner_version": CLEANER_VERSION,
        "input_directory": str(INPUT_DIR),
        "output_directory": str(OUTPUT_DIR),
        "configuration": {
            "table_line_max_words": TABLE_LINE_MAX_WORDS,
            "table_line_ratio_threshold": TABLE_LINE_RATIO_THRESHOLD,
            "table_keyword_hit_threshold": TABLE_KEYWORD_HIT_THRESHOLD,
            "boilerplate_max_page_index": BOILERPLATE_MAX_PAGE_INDEX,
            "boilerplate_min_marker_hits": BOILERPLATE_MIN_MARKER_HITS,
            "repeated_line_min_page_fraction": REPEATED_LINE_MIN_PAGE_FRACTION,
            "header_similarity_threshold": HEADER_SIMILARITY_THRESHOLD,
        },
        "summary": {
            "documents_found": len(input_files),
            "documents_successful": len(input_files) - failed_documents,
            "documents_failed": failed_documents,
        },
        "documents": all_reports,
    }

    save_json(CLEANING_REPORT_PATH, global_report)

    print()
    print("=" * 80)
    print("CLEANING COMPLETE")
    print("=" * 80)
    print(f"Documents successful: {len(input_files) - failed_documents}")
    print(f"Documents failed    : {failed_documents}")
    print(f"Cleaning report     : {CLEANING_REPORT_PATH}")

    if failed_documents == 0:
        print()
        print("STATUS: ✅ STAGE 02 COMPLETE")
    else:
        print()
        print("STATUS: ⚠️ COMPLETED WITH DOCUMENT ERRORS")


if __name__ == "__main__":
    main()