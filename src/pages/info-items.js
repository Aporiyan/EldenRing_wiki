import { getData, translateName } from '../store.js';

const CATEGORIES = [
  { key: 'Clue', cn: '线索' },
  { key: 'Note', cn: '笔记' },
  { key: 'Painting', cn: '画作' },
  { key: 'Tutorial', cn: '教程' },
];

const CAT_COLORS = {
  Clue: '#4e73df', Note: '#858796', Painting: '#f6c23e', Tutorial: '#1cc88a',
};

export function renderInfoPage(container, params) {
  const allData = getData('info');

  let activeCat = '全部';
  let searchQuery = '';
  let showEn = false;

  function render() {
    let items = [...allData];
    if (activeCat !== '全部') items = items.filter(i => i.category === activeCat);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => {
        const cn = translateName(i.name) || i.name;
        return cn.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
      });
    }

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <div class="page-title">信息 / 信件</div>
          <div class="page-meta">共 ${allData.length} 件</div>
        </div>
        <div class="filter-bar" style="flex-wrap:wrap;gap:6px">
          <input type="text" id="info-search" class="filter-btn" placeholder="搜索..." style="flex:1;min-width:150px;padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text)">
          <button class="filter-btn ${activeCat === '全部' ? 'active' : ''}" data-cat="全部">全部</button>
          ${CATEGORIES.map(c => `
            <button class="filter-btn ${activeCat === c.key ? 'active' : ''}" data-cat="${c.key}" style="${activeCat === c.key ? 'background:' + CAT_COLORS[c.key] : ''}">${c.cn}</button>
          `).join('')}
          <label style="display:flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--text-muted);cursor:pointer;margin-left:auto">
            <input type="checkbox" id="toggle-en" ${showEn ? 'checked' : ''}> EN
          </label>
        </div>
        <div class="items-grid">
          ${items.map(i => {
            const cn = translateName(i.name) || i.name;
            const descEn = Array.isArray(i.description) ? i.description.filter(d => d.trim()).join('\n') : (i.description || '');
            const descCn = i.description_cn ? (Array.isArray(i.description_cn) ? i.description_cn.join('\n') : i.description_cn) : '';
            const catInfo = CATEGORIES.find(c => c.key === i.category);
            const catLabel = catInfo ? catInfo.cn : i.category;
            return `
              <div class="item-card">
                <div class="item-card-header">
                  <div class="item-card-name">${cn}</div>
                  <div class="item-card-tags">
                    <span class="item-card-tag" style="background:${CAT_COLORS[i.category] || '#858796'}">${catLabel}</span>
                  </div>
                </div>
                <div class="item-card-body">
                  <div class="item-card-stat" style="grid-column:1/-1">
                    <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${showEn ? (descEn || descCn) : (descCn || descEn)}</div>
                  </div>
                </div>
              </div>`;
          }).join('')}
          ${items.length === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-text">未找到匹配</div></div>' : ''}
        </div>
      </div>`;

    container.querySelector('#info-search').addEventListener('input', e => {
      searchQuery = e.target.value;
      render();
    });
    container.querySelector('#toggle-en').addEventListener('change', e => {
      showEn = e.target.checked;
      render();
    });
    container.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCat = btn.dataset.cat;
        render();
      });
    });
  }

  render();
  return () => {};
}
