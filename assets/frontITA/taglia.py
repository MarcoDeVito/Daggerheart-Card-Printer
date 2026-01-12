from PIL import Image
from pathlib import Path

# ====== CONFIG ======
INPUT_DIR = Path("input")     # cartella con i fogli (png/jpg/webp ecc.)
OUTPUT_DIR = Path("output")   # cartella di output
START_INDEX = 1               # da che numero partire (1 -> 001.webp)

SHEET_W_MM = 208.48
SHEET_H_MM = 284.74

CUT_X_MM = [69.49, 138.99]    # tagli verticali (x)
CUT_Y_MM = [94.92, 189.82]    # tagli orizzontali (y)

WEBP_QUALITY = 95
# ====================

def mm_to_px_x(mm: float, img_w: int) -> int:
    return int(round(mm / SHEET_W_MM * img_w))

def mm_to_px_y(mm: float, img_h: int) -> int:
    return int(round(mm / SHEET_H_MM * img_h))

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    exts = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"}
    files = sorted([p for p in INPUT_DIR.iterdir() if p.is_file() and p.suffix.lower() in exts])

    if not files:
        raise SystemExit(f"Nessun file immagine trovato in: {INPUT_DIR.resolve()}")

    idx = START_INDEX

    for sheet_path in files:
        with Image.open(sheet_path) as im:
            im = im.convert("RGBA")
            w, h = im.size

            x_cuts_px = [0] + [mm_to_px_x(x, w) for x in CUT_X_MM] + [w]
            y_cuts_px = [0] + [mm_to_px_y(y, h) for y in CUT_Y_MM] + [h]

            # 3 righe x 3 colonne, ordine: riga per riga (001-003, 004-006, 007-009)
            for r in range(3):
                for c in range(3):
                    left   = x_cuts_px[c]
                    right  = x_cuts_px[c + 1]
                    top    = y_cuts_px[r]
                    bottom = y_cuts_px[r + 1]

                    crop = im.crop((left, top, right, bottom))

                    out_name = f"{idx:03d}.webp"
                    out_path = OUTPUT_DIR / out_name
                    crop.save(out_path, format="WEBP", quality=WEBP_QUALITY, method=6)

                    idx += 1

    print(f"OK: salvate {idx - START_INDEX} carte in '{OUTPUT_DIR.resolve()}' (da {START_INDEX:03d}.webp)")

if __name__ == "__main__":
    main()
