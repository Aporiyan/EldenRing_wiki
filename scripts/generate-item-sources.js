import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '../public/data');

function load(name) {
  return JSON.parse(readFileSync(resolve(DATA, name), 'utf8'));
}

// Build reverse name map: Chinese → English
const nameMap = load('name_map.json');
const cn2en = {};
for (const [en, cn] of Object.entries(nameMap)) {
  const trimmed = cn.trim();
  if (trimmed) {
    if (!cn2en[trimmed]) cn2en[trimmed] = [];
    cn2en[trimmed].push(en);
  }
}

function findEn(cnName) {
  const arr = cn2en[cnName];
  if (arr && arr.length === 1) return arr[0];
  if (arr && arr.length > 1) return arr[0]; // take first
  // try exact match with some normalization
  const normalized = cnName.replace(/[《》「」""''（）()]/g, '').trim();
  if (normalized !== cnName) return findEn(normalized);
  return null;
}

// === Build sources ===
const sources = {};

function addSource(enName, source) {
  if (!enName) return;
  if (!sources[enName]) sources[enName] = { sources: [] };
  sources[enName].sources.push(source);
}

// 1. Boss drops
const bosses = load('bosses.json');
for (const [bossKey, boss] of Object.entries(bosses)) {
  if (!boss.drops || !boss.drops.length) continue;
  for (const dropCn of boss.drops) {
    const en = findEn(dropCn);
    if (en) {
      addSource(en, {
        type: 'boss',
        bossName: boss.name,
        bossName_cn: boss.name_cn,
        location_cn: boss.location_cn,
        region_cn: boss.region_cn,
      });
    } else {
      console.warn(`[boss] unmatched drop: "${dropCn}" (boss: ${boss.name_cn})`);
    }
  }
}

// 2. Merchant inventories
const merchants = load('merchant-inventories.json');
for (const inv of merchants) {
  if (!inv.items || !inv.items.length) continue;
  const merchantName = inv.name || inv.name_cn || inv.id;
  for (const item of inv.items) {
    if (item.name) {
      addSource(item.name, {
        type: 'merchant',
        merchantName: merchantName,
        merchantName_cn: inv.name_cn || inv.name || inv.id,
        price: item.price,
        quantity_max: item.quantity_max,
      });
    }
  }
}

// 3. NPC quest rewards
const quests = load('npc-quests.json');
for (const [slug, quest] of Object.entries(quests)) {
  if (!quest.rewards || !quest.rewards.length) continue;
  const npcCn = quest.name_cn || quest.name || slug;
  for (let i = 0; i < quest.rewards.length; i++) {
    const rewardEn = quest.rewards[i];
    if (rewardEn) {
      addSource(rewardEn, {
        type: 'quest',
        npc: quest.name || slug,
        npc_cn: npcCn,
        reward_cn: quest.rewards_cn && quest.rewards_cn[i] ? quest.rewards_cn[i] : rewardEn,
      });
    }
  }
}

// 4. Craftable items (cookbook recipes)
const cookbooks = load('cookbook-recipes.json');
for (const [cbName, cb] of Object.entries(cookbooks)) {
  if (!cb.recipes || !cb.recipes.length) continue;
  for (const recipeEn of cb.recipes) {
    if (recipeEn) {
      addSource(recipeEn, {
        type: 'crafting',
        cookbook: cbName,
        cookbook_cn: cb.name_cn || cbName,
      });
    }
  }
}

// === Write output ===
const outputPath = resolve(DATA, 'item-sources.json');
writeFileSync(outputPath, JSON.stringify(sources, null, 2), 'utf8');

const itemCount = Object.keys(sources).length;
const sourceCount = Object.values(sources).reduce((s, v) => s + v.sources.length, 0);
const byType = {};
for (const v of Object.values(sources)) {
  for (const s of v.sources) {
    byType[s.type] = (byType[s.type] || 0) + 1;
  }
}

console.log(`Generated item-sources.json`);
console.log(`  Items with sources: ${itemCount}`);
console.log(`  Total source entries: ${sourceCount}`);
console.log(`  By type: ${JSON.stringify(byType)}`);
