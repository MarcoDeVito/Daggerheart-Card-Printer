import json
from pathlib import Path

OUT_PATH = Path("data/cards.json")

TOTAL_CARDS = 270  # DH Core xxx/270
FRONT_DIR = "assets/front"
THUMB_DIR = "assets/thumbs"
BACK_IMAGE = "assets/back/back.webp"

def z3(n: int) -> str:
    return f"{n:03d}"

def main():
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    cards = []
    for n in range(1, TOTAL_CARDS + 1):
        i = z3(n)
        cards.append({
            "id": i,
            "kind": "unknown",
            "label": f"Card {i}",
            "front": f"{FRONT_DIR}/{i}.webp",
            "thumb": f"{THUMB_DIR}/{i}.webp",
            "tags": []
        })

    data = {
        "meta": {
            "version": 1,
            "backImage": BACK_IMAGE,
            "frontDir": FRONT_DIR,
            "thumbDir": THUMB_DIR
        },
        "cards": cards
    }

    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: scritto {OUT_PATH} con {TOTAL_CARDS} carte.")

if __name__ == "__main__":
    main()
