import base64
import json
import re
from pathlib import Path
from typing import Any
from langchain_core.tools import tool


@tool
def extract_lab_from_image(image_path: str) -> dict:
    """Extract structured lab results from a medical test image using vision AI. Args: image_path: Path to the image file (JPG, PNG, PDF page screenshot)."""
    path = Path(image_path)
    if not path.exists():
        return {"error": f"File not found: {image_path}", "results": {}}

    suffix = path.suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}:
        return {"error": f"Unsupported image format: {suffix}", "results": {}}

    with open(path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    mime_map = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp",
        ".gif": "image/gif", ".bmp": "image/bmp",
    }
    mime_type = mime_map.get(suffix, "image/jpeg")

    return {
        "image_base64": image_data,
        "mime_type": mime_type,
        "file_name": path.name,
        "file_size_kb": round(path.stat().st_size / 1024, 1),
    }


@tool
def extract_lab_from_pdf(pdf_path: str, page: int = 0) -> dict:
    """Extract text and tables from a medical PDF lab report. Args: pdf_path: Path to the PDF file. page: Page number to extract (0-indexed, default first page)."""
    path = Path(pdf_path)
    if not path.exists():
        return {"error": f"File not found: {pdf_path}", "results": {}}

    try:
        import fitz
        doc = fitz.open(str(path))
        if page >= len(doc):
            page = 0

        total_pages = len(doc) if hasattr(doc, "__len__") else 1
        pg = doc[page]
        text = pg.get_text("text")

        tables = []
        try:
            for table in pg.find_tables():
                extracted = table.extract()
                if extracted:
                    tables.append(extracted)
        except Exception:
            pass

        images_info = []
        try:
            for img_index, img in enumerate(pg.get_images(full=True)):
                xref = img[0]
                base_image = doc.extract_image(xref)
                if base_image:
                    images_info.append({
                        "index": img_index,
                        "width": base_image.get("width", 0),
                        "height": base_image.get("height", 0),
                        "format": base_image.get("ext", "unknown"),
                        "base64": base64.b64encode(base_image["image"]).decode("utf-8"),
                        "mime_type": f"image/{base_image.get('ext', 'png')}",
                    })
        except Exception:
            pass

        doc.close()

        return {
            "text": text,
            "tables": tables,
            "images": images_info,
            "page": page,
            "total_pages": total_pages,
            "file_name": path.name,
        }
    except ImportError:
        return {"error": "pymupdf not installed. Run: pip install pymupdf", "results": {}}
    except Exception as e:
        return {"error": f"PDF extraction failed: {str(e)}", "results": {}}


def parse_lab_results_from_text(raw_text: str) -> dict[str, Any]:
    results = {}
    lines = raw_text.splitlines()

    pattern = re.compile(r"([A-Za-z0-9\s\-\.\(\)]+?)\s*[:\s]+\s*([\d,\.]+)\s*([A-Za-z/%µ]*)")

    for line in lines:
        line_clean = line.strip()
        if not line_clean or line_clean.startswith("="):
            continue

        match = pattern.search(line_clean)
        if match:
            raw_name = match.group(1).strip()
            name_parts = [p.strip() for p in raw_name.split() if p.strip()]
            if name_parts:
                cleaned_name = name_parts[-1] if len(name_parts[0]) > 20 else " ".join(name_parts)
                cleaned_name = re.sub(r"^(LOW|HIGH|NORMAL|CRITICAL)\s*", "", cleaned_name, flags=re.IGNORECASE).strip()
                cleaned_name = cleaned_name.rstrip(":")

                val_str = match.group(2).replace(",", "")
                unit_str = match.group(3).strip()

                try:
                    num_val = float(val_str)
                    if len(cleaned_name) > 1 and not cleaned_name.isdigit():
                        results[cleaned_name] = {
                            "value": num_val,
                            "unit": unit_str,
                            "raw": f"{val_str} {unit_str}".strip(),
                        }
                except ValueError:
                    continue

    return results
