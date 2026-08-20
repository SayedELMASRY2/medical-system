import fitz
import json
import unittest
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

from core.tools.ocr_tools import extract_lab_from_pdf, extract_lab_from_image, parse_lab_results_from_text
from agents.ocr_agent import create_ocr_agent
from api.app import create_api_app
from fastapi.testclient import TestClient


class TestOCRLivePipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.pdf_path = "/tmp/test_medical_lab_report.pdf"
        cls.img_path = "/tmp/test_medical_lab_report.png"

        doc = fitz.open()
        page = doc.new_page()
        text_content = (
            "=========================================\n"
            "        CAIRO LAB - TEST REPORT          \n"
            "Patient: Fatima Mansour   Date: 2026-08-20\n"
            "=========================================\n"
            "Hemoglobin              8.4 g/dL    LOW\n"
            "Platelets               92000 /uL   LOW\n"
            "Fasting Glucose         135 mg/dL   HIGH\n"
            "D-Dimer                 0.78 mg/L   HIGH\n"
            "Systolic BP             162 mmHg    HIGH\n"
            "Diastolic BP            105 mmHg    HIGH\n"
            "=========================================\n"
        )
        page.insert_text((50, 50), text_content, fontsize=12)
        doc.save(cls.pdf_path)
        doc.close()

        img = Image.new('RGB', (600, 400), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        d.text((20, 20), "MEDICAL LAB REPORT", fill=(0, 0, 0))
        d.text((20, 60), "Hemoglobin: 11.8 g/dL", fill=(0, 0, 0))
        d.text((20, 90), "Platelets: 215000 /uL", fill=(0, 0, 0))
        d.text((20, 120), "Glucose: 92 mg/dL", fill=(0, 0, 0))
        img.save(cls.img_path)

    def test_01_pdf_ocr_extraction(self):
        print("\n--- 1. Testing PDF OCR Extraction Tool ---")
        pdf_res = extract_lab_from_pdf.func(self.pdf_path, 0)
        self.assertIn("text", pdf_res)
        self.assertIsNotNone(pdf_res["text"])

        extracted_text = pdf_res["text"]
        print("✅ Raw PDF Extracted Text:\n", extracted_text.strip())

        parsed_labs = parse_lab_results_from_text(extracted_text)
        self.assertIn("Hemoglobin", parsed_labs)
        self.assertEqual(parsed_labs["Hemoglobin"]["value"], 8.4)
        self.assertIn("Platelets", parsed_labs)

        print("✅ Parsed PDF Lab Results Object:")
        for k, v in parsed_labs.items():
            print(f"   • {k}: {v['value']} {v['unit']}")

    def test_02_image_ocr_extraction(self):
        print("\n--- 2. Testing Image OCR Extraction Tool ---")
        img_res = extract_lab_from_image.func(self.img_path)
        self.assertIn("image_base64", img_res)
        self.assertEqual(img_res["file_name"], "test_medical_lab_report.png")
        print(f"✅ Image Base64 Encoded Successfully! Size: {img_res['file_size_kb']} KB")

    def test_03_ocr_agent_langgraph_node(self):
        print("\n--- 3. Testing OCR Agent LangGraph Node ---")
        ocr_agent = create_ocr_agent()

        state = {
            "messages": [],
            "pdf_input": self.pdf_path,
            "image_input": "",
            "patient": {"patient_id": "PT-TEST-OCR"},
        }
        out_state = ocr_agent(state)
        self.assertIn("lab_results", out_state)

        labs = out_state["lab_results"]
        self.assertIsNotNone(labs)
        print("✅ OCR Agent Executed Output State:")
        print("   Current Agent:", out_state.get("current_agent"))
        print("   Extracted Labs Count:", len(labs.get("results", {})))

    def test_04_fastapi_ocr_upload_endpoint(self):
        print("\n--- 4. Testing FastAPI /api/v1/chat/upload Endpoint ---")
        client = TestClient(create_api_app())

        with open(self.pdf_path, "rb") as f:
            res = client.post(
                "/api/v1/chat/upload",
                files={"file": ("lab_report.pdf", f, "application/pdf")},
            )

        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")

        print("✅ API Endpoint Response:")
        print("   HTTP Status:", res.status_code)
        print("   File Name:", data.get("file_name"))
        print("   Extracted Labs Count:", len(data.get("lab_results", {})))


if __name__ == "__main__":
    unittest.main()
