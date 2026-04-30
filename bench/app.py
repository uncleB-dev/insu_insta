import os
import re
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

import instagram_service
import gemini_service

load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

ERROR_MESSAGES = {
    "INVALID_URL": "올바른 인스타그램 URL을 입력해주세요 (예: https://www.instagram.com/p/...)",
    "PRIVATE_POST": "비공개 게시물은 접근할 수 없습니다",
    "DOWNLOAD_FAILED": "게시물 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요",
    "OCR_FAILED": "이미지 텍스트 추출에 실패했습니다",
    "NO_API_KEY": "GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요",
}


def parse_caption(raw_caption: str) -> tuple[str, list[str]]:
    hashtags = re.findall(r'#\S+', raw_caption)
    caption_text = re.sub(r'#\S+', '', raw_caption).strip()
    caption_text = re.sub(r'\n{3,}', '\n\n', caption_text).strip()
    return caption_text, hashtags


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/api/extract", methods=["POST"])
def extract():
    if not GEMINI_API_KEY:
        return jsonify({"error": ERROR_MESSAGES["NO_API_KEY"], "code": "NO_API_KEY"}), 500

    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()

    if not url:
        return jsonify({"error": ERROR_MESSAGES["INVALID_URL"], "code": "INVALID_URL"}), 400

    post = None
    try:
        post = instagram_service.download(url, TEMP_DIR)
    except ValueError:
        return jsonify({"error": ERROR_MESSAGES["INVALID_URL"], "code": "INVALID_URL"}), 400
    except Exception as e:
        err_str = str(e).lower()
        if "private" in err_str or "login" in err_str:
            return jsonify({"error": ERROR_MESSAGES["PRIVATE_POST"], "code": "PRIVATE_POST"}), 403
        return jsonify({"error": ERROR_MESSAGES["DOWNLOAD_FAILED"], "code": "DOWNLOAD_FAILED"}), 500

    try:
        ocr_results = gemini_service.ocr_images(post.image_paths, GEMINI_API_KEY)
    except Exception as e:
        return jsonify({"error": ERROR_MESSAGES["OCR_FAILED"], "code": "OCR_FAILED"}), 500
    finally:
        instagram_service.cleanup(post.shortcode, TEMP_DIR)

    caption_text, hashtags = parse_caption(post.caption)

    return jsonify({
        "shortcode": post.shortcode,
        "caption": post.caption,
        "caption_text": caption_text,
        "hashtags": hashtags,
        "image_count": len(ocr_results),
        "images": [
            {
                "index": r.index,
                "thumbnail": r.thumbnail_b64,
                "ocr_text": r.ocr_text,
            }
            for r in ocr_results
        ],
    })


if __name__ == "__main__":
    print("🚀 Instagram OCR 추출기 시작: http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
