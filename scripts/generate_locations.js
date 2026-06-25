import { readFileSync, writeFileSync } from 'fs';

const nameMap = JSON.parse(readFileSync('./public/data/name_map.json', 'utf-8'));
const cnToEn = {};
for (const [en, cn] of Object.entries(nameMap)) {
  cnToEn[cn] = en;
  const clean = cn.replace(/[（(][^)）]*[)）]$/, '');
  if (clean !== cn && !cnToEn[clean]) cnToEn[clean] = en;
}

const nameValues = Object.entries(nameMap);

function cleanName(n) {
  return n.replace(/[（(][^)）]*[)）]/g, '').replace(/[\d+\*×xX][\d]*$/g, '').replace(/\s+/g, '').trim();
}

function findMatch(cn) {
  let en = cnToEn[cn];
  if (en) return { en };
  const c2 = cleanName(cn);
  en = cnToEn[c2];
  if (en) return { en };
  for (const [e, c] of nameValues) {
    if (c2.includes(c) || c.includes(c2)) return { en: e };
  }
  return null;
}

const resp = await fetch('https://www.elpwc.com/eldenringmap/api/map.php?queryType=0&limit=99999');
const mapData = await resp.json();

const ITEM_TYPES = {
  weapon: 'armaments', clothes: 'armor', ring: 'talismans',
  magic: 'spells', zhanhui: 'ashes-of-war', guhui: 'spirit-ashes',
  item: 'tools', key: 'keys', material: 'crafting-materials',
  stone: 'bolstering-materials', sword: 'armaments',
  spiritashes: 'spirit-ashes', goldseed: 'tools', ludi: 'tools',
  tear: 'tools', sigen: 'tools', sbludi: 'tools',
  daogao: 'tools', jingying: 'tools', taoke: 'tools',
  orchid: 'tools', bead: 'tools',
};

const POSITION_CN = {
  0: '宁姆格福', 1: '利耶尼亚', 2: '盖利德',
  3: '亚坛高原', 4: '巨人山顶', 5: '化圣雪原',
  6: '地下区域',
};

function areaName(pos, mt) {
  let n = POSITION_CN[pos] || `区域${pos}`;
  if (mt === 1) n += '（地下）';
  if (mt === 2) n += '（DLC）';
  return n;
}

const matched = {};

for (const entry of mapData) {
  const dk = ITEM_TYPES[entry.type];
  if (!dk) continue;
  const result = findMatch(entry.name.trim());
  if (result) {
    const en = result.en;
    if (!matched[en]) matched[en] = { dataKey: dk, area: '', sources: [] };
    matched[en].sources.push({
      area: areaName(entry.position, entry.mapType),
      desc: (entry.desc || '').slice(0, 500),
      lng: entry.lng,
      lat: entry.lat,
      mapType: entry.mapType,
    });
  }
}

const output = {};
for (const [en, info] of Object.entries(matched)) {
  // Deduplicate by desc similarity
  const seen = new Set();
  const unique = info.sources.filter(s => {
    const key = s.desc.slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  output[en] = { dataKey: info.dataKey, sources: unique };
}

writeFileSync('./public/data/locations_map.json', JSON.stringify(output, null, 2), 'utf-8');
console.log('Matched:', Object.keys(output).length);
