import re
import os
import glob as globmod
import shutil
from dataclasses import dataclass, field

import instaloader


@dataclass
class InstagramPost:
    shortcode: str
    caption: str
    image_paths: list[str] = field(default_factory=list)


def extract_shortcode(url: str) -> str:
    pattern = r'instagram\.com/(?:p|reel)/([A-Za-z0-9_-]+)'
    match = re.search(pattern, url)
    if not match:
        raise ValueError("INVALID_URL")
    return match.group(1)


def download(url: str, temp_dir: str) -> InstagramPost:
    shortcode = extract_shortcode(url)

    loader = instaloader.Instaloader(
        download_videos=False,
        download_video_thumbnails=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        post_metadata_txt_pattern="",
        filename_pattern="{shortcode}_{pc}",
    )

    post = instaloader.Post.from_shortcode(loader.context, shortcode)

    dest = os.path.join(temp_dir, shortcode)
    os.makedirs(dest, exist_ok=True)

    caption = post.caption or ""

    image_paths: list[str] = []

    if post.typename == "GraphSidecar":
        for i, node in enumerate(post.get_sidecar_nodes()):
            if node.is_video:
                continue
            # download_pic이 URL에서 확장자를 자동으로 붙이므로 base만 지정
            filename_base = os.path.join(dest, f"image_{i + 1:02d}")
            loader.download_pic(filename_base, node.display_url, post.date_utc)
            # 실제 저장된 파일을 glob으로 찾기 (확장자 불명확)
            actual = sorted(globmod.glob(filename_base + ".*"))
            if actual:
                image_paths.append(actual[0])
    else:
        filename_base = os.path.join(dest, "image_01")
        loader.download_pic(filename_base, post.url, post.date_utc)
        actual = sorted(globmod.glob(filename_base + ".*"))
        if actual:
            image_paths.append(actual[0])

    return InstagramPost(
        shortcode=shortcode,
        caption=caption,
        image_paths=sorted(image_paths),
    )


def cleanup(shortcode: str, temp_dir: str) -> None:
    dest = os.path.join(temp_dir, shortcode)
    if os.path.exists(dest):
        shutil.rmtree(dest, ignore_errors=True)
