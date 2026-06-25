import json

with open('public/data/gamersky_raw_all.json', 'r', encoding='utf-8-sig') as f:
    raw = json.load(f)

# Get all surface (level=1) marker coordinate ranges
surface = [m for m in raw['mapMarkers'] if m.get('level') == 1]
underground = [m for m in raw['mapMarkers'] if m.get('level') == -1]

print(f"Surface markers: {len(surface)}")
print(f"Underground markers: {len(underground)}")

# Full ranges
for label, items in [('Surface', surface), ('Underground', underground)]:
    xs = [m['x'] for m in items]
    ys = [m['y'] for m in items]
    print(f"\n{label}:")
    print(f"  x (lat): min={min(xs):.4f}, max={max(xs):.4f}, span={max(xs)-min(xs):.4f}")
    print(f"  y (lng): min={min(ys):.4f}, max={max(ys):.4f}, span={max(ys)-min(ys):.4f}")

# Try a different conversion: use marker data ranges directly
# Map raw coordinate range to full CRS [127, 128]
print("\n=== Alternative conversion (data-driven) ===")
s_xmin, s_xmax = min(m['x'] for m in surface), max(m['x'] for m in surface)
s_ymin, s_ymax = min(m['y'] for m in surface), max(m['y'] for m in surface)

print(f"Surface x range: [{s_xmin:.4f}, {s_xmax:.4f}]")
print(f"Surface y range: [{s_ymin:.4f}, {s_ymax:.4f}]")

# dx = 1.0 / (s_xmax - s_xmin)
# dy = 1.0 / (s_ymax - s_ymin)
# cx = 127 + (raw_y - s_ymin) / (s_ymax - s_ymin)
# cy = 127 - (raw_x - s_xmin) / (s_xmax - s_xmin) ... hmm need to ensure direction

# raw_x more negative = higher lat on screen in Y-flip
# raw_x = s_xmin (most negative, -251.41) → cy should be 128 (bottom)
# raw_x = s_xmax (0.12) → cy should be 127 (top)
# cy = 127 + (s_xmax - raw_x) / (s_xmax - s_xmin) ... no
# cy = 128 - (raw_x - s_xmin) / (s_xmax - s_xmin)
#   raw_x = s_xmin → cy = 128 - 0 = 128 ✓ (bottom)
#   raw_x = s_xmax → cy = 128 - 1 = 127 ✓ (top)

# raw_y = s_ymin (left) → cx = 127 (left)
# raw_y = s_ymax (right) → cx = 128 (right)
# cx = 127 + (raw_y - s_ymin) / (s_ymax - s_ymin)

print(f"\ncy = 128 - (raw_x - ({s_xmin:.4f})) / ({s_xmax-s_xmin:.4f})")
print(f"cx = 127 + (raw_y - ({s_ymin:.4f})) / ({s_ymax-s_ymin:.4f})")

# Show sample conversions for surface 赐福
cifu = [m for m in raw['mapMarkers'] if m.get('category') == '赐福' and m.get('level') == 1]
print(f"\n=== Sample surface 赐福 with data-driven conversion ===")
for m in cifu[:10]:
    cx = 127 + (m['y'] - s_ymin) / (s_ymax - s_ymin)
    cy = 128 - (m['x'] - s_xmin) / (s_xmax - s_xmin)
    print(f"  {m['name']}: raw({m['x']:.4f},{m['y']:.4f}) -> CRS({cx:.4f},{cy:.4f})")
