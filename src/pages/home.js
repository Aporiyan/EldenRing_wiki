import { getData, getCategoryList, getTotalCount } from '../store.js';

function categoryRoute(cat) {
  if (cat.isDlc && cat.mergeInto) {
    const base = cat.mergeInto === 'armaments' ? 'weapons' :
      cat.mergeInto === 'ashes-of-war' ? 'ashes' :
      cat.mergeInto === 'spirit-ashes' ? 'spirits' : cat.mergeInto;
    return `#/${base}?dlc=true`;
  }
  return '#/' + (cat.key === 'armaments' ? 'weapons' :
    cat.key === 'ashes-of-war' ? 'ashes' :
    cat.key === 'spirit-ashes' ? 'spirits' :
    cat.key === 'items' ? 'items' : cat.key);
}

export function renderHome(container) {
  const cats = getCategoryList();
  const total = getTotalCount();

  const MERGE_KEYS = ['tools', 'keys', 'crafting-materials', 'bolstering-materials'];
  const mergedCount = MERGE_KEYS.reduce((s, k) => s + (getData(k) || []).length, 0);

  const displayCats = cats.filter(c => !MERGE_KEYS.includes(c.key) && !c.key.startsWith('dlc-'));
  displayCats.push({ key: 'items', label: '道具 & 材料', count: mergedCount });

  container.innerHTML = `
    <div class="home-hero">
      <div class="home-title">ELDEN RING</div>
      <div class="home-subtitle">交界地知识库 — 武器 · 防具 · 魔法 · 更多</div>
      <div class="home-search-box">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="home-search" placeholder="输入名称搜索..." autocomplete="off">
        </div>
      </div>
      <div class="home-stats">
        <div class="home-stat">
          <div class="home-stat-number">${total}</div>
          <div class="home-stat-label">资料总数</div>
        </div>
        <div class="home-stat">
          <div class="home-stat-number">${displayCats.length}</div>
          <div class="home-stat-label">分类</div>
        </div>
      </div>
    </div>
    <div class="home-categories">
      ${displayCats.map(cat => `
        <a href="${categoryRoute(cat)}" class="home-category-card">
          <div class="home-category-icon">${getIcon(cat.key)}</div>
          <div class="home-category-name">${cat.label}</div>
          <div class="home-category-count">${cat.count} 件</div>
        </a>
      `).join('')}
      <a href="#/npcs" class="home-category-card" style="opacity:0.9">
        <div class="home-category-icon">👤</div>
        <div class="home-category-name">NPC</div>
        <div class="home-category-count">45+ 名</div>
      </a>
    </div>
  `;

  const searchInput = container.querySelector('#home-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (q.length >= 1) {
        window.dispatchEvent(new CustomEvent('global-search', { detail: q }));
      }
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        document.querySelector('#global-search').value = searchInput.value.trim();
        document.querySelector('#global-search').focus();
      }
    });
  }

  return () => {};
}

function getIcon(key) {
  const icons = {
    armaments: '⚔',
    armor: '🛡',
    spells: '✦',
    talismans: '◇',
    'ashes-of-war': '🔥',
    'spirit-ashes': '👻',
    items: '📦',
    'dlc-armaments': '⚔',
    'dlc-armor': '🛡',
    'dlc-talismans': '◇',
    'dlc-spells': '✦',
    'dlc-ashes-of-war': '🔥',
    'dlc-spirit-ashes': '👻',
  };
  return icons[key] || '📦';
}
