import json
import re
from pathlib import Path

ERDB_DIR = Path("public/data")

def normalize(n):
    n = n.strip().lower()
    n = re.sub(r'\s*\(altered\)\s*$', '', n)
    n = re.sub(r'^ash\s+of\s+war:\s+', '', n)
    n = re.sub(r'\s+', ' ', n)
    return n.strip()

# Load ERDB names
erdb_names = set()
with open(ERDB_DIR / "armaments.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    for k in data:
        erdb_names.add(k)
with open(ERDB_DIR / "armor.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    for k in data:
        erdb_names.add(k)

print(f"ERDB armaments+armor: {len(erdb_names)} unique names")
print("\nSample ERDB names (first 20):")
for n in sorted(list(erdb_names))[:20]:
    print(f"  '{n}' -> normalized: '{normalize(n)}'")

# Fetch a few fan API names for comparison
import urllib.request
for ep in ["weapons", "armors"]:
    url = f"https://eldenring.fanapis.com/api/{ep}?limit=5"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"\nFan API /{ep} (first 5):")
        for item in data["data"]:
            print(f"  '{item['name']}' -> normalized: '{normalize(item['name'])}'")
