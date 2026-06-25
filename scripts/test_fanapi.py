import urllib.request
import json
import time

endpoints = ["weapons", "armors", "items", "incantations", "sorceries", "talismans", "ashes"]

for ep in endpoints:
    url = f"https://eldenring.fanapis.com/api/{ep}?limit=1"
    try:
        t0 = time.time()
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            elapsed = time.time() - t0
            print(f"  {ep}: total={data['total']}, took={elapsed:.2f}s")
    except Exception as e:
        print(f"  {ep}: FAILED - {e}")
