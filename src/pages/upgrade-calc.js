import { getData, translateName } from '../store.js';

const CAT_CN = {
  Dagger: '匕首', 'Straight Sword': '直剑', Greatsword: '大剑',
  'Colossal Sword': '特大剑', 'Colossal Weapon': '特大武器',
  'Thrusting Sword': '刺剑', 'Heavy Thrusting Sword': '大重剑',
  'Curved Sword': '曲剑', 'Curved Greatsword': '大刀', Katana: '武士刀',
  Twinblade: '双头剑', Hammer: '锤', 'Great Hammer': '大锤',
  Flail: '连枷', Axe: '斧', Greataxe: '大斧',
  Halberd: '戟', Spear: '矛', 'Great Spear': '大矛',
  Lance: '长矛', Reaper: '镰刀', Whip: '鞭',
  Fist: '拳', Claw: '爪', 'Light Bow': '小弓', Bow: '弓',
  Greatbow: '大弓', Crossbow: '弩', Ballista: '弩炮',
  'Glintstone Staff': '杖', Staff: '法杖', 'Sacred Seal': '圣印记',
  Torch: '火把', 'Small Shield': '小盾', 'Medium Shield': '中盾',
  Shield: '盾', Greatshield: '大盾', Lance: '长矛',
  Arrow: '箭', Bolt: '弩箭',
};

const MAT_LABELS = {
  'Smithing Stone': { cn: '锻造石', type: 'normal', ancient: '古龙岩锻造石' },
  'Somber Smithing Stone': { cn: '失色锻造石', type: 'somber', ancient: '古龙岩失色锻造石' },
  'Ghost Glovewort': { cn: '灵依铃兰', type: 'spirit', ancient: '大朵灵依铃兰' },
  'Grave Glovewort': { cn: '墓地铃兰', type: 'spirit', ancient: '大朵墓地铃兰' },
};

const NORMAL_MATS = [
  { lv: 1, n: 2 }, { lv: 1, n: 4 }, { lv: 1, n: 6 },
  { lv: 2, n: 2 }, { lv: 2, n: 4 }, { lv: 2, n: 6 },
  { lv: 3, n: 2 }, { lv: 3, n: 4 }, { lv: 3, n: 6 },
  { lv: 4, n: 2 }, { lv: 4, n: 4 }, { lv: 4, n: 6 },
  { lv: 5, n: 2 }, { lv: 5, n: 4 }, { lv: 5, n: 6 },
  { lv: 6, n: 2 }, { lv: 6, n: 4 }, { lv: 6, n: 6 },
  { lv: 7, n: 2 }, { lv: 7, n: 4 }, { lv: 7, n: 6 },
  { lv: 8, n: 2 }, { lv: 8, n: 4 }, { lv: 8, n: 6 },
  { lv: 'X', n: 1 },
];

const SPECIAL_MATS = [
  { lv: 1, n: 1 }, { lv: 2, n: 1 }, { lv: 3, n: 1 },
  { lv: 4, n: 1 }, { lv: 5, n: 1 }, { lv: 6, n: 1 },
  { lv: 7, n: 1 }, { lv: 8, n: 1 }, { lv: 9, n: 1 },
  { lv: 'X', n: 1 },
];

const SMITHING_UNIT = [200, 400, 600, 900, 1200, 1500, 2400, 3600];
const SOMBER_UNIT = [2000, 3000, 4000, 6000, 9000, 12000, 16000, 20000, 25000];

function getMatLabel(item) {
  const raw = item.upgrade_material;
  if (raw === 'Ghost Glovewort' || raw === 'Grave Glovewort') return MAT_LABELS[raw];
  if (Array.isArray(item.upgrade_costs) && item.upgrade_costs.length > 0) {
    return item.upgrade_costs.length === 25 ? MAT_LABELS['Smithing Stone'] : MAT_LABELS['Somber Smithing Stone'];
  }
  return MAT_LABELS[raw] || MAT_LABELS['Somber Smithing Stone'];
}

function getMaxLevel(item) {
  if (Array.isArray(item.upgrade_costs) && item.upgrade_costs.length > 0) return item.upgrade_costs.length;
  const mat = item.upgrade_material;
  if (mat === 'Smithing Stone') return 25;
  return 10;
}

function getMatPool(item) {
  const label = getMatLabel(item);
  if (label.type === 'normal') return NORMAL_MATS;
  return SPECIAL_MATS;
}

function getRuneCosts(item) {
  if (Array.isArray(item.upgrade_costs)) return item.upgrade_costs;
  const label = getMatLabel(item);
  if (label.type === 'normal') return NORMAL_MATS.map(step => step.lv === 'X' ? 0 : (SMITHING_UNIT[step.lv - 1] * step.n));
  if (label.type === 'somber') return [...SOMBER_UNIT, 0];
  return [];
}

export function renderUpgradeCalc(container, params) {
  const weapons = getData('armaments').filter(w => w.upgrade_material);
  const spirits = getData('spirit-ashes').filter(s => s.upgrade_material);
  let type = 'weapon';
  let selected = null;
  let query = '';
  let activeCat = '';

  const overlay = document.createElement('div');
  overlay.className = 'bp-overlay';
  overlay.style.display = 'none';
  container.appendChild(overlay);

  function getPool() { return type === 'weapon' ? weapons : spirits; }

  function getCats() {
    if (type === 'weapon') {
      return [...new Set(weapons.map(w => w.category || ''))].filter(Boolean).sort();
    }
    return [];
  }

  function openModal() {
    const pool = getPool();
    const cats = getCats();

    overlay.innerHTML = `
      <div class="bp-modal">
        <div class="bp-modal-head">
          <div class="bp-modal-head-left">
            <span class="bp-modal-icon">◈</span>
            <span class="bp-modal-title">${type === 'weapon' ? '选择武器' : '选择骨灰'}</span>
            <span class="bp-modal-count">${pool.length}</span>
          </div>
          <button class="bp-modal-close" id="uc-mclose">✕</button>
        </div>
        <div class="bp-modal-search">
          <input type="text" id="uc-msearch" placeholder="搜索名称...">
        </div>
        ${cats.length ? `<div class="bp-modal-filter" id="uc-mfilter">
          <span class="bp-chip ${activeCat === '' ? 'on' : ''}" data-cat="">全部</span>
          ${cats.map(c => `<span class="bp-chip ${activeCat === c ? 'on' : ''}" data-cat="${c}">${CAT_CN[c] || c}</span>`).join('')}
        </div>` : ''}
        <div class="bp-modal-list" id="uc-mlist"></div>
      </div>`;

    function renderItems() {
      const list = overlay.querySelector('#uc-mlist');
      const q = (overlay.querySelector('#uc-msearch')?.value || '').toLowerCase();
      const filtered = pool.filter(i => {
        if (q) {
          const cn = translateName(i.name) || i.name;
          if (!cn.toLowerCase().includes(q) && !i.name.toLowerCase().includes(q)) return false;
        }
        if (activeCat && i.category !== activeCat) return false;
        return true;
      });
      if (!filtered.length) {
        list.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted);font-size:0.85rem">无匹配</div>';
        return;
      }
      list.innerHTML = filtered.map(i => {
        const cn = translateName(i.name) || i.name;
        const ml = getMatLabel(i);
        const maxLv = getMaxLevel(i);
        return `<div class="bp-mcard" data-id="${i.id}">
          <div class="bp-mcard-text">
            <div class="bp-mcard-name">${cn}</div>
            <div class="bp-mcard-meta">${ml ? ml.cn : ''} · +${maxLv}</div>
          </div>
        </div>`;
      }).join('');
      list.querySelectorAll('.bp-mcard').forEach(el => {
        el.addEventListener('click', () => {
          const id = parseInt(el.dataset.id);
          selected = pool.find(i => i.id === id) || null;
          overlay.style.display = 'none';
          renderDetail();
        });
      });
    }

    overlay.querySelector('#uc-mclose').addEventListener('click', () => { overlay.style.display = 'none'; });
    overlay.querySelector('#uc-msearch').addEventListener('input', renderItems);
    const filterDiv = overlay.querySelector('#uc-mfilter');
    if (filterDiv) {
      filterDiv.addEventListener('click', e => {
        const chip = e.target.closest('.bp-chip');
        if (!chip) return;
        filterDiv.querySelectorAll('.bp-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        activeCat = chip.dataset.cat;
        renderItems();
      });
    }
    overlay.style.display = 'flex';
    renderItems();
    setTimeout(() => overlay.querySelector('#uc-msearch')?.focus(), 100);
  }

  function renderDetail() {
    const resultDiv = container.querySelector('#uc-results');
    if (!selected) { resultDiv.innerHTML = ''; return; }
    const matLabel = getMatLabel(selected);
    if (!matLabel) { resultDiv.innerHTML = '<div class="empty-state"><div class="empty-state-text">未知强化类型</div></div>'; return; }
    const maxLv = getMaxLevel(selected);
    const matPool = getMatPool(selected);
    const costs = getRuneCosts(selected);

    const totals = {};
    for (let i = 0; i < maxLv; i++) {
      const mat = matPool[i] || { lv: '?', n: 0 };
      const key = mat.lv === 'X' ? matLabel.ancient : `${matLabel.cn}[${mat.lv}]`;
      totals[key] = (totals[key] || 0) + mat.n;
    }

    let html = `<div class="detail-view" style="margin-top:16px">
      <div class="detail-header">
        <div class="detail-title">${translateName(selected.name) || selected.name}</div>
        <div class="detail-category">${matLabel.cn} · 最高 +${maxLv}</div>
      </div>
      <div style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:1rem">每级所需材料</h3>
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
          <tr style="background:var(--bg-card)">
            <th style="padding:6px 10px;text-align:left;border-bottom:1px solid var(--border)">等级</th>
            <th style="padding:6px 10px;text-align:right;border-bottom:1px solid var(--border)">材料</th>
            <th style="padding:6px 10px;text-align:right;border-bottom:1px solid var(--border)">卢恩</th>
            <th style="padding:6px 10px;text-align:right;border-bottom:1px solid var(--border)">累计卢恩</th>
          </tr>`;

    let totalRuneCost = 0;
    for (let i = 0; i < maxLv; i++) {
      const cost = Array.isArray(costs) && i < costs.length ? costs[i] : 0;
      totalRuneCost += cost;
      const mat = matPool[i] || { lv: '?', n: 0 };
      const matDisplay = mat.lv === 'X' ? matLabel.ancient : `${matLabel.cn}[${mat.lv}]`;
      html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
        <td style="padding:4px 10px">+${i + 1}</td>
        <td style="padding:4px 10px;text-align:right">${matDisplay} × ${mat.n}</td>
        <td style="padding:4px 10px;text-align:right">${cost > 0 ? cost.toLocaleString() : '-'}</td>
        <td style="padding:4px 10px;text-align:right;color:var(--accent-gold)">${cost > 0 ? totalRuneCost.toLocaleString() : '-'}</td>
      </tr>`;
    }

    html += `<tr style="font-weight:bold;background:var(--bg-card)">
        <td style="padding:8px 10px" colspan="2">总计材料</td>
        <td style="padding:8px 10px;text-align:right" colspan="2">${Object.entries(totals).map(([k, v]) => `${k} × ${v}`).join('、')}</td>
      </tr>
      <tr style="font-weight:bold;background:var(--bg-card);border-top:2px solid var(--border)">
        <td style="padding:8px 10px" colspan="2">总计卢恩</td>
        <td style="padding:8px 10px;text-align:right" colspan="2">${totalRuneCost > 0 ? totalRuneCost.toLocaleString() + ' 卢恩' : '-'}</td>
      </tr></table></div></div>`;
    resultDiv.innerHTML = html;
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">强化材料计算器</div>
        <div class="page-meta" id="uc-meta">点击格子选择装备</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:16px;">
        <button class="filter-btn active" id="uc-t-weapon">武器</button>
        <button class="filter-btn" id="uc-t-spirit">骨灰</button>
      </div>
      <div class="bp-grid">
        <div class="bp-section">
          <div class="bp-section-header" id="uc-section-label">武器</div>
          <div class="bp-section-body" style="grid-template-columns:1fr;">
            <div class="bp-cell" id="uc-cell">
              <div class="bp-cell-label">选择装备</div>
              <div id="uc-cell-content"><div class="bp-cell-empty">空</div></div>
            </div>
          </div>
        </div>
      </div>
      <div id="uc-results"></div>
    </div>`;

  container.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  container.querySelector('#uc-cell').addEventListener('click', openModal);

  function updateCell() {
    const content = container.querySelector('#uc-cell-content');
    if (selected) {
      const cn = translateName(selected.name) || selected.name;
      content.innerHTML = `<div class="bp-cell-name">${cn}</div><div class="bp-cell-weight">${getMatLabel(selected)?.cn || ''}</div>`;
      container.querySelector('#uc-section-label').textContent = type === 'weapon' ? '武器' : '骨灰';
    } else {
      content.innerHTML = '<div class="bp-cell-empty">空</div>';
    }
  }

  container.querySelector('#uc-t-weapon').addEventListener('click', () => {
    type = 'weapon'; selected = null; activeCat = '';
    container.querySelectorAll('#uc-t-weapon, #uc-t-spirit').forEach(b => b.classList.remove('active'));
    container.querySelector('#uc-t-weapon').classList.add('active');
    container.querySelector('#uc-section-label').textContent = '武器';
    updateCell();
    container.querySelector('#uc-results').innerHTML = '';
    container.querySelector('#uc-meta').textContent = '点击格子选择装备';
  });
  container.querySelector('#uc-t-spirit').addEventListener('click', () => {
    type = 'spirit'; selected = null; activeCat = '';
    container.querySelectorAll('#uc-t-weapon, #uc-t-spirit').forEach(b => b.classList.remove('active'));
    container.querySelector('#uc-t-spirit').classList.add('active');
    container.querySelector('#uc-section-label').textContent = '骨灰';
    updateCell();
    container.querySelector('#uc-results').innerHTML = '';
    container.querySelector('#uc-meta').textContent = '点击格子选择装备';
  });

  // Right-click to remove
  container.querySelector('#uc-cell').addEventListener('contextmenu', e => {
    e.preventDefault();
    if (selected) { selected = null; updateCell(); container.querySelector('#uc-results').innerHTML = '';
      container.querySelector('#uc-meta').textContent = '点击格子选择装备'; }
  });

  updateCell();
  return () => {};
}
