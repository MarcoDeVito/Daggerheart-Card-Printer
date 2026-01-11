import json
from pathlib import Path

CARDS_JSON = Path("data/cards.json")

# nuove carte da inserire / sovrascrivere
NEW_CARDS = [
    { "id": "073", "name": "Highborne",   "kind": "community", "front": "assets/front/073.webp", "thumb": "assets/thumbs/073.webp", "tags": [] },
    { "id": "074", "name": "Loreborne",   "kind": "community", "front": "assets/front/074.webp", "thumb": "assets/thumbs/074.webp", "tags": [] },
    { "id": "075", "name": "Orderborne",  "kind": "community", "front": "assets/front/075.webp", "thumb": "assets/thumbs/075.webp", "tags": [] },
    { "id": "076", "name": "Ridgeborne",  "kind": "community", "front": "assets/front/076.webp", "thumb": "assets/thumbs/076.webp", "tags": [] },
    { "id": "077", "name": "Seaborne",    "kind": "community", "front": "assets/front/077.webp", "thumb": "assets/thumbs/077.webp", "tags": [] },
    { "id": "078", "name": "Slyborne",    "kind": "community", "front": "assets/front/078.webp", "thumb": "assets/thumbs/078.webp", "tags": [] },
    { "id": "079", "name": "Underborne",  "kind": "community", "front": "assets/front/079.webp", "thumb": "assets/thumbs/079.webp", "tags": [] },
    { "id": "080", "name": "Wanderborne", "kind": "community", "front": "assets/front/080.webp", "thumb": "assets/thumbs/080.webp", "tags": [] },
    { "id": "081", "name": "Wildborne",   "kind": "community", "front": "assets/front/081.webp", "thumb": "assets/thumbs/081.webp", "tags": [] },

    { "id": "055", "name": "Simiah",   "kind": "ancestry", "front": "assets/front/055.webp", "thumb": "assets/thumbs/055.webp", "tags": [] },
    { "id": "056", "name": "Clank",    "kind": "ancestry", "front": "assets/front/056.webp", "thumb": "assets/thumbs/056.webp", "tags": [] },
    { "id": "057", "name": "Drakona",  "kind": "ancestry", "front": "assets/front/057.webp", "thumb": "assets/thumbs/057.webp", "tags": [] },
    { "id": "058", "name": "Dwarf",    "kind": "ancestry", "front": "assets/front/058.webp", "thumb": "assets/thumbs/058.webp", "tags": [] },
    { "id": "059", "name": "Elf",      "kind": "ancestry", "front": "assets/front/059.webp", "thumb": "assets/thumbs/059.webp", "tags": [] },
    { "id": "060", "name": "Faerie",   "kind": "ancestry", "front": "assets/front/060.webp", "thumb": "assets/thumbs/060.webp", "tags": [] },
    { "id": "061", "name": "Faun",     "kind": "ancestry", "front": "assets/front/061.webp", "thumb": "assets/thumbs/061.webp", "tags": [] },
    { "id": "062", "name": "Firbolg",  "kind": "ancestry", "front": "assets/front/062.webp", "thumb": "assets/thumbs/062.webp", "tags": [] },
    { "id": "063", "name": "Fungril",  "kind": "ancestry", "front": "assets/front/063.webp", "thumb": "assets/thumbs/063.webp", "tags": [] },
    { "id": "064", "name": "Galapa",   "kind": "ancestry", "front": "assets/front/064.webp", "thumb": "assets/thumbs/064.webp", "tags": [] },
    { "id": "065", "name": "Giant",    "kind": "ancestry", "front": "assets/front/065.webp", "thumb": "assets/thumbs/065.webp", "tags": [] },
    { "id": "066", "name": "Goblin",   "kind": "ancestry", "front": "assets/front/066.webp", "thumb": "assets/thumbs/066.webp", "tags": [] },
    { "id": "067", "name": "Halfling", "kind": "ancestry", "front": "assets/front/067.webp", "thumb": "assets/thumbs/067.webp", "tags": [] },
    { "id": "068", "name": "Human",    "kind": "ancestry", "front": "assets/front/068.webp", "thumb": "assets/thumbs/068.webp", "tags": [] },
    { "id": "069", "name": "Infernis", "kind": "ancestry", "front": "assets/front/069.webp", "thumb": "assets/thumbs/069.webp", "tags": [] },
    { "id": "070", "name": "Katari",   "kind": "ancestry", "front": "assets/front/070.webp", "thumb": "assets/thumbs/070.webp", "tags": [] },
    { "id": "071", "name": "Orc",      "kind": "ancestry", "front": "assets/front/071.webp", "thumb": "assets/thumbs/071.webp", "tags": [] },
    { "id": "072", "name": "Ribbet",   "kind": "ancestry", "front": "assets/front/072.webp", "thumb": "assets/thumbs/072.webp", "tags": [] }
]

def main():
    data = json.loads(CARDS_JSON.read_text(encoding="utf-8"))

    cards = data["cards"]
    index_by_id = {c["id"]: i for i, c in enumerate(cards)}

    for new in NEW_CARDS:
        card = {
            "id": new["id"],
            "kind": new["kind"],
            "label": new["name"],
            "front": new["front"],
            "thumb": new["thumb"],
            "tags": new["tags"],
        }

        if new["id"] in index_by_id:
            cards[index_by_id[new["id"]]] = card
        else:
            cards.append(card)

    CARDS_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

    print("cards.json aggiornato (community + ancestry)")

if __name__ == "__main__":
    main()
