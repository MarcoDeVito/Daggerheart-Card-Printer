import json
import re
from pathlib import Path

CARDS_PATH = Path("cardsITA.json")
TEMPLATES_PATH = Path("templates.it.json")

OUT_TEMPLATES = Path("templates_with_realcardid.json")
OUT_REPORT = Path("match_report.json")

# Se vuoi match più "tollerante", lascia True.
# Con True: confronta case-insensitive, trim, spazi multipli normalizzati.
NORMALIZE_NAMES = True


def norm_name(s: str) -> str:
    if s is None:
        return ""
    s = str(s).strip()
    if NORMALIZE_NAMES:
        s = s.casefold()
        s = re.sub(r"\s+", " ", s)
    return s


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def main():
    cards = load_json(CARDS_PATH)
    templates = load_json(TEMPLATES_PATH)

    # cards.json: mi aspetto una struttura tipo {"meta":..., "cards":[...]}
    cards_list = cards.get("cards", [])
    allowed_kinds = {"ancestry", "community", "domain"}

    # lookup: (kind, normalized_name) -> id
    lookup = {}
    duplicates = []

    for c in cards_list:
        kind = (c.get("kind") or "").strip().lower()
        if kind not in allowed_kinds:
            continue

        name = norm_name(c.get("name", ""))
        cid = str(c.get("id", "")).strip()

        if not name or not cid:
            continue

        key = (kind, name)
        if key in lookup and lookup[key] != cid:
            duplicates.append(
                {"kind": kind, "name": c.get("name", ""), "id1": lookup[key], "id2": cid}
            )
        else:
            lookup[key] = cid

    # templates.json: mi aspetto sezioni tipo "ancestry": [...], "community": [...], "domain": [...]
    report = {
        "updated_sections": [],
        "missing_matches": [],
        "cards_duplicates_same_kind_name": duplicates,
    }

    for section in ["ancestry", "community", "domain"]:
        if section not in templates or not isinstance(templates[section], list):
            continue

        updated = 0
        missing = 0

        for entry in templates[section]:
            if not isinstance(entry, dict):
                continue

            tname_raw = entry.get("name", "")
            tname = norm_name(tname_raw)

            key = (section, tname)
            found_id = lookup.get(key, "")

            entry["realcardid"] = found_id  # <-- la chiave che vuoi aggiungere

            if found_id:
                updated += 1
            else:
                missing += 1
                report["missing_matches"].append(
                    {"section": section, "name": tname_raw, "template_id": entry.get("id", "")}
                )

        report["updated_sections"].append(
            {"section": section, "matched": updated, "missing": missing, "total": len(templates[section])}
        )

    # Salvataggi
    OUT_TEMPLATES.write_text(json.dumps(templates, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"OK -> scritto: {OUT_TEMPLATES}")
    print(f"Report -> scritto: {OUT_REPORT}")


if __name__ == "__main__":
    main()
