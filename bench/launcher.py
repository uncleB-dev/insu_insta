import subprocess
import sys
import time
import webbrowser
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
URL = "https://insta-ocr.unclebstudio.com"
FLASK_SCRIPT = os.path.join(BASE_DIR, "app.py")

CREATE_NEW_CONSOLE = 0x00000010  # Windows: 별도 창으로 실행

def start_flask():
    return subprocess.Popen(
        [sys.executable, FLASK_SCRIPT],
        cwd=BASE_DIR,
        creationflags=CREATE_NEW_CONSOLE,
    )

def start_tunnel():
    return subprocess.Popen(
        ["cloudflared", "tunnel", "run", "instagram-ocr"],
        cwd=BASE_DIR,
        creationflags=CREATE_NEW_CONSOLE,
    )

def main():
    print("=" * 45)
    print("   📸 Instagram OCR 추출기 실행 중...")
    print("=" * 45)

    print("\n[1/3] Flask 서버 시작...")
    start_flask()

    print("[2/3] Cloudflare 터널 시작...")
    start_tunnel()

    print("[3/3] 브라우저 열기 (5초 대기)...")
    for i in range(5, 0, -1):
        print(f"      {i}초...", end="\r")
        time.sleep(1)

    webbrowser.open(URL)

    print(f"\n✅ 완료! 브라우저에서 {URL} 열었습니다.")
    print("\n이 창은 닫아도 됩니다. Flask/터널은 계속 실행 중.")
    time.sleep(3)

if __name__ == "__main__":
    main()
