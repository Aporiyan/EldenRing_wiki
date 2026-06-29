import json

with open('public/data/gamersky_all_landmarks.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cifu = [m for m in data if m.get('landmarkCatalogName') == '赐福']
print(f'Total 赐福: {len(cifu)}')
for g in [27, 28, 29, 38]:
    items = [m for m in cifu if m.get('gsMapId') == g]
    print(f'\ngsMapId={g}: {len(items)}')
    seen_names = set()
    for m in items:
        name = m.get('name', '')
        if name in seen_names:
            print(f'  DUPLICATE: id={m["id"]} name={name}')
        seen_names.add(name)
    for m in items[:5]:
        raw_x = m.get('_raw_x', 'N/A')
        raw_y = m.get('_raw_y', 'N/A')
        print(f'  id={m["id"]} name={m["name"]} x={m["x"]:.4f} y={m["y"]:.4f} raw({raw_x},{raw_y})')
    if len(items) > 5:
        print(f'  ... ({len(items)} total)')

# Check total categories
cats = {}
for m in data:
    c = m.get('landmarkCatalogName', '')
    cats[c] = cats.get(c, 0) + 1
print(f'\nAll categories:')
for c in sorted(cats.keys(), key=lambda k: -cats[k]):
    print(f'  {c}: {cats[c]}')
