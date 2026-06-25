import json

with open(r'D:\Aporiyan\EldenRing_wiki\public\data\name_map.json', 'r', encoding='utf-8') as f:
    m = json.load(f)

samples = [
    'Dagger', 'Longsword', 'Bastard Sword', 'Greatsword', 'Uchigatana',
    'Moonveil', 'Rivers of Blood', 'Hand of Malenia',
    'Carian Regal Scepter', 'Claymore', 'Zweihander',
    'Iron Helmet', 'Glintstone Pebble', 'Crimson Amber Medallion',
    "Ash of War: Lion's Claw", 'Black Knife Tiche',
]

for s in samples:
    val = m.get(s, 'NOT FOUND')
    print(f'{s:40s} -> {val}')

print(f'\nTotal mappings: {len(m)}')

# Check a few ERDB items that exist
with open(r'D:\Aporiyan\EldenRing_wiki\public\data\armaments.json', 'r', encoding='utf-8') as f:
    arms = json.load(f)

missing = 0
for k, v in arms.items():
    name = v['name']
    if name not in m:
        missing += 1
        if missing <= 3:
            print(f'MISSING: {name}')

print(f'Missing armament names: {missing} / {len(arms)}')
