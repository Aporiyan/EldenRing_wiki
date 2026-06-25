import { getItem, getUpgradeInfo, scalingGrade, translateName, ATTR_CN, getLocations } from '../store.js';


const WEP_CAT_CN = {
  Dagger: '匕首', 'Straight Sword': '直剑', Greatsword: '大剑',
  'Colossal Sword': '特大剑', 'Colossal Weapon': '特大武器',
  'Thrusting Sword': '刺剑',
  'Heavy Thrusting Sword': '大重剑', 'Curved Sword': '曲剑',
  'Curved Greatsword': '大刀', Katana: '武士刀', Twinblade: '双头剑',
  Hammer: '锤', 'Great Hammer': '大锤', Flail: '连枷',
  Axe: '斧', Greataxe: '大斧', Halberd: '戟', Spear: '矛',
  'Great Spear': '大矛', Lance: '长矛', Reaper: '镰刀', Scythe: '镰刀', Whip: '鞭',
  Fist: '拳', Claw: '爪', 'Light Bow': '小弓', Bow: '弓',
  Greatbow: '大弓', Crossbow: '弩', Ballista: '弩炮',
  'Glintstone Staff': '杖', Staff: '杖', 'Sacred Seal': '圣印记', Torch: '火把',
  'Small Shield': '小盾', 'Medium Shield': '中盾', Shield: '盾',
  Greatshield: '大盾', Arrow: '箭', Bolt: '弩箭',
  'Great Arrow': '大箭', 'Great Bolt': '大弩箭',
  'Small Swords': '小型剑', 'Great Swords': '大型剑',
  'Thrusting Swords': '刺剑类', 'Curved Swords': '曲剑类',
  Katanas: '武士刀类', Axes: '斧类', Greataxes: '大斧类',
  Hammers: '锤类', Flails: '连枷类', Twinblades: '双头剑类',
  'Spears and Great Spears': '矛与大矛', 'Halberds and Scythes': '戟与镰刀',
  Colossal: '特大武器', Whips: '鞭类', Fists: '拳类', Claws: '爪类',
  Bows: '弓类', Greatbows: '大弓类', Crossbows: '弩类',
  Ballistas: '弩炮类', Staves: '杖类', 'Sacred Seals': '圣印记类',
  'Small Shields': '小盾类', 'Medium Shields': '中盾类', Shields: '盾牌类',
  Greatshields: '大盾类', Torches: '火把类',
  'Backhand Blade': '反手剑', 'Great Katana': '大刀',
  'Light Greatsword': '轻大剑', 'Hand-to-Hand': '格斗术',
  'Perfume Bottle': '调香瓶', 'Throwing Blade': '投掷剑',
  'Thrusting Shield': '突刺盾',
};

const AFF_CN = {
  Standard: '标准', Heavy: '厚重', Keen: '锋利', Quality: '优质',
  Fire: '火焰', 'Flame Art': '焰术', Lightning: '雷电', Sacred: '神圣',
  Magic: '魔力', Cold: '寒冷', Poison: '毒', Blood: '血', Occult: '神秘',
};

const MAT_CN = {
  'Smithing Stone': '锻造石',
  'Somber Smithing Stone': '失色锻造石',
  'Ghost Glovewort': '灵依铃兰',
};

export function createDetailPage(key, title) {
  return async (container, params) => {
    const id = Number(params.id) || params.id;
    const item = getItem(key, id);

    if (!item) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">未找到该物品</div></div>';
      return () => {};
    }

    const savedBack = sessionStorage.getItem('itemsBack');
    sessionStorage.removeItem('itemsBack');
    const hashBack = params.back || savedBack || new URLSearchParams(window.location.hash.split('?')[1] || '').get('back');
    const backRoute = hashBack ? '#' + hashBack :
      key === 'armaments' ? '#/weapons' :
      key === 'ashes-of-war' ? '#/ashes' :
      key === 'spirit-ashes' ? '#/spirits' :
      key === 'tools' || key === 'keys' || key === 'crafting-materials' || key === 'bolstering-materials' ? '#/items' :
      `#/${key}`;

    const SUMMARY_CN = {
      'Raises all attributes': '提升所有能力值',
      'Raises maximum HP, FP and stamina': '提升最大HP、专注值与精力',
      'Greatly raises maximum HP': '大幅提升最大HP',
      'Restores HP upon defeating enemies': '击败敌人时恢复HP',
      'Grants a blessing of blood to phantoms': '为唤来的灵体授予血的祝福',
      'Attacks recover HP after damage is taken': '受到伤害后，攻击可恢复HP',
    };
    const desc = item.description ? (Array.isArray(item.description) ? item.description.join('\n') : item.description) : '';
    const hasChineseDesc = desc && !/[a-zA-Z]/.test(desc.slice(0, 10));
    const summary = item.summary && item.summary !== 'no summary' ? item.summary : '';
    const summaryCn = SUMMARY_CN[summary] || summary;
    const isGreatRune = item.category === 'Great Rune';
    const isSpell = item.slots_used !== undefined;
    const upgradeInfo = key === 'armaments' ? getUpgradeInfo(item) : null;
    const isAshUpgrade = key === 'spirit-ashes' && item.upgrade_material;

    container.innerHTML = `
      <div class="detail-view">
        <a class="detail-back" href="${backRoute}">← 返回列表</a>
        <div class="detail-header">
          <div class="detail-title">${item.name}</div>
          <div class="detail-category">${item.category_cn || item.category || title}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            ${item.rarity !== 'Common' ? `<span class="item-card-rarity rarity-${item.rarity}">${item.rarity_cn || item.rarity}</span>` : ''}
            ${upgradeInfo ? `<span class="upgrade-badge ${upgradeInfo.isSomber ? 'somber' : 'normal'}">${upgradeInfo.isSomber ? '失色武器' : '普通武器'} · +0 ~ +${upgradeInfo.maxLevel}</span>` : ''}
            ${isAshUpgrade ? `<span class="upgrade-badge normal">灵灰 · +0 ~ +10</span>` : ''}
          </div>
          ${isGreatRune && summary ? `<div style="margin-top:8px;padding:8px 12px;background:rgba(255,215,0,0.08);border:1px solid rgba(255,215,0,0.2);border-radius:6px;font-size:0.85rem"><strong style="color:var(--accent-gold)">激活效果：</strong> ${summaryCn}</div>` : ''}
          ${summary && !isGreatRune ? `<div class="detail-description">${summary}</div>` : ''}
          ${desc ? `<div class="detail-description">${desc}</div>` : ''}
        </div>
        <div class="detail-stats">
          ${renderBasicStats(item, isSpell)}
          ${renderReqs(item)}
          ${renderAttack(item)}
          ${renderScaling(item, upgradeInfo)}
          ${renderGuard(item)}
          ${renderEffects(item)}
          ${renderAbs(item)}
          ${renderRes(item)}
          ${isSpell ? renderSpellStats(item) : ''}
          ${renderAsh(item)}
          ${renderSkill(item)}
        </div>
        ${upgradeInfo ? renderUpgradeTable(upgradeInfo, upgradeInfo.isSomber) : ''}
        ${renderLocations(item)}
        ${renderRemarks(item)}
        ${renderConflicts(item)}
      </div>`;

    return () => {};
  };
}

function renderBasicStats(item, isSpell) {
  const rows = [];
  if (item.weight !== undefined) rows.push(['重量', item.weight]);
  if (item.price_sold > 0) rows.push(['出售价格', `${item.price_sold} 魂`]);
  if (item.is_tradable !== undefined) rows.push(['可交易', item.is_tradable ? '是' : '否']);
  if (item.max_held !== undefined) rows.push(['最大持有', item.max_held]);
  if (item.upgrade_material) rows.push(['强化素材', MAT_CN[item.upgrade_material] || item.upgrade_material]);
  if (item.allow_ash_of_war !== undefined) rows.push(['可改战灰', item.allow_ash_of_war ? '是' : '否']);
  if (item.is_buffable !== undefined) rows.push(['可附魔', item.is_buffable ? '是' : '否']);
  if (isSpell && item.slots_used !== undefined) rows.push(['记忆格', item.slots_used]);
  if (item.fp_cost !== undefined) rows.push(['专注消耗', item.fp_cost]);
  if (item.hp_cost) rows.push(['血量消耗', item.hp_cost]);
  if (!rows.length) return '';
  return block('基础信息', rows.map(r => row(r[0], r[1])).join(''));
}

function renderReqs(item) {
  if (!item.requirements) return '';
  const reqs = Object.entries(item.requirements).filter(([, v]) => v > 0);
  if (!reqs.length) return '';
  const map = { strength: '力量', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };
  return block('需求属性',
    reqs.map(([k, v]) => `<span class="req-badge" style="font-size:0.85rem;padding:4px 14px">${map[k] || k} ${v}</span>`).join(' ')
  );
}

function renderAttack(item) {
  if (!item.affinity) return '';
  const affKey = Object.keys(item.affinity)[0];
  const aff = item.affinity[affKey];
  if (!aff || !aff.damage) return '';
  const dmg = aff.damage;
  const label = AFF_CN[affKey] || affKey;
  const types = [['physical', '物理'], ['magic', '魔法'], ['fire', '火焰'], ['lightning', '雷'], ['holy', '圣']];
  const valid = types.filter(([k]) => dmg[k] !== undefined && dmg[k] > 0);
  if (!valid.length && !dmg.stamina) return '';
  return block(`攻击力 (${label})`,
    valid.map(([k, cn]) => row(cn, dmg[k])).join('') +
    (dmg.stamina ? row('精力', dmg.stamina) : '')
  );
}

function renderScaling(item, upgradeInfo) {
  if (!item.affinity) return '';
  const affKey = Object.keys(item.affinity)[0];
  const aff = item.affinity[affKey];
  if (!aff || !aff.scaling) return '';
  const sc = aff.scaling;
  const stats = [['strength', '力量'], ['dexterity', '灵巧'], ['intelligence', '智力'], ['faith', '信仰'], ['arcane', '感应']];
  // Compute max-upgrade scaling values for display
  let maxSca = {};
  if (upgradeInfo) {
    const maxLv = upgradeInfo.calcLevel(upgradeInfo.maxLevel);
    if (maxLv) maxSca = maxLv.scaling;
  }
  const valid = stats.filter(([k]) => sc[k] !== undefined && sc[k] > 0);
  if (!valid.length) return '';
  const grade = (v) => v >= 1.4 ? 'S' : v >= 1.0 ? 'A' : v >= 0.7 ? 'B' : v >= 0.4 ? 'C' : v >= 0.2 ? 'D' : 'E';
  const label = upgradeInfo ? `补正 (+${upgradeInfo.maxLevel})` : `补正 (${AFF_CN[affKey] || affKey})`;
  return block(label,
    `<div class="scaling-display">${valid.map(([k, cn]) => {
      const val = maxSca[k] || sc[k];
      const g = grade(val);
      return `<span class="scaling-badge scaling-${g}">${cn} ${g}</span>`;
    }).join('')}</div>`
  );
}

function renderGuard(item) {
  if (!item.affinity) return '';
  const aff = item.affinity[Object.keys(item.affinity)[0]];
  if (!aff || !aff.guard) return '';
  const g = aff.guard;
  const types = [['physical', '物理'], ['magic', '魔法'], ['fire', '火焰'], ['lightning', '雷'], ['holy', '圣']];
  const valid = types.filter(([k]) => g[k] !== undefined);
  if (!valid.length && !g.guard_boost) return '';
  return block('防御强度',
    valid.map(([k, cn]) => row(cn, g[k])).join('') +
    (g.guard_boost ? row('格挡强度', g.guard_boost) : '')
  );
}

function renderEffects(item) {
  if (!item.effects || !item.effects.length) return '';
  return block('效果',
    item.effects.map(e => {
      const attr = ATTR_CN[e.attribute] || e.attribute;
      const val = e.type === 'multiplicative' ? `×${e.value}` : `+${e.value}`;
      return row(attr, val);
    }).join('')
  );
}

function renderAbs(item) {
  if (!item.absorptions) return '';
  const map = { physical: '物理', strike: '打击', slash: '斩击', pierce: '突刺', magic: '魔法', fire: '火焰', lightning: '雷', holy: '圣' };
  return block('减伤率',
    Object.entries(item.absorptions).map(([k, v]) =>
      `<span class="absorption-pill">${map[k] || k} ${v}%</span>`
    ).join('')
  );
}

function renderRes(item) {
  if (!item.resistances) return '';
  const map = { immunity: '免疫', robustness: '强韧', focus: '专注', vitality: '活力', poise: '韧性' };
  return block('抵抗力',
    Object.entries(item.resistances).map(([k, v]) => row(map[k] || k, v)).join('')
  );
}

function renderSpellStats(item) {
  const rows = [];
  if (item.sp_cost !== undefined) rows.push(['精力消耗', item.sp_cost]);
  if (item.fp_cost_extra) rows.push(['追加专注', item.fp_cost_extra]);
  if (item.is_weapon_buff !== undefined) rows.push(['武器附魔', item.is_weapon_buff ? '是' : '否']);
  if (item.is_shield_buff !== undefined) rows.push(['盾牌附魔', item.is_shield_buff ? '是' : '否']);
  if (item.is_horseback_castable !== undefined) rows.push(['骑马可用', item.is_horseback_castable ? '是' : '否']);
  if (!rows.length) return '';
  return block('法术数据', rows.map(r => row(r[0], r[1])).join(''));
}

function renderAsh(item) {
  if (!item.armament_categories) return '';
  return block('适用武器',
    item.armament_categories.map(c => WEP_CAT_CN[c] || c).map(c =>
      `<span class="req-badge" style="font-size:0.8rem;padding:3px 10px">${c}</span>`
    ).join('')
  );
}

function renderSkill(item) {
  if (!item.skill) return '';
  const s = item.skill;
  return block('战技',
    (s.name ? `<div style="font-size:0.95rem;color:var(--accent-gold);margin-bottom:6px">${translateName(s.name)}</div>` : '') +
    (s.description ? `<div style="font-size:0.85rem;color:var(--text-secondary)">${s.description}</div>` : '')
  );
}

function renderUpgradeTable(info, isSomber) {
  const allLevels = info.calcAllLevels();
  const aff = info.baseDamage;
  const baseSca = info.baseScaling;

  const dmgTypes = [['physical', '物理'], ['magic', '魔法'], ['fire', '火焰'], ['lightning', '雷'], ['holy', '圣']];
  const scaStats = [['strength', '力气'], ['dexterity', '灵巧'], ['intelligence', '智力'], ['faith', '信仰'], ['arcane', '感应']];

  const showDmg = dmgTypes.filter(([k]) => aff[k] !== undefined && aff[k] > 0);
  const showSca = scaStats.filter(([k]) => baseSca[k] !== undefined && baseSca[k] > 0);
  const showSta = aff.stamina !== undefined && aff.stamina > 0;

  let lastGrades = {};
  const rows = allLevels.map((lv, i) => {
    const label = i === 0 ? '+0' : `+${i}`;
    const dmgCells = showDmg.map(([k]) => {
      const v = lv.damage[k];
      const prev = i > 0 ? allLevels[i - 1].damage[k] : v;
      const cls = v !== prev ? 'upgrade-changed' : '';
      return `<td class="${cls}">${v}</td>`;
    }).join('');
    const staCell = showSta ? `<td>${lv.damage.stamina}</td>` : '';
    const scaCells = showSca.map(([k]) => {
      const raw = lv.scaling[k];
      const gradeChar = scalingGrade(raw);
      const prevGrade = lastGrades[k] || gradeChar;
      lastGrades[k] = gradeChar;
      const cls = gradeChar !== prevGrade && i > 0 ? 'upgrade-changed' : '';
      return `<td class="${cls}"><span class="scaling-badge scaling-${gradeChar}" style="font-size:0.65rem;padding:1px 5px">${gradeChar}</span></td>`;
    }).join('');
    return `<tr><td class="upgrade-level">${label}</td>${dmgCells}${staCell}${scaCells}</tr>`;
  }).join('');

  const dmgHeaders = showDmg.map(([, cn]) => `<th>${cn}</th>`).join('');
  const staHeader = showSta ? '<th>精力</th>' : '';
  const scaHeaders = showSca.map(([, cn]) => `<th>${cn}<br><span style="font-size:0.6rem;font-weight:400;color:var(--text-muted)">补正</span></th>`).join('');

  return `
    <div class="stat-block" style="margin-top:12px">
      <div class="stat-block-title">强化面板 (${isSomber ? '+0 ~ +10' : '+0 ~ +25'})</div>
      <div class="upgrade-table-wrap">
        <table class="upgrade-table">
          <thead><tr><th>强化</th>${dmgHeaders}${staHeader}${scaHeaders}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderLocations(item) {
  return '';
}

function renderRemarks(item) {
  if (!item.remarks || !item.remarks.length) return '';
  return block('备注',
    item.remarks.map(r => `<div style="font-size:0.85rem;color:var(--text-secondary);padding:2px 0">${Array.isArray(r) ? r.join(' ') : r}</div>`).join(''),
    { flexCol: true }
  );
}

function renderConflicts(item) {
  if (!item.conflicts || !item.conflicts.length) return '';
  // Filter out self-reference and duplicates
  const ownCn = item.name_cn || item.name;
  const filtered = item.conflicts
    .map(c => translateName(c))
    .filter(c => c !== ownCn);
  const unique = [...new Set(filtered)];
  if (!unique.length) return '';
  return block('冲突（不可同时装备）',
    unique.map(c => `<div style="font-size:0.85rem;color:var(--accent-red);padding:2px 0">${c}</div>`).join(''),
    { flexCol: true }
  );
}

function block(title, content, opts = {}) {
  return `
    <div class="stat-block">
      <div class="stat-block-title">${title}</div>
      <div class="stat-block-content" style="${opts.flexCol ? 'flex-direction:column;' : ''}">
        ${content}
      </div>
    </div>`;
}

function row(label, value) {
  return `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`;
}
