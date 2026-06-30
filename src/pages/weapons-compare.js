import { getData, getUpgradeInfo, scalingGrade, getItemImageUrl, CATEGORY_CN } from '../store.js';

const CAT_ORDER = ['Dagger','Straight Sword','Greatsword','Colossal Sword','Colossal Weapon','Thrusting Sword','Heavy Thrusting Sword','Curved Sword','Curved Greatsword','Katana','Twinblade','Hammer','Great Hammer','Flail','Axe','Greataxe','Halberd','Spear','Great Spear','Lance','Reaper','Whip','Fist','Claw','Light Bow','Bow','Greatbow','Crossbow','Ballista','Glintstone Staff','Sacred Seal','Torch','Small Shield','Medium Shield','Greatshield','Thrusting Shield','Backhand Blade','Great Katana','Light Greatsword','Hand-to-Hand','Perfume Bottle','Throwing Blade'];

const AFFINITIES = ['Standard','Heavy','Keen','Quality','Magic','Fire','Flame Art','Lightning','Sacred','Poison','Blood','Cold','Occult'];

const DMG_KEYS = ['physical','magic','fire','lightning','holy'];
const DMG_CN = { physical:'物理', magic:'魔力', fire:'火', lightning:'雷', holy:'圣' };
const STAT_KEYS = ['strength','dexterity','intelligence','faith','arcane'];
const STAT_CN = { strength:'力', dexterity:'灵', intelligence:'智', faith:'信', arcane:'感' };

const TYPE_CN = { somber:'失色', normal:'普通' };
const AFFINITY_CN = { Standard:'标准', Heavy:'厚重', Keen:'锋利', Quality:'优质', Magic:'魔力', Fire:'焰术', 'Flame Art':'火焰', Lightning:'雷电', Sacred:'神圣', Poison:'毒', Blood:'血', Cold:'寒冷', Occult:'神秘' };

const MAX_LV_MAP = { 0:25,1900:25,2200:10,2400:10,3000:0,3100:25,3200:10,3300:10,8000:25,8100:25,8200:25,8300:10,8500:10,1300:10,3400:10,3500:10 };

function isSomber(w) {
  const aff = w.affinity && (w.affinity.Standard || w.affinity[Object.keys(w.affinity)[0]]);
  if (!aff || aff.reinforcement_id === undefined) return false;
  return MAX_LV_MAP[aff.reinforcement_id] === 10;
}

function catCn(cat) { return CATEGORY_CN[cat] || cat; }

export async function renderWeaponsCompare(container, params) {
  let searchQuery = '';
  let filterCat = '';
  let filterAffinity = 'Standard';
  let filterDLC = '';
  let filterUpgrade = '';
  let sortKey = 'name';
  let sortDir = 1;
  let viewMode = localStorage.getItem('wc_view') || 'list';

  function render() {
    const q = searchQuery.toLowerCase();
    let weapons = getData('armaments').filter(w => w.category !== 'Arrow' && w.category !== 'Bolt' && w.category !== 'Great Arrow' && w.category !== 'Great Bolt');

    if (filterCat) weapons = weapons.filter(w => w.category === filterCat);
    if (filterDLC === 'yes') weapons = weapons.filter(w => w.is_dlc);
    if (filterDLC === 'no') weapons = weapons.filter(w => !w.is_dlc);
    if (filterUpgrade === 'somber') weapons = weapons.filter(w => isSomber(w));
    if (filterUpgrade === 'normal') weapons = weapons.filter(w => !isSomber(w));

    const rows = weapons.map(w => {
      const aff = w.affinity && (w.affinity[filterAffinity] || w.affinity.Standard || w.affinity[Object.keys(w.affinity)[0]]);
      if (!aff) return null;
      const info = getUpgradeInfo({...w, affinity: {Standard: aff}});
      if (!info) return null;
      const maxLv = info.maxLevel;
      const maxData = info.calcLevel(maxLv);
      if (!maxData) return null;
      return {
        id: w.id,
        name: w.name,
        name_en: w.name_en || w.name,
        category: w.category,
        weight: w.weight,
        is_dlc: w.is_dlc,
        upgradeType: info.isSomber ? 'somber' : 'normal',
        requirements: aff.requirements || w.requirements || {},
        damage: maxData.damage,
        scaling: maxData.scaling,
        _w: w,
      };
    }).filter(Boolean);

    const categories = [...new Set(getData('armaments').map(w => w.category))].filter(c => c && CAT_ORDER.includes(c)).sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));

    rows.sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') { va = a.name; vb = b.name; }
      else if (sortKey === 'category') { va = CAT_ORDER.indexOf(a.category); vb = CAT_ORDER.indexOf(b.category); }
      else if (sortKey === 'weight') { va = a.weight; vb = b.weight; }
      else if (sortKey === 'upgradeType') { va = a.upgradeType; vb = b.upgradeType; }
      else if (DMG_KEYS.includes(sortKey)) { va = a.damage[sortKey] || 0; vb = b.damage[sortKey] || 0; }
      else if (STAT_KEYS.includes(sortKey)) { va = a.requirements[sortKey] || 0; vb = b.requirements[sortKey] || 0; }
      else if (sortKey.startsWith('sca_')) { const sk = sortKey.replace('sca_',''); va = a.scaling[sk] || 0; vb = b.scaling[sk] || 0; }
      else { va = a.name; vb = b.name; }
      if (typeof va === 'string') return sortDir * va.localeCompare(vb);
      return sortDir * (va - vb);
    });

    if (q) {
      const filtered = rows.filter(r => r.name.toLowerCase().includes(q) || r.name_en.toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q));
      rows.length = 0; rows.push(...filtered);
    }

    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    function sortBtn(k, label) {
      const active = sortKey === k;
      return `<span class="${active ? 'wc-sort-on' : 'wc-sort-off'}" data-sort="${k}">${label}${active ? (sortDir > 0 ? ' ▲' : ' ▼') : ''}</span>`;
    }

    const sortTh = (k, label) => {
      const active = sortKey === k;
      return `<th data-sort="${k}" class="${active ? 'sorted' : ''}" style="cursor:pointer">${label}${active ? (sortDir > 0 ? ' ▲' : ' ▼') : ''}</th>`;
    };

    const listHtml = `<div class="wc-wrap"><table class="wc-table">
      <thead><tr>
        ${sortTh('name', '名称')}
        ${sortTh('category', '分类')}
        ${sortTh('upgradeType', '强化')}
        ${DMG_KEYS.map(k => sortTh(k, DMG_CN[k])).join('')}
        ${STAT_KEYS.map(k => sortTh('sca_' + k, STAT_CN[k] + '补')).join('')}
        ${sortTh('weight', '重量')}
        ${STAT_KEYS.map(k => sortTh(k, STAT_CN[k] + '需')).join('')}
      </tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td class="wc-name"><a href="#/weapons/${r.id}">${r.name}</a></td>
        <td style="color:var(--text-muted);">${catCn(r.category)}</td>
        <td><span class="wc-ug-badge ${r.upgradeType}">${TYPE_CN[r.upgradeType]}</span></td>
        ${DMG_KEYS.map(k => `<td class="wc-dmg">${(r.damage[k] || 0) > 0 ? r.damage[k] : '-'}</td>`).join('')}
        ${STAT_KEYS.map(k => `<td class="wc-sca" style="color:${SCA_COLOR(scalingGrade(r.scaling[k] || 0))}">${scalingGrade(r.scaling[k] || 0)}</td>`).join('')}
        <td style="color:var(--text-muted);">${r.weight}</td>
        ${STAT_KEYS.map(k => `<td style="color:var(--text-muted);${(r.requirements[k] || 0) > 0 ? ';color:var(--text);font-weight:600;' : ''}">${r.requirements[k] || '-'}</td>`).join('')}
      </tr>`).join('')}</tbody>
    </table></div>`;

    const cardHtml = `<div style="display:flex;flex-direction:column;gap:6px">${rows.map(r => {
      const imgUrl = getItemImageUrl('armaments', r.name_en);
      return `<div class="wc-card" data-href="#/weapons/${r.id}">
        <div class="wc-card-img">${imgUrl ? `<img src="${imgUrl}" alt="">` : '<span style="font-size:1.2rem;opacity:0.3">⚔</span>'}</div>
        <div class="wc-card-body">
          <div class="wc-card-top">
            <div class="wc-card-name">${r.name}</div>
            <span class="wc-card-cat">${catCn(r.category)}</span>
            <span class="wc-ug-badge ${r.upgradeType}">${TYPE_CN[r.upgradeType]}</span>
            ${r.is_dlc ? '<span class="wc-card-dlc">DLC</span>' : ''}
          </div>
          <div class="wc-card-stats">
            ${DMG_KEYS.map(k => `<span class="wc-card-stat"><span class="wc-card-stat-l">${DMG_CN[k]}</span><span class="wc-card-stat-v">${(r.damage[k] || 0) > 0 ? r.damage[k] : '-'}</span></span>`).join('')}
            <span class="wc-card-divider"></span>
            ${STAT_KEYS.map(k => `<span class="wc-card-stat"><span class="wc-card-stat-l">${STAT_CN[k]}补</span><span class="wc-card-stat-v" style="color:${SCA_COLOR(scalingGrade(r.scaling[k] || 0))}">${scalingGrade(r.scaling[k] || 0)}</span></span>`).join('')}
            <span class="wc-card-divider"></span>
            <span class="wc-card-stat"><span class="wc-card-stat-l">重量</span><span class="wc-card-stat-v" style="color:var(--text-muted)">${r.weight}</span></span>
            ${STAT_KEYS.map(k => `<span class="wc-card-stat"><span class="wc-card-stat-l">${STAT_CN[k]}需</span><span class="wc-card-stat-v" style="${(r.requirements[k] || 0) > 0 ? 'color:var(--text);font-weight:600' : 'color:var(--text-muted)'}">${r.requirements[k] || '-'}</span></span>`).join('')}
          </div>
        </div>
      </div>`;
    }).join('')}</div>`;

    const styleId = 'wcompare-style';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.textContent = `
        .wc-table{width:100%;border-collapse:collapse;font-size:0.75rem;}
        .wc-table th{position:sticky;top:0;background:var(--bg-card);border-bottom:2px solid var(--border-color);padding:6px 4px;cursor:pointer;white-space:nowrap;text-align:center;color:var(--text-muted);user-select:none;}
        .wc-table th:hover{color:var(--accent-gold);}
        .wc-table th.sorted{color:var(--accent-gold);}
        .wc-table td{padding:4px;border-bottom:1px solid var(--border-color);text-align:center;white-space:nowrap;}
        .wc-table tr:hover td{background:var(--bg-tertiary);}
        .wc-dmg{font-weight:600;color:var(--text);}
        .wc-sca{font-weight:600;}
        .wc-name{text-align:center!important;font-weight:600;}
        .wc-name a{color:var(--text);text-decoration:none;}
        .wc-name a:hover{color:var(--accent-gold);}
        .wc-wrap{overflow-x:auto;max-height:70vh;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;}
        .wc-ug-badge{display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:500;border:1px solid var(--border-color);}
        .wc-ug-badge.normal{background:var(--bg-tertiary);color:var(--text-muted);}
        .wc-ug-badge.somber{background:rgba(201,168,76,0.12);color:var(--accent-gold);border-color:var(--accent-gold-dim);}
        .wc-card{display:flex;gap:12px;padding:8px 12px;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-card);cursor:pointer;transition:all .15s;align-items:center;}
        .wc-card:hover{border-color:var(--accent-gold-dim);background:var(--bg-card-hover);}
        .wc-card-img{width:48px;height:48px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:4px;background:var(--bg-input);overflow:hidden;}
        .wc-card-img img{width:100%;height:100%;object-fit:contain;}
        .wc-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
        .wc-card-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .wc-card-name{font-weight:600;font-size:0.85rem;color:var(--text);}
        .wc-card-cat{font-size:0.72rem;color:var(--text-muted);}
        .wc-card-dlc{padding:1px 5px;border-radius:3px;font-size:0.6rem;background:rgba(76,138,201,0.15);color:var(--accent-blue);border:1px solid rgba(76,138,201,0.3);}
        .wc-card-stats{display:flex;flex-wrap:wrap;gap:3px 8px;font-size:0.72rem;}
        .wc-card-stat{display:inline-flex;gap:3px;align-items:center;}
        .wc-card-stat-l{color:var(--text-muted);}
        .wc-card-stat-v{font-weight:600;color:var(--text);}
        .wc-card-divider{width:1px;height:14px;background:var(--border-color);align-self:center;}
        .wc-view-btn{padding:5px 12px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;font-size:0.75rem;background:var(--bg-card);color:var(--text-muted);transition:all .15s;}
        .wc-view-btn.active{background:var(--accent-gold-dim);color:#000;border-color:var(--accent-gold-dim);font-weight:600;}
        .wc-view-btn:hover:not(.active){border-color:var(--accent-gold-dim);color:var(--text-primary);}
        .wc-sort-off,.wc-sort-on{padding:3px 8px;border-radius:4px;font-size:0.72rem;cursor:pointer;white-space:nowrap;transition:all .12s;user-select:none;}
        .wc-sort-off{color:var(--text-muted);border:1px solid transparent;}
        .wc-sort-off:hover{color:var(--text-primary);border-color:var(--border-color);}
        .wc-sort-on{color:var(--accent-gold);background:var(--accent-glow);border:1px solid var(--accent-gold-dim);font-weight:600;}
        .wc-fl{width:40px;font-size:0.75rem;color:var(--text-muted);flex-shrink:0;line-height:28px;}
      `;
      document.head.appendChild(s);
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title" style="font-family:'Cinzel',serif;">武器质变数据</div>
        <div class="page-meta">${rows.length} 件（共 479 件，陨石杖无法强化）· ${AFFINITY_CN[filterAffinity] || filterAffinity}质变</div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:6px;">
        <span class="wc-fl">类型：</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1">
          <button class="tag-filter-btn ${!filterCat ? 'active' : ''}" data-cat="">全分类</button>
          ${categories.map(c => `<button class="tag-filter-btn ${filterCat === c ? 'active' : ''}" data-cat="${c}">${catCn(c)}</button>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <span class="wc-fl">质变：</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1">
          ${AFFINITIES.map(a => `<button class="tag-filter-btn ${filterAffinity === a ? 'active' : ''}" data-aff="${a}">${AFFINITY_CN[a] || a}</button>`).join('')}
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:6px;">
        <span class="wc-fl">版本：</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1;align-items:center;">
          <button class="tag-filter-btn ${filterDLC === '' ? 'active' : ''}" data-dlc="">全部版本</button>
          <button class="tag-filter-btn ${filterDLC === 'no' ? 'active' : ''}" data-dlc="no">仅本体</button>
          <button class="tag-filter-btn ${filterDLC === 'yes' ? 'active' : ''}" data-dlc="yes">仅 DLC</button>
          <span style="width:1px;height:20px;background:var(--border-color);align-self:center;"></span>
          <span style="font-size:0.75rem;color:var(--text-muted);">强化：</span>
          <button class="tag-filter-btn ${filterUpgrade === '' ? 'active' : ''}" data-ug="">全部强化</button>
          <button class="tag-filter-btn ${filterUpgrade === 'normal' ? 'active' : ''}" data-ug="normal">普通</button>
          <button class="tag-filter-btn ${filterUpgrade === 'somber' ? 'active' : ''}" data-ug="somber">失色</button>
          <div style="flex:1;min-width:0"></div>
          <button class="wc-view-btn ${viewMode === 'list' ? 'active' : ''}" data-view="list">列表</button>
          <button class="wc-view-btn ${viewMode === 'card' ? 'active' : ''}" data-view="card">卡片</button>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <input type="text" id="wcSearch" placeholder="搜索武器..." value="${searchQuery.replace(/"/g, '&quot;')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;">
      </div>
      ${viewMode === 'card' ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
        <span style="font-size:0.72rem;color:var(--text-muted)">排序：</span>
        ${sortBtn('name', '名称')}
        ${sortBtn('category', '分类')}
        ${sortBtn('upgradeType', '强化')}
        ${DMG_KEYS.map(k => sortBtn(k, DMG_CN[k])).join('')}
        ${STAT_KEYS.map(k => sortBtn('sca_' + k, STAT_CN[k] + '补')).join('')}
        ${sortBtn('weight', '重量')}
        ${STAT_KEYS.map(k => sortBtn(k, STAT_CN[k] + '需')).join('')}
      </div>
      ${cardHtml}` : listHtml}
      ${!rows.length ? '<div class="empty-state"><div class="empty-state-icon">⚔</div><div class="empty-state-text">无匹配武器</div></div>' : ''}
    `;

    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) { el.focus(); if (typeof activeSelStart === 'number') el.setSelectionRange(activeSelStart, activeSelEnd); }
    }

    // Event listeners
    const inp = document.getElementById('wcSearch');
    if (inp) {
      let composing = false;
      inp.addEventListener('compositionstart', () => { composing = true; });
      inp.addEventListener('compositionend', () => { composing = false; searchQuery = inp.value; render(); });
      inp.addEventListener('input', e => { if (composing) return; searchQuery = e.target.value; render(); });
    }
    container.querySelectorAll('[data-cat]').forEach(b => {
      b.addEventListener('click', () => { filterCat = b.dataset.cat; render(); });
    });
    container.querySelectorAll('[data-aff]').forEach(b => {
      b.addEventListener('click', () => { filterAffinity = b.dataset.aff; render(); });
    });
    container.querySelectorAll('[data-dlc]').forEach(b => {
      b.addEventListener('click', () => { filterDLC = b.dataset.dlc; render(); });
    });
    container.querySelectorAll('[data-ug]').forEach(b => {
      b.addEventListener('click', () => { filterUpgrade = b.dataset.ug; render(); });
    });
    container.querySelectorAll('[data-sort]').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.sort;
        if (sortKey === k) sortDir *= -1;
        else { sortKey = k; sortDir = 1; }
        render();
      });
    });
    container.querySelectorAll('[data-view]').forEach(b => {
      b.addEventListener('click', () => {
        viewMode = b.dataset.view;
        localStorage.setItem('wc_view', viewMode);
        render();
      });
    });
    container.querySelectorAll('.wc-card').forEach(el => {
      el.addEventListener('click', () => {
        const href = el.dataset.href;
        if (href) window.location.hash = href;
      });
    });
  }

  render();
  return () => {};
}

function SCA_COLOR(grade) {
  const m = { S: '#ff6b4a', A: '#ff9f4a', B: '#ffd04a', C: '#8ae84a', D: '#4ac9ff', E: '#b0b0b0' };
  return m[grade] || 'var(--text-muted)';
}
