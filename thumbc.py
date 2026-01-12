from pathlib import Path
from PIL import Image

FRONT_DIR = Path("assets/frontITA")
THUMB_DIR = Path("assets/thumbsITA")

THUMB_MAX = 320
THUMB_QUALITY = 82

def make_thumb(src_path: Path, dst_path: Path):
    with Image.open(src_path) as im:
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        if im.mode == "RGBA":
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        im.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst_path, format="WEBP", quality=THUMB_QUALITY, method=6)

def main():
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    exts = {".png", ".jpg", ".jpeg", ".webp"}
    files = [p for p in FRONT_DIR.iterdir() if p.is_file() and p.suffix.lower() in exts]

    for src in sorted(files):
        stem = src.stem  # "001"
        if not (len(stem) == 3 and stem.isdigit()):
            continue
        make_thumb(src, THUMB_DIR / f"{stem}.webp")

    print("OK")

if __name__ == "__main__":
    main()
