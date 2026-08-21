import re
from datetime import datetime
from typing import Any
from langchain_core.tools import tool


@tool
def parse_md_form(md_content: str) -> dict:
    """Parse a pregnancy daily tracking form from Markdown content. Handles both structured forms and OCR-scanned content. Args: md_content: Raw markdown content of the daily form."""
    result = {
        "date": _extract(md_content, r"(?:date|تاريخ|التاريخ)\s*[:\|]?\s*(.+)"),
        "gestational_week": _extract_int(md_content, r"(?:week|أسبوع|الأسبوع)\s*[:\|]?\s*(\d+)"),
        "gestational_day": _extract_int(md_content, r"(?:day|يوم|اليوم)\s*[:\|]?\s*(\d+)"),
        "weight": _extract_float(md_content, r"(?:weight|الوزن|وزن)\s*[:\|]?\s*([\d.]+)"),
        "blood_pressure": _extract_bp(md_content),
        "heart_rate": _extract_int(md_content, r"(?:heart\s*rate|نبض|النبض)\s*[:\|]?\s*(\d+)"),
        "temperature": _extract_float(md_content, r"(?:temp|temperature|الحرارة)\s*[:\|]?\s*([\d.]+)"),
        "fetal_movement": _extract(md_content, r"(?:fetal\s*movement|حركة الجنين)\s*[:\|]?\s*(.+)"),
        "symptoms": _extract_list_field(md_content, r"(?:symptoms?|أعراض|الأعراض)"),
        "medications": _extract_list_field(md_content, r"(?:medications?|أدوية|الأدوية)"),
        "notes": _extract(md_content, r"(?:notes?|ملاحظات)\s*[:\|]?\s*(.+)"),
        "mood": _extract(md_content, r"(?:mood|المزاج|مزاج)\s*[:\|]?\s*(.+)"),
        "sleep_hours": _extract_float(md_content, r"(?:sleep|نوم|النوم)\s*[:\|]?\s*([\d.]+)"),
        "water_intake": _extract_float(md_content, r"(?:water|ماء|الماء)\s*[:\|]?\s*([\d.]+)"),
        "exercise": _extract(md_content, r"(?:exercise|رياضة|تمارين)\s*[:\|]?\s*(.+)"),
        "concerns": _extract(md_content, r"(?:concerns?|مخاوف|قلق)\s*[:\|]?\s*(.+)"),
        "lab_results": _extract_lab(md_content),
        "parsed_at": datetime.now().isoformat(),
        "confidence": _calc_confidence(md_content),
    }

    return {k: v for k, v in result.items() if v is not None and v != "" and v != []}


def _extract(text: str, pattern: str) -> str | None:
    m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
    return m.group(1).strip() if m else None


def _extract_int(text: str, pattern: str) -> int | None:
    m = re.search(pattern, text, re.IGNORECASE)
    return int(m.group(1)) if m else None


def _extract_float(text: str, pattern: str) -> float | None:
    m = re.search(pattern, text, re.IGNORECASE)
    return float(m.group(1)) if m else None


def _extract_bp(text: str) -> dict | None:
    m = re.search(r"(?:blood\s*pressure|bp|ضغط)\s*[:\|]?\s*(\d+)\s*[/\\]\s*(\d+)", text, re.IGNORECASE)
    if m:
        return {"systolic": int(m.group(1)), "diastolic": int(m.group(2)), "display": f"{m.group(1)}/{m.group(2)}"}
    return None


def _extract_list_field(text: str, header_pattern: str) -> list[str]:
    pattern = header_pattern + r"\s*\n((?:\s*[-•*]\s*.+\n?)+)"
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        m2 = re.search(header_pattern + r"\s*[:\|]?\s*(.+)", text, re.IGNORECASE)
        if m2:
            return [i.strip() for i in re.split(r"[,،]+", m2.group(1)) if i.strip()]
        return []

    raw = m.group(1)
    return [line.strip().lstrip("-•* ").strip() for line in raw.split("\n") if line.strip()]


def _extract_lab(text: str) -> dict | None:
    pattern = r"(?:lab\s*results?|test\s*results?|تحاليل|نتائج)\s*\n((?:\s*[-•*]\s*.+\n?)+)"
    m = re.search(pattern, text, re.IGNORECASE)
    if not m:
        return None

    results = {}
    for line in m.group(1).split("\n"):
        line = line.strip().lstrip("-•* ")
        if ":" in line:
            k, v = line.split(":", 1)
            results[k.strip().strip("*")] = v.strip()
    return results if results else None


def _calc_confidence(text: str) -> float:
    markers = [r"(?:date|تاريخ)", r"(?:week|أسبوع)", r"(?:weight|الوزن)",
               r"(?:blood\s*pressure|ضغط)", r"(?:symptoms|أعراض)", r"(?:medications|أدوية)"]
    found = sum(1 for p in markers if re.search(p, text, re.IGNORECASE))
    return round(found / len(markers), 2)
