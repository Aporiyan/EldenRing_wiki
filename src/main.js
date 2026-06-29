import './styles/main.css';
import { loadAllData, globalSearch, getItemImageUrl } from './store.js';
import { registerRoute, initRouter, navigate } from './router.js';
import { renderHome } from './pages/home.js';
import { createListPage } from './pages/list-page.js';
import { createDetailPage } from './pages/detail.js';
import { renderItemsPage, renderItemsCategory, renderItemsTabGroup } from './pages/items.js';
import { renderSearchResults } from './pages/search.js';
import { renderArmorSetsList, renderArmorSetDetail } from './pages/armor-sets.js';
import { renderInfoPage } from './pages/info-items.js';
import { renderUpgradeCalc } from './pages/upgrade-calc.js';
import { renderBuildPlanner } from './pages/build-planner.js';
import { renderItemCompare } from './pages/item-compare.js';

async function init() {
  const content = document.getElementById('content-area');

  // Load all data
  try {
    await loadAllData();
  } catch (e) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠</div>
        <div class="empty-state-text">数据加载失败，请确保 data/ 目录存在且包含 JSON 文件</div>
      </div>`;
    return;
  }

  // Register routes
  registerRoute('/', renderHome);

  // Weapon routes
  registerRoute('/weapons', createListPage('armaments', '武器', '所有近战与远程武器', {
    routePath: 'weapons',
    statFilters: [
      { key: 'str', path: 'requirements.strength' },
      { key: 'dex', path: 'requirements.dexterity' },
      { key: 'int', path: 'requirements.intelligence' },
      { key: 'fai', path: 'requirements.faith' },
      { key: 'arc', path: 'requirements.arcane' },
    ],
    gradeFilters: [
      { key: 'str', label: '力', path: 'affinity.Standard.scaling.strength' },
      { key: 'dex', label: '灵', path: 'affinity.Standard.scaling.dexterity' },
      { key: 'int', label: '智', path: 'affinity.Standard.scaling.intelligence' },
      { key: 'fai', label: '信', path: 'affinity.Standard.scaling.faith' },
      { key: 'arc', label: '感', path: 'affinity.Standard.scaling.arcane' },
    ]
  }));
  registerRoute('/armor', createListPage('armor', '防具（散件）', '单件防具列表', { routePath: 'armor' }));
  registerRoute('/armor-sets', (container, params) => renderArmorSetsList(container, params));
  registerRoute('/armor-sets/:id', (container, params) => renderArmorSetDetail(container, params));
  registerRoute('/spells', createListPage('spells', '魔法 & 祷告', '所有魔法与祷告', { routePath: 'spells' }));
  registerRoute('/talismans', createListPage('talismans', '护符', '所有护符与饰品', { routePath: 'talismans' }));
  registerRoute('/ashes', createListPage('ashes-of-war', '战灰', '所有战灰与战技', { routePath: 'ashes', showCategories: false }));
  registerRoute('/spirits', createListPage('spirit-ashes', '骨灰', '所有召唤骨灰', { routePath: 'spirits' }));
  registerRoute('/items', (container, params) => renderItemsPage(container, params));
  registerRoute('/items/category/:id', (container, params) => renderItemsCategory(container, params));
  registerRoute('/items/tab/:id', (container, params) => renderItemsTabGroup(container, params));

  // Detail routes
  registerRoute('/weapons/:id', createDetailPage('armaments', '武器'));
  registerRoute('/armor/:id', createDetailPage('armor', '防具'));
  registerRoute('/spells/:id', createDetailPage('spells', '魔法'));
  registerRoute('/talismans/:id', createDetailPage('talismans', '护符'));
  registerRoute('/ashes/:id', createDetailPage('ashes-of-war', '战灰'));
  registerRoute('/spirits/:id', createDetailPage('spirit-ashes', '骨灰'));
  registerRoute('/tools/:id', createDetailPage('tools', '道具'));
  registerRoute('/keys/:id', createDetailPage('keys', '钥匙'));
  registerRoute('/crafting-materials/:id', createDetailPage('crafting-materials', '制作材料'));
  registerRoute('/bolstering-materials/:id', createDetailPage('bolstering-materials', '强化材料'));

  // New feature pages
  registerRoute('/info', (container, params) => renderInfoPage(container, params));
  registerRoute('/upgrade-calc', (container, params) => renderUpgradeCalc(container, params));
  registerRoute('/build-planner', (container, params) => renderBuildPlanner(container, params));
  registerRoute('/item-compare', (container, params) => renderItemCompare(container, params));

  // Search results
  registerRoute('/search', (container, params) => renderSearchResults(container, params));

  // Global search
  setupGlobalSearch();

  // Start router
  initRouter();

  // Sidebar: close on nav (mobile)
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
  });
}

function setupGlobalSearch() {
  const searchInput = document.getElementById('global-search');
  const contentArea = document.getElementById('content-area');

  let searchContainer = null;
  let resultsBox = null;

  function navigateToSearch() {
    const q = searchInput.value.trim();
    if (q.length < 1) return;
    if (resultsBox) resultsBox.classList.remove('open');
    searchInput.value = '';
    const hash = `#/search?q=${encodeURIComponent(q)}`;
    window.location.hash = hash;
    navigate(hash);
  }

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateToSearch();
    }
    if (e.key === 'ArrowDown' && resultsBox && resultsBox.classList.contains('open')) {
      e.preventDefault();
      const items = resultsBox.querySelectorAll('.search-result-item');
      if (items.length) items[0].focus();
    }
    if (e.key === 'Escape' && resultsBox && resultsBox.classList.contains('open')) {
      resultsBox.classList.remove('open');
      searchInput.blur();
    }
  });

  // Arrow navigation within results
  document.addEventListener('keydown', e => {
    if (!resultsBox || !resultsBox.classList.contains('open')) return;
    const items = [...resultsBox.querySelectorAll('.search-result-item')];
    const active = document.activeElement;
    const idx = items.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = items[Math.min(idx + 1, items.length - 1)];
      if (next) next.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) { searchInput.focus(); return; }
      items[idx - 1].focus();
    }
    if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault();
      active.click();
    }
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    if (q.length < 1) {
      if (resultsBox) resultsBox.classList.remove('open');
      return;
    }

    const results = globalSearch(q);

    if (!resultsBox) {
      resultsBox = document.createElement('div');
      resultsBox.className = 'search-results';
      searchInput.parentElement.style.position = 'relative';
      searchInput.parentElement.appendChild(resultsBox);
    }

    if (results.length === 0) {
      resultsBox.innerHTML = `<div class="search-result-item" style="color:var(--text-muted);cursor:default">未找到匹配结果</div>`;
    } else {
      const maxShow = Math.min(results.length, 20);
      resultsBox.innerHTML = results.slice(0, maxShow).map(item => {
        const thumb = getItemImageUrl(item._key, item.name_en || item.name);
        return `
        <div class="search-result-item" data-key="${item._key}" data-id="${item.id}" tabindex="0" role="button">
          ${thumb ? `<img class="search-result-thumb" src="${thumb}" alt="">` : ''}
          <span class="search-result-category">${item._type}</span>
          <span class="search-result-name">${highlightMatch(item.name, q)}</span>
          <span class="search-result-type">${item.category || ''}</span>
        </div>`;
      }).join('') + `
        <div class="search-result-item search-result-all" data-action="showall" tabindex="0" role="button">
          <span style="color:var(--accent-gold)">查看全部 ${results.length} 条结果 →</span>
        </div>`;
    }
    resultsBox.classList.add('open');

    resultsBox.querySelectorAll('.search-result-item[data-id]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.key;
        const id = el.dataset.id;
        const routeMap = {
          armaments: 'weapons',
          'ashes-of-war': 'ashes',
          'spirit-ashes': 'spirits',
          'crafting-materials': 'crafting-materials',
          'bolstering-materials': 'bolstering-materials',
          keys: 'keys',
          tools: 'tools',
        };
        const route = routeMap[key] || key;
        // Save search page as back target, then navigate to detail
        const q = searchInput.value.trim();
        sessionStorage.setItem('itemsBack', `/search?q=${encodeURIComponent(q)}`);
        resultsBox.classList.remove('open');
        searchInput.value = '';
        window.location.hash = `#/${route}/${id}`;
      });
    });

    const showAll = resultsBox.querySelector('.search-result-all');
    if (showAll) {
      showAll.addEventListener('click', () => {
        navigateToSearch();
      });
    }
  });

  // Listen for home page search event
  window.addEventListener('global-search', e => {
    const q = e.detail || '';
    if (q.length < 1) return;
    searchInput.value = q;
    // Trigger the search dropdown
    const inputEvent = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(inputEvent);
    searchInput.focus();
  });

  document.addEventListener('click', e => {
    if (resultsBox && !e.target.closest('.search-box')) {
      resultsBox.classList.remove('open');
    }
  });

  // Theme switcher
  setupThemeSwitcher();

  // Sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

function setupThemeSwitcher() {
  const current = localStorage.getItem('eldring-theme') || 'elden-ring';
  document.documentElement.className = current === 'elden-ring' ? '' : 'theme-' + current;

  document.querySelectorAll('.theme-btn').forEach(btn => {
    const theme = btn.dataset.theme;
    if ((theme === 'elden-ring' && !current) || theme === current) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.theme;
      document.documentElement.className = t === 'elden-ring' ? '' : 'theme-' + t;
      localStorage.setItem('eldring-theme', t);
    });
  });
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx) + '<strong style="color:var(--accent-gold)">' +
    text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
}

init();
