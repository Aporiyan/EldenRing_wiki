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

async function fetchCount(path, fallback) {
  try {
    const r = await fetch(path);
    const data = await r.json();
    return Object.keys(data).length;
  } catch (e) {
    return fallback;
  }
}

export async function renderHome(container) {
  const cats = getCategoryList();
  const total = getTotalCount();

  const MERGE_KEYS = ['tools', 'keys', 'crafting-materials', 'bolstering-materials', 'info'];
  const mergedCount = MERGE_KEYS.slice(0,4).reduce((s, k) => s + (getData(k) || []).length, 0);

  const displayCats = cats.filter(c => !MERGE_KEYS.includes(c.key) && !c.key.startsWith('dlc-'));
  displayCats.push({ key: 'items', label: '道具 & 材料', count: mergedCount });

  const [npcCount, bossCount, recipeCount, ammoCount, merchantCount, achievementCount, gestureCount, shopCount, itemSrcCount] = await Promise.all([
    fetchCount('./data/npcs.json', 84),
    fetchCount('./data/bosses.json', 121),
    fetchCount('./data/cookbook-recipes.json', 59),
    fetchCount('./data/ammo.json', 63),
    fetchCount('./data/merchants.json', 39),
    fetchCount('./data/achievements.json', 42),
    fetchCount('./data/gestures.json', 47),
    fetchCount('./data/shop.json', 122),
    fetchCount('./data/item-sources.json', 1118),
  ]);

  const infoCount = (getData('info') || []).length;

  container.innerHTML = `
    <div class="home-hero">
      <div class="home-title">ELDEN RING</div>
      <div class="home-subtitle">交界地知识库 — 全资料 · 配装 · 路线</div>
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
          <div class="home-stat-label">资料分类</div>
        </div>
        <div class="home-stat">
          <div class="home-stat-number">${bossCount}</div>
          <div class="home-stat-label">Boss</div>
        </div>
        <div class="home-stat">
          <div class="home-stat-number">${npcCount}</div>
          <div class="home-stat-label">NPC</div>
        </div>
      </div>
    </div>

    <div style="margin-top:28px;">
      <div style="font-family:var(--font-display);font-size:0.9rem;font-weight:600;color:var(--accent-gold);margin-bottom:12px;letter-spacing:0.05em;">道具</div>
      <div class="home-categories" style="margin-top:0;">
        ${displayCats.map(cat => `
          <a href="${categoryRoute(cat)}" class="home-category-card">
            <div class="home-category-icon">${getIcon(cat.key)}</div>
            <div class="home-category-name">${cat.label}</div>
            <div class="home-category-count">${cat.count} 件</div>
          </a>
        `).join('')}
      </div>
    </div>

    <div style="margin-top:28px;">
      <div style="font-family:var(--font-display);font-size:0.9rem;font-weight:600;color:var(--accent-gold);margin-bottom:12px;letter-spacing:0.05em;">工具</div>
      <div class="home-categories" style="margin-top:0;">
        <a href="#/build-planner" class="home-category-card">
          <div class="home-category-icon">🔨</div>
          <div class="home-category-name">Build 配装器</div>
          <div class="home-category-count">配装模拟</div>
        </a>
        <a href="#/upgrade-calc" class="home-category-card">
          <div class="home-category-icon">⬆</div>
          <div class="home-category-name">强化计算</div>
          <div class="home-category-count">材料计算</div>
        </a>
        <a href="#/item-compare" class="home-category-card">
          <div class="home-category-icon">⇄</div>
          <div class="home-category-name">物品对比</div>
          <div class="home-category-count">对比工具</div>
        </a>
        <a href="#/affinities" class="home-category-card">
          <div class="home-category-icon">⚗</div>
          <div class="home-category-name">质变对比</div>
          <div class="home-category-count">对比工具</div>
        </a>
        <a href="#/charts" class="home-category-card">
          <div class="home-category-icon">📊</div>
          <div class="home-category-name">数据图表</div>
          <div class="home-category-count">分析工具</div>
        </a>
      </div>
    </div>

    <div style="margin-top:28px;">
      <div style="font-family:var(--font-display);font-size:0.9rem;font-weight:600;color:var(--accent-gold);margin-bottom:12px;letter-spacing:0.05em;">百科</div>
      <div class="home-categories" style="margin-top:0;">
        <a href="#/npcs" class="home-category-card">
          <div class="home-category-icon">👤</div>
          <div class="home-category-name">NPC</div>
          <div class="home-category-count">${npcCount} 名</div>
        </a>
        <a href="#/bosses" class="home-category-card">
          <div class="home-category-icon">👹</div>
          <div class="home-category-name">Boss</div>
          <div class="home-category-count">${bossCount} 只</div>
        </a>
        <a href="#/walkthrough" class="home-category-card">
          <div class="home-category-icon">🗺</div>
          <div class="home-category-name">推图路线</div>
          <div class="home-category-count">9 个阶段</div>
        </a>
        <a href="#/info" class="home-category-card">
          <div class="home-category-icon">📜</div>
          <div class="home-category-name">信息/信件</div>
          <div class="home-category-count">${infoCount} 条</div>
        </a>
        <a href="#/recipes" class="home-category-card">
          <div class="home-category-icon">🧪</div>
          <div class="home-category-name">制作配方</div>
          <div class="home-category-count">${recipeCount} 本笔记</div>
        </a>
        <a href="#/ammo" class="home-category-card">
          <div class="home-category-icon">🏹</div>
          <div class="home-category-name">弹药图鉴</div>
          <div class="home-category-count">${ammoCount} 种</div>
        </a>
        <a href="#/merchants" class="home-category-card">
          <div class="home-category-icon">🏪</div>
          <div class="home-category-name">商人列表</div>
          <div class="home-category-count">${merchantCount} 位</div>
        </a>
        <a href="#/weapons-compare" class="home-category-card">
          <div class="home-category-icon">📋</div>
          <div class="home-category-name">武器质变数据</div>
          <div class="home-category-count">479 件</div>
        </a>
        <a href="#/item-sources" class="home-category-card">
          <div class="home-category-icon">📦</div>
          <div class="home-category-name">全物品获取方式</div>
          <div class="home-category-count">${itemSrcCount} 件</div>
        </a>
        <a href="#/gestures" class="home-category-card">
          <div class="home-category-icon">🙌</div>
          <div class="home-category-name">姿势图鉴</div>
          <div class="home-category-count">${gestureCount} 种</div>
        </a>
        <a href="#/shop-items" class="home-category-card">
          <div class="home-category-icon">📜</div>
          <div class="home-category-name">卷轴 & 铃珠 & 笔记</div>
          <div class="home-category-count">${shopCount} 件</div>
        </a>
      </div>
    </div>

    <div style="margin-top:28px;">
      <div style="font-family:var(--font-display);font-size:0.9rem;font-weight:600;color:var(--accent-gold);margin-bottom:12px;letter-spacing:0.05em;">记录</div>
      <div class="home-categories" style="margin-top:0;">
        <a href="#/achievements" class="home-category-card">
          <div class="home-category-icon">🏆</div>
          <div class="home-category-name">成就</div>
          <div class="home-category-count">${achievementCount} 项</div>
        </a>
      </div>
    </div>
  `;

  const searchInput = container.querySelector('#home-search');
  if (searchInput) {
    let composing = false;
    searchInput.addEventListener('compositionstart', () => { composing = true; });
    searchInput.addEventListener('compositionend', () => {
      composing = false;
      const q = searchInput.value.trim();
      if (q.length >= 1) {
        window.dispatchEvent(new CustomEvent('global-search', { detail: q }));
      }
    });
    searchInput.addEventListener('input', () => {
      if (composing) return;
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
