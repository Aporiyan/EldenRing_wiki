import { getData, translateName, getItemImageUrl } from '../store.js';

const SECTIONS = [
  {
    label: '右手武器', key: 'weapon_r', type: 'armaments', cols: 3,
    slots: [
      { key: 'weapon_r1', label: 'R1' },
      { key: 'weapon_r2', label: 'R2' },
      { key: 'weapon_r3', label: 'R3' },
    ],
  },
  {
    label: '左手武器', key: 'weapon_l', type: 'armaments', cols: 3,
    slots: [
      { key: 'weapon_l1', label: 'L1' },
      { key: 'weapon_l2', label: 'L2' },
      { key: 'weapon_l3', label: 'L3' },
    ],
  },
  {
    label: '防具', key: 'armor', type: 'armor', cols: 2,
    slots: [
      { key: 'head', label: '头盔', filter: i => i.category === 'Head' },
      { key: 'chest', label: '铠甲', filter: i => i.category === 'Body' || i.category === 'Chest' },
      { key: 'arms', label: '臂甲', filter: i => i.category === 'Arms' },
      { key: 'legs', label: '腿甲', filter: i => i.category === 'Legs' },
    ],
  },
  {
    label: '护符', key: 'talismans', type: 'talismans', cols: 4,
    slots: [
      { key: 'tali1', label: '1' },
      { key: 'tali2', label: '2' },
      { key: 'tali3', label: '3' },
      { key: 'tali4', label: '4' },
    ],
  },
  {
    label: '记忆', key: 'memory', type: 'spells', cols: 4,
    slots: [
      { key: 'mem1', label: '1' },
      { key: 'mem2', label: '2' },
      { key: 'mem3', label: '3' },
      { key: 'mem4', label: '4' },
      { key: 'mem5', label: '5' },
      { key: 'mem6', label: '6' },
      { key: 'mem7', label: '7' },
      { key: 'mem8', label: '8' },
      { key: 'mem9', label: '9' },
      { key: 'mem10', label: '10' },
    ],
  },
];

const EQ_CLASSES = [
  { max: 0.3, label: '轻负重', color: '#1cc88a' },
  { max: 0.7, label: '中负重', color: '#f6c23e' },
  { max: 1.0, label: '重负重', color: '#e74a3b' },
  { max: Infinity, label: '超重', color: '#9b2c2c' },
];

const REQ_CN = { strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };

const STAT_ORDER = ['vigor', 'mind', 'endurance', 'strength', 'dexterity', 'intelligence', 'faith', 'arcane'];
const STAT_CN = { vigor: '生命力', mind: '集中力', endurance: '持久力', strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };
const DMG_TYPES = ['physical', 'magic', 'fire', 'lightning', 'holy'];
const DMG_CN = { physical: '物理', magic: '魔力', fire: '火', lightning: '雷', holy: '圣' };

const HP_TABLE = [
  [1,300],[2,320],[3,341],[4,363],[5,386],[6,410],[7,414],[8,419],[9,425],[10,432],
  [11,440],[12,449],[13,459],[14,470],[15,482],[16,495],[17,509],[18,524],[19,540],[20,557],
  [21,575],[22,588],[23,602],[24,617],[25,633],[26,650],[27,668],[28,687],[29,707],[30,728],
  [31,750],[32,773],[33,797],[34,809],[35,822],[36,836],[37,851],[38,867],[39,884],[40,1210],
  [41,1230],[42,1250],[43,1270],[44,1290],[45,1310],[46,1330],[47,1350],[48,1370],[49,1390],[50,1410],
  [51,1430],[52,1445],[53,1452],[54,1459],[55,1466],[56,1473],[57,1480],[58,1487],[59,1494],[60,1900],
  [61,1909],[62,1918],[63,1927],[64,1936],[65,1945],[66,1954],[67,1957],[68,1960],[69,1963],[70,1967],
  [71,1971],[72,1976],[73,1981],[74,1987],[75,1993],[76,2000],[77,2007],[78,2014],[79,2021],[80,2028],
  [81,2036],[82,2044],[83,2052],[84,2060],[85,2068],[86,2076],[87,2083],[88,2089],[89,2095],[90,2100],
  [91,2105],[92,2110],[93,2115],[94,2120],[95,2125],[96,2130],[97,2135],[98,2140],[99,2145],
];

const FP_TABLE = [
  [6,50],[7,53],[8,57],[9,61],[10,65],[11,69],[12,73],[13,77],[14,78],[15,79],
  [16,81],[17,82],[18,83],[19,85],[20,95],[21,100],[22,105],[23,110],[24,112],[25,114],
  [26,116],[27,118],[28,120],[29,122],[30,131],[31,136],[32,141],[33,146],[34,151],[35,155],
  [36,159],[37,163],[38,167],[39,170],[40,172],[41,175],[42,178],[43,181],[44,184],[45,187],
  [46,191],[47,195],[48,200],[49,210],[50,220],[51,230],[52,240],[53,252],[54,265],[55,278],
  [56,291],[57,304],[58,312],[59,316],[60,320],[61,328],[62,336],[63,344],[64,352],[65,360],
  [66,367],[67,374],[68,381],[69,388],[70,395],[71,401],[72,407],[73,413],[74,419],[75,425],
  [76,430],[77,435],[78,440],[79,442],[80,444],[81,446],[82,448],[83,450],[84,451],[85,452],
  [86,453],[87,454],[88,455],[89,456],[90,457],[91,458],[92,459],[93,460],[94,461],[95,462],
  [96,463],[97,464],[98,465],[99,466],
];

function lookupTable(tbl, val) {
  if (val <= tbl[0][0]) return tbl[0][1];
  if (val >= tbl[tbl.length - 1][0]) return tbl[tbl.length - 1][1];
  for (let i = 1; i < tbl.length; i++) {
    if (val <= tbl[i][0]) {
      const x0 = tbl[i - 1][0], y0 = tbl[i - 1][1];
      const x1 = tbl[i][0], y1 = tbl[i][1];
      return Math.round(y0 + (val - x0) * (y1 - y0) / (x1 - x0));
    }
  }
  return tbl[tbl.length - 1][1];
}

function calcHP(v) { return lookupTable(HP_TABLE, v); }
function calcFP(v) { return lookupTable(FP_TABLE, v); }
function calcStamina(v) {
  if (v <= 1) return 80;
  if (v <= 15) return Math.floor(80 + 25 * (v - 1) / 14);
  if (v <= 30) return Math.floor(105 + 25 * (v - 15) / 15);
  if (v <= 50) return Math.floor(130 + 25 * (v - 30) / 20);
  return Math.floor(155 + 15 * (v - 50) / 49);
}
function calcMaxLoad(v) {
  if (v <= 8) return 45.0;
  if (v <= 25) return Math.round((45 + 27 * (v - 8) / 17) * 10) / 10;
  if (v <= 60) return Math.round((72 + 48 * Math.pow((v - 25) / 35, 1.1)) * 10) / 10;
  return Math.round((120 + 40 * (v - 60) / 39) * 10) / 10;
}

const RESIST_KEYS = ['immunity', 'robustness', 'focus', 'vitality'];
const RESIST_CN = { immunity: '免疫力', robustness: '健壮度', focus: '理智度', vitality: '抗死度', poise: '强韧度' };
const RESIST_STAT = { immunity: 'arcane', robustness: 'endurance', focus: 'intelligence', vitality: 'faith' };

const EFFECT_STAT_MAP = {
  'Strength': 'strength', 'Dexterity': 'dexterity', 'Intelligence': 'intelligence',
  'Faith': 'faith', 'Arcane': 'arcane', 'Vigor': 'vigor', 'Mind': 'mind', 'Endurance': 'endurance',
};

export function renderBuildPlanner(container, params) {
  const build = {};
  let stats = { vigor: 10, mind: 10, endurance: 25, strength: 10, dexterity: 10, intelligence: 10, faith: 10, arcane: 10 };
  let correctionGraph = null;
  let correctionAttack = null;
  let correctionLoaded = false;

  const STORAGE_KEY = 'eldenring_bp';
  function saveBuild() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ build, stats })); } catch (e) {}
  }
  function loadBuild() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.build) Object.assign(build, data.build);
        if (data.stats) Object.assign(stats, data.stats);
        else if (typeof data.endurance === 'number') stats.endurance = data.endurance;
      }
    } catch (e) {}
  }
  function clearSavedBuild() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }
  loadBuild();

  function getPool(slot) {
    const sec = SECTIONS.find(s => s.slots.includes(slot));
    if (!sec) return [];
    let items = getData(sec.type);
    if (slot.filter) items = items.filter(slot.filter);
    if (sec.type === 'spells') return items;
    return items.filter(i => i.weight !== undefined);
  }

  function cellHTML(sl) {
    const equipped = build[sl.key];
    const cn = equipped ? (translateName(equipped.name) || equipped.name) : null;
    const cls = 'bp-cell' + (equipped ? ' has-item' : '');
    const sec = SECTIONS.find(s => s.slots.includes(sl));
    const isSpell = sec && sec.type === 'spells';
    return `<div class="${cls}" data-key="${sl.key}">
      <div class="bp-cell-label">${sl.label}</div>
      ${equipped
        ? `<div class="bp-cell-name">${cn}</div><div class="bp-cell-weight">${isSpell ? (equipped.fp_cost || 0) + 'FP' : equipped.weight}</div>`
        : `<div class="bp-cell-empty">空</div>`}
    </div>`;
  }

  function statRowHTML(sn, val) {
    const cn = STAT_CN[sn] || sn;
    return `<div style="display:flex;align-items:center;gap:6px;font-size:0.78rem">
      <span style="width:48px;color:var(--text-muted);flex-shrink:0">${cn}</span>
      <input type="number" data-stat="${sn}" value="${val}" min="1" max="99"
        style="width:44px;padding:2px 4px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-input);color:var(--text-primary);font-size:0.78rem;text-align:center">
      <input type="range" data-stat="${sn}" value="${val}" min="1" max="99" step="1"
        style="flex:1;accent-color:var(--accent-gold-dim);height:4px">
    </div>`;
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Build 配装器</div>
        <div class="page-meta" id="bp-meta">0 重量 · 0% 负重</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 280px;gap:16px">
        <div class="bp-grid">
          ${SECTIONS.map(sec => `
            <div class="bp-section">
              <div class="bp-section-header">${sec.label}</div>
              <div class="bp-section-body" style="grid-template-columns:repeat(${sec.cols},1fr)">
                ${sec.slots.map(sl => cellHTML(sl)).join('')}
              </div>
            </div>`).join('')}
        </div>
        <div id="bp-summary">
          <div class="bp-section" style="margin-bottom:12px">
            <div class="bp-section-header">加点配置</div>
            <div class="bp-section-body" style="padding:12px;display:flex;flex-direction:column;gap:6px" id="bp-stat-inputs">
              ${STAT_ORDER.map(sn => statRowHTML(sn, stats[sn] || 10)).join('')}
              <div style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-top:4px">等级 <span id="bp-rl-display">1</span></div>
            </div>
          </div>
          <div class="bp-section">
            <div class="bp-section-header">配置摘要</div>
            <div class="bp-section-body" style="display:flex;flex-direction:column;gap:10px;padding:14px">
              <div style="display:flex;justify-content:space-between;font-size:0.85rem">
                <span style="color:var(--text-muted)">总重量</span>
                <span id="bp-total-w" style="color:var(--text-primary);font-weight:600">0</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem">
                <span style="color:var(--text-muted)">负重上限</span>
                <span><span id="bp-end-display" style="font-weight:600;color:var(--text-primary)">${calcMaxLoad(stats.endurance).toFixed(0)}</span></span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.85rem">
                <span style="color:var(--text-muted)">负重比</span>
                <span id="bp-ratio" style="color:var(--text-primary);font-weight:600">0%</span>
              </div>
              <div style="height:8px;background:var(--bg-input);border-radius:4px;overflow:hidden">
                <div id="bp-bar-fill" style="height:100%;width:0%;border-radius:4px;transition:width .3s"></div>
              </div>
              <div id="bp-class" style="text-align:center;font-size:0.85rem;font-weight:600"></div>
              <div id="bp-reqs" style="border-top:1px solid var(--border-color);padding-top:10px">
                <div style="font-size:0.8rem;color:var(--text-muted)">选择装备后显示需求</div>
              </div>
              <button id="bp-clear" style="margin-top:8px;width:100%;padding:6px;border:1px solid var(--border-color);border-radius:4px;background:transparent;color:var(--text-muted);font-size:0.75rem;cursor:pointer">清除套装</button>
            </div>
          </div>

        </div>
        <div id="bp-status-panel" style="grid-column:1/-1;margin-top:4px"></div>
      </div>
    </div>
    <div id="bp-overlay" class="bp-overlay" style="display:none"></div>`;

  const overlay = container.querySelector('#bp-overlay');

  function getSlotDef(key) {
    for (const sec of SECTIONS)
      for (const sl of sec.slots)
        if (sl.key === key) return sl;
    return null;
  }

  function getSectionBySlotKey(key) {
    return SECTIONS.find(s => s.slots.some(sl => sl.key === key));
  }

  function openModal(slotKey) {
    const slotDef = getSlotDef(slotKey);
    if (!slotDef) return;
    const pool = getPool(slotDef);
    const sec = getSectionBySlotKey(slotKey);
    let query = '';
    let activeCat = '';

    const cats = [...new Set(pool.map(i => i.category_cn || i.category || ''))].filter(Boolean).sort();

    function renderItems() {
      const list = overlay.querySelector('#bp-mlist');
      const filtered = pool.filter(i => {
        if (query) {
          const cn = translateName(i.name) || i.name;
          if (!cn.toLowerCase().includes(query.toLowerCase()) && !i.name.toLowerCase().includes(query)) return false;
        }
        if (activeCat && (i.category_cn || i.category) !== activeCat) return false;
        return true;
      });
      if (!filtered.length) {
        list.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted);font-size:0.85rem">无匹配装备</div>';
        return;
      }
      list.innerHTML = filtered.map(i => {
        const cn = translateName(i.name) || i.name;
        const reqs = i.requirements ? Object.entries(i.requirements).filter(([, v]) => v > 0).map(([k, v]) => `${REQ_CN[k] || k}${v}`).join(' ') : '';
        const thumb = getItemImageUrl(sec.type, i.name_en || i.name);
        return `<div class="bp-mcard" data-id="${i.id}">
          ${thumb ? `<img class="bp-mcard-thumb" src="${thumb}" alt="">` : ''}
          <div class="bp-mcard-text">
            <div class="bp-mcard-name">${cn}</div>
            <div class="bp-mcard-meta">${i.weight}${reqs ? ' · ' + reqs : ''}</div>
          </div>
        </div>`;
      }).join('');
      list.querySelectorAll('.bp-mcard').forEach(el => {
        el.addEventListener('click', () => {
          const id = parseInt(el.dataset.id);
          const item = pool.find(i => i.id === id);
          if (item) {
            build[slotKey] = item;
            closeModal();
            renderCells();
            updateSummary();
            saveBuild();
          }
        });
      });
    }

    const hasCats = sec && sec.type === 'armaments';
    overlay.innerHTML = `
      <div class="bp-modal">
        <div class="bp-modal-head">
          <div class="bp-modal-head-left">
            <span class="bp-modal-icon">◈</span>
            <span class="bp-modal-title">${sec ? sec.label : ''} - ${slotDef.label}</span>
            <span class="bp-modal-count">${pool.length}</span>
          </div>
          <button class="bp-modal-close" id="bp-mclose">✕</button>
        </div>
        <div class="bp-modal-search">
          <input type="text" id="bp-msearch" placeholder="搜索名称...">
        </div>
        ${hasCats ? `<div class="bp-modal-filter" id="bp-mfilter">
          <span class="bp-chip ${activeCat === '' ? 'on' : ''}" data-cat="">全部</span>
          ${cats.map(c => `<span class="bp-chip ${activeCat === c ? 'on' : ''}" data-cat="${c}">${c}</span>`).join('')}
        </div>` : ''}
        <div class="bp-modal-list" id="bp-mlist"></div>
      </div>`;

    overlay.querySelector('#bp-mclose').addEventListener('click', closeModal);
    const bpInput = overlay.querySelector('#bp-msearch');
    if (bpInput) {
      let composing = false;
      bpInput.addEventListener('compositionstart', () => { composing = true; });
      bpInput.addEventListener('compositionend', () => { composing = false; query = bpInput.value; renderItems(); });
      bpInput.addEventListener('input', e => { if (composing) return; query = e.target.value; renderItems(); });
    }
    const filterDiv = overlay.querySelector('#bp-mfilter');
    if (filterDiv) {
      filterDiv.addEventListener('click', e => {
        const chip = e.target.closest('.bp-chip');
        if (!chip) return;
        overlay.querySelectorAll('.bp-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        activeCat = chip.dataset.cat;
        renderItems();
      });
    }
    overlay.style.display = 'flex';
    renderItems();
  }

  function closeModal() {
    overlay.style.display = 'none';
    overlay.innerHTML = '';
  }

  function renderCells() {
    document.querySelectorAll('.bp-cell').forEach(cell => {
      const key = cell.dataset.key;
      const slotDef = getSlotDef(key);
      if (!slotDef) return;
      const equipped = build[key];
      const cn = equipped ? (translateName(equipped.name) || equipped.name) : null;
      cell.className = 'bp-cell' + (equipped ? ' has-item' : '');
      cell.innerHTML = `
        <div class="bp-cell-label">${slotDef.label}</div>
        ${equipped
          ? `<div class="bp-cell-name">${cn}</div><div class="bp-cell-weight">${equipped.weight}</div>`
          : `<div class="bp-cell-empty">空</div>`}`;
    });
  }

  container.addEventListener('click', e => {
    const cell = e.target.closest('.bp-cell');
    if (cell) {
      openModal(cell.dataset.key);
    }
  });

  container.addEventListener('contextmenu', e => {
    const cell = e.target.closest('.bp-cell');
    if (cell) {
      e.preventDefault();
      delete build[cell.dataset.key];
      renderCells();
      updateSummary();
      saveBuild();
    }
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // ── Correction data loading ──
  async function loadCorrectionData() {
    try {
      const [g, a] = await Promise.all([
        fetch('./data/correction-graph.json').then(r => r.json()),
        fetch('./data/correction-attack.json').then(r => r.json()),
      ]);
      correctionGraph = g;
      correctionAttack = a;
      correctionLoaded = true;
      renderStatusPanel();
    } catch (e) {
      correctionLoaded = false;
    }
  }
  loadCorrectionData();

  // ── Utility ──
  function calcRuneLevel(st) {
    let total = 0;
    for (const sn of STAT_ORDER) total += st[sn] || 10;
    return total - 79;
  }

  function getEquippedEffects() {
    const effects = [];
    const talismanSlots = ['tali1', 'tali2', 'tali3', 'tali4'];
    for (const tk of talismanSlots) {
      const item = build[tk];
      if (item && item.effects) {
        for (const eff of item.effects) effects.push(eff);
      }
    }
    for (const sk of ['head', 'chest', 'arms', 'legs']) {
      const item = build[sk];
      if (item && item.effects) {
        for (const eff of item.effects) effects.push(eff);
      }
    }
    for (const wk of ['weapon_r1', 'weapon_r2', 'weapon_r3', 'weapon_l1', 'weapon_l2', 'weapon_l3']) {
      const item = build[wk];
      if (item && item.effects) {
        for (const eff of item.effects) effects.push(eff);
      }
    }
    return effects;
  }

  function calcEffectiveStats(baseStats) {
    const eff = { ...baseStats };
    const effects = getEquippedEffects();
    for (const effEntry of effects) {
      const sn = EFFECT_STAT_MAP[effEntry.attribute];
      if (sn && effEntry.model === 'additive' && typeof effEntry.value === 'number') {
        eff[sn] = Math.min(99, (eff[sn] || 10) + effEntry.value);
      }
    }
    // Also apply multiplicative stat effects
    for (const effEntry of effects) {
      const sn = EFFECT_STAT_MAP[effEntry.attribute];
      if (sn && effEntry.model === 'multiplicative' && typeof effEntry.value === 'number') {
        eff[sn] = Math.min(99, Math.round(eff[sn] * effEntry.value));
      }
    }
    return eff;
  }

  function applyEffects(val, attr, effects) {
    let result = val;
    for (const eff of effects) {
      if (eff.attribute === attr) {
        if (eff.model === 'multiplicative') result *= eff.value;
        else if (eff.model === 'additive') result += eff.value;
      }
    }
    return result;
  }

  // ── AR Calculation ──
  function calcWeaponAR(weapon, st) {
    if (!weapon || !weapon.affinity) return null;
    const aff = weapon.affinity.Standard || weapon.affinity[Object.keys(weapon.affinity)[0]];
    if (!aff) return null;

    const baseDamage = aff.damage || {};
    const scaling = aff.scaling || {};
    const graphIds = aff.correction_calc_id || {};
    const atkId = aff.correction_attack_id;
    const atkConfig = correctionAttack ? correctionAttack[String(atkId)] : null;

    const result = {};
    for (const dt of DMG_TYPES) {
      const base = baseDamage[dt] || 0;
      if (base === 0) { result[dt] = 0; continue; }
      let statBonus = 0;
      for (const s of ['strength', 'dexterity', 'intelligence', 'faith', 'arcane']) {
        const sca = scaling[s] || 0;
        if (sca === 0) continue;
        if (atkConfig && atkConfig.correction && atkConfig.correction[dt] && atkConfig.correction[dt][s] === false) continue;
        const gId = String(graphIds[dt] !== undefined ? graphIds[dt] : 0);
        const gData = correctionGraph ? correctionGraph[gId] : null;
        const gVal = gData ? (gData[Math.min(st[s] || 10, 150)] || 0) : 0;
        const ratioVal = (atkConfig && atkConfig.ratio && atkConfig.ratio[dt]) ? (atkConfig.ratio[dt][s] || 1.0) : 1.0;
        statBonus += gVal * sca * ratioVal;
      }
      result[dt] = Math.round(base + base * statBonus);
    }
    return result;
  }

  // ── Defense ──
  function calcDefense(rl, st) {
    let base;
    if (rl <= 10) base = 20 + rl * 3;
    else if (rl <= 50) base = 50 + (rl - 10) * 0.75;
    else if (rl <= 150) base = 80 + (rl - 50) * 0.5;
    else base = 130 + (rl - 150) * 0.25;
    base = Math.round(base);
    return {
      physical: base + Math.floor((st.strength || 10) * 0.2),
      magic: base + Math.floor((st.intelligence || 10) * 0.15),
      fire: base + Math.floor((st.faith || 10) * 0.15),
      lightning: base,
      holy: base + Math.floor((st.faith || 10) * 0.15),
    };
  }

  function calcResistances(rl, st) {
    let base;
    if (rl <= 10) base = 20 + rl * 3;
    else if (rl <= 50) base = 50 + (rl - 10) * 0.75;
    else if (rl <= 150) base = 80 + (rl - 50) * 0.5;
    else base = 130 + (rl - 150) * 0.25;
    base = Math.round(base);
    const result = {};
    for (const rk of RESIST_KEYS) {
      const s = RESIST_STAT[rk];
      result[rk] = base + Math.floor((st[s] || 10) * 0.2);
    }
    let poise = 0;
    for (const ak of ['head', 'chest', 'arms', 'legs']) {
      const item = build[ak];
      if (item && item.resistances) poise += item.resistances.poise || 0;
    }
    result.poise = poise;
    return result;
  }

  // ── Status Panel ──
  function renderStatusPanel() {
    const div = container.querySelector('#bp-status-panel');
    if (!div) return;

    const effStats = calcEffectiveStats(stats);
    const rl = calcRuneLevel(stats);
    const effects = getEquippedEffects();

    const hp = Math.round(applyEffects(calcHP(effStats.vigor), 'Maximum Health', effects));
    const fp = Math.round(applyEffects(calcFP(effStats.mind), 'Maximum Focus', effects));
    const stam = Math.round(applyEffects(calcStamina(effStats.endurance), 'Stamina', effects));
    const maxLoad = applyEffects(calcMaxLoad(effStats.endurance), 'Equip Load', effects);
    const discovery = 100 + (effStats.arcane || 10);
    const def = calcDefense(rl, effStats);
    const resists = calcResistances(rl, effStats);

    let totalWeight = 0;
    for (const sec of SECTIONS)
      for (const sl of sec.slots) {
        if (sec.type === 'spells') continue;
        const item = build[sl.key];
        if (item) totalWeight += item.weight || 0;
      }

    const memSlots = ['mem1','mem2','mem3','mem4','mem5','mem6','mem7','mem8','mem9','mem10']
      .filter(k => build[k]).length;

    // Weapon ARs
    const weaponSlots = [
      { key: 'weapon_r1', label: 'R1' }, { key: 'weapon_r2', label: 'R2' }, { key: 'weapon_r3', label: 'R3' },
      { key: 'weapon_l1', label: 'L1' }, { key: 'weapon_l2', label: 'L2' }, { key: 'weapon_l3', label: 'L3' },
    ];
    const weaponARs = weaponSlots.map(ws => ({
      label: ws.label,
      ar: build[ws.key] ? calcWeaponAR(build[ws.key], effStats) : null,
    }));

    const center = n => `text-align:center;width:100%`;
    const valStyle = sz => `color:var(--text-primary);font-size:${sz};font-weight:600`;

    div.innerHTML = `<div class="bp-section">
      <div class="bp-section-header">角色面板 <span style="font-weight:400;font-size:0.72rem;color:var(--text-muted);text-transform:none">基于装备 · 加点 · 护符计算</span></div>
      <div class="bp-section-body" style="padding:12px">
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;line-height:1.6">
          <tr>
            <!-- Left column: Attributes -->
            <td style="width:33%;vertical-align:top;padding-right:12px;border-right:1px solid var(--border-color)">
              <div style="font-weight:600;color:var(--accent-gold);font-size:0.72rem;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">能力值</div>
              ${STAT_ORDER.map(sn => `
                <div style="display:flex;justify-content:space-between;padding:1px 0">
                  <span style="color:var(--text-muted)">${STAT_CN[sn]}</span>
                  <span style="${valStyle('0.82rem')}">${effStats[sn]}${effStats[sn] !== stats[sn] ? `<span style="color:var(--accent-green);font-size:0.7rem;font-weight:400"> (+${effStats[sn] - stats[sn]})</span>` : ''}</span>
                </div>`).join('')}
              <div style="display:flex;justify-content:space-between;padding:1px 0;margin-top:4px;border-top:1px solid var(--border-color-muted)">
                <span style="color:var(--text-muted)">等级</span>
                <span style="${valStyle('0.82rem')}">${rl}</span>
              </div>
            </td>
            <!-- Mid column: Derived stats + Defense + Resistances -->
            <td style="width:33%;vertical-align:top;padding:0 12px;border-right:1px solid var(--border-color)">
              <div style="font-weight:600;color:var(--accent-gold);font-size:0.72rem;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">状态</div>
              <div style="display:flex;justify-content:space-between;padding:1px 0"><span style="color:var(--text-muted)">HP</span><span style="${valStyle('0.82rem')}">${hp}</span></div>
              <div style="display:flex;justify-content:space-between;padding:1px 0"><span style="color:var(--text-muted)">FP</span><span style="${valStyle('0.82rem')}">${fp}</span></div>
              <div style="display:flex;justify-content:space-between;padding:1px 0"><span style="color:var(--text-muted)">精力</span><span style="${valStyle('0.82rem')}">${stam.toFixed(0)}</span></div>
              <div style="display:flex;justify-content:space-between;padding:1px 0"><span style="color:var(--text-muted)">装备重量</span><span style="${valStyle('0.82rem')}">${totalWeight.toFixed(1)} / ${maxLoad.toFixed(0)}</span></div>
              <div style="display:flex;justify-content:space-between;padding:1px 0"><span style="color:var(--text-muted)">记忆空格</span><span style="${valStyle('0.82rem')}">${memSlots}</span></div>
              <div style="display:flex;justify-content:space-between;padding:1px 0"><span style="color:var(--text-muted)">强韧度</span><span style="${valStyle('0.82rem')}">${resists.poise}</span></div>
              <div style="display:flex;justify-content:space-between;padding:1px 0"><span style="color:var(--text-muted)">观察力</span><span style="${valStyle('0.82rem')}">${discovery}</span></div>

              <div style="font-weight:600;color:var(--accent-gold);font-size:0.72rem;margin:8px 0 4px;text-transform:uppercase;letter-spacing:0.5px">防御力</div>
              ${DMG_TYPES.map(dt => `
                <div style="display:flex;justify-content:space-between;padding:1px 0">
                  <span style="color:var(--text-muted)">${DMG_CN[dt]}</span>
                  <span style="${valStyle('0.82rem')}">${Math.round(def[dt])}</span>
                </div>`).join('')}

              <div style="font-weight:600;color:var(--accent-gold);font-size:0.72rem;margin:8px 0 4px;text-transform:uppercase;letter-spacing:0.5px">抵抗力</div>
              ${RESIST_KEYS.map(rk => `
                <div style="display:flex;justify-content:space-between;padding:1px 0">
                  <span style="color:var(--text-muted)">${RESIST_CN[rk]}</span>
                  <span style="${valStyle('0.82rem')}">${resists[rk]}</span>
                </div>`).join('')}
              <div style="display:flex;justify-content:space-between;padding:1px 0">
                <span style="color:var(--text-muted)">${RESIST_CN.poise}</span>
                <span style="${valStyle('0.82rem')}">${resists.poise}</span>
              </div>
            </td>
            <!-- Right column: Attack Power -->
            <td style="width:33%;vertical-align:top;padding-left:12px">
              ${['R', 'L'].map(hand => `
                <div style="font-weight:600;color:var(--accent-gold);font-size:0.72rem;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">${hand === 'R' ? '右手' : '左手'}攻击力</div>
                ${(() => { const slots = weaponARs.filter(wa => wa.label.startsWith(hand) && wa.ar); return slots.length ? slots.map(wa => `
                  <div style="margin-bottom:6px">
                    <div style="color:var(--text-muted);font-size:0.72rem">${wa.label}</div>
                    ${DMG_TYPES.map(dt => `
                      <div style="display:flex;justify-content:space-between;padding:0 0 0 8px;font-size:0.75rem">
                        <span style="color:var(--text-muted)">${DMG_CN[dt]}</span>
                        <span style="${valStyle('0.78rem')}">${wa.ar[dt]}</span>
                      </div>`).join('')}
                  </div>`).join('') : '<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px">未装备</div>'; })()}
              `).join('')}
            </td>
          </tr>
        </table>
      </div>
    </div>`;
  }

  // ── Summary ──
  function updateSummary() {
    let totalWeight = 0;
    for (const sec of SECTIONS)
      for (const sl of sec.slots) {
        if (sec.type === 'spells') continue;
        const item = build[sl.key];
        if (item) totalWeight += item.weight || 0;
      }

    const maxLoad = calcMaxLoad(stats.endurance);
    const ratio = totalWeight / maxLoad;
    const eqClass = EQ_CLASSES.find(t => ratio <= t.max) || EQ_CLASSES[EQ_CLASSES.length - 1];
    const allReqs = {};
    for (const sec of SECTIONS)
      for (const sl of sec.slots) {
        const item = build[sl.key];
        if (item && item.requirements)
          Object.entries(item.requirements).filter(([, v]) => v > 0).forEach(([k, v]) => {
            allReqs[k] = Math.max(allReqs[k] || 0, v);
          });
      }

    const q = s => container.querySelector(s);
    q('#bp-meta').textContent = `${totalWeight.toFixed(1)} 重量 · ${(ratio * 100).toFixed(0)}% 负重`;
    q('#bp-total-w').textContent = totalWeight.toFixed(1);
    q('#bp-ratio').textContent = `${(ratio * 100).toFixed(1)}%`;
    const bar = q('#bp-bar-fill');
    bar.style.width = `${Math.min(ratio * 100, 100)}%`;
    bar.style.background = eqClass.color;
    const cl = q('#bp-class');
    cl.textContent = eqClass.label;
    cl.style.color = eqClass.color;

    const rd = q('#bp-reqs');
    if (Object.keys(allReqs).length) {
      rd.innerHTML = `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:6px">最低属性需求</div>
        ${Object.entries(allReqs).map(([k, v]) =>
          `<span class="item-card-tag" style="font-size:0.78rem;padding:3px 10px;margin:2px;display:inline-block">${REQ_CN[k] || k} ${v}</span>`
        ).join('')}`;
    } else {
      rd.innerHTML = '<div style="font-size:0.8rem;color:var(--text-muted)">选择装备后显示需求</div>';
    }

    q('#bp-rl-display').textContent = calcRuneLevel(stats);
    renderStatusPanel();
  }

  // ── Stat Input Event Binding ──
  function bindStatInputs() {
    const inputsDiv = container.querySelector('#bp-stat-inputs');
    if (!inputsDiv) return;
    inputsDiv.addEventListener('input', e => {
      const el = e.target;
      const sn = el.dataset.stat;
      if (!sn) return;
      let val = parseInt(el.value);
      if (isNaN(val)) val = 10;
      val = Math.max(1, Math.min(99, val));
      // Sync paired input
      const pair = inputsDiv.querySelectorAll(`[data-stat="${sn}"]`);
      pair.forEach(p => { if (p !== el) p.value = val; });
      stats[sn] = val;
      if (sn === 'endurance') syncEnduranceInputs();

      updateSummary();
      saveBuild();
    });
  }
  bindStatInputs();

  function syncEnduranceInputs() {
    const inputsDiv = container.querySelector('#bp-stat-inputs');
    if (inputsDiv) {
      inputsDiv.querySelectorAll('[data-stat="endurance"]').forEach(el => el.value = stats.endurance);
    }
    const disp = container.querySelector('#bp-end-display');
    if (disp) disp.textContent = calcMaxLoad(stats.endurance).toFixed(0);
  }

  const clearBtn = container.querySelector('#bp-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      Object.keys(build).forEach(k => delete build[k]);
      stats = { vigor: 10, mind: 10, endurance: 25, strength: 10, dexterity: 10, intelligence: 10, faith: 10, arcane: 10 };
      // Reset stat inputs
      const inputsDiv = container.querySelector('#bp-stat-inputs');
      if (inputsDiv) {
        STAT_ORDER.forEach(sn => {
          inputsDiv.querySelectorAll(`[data-stat="${sn}"]`).forEach(el => el.value = stats[sn]);
        });
      }
      clearSavedBuild();
      renderCells();
      updateSummary();
    });
  }

  syncEnduranceInputs();
  updateSummary();
}
