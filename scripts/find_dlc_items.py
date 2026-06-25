#!/usr/bin/env python3
"""Find DLC items by cross-referencing ERDB base data with DLC FMG data."""
import json
from pathlib import Path

ERDB_DIR = Path("D:/Aporiyan/eldenring_wiki/public/data")
FMG_DIR = Path("D:/Aporiyan/eldenring_wiki/tmp_conv/fmg_json")

# Mapping: ERDB filename -> (FMG name prefix, output name)
CATEGORIES = {
    "armaments.json": "WeaponName",
    "armor.json": "ProtectorName",
    "talismans.json": "AccessoryName",
    "spells.json": "MagicName",
    "tools.json": "GoodsName",
    "ashes-of-war.json": "ArtsName",
}

def main():
    for erdb_file, fmg_prefix in CATEGORIES.items():
        # Load ERDB data
        with open(str(ERDB_DIR / erdb_file), "r", encoding="utf-8") as f:
            erdb_data = json.load(f)
        
        # Load FMG name data
        fmg_file = FMG_DIR / f"{fmg_prefix}.json"
        if not fmg_file.exists():
            print(f"  SKIP {fmg_prefix}: no FMG file")
            continue
        
        with open(str(fmg_file), "r", encoding="utf-8") as f:
            fmg_names = json.load(f)
        
        # Build set of existing ERDB IDs
        if isinstance(erdb_data, dict):
            existing_ids = set()
            for name, item in erdb_data.items():
                existing_ids.add(item["id"])
        elif isinstance(erdb_data, list):
            existing_ids = set(item["id"] for item in erdb_data)
        else:
            print(f"  SKIP {erdb_file}: unknown type {type(erdb_data)}")
            continue
        
        max_erdb = max(existing_ids) if existing_ids else 0
        
        # Find DLC items (IDs above max ERDB)
        fmg_ids = sorted(int(k) for k in fmg_names.keys())
        dlc_ids = [i for i in fmg_ids if i > max_erdb]
        
        # Filter out non-item IDs and ERROR entries
        dlc_items = []
        for i in dlc_ids:
            name = fmg_names.get(str(i), "")
            if not name or name in ("[ERROR]", "DLC dummy"):
                continue
            dlc_items.append((i, name))
        
        print(f"\n=== {erdb_file} ({fmg_prefix}) ===")
        print(f"  ERDB items: {len(existing_ids)}, max ID: {max_erdb}")
        print(f"  FMG entries above {max_erdb}: {len(dlc_ids)}")
        print(f"  Non-empty DLC items: {len(dlc_items)}")
        
        # Show DLC items
        for i, name in dlc_items[:50]:
            print(f"    {i}: {name}")

if __name__ == "__main__":
    main()
