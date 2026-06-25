const DATA_FILES = [
  { key: 'armaments', file: 'armaments.json', label: '武器' },
  { key: 'armor', file: 'armor.json', label: '防具' },
  { key: 'spells', file: 'spells.json', label: '魔法' },
  { key: 'talismans', file: 'talismans.json', label: '护符' },
  { key: 'ashes-of-war', file: 'ashes-of-war.json', label: '战灰' },
  { key: 'spirit-ashes', file: 'spirit-ashes.json', label: '骨灰' },
  { key: 'tools', file: 'tools.json', label: '道具' },
  { key: 'keys', file: 'keys.json', label: '钥匙' },
  { key: 'crafting-materials', file: 'crafting-materials.json', label: '制作材料' },
  { key: 'bolstering-materials', file: 'bolstering-materials.json', label: '强化材料' },
  // DLC data — loaded separately but merged into base categories at runtime
  { key: 'dlc-armaments', file: 'dlc-armaments.json', label: 'DLC武器', mergeInto: 'armaments' },
  { key: 'dlc-armor', file: 'dlc-armor.json', label: 'DLC防具', mergeInto: 'armor' },
  { key: 'dlc-talismans', file: 'dlc-talismans.json', label: 'DLC护符', mergeInto: 'talismans' },
  { key: 'dlc-spells', file: 'dlc-spells.json', label: 'DLC魔法', mergeInto: 'spells' },
  { key: 'dlc-ashes-of-war', file: 'dlc-ashes-of-war.json', label: 'DLC战灰', mergeInto: 'ashes-of-war' },
  { key: 'dlc-spirit-ashes', file: 'dlc-spirit-ashes.json', label: 'DLC骨灰', mergeInto: 'spirit-ashes' },
  { key: 'dlc-tools', file: 'dlc-tools.json', label: 'DLC道具', mergeInto: 'tools' },
  { key: 'dlc-keys', file: 'dlc-keys.json', label: 'DLC钥匙', mergeInto: 'keys' },
  { key: 'dlc-crafting-materials', file: 'dlc-crafting-materials.json', label: 'DLC制作材料', mergeInto: 'crafting-materials' },
  { key: 'dlc-bolstering-materials', file: 'dlc-bolstering-materials.json', label: 'DLC强化材料', mergeInto: 'bolstering-materials' },
  // Extra data — loaded for specialized pages
  { key: 'info', file: 'info.json', label: '信息/信件' },
];

const DLC_KEYS = new Set(
  DATA_FILES.filter(df => df.mergeInto).map(df => df.key)
);

const CATEGORY_CN = {
  Dagger: '匕首', 'Straight Sword': '直剑', Greatsword: '大剑',
  'Colossal Sword': '特大剑', 'Colossal Weapon': '特大武器',
  'Thrusting Sword': '刺剑',
  'Heavy Thrusting Sword': '大重剑', 'Curved Sword': '曲剑',
  'Curved Greatsword': '大刀', Katana: '武士刀',
  Twinblade: '双头剑', Hammer: '锤', 'Great Hammer': '大锤',
  Flail: '连枷', Axe: '斧', Greataxe: '大斧',
  Halberd: '戟', Spear: '矛', 'Great Spear': '大矛',
  Lance: '长矛', Reaper: '镰刀', Scythe: '镰刀', Whip: '鞭',
  Fist: '拳', Claw: '爪', 'Light Bow': '小弓', Bow: '弓',
  Greatbow: '大弓', Crossbow: '弩', Ballista: '弩炮',
  'Glintstone Staff': '杖', Staff: '杖', 'Sacred Seal': '圣印记',
  Torch: '火把', 'Small Shield': '小盾', 'Medium Shield': '中盾',
  Shield: '盾', Greatshield: '大盾',
  Arrow: '箭', Bolt: '弩箭',
  'Great Arrow': '大箭', 'Great Bolt': '大弩箭',
  Sorcery: '魔法', Incantation: '祷告',
  Head: '头部', Body: '身体', Chest: '身体', Arms: '手臂', Legs: '腿部',
  'Spirit Ash': '骨灰',
  // Items (tools)
  Online: '联机', Essential: '关键', 'Great Rune': '大卢恩',
  Pot: '壶', Utility: '工具', Edible: '可食用',
  Grease: '油脂', Throwable: '投掷', Offensive: '进攻',
  'Golden Rune': '卢恩',   Remembrance: '追忆',
  Aromatic: '熏香', 'Crystal Tear': '结晶露滴',
  // Items (keys)
  Exchange: '兑换', Exploration: '探索', Quest: '任务',
  'Mending Rune': '修复卢恩', Feature: '功能', Map: '地图',
  Whetblade: '砥石刀', Container: '容器',
  // Items (crafting)
  Fauna: '动物', Flora: '植物', Object: '物品',
  // Items (bolstering)
  Flask: '露滴', 'Smithing Stone': '锻造石',
  'Somber Smithing Stone': '失色锻造石', Glovewort: '铃兰',
  // DLC new weapon types
  'Backhand Blade': '反手剑', 'Great Katana': '大刀',
  'Light Greatsword': '轻大剑', 'Hand-to-Hand': '格斗术',
  'Perfume Bottle': '调香瓶', 'Throwing Blade': '投掷剑',
  'Thrusting Shield': '突刺盾',
  'Ash of War': '战灰',
  'Spirit Ash': '骨灰',
  Talisman: '护符',
  // Info items
  Clue: '线索', Note: '笔记', Painting: '画作', Tutorial: '教程',
};

const CATEGORY_GROUP = {
  Dagger: { cn: '短剑' }, 'Straight Sword': { cn: '直剑' },
  Greatsword: { cn: '大剑' }, 'Colossal Sword': { cn: '特大剑' },
  'Thrusting Sword': { cn: '刺剑' }, 'Heavy Thrusting Sword': { cn: '重刺剑' },
  'Curved Sword': { cn: '曲剑' }, 'Curved Greatsword': { cn: '大曲剑' },
  Twinblade: { cn: '双头剑' },
  Katana: { cn: '刀' }, Hammer: { cn: '槌' }, 'Great Hammer': { cn: '大槌' },
  Axe: { cn: '斧' }, Greataxe: { cn: '大斧' }, Flail: { cn: '连枷' },
  Spear: { cn: '矛/大矛/戟/长矛', sub: '矛' }, 'Great Spear': { cn: '矛/大矛/戟/长矛', sub: '大矛' },
  Halberd: { cn: '矛/大矛/戟/长矛', sub: '戟' },
  Lance: { cn: '矛/大矛/戟/长矛', sub: '长矛' },
  'Colossal Weapon': { cn: '特大武器' },
  Whip: { cn: '鞭/镰刀/火把', sub: '鞭' }, Reaper: { cn: '鞭/镰刀/火把', sub: '镰刀' },
  Scythe: { cn: '鞭/镰刀/火把', sub: '镰刀' },
  Torch: { cn: '鞭/镰刀/火把', sub: '火把' },
  Fist: { cn: '拳套/勾爪', sub: '拳套' }, Claw: { cn: '拳套/勾爪', sub: '勾爪' },
  'Light Bow': { cn: '弓/弩', sub: '弓' }, Bow: { cn: '弓/弩', sub: '弓' },
  Greatbow: { cn: '弓/弩', sub: '弓' }, Crossbow: { cn: '弓/弩', sub: '弩' },
  Ballista: { cn: '弓/弩', sub: '弩' },
  Arrow: { cn: '弓/弩', sub: '箭' }, 'Great Arrow': { cn: '弓/弩', sub: '箭' },
  Bolt: { cn: '弓/弩', sub: '弩' }, 'Great Bolt': { cn: '弓/弩', sub: '弩' },
  'Sacred Seal': { cn: '印记' }, 'Glintstone Staff': { cn: '法杖' },
  Staff: { cn: '法杖' },
  'Small Shield': { cn: '盾牌', sub: '小盾' }, 'Medium Shield': { cn: '盾牌', sub: '中盾' },
  Greatshield: { cn: '盾牌', sub: '大盾' }, Shield: { cn: '盾牌', sub: '中盾' },
  'Thrusting Shield': { cn: '盾牌', sub: '突刺盾' },
  'Backhand Blade': { cn: '反手剑' }, 'Great Katana': { cn: '大刀' },
  'Light Greatsword': { cn: '轻大剑' }, 'Hand-to-Hand': { cn: '格斗术' },
  'Perfume Bottle': { cn: '调香瓶' }, 'Throwing Blade': { cn: '投掷剑' },
};

const RARITY_CN = { Common: '普通', Rare: '稀有', Legendary: '传说' };

const ATTR_ATK_CN = { Standard: '标准', Slash: '斩击', Strike: '打击', Pierce: '突刺' };

let nameMap = {};
let descMap = {};
let reinforcementData = null;
const cache = {};
let loadPromise = null;

function objToArray(obj) {
  return Object.values(obj);
}

function translateName(engName) {
  if (nameMap[engName]) return nameMap[engName].replace('（使用后）', '');
  // Handle HTML-escaped & (e.g., "A & B" in ERDB but "A &amp; B" in name XML)
  const esc = engName.replace(/&/g, '&amp;');
  if (esc !== engName && nameMap[esc]) return nameMap[esc];
  // Handle +N variants (e.g., "Crimson Amber Medallion +1")
  const matchPlus = engName.match(/^(.+?)\s*\+(\d+)$/);
  if (matchPlus) {
    const base = matchPlus[1];
    const suffix = '+' + matchPlus[2];
    const cn = translateName(base);
    if (cn && cn !== base) return cn + suffix;
  }
  // Handle [N] variants (e.g., "Golden Rune [1]")
  const matchBracket = engName.match(/^(.+?)\s*\[(\d+)\]$/);
  if (matchBracket) {
    const base = matchBracket[1];
    const suffix = '[' + matchBracket[2] + ']';
    const cn = translateName(base);
    if (cn && cn !== base) return cn + suffix;
  }
  // Strip all double quotes (e.g. "\"Homing Instinct\" Painting" -> "Homing Instinct Painting")
  const unquoted = engName.replace(/"/g, '');
  if (unquoted !== engName && nameMap[unquoted]) return nameMap[unquoted];
  return engName;
}

function translateItem(item) {
  const engName = item.name;
  const cn = translateName(engName);
  item.name_cn = cn;
  item.name_en = engName;
  item.name = cn;

  if (!item.category_cn) {
    if (item.category && CATEGORY_CN[item.category]) {
      item.category_cn = CATEGORY_CN[item.category];
    } else {
      item.category_cn = item.category || '';
    }
  }

  if (item.rarity && RARITY_CN[item.rarity]) {
    item.rarity_cn = RARITY_CN[item.rarity];
  } else {
    item.rarity_cn = item.rarity || '';
  }

  // Translate description
  const descBaseName = engName.replace(/\s*\+(\d+)$/, '').replace(/\s*\[(\d+)\]$/, '');
  if (descMap[engName]) {
    item.description_cn = descMap[engName];
    item.description = item.description_cn;
  } else if (descBaseName !== engName && descMap[descBaseName]) {
    item.description_cn = descMap[descBaseName];
    item.description = item.description_cn;
  }
}

export async function loadAllData() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const mapResp = await fetch('./data/name_map.json');
      nameMap = await mapResp.json();
    } catch (e) {}
    try {
      const descResp = await fetch('./data/desc_map.json');
      descMap = await descResp.json();
    } catch (e) {}

    try {
      const reinfResp = await fetch('./data/reinforcements.json');
      reinforcementData = await reinfResp.json();
    } catch (e) {}

    const entries = DATA_FILES.map(({ key, file }) =>
      fetch(`./data/${file}`)
        .then(r => r.json())
        .then(data => {
          const items = objToArray(data);
          items.forEach(translateItem);
          cache[key] = items;
          return { key, count: items.length };
        })
        .catch(err => {
          console.warn(`Failed to load ${file}:`, err);
          cache[key] = [];
          return { key, count: 0 };
        })
    );
    await Promise.all(entries);

    // Merge DLC items into base caches
    for (const df of DATA_FILES) {
      if (!df.mergeInto) continue;
      const dlcItems = cache[df.key] || [];
      const baseItems = cache[df.mergeInto] || [];
      dlcItems.forEach(item => { item.is_dlc = true; });
      cache[df.mergeInto] = [...baseItems, ...dlcItems];
    }
  })();
  return loadPromise;
}

export function getData(key) {
  return cache[key] || [];
}

export function getItem(key, id) {
  const numId = Number(id);
  return (cache[key] || []).find(item => item.id === numId || item.full_hex_id === id || String(item.id) === String(id));
}

export function getCategories(key) {
  const items = cache[key] || [];
  const cats = new Set();
  items.forEach(item => {
    if (item.category_cn) cats.add(item.category_cn);
  });
  return [...cats].filter(Boolean).sort();
}

export function getCategoryGroup(engCategory) {
  const g = CATEGORY_GROUP[engCategory];
  return g ? g.cn : engCategory;
}

export function getCategorySub(engCategory) {
  const g = CATEGORY_GROUP[engCategory];
  return g && g.sub ? g.sub : (g ? g.cn : engCategory);
}

export function getCategoryGroups(key) {
  const items = cache[key] || [];
  const groups = new Set();
  items.forEach(item => {
    if (item.category) {
      const g = getCategoryGroup(item.category);
      groups.add(g);
    }
  });
  return [...groups].filter(Boolean).sort((a, b) => {
    const order = ['短剑','直剑','大剑','特大剑','刺剑','重刺剑','曲剑','大曲剑','双头剑','刀',
      '槌','大槌','斧','大斧','连枷','矛/大矛/戟','特大武器','鞭/镰刀/火把','拳套/勾爪','弓/弩',
      '印记','法杖','盾牌','反手剑','大刀','轻大剑','格斗术','调香瓶','投掷剑','突刺盾'];
    return order.indexOf(a) - order.indexOf(b);
  });
}

export function getGroupSubs(groupCn, key) {
  const items = cache[key] || [];
  const subs = new Set();
  items.forEach(item => {
    if (item.category && getCategoryGroup(item.category) === groupCn) {
      subs.add(getCategorySub(item.category));
    }
  });
  return [...subs].filter(Boolean).sort();
}

export function getTotalCount() {
  let total = 0;
  for (const { key, mergeInto } of DATA_FILES) {
    if (mergeInto) continue;
    total += (cache[key] || []).length;
  }
  return total;
}

export function globalSearch(query) {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();
  const results = [];
  const typeMap = {
    armaments: '武器', armor: '防具', spells: '魔法',
    talismans: '护符', 'ashes-of-war': '战灰', 'spirit-ashes': '骨灰',
    tools: '道具', keys: '钥匙',
    'crafting-materials': '素材', 'bolstering-materials': '强化',
  };

  for (const { key, mergeInto } of DATA_FILES) {
    if (mergeInto) continue;
    const items = cache[key] || [];
    for (const item of items) {
      const desc = Array.isArray(item.description) ? item.description.join('') : (item.description || '');
      const searchText = ((item.name_cn || '') + '||' + (item.name_en || '') + '||' + (item.name || '') + '||' + desc + '||' + (item.summary || '')).toLowerCase();
      if (searchText.includes(q)) {
        results.push({
          ...item,
          _key: key,
          _type: typeMap[key] || key,
        });
        if (results.length >= 100) return results;
      }
    }
  }
  return results;
}

const ATTR_CN = {
  'Maximum Health': '最大HP', 'Maximum FP': '最大FP', 'Maximum Stamina': '最大精力',
  Stamina: '精力', 'Equip Load': '装备重量', 'Maximum Equip Load': '最大装备重量',
  Poise: '韧性', Discovery: '观察力', 'Item Discovery': '观察力',
  Memory: '记忆格', 'Memory Slots': '记忆格',
  'Rune Acquisition': '魂获取量', Curse: '诅咒',
  'Holy Defense': '圣防御', 'Fire Defense': '火防御', 'Magic Defense': '魔防御',
  'Lightning Defense': '雷防御', 'Physical Defense': '物理防御',
  Strength: '力量', Dexterity: '灵巧', Intelligence: '智力', Faith: '信仰', Arcane: '感应',
  Health: 'HP', 'Health Points': 'HP', Focus: '专注', 'Focus Points': '专注',
  'Maximum Focus': '最大专注', 'Attack Power': '攻击力',
  'Physical Attack Power': '物理攻击力', 'Magic Attack Power': '魔法攻击力',
  'Fire Attack Power': '火攻击力', 'Lightning Attack Power': '雷攻击力',
  'Holy Attack Power': '圣攻击力',
  Absorption: '减伤率', 'Physical Absorption': '物理减伤率',
  'Magic Absorption': '魔法减伤率', 'Fire Absorption': '火减伤率',
  'Lightning Absorption': '雷减伤率', 'Holy Absorption': '圣减伤率',
  'Elemental Absorption': '属性减伤率',
  Immunity: '免疫', Robustness: '强韧', Vitality: '活力',
  Vigor: '生命力', Endurance: '耐力', Mind: '集中力',
  'Casting Speed': '施法速度', 'Fall Damage': '坠落伤害',
  'Stamina Recovery Speed': '精力恢复速度', 'Stamina Attack Rate': '精力攻击倍率',
  'Spell Duration': '魔法持续时间',
  'Spell Focus Consumption': '魔法专注消耗', 'Skill Focus Consumption': '战技专注消耗',
  'Sorcery Focus Consumption': '魔法专注消耗', 'Incantation Focus Consumption': '祷告专注消耗',
  'Flask Health Restoration': '血量恢复量', 'Flask Focus Restoration': '专注值恢复量',
  'Bow Distance': '弓箭射程',
  'Attract Enemy Aggression': '吸引敌人仇恨', 'Enemy Hearing': '敌人听力',
  'Invisible at Distance': '远处隐形',
  'Preserve Runes on Death': '死亡时保留卢恩', 'Destroy Item on Death': '死亡时销毁物品',
  'Reduce Headshot Impact': '减少爆头冲击',
  'Appear as Cooperator': '显示为协作者', 'Appear as Host': '显示为宿主',
  'Switch Animation Gender': '切换动画性别',
  Stability: '稳定性',
};

export { ATTR_ATK_CN, CATEGORY_CN, ATTR_CN, translateName };

export function getCategoryList() {
  return DATA_FILES.map(({ key, label, mergeInto }) => ({
    key,
    label,
    count: (cache[key] || []).length,
    isDlc: !!mergeInto,
    mergeInto: mergeInto || null,
  }));
}

export function getLocations(item) {
  return null;
}

const MAX_LV_MAP = {0:25,1900:25,2200:10,2400:10,3000:0,3100:25,3200:10,3300:10,8000:25,8100:25,8200:25,8300:10,8500:10,1300:10,3400:10,3500:10};

const REINF_DMG_MAP = { physicsAtkRate:'physical', magicAtkRate:'magic', fireAtkRate:'fire', thunderAtkRate:'lightning', darkAtkRate:'holy', staminaAtkRate:'stamina' };
const REINF_SCA_MAP = { correctStrengthRate:'strength', correctAgilityRate:'dexterity', correctMagicRate:'intelligence', correctFaithRate:'faith', correctLuckRate:'arcane' };

export function getUpgradeInfo(item) {
  if (!item || !item.affinity) return null;
  const aff = item.affinity.Standard || item.affinity[Object.keys(item.affinity)[0]];
  if (!aff) return null;
  const costs = item.upgrade_costs;
  let maxLevel = Array.isArray(costs) ? costs.length : 0;
  if (!maxLevel && aff.reinforcement_id !== undefined && MAX_LV_MAP[aff.reinforcement_id] !== undefined) maxLevel = MAX_LV_MAP[aff.reinforcement_id];
  if (!maxLevel) return null;
  const isSomber = maxLevel === 10;
  const dmgRate = isSomber ? 0.10 : 0.04;
  const scaRate = isSomber ? 0.05 : 0.02;
  const reinfId = aff.reinforcement_id;
  const curveData = reinforcementData?.weapon;
  const hasCurve = curveData && reinfId !== undefined && curveData[String(reinfId)];

  const dmgTypes = ['physical', 'magic', 'fire', 'lightning', 'holy', 'stamina'];
  const statTypes = ['strength', 'dexterity', 'intelligence', 'faith', 'arcane'];
  const curve = {};

  for (let i = 0; i <= maxLevel; i++) {
    let dmgMult = { stamina: 1 };
    let scaMult = {};

    if (hasCurve) {
      const entry = curveData[String(reinfId + i)];
      if (entry) {
        for (const [rk, dk] of Object.entries(REINF_DMG_MAP)) {
          dmgMult[dk] = entry[rk] !== undefined ? entry[rk] : 1 + i * dmgRate;
        }
        for (const [rk, sk] of Object.entries(REINF_SCA_MAP)) {
          scaMult[sk] = entry[rk] !== undefined ? entry[rk] : 1 + i * scaRate;
        }
      } else {
        // Entry missing for this level — use fallback
        for (const s of statTypes) scaMult[s] = 1 + i * scaRate;
        for (const t of dmgTypes) dmgMult[t] = 1 + i * dmgRate;
      }
    } else {
      // No reinforcement data at all — use fallback
      for (const s of statTypes) scaMult[s] = 1 + i * scaRate;
      for (const t of dmgTypes) dmgMult[t] = 1 + i * dmgRate;
    }

    curve[i] = { damage: dmgMult, scaling: scaMult };
  }

  return {
    isSomber, maxLevel, curve,
    baseDamage: aff.damage || {},
    baseScaling: aff.scaling || {},
    calcLevel(level) {
      const entry = curve[level];
      if (!entry) return null;
      const dmg = {};
      for (const t of dmgTypes) {
        if (aff.damage[t] !== undefined) dmg[t] = Math.round(aff.damage[t] * entry.damage[t]);
      }
      const sca = {};
      for (const s of statTypes) {
        if (aff.scaling[s] !== undefined) sca[s] = aff.scaling[s] * entry.scaling[s];
      }
      return { damage: dmg, scaling: sca, level };
    },
    calcAllLevels() {
      const results = [];
      for (let i = 0; i <= maxLevel; i++) { const r = this.calcLevel(i); if (r) results.push(r); }
      return results;
    },
  };
}

export function scalingGrade(val) {
  if (val >= 1.4) return 'S';
  if (val >= 1.0) return 'A';
  if (val >= 0.7) return 'B';
  if (val >= 0.4) return 'C';
  if (val >= 0.2) return 'D';
  return 'E';
}

const ARMOR_PIECE_WORDS = [
  ' Helm(et)?$', ' Armor$', ' Gauntlets$', ' Greaves$', ' Boots$', ' Trousers$',
  ' Leggings$', ' Skirt$', ' Crown$', ' Hood$', ' Mantle$', ' Robe$',
  ' Wrap$', ' Bracelets$', ' Bracer$', ' Tassets$', ' Waistwrap$',
  ' Mail$', ' Surcoat$', ' Garb$', ' Tabard$', ' Shield$',
];
const ARMOR_PIECE_CN = ['头盔', '铠甲', '臂甲', '腿甲', '靴子', '长裤',
  '护腿', '裙子', '王冠', '头冠', '风帽', '披肩', '长袍',
  '裹腿', '手镯', '腕套', '腿甲', '腰布',
  '锁甲', '罩衣', '服装', '战袍', '盾', '镜面盔',
];

function deriveSetKey(name) {
  let s = name.replace(/ \(Altered\)$/, '');
  for (const pat of ARMOR_PIECE_WORDS) {
    s = s.replace(new RegExp(pat), '');
  }
  return s.trim();
}

function getSetNameCn(pieces) {
  const pcs = pieces.filter(p => p.name_cn && p.name_cn !== p.name_en);
  if (pcs.length > 0) {
    let cn = pcs[0].name_cn;
    for (const suffix of ARMOR_PIECE_CN) {
      const idx = cn.lastIndexOf(suffix);
      if (idx > 0) { cn = cn.slice(0, idx); break; }
    }
    return cn.trim() || pcs[0].name_cn;
  }
  // Fallback: strip English piece words from first piece's English name
  const first = pieces[0].name_en || pieces[0].name;
  let s = first.replace(/ \(Altered\)$/, '');
  for (const pat of ARMOR_PIECE_WORDS) {
    s = s.replace(new RegExp(pat), '');
  }
  return s.trim() || pieces[0].name;
}

export function getArmorSets() {
  const armor = cache['armor'] || [];
  const sets = {};
  for (const item of armor) {
    const sk = deriveSetKey(item.name_en || item.name);
    if (!sets[sk]) sets[sk] = [];
    sets[sk].push(item);
  }
  return Object.entries(sets)
    .filter(([, pieces]) => pieces.length >= 2)
    .map(([key, pieces]) => {
      const nameCn = getSetNameCn(pieces) || translateName(key) || key;
      return {
        key,
        name_cn: nameCn,
        pieces,
        count: pieces.length,
        hasAllSlots: ['Head', 'Body', 'Arms', 'Legs'].every(slot =>
          pieces.some(p => p.category === slot)
        ),
      };
    })
    .sort((a, b) => b.count - a.count);
}
