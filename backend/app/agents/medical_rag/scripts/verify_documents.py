"""
MATERNAL MEDICAL RAG
Stage 00 — Document Verification + Corpus Manifest

Same PDF integrity inspection as before (file existence, checksum, page
count, metadata preview), plus one addition: it now actually writes the
corpus_manifest.json that the Master Spec requires before any document
is allowed into the pipeline (Section 10 Step 2, Section 12, Section 31).

Without a manifest there is no record of which checksum/version was
indexed, which makes "supersede this guideline" (Section 31/66) and
"which build was clinically signed off" (Section 67) impossible to
answer later. This is intentionally a minimal, mechanical registration
step — license_status and source_url are left for a human to confirm,
never guessed.

Output:
    knowledge_base/corpus_manifest.json
"""

from pathlib import Path
import hashlib
import json
from datetime import datetime, timezone

import pymupdf


# ============================================================
# 1. Project Paths
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent
BASE_DIR = SCRIPT_DIR.parent
KNOWLEDGE_BASE_DIR = BASE_DIR / "knowledge_base"
MANIFEST_PATH = KNOWLEDGE_BASE_DIR / "corpus_manifest.json"


# ============================================================
# 2. Expected Documents
#
# license_status / source_url are placeholders that MUST be confirmed
# by a human before a document counts as "approved" per Rule 2 of the
# Master Spec ("Approved Corpus Only"). Leaving them as
# "unconfirmed" on purpose rather than guessing.
# ============================================================

DOCUMENTS = {
    "who_maternal_health_2025": {
        "filename": "who_maternal_health_2025.pdf",
        "organization": "WHO",
        "version": "2025",
        "license_status": "unconfirmed",
        "source_url": "unconfirmed",
    },
    "who_antenatal_care_2016": {
        "filename": "who_antenatal_care_2016.pdf",
        "organization": "WHO",
        "version": "2016",
        "license_status": "unconfirmed",
        "source_url": "unconfirmed",
    },
    "who_severe_hypertension_2018": {
        "filename": "who_severe_hypertension_2018.pdf",
        "organization": "WHO",
        "version": "2018",
        "license_status": "unconfirmed",
        "source_url": "unconfirmed",
    },
    "who_non_severe_hypertension_2020": {
        "filename": "who_non_severe_hypertension_2020.pdf",
        "organization": "WHO",
        "version": "2020",
        "license_status": "unconfirmed",
        "source_url": "unconfirmed",
    },
    "who_bp_self_monitoring_dak_2025": {
        "filename": "who_bp_self_monitoring_dak_2025.pdf",
        "organization": "WHO",
        "version": "2025",
        "license_status": "unconfirmed",
        "source_url": "unconfirmed",
    },
}


# ============================================================
# 3. SHA-256
# ============================================================

def calculate_sha256(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with file_path.open("rb") as file:
        while chunk := file.read(1024 * 1024):
            sha256.update(chunk)
    return sha256.hexdigest()


# ============================================================
# 4. PDF Inspection
# ============================================================

def inspect_pdf(document_id: str, file_path: Path) -> dict:

    print("=" * 80)
    print(f"DOCUMENT ID : {document_id}")
    print(f"FILE        : {file_path}")
    print("-" * 80)

    result = {
        "document_id": document_id,
        "filename": file_path.name,
        "file_exists": False,
        "checksum": None,
        "page_count": None,
        "size_mb": None,
        "status": "rejected",
    }

    if not file_path.exists():
        print("FILE EXISTS : ❌")
        print("STATUS      : ❌ FILE NOT FOUND")
        return result

    result["file_exists"] = True
    print("FILE EXISTS : ✅")

    file_size_mb = file_path.stat().st_size / (1024 * 1024)
    result["size_mb"] = round(file_size_mb, 2)
    print(f"SIZE        : {file_size_mb:.2f} MB")

    checksum = calculate_sha256(file_path)
    result["checksum"] = checksum
    print(f"SHA-256     : {checksum}")

    try:
        pdf = pymupdf.open(file_path)
    except Exception as e:
        print("PDF OPEN    : ❌")
        print(f"ERROR       : {e}")
        return result

    print("PDF OPEN    : ✅")

    page_count = len(pdf)
    result["page_count"] = page_count
    print(f"PAGES       : {page_count}")

    metadata = pdf.metadata
    print("\nPDF METADATA")
    print(f"Title       : {metadata.get('title')}")
    print(f"Author      : {metadata.get('author')}")
    print(f"Subject     : {metadata.get('subject')}")
    print(f"Creator     : {metadata.get('creator')}")
    print(f"Producer    : {metadata.get('producer')}")
    print(f"CreationDate: {metadata.get('creationDate')}")
    print(f"ModDate     : {metadata.get('modDate')}")

    if page_count > 0:
        first_page_text = pdf[0].get_text("text").strip()
        print("\nFIRST PAGE PREVIEW")
        print("-" * 80)
        if first_page_text:
            print(first_page_text[:1500])
        else:
            print("⚠️ No text extracted from first page.")

    pdf.close()

    result["status"] = "ingested"
    print("\nSTATUS      : ✅ INSPECTION COMPLETE")

    return result


# ============================================================
# 5. Manifest
# ============================================================

def build_manifest_entry(document_id: str, config: dict, inspection: dict) -> dict:

    return {
        "document_id": document_id,
        "organization": config["organization"],
        "version": config["version"],
        "filename": config["filename"],
        "checksum": inspection["checksum"],
        "page_count": inspection["page_count"],
        "size_mb": inspection["size_mb"],
        "license_status": config["license_status"],
        "source_url": config["source_url"],
        "status": inspection["status"],
        "superseded": False,
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }


def load_existing_manifest() -> dict:
    if MANIFEST_PATH.exists():
        with MANIFEST_PATH.open("r", encoding="utf-8") as file:
            return json.load(file)
    return {"documents": {}}


def write_manifest(manifest: dict) -> None:
    with MANIFEST_PATH.open("w", encoding="utf-8") as file:
        json.dump(manifest, file, ensure_ascii=False, indent=2)


# ============================================================
# 6. Main
# ============================================================

def main():

    print()
    print("=" * 80)
    print("MATERNAL MEDICAL RAG — DOCUMENT VALIDATION")
    print("=" * 80)
    print(f"Project root      : {BASE_DIR}")
    print(f"Knowledge base    : {KNOWLEDGE_BASE_DIR}")
    print()

    if not KNOWLEDGE_BASE_DIR.exists():
        print("❌ ERROR: knowledge_base directory does not exist.")
        return

    print("Knowledge base    : ✅ EXISTS")
    print()

    manifest = load_existing_manifest()
    rejected = []

    for document_id, config in DOCUMENTS.items():
        file_path = KNOWLEDGE_BASE_DIR / config["filename"]

        inspection = inspect_pdf(document_id, file_path)
        print()

        entry = build_manifest_entry(document_id, config, inspection)

        # If checksum changed vs. a previously registered version, mark
        # the old entry as superseded rather than silently overwriting
        # it (Master Spec Section 31 / 66 — supersession must be
        # explicit, historical provenance is never deleted).
        existing = manifest["documents"].get(document_id)
        if existing and existing.get("checksum") != entry["checksum"]:
            superseded_id = f"{document_id}__superseded_{existing['checksum'][:8]}"
            existing["superseded"] = True
            manifest["documents"][superseded_id] = existing

        manifest["documents"][document_id] = entry

        if inspection["status"] != "ingested":
            rejected.append(document_id)

    write_manifest(manifest)

    print("=" * 80)
    print("VALIDATION COMPLETE")
    print("=" * 80)
    print(f"Documents registered: {len(DOCUMENTS) - len(rejected)}")
    print(f"Documents rejected  : {len(rejected)}")

    if rejected:
        print(f"Rejected IDs        : {', '.join(rejected)}")

    print(f"Manifest written    : {MANIFEST_PATH}")

    print()
    print(
        "⚠️  license_status and source_url are placeholders. Confirm them "
        "manually before treating these documents as an approved corpus "
        "(Master Spec Rule 2)."
    )


# ============================================================
# 7. Entry Point
# ============================================================

if __name__ == "__main__":
    main()