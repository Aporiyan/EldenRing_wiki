import urllib.request
import json
import time

def fetch_all(endpoint):
    items = []
    limit = 100
    offset = 0
    page = 0
    while True:
        url = f"https://eldenring.fanapis.com/api/{endpoint}?limit={limit}&offset={offset}"
        try:
            t0 = time.time()
            req = urllib.request.Request(url, headers={"User-Agent": "EldenRingWiki/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                batch = data.get("data", [])
                items.extend(batch)
                total = data.get("total", 0)
                elapsed = time.time() - t0
                print(f"  page {page}: got {len(batch)}, offset={offset}, total={total}, took={elapsed:.1f}s")
                offset += limit
                page += 1
                if offset >= total:
                    break
        except Exception as e:
            print(f"  ERROR on page {page}: {e}")
            break
    return items

for ep in ["ashes"]:
    print(f"\nFetching /api/{ep} ...")
    items = fetch_all(ep)
    print(f"Total: {len(items)}")
