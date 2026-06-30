import { translateName } from '../store.js';

const TYPE_MAP = {
  armaments: { cn: '武器', file: 'armaments.json', dlcFile: 'dlc-armaments.json' },
  armor: { cn: '防具', file: 'armor.json', dlcFile: 'dlc-armor.json' },
  talismans: { cn: '护符', file: 'talismans.json', dlcFile: 'dlc-talismans.json' },
  spells: { cn: '魔法', file: 'spells.json', dlcFile: 'dlc-spells.json' },
  'ashes-of-war': { cn: '战灰', file: 'ashes-of-war.json', dlcFile: 'dlc-ashes-of-war.json' },
  'spirit-ashes': { cn: '骨灰', file: 'spirit-ashes.json', dlcFile: 'dlc-spirit-ashes.json' },
  tools: { cn: '道具', file: 'tools.json', dlcFile: 'dlc-tools.json' },
  keys: { cn: '钥匙', file: 'keys.json', dlcFile: 'dlc-keys.json' },
  'crafting-materials': { cn: '制作材料', file: 'crafting-materials.json', dlcFile: 'dlc-crafting-materials.json' },
  'bolstering-materials': { cn: '强化材料', file: 'bolstering-materials.json', dlcFile: 'dlc-bolstering-materials.json' },
  shop: { cn: '卷轴/铃珠/笔记', file: 'shop.json' },
};

const EXTRA_TYPES = {
  ammo: '弹药',
  note: '笔记',
  gesture: '动作',
  other: '其他',
};

const PAGE_SIZE = 200;

// Global cache: load data files once, reuse on every visit
let _cachePromise = null;
let _cachedAllRows = null;

async function ensureData() {
  if (_cachedAllRows) return _cachedAllRows;
  if (_cachePromise) return _cachePromise;
  _cachePromise = loadAndBuildRows();
  _cachedAllRows = await _cachePromise;
  return _cachedAllRows;
}

async function loadAndBuildRows() {
  const [sourcesData, nameMapData] = await Promise.all([
    fetch('./data/item-sources.json').then(r => r.json()),
    fetch('./data/name_map.json').then(r => r.json()),
  ]);
  const nm = nameMapData;

  const loadTasks = Object.entries(TYPE_MAP).flatMap(([key, cfg]) => {
    const tasks = [];
    tasks.push(
      fetch(`./data/${cfg.file}`)
        .then(r => r.json())
        .then(data => ({ key, data, isDlc: false }))
        .catch(() => null)
    );
    if (cfg.dlcFile) {
      tasks.push(
        fetch(`./data/${cfg.dlcFile}`)
          .then(r => r.json())
          .then(data => ({ key, data, isDlc: true }))
          .catch(() => null)
      );
    }
    return tasks;
  });
  loadTasks.push(
    fetch('./data/shop.json')
      .then(r => r.json())
      .then(data => ({ key: 'shop', data, type: 'special' }))
      .catch(() => null)
  );

  const results = await Promise.all(loadTasks);
  const allItems = {};
  for (const r of results) {
    if (!r) continue;
    if (r.type === 'special') {
      for (const [name, item] of Object.entries(r.data)) {
        const cat = item.category || '';
        const catCn = cat === 'Spellbook' ? '魔法卷轴' : cat === 'Bell Bearing' ? '铃珠' : cat === 'Cookbook' ? '笔记' : cat;
        allItems[name] = { ...allItems[name], type: 'shop', category: catCn, is_dlc: false };
      }
    } else {
      const items = Object.values(r.data);
      items.forEach(i => {
        allItems[i.name] = { ...allItems[i.name], type: r.key, category: i.category, is_dlc: r.isDlc };
      });
    }
  }

  // Heuristic type inference for items without game data
  function guessType(name) {
    if (/^Note:/i.test(name)) return 'note';
    if (/arrow|bolt/i.test(name) && !/^Ash of War/i.test(name)) return 'ammo';
    if (/gesture/i.test(name)) return 'gesture';
    return 'other';
  }
  function isMeta(name) {
    return /^(Various |Access to |Inheriting the |Guidance to the |Deep lore about |Emotes and |Hornsent lore |Frenzied Flame-related |Forager Brood-related |Secret Rite-related |Messmer Fire-related )/i.test(name)
      || /( route item$|\(if |depending on choices|Dragon Heart interactions|Jar-Bairn's gratitude|Roderika's gratitude|Shabriri's dialogue|if delivered letter)/i.test(name);
  }

  const allRows = [];
  for (const [enName, entry] of Object.entries(sourcesData)) {
    let itemInfo = allItems[enName];
    if (!itemInfo || !itemInfo.type) {
      if (isMeta(enName)) continue;
      itemInfo = { type: guessType(enName) };
    }
    const cn = nm[enName] || enName;
    const sourceList = entry.sources || [];
    allRows.push({ enName, cn, sources: sourceList, ...itemInfo });
  }
  allRows.sort((a, b) => a.cn.localeCompare(b.cn));
  return allRows;
}

export async function renderItemSourcesTable(container, params) {

  const styleId = 'istyle';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      .is-type{font-size:0.65rem;padding:1px 6px;border-radius:3px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-muted);white-space:nowrap;}
      .is-src{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:0.72rem;line-height:1.5;margin:1px 0;}
      .is-src .tag{display:inline-block;padding:0 5px;border-radius:3px;font-weight:600;font-size:0.65rem;line-height:1.6;}
      .is-src .text{color:var(--text-secondary);}
      .is-src-boss{background:rgba(231,74,59,0.08);border:1px solid rgba(231,74,59,0.2);}
      .is-src-boss .tag{background:rgba(231,74,59,0.15);color:#e74a3b;}
      .is-src-merchant{background:rgba(74,140,201,0.08);border:1px solid rgba(74,140,201,0.2);}
      .is-src-merchant .tag{background:rgba(74,140,201,0.15);color:#4c8ac9;}
      .is-src-quest{background:rgba(76,168,76,0.08);border:1px solid rgba(76,168,76,0.2);}
      .is-src-quest .tag{background:rgba(76,168,76,0.15);color:#4ca84c;}
      .is-src-crafting{background:rgba(138,76,201,0.08);border:1px solid rgba(138,76,201,0.2);}
      .is-src-crafting .tag{background:rgba(138,76,201,0.15);color:#8a4cc9;}
      .wc-table{width:100%;border-collapse:collapse;font-size:0.78rem;}
      .wc-table thead{position:sticky;top:0;z-index:1;}
      .wc-table th{background:var(--bg-card);border-bottom:2px solid var(--border-color);padding:8px 6px;text-align:center;color:var(--text-muted);font-weight:600;white-space:nowrap;}
      .wc-table th:first-child{text-align:left;}
      .wc-table th:nth-child(1){width:22%;}
      .wc-table th:nth-child(2){width:10%;}
      .wc-table th:nth-child(3){width:58%;}
      .wc-table th:nth-child(4){width:10%;}
      .wc-table td{padding:6px;border-bottom:1px solid var(--border-color);text-align:center;vertical-align:middle;}
      .wc-table td:first-child{text-align:left;font-weight:500;}
      .wc-table .src-cell{text-align:left;font-size:0.72rem;line-height:1.8;}
      .wc-table tr:nth-child(even){background:rgba(255,255,255,0.02);}
      .wc-table tr:hover td{background:var(--bg-tertiary);}
      .is-wrap{overflow-x:auto;max-height:70vh;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;}
    `;
    document.head.appendChild(s);
  }

  const SRC_CN = { boss: '击杀', merchant: '商人', quest: '任务', crafting: '制作' };
  const SRC_CLS = { boss: 'is-src-boss', merchant: 'is-src-merchant', quest: 'is-src-quest', crafting: 'is-src-crafting' };

  function renderSource(s) {
    const cls = SRC_CLS[s.type] || '';
    const label = SRC_CN[s.type] || s.type;
    let detail = '';
    if (s.type === 'boss') {
      detail = s.bossName_cn || s.bossName || '';
      if (s.location_cn || s.region_cn) detail += '（' + [s.location_cn, s.region_cn].filter(Boolean).join('，') + '）';
    } else if (s.type === 'merchant') {
      detail = s.merchantName_cn || s.merchantName || '';
      if (s.price) detail += ' · ' + s.price + ' 卢恩';
      if (s.quantity_max) detail += '（限' + s.quantity_max + '）';
    } else if (s.type === 'quest') {
      detail = (s.npc_cn || s.npc || '') + ' → ' + (s.reward_cn || '');
    } else if (s.type === 'crafting') {
      detail = s.cookbook_cn || s.cookbook || '';
    } else {
      detail = JSON.stringify(s).slice(0, 60);
    }
    return `<span class="is-src ${cls}"><span class="tag">${label}</span><span class="text">${detail}</span></span>`;
  }

  function render() {
    let filtered = allRows;
    if (filterType) filtered = filtered.filter(r => r.type === filterType);
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(r => r.cn.toLowerCase().includes(q) || r.enName.toLowerCase().includes(q));
    }

    const paged = filtered.slice(0, (page + 1) * PAGE_SIZE);
    const hasMore = paged.length < filtered.length;

    const typeOptions = [...Object.entries(TYPE_MAP), ...Object.entries(EXTRA_TYPES)].map(([k, v]) =>
      `<button class="tag-filter-btn ${filterType === k ? 'active' : ''}" data-type="${k}">${typeof v === 'string' ? v : v.cn}</button>`
    ).join('');

    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <div class="page-title">全物品获取方式</div>
          <div class="page-meta">${loading ? '加载中...' : filtered.length + ' 件物品有来源'}</div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <span class="wc-fl">类型：</span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1">
            <button class="tag-filter-btn ${!filterType ? 'active' : ''}" data-type="">全部</button>
            ${typeOptions}
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <input type="text" id="isSearch" placeholder="搜索物品名称..." value="${query.replace(/"/g, '&quot;')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;">
        </div>
        ${loading ? '<div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">正在加载物品数据...</div></div>' : `
        <div class="is-wrap">
          <table class="wc-table">
            <thead><tr>
              <th style="text-align:left">名称</th>
              <th>类型</th>
              <th style="text-align:left">获取来源</th>
              <th>来源数</th>
            </tr></thead>
            <tbody>${paged.map(r => {
              const typeCn = r.type === 'shop' ? (r.category || '其他') : (TYPE_MAP[r.type]?.cn || EXTRA_TYPES[r.type] || r.type);
              const srcHtml = r.sources.map(renderSource).join(' ');
              return `<tr>
                <td class="wc-name">${r.cn}</td>
                <td><span class="is-type">${typeCn}</span></td>
                <td class="src-cell">${srcHtml}</td>
                <td style="color:var(--text-muted)">${r.sources.length}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
          ${hasMore ? `<div style="padding:12px;text-align:center"><button id="isLoadMore" class="tag-filter-btn">加载更多 (${filtered.length - paged.length} 条)</button></div>` : ''}
        </div>
        `}
        ${!loading && !paged.length ? '<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">无匹配物品</div></div>' : ''}
      </div>`;

    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) { el.focus(); if (typeof activeSelStart === 'number') el.setSelectionRange(activeSelStart, activeSelEnd); }
    }

    const inp = document.getElementById('isSearch');
    if (inp) {
      let composing = false;
      inp.addEventListener('compositionstart', () => { composing = true; });
      inp.addEventListener('compositionend', () => { composing = false; query = inp.value; page = 0; render(); });
      inp.addEventListener('input', e => { if (composing) return; query = e.target.value; page = 0; render(); });
    }
    container.querySelectorAll('[data-type]').forEach(b => {
      b.addEventListener('click', () => { filterType = b.dataset.type; page = 0; render(); });
    });
    setupObserver();
  }

  function setupObserver() {
    if (observer) observer.disconnect();
    const btn = document.getElementById('isLoadMore');
    if (!btn) return;
    observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore) {
        loadingMore = true;
        page++;
        render();
      }
    }, { rootMargin: '200px' });
    observer.observe(btn);
  }

  container.innerHTML = `<div class="page"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">正在加载物品数据...</div></div></div>`;
  allRows = await ensureData();
  loading = false;
  if (detached) return () => {};
  try { render(); } catch (e) {
    if (detached) return () => {};
    container.innerHTML = `<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">加载出错：${e.message}</div></div></div>`;
  }
  return () => { detached = true; if (observer) observer.disconnect(); };
}
