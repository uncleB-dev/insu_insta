import base64
import os
from dataclasses import dataclass
from pathlib import Path

import google.generativeai as genai
from PIL import Image
import io

MODEL_ID = "gemini-3-flash-preview"

OCR_PROMPT = """이 이미지에 있는 모든 텍스트를 정확하게 추출해줘.
규칙:
- 텍스트가 없으면 빈 문자열만 반환
- 이미지에 보이는 그대로의 텍스트만 추출 (설명이나 해석 없이)
- 줄바꿈은 실제 줄바꿈으로 표시
- 한국어/영어 모두 정확하게
- 앞뒤 설명 문장 없이 텍스트만 바로 출력"""


@dataclass
class OcrResult:
    index: int
    ocr_text: str
    thumbnail_b64: str


def _make_thumbnail_b64(image_path: str, max_size: int = 200) -> str:
    with Image.open(image_path) as img:
        img.thumbnail((max_size, max_size), Image.LANCZOS)
        buf = io.BytesIO()
        img.convert("RGB").save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode()


def _read_image_bytes(image_path: str) -> bytes:
    with open(image_path, "rb") as f:
        return f.read()


def ocr_images(image_paths: list[str], api_key: str) -> list[OcrResult]:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODEL_ID)

    results: list[OcrResult] = []

    for i, path in enumerate(image_paths, start=1):
        if not os.path.exists(path):
            results.append(OcrResult(
                index=i,
                ocr_text=f"[파일을 찾을 수 없음: {os.path.basename(path)}]",
                thumbnail_b64="",
            ))
            continue

        try:
            image_bytes = _read_image_bytes(path)
            # 실제 확장자에 따라 mime type 결정
            ext = os.path.splitext(path)[1].lower()
            mime = "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
            image_part = {"mime_type": mime, "data": image_bytes}
            response = model.generate_content([OCR_PROMPT, image_part])
            ocr_text = response.text.strip() if response.text else ""
            thumbnail_b64 = _make_thumbnail_b64(path)
        except Exception as e:
            ocr_text = f"[OCR 실패: {str(e)}]"
            thumbnail_b64 = ""

        results.append(OcrResult(
            index=i,
            ocr_text=ocr_text,
            thumbnail_b64=f"data:image/jpeg;base64,{thumbnail_b64}" if thumbnail_b64 else "",
        ))

    return results
