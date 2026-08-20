"""
MATERNAL MEDICAL RAG
Pipeline Orchestrator + Quality Gates

Was previously an empty file — the five stages existed as standalone
scripts with no single entry point, so there was no enforced ordering
and no gate stopping a broken stage from silently feeding a broken
input into the next one.

This runs:

    Stage 00  verify_documents.py   -> corpus_manifest.json
    Stage 01  parse_documents.py    -> processed/01_parsed/
    Stage 02  clean_documents.py    -> processed/02_cleaned/
    Stage 03  chunk_documents.py    -> processed/03_chunks/
    Stage 04  extract_qa.py         -> processed/04_quality/

...in order, and STOPS at the first stage whose quality gate fails,
per Master Spec Section 86 ("لا يجوز الانتقال للمرحلة التالية إذا
فشلت السابقة"). It does not retry or skip a failed gate automatically.

Usage:
    python main.py                 # run all stages
    python main.py --from 02       # resume from Stage 02
    python main.py --only 03       # run a single stage
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PROCESSED_DIR = PROJECT_ROOT / "processed"


STAGES = [
    {
        "id": "00",
        "name": "Verify Documents",
        "script": "verify_documents.py",
        "gate": lambda: gate_verify(),
    },
    {
        "id": "01",
        "name": "Parse Documents",
        "script": "parse_documents.py",
        "gate": lambda: gate_directory_nonempty(PROCESSED_DIR / "01_parsed", "*.json"),
    },
    {
        "id": "02",
        "name": "Clean Documents (table-aware segmentation)",
        "script": "clean_documents.py",
        "gate": lambda: gate_cleaning(),
    },
    {
        "id": "03",
        "name": "Chunk Documents (table-aware semantic chunking)",
        "script": "chunk_documents.py",
        "gate": lambda: gate_chunking(),
    },
    {
        "id": "04",
        "name": "Extract Gold QA Scaffold",
        "script": "extract_qa.py",
        "gate": lambda: gate_directory_nonempty(
            PROCESSED_DIR / "04_quality", "gold_test_set_template.json"
        ),
    },
]


# ============================================================
# GATES
#
# Each gate returns (passed: bool, message: str). A gate failing here
# means: do not proceed to the next stage. Fix the input/config and
# re-run this stage, not the whole pipeline.
# ============================================================

def gate_verify() -> tuple[bool, str]:
    manifest_path = PROJECT_ROOT / "knowledge_base" / "corpus_manifest.json"

    if not manifest_path.exists():
        return False, "corpus_manifest.json was not created."

    with manifest_path.open("r", encoding="utf-8") as file:
        manifest = json.load(file)

    documents = manifest.get("documents", {})
    ingested = [d for d in documents.values() if d.get("status") == "ingested"]
    rejected = [
        doc_id for doc_id, d in documents.items()
        if d.get("status") != "ingested" and not d.get("superseded")
    ]

    if rejected:
        return False, f"{len(rejected)} document(s) failed verification: {rejected}"

    if not ingested:
        return False, "No documents were ingested."

    return True, f"{len(ingested)} document(s) verified and registered in manifest."


def gate_directory_nonempty(directory: Path, pattern: str) -> tuple[bool, str]:
    if not directory.exists():
        return False, f"Output directory does not exist: {directory}"

    files = list(directory.glob(pattern))

    if not files:
        return False, f"No files matching '{pattern}' found in {directory}"

    return True, f"{len(files)} file(s) found in {directory.name}/"


def gate_cleaning() -> tuple[bool, str]:
    report_path = PROCESSED_DIR / "02_cleaned" / "cleaning_report.json"

    if not report_path.exists():
        return False, "cleaning_report.json was not created."

    with report_path.open("r", encoding="utf-8") as file:
        report = json.load(file)

    failed = report.get("summary", {}).get("documents_failed", 0)
    successful = report.get("summary", {}).get("documents_successful", 0)

    if failed > 0:
        return False, f"{failed} document(s) failed cleaning."

    if successful == 0:
        return False, "No documents were cleaned successfully."

    return True, f"{successful} document(s) cleaned successfully."


def gate_chunking() -> tuple[bool, str]:
    report_path = PROCESSED_DIR / "03_chunks" / "quality_report.json"

    if not report_path.exists():
        return False, "quality_report.json was not created."

    with report_path.open("r", encoding="utf-8") as file:
        report = json.load(file)

    failed = report.get("summary", {}).get("documents_failed", 0)

    if failed > 0:
        return False, f"{failed} document(s) failed chunking."

    # Roll up validation errors and clinical-review load across documents
    # so a broken chunking run cannot pass silently.
    total_validation_errors = 0
    total_needing_review = 0

    for doc_report in report.get("documents", []):
        validation = doc_report.get("validation", {})
        total_validation_errors += len(validation.get("errors", []))
        total_needing_review += doc_report.get("statistics", {}).get(
            "threshold_flagged_chunks", 0
        )

    if total_validation_errors > 0:
        return False, f"{total_validation_errors} chunk validation error(s) found."

    message = (
        f"Chunking passed. {total_needing_review} chunk(s) flagged "
        f"needs_clinical_review=true and are waiting in the review queue "
        f"before this corpus can be indexed (Master Spec Rule 2 / Section 16)."
    )
    return True, message


# ============================================================
# RUNNER
# ============================================================

def run_stage(stage: dict) -> bool:

    print()
    print("#" * 80)
    print(f"# STAGE {stage['id']} — {stage['name']}")
    print("#" * 80)

    script_path = SCRIPT_DIR / stage["script"]

    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=str(SCRIPT_DIR),
    )

    if result.returncode != 0:
        print()
        print(f"❌ STAGE {stage['id']} CRASHED (exit code {result.returncode})")
        return False

    passed, message = stage["gate"]()

    print()
    print(f"QUALITY GATE [{stage['id']}]: {'✅ PASS' if passed else '❌ FAIL'}")
    print(f"  {message}")

    return passed


def main() -> None:

    parser = argparse.ArgumentParser(description="Maternal Medical RAG pipeline orchestrator")
    parser.add_argument("--from", dest="from_stage", default=None, help="Resume from stage id (e.g. 02)")
    parser.add_argument("--only", dest="only_stage", default=None, help="Run only this stage id")
    args = parser.parse_args()

    stages_to_run = STAGES

    if args.only_stage:
        stages_to_run = [s for s in STAGES if s["id"] == args.only_stage]
        if not stages_to_run:
            print(f"Unknown stage id: {args.only_stage}")
            sys.exit(1)

    elif args.from_stage:
        ids = [s["id"] for s in STAGES]
        if args.from_stage not in ids:
            print(f"Unknown stage id: {args.from_stage}")
            sys.exit(1)
        start_index = ids.index(args.from_stage)
        stages_to_run = STAGES[start_index:]

    print("=" * 80)
    print("MATERNAL MEDICAL RAG — PIPELINE ORCHESTRATOR")
    print("=" * 80)
    print(f"Stages to run: {', '.join(s['id'] for s in stages_to_run)}")

    for stage in stages_to_run:
        passed = run_stage(stage)

        if not passed:
            print()
            print("=" * 80)
            print(f"🛑 PIPELINE STOPPED AT STAGE {stage['id']} — {stage['name']}")
            print("=" * 80)
            print(
                "Per Master Spec Section 86, the next stage will not run "
                "until this gate passes. Fix the issue and re-run:"
            )
            print(f"    python main.py --from {stage['id']}")
            sys.exit(1)

    print()
    print("=" * 80)
    print("✅ PIPELINE COMPLETE — ALL QUALITY GATES PASSED")
    print("=" * 80)
    print(
        "Note: this does NOT mean the corpus is release-ready. Chunks "
        "flagged needs_clinical_review=true still require sign-off "
        "before Stage 04 (embeddings/indexing) per Master Spec Section 67."
    )


if __name__ == "__main__":
    main()