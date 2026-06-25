import json, os, glob, re

data_dir = r'D:\Aporiyan\EldenRing_wiki\public\data'
files = sorted(glob.glob(os.path.join(data_dir, 'dlc-*.json')))

PLACEHOLDER_PATTERNS = [
    'DLC item:', 'DLC armor:', 'DLC talisman:', 'DLC spell:',
    'DLC Ash of War:', 'DLC Spirit Ash:'
]

for fpath in files:
    fname = os.path.basename(fpath)
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    items = data if isinstance(data, dict) else {}
    total = len(items)
    
    placeholder_count = 0
    missing_name = 0
    missing_category = 0
    no_summary = 0
    placeholder_details = {}
    
    for key, item in items.items():
        if not item.get('name'):
            missing_name += 1
        
        if 'category' not in item or not item.get('category'):
            missing_category += 1
        
        summary = item.get('summary', '')
        if summary == 'no summary' or not summary:
            no_summary += 1
        
        desc = item.get('description', [])
        if isinstance(desc, list):
            desc_text = ' '.join(desc)
        elif isinstance(desc, str):
            desc_text = desc
        else:
            desc_text = str(desc)
        
        for pat in PLACEHOLDER_PATTERNS:
            if pat in desc_text:
                placeholder_count += 1
                kind = pat.replace(':', '').strip()
                placeholder_details[key] = kind
                break
    
    print(f'=== {fname} ===')
    print(f'  Items: {total}')
    print(f'  Placeholder descriptions: {placeholder_count}')
    print(f'  Missing name: {missing_name}')
    print(f'  Missing category: {missing_category}')
    print(f'  "no summary" or empty summary: {no_summary}')
    if placeholder_count > 0:
        by_type = {}
        for k, v in placeholder_details.items():
            by_type.setdefault(v, []).append(k)
        for t, names in sorted(by_type.items()):
            print(f'    {t}: {len(names)} items')
    print()
