"""
MATERNAL MEDICAL RAG
PDF → Text Parsing

Uses PyPDFLoader because the WHO PDFs are text-based.
No OCR.
No Docling.
No TableFormer.
"""

from pathlib import Path
import sys
import json
import re
from datetime import datetime

# ============================================================
# PATHS
# ============================================================

CURRENT_FILE = Path(__file__).resolve()

# scripts/
#   parse_documents.py
#
# medical_rag/
#   scripts/
#   knowledge_base/
#   processed/
#
PROJECT_ROOT = CURRENT_FILE.parent.parent

KNOWLEDGE_BASE = PROJECT_ROOT / "knowledge_base"
OUTPUT_DIR = PROJECT_ROOT / "processed" / "01_parsed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# DOCUMENT CONFIGURATION
# ============================================================

DOCUMENTS = [
    {
        "document_id": "who_maternal_health_2025",
        "filename": "who_maternal_health_2025.pdf",
        "source": "WHO",
        "year": 2025,
        "topic": "Maternal Health",
    },
    {
        "document_id": "who_antenatal_care_2016",
        "filename": "who_antenatal_care_2016.pdf",
        "source": "WHO",
        "year": 2016,
        "topic": "Antenatal Care",
    },
    {
        "document_id": "who_severe_hypertension_2018",
        "filename": "who_severe_hypertension_2018.pdf",
        "source": "WHO",
        "year": 2018,
        "topic": "Severe Hypertension",
    },
    {
        "document_id": "who_non_severe_hypertension_2020",
        "filename": "who_non_severe_hypertension_2020.pdf",
        "source": "WHO",
        "year": 2020,
        "topic": "Non-Severe Hypertension",
    },
    {
        "document_id": "who_bp_self_monitoring_dak_2025",
        "filename": "who_bp_self_monitoring_dak_2025.pdf",
        "source": "WHO",
        "year": 2025,
        "topic": "Blood Pressure Self-Monitoring",
    },
]


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text: str) -> str:
    """
    Clean extracted PDF text while preserving medical content.
    """

    if not text:
        return ""

    # Normalize line endings
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove null characters
    text = text.replace("\x00", "")

    # Fix excessive spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Remove spaces at beginning/end of lines
    lines = [
        line.strip()
        for line in text.split("\n")
    ]

    text = "\n".join(lines)

    return text.strip()


# ============================================================
# LOAD ONE DOCUMENT
# ============================================================

def parse_document(document_config: dict) -> bool:

    document_id = document_config["document_id"]
    filename = document_config["filename"]

    pdf_path = KNOWLEDGE_BASE / filename

    print("\n" + "=" * 80)
    print(f"DOCUMENT ID : {document_id}")
    print(f"FILE        : {filename}")
    print("-" * 80)

    # --------------------------------------------------------
    # Check file
    # --------------------------------------------------------

    if not pdf_path.exists():

        print("FILE EXISTS : ❌")
        print(f"Missing file: {pdf_path}")

        return False

    print("FILE EXISTS : ✅")

    # --------------------------------------------------------
    # Import PyPDFLoader
    # --------------------------------------------------------

    try:

        from langchain_community.document_loaders import PyPDFLoader

    except ImportError as e:

        print("\n❌ PyPDFLoader is not installed.")
        print("Run:")
        print("pip install langchain-community pypdf")

        print(f"\nOriginal error: {e}")

        return False

    # --------------------------------------------------------
    # Load PDF
    # --------------------------------------------------------

    print("PARSING     : PyPDFLoader...")

    try:

        loader = PyPDFLoader(str(pdf_path))

        pages = loader.load()

    except Exception as e:

        print("\n❌ Failed to parse PDF")
        print(f"Error: {e}")

        return False

    # --------------------------------------------------------
    # Process pages
    # --------------------------------------------------------

    parsed_pages = []

    total_characters = 0

    for page_number, page in enumerate(pages, start=1):

        text = clean_text(page.page_content)

        if not text:
            continue

        metadata = {
            "document_id": document_id,
            "source": document_config["source"],
            "year": document_config["year"],
            "topic": document_config["topic"],
            "filename": filename,
            "page": page_number,
            "file_type": "pdf",
            "parser": "PyPDFLoader",
        }

        parsed_page = {
            "page": page_number,
            "text": text,
            "metadata": metadata,
        }

        parsed_pages.append(parsed_page)

        total_characters += len(text)

    # --------------------------------------------------------
    # Statistics
    # --------------------------------------------------------

    total_pages = len(pages)
    pages_with_text = len(parsed_pages)

    print(f"PAGES       : {total_pages}")
    print(f"TEXT PAGES  : {pages_with_text}")
    print(f"CHARACTERS  : {total_characters:,}")

    if pages_with_text == 0:

        print("\n❌ No text extracted.")

        print(
            "This PDF may be scanned/image-based "
            "and would require OCR."
        )

        return False

    # --------------------------------------------------------
    # Output
    # --------------------------------------------------------

    output_file = OUTPUT_DIR / f"{document_id}.json"

    output_data = {
        "document_id": document_id,
        "filename": filename,
        "source": document_config["source"],
        "year": document_config["year"],
        "topic": document_config["topic"],
        "parser": "PyPDFLoader",
        "parsed_at": datetime.now().isoformat(),
        "statistics": {
            "total_pages": total_pages,
            "pages_with_text": pages_with_text,
            "total_characters": total_characters,
        },
        "pages": parsed_pages,
    }

    with open(
        output_file,
        "w",
        encoding="utf-8",
    ) as f:

        json.dump(
            output_data,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"OUTPUT      : {output_file}")
    print("STATUS      : ✅ SUCCESS")

    return True


# ============================================================
# MAIN
# ============================================================

def main():

    print("\n" + "=" * 80)
    print("MATERNAL MEDICAL RAG — DOCUMENT PARSING")
    print("=" * 80)

    print(f"Project root : {PROJECT_ROOT}")
    print(f"Knowledge KB : {KNOWLEDGE_BASE}")
    print(f"Output       : {OUTPUT_DIR}")

    print("\nParser       : PyPDFLoader")
    print("OCR          : Disabled")
    print("Docling      : Disabled")
    print("TableFormer  : Disabled")

    print("\n" + "=" * 80)

    successful = 0
    failed = 0

    for document in DOCUMENTS:

        success = parse_document(document)

        if success:
            successful += 1
        else:
            failed += 1

    # ========================================================
    # FINAL REPORT
    # ========================================================

    print("\n" + "=" * 80)
    print("PARSING COMPLETE")
    print("=" * 80)

    print(f"Successful : {successful}")
    print(f"Failed     : {failed}")
    print(f"Total      : {len(DOCUMENTS)}")

    print(f"\nOutput directory:")
    print(OUTPUT_DIR)

    if failed == 0:

        print("\n✅ ALL DOCUMENTS PARSED SUCCESSFULLY")

    else:

        print("\n⚠️ SOME DOCUMENTS FAILED")

    print("=" * 80)


if __name__ == "__main__":
    main()