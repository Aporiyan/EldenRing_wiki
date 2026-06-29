import { globalSearch, ATTR_ATK_CN, ATTR_CN, getData, getItemImageUrl } from '../store.js';

const KEY_LABEL = {
  armaments: '武器', armor: '防具', spells: '魔法', talismans: '护符',
  'ashes-of-war': '战灰', 'spirit-ashes': '骨灰',
  tools: '道具', keys: '钥匙',
  'crafting-materials': '素材', 'bolstering-materials': '强化',
};

export function renderSearchResults(container, params) {
  let q = params.q || '';
  if (!q) {
    try {
      const saved = sessionStorage.getItem('searchState');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.q) q = s.q;
      }
    } catch (e) {}
  }

  function doSearch(query) {
    const results = query ? globalSearch(query) : [];
    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">搜索</div>
      </div>
      <div style="margin-bottom:16px">
        <div class="search-box" style="max-width:500px">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-input" id="page-search-input" value="${escapeHtml(query)}" placeholder="搜索所有物品..." autocomplete="off">
        </div>
      </div>
      ${query ? `
        <div class="page-meta" style="margin-bottom:12px">
          <span>“${escapeHtml(query)}” 共 ${results.length} 条结果</span>
        </div>
      ` : ''}
      ${!query ? `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">请输入搜索关键词</div>
        </div>
      ` : results.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">没有找到匹配 "${escapeHtml(query)}" 的结果</div>
        </div>
      ` : `
      <div class="items-grid">
        ${results.map(item => renderCard(item)).join('')}
      </div>`}
    `;

    const input = container.querySelector('#page-search-input');
    if (input) {
      input.focus();
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const v = input.value.trim();
          window.location.hash = v ? `#/search?q=${encodeURIComponent(v)}` : '#/search';
        }
      });
    }

    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.dataset.key;
        const id = card.dataset.id;
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
        sessionStorage.setItem('itemsBack', window.location.hash.replace(/^#/, ''));
        window.location.hash = `#/${route}/${id}`;
      });
    });
  }

  doSearch(q);
  return () => { sessionStorage.setItem('searchState', JSON.stringify({ q })); };
}

function renderCard(item) {
  const parts = [];
  if (item.weight !== undefined) {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">重</span> <span class="item-card-stat-value">${item.weight}</span></span>`);
  }
  if (item.requirements) {
    const reqs = Object.entries(item.requirements).filter(([, v]) => v > 0);
    if (reqs.length > 0) {
      parts.push(`<span class="req-display">${reqs.map(([k, v]) => `<span class="req-badge">${reqLabel(k)} ${v}</span>`).join('')}</span>`);
    }
  }
  if ((item.category === 'Sorcery' || item.category === 'Incantation') && item.fp_cost !== undefined) {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">专注</span> <span class="item-card-stat-value">${item.fp_cost}</span></span>`);
  }
  if (item.slots_used) {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">格</span> <span class="item-card-stat-value">${item.slots_used}</span></span>`);
  }
  if (item._key === 'spirit-ashes' && item.fp_cost !== undefined) {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">专注</span> <span class="item-card-stat-value">${item.fp_cost}</span></span>`);
  }
  if (item._key === 'armaments' && item.attack_attributes) {
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">攻击</span> <span class="item-card-stat-value">${item.attack_attributes.map(a => ATTR_ATK_CN[a] || a).join('/')}</span></span>`);
  }
  if (item.effects && item.effects.length > 0 && item._key === 'talismans') {
    const eff = item.effects[0];
    parts.push(`<span class="item-card-stat"><span class="item-card-stat-label">效果</span> <span class="item-card-stat-value">${ATTR_CN[eff.attribute] || eff.attribute}</span></span>`);
  }

  const tags = [];
  if (item.category_cn || item.category) tags.push(`<span class="item-card-tag cat">${item.category_cn || item.category}</span>`);
  if (item.rarity !== 'Common') tags.push(`<span class="item-card-tag rarity-${item.rarity}">${item.rarity_cn || item.rarity}</span>`);
  if (item.is_dlc) tags.push(`<span class="item-card-tag dlc">DLC</span>`);
  if (item.upgrade_material && (item._key === 'armaments' || item._key === 'spirit-ashes')) {
    const mat = item.upgrade_material;
    const cls = mat === 'Somber Smithing Stone' ? 'upgrade-somber' : mat === 'Ghost Glovewort' ? 'upgrade-ghost' : 'upgrade-normal';
    const label = mat === 'Somber Smithing Stone' ? '失色' : mat === 'Ghost Glovewort' ? '灵灰' : '普通';
    tags.push(`<span class="item-card-tag ${cls}">${label}</span>`);
  }

  const thumbUrl = getItemImageUrl(item._key, item.name_en || item.name);
  const thumbHtml = thumbUrl ? `<img class="item-card-weapon-thumb" src="${thumbUrl}" alt="" loading="lazy">` : '';

  return `
    <div class="item-card" data-key="${item._key}" data-id="${item.id}">
      <div class="item-card-header">
        ${thumbHtml}
        <div style="flex:1;min-width:0">
          <div class="item-card-category" style="font-size:0.68rem;color:var(--accent-gold)">${item._type}</div>
          <div class="item-card-name">${item.name}</div>
        </div>
        ${tags.length ? `<div class="item-card-tags">${tags.join('')}</div>` : ''}
      </div>
      <div class="item-card-body">
        ${parts.join('')}
      </div>
    </div>
  `;
}

function reqLabel(k) {
  const map = { strength: '力', dexterity: '灵', intelligence: '智', faith: '信', arcane: '感' };
  return map[k] || k;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(s));
  return div.innerHTML;
}
