import requests, sys, os, time, math
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URLS = {
    'surface': 'https://image.gamersky.com/webimg13/db/game_map/elden_ring/overground_20240617',
    'underground': 'https://image.gamersky.com/webimg13/db/game_map/elden_ring/underground_20240207',
    'dlc': 'https://image.gamersky.com/webimg13/db/game_map/elden_ring/dlc_20240621',
}

EXT = {'surface': 'jpg', 'underground': 'png', 'dlc': 'jpg'}

ZOOM_RANGES = {
    # map_type: (min_zoom, max_zoom, base_tile_center_at_z10)
    # base_tile_center is the approximate tile coordinate at zoom 10 for the map center
    'surface': (8, 13, 509.5),
    'underground': (8, 13, 509.5),
    'dlc': (11, 14, 509.5),
}

OUT_DIR = 'D:/Aporiyan/EldenRing_wiki/public/tiles'

s = requests.Session()
s.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
s.get('https://www.gamersky.com/tools/map/eldenring/', timeout=10)
REF = {'Referer': 'https://www.gamersky.com/tools/map/eldenring/'}

def tile_url(map_type, z, x, y):
    ext = EXT[map_type]
    return '%s/%d/%d_%d.%s' % (BASE_URLS[map_type], z, x, y, ext)

def local_path(map_type, z, x, y):
    ext = EXT[map_type]
    return os.path.join(OUT_DIR, map_type, str(z), '%d_%d.%s' % (x, y, ext))

def check_tile(map_type, z, x, y):
    url = tile_url(map_type, z, x, y)
    try:
        r = s.head(url, timeout=5, headers=REF)
        return r.status_code == 200
    except:
        return False

def find_tiles_for_zoom(map_type, z, center, half_width):
    """Find all valid tiles at zoom z near center (which is at zoom 10)."""
    # Scale center from zoom 10 to zoom z
    factor = 2 ** (z - 10)
    cx = int(center * factor)
    hw = int(half_width * factor)
    
    found = []
    total = (2 * hw) ** 2
    checked = 0
    for x in range(cx - hw, cx + hw + 1):
        for y in range(cx - hw, cx + hw + 1):
            if check_tile(map_type, z, x, y):
                found.append((x, y))
            checked += 1
            if checked % 50 == 0:
                sys.stdout.write('\r  z=%d: checked %d/%d, found %d' % (z, checked, total, len(found)))
                sys.stdout.flush()
    sys.stdout.write('\r  z=%d: DONE - found %d tiles\n' % (z, len(found)))
    sys.stdout.flush()
    return found

# Phase 1: Find tile ranges for each map type
print('=== Phase 1: Scan tile ranges ===')
all_tiles = {}
for map_type in ['surface', 'underground', 'dlc']:
    print('\n%s:' % map_type)
    min_z, max_z, center = ZOOM_RANGES[map_type]
    all_tiles[map_type] = {}
    for z in range(min_z, max_z + 1):
        # half_width at zoom 10 is about 2 tiles, at higher zooms scales accordingly
        hw_at_z10 = 3  # 3 tiles in each direction from center at zoom 10
        tiles = find_tiles_for_zoom(map_type, z, center, hw_at_z10)
        all_tiles[map_type][z] = tiles
        
        if tiles:
            xs = [t[0] for t in tiles]
            ys = [t[1] for t in tiles]
            print('  Range: x=[%d,%d] y=[%d,%d] (%d tiles)' % (min(xs), max(xs), min(ys), max(ys), len(tiles)))
        else:
            print('  NO TILES FOUND - try wider scan')
