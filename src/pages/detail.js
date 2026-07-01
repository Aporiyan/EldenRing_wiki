import { getItem, getUpgradeInfo, scalingGrade, translateName, ATTR_CN, getLocations, getItemImageUrl } from '../store.js';

const DMG_CN = { physical: '物理', magic: '魔力', fire: '火', lightning: '雷', holy: '圣' };
const DMG_COLORS = { physical: '#c9a84c', magic: '#7a8fc9', fire: '#d4743a', lightning: '#8ad4c9', holy: '#d4c97a' };


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

    const hasDetailImage = key === 'armaments' || key === 'armor' || key === 'talismans' || key === 'spells' || key === 'ashes-of-war' || key === 'spirit-ashes';

    container.innerHTML = `
      <div class="detail-view">
        <a class="detail-back" href="${backRoute}">← 返回列表</a>
        <div class="detail-header">
          ${hasDetailImage ? '<div class="detail-weapon-img-wrap"><img class="detail-weapon-img" alt="' + item.name + '"></div>' : ''}
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
        ${renderChartSection(item, upgradeInfo)}
        ${renderCorrectionSection(item, key)}
        ${renderLocations(item)}
        ${renderRemarks(item)}
        ${renderConflicts(item)}
      </div>`;

    if (upgradeInfo) {
      (async () => {
        const chartEl = container.querySelector('#dchart-canvas');
        const toggleEls = container.querySelectorAll('[data-dchart]');
        if (!chartEl) return;
        const info = getUpgradeInfo(item);
        const allLevels = info.calcAllLevels();
        const maxLvl = info.maxLevel;
        const dmgKeys = ['physical','magic','fire','lightning','holy'].filter(k => allLevels[maxLvl]?.damage?.[k] > 0);
        if (!dmgKeys.length) return;
        let chartMode = 'curve';

        async function drawChart() {
          const { drawLineChart, drawBarChart } = await import('../charts.js');
          if (chartMode === 'curve') {
            drawLineChart(chartEl, null, {
              title: '各属性伤害 · 强化等级',
              yLabel: '伤害',
              xLabels: allLevels.map((_, i) => `+${i}`),
              datasets: dmgKeys.map(k => ({
                label: DMG_CN[k], color: DMG_COLORS[k],
                values: allLevels.map(l => l.damage?.[k] || 0),
              })),
            });
          } else {
            drawBarChart(chartEl, null, {
              title: `+0 vs +${maxLvl}`,
              yLabel: '伤害',
              labels: dmgKeys.map(k => DMG_CN[k]),
              groups: dmgKeys.map(k => ({
                values: [allLevels[0].damage?.[k] || 0, allLevels[maxLvl].damage?.[k] || 0]
              })),
              colors: ['rgba(201,168,76,0.4)', '#c9a84c'],
              legend: ['+0', `+${maxLvl}`],
            });
          }
        }

        toggleEls.forEach(btn => {
          btn.addEventListener('click', () => {
            toggleEls.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            chartMode = btn.dataset.dchart;
            requestAnimationFrame(drawChart);
          });
        });

        requestAnimationFrame(drawChart);
      })();
    }

    // Correction curves
    if (key === 'armaments') {
      (async () => {
        const area = container.querySelector('#corr-chart-area');
        if (!area) return;
        await loadCorrectionData();
        const aff = item.affinity?.Standard || item.affinity?.[Object.keys(item.affinity || {})[0]];
        if (!aff) { area.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:0.85rem">无补正数据</div>'; return; }
        drawCorrectionCurves(area, item, aff);
      })();
    }

    if (hasDetailImage) {
      (async () => {
        const imgEl = container.querySelector('.detail-weapon-img');
        if (!imgEl) return;
        const url = getItemImageUrl(key, item.name_en || item.name);
        if (url) {
          imgEl.src = url;
          imgEl.style.display = 'block';
        }
      })();
    }

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
    reqs.map(([k, v]) => row(map[k] || k, v)).join('')
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

function renderChartSection(item, info) {
  if (!info) return '';
  const allLevels = info.calcAllLevels();
  const maxLvl = info.maxLevel;
  const dmgKeys = ['physical','magic','fire','lightning','holy'].filter(k => allLevels[maxLvl]?.damage?.[k] > 0);
  if (!dmgKeys.length) return '';
  return `
    <div class="stat-block" style="margin-top:12px">
      <div class="stat-block-title">伤害曲线</div>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <button class="tag-filter-btn active" data-dchart="curve">强化曲线</button>
        <button class="tag-filter-btn" data-dchart="compare">+0 vs +${maxLvl}</button>
      </div>
      <div style="padding:0;">
        <canvas id="dchart-canvas" style="width:100%;height:200px;"></canvas>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
        ${dmgKeys.map(k => `<span style="display:flex;align-items:center;gap:4px;font-size:0.75rem;color:var(--text-muted);"><span style="width:8px;height:8px;border-radius:2px;background:${DMG_COLORS[k]};display:inline-block;"></span>${DMG_CN[k]}</span>`).join('')}
      </div>
    </div>`;
}

function renderLocations(item) {
  const locs = getLocations(item);
  if (!locs || !locs.sources || !locs.sources.length) return '';
  const rows = locs.sources.map(s => {
    if (s.type === 'boss') {
      return `<div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;padding:3px 0;">
        <span style="color:var(--accent-gold);font-weight:600;">Boss掉落</span>
        <span style="color:var(--text);">${s.bossName_cn || s.bossName}</span>
        <span style="color:var(--text-muted);font-size:0.7rem;">📍 ${s.location_cn || ''}</span>
        <span style="color:var(--text-muted);font-size:0.7rem;">🗺 ${s.region_cn || ''}</span>
      </div>`;
    }
    if (s.type === 'merchant') {
      return `<div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;padding:3px 0;">
        <span style="color:#7a8fc9;font-weight:600;">商人出售</span>
        <span style="color:var(--text);">${s.merchantName_cn || s.merchantName}</span>
        ${s.price ? `<span style="color:var(--accent-gold);font-size:0.75rem;">${s.price}卢恩</span>` : ''}
        ${s.quantity_max != null ? `<span style="color:var(--text-muted);font-size:0.7rem;">×${s.quantity_max === 0 ? '无限' : s.quantity_max}</span>` : ''}
      </div>`;
    }
    if (s.type === 'quest') {
      return `<div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;padding:3px 0;">
        <span style="color:#6a9a4a;font-weight:600;">任务奖励</span>
        <span style="color:var(--text);">${s.npc_cn || s.npc}</span>
        ${s.reward_cn ? `<span style="color:var(--text-muted);font-size:0.75rem;">→ ${s.reward_cn}</span>` : ''}
      </div>`;
    }
    if (s.type === 'crafting') {
      return `<div style="display:flex;align-items:center;gap:6px;font-size:0.8rem;padding:3px 0;">
        <span style="color:#d47a4a;font-weight:600;">制作</span>
        <span style="color:var(--text);">${s.cookbook_cn || s.cookbook}</span>
      </div>`;
    }
    return '';
  }).join('');
  return `<div class="stat-block"><div class="stat-block-title">获取来源</div><div style="padding:8px;">${rows}</div></div>`;
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

let correctionGraphData = null;
let correctionAttackData = null;

async function loadCorrectionData() {
  if (correctionGraphData) return;
  const [cg, ca] = await Promise.all([
    fetch('./data/correction-graph.json').then(r => r.json()),
    fetch('./data/correction-attack.json').then(r => r.json()),
  ]);
  correctionGraphData = cg;
  correctionAttackData = ca;
}

const CORR_STAT_CN = { strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };
const CORR_DMG_CN = { physical: '物理', magic: '魔力', fire: '火', lightning: '雷', holy: '圣' };
const CORR_COLORS = ['#c9a84c', '#e74a3b', '#4ca84c', '#4c8ac9', '#8a4cc9'];

function renderCorrectionSection(item, key) {
  if (key !== 'armaments') return '';
  const aff = item.affinity?.Standard || item.affinity?.[Object.keys(item.affinity || {})[0]];
  if (!aff || !aff.scaling) return '';
  const activeScaling = Object.entries(aff.scaling).filter(([, v]) => v > 0);
  if (!activeScaling.length) return '';

  return `<div class="stat-block" style="margin-top:12px">
    <div class="stat-block-title">补正曲线</div>
    <div id="corr-chart-area" style="min-height:50px">
      <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem">加载中...</div>
    </div>
  </div>`;
}

function drawCorrectionCurves(container, item, aff) {
  if (!correctionGraphData || !correctionAttackData) return;
  const scaling = aff.scaling || {};
  const correctionCalcId = aff.correction_calc_id || {};
  const atkId = aff.correction_attack_id;
  const atkConfig = correctionAttackData[String(atkId)];
  const damage = aff.damage || {};

  const activeScaling = Object.entries(scaling).filter(([, v]) => v > 0);
  if (!activeScaling.length) { container.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:0.85rem">无补正数据</div>'; return; }

  const charts = [];
  for (const [stat, scaVal] of activeScaling) {
    for (const dmgType of ['physical', 'magic', 'fire', 'lightning', 'holy']) {
      if ((damage[dmgType] || 0) === 0) continue;
      const gId = String(correctionCalcId[dmgType] !== undefined ? correctionCalcId[dmgType] : 0);
      const gData = correctionGraphData[gId];
      if (!gData) continue;
      if (atkConfig && atkConfig.correction && atkConfig.correction[dmgType] && atkConfig.correction[dmgType][stat] === false) continue;
      const ratio = (atkConfig && atkConfig.ratio && atkConfig.ratio[dmgType]) ? (atkConfig.ratio[dmgType][stat] || 1.0) : 1.0;
      const base = damage[dmgType] || 0;
      const points = [];
      for (let s = 1; s <= 99; s++) {
        const gVal = gData[Math.min(s, 150)] || 0;
        const bonus = gVal * scaVal * ratio;
        points.push({ stat: s, bonus: Math.round(bonus * 100) / 100, total: Math.round((base + base * bonus) * 10) / 10 });
      }
      charts.push({ stat, dmgType, scaVal, points, base });
    }
  }

  if (!charts.length) { container.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:0.85rem">无可用补正数据</div>'; return; }

  const statGroups = {};
  for (const c of charts) {
    if (!statGroups[c.stat]) statGroups[c.stat] = [];
    statGroups[c.stat].push(c);
  }

  const W = 420, H = 170, PAD = { top: 12, right: 8, bottom: 20, left: 40 };

  function renderSvg(points, label, color) {
    const maxVal = Math.max(...points.map(p => p.total));
    const minVal = Math.min(...points.map(p => p.total));
    const range = maxVal - minVal || 1;
    const xScale = s => PAD.left + (s - 1) / 98 * (W - PAD.left - PAD.right);
    const yScale = v => PAD.top + (1 - (v - minVal) / range) * (H - PAD.top - PAD.bottom);
    const yTicks = 4;
    const yStep = range / yTicks;
    const yAxis = [];
    for (let i = 0; i <= yTicks; i++) {
      const v = Math.round((minVal + i * yStep) * 10) / 10;
      yAxis.push({ v, y: yScale(v) });
    }
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.stat).toFixed(1)},${yScale(p.total).toFixed(1)}`).join(' ');
    return `<svg width="${W}" height="${H}" style="background:var(--bg-tertiary);border-radius:6px;overflow:visible">
      ${yAxis.map(t => `<text x="${PAD.left - 4}" y="${t.y + 3}" text-anchor="end" font-size="8" fill="var(--text-muted)">${t.v}</text>
        <line x1="${PAD.left}" y1="${t.y}" x2="${W - PAD.right}" y2="${t.y}" stroke="var(--border-color)" stroke-width="0.5"/>`).join('')}
      <text x="${PAD.left}" y="${H - 4}" text-anchor="middle" font-size="8" fill="var(--text-muted)">1</text>
      <text x="${xScale(50)}" y="${H - 4}" text-anchor="middle" font-size="8" fill="var(--text-muted)">50</text>
      <text x="${xScale(99)}" y="${H - 4}" text-anchor="middle" font-size="8" fill="var(--text-muted)">99</text>
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <text x="${W - PAD.right - 2}" y="${PAD.top + 10}" text-anchor="end" font-size="9" fill="${color}" font-weight="600">${label}</text>
    </svg>`;
  }

  const html = Object.entries(statGroups).map(([stat, chartList]) => `
    <div style="margin-bottom:10px">
      <div style="font-weight:600;font-size:0.8rem;color:var(--accent-gold);margin-bottom:6px">${CORR_STAT_CN[stat] || stat}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${chartList.map((c, i) => renderSvg(c.points, CORR_DMG_CN[c.dmgType] || c.dmgType, CORR_COLORS[i % CORR_COLORS.length])).join('')}
      </div>
      <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px">
        ${chartList.map(c => `<span style="margin-right:10px"><span style="color:${CORR_COLORS[chartList.indexOf(c) % CORR_COLORS.length]}">●</span> ${CORR_DMG_CN[c.dmgType]}（基础${c.base}，系数${c.scaVal.toFixed(2)}）</span>`).join('')}
      </div>
    </div>
  `).join('');
  container.innerHTML = html;
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
