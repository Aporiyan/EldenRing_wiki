import json, urllib.request

all_w = []
limit = 100
offset = 0
while True:
    url = f"https://eldenring.fanapis.com/api/weapons?limit={limit}&offset={offset}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        all_w.extend(data["data"])
        offset += limit
        if offset >= data["total"]:
            break

print(f"Total weapons: {data['total']}, retrieved: {len(all_w)}")

cats = {}
for w in all_w:
    cat = w.get("category", "?")
    cats[cat] = cats.get(cat, 0) + 1
for c, n in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {c}: {n}")

print(f"\nAll weapon names ({len(all_w)}):")
for w in all_w:
    print(f"  {w['name']}")
