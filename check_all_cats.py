import json
d = json.load(open(r'D:\Aporiyan\EldenRing_wiki\public\data\armaments.json', encoding='utf-8'))

# Check unique categories
cats = {}
for k, v in d.items():
    cat = v.get('category', '?')
    if cat not in cats:
        cats[cat] = []
    cats[cat].append((v.get('name_cn','?'), k))

for cat in sorted(cats.keys(), key=lambda c: -len(cats[c])):
    items = cats[cat]
    print('{0:30s} ({1} items)'.format(cat, len(items)))
    for name_cn, key in items[:3]:
        print('    {0:30s}  ({1})'.format(name_cn, key))
