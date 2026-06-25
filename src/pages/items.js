import { getData, CATEGORY_CN } from '../store.js';

const CATEGORY_MAP = {
  // tools
  'Golden Rune': { icon: '💰', section: 'golden-runes', label: '卢恩' },
  'Remembrance': { icon: '🌟', section: 'rememberances', label: '追忆' },
  'Great Rune': { icon: '👑', section: 'great-runes', label: '大卢恩' },
  'Crystal Tear': { icon: '💧', section: 'crystal-tears', label: '结晶露滴' },
  'Pot': { icon: '🏺', section: 'pots', label: '壶' },
  'Grease': { icon: '🧴', section: 'greases', label: '油脂' },
  'Aromatic': { icon: '✨', section: 'aromatics', label: '熏香' },
  'Throwable': { icon: '💥', section: 'throwables', label: '投掷' },
  'Offensive': { icon: '⚔️', section: 'offensive', label: '进攻' },
  'Edible': { icon: '🍖', section: 'edibles', label: '可食用' },
  'Utility': { icon: '🔧', section: 'utility', label: '工具' },
  'Essential': { icon: '📌', section: 'essential', label: '关键' },
  'Online': { icon: '🌐', section: 'online', label: '联机' },
  // keys
  'Quest': { icon: '📜', section: 'quest', label: '任务' },
  'Exploration': { icon: '🗺️', section: 'exploration', label: '探索' },
  'Exchange': { icon: '🔔', section: 'exchange', label: '兑换' },
  'Feature': { icon: '⚙️', section: 'feature', label: '功能' },
  'Mending Rune': { icon: '🔮', section: 'mending-runes', label: '修复卢恩' },
  'Map': { icon: '📖', section: 'maps', label: '地图' },
  'Whetblade': { icon: '🪓', section: 'whetblades', label: '砥石刀' },
  'Container': { icon: '📦', section: 'containers', label: '容器' },
  // bolstering
  'Flask': { icon: '🧪', section: 'flasks', label: '露滴' },
  'Smithing Stone': { icon: '⛏️', section: 'smithing-stones', label: '锻造石' },
  'Somber Smithing Stone': { icon: '💎', section: 'somber-stones', label: '失色锻造石' },
  'Glovewort': { icon: '🌿', section: 'gloveworts', label: '铃兰' },
  // crafting
  'Fauna': { icon: '🦴', section: 'fauna', label: '动物' },
  'Flora': { icon: '🌺', section: 'flora', label: '植物' },
  'Object': { icon: '📿', section: 'objects', label: '物品' },
};

// Categories to merge into tabbed group pages
const TAB_GROUPS = {
  'smithing-stones': {
    label: '锻造石',
    icon: '⛏️',
    categories: ['Smithing Stone', 'Somber Smithing Stone'],
    tabs: { 'Smithing Stone': '锻造石', 'Somber Smithing Stone': '失色锻造石' },
  },
  'crafting-materials': {
    label: '制作材料',
    icon: '📦',
    categories: ['Fauna', 'Flora', 'Object'],
    tabs: { 'Fauna': '动物', 'Flora': '植物', 'Object': '物品' },
  },
};

function getItemScopeData() {
  return [
    ...getData('tools').map(i => ({ ...i, _sk: 'tools' })),
    ...getData('keys').map(i => ({ ...i, _sk: 'keys' })),
    ...getData('crafting-materials').map(i => ({ ...i, _sk: 'crafting-materials' })),
    ...getData('bolstering-materials').map(i => ({ ...i, _sk: 'bolstering-materials' })),
  ];
}

export function renderItemsPage(container, params) {
  let activeScope = (params && params.scope) ? params.scope : (params && params.dlc === 'true') ? 'DLC' : '全部';

  // Collect categories that belong to tab groups so we exclude them from flat listing
  const tabGroupCats = new Set();
  for (const g of Object.values(TAB_GROUPS)) {
    for (const c of g.categories) tabGroupCats.add(c);
  }

  function render() {
    const allItems = getItemScopeData();
    const scopeItems = activeScope === '全部' ? allItems :
      allItems.filter(i => activeScope === 'DLC' ? i.is_dlc : !i.is_dlc);
    const hasDlc = allItems.some(i => i.is_dlc);

    // Build flat groups for non-merged categories
    const groups = {};
    for (const item of scopeItems) {
      const cat = item.category;
      if (!cat) continue;
      if (tabGroupCats.has(cat)) continue; // will be in tab groups
      if (!groups[cat]) groups[cat] = { items: [], info: CATEGORY_MAP[cat] || { icon: '📦', section: cat, label: cat } };
      groups[cat].items.push(item);
    }

    // Build tab group entries
    const tabEntries = [];
    for (const [key, tg] of Object.entries(TAB_GROUPS)) {
      const items = scopeItems.filter(i => tg.categories.includes(i.category));
      if (items.length === 0) continue;
      tabEntries.push({ key, tg, items });
    }

    const entries = Object.entries(groups).sort((a, b) => b[1].items.length - a[1].items.length);
    const total = entries.reduce((s, [, g]) => s + g.items.length, 0) +
      tabEntries.reduce((s, e) => s + e.items.length, 0);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">道具 & 材料</div>
        <div class="page-subtitle">所有消耗品、钥匙物品、制作及强化材料</div>
        <div class="page-meta"><span>共 ${total} 件</span>${activeScope !== '全部' ? ` · ${activeScope}` : ''}</div>
      </div>
      ${hasDlc ? `
      <div class="filter-bar scope-bar" id="scope-bar">
        <button class="scope-btn filter-btn ${activeScope === '全部' ? 'active' : ''}" data-scope="全部">全部</button>
        <button class="scope-btn filter-btn ${activeScope === '本体' ? 'active' : ''}" data-scope="本体">本体</button>
        <button class="scope-btn filter-btn ${activeScope === 'DLC' ? 'active' : ''}" data-scope="DLC">DLC</button>
      </div>` : ''}
      <div class="items-grid">
        ${tabEntries.map(e => `
        <div class="item-card" data-tabgroup="${e.key}">
          <div class="item-card-header">
            <div class="item-card-name" style="font-size:0.95rem">${e.tg.icon} ${e.tg.label}</div>
            <div class="item-card-category">${e.items.length} 件</div>
          </div>
          <div class="item-card-body">
            <div style="font-size:0.75rem;color:var(--text-muted)">
              ${Object.entries(e.tg.tabs).map(([cat, label]) => {
                const cnt = e.items.filter(i => i.category === cat).length;
                return cnt > 0 ? `<span style="margin-right:8px">${label} ${cnt}</span>` : '';
              }).filter(Boolean).join('')}
            </div>
          </div>
        </div>
        `).join('')}
        ${entries.map(([cat, group]) => `
        <div class="item-card" data-section="${group.info.section}" data-category="${cat}">
          <div class="item-card-header">
            <div class="item-card-name" style="font-size:0.95rem">${group.info.icon} ${CATEGORY_CN[cat] || cat}</div>
            <div class="item-card-category">${group.items.length} 件</div>
          </div>
          <div class="item-card-body">
            <div style="font-size:0.75rem;color:var(--text-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
              ${group.items.slice(0, 5).map(i => i.name).join(' · ')}
              ${group.items.length > 5 ? ` · · ·` : ''}
            </div>
          </div>
        </div>
        `).join('')}
      </div>
    `;

    // Tab group cards → navigate to tab group view
    container.querySelectorAll('.item-card[data-tabgroup]').forEach(card => {
      card.addEventListener('click', () => {
        const tg = card.dataset.tabgroup;
        window.location.hash = `#/items/tab/${tg}?scope=${activeScope}`;
      });
    });

    // Regular category cards
    container.querySelectorAll('.item-card[data-category]').forEach(card => {
      card.addEventListener('click', () => {
        const category = card.dataset.category;
        window.location.hash = `#/items/category/${encodeURIComponent(category)}?scope=${activeScope}`;
      });
    });

    const scopeBar = container.querySelector('#scope-bar');
    if (scopeBar) {
      scopeBar.querySelectorAll('.scope-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          scopeBar.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeScope = btn.dataset.scope;
          const hash = window.location.hash.split('?')[0];
          window.location.hash = `${hash}?scope=${activeScope}`;
          render();
        });
      });
    }
  }

  render();
  return () => {};
}

export function renderItemsTabGroup(container, params) {
  const groupKey = params.id || '';
  const tg = TAB_GROUPS[groupKey];
  if (!tg) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">未找到分类组</div></div>';
    return () => {};
  }

  const activeScope = params.scope || '全部';
  let activeTab = tg.categories[0];
  let searchQuery = '';

  function getTabItems() {
    const allData = getItemScopeData();
    const tabItems = allData.filter(i => i.category === activeTab);
    if (activeScope === '全部') return tabItems;
    return tabItems.filter(i => activeScope === 'DLC' ? i.is_dlc : !i.is_dlc);
  }

  function render() {
    const items = getTabItems();
    const sq = searchQuery.toLowerCase().trim();
    const filtered = sq ? items.filter(i => {
      const t = ((i.name_cn || '') + '||' + (i.name_en || '') + '||' + (i.name || '')).toLowerCase();
      return t.includes(sq);
    }) : items;

    container.innerHTML = `
      <div class="page-header">
        <a class="detail-back" id="back-to-items" style="cursor:pointer;margin-bottom:12px">← 返回</a>
        <div class="page-title">${tg.icon} ${tg.label}</div>
        <div class="page-meta"><span id="items-cat-count">共 ${filtered.length} 件</span>${activeScope !== '全部' ? ` · ${activeScope}` : ''}</div>
      </div>
      <div class="filter-bar cat-bar" id="tab-bar" style="margin-bottom:12px">
        ${tg.categories.map(c => `
          <button class="filter-btn ${activeTab === c ? 'active' : ''}" data-tab="${c}">${tg.tabs[c] || c}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div class="search-box" style="flex:1;max-width:360px">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="page-search-input" placeholder="搜索..." autocomplete="off" value="${escapeHtml(searchQuery)}">
        </div>
      </div>
      <div class="items-grid" id="items-cat-grid">
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">没有找到匹配的物品</div></div>' :
        filtered.map(item => {
          const itags = [];
          const icat = tg.tabs[item.category] || CATEGORY_CN[item.category] || item.category;
          if (icat) itags.push(`<span class="item-card-tag cat">${icat}</span>`);
          if (item.rarity !== 'Common') itags.push(`<span class="item-card-tag rarity-${item.rarity}">${item.rarity_cn || item.rarity}</span>`);
          if (item.is_dlc) itags.push(`<span class="item-card-tag dlc">DLC</span>`);
          return `
          <div class="item-card" data-id="${item.id}" data-key="${item._sk}">
            <div class="item-card-header">
              <div class="item-card-name">${item.name}</div>
              ${itags.length ? `<div class="item-card-tags">${itags.join('')}</div>` : ''}
            </div>
            <div class="item-card-body">
              ${item.weight !== undefined ? `<span class="item-card-stat"><span class="item-card-stat-label">重</span> <span class="item-card-stat-value">${item.weight}</span></span>` : ''}
              ${item.price_sold > 0 ? `<span class="item-card-stat"><span class="item-card-stat-label">价</span> <span class="item-card-stat-value">${item.price_sold}</span></span>` : ''}
            </div>
          </div>
        `}).join('')}
      </div>
    `;

    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const sk = card.dataset.key;
        const id = card.dataset.id;
        sessionStorage.setItem('itemsBack', window.location.hash.replace(/^#/, ''));
        window.location.hash = `#/${sk}/${id}`;
      });
    });

    const backBtn = container.querySelector('#back-to-items');
    if (backBtn) {
      backBtn.addEventListener('click', () => { window.location.hash = '#/items'; });
    }

    const input = container.querySelector('#page-search-input');
    if (input) {
      input.addEventListener('input', () => {
        searchQuery = input.value;
        render();
      });
    }

    const tabBar = container.querySelector('#tab-bar');
    if (tabBar) {
      tabBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          tabBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeTab = btn.dataset.tab;
          searchQuery = '';
          render();
        });
      });
    }
  }

  render();
  return () => {};
}

export function renderItemsCategory(container, params) {
  const cat = decodeURIComponent(params.id || '');
  const activeScope = params.scope || '全部';
  let searchQuery = '';

  function getScopeItems() {
    const allData = getItemScopeData();
    const catItems = allData.filter(i => i.category === cat);
    if (activeScope === '全部') return catItems;
    return catItems.filter(i => activeScope === 'DLC' ? i.is_dlc : !i.is_dlc);
  }

  function render() {
    const items = getScopeItems();
    const sq = searchQuery.toLowerCase().trim();
    const filtered = sq ? items.filter(i => {
      const t = ((i.name_cn || '') + '||' + (i.name_en || '') + '||' + (i.name || '')).toLowerCase();
      return t.includes(sq);
    }) : items;
    const label = CATEGORY_CN[cat] || cat;

    container.innerHTML = `
      <div class="page-header">
        <a class="detail-back" id="back-to-items" style="cursor:pointer;margin-bottom:12px">← 返回</a>
        <div class="page-title">${label}</div>
        <div class="page-meta"><span id="items-cat-count">共 ${filtered.length} 件</span>${activeScope !== '全部' ? ` · ${activeScope}` : ''}</div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div class="search-box" style="flex:1;max-width:360px">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="page-search-input" placeholder="搜索此分类..." autocomplete="off" value="${escapeHtml(searchQuery)}">
        </div>
      </div>
      <div class="items-grid" id="items-cat-grid">
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">没有找到匹配的物品</div></div>' :
        filtered.map(item => {
          const itags = [];
          if (label) itags.push(`<span class="item-card-tag cat">${label}</span>`);
          if (item.rarity !== 'Common') itags.push(`<span class="item-card-tag rarity-${item.rarity}">${item.rarity_cn || item.rarity}</span>`);
          if (item.is_dlc) itags.push(`<span class="item-card-tag dlc">DLC</span>`);
          return `
          <div class="item-card" data-id="${item.id}" data-key="${item._sk}" data-category="${item.category}">
            <div class="item-card-header">
              <div class="item-card-name">${item.name}</div>
              ${itags.length ? `<div class="item-card-tags">${itags.join('')}</div>` : ''}
            </div>
            <div class="item-card-body">
              ${item.weight !== undefined ? `<span class="item-card-stat"><span class="item-card-stat-label">重</span> <span class="item-card-stat-value">${item.weight}</span></span>` : ''}
              ${item.price_sold > 0 ? `<span class="item-card-stat"><span class="item-card-stat-label">价</span> <span class="item-card-stat-value">${item.price_sold}</span></span>` : ''}
            </div>
          </div>
        `}).join('')}
      </div>
    `;

    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.key;
        const id = card.dataset.id;
        sessionStorage.setItem('itemsBack', window.location.hash.replace(/^#/, ''));
        window.location.hash = `#/${key}/${id}`;
      });
    });

    const backBtn = container.querySelector('#back-to-items');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.hash = '#/items';
      });
    }

    const input = container.querySelector('#page-search-input');
    if (input) {
      input.addEventListener('input', () => {
        searchQuery = input.value;
        render();
      });
    }

  }

  render();
  return () => {};
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(s));
  return div.innerHTML;
}
