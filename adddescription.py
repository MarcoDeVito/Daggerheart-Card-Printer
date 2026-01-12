import csv
import json
from pathlib import Path

CSV_PATH = "daggerheart_cards_fixed.csv"
JSON_PATH = "data/cards.json"
OUT_PATH = "data/cards_updated.json"


def load_csv(csv_path: Path) -> dict:
    mapping = {}

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")

        for row in reader:
            card_id = row["numero carta"].strip().zfill(3)
            mapping[card_id] = {
                "name": row["nome carta"].strip(),
                "description": row["descrizione"].strip(),
            }

    return mapping


def update_json(json_path: Path, csv_map: dict) -> dict:
    data = json.loads(json_path.read_text(encoding="utf-8"))
    updated = 0

    for card in data.get("cards", []):
        card_id = str(card.get("id", "")).strip().zfill(3)

        if card_id in csv_map:
            card["name"] = csv_map[card_id]["name"]
            card["description"] = csv_map[card_id]["description"]
            updated += 1

    print(f"Aggiornate {updated} carte")
    return data


def main():
    csv_map = load_csv(Path(CSV_PATH))
    updated_json = update_json(Path(JSON_PATH), csv_map)

    Path(OUT_PATH).write_text(
        json.dumps(updated_json, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"File salvato: {OUT_PATH}")


if __name__ == "__main__":
    main()
