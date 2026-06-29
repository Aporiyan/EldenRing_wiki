import { getData, translateName } from '../store.js';

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

function getMatLabel(item) {
  const raw = item.upgrade_material;
  if (raw === 'Ghost Glovewort' || raw === 'Grave Glovewort') return MAT_LABELS[raw];
  if (Array.isArray(item.upgrade_costs) && item.upgrade_costs.length > 0) {
    return item.upgrade_costs.length === 25 ? MAT_LABELS['Smithing Stone'] : MAT_LABELS['Somber Smithing Stone'];
  }
  return MAT_LABELS[raw] || MAT_LABELS['Somber Smithing Stone'];
}

function getMaxLevel(item) {
  if (Array.isArray(item.upgrade_costs) && item.upgrade_costs.length > 0) {
    return item.upgrade_costs.length;
  }
  const mat = item.upgrade_material;
  if (mat === 'Smithing Stone') return 25;
  return 10;
}

function getMatPool(item) {
  const label = getMatLabel(item);
  if (label.type === 'normal') return NORMAL_MATS;
  return SPECIAL_MATS;
}

const SMITHING_UNIT = [200, 400, 600, 900, 1200, 1500, 2400, 3600];
const SOMBER_UNIT = [2000, 3000, 4000, 6000, 9000, 12000, 16000, 20000, 25000];

function getRuneCosts(item) {
  if (Array.isArray(item.upgrade_costs)) return item.upgrade_costs;
  const label = getMatLabel(item);
  if (label.type === 'normal') {
    return NORMAL_MATS.map(step => step.lv === 'X' ? 0 : (SMITHING_UNIT[step.lv - 1] * step.n));
  }
  if (label.type === 'somber') {
    return [...SOMBER_UNIT, 0];
  }
  return [];
}

export function renderUpgradeCalc(container, params) {
  const weapons = getData('armaments').filter(w => w.upgrade_material);
  const spirits = getData('spirit-ashes').filter(s => s.upgrade_material);
  let selected = null;
  let type = 'weapon';
  let query = '';
  let blurTimer = null;

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">强化材料计算器</div>
        <div class="page-meta" id="uc-meta">搜索武器或骨灰</div>
      </div>
      <div class="filter-bar" style="flex-wrap:wrap;gap:6px">
        <button class="filter-btn active" id="uc-t-weapon">武器</button>
        <button class="filter-btn" id="uc-t-spirit">骨灰</button>
        <div style="position:relative;flex:1;min-width:200px">
          <input type="text" id="uc-search" class="filter-btn" placeholder="输入名称搜索..." style="width:100%;padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text);box-sizing:border-box">
          <div id="uc-dropdown" class="bp-r" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:100;max-height:320px;overflow-y:auto;background:var(--bg-card);border:1px solid var(--border);border-radius:6px;margin-top:2px;box-shadow:var(--shadow-card)"></div>
        </div>
        <button class="filter-btn" id="uc-clear" style="color:var(--accent-red);display:none">✕ 清除</button>
      </div>
      <div id="uc-results"></div>
    </div>`;

  const searchInp = container.querySelector('#uc-search');
  const dropdown = container.querySelector('#uc-dropdown');
  const resultsDiv = container.querySelector('#uc-results');
  const metaDiv = container.querySelector('#uc-meta');
  const clearBtn = container.querySelector('#uc-clear');

  function getPool() {
    return type === 'weapon' ? weapons : spirits;
  }

  function showDropdown() {
    const pool = getPool();
    if (!query.trim()) { dropdown.style.display = 'none'; return; }
    const q = query.toLowerCase();
    const matches = pool.filter(w => {
      const cn = translateName(w.name) || w.name;
      return cn.toLowerCase().includes(q) || w.name.toLowerCase().includes(q);
    }).slice(0, 30);
    if (!matches.length) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = matches.map(w => {
      const cn = translateName(w.name) || w.name;
      const ml = getMatLabel(w);
      const maxLv = getMaxLevel(w);
      return `<div class="bp-opt" data-id="${w.id}" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <span>${cn}</span>
        <span style="font-size:0.8rem;color:var(--text-dim)">${ml ? ml.cn : ''} · +${maxLv}</span>
      </div>`;
    }).join('');
    dropdown.style.display = 'block';
    dropdown.querySelectorAll('.bp-opt').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault();
        blurTimer = null;
      });
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.id);
        selected = getPool().find(w => w.id === id) || null;
        query = '';
        searchInp.value = translateName(selected?.name) || (selected?.name || '');
        dropdown.style.display = 'none';
        clearBtn.style.display = '';
        renderDetail();
      });
    });
  }

  function hideDropdown() {
    dropdown.style.display = 'none';
  }

  function renderDetail() {
    if (!selected) { resultsDiv.innerHTML = ''; return; }
    const matLabel = getMatLabel(selected);
    if (!matLabel) { resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-text">未知强化类型</div></div>'; return; }
    const maxLv = getMaxLevel(selected);
    const matPool = getMatPool(selected);
    const costs = getRuneCosts(selected);
    metaDiv.textContent = translateName(selected.name) || selected.name;

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
    resultsDiv.innerHTML = html;
  }

  container.querySelector('#uc-t-weapon').addEventListener('click', () => {
    type = 'weapon'; selected = null; query = ''; searchInp.value = '';
    container.querySelectorAll('#uc-t-weapon, #uc-t-spirit').forEach(b => b.classList.remove('active'));
    container.querySelector('#uc-t-weapon').classList.add('active');
    clearBtn.style.display = 'none';
    metaDiv.textContent = '搜索武器或骨灰';
    dropdown.style.display = 'none';
    resultsDiv.innerHTML = '';
  });
  container.querySelector('#uc-t-spirit').addEventListener('click', () => {
    type = 'spirit'; selected = null; query = ''; searchInp.value = '';
    container.querySelector('#uc-t-weapon').classList.remove('active');
    container.querySelector('#uc-t-spirit').classList.add('active');
    clearBtn.style.display = 'none';
    metaDiv.textContent = '搜索武器或骨灰';
    dropdown.style.display = 'none';
    resultsDiv.innerHTML = '';
  });
  searchInp.addEventListener('input', e => {
    query = e.target.value;
    showDropdown();
  });
  searchInp.addEventListener('blur', () => {
    blurTimer = setTimeout(() => {
      if (!dropdown.matches(':hover') && !dropdown.querySelector(':hover')) {
        hideDropdown();
      }
    }, 180);
  });
  searchInp.addEventListener('focus', () => {
    if (query.trim() && !selected) showDropdown();
  });
  clearBtn.addEventListener('click', () => {
    selected = null; query = ''; searchInp.value = '';
    clearBtn.style.display = 'none';
    metaDiv.textContent = '搜索武器或骨灰';
    resultsDiv.innerHTML = '';
    dropdown.style.display = 'none';
  });

  return () => {};
}
