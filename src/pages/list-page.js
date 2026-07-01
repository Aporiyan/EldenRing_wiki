import { getData, getCategories, ATTR_ATK_CN, ATTR_CN, translateName, scalingGrade, getUpgradeInfo, getCategoryGroup, getCategorySub, getCategoryGroups, getGroupSubs, getItemImageUrl } from '../store.js';

const GRADE_THRESHOLD = { S: 1.4, A: 1.0, B: 0.7, C: 0.4, D: 0.2, E: 0.01 };
const STAT_KEY_MAP = { str: 'strength', dex: 'dexterity', int: 'intelligence', fai: 'faith', arc: 'arcane' };

const KEY_LABEL = {
  armaments: '武器', armor: '防具', spells: '魔法', talismans: '护符',
  'ashes-of-war': '战灰', 'spirit-ashes': '骨灰',
  tools: '道具', keys: '钥匙',
  'crafting-materials': '素材', 'bolstering-materials': '强化',
  'dlc-armaments': 'DLC武器', 'dlc-armor': 'DLC防具',
  'dlc-talismans': 'DLC护符', 'dlc-spells': 'DLC魔法',
  'dlc-ashes-of-war': 'DLC战灰', 'dlc-spirit-ashes': 'DLC骨灰',
};

const RARITY_ORDER = ['', 'Common', 'Rare', 'Legendary'];
const SORT_FUNCS = {
  '名称 A-Z': (a, b) => (a.name_cn || a.name || '').localeCompare(b.name_cn || b.name || ''),
  '名称 Z-A': (a, b) => (b.name_cn || b.name || '').localeCompare(a.name_cn || a.name || ''),
  '重量 ↓': (a, b) => (b.weight || 0) - (a.weight || 0),
  '重量 ↑': (a, b) => (a.weight || 0) - (b.weight || 0),
  '稀有度 ↓': (a, b) => RARITY_ORDER.indexOf(b.rarity || '') - RARITY_ORDER.indexOf(a.rarity || ''),
};

export function createListPage(key, title, subtitle, options = {}) {
  return async (container, params) => {
    const allItems = getData(key);
    let filteredItems = [...allItems];
    let activeScope = '全部';
    let activeCategory = null;
    let activeGroup = null;
    let activeSubCategory = null;
    let searchQuery = '';
    let sortKey = '名称 A-Z';

    const hasDlc = allItems.some(i => i.is_dlc);
    const categories = getCategories(key);
    const categoryGroups = key === 'armaments' ? getCategoryGroups(key) : categories;

    if (params && params.dlc === 'true') {
      activeScope = 'DLC';
    }

    const routePath = options.routePath || key;
    const stateKey = `listState-${routePath}`;

    let restoredGradeVals = null;

    function saveState() {
      const gradeVals = {};
      if (options.gradeFilters) {
        options.gradeFilters.forEach(gf => {
          const sel = container.querySelector(`#gf-${gf.key}`);
          gradeVals[gf.key] = sel ? sel.value : '';
        });
      }
      sessionStorage.setItem(stateKey, JSON.stringify({ searchQuery, activeScope, activeCategory, activeGroup, activeSubCategory, sortKey, gradeVals }));
    }

    function restoreState() {
      try {
        const saved = sessionStorage.getItem(stateKey);
        if (saved) {
          const s = JSON.parse(saved);
          searchQuery = s.searchQuery || '';
          activeScope = s.activeScope || '全部';
          activeCategory = s.activeCategory || null;
          activeGroup = s.activeGroup || null;
          activeSubCategory = s.activeSubCategory || null;
          sortKey = s.sortKey || '名称 A-Z';
          restoredGradeVals = s.gradeVals || null;
        }
      } catch (e) {}
    }
    restoreState();

    function getSortOptions() {
      const opts = ['名称 A-Z'];
      const hasWeight = allItems.some(i => i.weight !== undefined);
      const hasRarity = allItems.some(i => i.rarity && i.rarity !== 'Common');
      if (hasWeight) { opts.push('重量 ↓', '重量 ↑'); }
      if (hasRarity) opts.push('稀有度 ↓');
      opts.push('名称 Z-A');
      return opts;
    }

    function getScopeItems(scope) {
      if (scope === '全部') return allItems;
      if (scope === 'DLC') return allItems.filter(i => i.is_dlc);
      return allItems.filter(i => !i.is_dlc);
    }

    function applyFiltersAndSearch() {
      const scope = container.querySelector('#scope-bar .scope-btn.active')?.dataset?.scope || activeScope;
      activeScope = scope;
      const sq = searchQuery.toLowerCase().trim();
      const scopeItems = getScopeItems(scope);

      // Read active group from DOM for weapons, old category for others
      if (isGrouped) {
        const grpBtn = container.querySelector('#cat-bar .cat-btn.active');
        activeGroup = grpBtn ? grpBtn.dataset.cat : null;
        if (!activeGroup) activeSubCategory = null;
        updateSubBar();
        // Now read sub-category from the refreshed sub-bar
        const subBtn = container.querySelector('#sub-bar .cat-btn.active');
        activeSubCategory = subBtn && subBtn.dataset.sub ? subBtn.dataset.sub : null;
      } else {
        const catBtn = container.querySelector('#cat-bar .cat-btn.active');
        activeCategory = catBtn ? catBtn.dataset.cat : null;
      }

      filteredItems = scopeItems.filter(item => {
        if (isGrouped) {
          if (activeGroup) {
            const itemGroup = getCategoryGroup(item.category || '');
            if (itemGroup !== activeGroup) return false;
            if (activeSubCategory) {
              const itemSub = getCategorySub(item.category || '');
              if (itemSub !== activeSubCategory) return false;
            }
          }
        } else {
          if (activeCategory) {
            const itemCat = item.category_cn || item.category || '';
            if (itemCat !== activeCategory) return false;
          }
        }
        if (sq) {
          const desc = Array.isArray(item.description) ? item.description.join('') : (item.description || '');
          const searchText = ((item.name_cn || '') + '||' + (item.name_en || '') + '||' + (item.name || '') + '||' + desc + '||' + (item.summary || '')).toLowerCase();
          if (!searchText.includes(sq)) return false;
        }
        if (options.statFilters) {
          for (const sf of options.statFilters) {
            const input = container.querySelector(`#sf-${sf.key}`);
            if (input && input.value) {
              const val = parseFloat(input.value);
              const itemVal = getNestedValue(item, sf.path);
              if (itemVal === undefined) continue;
              if (itemVal < val) return false;
            }
          }
        }
        if (options.gradeFilters) {
          // Pre-compute max upgrade scaling once per item
          let maxSca = null;
          if (item.affinity) {
            const info = getUpgradeInfo(item);
            if (info) {
              const maxLv = info.calcLevel(info.maxLevel);
              if (maxLv) maxSca = maxLv.scaling;
            }
          }
          for (const gf of options.gradeFilters) {
            const select = container.querySelector(`#gf-${gf.key}`);
            if (select && select.value) {
              const grade = select.value;
              const threshold = GRADE_THRESHOLD[grade];
              if (!threshold) continue;
              let itemVal;
              if (maxSca) {
                itemVal = maxSca[STAT_KEY_MAP[gf.key] || gf.key];
              } else {
                itemVal = getNestedValue(item, gf.path);
              }
              if (itemVal === undefined) continue;
              if (itemVal < threshold) return false;
            }
          }
        }
        return true;
      });
      const sortFn = SORT_FUNCS[sortKey];
      if (sortFn) filteredItems.sort(sortFn);
    }

    // Build static filter bar HTML (only done once)
    const isGrouped = key === 'armaments';
    const renderHeader = () => {
      const relevantCats = getScopeItems(activeScope).reduce((acc, i) => {
        const c = i.category_cn || i.category || '';
        if (c && !acc.includes(c)) acc.push(c);
        return acc;
      }, []);
      const relevantGroups = isGrouped ? categoryGroups.filter(g =>
        getScopeItems(activeScope).some(i => getCategoryGroup(i.category || '') === g)
      ) : [];
      const catFilterLabel = isGrouped ? activeGroup : activeCategory;
      return `
      <div class="page-header">
        <div class="page-title">${title}</div>
        ${subtitle ? `<div class="page-subtitle">${subtitle}</div>` : ''}
        <div class="page-meta">
          <span id="item-count">共 ${filteredItems.length} 件</span>
          ${activeScope !== '全部' ? `<span>${activeScope}</span>` : ''}
          ${catFilterLabel ? `<span>${catFilterLabel}</span>` : ''}
          ${activeSubCategory ? `<span>${activeSubCategory}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
        <div class="search-box" style="flex:1;min-width:200px;max-width:360px">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="page-search-input" placeholder="搜索此页面的${title}..." autocomplete="off" value="${escapeHtml(searchQuery)}">
        </div>
        <select id="sort-select" class="sort-select">
          ${getSortOptions().map(o => `<option value="${o}" ${sortKey === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>
      ${hasDlc ? `
      <div class="filter-bar scope-bar" id="scope-bar">
        <button class="scope-btn filter-btn ${activeScope === '全部' ? 'active' : ''}" data-scope="全部">全部</button>
        <button class="scope-btn filter-btn ${activeScope === '本体' ? 'active' : ''}" data-scope="本体">本体</button>
        <button class="scope-btn filter-btn ${activeScope === 'DLC' ? 'active' : ''}" data-scope="DLC">DLC</button>
      </div>` : ''}
      ${options.showCategories !== false && (isGrouped ? categoryGroups.length > 0 : categories.length > 0) ? `
      <div class="filter-bar cat-bar" id="cat-bar">
        <button class="cat-btn filter-btn ${!isGrouped ? (!activeCategory ? 'active' : '') : (!activeGroup ? 'active' : '')}" data-cat="">全部</button>
        ${isGrouped
          ? categoryGroups.map(g => `
            <button class="cat-btn filter-btn ${activeGroup === g ? 'active' : ''}" data-cat="${g}" style="${!relevantGroups.includes(g) && activeScope !== '全部' ? 'display:none' : ''}">${g}</button>
          `).join('')
          : categories.map(c => `
            <button class="cat-btn filter-btn ${activeCategory === c ? 'active' : ''}" data-cat="${c}" style="${!relevantCats.includes(c) && activeScope !== '全部' ? 'display:none' : ''}">${c}</button>
          `).join('')
        }
      </div>` : ''}
      <div id="sub-bar-container"></div>
      ${options.statFilters ? renderStatFilters() : ''}
      ${options.gradeFilters ? renderGradeFilters(options.gradeFilters) : ''}
      <div id="items-grid-container"></div>
    `;};

    const updateCatBar = () => {
      const catBar = container.querySelector('#cat-bar');
      if (!catBar) return;
      const scope = container.querySelector('#scope-bar .scope-btn.active')?.dataset?.scope || activeScope;
      const scopeItems = getScopeItems(scope);
      catBar.querySelectorAll('.cat-btn').forEach(btn => {
        if (!btn.dataset.cat) { btn.style.display = ''; return; }
        const cat = btn.dataset.cat;
        let visible;
        if (isGrouped) {
          visible = scope === '全部' || scopeItems.some(i => getCategoryGroup(i.category || '') === cat);
        } else {
          visible = scope === '全部' || scopeItems.some(i => (i.category_cn || i.category || '') === cat);
        }
        btn.style.display = visible ? '' : 'none';
      });
    };

    const updateSubBar = () => {
      const subContainer = container.querySelector('#sub-bar-container');
      if (!subContainer) return;
      if (!isGrouped || !activeGroup) {
        subContainer.innerHTML = '';
        return;
      }
      const subs = getGroupSubs(activeGroup, key);
      if (subs.length <= 1) {
        subContainer.innerHTML = '';
        return;
      }
      subContainer.innerHTML = `
        <div class="filter-bar sub-bar" id="sub-bar">
          <button class="cat-btn filter-btn ${!activeSubCategory ? 'active' : ''}" data-sub="">全部</button>
          ${subs.map(s => `<button class="cat-btn filter-btn ${activeSubCategory === s ? 'active' : ''}" data-sub="${s}">${s}</button>`).join('')}
        </div>`;
      subContainer.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          subContainer.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeSubCategory = btn.dataset.sub || null;
          applyFiltersAndSearch();
          saveState();
          renderGrid();
        });
      });
    };

    const renderGrid = () => {
      const gridEl = container.querySelector('#items-grid-container');
      if (!gridEl) return;
      const items = filteredItems;
      if (items.length === 0) {
        gridEl.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-text">没有找到匹配的物品</div>
          </div>`;
      } else {
        gridEl.innerHTML = `
        <div class="items-grid">
          ${items.map(item => renderCard(item, key)).join('')}
        </div>`;
      }
      const countEl = container.querySelector('#item-count');
      if (countEl) countEl.textContent = `共 ${items.length} 件`;

      gridEl.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', () => {
          saveState();
          const id = card.dataset.id;
          sessionStorage.setItem('itemsBack', window.location.hash.replace(/^#/, ''));
          window.location.hash = `#/${routePath}/${id}`;
        });
      });
    };

    const setupFilters = () => {
      // Scope filter clicks
      const scopeBar = container.querySelector('#scope-bar');
      if (scopeBar) {
        scopeBar.querySelectorAll('.scope-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            scopeBar.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeScope = btn.dataset.scope;
            updateCatBar();
            if (isGrouped) {
              const grpBtn = container.querySelector(`#cat-bar .cat-btn[data-cat="${activeGroup}"]`);
              if (!grpBtn || grpBtn.style.display === 'none') {
                activeGroup = null;
                activeSubCategory = null;
              }
            } else if (activeCategory) {
              const catBtn = container.querySelector(`#cat-bar .cat-btn[data-cat="${activeCategory}"]`);
              if (!catBtn || catBtn.style.display === 'none') {
                if (catBtn) catBtn.classList.remove('active');
                activeCategory = null;
              }
            }
            applyFiltersAndSearch();
            saveState();
            renderGrid();
          });
        });
      }

      // Category filter clicks
      const catBar = container.querySelector('#cat-bar');
      if (catBar) {
        catBar.querySelectorAll('.cat-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            catBar.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (isGrouped) {
              activeGroup = btn.dataset.cat;
              activeSubCategory = null;
            } else {
              activeCategory = btn.dataset.cat;
            }
            applyFiltersAndSearch();
            saveState();
            renderGrid();
          });
        });
      }

      // Search input
      const searchInput = container.querySelector('#page-search-input');
      if (searchInput) {
        let composing = false;
        searchInput.addEventListener('compositionstart', () => { composing = true; });
        searchInput.addEventListener('compositionend', () => { composing = false; searchQuery = searchInput.value; applyFiltersAndSearch(); saveState(); renderGrid(); });
        searchInput.addEventListener('input', () => {
          if (composing) return;
          searchQuery = searchInput.value;
          applyFiltersAndSearch();
          saveState();
          renderGrid();
        });
      }

      // Stat filter inputs
      if (options.statFilters) {
        container.querySelectorAll('.stat-filter-input').forEach(input => {
          input.addEventListener('input', () => {
            applyFiltersAndSearch();
            renderGrid();
          });
        });
      }

      // Grade filter selects
      if (options.gradeFilters) {
        container.querySelectorAll('.grade-filter-select').forEach(sel => {
          sel.addEventListener('change', () => {
            applyFiltersAndSearch();
            renderGrid();
          });
        });
      }

      // Reset buttons
      container.querySelectorAll('.filter-reset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.reset;
          if (type === 'stat') {
            container.querySelectorAll('.stat-filter-input').forEach(inp => inp.value = '');
          } else if (type === 'grade') {
            container.querySelectorAll('.grade-filter-select').forEach(sel => sel.value = '');
          }
          applyFiltersAndSearch();
          renderGrid();
        });
      });

      // Sort selector
      const sortSelect = container.querySelector('#sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          sortKey = sortSelect.value;
          applyFiltersAndSearch();
          saveState();
          renderGrid();
        });
      }
    };

    container.innerHTML = renderHeader();
    // Apply restored grade filter values after DOM exists
    if (restoredGradeVals && options.gradeFilters) {
      options.gradeFilters.forEach(gf => {
        const sel = container.querySelector(`#gf-${gf.key}`);
        if (sel && restoredGradeVals[gf.key]) sel.value = restoredGradeVals[gf.key];
      });
      restoredGradeVals = null;
    }
    applyFiltersAndSearch();
    renderGrid();
    setupFilters();

    return () => { saveState(); };
  };
}

function renderStatFilters() {
  return `
    <div class="stat-filters">
      <div class="stat-filter-group">
        <span class="stat-filter-label">力</span>
        <input type="number" class="stat-filter-input" id="sf-str" placeholder="0" min="0">
      </div>
      <div class="stat-filter-group">
        <span class="stat-filter-label">灵</span>
        <input type="number" class="stat-filter-input" id="sf-dex" placeholder="0" min="0">
      </div>
      <div class="stat-filter-group">
        <span class="stat-filter-label">智</span>
        <input type="number" class="stat-filter-input" id="sf-int" placeholder="0" min="0">
      </div>
      <div class="stat-filter-group">
        <span class="stat-filter-label">信</span>
        <input type="number" class="stat-filter-input" id="sf-fai" placeholder="0" min="0">
      </div>
      <div class="stat-filter-group">
        <span class="stat-filter-label">感</span>
        <input type="number" class="stat-filter-input" id="sf-arc" placeholder="0" min="0">
      </div>
      <span style="font-size:0.7rem;color:var(--text-muted);margin-left:12px;white-space:nowrap;">最低需求筛选</span>
      <button class="filter-reset-btn" data-reset="stat">重置</button>
    </div>
  `;
}

function renderGradeFilters(gradeFilters) {
  const grades = ['', 'E', 'D', 'C', 'B', 'A', 'S'];
  const gradeLabels = { '': '不限' };
  return `
    <div class="grade-filters">
      ${gradeFilters.map(gf => `
        <div class="grade-filter-group">
          <span class="grade-filter-label">${gf.label}</span>
          <select class="grade-filter-select" id="gf-${gf.key}">
            ${grades.map(g => `<option value="${g}">${gradeLabels[g] || g}</option>`).join('')}
          </select>
        </div>
      `).join('')}
      <span class="grade-filter-hint">补正等级筛选</span>
      <button class="filter-reset-btn" data-reset="grade">重置</button>
    </div>
  `;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

function renderCard(item, key) {
  const parts = [];

  if (item.weight !== undefined) {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">重</span> <span class="item-card-stat-value">${item.weight}</span></span>`);
  }

  if (item.category === 'Sorcery' || item.category === 'Incantation') {
    const reqs = item.requirements ? Object.entries(item.requirements).filter(([k, v]) => v > 0) : [];
    if (reqs.length > 0) {
      parts.push(`<div class="stat-row"><span class="stat-label">需求属性</span><span class="stat-value">${reqs.map(([k, v]) => `${reqLabel(k)} ${v}`).join(' ')}</span></div>`);
    }
    if (item.fp_cost !== undefined) parts.push(`<div class="stat-row"><span class="stat-label">专注</span><span class="stat-value">${item.fp_cost}</span></div>`);
    if (item.slots_used) parts.push(`<div class="stat-row"><span class="stat-label">格</span><span class="stat-value">${item.slots_used}</span></div>`);
  } else {
    if (item.requirements) {
      const reqs = Object.entries(item.requirements).filter(([k, v]) => v > 0);
      if (reqs.length > 0) {
        parts.push(`<span class="req-display">${reqs.map(([k, v]) => `<span class="req-badge">${reqLabel(k)} ${v}</span>`).join('')}</span>`);
      }
    }
  }

  if (item.fp_cost !== undefined && key === 'spirit-ashes') {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">专注</span> <span class="item-card-stat-value">${item.fp_cost}</span></span>`);
  }

  if (key === 'armaments' && item.attack_attributes) {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">攻击</span> <span class="item-card-stat-value">${item.attack_attributes.map(a => ATTR_ATK_CN[a] || a).join('/')}</span></span>`);
  }

  if (item.effects && item.effects.length > 0 && key === 'talismans') {
    const eff = item.effects[0];
    const attrCn = ATTR_CN[eff.attribute] || eff.attribute;
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">效果</span> <span class="item-card-stat-value">${attrCn}</span></span>`);
  }

  const tags = [];
  const catLabel = key === 'spirit-ashes' ? KEY_LABEL[key] : (item.category_cn || item.category || KEY_LABEL[key] || key);
  if (catLabel && catLabel !== KEY_LABEL[key]) tags.push(`<span class="item-card-tag cat">${catLabel}</span>`);
  if (item.rarity !== 'Common') tags.push(`<span class="item-card-tag rarity-${item.rarity}">${item.rarity_cn || item.rarity}</span>`);
  if (item.is_dlc) tags.push(`<span class="item-card-tag dlc">DLC</span>`);
  if (item.upgrade_material && (key === 'armaments' || key === 'spirit-ashes')) {
    const mat = item.upgrade_material;
    const cls = mat === 'Somber Smithing Stone' ? 'upgrade-somber' : mat === 'Ghost Glovewort' ? 'upgrade-ghost' : 'upgrade-normal';
    const label = mat === 'Somber Smithing Stone' ? '失色' : mat === 'Ghost Glovewort' ? '灵灰' : '普通';
    tags.push(`<span class="item-card-tag ${cls}">${label}</span>`);
  }

  const thumbUrl = getItemImageUrl(key, item.name_en || item.name);
  const thumbHtml = thumbUrl ? `<img class="item-card-weapon-thumb" src="${thumbUrl}" alt="" loading="lazy">` : '';

  return `
    <div class="item-card" data-id="${item.id}">
      <div class="item-card-header">
        ${thumbHtml}
        <div class="item-card-name">${item.name}</div>
        ${tags.length ? `<div class="item-card-tags">${tags.join('')}</div>` : ''}
      </div>
      ${parts.length ? `<div class="item-card-body">${parts.join('')}</div>` : ''}
    </div>
  `;
}

function reqLabel(k) {
  const map = { strength: '力', dexterity: '灵', intelligence: '智', faith: '信', arcane: '感' };
  return map[k] || k;
}

function escapeHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(s));
  return div.innerHTML;
}
