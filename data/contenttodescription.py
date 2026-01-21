import json
from pathlib import Path

CARDS_PATH = Path("cardsITA.json")
TEMPLATES_PATH = Path("templates_with_realcardid.json")

OUT_CARDS = Path("cardsITA_with_descriptions.json")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main():
    cards_data = load_json(CARDS_PATH)
    templates = load_json(TEMPLATES_PATH)

    cards = cards_data.get("cards", [])

    # lookup id -> card
    cards_by_id = {str(c.get("id")): c for c in cards if "id" in c}

    updated = 0
    missing = 0

    for section in ["ancestry", "community", "domain"]:
        if section not in templates or not isinstance(templates[section], list):
            continue

        for tpl in templates[section]:
            realcardid = str(tpl.get("realcardid", "")).strip()
            content = tpl.get("content")

            if not realcardid or content is None:
                continue

            card = cards_by_id.get(realcardid)
            if not card:
                missing += 1
                continue

            card["description"] = content
            updated += 1

    OUT_CARDS.write_text(
        json.dumps(cards_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"OK: descriptions aggiornate -> {updated}")
    print(f"ID template senza card corrispondente -> {missing}")
    print(f"File scritto: {OUT_CARDS}")


if __name__ == "__main__":
    main()
