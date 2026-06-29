let achievements = [];

async function loadData() {
  if (achievements.length) return;
  try {
    const resp = await fetch('./data/achievements.json');
    achievements = await resp.json();
  } catch (e) {
    console.warn('Failed to load achievements:', e);
  }
}

const TYPE_COLORS = {
  '白金': { bg: 'var(--accent-gold)', color: '#000' },
  '追忆': { bg: '#8b0000', color: '#fff' },
  '收集': { bg: '#2a6b8b', color: '#fff' },
  '结局': { bg: '#4a0080', color: '#fff' },
  '流程': { bg: '#3a6b3a', color: '#fff' },
  '支线': { bg: 'var(--bg-card)', color: 'var(--text)', border: 'var(--border-color)' },
};

export async function renderAchievements(container, params) {
  await loadData();

  let filterType = '';

  function render() {
    const types = [...new Set(achievements.map(a => a.type))];
    let filtered = filterType ? achievements.filter(a => a.type === filterType) : achievements;

    let html = `
      <div class="page-header">
        <div class="page-title" style="font-family:'Cinzel',serif;">奖杯</div>
        <div class="page-subtitle">艾尔登法环 奖杯列表</div>
        <div class="page-meta">共 ${filtered.length} / ${achievements.length} 个奖杯</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
        <button class="tag-filter-btn ${!filterType ? 'active' : ''}" data-type="">全部</button>
        ${types.map(t => {
          const c = TYPE_COLORS[t] || {};
          return `<button class="tag-filter-btn ${filterType === t ? 'active' : ''}" data-type="${t}" style="background:${c.bg};color:${c.color};${c.border ? 'border:1px solid ' + c.border : ''}">${t}</button>`;
        }).join('')}
      </div>
      <div class="items-grid">
    `;

    for (const a of filtered) {
      html += `
        <div class="item-card" style="display:flex;align-items:center;gap:12px;padding:12px;">
          <div style="font-size:1.5rem;width:36px;text-align:center;">${a.icon}</div>
          <div style="flex:1;min-width:0;">
            <div class="item-card-name">${a.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${a.condition}</div>
          </div>
          <span class="item-card-tag" style="${(() => {
            const c = TYPE_COLORS[a.type] || {};
            return `background:${c.bg};color:${c.color};${c.border ? 'border:1px solid ' + c.border : ''}`;
          })()}">${a.type}</span>
        </div>
      `;
    }

    html += '</div>';
    if (!filtered.length) {
      html = '<div class="empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">无匹配奖杯</div></div>';
    }

    container.innerHTML = html;

    container.querySelectorAll('.tag-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterType = btn.dataset.type;
        render();
      });
    });
  }

  render();
  return () => {};
}
