"""Download Chinese/English name XMLs from fengmowei repo and generate name mapping JSON."""

import json, os, re, urllib.request
from collections import OrderedDict

BASE = "https://raw.githubusercontent.com/fengmowei/Elden-Ring-Document/main/text"

# Category pairs: (eng_file, chn_file, erdb_key)
CATEGORIES = [
    ("weapon_name.xml", "weapon_name.xml", "armaments"),
    ("armor_name.xml", "armor_name.xml", "armor"),
    ("item_name.xml", "item_name.xml", None),  # tools + keys + materials
    ("magic_name.xml", "magic_name.xml", "spells"),
    ("ash_name.xml", "ash_name.xml", "ashes-of-war"),
    ("talisman_name.xml", "talisman_name.xml", "talismans"),
]

def fetch_xml(url):
    with urllib.request.urlopen(url) as f:
        text = f.read().decode('utf-8')
    return [m.strip() for m in re.findall(r'<text>\s*(.*?)\s*</text>', text)]

def build_map():
    mapping = {}

    for eng_file, chn_file, erdb_key in CATEGORIES:
        eng_url = f"{BASE}/eng/{eng_file}"
        chn_url = f"{BASE}/chn/{chn_file}"

        eng_names = fetch_xml(eng_url)
        chn_names = fetch_xml(chn_url)

        if len(eng_names) != len(chn_names):
            print(f"WARN: {eng_file}: eng={len(eng_names)} != chn={len(chn_names)}")
            continue

        for eng, chn in zip(eng_names, chn_names):
            eng_clean = eng.strip()
            chn_clean = chn.strip()
            if eng_clean and chn_clean:
                mapping[eng_clean] = chn_clean

    return mapping

if __name__ == "__main__":
    print("Downloading and parsing name XML files...")
    mapping = build_map()
    print(f"Generated {len(mapping)} name mappings")

    # Save to public/data for frontend use
    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "data")
    os.makedirs(out_dir, exist_ok=True)

    out_path = os.path.join(out_dir, "name_map.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

    print(f"Saved to {out_path}")
