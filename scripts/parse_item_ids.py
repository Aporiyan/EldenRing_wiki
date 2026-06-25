"""Parse item_ids.yml from eldenring-practice-tool into structured JSON."""
import json, re, sys

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    raw = f.read()

# Parse the YAML structure
result = {}
current_section = None
current_sub = None

for line in raw.split('\n'):
    # Section headers: "Weapons":, "Armor":, "Accessories":, "DLC Armor": etc.
    m = re.match(r'^"([^"]+)":$', line)
    if m:
        current_section = m.group(1)
        current_sub = None
        result[current_section] = {}
        continue
    
    if current_section is None:
        continue
    
    # Detect indentation level
    indent = len(line) - len(line.lstrip())
    
    # Sub-section at 4 spaces: "  Daggers":, "  Straight Swords": etc.
    m = re.match(r'^    "([^"]+)"$', line)
    if m and indent == 4:
        current_sub = m.group(1)
        if current_sub not in result[current_section]:
            result[current_section][current_sub] = {}
        continue
    
    # Item entries at 4 spaces (for flat sections like DLC Armor): "    Dane's Hat": 0x...
    # Or at 8 spaces (for sub-section items like Weapons/Daggers): "        Dagger": 0x...
    m = re.match(r'^(\s+)"([^"]+)": (0x[0-9A-Fa-f]+|\d+)', line)
    if m:
        spaces = m.group(1)
        name = m.group(2)
        value = m.group(3)
        if value.startswith('0x'):
            hex_val = int(value, 16)
        else:
            hex_val = int(value)
        
        if current_sub:
            if isinstance(result[current_section].get(current_sub), dict):
                result[current_section][current_sub][name] = hex_val
        else:
            # Items directly under section (DLC Armor style)
            result[current_section][name] = hex_val

# Save structured output
with open('scripts/dlc_item_ids.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

# Print summary
for section, subs in result.items():
    if isinstance(subs, dict):
        dc = {k: v for k, v in subs.items() if isinstance(v, dict)}
        flat = {k: v for k, v in subs.items() if not isinstance(v, dict)}
        total = sum(len(items) for items in dc.values()) + len(flat)
        print(f"{section}: {total} items ({len(dc)} subcats, {len(flat)} flat items)")
        for sub, items in list(dc.items())[:3]:
            sample = list(items.keys())[:3]
            print(f"  {sub}: {len(items)} items, e.g. {sample}")
        if len(dc) > 3:
            print(f"  ... and {len(dc)-3} more subcategories")
        if flat:
            print(f"  Flat items: {list(flat.keys())[:5]}...")
