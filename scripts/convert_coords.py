import json, sys, math

with open('public/data/gamersky_raw_all.json', 'r', encoding='utf-8-sig') as f:
    raw = json.load(f)

with open('public/data/gamersky_all_landmarks.json', 'r', encoding='utf-8-sig') as f:
    existing = json.load(f)

print(f'Raw items: {len(raw["mapMarkers"])}, Existing items: {len(existing)}')

existing_by_name = {}
for item in existing:
    name = item.get('name', '')
    if name not in existing_by_name:
        existing_by_name[name] = []
    existing_by_name[name].append(item)

matches = []
for item in raw['mapMarkers']:
    name = item.get('name', '')
    if name in existing_by_name:
        for ex in existing_by_name[name]:
            matches.append((item, ex))

print(f'Cross-references by name: {len(matches)}')

# Remove duplicates by (raw_id, existing_id)
seen = set()
unique = []
for r, e in matches:
    key = (r['id'], e['id'])
    if key not in seen:
        seen.add(key)
        unique.append((r, e))
matches = unique
print(f'Unique matches: {len(matches)}')

if matches:
    # Simple linear regression for x and y
    n = len(matches)
    sum_xe = sum(e['x'] for r, e in matches)
    sum_ye = sum(e['y'] for r, e in matches)
    sum_xr = sum(r['x'] for r, e in matches)
    sum_yr = sum(r['y'] for r, e in matches)
    sum_xe_xr = sum(e['x'] * r['x'] for r, e in matches)
    sum_ye_yr = sum(e['y'] * r['y'] for r, e in matches)
    sum_xe2 = sum(e['x']**2 for r, e in matches)
    sum_ye2 = sum(e['y']**2 for r, e in matches)
    
    # raw_x = ax * existing_x + bx
    ax = (n * sum_xe_xr - sum_xe * sum_xr) / (n * sum_xe2 - sum_xe**2) if (n * sum_xe2 - sum_xe**2) != 0 else 0
    bx = (sum_xr - ax * sum_xe) / n
    
    # raw_y = cy * existing_y + dy  
    cy = (n * sum_ye_yr - sum_ye * sum_yr) / (n * sum_ye2 - sum_ye**2) if (n * sum_ye2 - sum_ye**2) != 0 else 0
    dy = (sum_yr - cy * sum_ye) / n
    
    print(f'\nConversion formulas:')
    print(f'  raw_x = {ax:.6f} * existing_x + {bx:.6f}')
    print(f'  raw_y = {cy:.6f} * existing_y + {dy:.6f}')
    print(f'  existing_x = (raw_x - ({bx:.6f})) / {ax:.6f}')
    print(f'  existing_y = (raw_y - ({dy:.6f})) / {cy:.6f}')
    
    # Validate
    errors_x = []
    errors_y = []
    print(f'\nValidation (first 10):')
    for r, e in matches[:10]:
        ex = (r['x'] - bx) / ax if ax != 0 else 0
        ey = (r['y'] - dy) / cy if cy != 0 else 0
        err_x = abs(ex - e['x'])
        err_y = abs(ey - e['y'])
        errors_x.append(err_x)
        errors_y.append(err_y)
        print(f'  {e["name"]}: raw({r["x"]:.4f},{r["y"]:.4f}) -> calc({ex:.4f},{ey:.4f}) actual({e["x"]:.4f},{e["y"]:.4f}) err({err_x:.4f},{err_y:.4f})')
    
    print(f'\nMean error: x={sum(errors_x)/len(errors_x):.6f}, y={sum(errors_y)/len(errors_y):.6f}')
    print(f'Max error: x={max(errors_x):.6f}, y={max(errors_y):.6f}')
else:
    print('No matches found!')

