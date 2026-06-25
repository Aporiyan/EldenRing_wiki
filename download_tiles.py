import requests, os, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed

MAPS = {
    'surface': {
        'url': 'https://image.gamersky.com/webimg13/db/game_map/elden_ring/overground_20240617',
        'ext': 'jpg',
    },
    'underground': {
        'url': 'https://image.gamersky.com/webimg13/db/game_map/elden_ring/underground_20240207',
        'ext': 'png',
    },
    'dlc': {
        'url': 'https://image.gamersky.com/webimg13/db/game_map/elden_ring/dlc_20240621',
        'ext': 'jpg',
    },
}

# Tile ranges (all maps use the same CRS)
ZOOM_RANGES = {
    8:  (127, 127),
    9:  (254, 255),
    10: (508, 511),
    11: (1016, 1023),
    12: (2032, 2047),
    13: (4064, 4095),
}

OUT_DIR = 'D:/Aporiyan/EldenRing_wiki/public/tiles'

s = requests.Session()
s.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
s.get('https://www.gamersky.com/tools/map/eldenring/', timeout=10)
REF = {'Referer': 'https://www.gamersky.com/tools/map/eldenring/'}

total_tiles = 0
downloaded = 0
failed = 0
skipped = 0

def download_tile(map_name, cfg, z, x, y):
    global downloaded, failed
    url = '%s/%d/%d_%d.%s' % (cfg['url'], z, x, y, cfg['ext'])
    out_path = os.path.join(OUT_DIR, map_name, str(z), '%d_%d.%s' % (x, y, cfg['ext']))
    
    if os.path.exists(out_path) and os.path.getsize(out_path) > 100:
        global skipped
        skipped += 1
        return True
    
    try:
        r = s.get(url, timeout=15, headers=REF)
        if r.status_code == 200 and len(r.content) > 100:
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, 'wb') as f:
                f.write(r.content)
            global downloaded
            downloaded += 1
            return True
        else:
            global failed
            failed += 1
            return False
    except Exception as e:
        failed += 1
        return False

# Build task list
tasks = []
for map_name, cfg in MAPS.items():
    for z, (x_min, x_max) in ZOOM_RANGES.items():
        for x in range(x_min, x_max + 1):
            for y in range(x_min, x_max + 1):
                tasks.append((map_name, cfg, z, x, y))

total_tiles = len(tasks)
print('Total tiles to download: %d' % total_tiles)
print('Estimated size: ~%d MB' % (total_tiles * 10 / 1024 * 1024 / 1024))
# Actually let's compute properly
est = total_tiles * 10 / 1024 / 1024
print('Estimated size: ~%.0f MB' % (total_tiles * 10 / 1024 / 1024 * 1024 * 1024))
# Let me just do the math: total_tiles * 10KB / 1MB
est_mb = total_tiles * 10 / 1024
print('Estimated size: ~%d MB' % round(est_mb))

start = time.time()
with ThreadPoolExecutor(max_workers=8) as pool:
    futures = [pool.submit(download_tile, *t) for t in tasks]
    for i, f in enumerate(as_completed(futures)):
        if (i+1) % 500 == 0:
            elapsed = time.time() - start
            rate = (i+1) / elapsed
            remaining = (total_tiles - i - 1) / rate
            print('  %d/%d (%.0f%%) - %d OK, %d failed - %.0f tiles/sec, ETA %.0fs' % (
                i+1, total_tiles, (i+1)/total_tiles*100, downloaded, failed, rate, remaining))

elapsed = time.time() - start
print()
print('=== DONE ===')
print('Downloaded: %d' % downloaded)
print('Failed: %d' % failed)
print('Time: %.0f seconds' % elapsed)
print('Rate: %.1f tiles/sec' % (total_tiles / elapsed))
