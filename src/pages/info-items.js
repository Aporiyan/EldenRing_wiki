import { getData } from '../store.js';

const KEY_TAG_REPLACE = [
  [/\<\?keyicon@0009\?\>/g, '［下马］', '［Dismount］'],
  [/\<\?keyicon@0017\?\>/g, '［攻击］', '［Attack］'],
  [/\<\?keyicon@7\?\>/g, '［翻滚］', '［Dodge］'],
  [/\<\?keyicon@8\?\>/g, '［跳跃］', '［Jump］'],
  [/\<\?keyicon@9\?\>/g, '［蹲下］', '［Crouch］'],
  [/\<\?keyicon@17\?\>/g, '［攻击］', '［Attack］'],
  [/\<\?keyicon@18\?\>/g, '［防御］', '［Guard］'],
  [/\<\?keyicon@19\?\>/g, '［双手］', '［Two-hand］'],
  [/\<\?keyicon@20\?\>/g, '［切换］', '［Switch］'],
  [/\<\?keyicon@22\?\>/g, '［箭1］', '［Arrow1］'],
  [/\<\?keyicon@23\?\>/g, '［重攻击］', '［Heavy］'],
  [/\<\?keyicon@24\?\>/g, '［防御］', '［Guard］'],
  [/\<\?keyicon@25\?\>/g, '［战技］', '［Skill］'],
  [/\<\?keyicon@27\?\>/g, '［组合］', '［Mod］'],
  [/\<\?keyicon@28\?\>/g, '［制作］', '［Craft］'],
  [/\<\?keyicon@29\?\>/g, '［地图］', '［Map］'],
  [/\<\?keyMove\?\>/g, '［移动］', '［Move］'],
  [/\<\?keyControlCamera\?\>/g, '［视角］', '［Camera］'],
  [/\<\?keyActName@9\?\>/g, '蹲下', 'Crouch'],
  [/\<\?keyActName@17\?\>/g, '攻击', 'Attack'],
  [/\<\?keyActName@19\?\>/g, '双手共持（左手）', 'Two-hand(L)'],
  [/\<\?keyActName@20\?\>/g, '双手共持（右手）', 'Two-hand(R)'],
  [/\<\?keyActName@25\?\>/g, '发动战技', 'Use Skill'],
  [/\<\?keyActName@28\?\>/g, '打开制作选单', 'Crafting'],
  [/\<\?keyActName@29\?\>/g, '打开地图', 'Map'],
];

function replaceKeyTags(text, en) {
  for (const [re, cn, eng] of KEY_TAG_REPLACE) {
    text = text.replace(re, en ? eng : cn);
  }
  return text;
}

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
        return i.name.toLowerCase().includes(q) || (i.name_en || '').toLowerCase().includes(q);
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
           <div id="toggle-en" style="margin-left:auto;display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
            <span class="info-lang-label" style="color:${!showEn ? 'var(--accent)' : 'var(--text-muted)'};font-weight:${!showEn ? '600' : '400'}">中文</span>
            <div class="info-toggle-track" style="background:${showEn ? 'var(--accent)' : 'var(--bg-input)'};border-color:${showEn ? 'var(--accent)' : 'var(--border)'}">
              <div class="info-toggle-knob" style="left:${showEn ? '18px' : '1px'}"></div>
            </div>
            <span class="info-lang-label" style="color:${showEn ? 'var(--accent)' : 'var(--text-muted)'};font-weight:${showEn ? '600' : '400'}">EN</span>
          </div>
        </div>
        <div class="items-grid">
          ${items.map(i => {
            const descEn = Array.isArray(i.description) ? i.description.filter(d => d.trim()).join('\n') : (i.description || '');
            const descCn = i.description_cn ? (Array.isArray(i.description_cn) ? i.description_cn.join('\n') : i.description_cn) : '';
            const catInfo = CATEGORIES.find(c => c.key === i.category);
            const catLabel = catInfo ? catInfo.cn : i.category;
            return `
              <div class="item-card info-card" data-name="${i.name}">
                <div class="item-card-header">
                  <div class="item-card-name">${showEn ? (i.name_en || i.name) : i.name}</div>
                  <div class="item-card-tags">
                    <span class="item-card-tag" style="background:${CAT_COLORS[i.category] || '#858796'}">${catLabel}</span>
                  </div>
                </div>
                <div class="item-card-body info-card-body">
                  <div class="info-card-desc">${replaceKeyTags(showEn ? (descEn || descCn) : (descCn || descEn), showEn)}</div>
                </div>
              </div>`;
          }).join('')}
          ${items.length === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-text">未找到匹配</div></div>' : ''}
        </div>
      </div>
      <div id="info-overlay" class="bp-overlay" style="display:none">
        <div class="info-modal">
          <div class="info-modal-head">
            <span class="info-modal-title" id="info-modal-title"></span>
            <button class="bp-modal-close" id="info-mclose">&#10005;</button>
          </div>
          <div class="info-modal-body">
            <div class="info-modal-desc" id="info-modal-desc"></div>
          </div>
        </div>
      </div>`;

    container.querySelector('#info-search').addEventListener('input', e => {
      searchQuery = e.target.value;
      render();
    });
    container.querySelector('#toggle-en').addEventListener('click', e => {
      showEn = !showEn;
      render();
    });
    container.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCat = btn.dataset.cat;
        render();
      });
    });

    container.querySelectorAll('.info-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        const item = allData.find(i => i.name === name);
        if (!item) return;
        const descEn = Array.isArray(item.description) ? item.description.filter(d => d.trim()).join('\n') : (item.description || '');
        const descCn = item.description_cn ? (Array.isArray(item.description_cn) ? item.description_cn.join('\n') : item.description_cn) : '';
        container.querySelector('#info-modal-title').textContent = showEn ? (item.name_en || item.name) : item.name;
        container.querySelector('#info-modal-desc').textContent = replaceKeyTags(showEn ? (descEn || descCn) : (descCn || descEn), showEn);
        container.querySelector('#info-overlay').style.display = 'flex';
      });
    });

    const overlay = container.querySelector('#info-overlay');
    overlay.querySelector('#info-mclose').addEventListener('click', () => {
      overlay.style.display = 'none';
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  }

  render();
  return () => {};
}
