const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'images', 'weapons');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const BASE_URL = 'https://eldenring.wiki.fextralife.com';
const CDN_BASE = 'https://eldenring.wiki.fextralife.com/file/Elden-Ring';
const CONCURRENCY = 8;

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000,
    }, res => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        const redirect = res.headers.location;
        if (redirect && redirect !== url) {
          res.resume();
          // Resolve relative redirects
          const absUrl = redirect.startsWith('http') ? redirect : new URL(redirect, url).href;
          if (absUrl !== url) {
            fetchPage(absUrl).then(resolve).catch(reject);
            return;
          }
        }
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    }, res => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    }).on('timeout', function() { this.destroy(); file.close(); fs.unlink(dest, () => {}); reject(new Error('timeout')); });
  });
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function encodePageName(name) {
  // Fextralife uses + for spaces, preserve apostrophes
  return name.replace(/ /g, '+');
}

async function processWeapon(weapon) {
  const engName = weapon.name_en || weapon.name;
  if (!engName) return null;

  const pageUrl = `${BASE_URL}/${encodeURIComponent(encodePageName(engName))}`;
  const destName = `${weapon.id}.png`;
  const destPath = path.join(OUTPUT_DIR, destName);

  // Skip if already exists
  if (fs.existsSync(destPath)) {
    return { name: engName, id: weapon.id, status: 'skipped', image: destName };
  }

  try {
    const html = await fetchPage(pageUrl);
    const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
    if (!match) return { name: engName, id: weapon.id, status: 'no_og_image' };

    const imgUrl = match[1];
    // Normalize: resolve relative URLs
    const absImgUrl = imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, BASE_URL).href;

    await downloadImage(absImgUrl, destPath);
    return { name: engName, id: weapon.id, status: 'downloaded', image: destName };
  } catch (e) {
    return { name: engName, id: weapon.id, status: 'failed', error: e.message };
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load weapon data
  const baseWeapons = Object.values(JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '..', 'public', 'data', 'armaments.json'), 'utf-8'
  )));
  const dlcWeapons = Object.values(JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '..', 'public', 'data', 'dlc-armaments.json'), 'utf-8'
  ))).map(w => ({ ...w, is_dlc: true }));
  const allWeapons = [...baseWeapons, ...dlcWeapons];
  console.log(`Total weapons: ${allWeapons.length} (${baseWeapons.length} base + ${dlcWeapons.length} DLC)`);

  // Process with concurrency
  const results = [];
  let index = 0;
  const total = allWeapons.length;

  async function worker() {
    while (index < total) {
      const i = index++;
      const weapon = allWeapons[i];
      const engName = weapon.name_en || weapon.name;
      process.stdout.write(`\r[${i+1}/${total}] ${engName || '?'}...`);
      const result = await processWeapon(weapon);
      if (result) results.push(result);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  console.log('\n');

  // Summary
  const downloaded = results.filter(r => r.status === 'downloaded');
  const skipped = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status === 'failed');
  const noOg = results.filter(r => r.status === 'no_og_image');

  console.log('--- Summary ---');
  console.log(`Downloaded: ${downloaded.length}`);
  console.log(`Skipped (already exist): ${skipped.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`No og:image found: ${noOg.length}`);

  if (failed.length > 0) {
    console.log('\nFailed:');
    failed.slice(0, 20).forEach(r => console.log(`  ${r.name}: ${r.error}`));
  }
  if (noOg.length > 0) {
    console.log('\nNo og:image:');
    noOg.slice(0, 20).forEach(r => console.log(`  ${r.name}`));
  }

  // Generate manifest
  const manifest = {};
  for (const r of [...downloaded, ...skipped]) {
    if (r.image) {
      const weapon = allWeapons.find(w => w.id === r.id);
      if (weapon) {
        manifest[weapon.name_en || weapon.name] = r.image;
      }
    }
  }
  // Also add from any existing files that weren't processed this run
  if (fs.existsSync(OUTPUT_DIR)) {
    const existing = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    for (const f of existing) {
      const id = parseInt(f);
      const weapon = allWeapons.find(w => w.id === id);
      if (weapon) {
        const engName = weapon.name_en || weapon.name;
        if (!manifest[engName]) manifest[engName] = f;
      }
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written: ${MANIFEST_PATH} (${Object.keys(manifest).length} entries)`);
}

main().catch(e => { console.error(e); process.exit(1); });
