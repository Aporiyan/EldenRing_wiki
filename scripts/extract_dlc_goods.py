import json, os, re

ROOT = r'D:\Aporiyan\EldenRing_wiki'
V116_DIR = os.path.join(ROOT, 'data', 'v1.16.1_named')
DATA_DIR = os.path.join(ROOT, 'public', 'data')
TMP_DIR = os.path.join(ROOT, 'tmp_conv')

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    def round_floats(o, precision=4):
        if isinstance(o, float):
            return round(o, precision)
        elif isinstance(o, dict):
            return {k: round_floats(v, precision) for k, v in o.items()}
        elif isinstance(o, list):
            return [round_floats(v, precision) for v in o]
        return o
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(round_floats(data), f, ensure_ascii=False, indent=1)

def load_fmg(higor_data, fmg_path):
    for key, fmg in higor_data.items():
        if key.endswith(fmg_path):
            return fmg
    return {}

# Load data
print('Loading...')
v116_goods = load_json(os.path.join(V116_DIR, 'EquipParamGoods.param.json'))['rows']
higor_dlc = load_json(os.path.join(TMP_DIR, 'higor_dlc01.json'))
higor_base = load_json(os.path.join(TMP_DIR, 'higor_item.json'))
name_map = load_json(os.path.join(DATA_DIR, 'name_map.json'))

names_fmg = load_fmg(higor_dlc, 'GoodsName_dlc01.fmg')
caption_fmg = load_fmg(higor_dlc, 'GoodsCaption_dlc01.fmg')

# Determine DLC goods type → category mapping
# Based on existing goods data:
# goodsType 0 = tools (general consumables)
# goodsType 1 = keys (key items)
# goodsType 2 = crafting-materials
# goodsType 3 = remembrances (special boss items)
# goodsType 4 = ...
# goodsType 5 = spells/incantations (scrolls/books)
# goodsType 7 = spirit ashes (already handled)
# goodsType 8 = spirit ash upgrades
# goodsType 10 = crystal tears (bolstering-materials)
# goodsType 11 = something
# goodsType 12 = info items
# etc.

def get_category(gt):
    if gt == 1:
        return 'keys'
    elif gt == 2:
        return 'crafting-materials'
    elif gt == 10:
        return 'bolstering-materials'
    elif gt == 3:
        return 'tools'
    else:
        return 'tools'

# Map goodsType to item category for proper grouping on items page
def get_item_category(gt, cn_name):
    if gt == 1:
        if '钥匙' in cn_name or '锁' in cn_name:
            return 'Exploration'
        elif '信' in cn_name or '地图' in cn_name or '图' in cn_name:
            return 'Map'
        elif '笔记' in cn_name or '书' in cn_name or '笔' in cn_name:
            return 'Quest'
        elif '制作' in cn_name or '配方' in cn_name:
            return 'Feature'
        elif '容器' in cn_name:
            return 'Container'
        elif '砥石' in cn_name:
            return 'Whetblade'
        else:
            return 'Exploration'
    elif gt == 3:
        return 'Remembrance'
    elif gt == 10:
        return 'Crystal Tear'
    elif gt == 5:
        return 'Feature'
    elif gt == 16:
        return 'Feature'
    elif gt == 17:
        return 'Feature'
    elif gt == 18:
        return 'Feature'
    elif gt == 11:
        return 'Essential'
    elif gt == 12:
        return 'Essential'
    elif gt == 14:
        return 'Essential'
    elif gt == 0:
        # Try to determine subcategory from Chinese name
        if '大卢恩' in cn_name:
            return 'Great Rune'
        elif '脂' in cn_name or '油' in cn_name:
            return 'Grease'
        elif '壶' in cn_name or '瓶' in cn_name:
            return 'Pot'
        elif '香' in cn_name:
            return 'Aromatic'
        elif '腌制肝' in cn_name or '炖煮' in cn_name:
            return 'Edible'
        elif '肉' in cn_name or '食' in cn_name:
            return 'Edible'
        elif '卢' in cn_name or '角币' in cn_name:
            return 'Golden Rune'
        elif '石' in cn_name:
            return 'Utility'
        elif '枝' in cn_name or '花' in cn_name:
            return 'Utility'
        elif '箭' in cn_name or '飞' in cn_name:
            return 'Throwable'
        elif '指' in cn_name:
            return 'Essential'
        elif '符' in cn_name:
            return 'Utility'
        elif '绘' in cn_name or '画' in cn_name or '笔记' in cn_name or '说' in cn_name:
            return 'Info'
        else:
            return 'Essential'
    return 'Essential'

cat_files = {
    'tools': [],
    'keys': [],
    'crafting-materials': [],
    'bolstering-materials': [],
}

dlc_ids = set()
for rid, row in v116_goods.items():
    rid_int = int(rid)
    if 200000 <= rid_int < 10000000:
        dlc_ids.add(rid)

# Categorize
for rid in sorted(dlc_ids, key=int):
    gt = v116_goods[rid].get('goodsType', 0)
    # Skip spirit ashes (type 7, 8 are handled separately)
    if gt in (7, 8):
        continue
    cat = get_category(gt)
    
    # Get Chinese name from FMG
    cn_name = names_fmg.get(rid, '')
    if not cn_name or cn_name in ('%null%', '[ERROR]'):
        print(f'  SKIP {rid}: no FMG name')
        continue
    
    # Use Chinese name as both key and name (since English name is unavailable)
    # Clean the name for use as a JSON key
    safe_key = cn_name.replace('"', '').replace('\n', ' ').strip()
    
    # Check if this Chinese name exists in name_map (reverse lookup)
    # If so, use the English name instead
    eng_name = None
    for eng, cn in name_map.items():
        if cn == cn_name:
            eng_name = eng
            break
    
    if eng_name:
        item_key = eng_name
    else:
        item_key = safe_key
    
    # Build minimal item data
    icon = v116_goods[rid].get('iconId', 0)
    sell = v116_goods[rid].get('sellValue', -1)
    if sell < 0:
        sell = 0
    
    item_category = get_item_category(gt, cn_name)
    
    item_data = {
        'id': int(rid),
        'name': item_key,
        'summary': '',
        'description': [],
        'is_tradable': True,
        'price_sold': sell,
        'rarity': 'Common',
        'icon': icon,
        'max_held': 999,
        'max_stored': 999,
        'category': item_category,
        'locations': [{'summary': 'Shadow of the Erdtree DLC'}],
        'remarks': [],
        'is_dlc': True,
    }
    
    cat_files[cat].append((item_key, item_data))
    if not eng_name:
        print(f'  [{cat}] {rid}: {cn_name} (no English name)')
    else:
        print(f'  [{cat}] {rid}: {cn_name} -> {eng_name}')

# Save files
print('\nSaving...')
for cat, items in cat_files.items():
    if not items:
        continue
    data = {}
    for key, item in items:
        data[key] = item
    filepath = os.path.join(DATA_DIR, f'dlc-{cat}.json')
    save_json(filepath, data)
    print(f'  dlc-{cat}.json: {len(items)} items')

print('\nDone!')
