import { translateName } from '../store.js';

function itemName(item) {
  return item.name_cn || translateName(item.name) || item.name;
}

let merchants = [];
let inventories = [];

async function loadMerchants() {
  if (merchants.length) return;
  try {
    const resp = await fetch('./data/merchants.json');
    merchants = await resp.json();
  } catch (e) {
    console.warn('Merchant data load failed:', e);
  }
}

async function loadInventories() {
  if (inventories.length) return;
  try {
    const resp = await fetch('./data/merchant-inventories.json');
    inventories = await resp.json();
  } catch (e) {
    console.warn('Merchant inventory data load failed:', e);
  }
}

function getInventory(merchant) {
  return inventories.find(inv => inv.id === merchant.id) || null;
}

const CAT_CN = { weapon: '武器', armor: '防具', talisman: '护符', item: '道具', ash: '战灰', spell: '魔法/祷告' };

const TYPE_CN = { nomadic: '流浪商人', isolated: '隐居商人', hermit: '遁世商人', abandoned: '见弃商人', imprisoned: '受囚商人', unique: '特殊商人', spell: '魔法/祷告' };
const TYPE_ORDER = ['nomadic', 'isolated', 'hermit', 'abandoned', 'imprisoned', 'spell', 'unique'];

export async function renderMerchants(container, params) {
  let detached = false;
  let searchQuery = '';
  let filterType = '';
  let filterDLC = '';  // '' = all, 'yes' = DLC only, 'no' = base only
  let filterBell = '';  // '' = all, 'yes' = has bell bearing, 'no' = no bell bearing
  let expandedMerchant = ''; // merchant id that has inventory expanded

  function render() {
    const q = searchQuery.toLowerCase();
    let filtered = merchants;
    if (filterType) filtered = filtered.filter(m => m.type === filterType);
    if (filterDLC === 'yes') filtered = filtered.filter(m => m.is_dlc);
    if (filterDLC === 'no') filtered = filtered.filter(m => !m.is_dlc);
    if (filterBell === 'yes') filtered = filtered.filter(m => !!m.bell_bearing);
    if (filterBell === 'no') filtered = filtered.filter(m => !m.bell_bearing);
    if (q) filtered = filtered.filter(m =>
      (m.name_cn || '').toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.location_cn || '').toLowerCase().includes(q) ||
      (m.region_cn || '').toLowerCase().includes(q)
    );

    const types = [...new Set(merchants.map(m => m.type))];
    types.sort((a, b) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b));

    const hasDLC = merchants.some(m => m.is_dlc);

    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    const styleEl = document.getElementById('merchant-style');
    if (!styleEl) {
      const s = document.createElement('style');
      s.id = 'merchant-style';
      s.textContent = '.merchant-card{display:flex;flex-direction:column;border-left-width:3px!important;border-left-style:solid!important}.merchant-card--dlc{border-left-color:#4a9c4a!important}.merchant-card:not(.merchant-card--dlc){border-left-color:var(--border-color)!important}.merchant-card-foot{border-top:1px solid var(--border-color);padding-top:8px;margin-top:6px}';
      document.head.appendChild(s);
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title" style="font-family:'Cinzel',serif;">商人列表</div>
        <div class="page-subtitle">所有可交易 NPC 一览</div>
        <div class="page-meta">${merchants.length} 位商人</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <button class="tag-filter-btn ${!filterType ? 'active' : ''}" data-mtype="">全部</button>
        ${types.map(t => `
          <button class="tag-filter-btn ${filterType === t ? 'active' : ''}" data-mtype="${t}">${TYPE_CN[t]||t} (${merchants.filter(m=>m.type===t).length})</button>
        `).join('')}
      </div>
      ${hasDLC ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
        <button class="tag-filter-btn ${filterDLC === '' ? 'active' : ''}" data-dlc="">全部版本</button>
        <button class="tag-filter-btn ${filterDLC === 'no' ? 'active' : ''}" data-dlc="no">仅本体</button>
        <button class="tag-filter-btn ${filterDLC === 'yes' ? 'active' : ''}" data-dlc="yes">仅 DLC</button>
      </div>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
        <button class="tag-filter-btn ${filterBell === '' ? 'active' : ''}" data-bell="">全部灵珠</button>
        <button class="tag-filter-btn ${filterBell === 'yes' ? 'active' : ''}" data-bell="yes">有灵珠</button>
        <button class="tag-filter-btn ${filterBell === 'no' ? 'active' : ''}" data-bell="no">无灵珠</button>
      </div>
      <input type="text" id="merchantSearch" placeholder="搜索商人名称或位置..." value="${searchQuery.replace(/"/g, '&quot;')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;margin-bottom:16px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;">
        ${filtered.map(m => {
          const hasBB = !!m.bell_bearing;
          const inv = getInventory(m);
          const isExpanded = expandedMerchant === m.id;
          const hasInv = inv && inv.matched_count > 0;
          const bbLine = hasBB
            ? '<div style="font-size:0.7rem;color:var(--text-muted);">🔔 ' + (m.bell_bearing_name || m.bell_bearing) + '</div>'
            : '<div style="height:1.2rem;"></div>';
          return `
            <div class="merchant-card ${m.is_dlc ? 'merchant-card--dlc' : ''}" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:14px;">
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
                  <div style="font-weight:600;font-size:0.9rem;color:var(--text);line-height:1.3;flex:1;">${m.name_cn || m.name}</div>
                  <div style="display:flex;gap:4px;flex-shrink:0;margin-left:8px;">
                    ${m.is_dlc ? '<span style="font-size:0.6rem;padding:1px 6px;border-radius:4px;background:rgba(74,156,74,0.2);border:1px solid rgba(74,156,74,0.4);color:#4a9c4a;">DLC</span>' : ''}
                    <span style="font-size:0.6rem;padding:2px 6px;border-radius:4px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-muted);">${TYPE_CN[m.type]||m.type}</span>
                  </div>
                </div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">📍 ${m.location_cn || m.location}</div>
                <div style="font-size:0.7rem;color:var(--text-secondary);margin-bottom:8px;">🗺 ${m.region_cn || m.region}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:8px;">${m.description || ''}</div>
                ${m.items_sold && m.items_sold.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px;">' + m.items_sold.map(item => '<span style="font-size:0.65rem;padding:1px 6px;border-radius:4px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--accent-gold);">' + item + '</span>').join('') + '</div>' : ''}
              </div>
              <div class="merchant-card-foot">
                ${bbLine}
                ${hasInv ? '<button class="inv-toggle-btn" data-inv-id="' + m.id + '" style="display:block;width:100%;padding:6px;margin-top:4px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-tertiary);color:var(--text-muted);font-size:0.75rem;cursor:pointer;text-align:center;">' + (isExpanded ? '收起库存' : '查看库存 (' + inv.matched_count + ' 种商品)') + '</button>' : ''}
                ${hasInv && isExpanded ? '<div style="margin-top:8px;border-top:1px solid var(--border-color);padding-top:8px;max-height:300px;overflow-y:auto;">' +
                  inv.items.map(item => '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border-color);font-size:0.75rem;">' +
                    '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">' +
                      '<span style="font-size:0.6rem;padding:1px 4px;border-radius:3px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-muted);white-space:nowrap;">' + (CAT_CN[item.category] || item.category) + '</span>' +
                      '<span style="color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + itemName(item) + '">' + itemName(item) + '</span>' +
                    '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;margin-left:8px;">' +
                      (item.quantity_max !== null ? '<span style="color:var(--text-muted);font-size:0.65rem;">×' + item.quantity_max + '</span>' : '<span style="color:var(--text-muted);font-size:0.65rem;">无限</span>') +
                      (item.price !== null && item.price !== undefined ? '<span style="color:var(--accent-gold);font-weight:600;font-size:0.75rem;">' + item.price + '卢恩</span>' : '') +
                      (item.deathroot_required ? '<span style="color:var(--text-muted);font-size:0.65rem;">死根×' + item.deathroot_required + '</span>' : '') +
                    '</div>' +
                  '</div>').join('') +
                '</div>' : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
      ${!filtered.length ? '<div class="empty-state"><div class="empty-state-icon">🏪</div><div class="empty-state-text">无匹配商人</div></div>' : ''}
    `;

    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) { el.focus(); if (typeof activeSelStart === 'number') el.setSelectionRange(activeSelStart, activeSelEnd); }
    }

    const msInput = document.getElementById('merchantSearch');
    if (msInput) {
      let composing = false;
      msInput.addEventListener('compositionstart', () => { composing = true; });
      msInput.addEventListener('compositionend', () => { composing = false; searchQuery = msInput.value; render(); });
      msInput.addEventListener('input', e => { if (composing) return; searchQuery = e.target.value; render(); });
    }
    container.querySelectorAll('[data-mtype]').forEach(btn => {
      btn.addEventListener('click', () => {
        filterType = btn.dataset.mtype;
        render();
      });
    });
    container.querySelectorAll('[data-dlc]').forEach(btn => {
      btn.addEventListener('click', () => {
        filterDLC = btn.dataset.dlc;
        render();
      });
    });
    container.querySelectorAll('[data-bell]').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBell = btn.dataset.bell;
        render();
      });
    });
    container.querySelectorAll('.inv-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        expandedMerchant = expandedMerchant === btn.dataset.invId ? '' : btn.dataset.invId;
        render();
      });
    });
  }

  container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">正在加载...</div></div></div>';
  Promise.all([loadMerchants(), loadInventories()]).then(async () => {
    if (detached) return;
    try { await render(); } catch (e) {
      if (detached) return;
      container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">渲染出错：' + e.message + '</div></div></div>';
    }
  }, () => {
    if (detached) return;
    container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">数据加载失败</div></div></div>';
  });
  return () => { detached = true; };
}
