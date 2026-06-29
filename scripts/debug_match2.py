import json, re, urllib.request
from pathlib import Path

# Fetch ALL fan API weapons
all_weapons = []
limit = 100
offset = 0
while True:
    url = f"https://eldenring.fanapis.com/api/weapons?limit={limit}&offset={offset}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        all_weapons.extend(data["data"])
        offset += limit
        if offset >= data["total"]:
            break

print(f"All weapons fetched: {len(all_weapons)}")

# Check specific names
test_names = ["Misericorde", "Longsword", "Short Sword", "Broadsword", "Lordsworn's Straight Sword"]
fan_names = {w["name"].lower(): w["name"] for w in all_weapons}
for tn in test_names:
    key = tn.lower()
    if key in fan_names:
        print(f"  '{tn}' -> FOUND as '{fan_names[key]}'")
    else:
        # Try fuzzy match
        matches = [n for n in fan_names if key in n or n in key]
        if matches:
            print(f"  '{tn}' -> NOT FOUND, but fuzzy matches: {matches[:3]}")
        else:
            print(f"  '{tn}' -> NOT FOUND in weapons")

# Check armors
all_armors = []
offset = 0
while True:
    url = f"https://eldenring.fanapis.com/api/armors?limit={limit}&offset={offset}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        all_armors.extend(data["data"])
        offset += limit
        if offset >= data["total"]:
            break

print(f"\nAll armors fetched: {len(all_armors)}")
fan_armor_names = {a["name"].lower(): a["name"] for a in all_armors}
test_armor = ["Iron Helmet", "Scale Armor", "Kaiden Helm"]
for tn in test_armor:
    key = tn.lower()
    if key in fan_armor_names:
        print(f"  '{tn}' -> FOUND as '{fan_armor_names[key]}'")
    else:
        matches = [n for n in fan_armor_names if key in n or n in key]
        if matches:
            print(f"  '{tn}' -> fuzzy: {matches[:3]}")
        else:
            print(f"  '{tn}' -> NOT FOUND")
