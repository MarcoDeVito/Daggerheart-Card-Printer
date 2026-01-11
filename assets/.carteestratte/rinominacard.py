import re
import sys
from pathlib import Path

from PIL import Image, ImageOps
import pytesseract


# Se tesseract non è nel PATH, metti qui il percorso:
TESSERACT_EXE = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# Commenta la riga sotto se hai già tesseract nel PATH
pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXE


# Regex per pescare il numero
CARD_RE = re.compile(r"DH\s*Core\s*(\d{1,3})\s*/\s*270", re.IGNORECASE)


def crop_footer_region(img: Image.Image) -> Image.Image:
    """
    Ritaglia la zona dove di solito c'è: 'DH Core xxx/270'
    Coordinata RELATIVA (percentuale) così funziona con risoluzioni diverse.
    """
    w, h = img.size

    # Zona bassa centrale (tarata sul tipo di immagine che hai mostrato)
    left   = int(w * 0.30)
    right  = int(w * 0.70)
    top    = int(h * 0.90)
    bottom = int(h * 0.985)

    return img.crop((left, top, right, bottom))


def preprocess_for_ocr(crop: Image.Image) -> Image.Image:
    """
    Preprocess leggero: grayscale, autocontrast, ingrandimento, threshold.
    """
    g = ImageOps.grayscale(crop)
    g = ImageOps.autocontrast(g)

    # upscaling aiuta OCR
    scale = 3
    g = g.resize((g.size[0] * scale, g.size[1] * scale), Image.Resampling.LANCZOS)

    # threshold semplice
    g = g.point(lambda p: 255 if p > 175 else 0)
    return g


def extract_card_number(img: Image.Image) -> str | None:
    crop = crop_footer_region(img)
    pre = preprocess_for_ocr(crop)

    txt = pytesseract.image_to_string(pre, config="--psm 6")
    txt = " ".join(txt.split())

    m = CARD_RE.search(txt)
    if not m:
        return None

    num = int(m.group(1))
    return f"{num:03d}"


def convert_to_webp(src_path: Path, dst_path: Path) -> None:
    with Image.open(src_path) as im:
        im = im.convert("RGBA")
        im.save(dst_path, "WEBP", quality=92, method=6)


def main():
    if len(sys.argv) < 2:
        print("Uso: python rename_to_cardnumber_and_webp.py <cartella_immagini>")
        sys.exit(1)

    in_dir = Path(sys.argv[1]).expanduser().resolve()
    if not in_dir.exists() or not in_dir.is_dir():
        print(f"Cartella non valida: {in_dir}")
        sys.exit(1)

    out_dir = in_dir / "_webp_renamed"
    out_dir.mkdir(exist_ok=True)

    failed = []
    used = set()

    exts = {".png", ".jpg", ".jpeg", ".webp"}
    files = [p for p in in_dir.iterdir() if p.is_file() and p.suffix.lower() in exts]

    if not files:
        print("Nessuna immagine trovata nella cartella.")
        sys.exit(0)

    for p in sorted(files):
        try:
            with Image.open(p) as im:
                num = extract_card_number(im)

            if not num:
                failed.append(p.name)
                print(f"[SKIP] OCR fallito: {p.name}")
                continue

            base = num
            name = base
            i = 2
            while name in used or (out_dir / f"{name}.webp").exists():
                name = f"{base}_{i}"
                i += 1

            used.add(name)
            dst = out_dir / f"{name}.webp"

            convert_to_webp(p, dst)
            print(f"[OK] {p.name} -> {dst.name}")

        except Exception as e:
            failed.append(p.name)
            print(f"[ERR] {p.name}: {e}")

    if failed:
        log = out_dir / "_failed.txt"
        log.write_text("\n".join(failed), encoding="utf-8")
        print(f"\nFinito con errori: {len(failed)} file. Lista in: {log}")
    else:
        print("\nFinito! Tutto convertito e rinominato.")


if __name__ == "__main__":
    main()
