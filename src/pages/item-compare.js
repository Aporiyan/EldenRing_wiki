import { getData, translateName, ATTR_CN, scalingGrade } from '../store.js';

const GROUPS = [
  { key: 'armaments', label: '武器' },
  { key: 'armor', label: '防具' },
  { key: 'talismans', label: '护符' },
  { key: 'spells', label: '魔法/祷告' },
];

export function renderItemCompare(container, params) {
  let activeGroup = 'armaments';
  let selected = [];
  let query = '';

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">物品对比</div>
        <div class="page-meta" id="ic-meta">0 件已选择</div>
      </div>
      <div class="filter-bar" style="flex-wrap:wrap;gap:6px">
        ${GROUPS.map(g => `<button class="filter-btn ${activeGroup === g.key ? 'active' : ''}" data-icg="${g.key}">${g.label}</button>`).join('')}
        <input type="text" id="ic-search" class="filter-btn" placeholder="搜索添加物品..." style="flex:1;min-width:150px;padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text)">
        <button class="filter-btn" id="ic-clear" style="color:var(--accent-red);display:none">✕ 清空</button>
      </div>
      <div id="ic-sel-tags" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;min-height:28px"></div>
      <div id="ic-search-results" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;min-height:60px"></div>
      <div id="ic-table"></div>
    </div>`;

  const metaDiv = container.querySelector('#ic-meta');
  const selTagsDiv = container.querySelector('#ic-sel-tags');
  const searchResDiv = container.querySelector('#ic-search-results');
  const tableDiv = container.querySelector('#ic-table');
  const searchInp = container.querySelector('#ic-search');
  const clearBtn = container.querySelector('#ic-clear');

  function getPool() { return getData(activeGroup); }

  function renderSearchResults() {
    if (!query) { searchResDiv.innerHTML = '<div class="empty-state" style="width:100%"><div class="empty-state-icon">⇄</div><div class="empty-state-text">搜索添加 2 件以上同类型物品对比</div></div>'; return; }
    const pool = getPool();
    const filtered = pool.filter(i => {
      const cn = translateName(i.name) || i.name;
      return cn.toLowerCase().includes(query.toLowerCase()) || i.name.toLowerCase().includes(query);
    }).filter(i => !selected.some(s => s.id === i.id)).slice(0, 20);

    if (!filtered.length) {
      searchResDiv.innerHTML = '<div class="empty-state" style="width:100%"><div class="empty-state-text">无匹配物品</div></div>';
      return;
    }
    searchResDiv.innerHTML = filtered.map(i => {
      const cn = translateName(i.name) || i.name;
      return `<div class="item-card" data-icadd="${i.id}" style="cursor:pointer;width:200px;flex-shrink:0">
        <div class="item-card-header"><div class="item-card-name" style="font-size:0.85rem">${cn}</div></div>
        <div class="item-card-body" style="gap:2px;padding:6px 10px">
          <div class="item-card-stat"><span class="item-card-stat-label">重量</span><span class="item-card-stat-value">${i.weight || 0}</span></div>
        </div>
      </div>`;
    }).join('');
    searchResDiv.querySelectorAll('[data-icadd]').forEach(el => {
      el.addEventListener('click', () => {
        const id = parseInt(el.dataset.icadd);
        const item = getPool().find(i => i.id === id);
        if (item && !selected.some(s => s.id === id)) {
          selected.push(item);
          query = '';
          searchInp.value = '';
          updateUI();
        }
      });
    });
  }

  function renderTable() {
    if (selected.length < 2) { tableDiv.innerHTML = ''; return; }
    const fields = [];
    fields.push({ label: '名称', render: i => translateName(i.name) || i.name });

    if (activeGroup === 'armaments') {
      fields.push({ label: '重量', render: i => i.weight || 0 });
      fields.push({ label: '类型', render: i => i.category || '' });
      if (selected.some(i => i.attack_attributes)) {
        (selected[0].attack_attributes || []).forEach(attr => {
          fields.push({ label: ATTR_CN[attr] || attr, render: i => (i.attack || {})[attr] || 0 });
        });
      }
      if (selected.some(i => i.requirements)) {
        Object.keys(selected[0].requirements || {}).forEach(stat => {
          fields.push({ label: REQ_CN(stat), render: i => (i.requirements || {})[stat] || 0 });
        });
      }
      if (selected.some(i => i.affinity)) {
        const firstAff = Object.values(selected[0].affinity)[0];
        if (firstAff && firstAff.scaling) {
          Object.keys(firstAff.scaling).forEach(stat => {
            fields.push({ label: REQ_CN(stat) + '补正', render: i => {
              const aff = i.affinity && i.affinity.Standard;
              return aff && aff.scaling ? scalingGrade(aff.scaling[stat]) : '-';
            }});
          });
        }
      }
    } else if (activeGroup === 'armor') {
      fields.push({ label: '重量', render: i => i.weight || 0 });
      fields.push({ label: '部位', render: i => i.category || '' });
      if (selected.some(i => i.absorptions)) {
        const absLabels = { physical: '物理', strike: '打击', slash: '斩击', pierce: '突刺', magic: '魔法', fire: '火焰', lightning: '雷', holy: '圣' };
        Object.keys(selected[0].absorptions || {}).forEach(k => {
          fields.push({ label: absLabels[k] || k, render: i => (i.absorptions[k] || 0) + '%' });
        });
      }
      if (selected.some(i => i.resistances)) {
        const resLabels = { immunity: '免疫', robustness: '强韧', focus: '专注', vitality: '活力', poise: '韧性' };
        Object.keys(selected[0].resistances || {}).forEach(k => {
          fields.push({ label: resLabels[k] || k, render: i => i.resistances[k] || 0 });
        });
      }
    } else if (activeGroup === 'talismans') {
      fields.push({ label: '重量', render: i => i.weight || 0 });
      if (selected.some(i => i.effects)) {
        fields.push({ label: '效果', render: i => {
          const eff = i.effects && i.effects[0];
          return eff ? (ATTR_CN[eff.attribute] || eff.attribute) + (eff.value ? ' ' + eff.value : '') : '-';
        }});
      }
    } else if (activeGroup === 'spells') {
      if (selected.some(i => i.slots_used !== undefined)) fields.push({ label: '记忆格', render: i => i.slots_used });
      if (selected.some(i => i.fp_cost !== undefined)) fields.push({ label: 'FP', render: i => i.fp_cost });
      if (selected.some(i => i.requirements)) {
        Object.keys(selected[0].requirements || {}).forEach(stat => {
          fields.push({ label: REQ_CN(stat), render: i => (i.requirements || {})[stat] || 0 });
        });
      }
    }

    let html = `<div style="overflow-x:auto;margin-top:16px">
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <tr style="background:var(--bg-card)">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid var(--border)">属性</th>
          ${selected.map(i => `<th style="padding:8px 12px;text-align:center;border-bottom:2px solid var(--border)">${translateName(i.name) || i.name}</th>`).join('')}
        </tr>`;
    fields.forEach(f => {
      html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
        <td style="padding:6px 12px;color:var(--text-muted)">${f.label}</td>
        ${selected.map(i => `<td style="padding:6px 12px;text-align:center">${f.render(i) ?? '-'}</td>`).join('')}
      </tr>`;
    });
    html += '</table></div>';
    tableDiv.innerHTML = html;
  }

  function updateUI() {
    metaDiv.textContent = `${selected.length} 件已选择`;
    clearBtn.style.display = selected.length ? '' : 'none';

    selTagsDiv.innerHTML = selected.map(i =>
      `<span class="item-card-tag cat" style="font-size:0.8rem">${translateName(i.name) || i.name}
        <span data-icrm="${i.id}" style="cursor:pointer;margin-left:4px">✕</span></span>`
    ).join('');
    selTagsDiv.querySelectorAll('[data-icrm]').forEach(el => {
      el.addEventListener('click', () => {
        selected = selected.filter(s => s.id !== parseInt(el.dataset.icrm));
        updateUI();
      });
    });

    renderSearchResults();
    renderTable();
  }

  // Stable event listeners
  container.querySelectorAll('[data-icg]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-icg]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGroup = btn.dataset.icg;
      selected = []; query = ''; searchInp.value = '';
      updateUI();
    });
  });
  searchInp.addEventListener('input', e => { query = e.target.value; renderSearchResults(); });
  clearBtn.addEventListener('click', () => { selected = []; query = ''; searchInp.value = ''; updateUI(); });

  updateUI();
  return () => {};
}

function REQ_CN(k) {
  const m = { strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };
  return m[k] || k;
}
