import json
import os
import re
import urllib.request
import urllib.error
import time
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

FAN_API_BASE = "https://eldenring.fanapis.com/api"
ERDB_DIR = Path("public/data")
OUTPUT_DIR = Path("public/icons")
STATS_FILE = Path("public/icons/icon_stats.json")

ENDPOINTS = [
    "weapons", "armors", "items", "incantations",
    "sorceries", "talismans", "ashes"
]

# Image URL patterns by endpoint
URL_PATTERNS = {
    "weapons": "https://eldenring.fanapis.com/images/weapons/{hash}.png",
    "armors": "https://eldenring.fanapis.com/images/armors/{hash}.png",
    "items": "https://eldenring.fanapis.com/images/items/{hash}.png",
    "incantations": "https://eldenring.fanapis.com/images/incantations/{hash}.png",
    "sorceries": "https://eldenring.fanapis.com/images/sorceries/{hash}.png",
    "talismans": "https://eldenring.fanapis.com/images/talismans/{hash}.png",
    "ashes": "https://eldenring.fanapis.com/images/ashes/{hash}.png",
}

MAX_WORKERS = 10

def fetch_all(endpoint):
    items = []
    limit = 100
    offset = 0
    while True:
        url = f"{FAN_API_BASE}/{endpoint}?limit={limit}&offset={offset}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "EldenRingWiki/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                batch = data.get("data", [])
                items.extend(batch)
                total = data.get("total", 0)
                offset += limit
                if offset >= total:
                    break
        except Exception as e:
            print(f"    [!] page error: {e}")
            break
    return items

def normalize_name(name):
    n = name.strip()
    n = re.sub(r'\s*\(Altered\)\s*$', '', n)
    n = re.sub(r'^ash\s+of\s+war:\s+', '', n, flags=re.IGNORECASE)
    n = n.lower()
    n = re.sub(r'\s+', ' ', n)
    return n.strip()

def download_single(item):
    icon_id, url, output_path = item
    if output_path.exists() and output_path.stat().st_size > 100:
        return ("skip", icon_id, 0)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "EldenRingWiki/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
                if len(data) < 100:
                    return ("fail", icon_id, 0)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                output_path.write_bytes(data)
                return ("ok", icon_id, len(data))
        except Exception:
            if attempt < 2:
                time.sleep(1)
    return ("fail", icon_id, 0)

def generate_placeholder_svg(icon_id, size=64):
    hue = (icon_id * 37) % 360
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}">'
        f'<rect width="{size}" height="{size}" fill="hsl({hue}, 30%, 25%)" rx="4"/>'
        f'<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" '
        f'font-family="sans-serif" font-size="10" fill="hsla({hue}, 20%, 70%, 0.6)">?</text>'
        f'</svg>'
    )

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("步骤 1/3: 从 fan API 获取所有物品")
    print("=" * 60)

    fan_items = {}
    endpoint_stats = {}

    for ep in ENDPOINTS:
        print(f"  -> /api/{ep} ...", end=" ", flush=True)
        items = fetch_all(ep)
        print(f"{len(items)} 条")
        endpoint_stats[ep] = len(items)
        pattern = URL_PATTERNS[ep]
        for item in items:
            name = item.get("name", "")
            hid = item.get("id", "")
            if name and hid:
                key = normalize_name(name)
                # If duplicate, keep the one from first source (weapons > armors > items > ...)
                if key not in fan_items:
                    fan_items[key] = {
                        "name": name,
                        "url": pattern.replace("{hash}", hid)
                    }

    print(f"\n  fan API 总计: {len(fan_items)} 个唯一物品\n")

    # Step 2
    print("=" * 60)
    print("步骤 2/3: 匹配 ERDB 数据")
    print("=" * 60)

    erdb_categories = sorted([
        f for f in os.listdir(ERDB_DIR)
        if f.endswith(".json")
        and f not in ("info.json", "shop.json",
                      "correction-attack.json", "correction-graph.json",
                      "reinforcements.json", "gestures.json")
    ])

    matched = 0
    unmatched = 0
    total_items = 0
    download_queue = []  # (icon_id, url, output_path)
    unmatched_details = {}

    for cat_file in erdb_categories:
        cat_name = cat_file.replace(".json", "")
        filepath = ERDB_DIR / cat_file
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        for item_key, item_data in data.items():
            total_items += 1
            icon_id = item_data.get("icon")
            if icon_id is None:
                continue

            fan_key = normalize_name(item_key)
            fan_entry = fan_items.get(fan_key)

            if fan_entry:
                matched += 1
                download_queue.append((
                    icon_id,
                    fan_entry["url"],
                    OUTPUT_DIR / f"{icon_id}.png"
                ))
            else:
                unmatched += 1
                if cat_name not in unmatched_details:
                    unmatched_details[cat_name] = []
                unmatched_details[cat_name].append(item_key)

    print(f"  ERDB 总计: {total_items}")
    print(f"  匹配成功: {matched}")
    print(f"  匹配失败: {unmatched}")
    print(f"  匹配率: {matched / max(total_items, 1) * 100:.1f}%")

    if unmatched_details:
        print(f"\n  未匹配物品分类:")
        for cat, names in sorted(unmatched_details.items()):
            sample = ", ".join(names[:8])
            rest = f" ...(+{len(names) - 8})" if len(names) > 8 else ""
            print(f"    {cat}: {sample}{rest}")

    # Step 3
    print("\n" + "=" * 60)
    print("步骤 3/3: 并发下载图标")
    print("=" * 60)

    downloaded = 0
    failed = 0
    skipped = 0
    total_bytes = 0
    t0 = time.time()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(download_single, item) for item in download_queue]
        done_count = 0
        total_count = len(futures)
        for future in as_completed(futures):
            done_count += 1
            status, icon_id, size = future.result()
            if status == "ok":
                downloaded += 1
                total_bytes += size
            elif status == "skip":
                skipped += 1
            else:
                failed += 1
            if done_count % 200 == 0 or done_count == total_count:
                elapsed = time.time() - t0
                pct = done_count / total_count * 100
                print(f"  ... {done_count}/{total_count} ({pct:.0f}%) | "
                      f"OK={downloaded} FAIL={failed} SKIP={skipped} | "
                      f"{elapsed:.0f}s")

    elapsed_total = time.time() - t0
    print(f"\n  下载完成:")
    print(f"  成功: {downloaded} ({total_bytes / 1024:.0f} KB)")
    print(f"  跳过(已有): {skipped}")
    print(f"  失败: {failed}")
    print(f"  耗时: {elapsed_total:.0f}s")

    # Generate placeholders for failed/unmatched
    print("\n  生成占位图...")
    placed = 0
    for icon_id, _, output_path in download_queue:
        if not output_path.exists() or output_path.stat().st_size < 100:
            output_path.write_text(generate_placeholder_svg(icon_id))
            placed += 1
    # Also generate for unmatched items
    for cat_file in erdb_categories:
        filepath = ERDB_DIR / cat_file
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        for item_key, item_data in data.items():
            icon_id = item_data.get("icon")
            if icon_id is None:
                continue
            out = OUTPUT_DIR / f"{icon_id}.png"
            if not out.exists() or out.stat().st_size < 100:
                out.write_text(generate_placeholder_svg(icon_id))
                placed += 1
    print(f"  占位图生成: {placed}")

    # Save stats
    stats = {
        "fan_api_endpoints": endpoint_stats,
        "fan_api_total": len(fan_items),
        "erdb_total": total_items,
        "matched": matched,
        "unmatched": unmatched,
        "matched_rate": round(matched / max(total_items, 1) * 100, 1),
        "downloaded": downloaded,
        "failed": failed,
        "placeholders": placed,
        "skipped_existing": skipped,
        "total_bytes": total_bytes,
        "elapsed_seconds": round(elapsed_total),
    }
    with open(STATS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    print(f"\n  统计已保存到 {STATS_FILE}")
    print("\n完成!")

if __name__ == "__main__":
    main()
