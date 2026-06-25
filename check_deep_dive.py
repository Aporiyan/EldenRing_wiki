# -*- coding: utf-8 -*-
import json, os

data_dir = r'D:\Aporiyan\EldenRing_wiki\public\data'

# 1) dlc-talismans.json category
with open(os.path.join(data_dir, 'dlc-talismans.json'), 'r', encoding='utf-8') as f:
    tal = json.load(f)
cats = {}
for k, v in tal.items():
    c = v.get('category', 'MISSING')
    cats[c] = cats.get(c, 0) + 1
print('=== dlc-talismans.json category breakdown ===')
print(' ', cats)
first = list(tal.keys())[0]
print('  First item:', first, '-> category =', tal[first].get('category', 'MISSING'))
print()

# 2) dlc-spells.json summary
with open(os.path.join(data_dir, 'dlc-spells.json'), 'r', encoding='utf-8') as f:
    spl = json.load(f)
summaries = {}
for k, v in spl.items():
    s = v.get('summary', 'MISSING')
    summaries[s] = summaries.get(s, 0) + 1
print('=== dlc-spells.json summary breakdown ===')
print(' ', summaries)
first = list(spl.keys())[0]
print('  First item:', first, '-> summary =', spl[first].get('summary'))
print()

# 3) dlc-armaments.json descriptions - real vs placeholder
with open(os.path.join(data_dir, 'dlc-armaments.json'), 'r', encoding='utf-8') as f:
    arm = json.load(f)
real = 0
placeholder = 0
for k, v in arm.items():
    desc = v.get('description', [])
    if isinstance(desc, list) and len(desc) > 0:
        txt = desc[0] if isinstance(desc[0], str) else str(desc[0])
        if 'DLC item:' in txt:
            placeholder += 1
        else:
            real += 1
print('=== dlc-armaments.json descriptions ===')
print('  Real:', real, 'Placeholder:', placeholder)
n = 0
for k, v in arm.items():
    desc = v.get('description', [])
    if isinstance(desc, list) and len(desc) > 0:
        txt = desc[0] if isinstance(desc[0], str) else str(desc[0])
        if 'DLC item:' not in txt and n < 3:
            print('  Sample [' + k + ']:', txt[:150])
            n += 1
print()

# 4) Check misc DLC files for empty descriptions (with utf-8 encoding)
for fname in ['dlc-keys.json', 'dlc-tools.json', 'dlc-crafting-materials.json', 'dlc-bolstering-materials.json']:
    with open(os.path.join(data_dir, fname), 'r', encoding='utf-8') as f:
        data = json.load(f)
    empty_desc = 0
    empty_sum = 0
    for k, v in data.items():
        desc = v.get('description', [])
        if not desc or (isinstance(desc, list) and len(desc) == 0):
            empty_desc += 1
        s = v.get('summary', '')
        if not s:
            empty_sum += 1
    print('=== ' + fname + ' ===')
    print('  items:', len(data), 'empty desc:', empty_desc, 'empty summary:', empty_sum)
print()

# 5) dlc_item_ids.json structure
with open(os.path.join(data_dir, '..', 'scripts', 'dlc_item_ids.json'), 'r', encoding='utf-8') as f:
    ids = json.load(f)
print('=== dlc_item_ids.json keys ===')
for k, v in ids.items():
    print(' ', k, ':', len(v))
