import json

# Check gamersky data for icon URLs
with open('public/data/gamersky_all_landmarks.json', encoding='utf-8') as f:
    data = json.load(f)
items_with_icons = [m for m in data if m.get('iconUrl')]
print(f'Landmarks with iconUrl: {len(items_with_icons)}')
for m in items_with_icons[:3]:
    print(f'  {m["name"]}: {m["iconUrl"]}')

# Check ERDB items for icon field
files = ['armaments.json','armor.json','spells.json','talismans.json',
         'ashes-of-war.json','spirit-ashes.json','tools.json','keys.json',
         'crafting-materials.json','bolstering-materials.json']
for fn in files:
    with open(f'public/data/{fn}', encoding='utf-8') as f:
        d = json.load(f)
    items = list(d.values())
    has_icon = [i for i in items if i.get('icon')]
    print(f'{fn}: {len(items)} items, {len(has_icon)} with icon field')
    if has_icon:
        icons = set(i['icon'] for i in has_icon)
        print(f'  icon range: {min(icons)} - {max(icons)}')
