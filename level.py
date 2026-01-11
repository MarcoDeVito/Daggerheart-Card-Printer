import json
from pathlib import Path

CARDS_PATH = Path("data/cards.json")
BACKUP_PATH = Path("data/cards.json.bak")

# sequenza livelli per OGNI dominio (21 carte)
LEVEL_PATTERN = [
    1,1,1,
    2,2,
    3,3,
    4,4,
    5,5,
    6,6,
    7,7,
    8,8,
    9,9,
    10,10
]

DOMAINS = [
    "Arcana",
    "Blade",
    "Bone",
    "Codex",
    "Grace",
    "Midnight",
    "Sage",
    "Splendor",
    "Valor"
]

def main():
    if not CARDS_PATH.exists():
        raise SystemExit(f"File non trovato: {CARDS_PATH.resolve()}")

    raw = CARDS_PATH.read_text(encoding="utf-8")
    data = json.loads(raw)

    cards = data.get("cards", [])
    updated = 0

    for domain in DOMAINS:
        # prendi tutte le carte di quel dominio
        domain_cards = [c for c in cards if c.get("kind") == "domain" and c.get("domain") == domain]

        # ordina per ID numerico
        domain_cards.sort(key=lambda c: int(c["id"]))

        if len(domain_cards) != len(LEVEL_PATTERN):
            print(f"⚠️ {domain}: trovate {len(domain_cards)} carte (attese {len(LEVEL_PATTERN)})")

        # assegna i livelli
        for i, card in enumerate(domain_cards):
            if i >= len(LEVEL_PATTERN):
                break
            card["level"] = LEVEL_PATTERN[i]
            updated += 1

    # backup
    BACKUP_PATH.write_text(raw, encoding="utf-8")

    # save
    CARDS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )

    print(f"OK: livelli aggiornati per {updated} carte dominio.")
    print(f"Backup creato: {BACKUP_PATH}")

if __name__ == "__main__":
    main()
