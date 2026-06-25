"""
Regenerate gamersky_all_landmarks.json
- Raw API: old formula (273.4 span) with offset adjustment
- DLC/cave: preserved from existing
"""
import json

RAW_FILE = 'public/data/gamersky_raw_all.json'
OLD_FILE = 'public/data/gamersky_all_landmarks.json'

with open(RAW_FILE, encoding='utf-8-sig') as f:
    raw = json.load(f)
with open(OLD_FILE, encoding='utf-8') as f:
    existing = json.load(f)

# Old formula: GS-CRS spans 273.44 units → 1 CRS unit at maxZoom=7
# Raw API (x=lat, y=lng) → CRS (cx, cy)
# Offset adjustment: +0.03 cx, +0.03 cy to fix "偏上偏左"
OFFSET_X = 0.03
OFFSET_Y = 0.03

def raw_to_crs(x, y):
    cx = 127 + y / 273.4 + OFFSET_X
    cy = 127 - x / 273.4 + OFFSET_Y
    return [cx, cy]

CAT_MAP = {
    '赐福': '赐福', 'BOSS': '主要BOSS', 'NPC': '任务NPC',
    '地点': '地点', '地标': '地标', '地图碎片': '地图残片',
    '强化材料': '锻造石', '圣杯瓶强化材料': '独特消耗品',
    '传说': '护符', '武器': '武器', '防具': '套装',
    '魔法': '祷告', '战灰': '战灰', '骨灰': '助战召唤符',
    '道具': '独特消耗品', '独特道具': '独特消耗品',
    '可交易NPC': '特殊商人', '重要道具': '独特消耗品',
}

def level_to_gid(level):
    return 28 if level == -1 else 27

# Convert raw API items
converted = []
for m in raw['mapMarkers']:
    level = m.get('level', 1)
    gid = level_to_gid(level)
    cat = m.get('category', '')
    cx, cy = raw_to_crs(m['x'], m['y'])
    converted.append({
        'id': m['id'],
        'name': m['name'],
        'fullName': m.get('description', '') if m.get('description') and len(m['description']) < 100 else m['name'],
        'description': m.get('description', ''),
        'x': round(cx, 6),
        'y': round(cy, 6),
        'gsMapId': gid,
        'gameMapId': gid,
        'landmarkCatalogName': CAT_MAP.get(cat, '地点'),
        'landmarkCatalogGroupName': cat,
        'iconUrl': m.get('image', ''),
    })

# Merge: DLC + cave preserved, raw API takes priority by id
merged_by_id = {}
for m in existing:
    gid = m.get('gsMapId')
    if gid in (38, 29):
        merged_by_id[m['id']] = m
for m in converted:
    merged_by_id[m['id']] = m

merged = list(merged_by_id.values())

# Stats
for gid in sorted(set(m['gsMapId'] for m in merged)):
    items = [m for m in merged if m['gsMapId'] == gid]
    xs = [m['x'] for m in items]
    ys = [m['y'] for m in items]
    print(f'gsMapId={gid}: {len(items)} items  cx=[{min(xs):.4f},{max(xs):.4f}] cy=[{min(ys):.4f},{max(ys):.4f}]')

with open('public/data/gamersky_all_landmarks.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)
print("Saved")
