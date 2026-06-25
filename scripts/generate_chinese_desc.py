"""Fetch Chinese descriptions from fengmowei/Elden-Ring-Document XML files.
The desc XML has one <text> entry per item (full description as a single string)."""

import json, os, re, urllib.request

BASE = "https://raw.githubusercontent.com/fengmowei/Elden-Ring-Document/main/text"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")

CATEGORIES = [
    ("weapon", ["armaments", "ammo"]),
    ("armor", ["armor"]),
    ("item", ["tools", "keys", "crafting-materials", "bolstering-materials"]),
    ("magic", ["spells"]),
    ("ash", ["ashes-of-war"]),
    ("talisman", ["talismans"]),
]

def fetch_xml(url):
    with urllib.request.urlopen(url, timeout=15) as f:
        text = f.read().decode('utf-8')
    return [m.strip() for m in re.findall(r'<text>\s*(.*?)\s*</text>', text)]

def load_existing_names():
    """Build set of English names from our ERDB data."""
    names = set()
    for fname in os.listdir(DATA_DIR):
        if not fname.endswith('.json') or fname in ('reinforcements.json',
            'correction-attack.json', 'correction-graph.json', 'shop.json',
            'gestures.json', 'info.json'):
            continue
        with open(os.path.join(DATA_DIR, fname), 'r', encoding='utf-8') as f:
            data = json.load(f)
        for item in data.values():
            n = item.get('name', '')
            if n:
                names.add(n)
    return names

def build_desc_map():
    erdb_names = load_existing_names()
    print(f"ERDB items: {len(erdb_names)}")

    desc_map = {}
    total_matched = 0
    total_unmatched = 0

    for prefix, erdb_keys in CATEGORIES:
        eng_name_url = f"{BASE}/eng/{prefix}_name.xml"
        chn_desc_url = f"{BASE}/chn/{prefix}_desc.xml"

        print(f"\n--- {prefix} ---")
        try:
            eng_names = fetch_xml(eng_name_url)
            chn_descs = fetch_xml(chn_desc_url)
        except Exception as e:
            print(f"  Fetch error: {e}")
            continue

        if len(eng_names) != len(chn_descs):
            print(f"  SKIP: eng_names={len(eng_names)} != chn_descs={len(chn_descs)}")
            continue

        matched = 0
        for eng_name, chn_desc in zip(eng_names, chn_descs):
            if eng_name in erdb_names and chn_desc.strip():
                desc_map[eng_name] = chn_desc
                matched += 1

        total_matched += matched
        total_unmatched += len(eng_names) - matched
        print(f"  Items: {len(eng_names)}, Descs extracted: {matched}")

    print(f"\nTotal matched: {total_matched}, Unmatched: {total_unmatched}")
    return desc_map

if __name__ == "__main__":
    print("Downloading and generating Chinese description map...")
    desc_map = build_desc_map()

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, "desc_map.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(desc_map, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(desc_map)} descriptions to {out_path}")
