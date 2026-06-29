"""Download Elden Ring item icons from Fandom wiki."""

import json, os, hashlib, sys, ssl, re, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, 'public', 'data')
IMAGES_DIR = os.path.join(PROJECT_ROOT, 'public', 'images')

CATEGORIES = [
    ('armor',        'dlc-armor',        'ER_Icon_Armor',      'armor'),
    ('talismans',    'dlc-talismans',    'ER_Icon_Talisman',   'talismans'),
    ('spells',       'dlc-spells',       'ER_Icon_Spell',       'spells'),
    ('ashes-of-war', 'dlc-ashes-of-war', 'ER_Icon_Ash_of_War', 'ashes-of-war'),
    ('spirit-ashes', 'dlc-spirit-ashes', 'ER_Icon_Ash',         'spirit-ashes'),
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def load_names(data_file):
    path = os.path.join(DATA_DIR, data_file)
    if not os.path.exists(path):
        return []
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return [item.get('name_en') or item.get('name', '') for item in (data.values() if isinstance(data, dict) else data)]

def sanitize(name):
    name = re.sub(r'^Ash of War:\s*', '', name)
    name = name.replace(' ', '_')
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    name = name.rstrip('.')
    return name

def get_fandom_url(name_en, prefix):
    name_part = sanitize(name_en)
    filename = f'{prefix}_{name_part}.png'
    md5 = hashlib.md5(filename.encode('utf-8')).hexdigest()
    url = f'https://static.wikia.nocookie.net/eldenring/images/{md5[0]}/{md5[:2]}/{filename}/revision/latest?format=original'
    return url, filename

def check_url(url):
    req = Request(url, method='HEAD', headers=HEADERS)
    try:
        resp = urlopen(req, timeout=12, context=ctx)
        return resp.status == 200
    except (HTTPError, URLError, OSError):
        return False

def download_file(url, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = Request(url, headers=HEADERS)
        resp = urlopen(req, timeout=30, context=ctx)
        data = resp.read()
        if len(data) < 1000:
            return False
        with open(dest, 'wb') as f:
            f.write(data)
        return True
    except (HTTPError, URLError, OSError):
        return False

def process(name_en, prefix, image_dir):
    san = sanitize(name_en)
    filename = f'{prefix}_{san}.png'
    dest = os.path.join(image_dir, f'{san}.png')
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return 'exists', name_en, san
    url, _ = get_fandom_url(name_en, prefix)
    if not check_url(url):
        return 'notfound', name_en, san
    if download_file(url, dest):
        return 'downloaded', name_en, san
    return 'failed', name_en, san

def main():
    all_manifests = {}
    for base_file, dlc_file, prefix, subdir in CATEGORIES:
        print(f'\n=== {base_file} (prefix: {prefix}) ===')
        names = list(dict.fromkeys(load_names(f'{base_file}.json') + load_names(f'{dlc_file}.json')))
        image_dir = os.path.join(IMAGES_DIR, subdir)
        os.makedirs(image_dir, exist_ok=True)
        results = {'downloaded': 0, 'exists': 0, 'notfound': 0, 'failed': 0}
        manifest = {}
        for i in range(0, len(names), 20):
            batch = names[i:i+20]
            with ThreadPoolExecutor(max_workers=10) as ex:
                fs = {ex.submit(process, n, prefix, image_dir): n for n in batch}
                for f in as_completed(fs):
                    try:
                        st, en, san = f.result()
                        results[st] += 1
                        if st in ('downloaded', 'exists'):
                            manifest[en] = f'./images/{subdir}/{san}.png'
                    except Exception as e:
                        results['failed'] += 1
            done = min(i + 20, len(names))
            sys.stdout.write(f'\r  {done}/{len(names)} | '
                           f'OK:{results["downloaded"]} Exist:{results["exists"]} '
                           f'Miss:{results["notfound"]} Fail:{results["failed"]}  ')
            sys.stdout.flush()
        print(f'\n  Downloaded: {results["downloaded"]}, Exist: {results["exists"]}, '
              f'Miss: {results["notfound"]}, Fail: {results["failed"]}, Manifest: {len(manifest)}')
        mp = os.path.join(DATA_DIR, f'{subdir}-images.json')
        with open(mp, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        all_manifests[subdir] = manifest
    print(f'\n=== DONE ===')
    for s, m in all_manifests.items():
        print(f'  {s}: {len(m)} images')

if __name__ == '__main__':
    main()
