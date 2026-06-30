import { getData, translateName, getItemImageUrl } from '../store.js';

const GROUPS = [
  { key: 'armaments', label: '武器' },
  { key: 'armor', label: '防具' },
  { key: 'talismans', label: '护符' },
  { key: 'spells', label: '魔法/祷告' },
];

const CAT_CN = {
  Dagger: '匕首', 'Straight Sword': '直剑', Greatsword: '大剑',
  'Colossal Sword': '特大剑', 'Colossal Weapon': '特大武器',
  'Thrusting Sword': '刺剑', 'Heavy Thrusting Sword': '大重剑',
  'Curved Sword': '曲剑', 'Curved Greatsword': '大刀', Katana: '武士刀',
  Twinblade: '双头剑', Hammer: '锤', 'Great Hammer': '大锤',
  Flail: '连枷', Axe: '斧', Greataxe: '大斧',
  Halberd: '戟', Spear: '矛', 'Great Spear': '大矛',
  Lance: '长矛', Reaper: '镰刀', Scythe: '镰刀', Whip: '鞭',
  Fist: '拳', Claw: '爪', 'Light Bow': '小弓', Bow: '弓',
  Greatbow: '大弓', Crossbow: '弩', Ballista: '弩炮',
  'Glintstone Staff': '杖', Staff: '杖', 'Sacred Seal': '圣印记',
  Torch: '火把', 'Small Shield': '小盾', 'Medium Shield': '中盾',
  Shield: '盾', Greatshield: '大盾', Lance: '长矛',
  Head: '头部', Body: '身体', Chest: '身体', Arms: '手臂', Legs: '腿部',
};

const ABS_CN = { physical: '物理', strike: '打击', slash: '斩击', pierce: '突刺', magic: '魔力', fire: '火', lightning: '雷', holy: '圣' };
const RES_CN = { immunity: '免疫', robustness: '健壮度', focus: '理智度', vitality: '抗死度', poise: '强韧度' };
const REQ_CN = { strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };
const ATTR_CN = {
  physical: '物理', magic: '魔力', fire: '火', lightning: '雷', holy: '圣',
  stamina: '精力', 'Stamina': '精力', 'Maximum HP': '最大HP', 'Maximum FP': '最大FP',
  strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应',
  'Equip Load': '装备重量',
};

export function renderItemCompare(container, params) {
  let activeGroup = 'armaments';
  let selected = []; // max 4 items
  let query = '';
  let activeCat = '';
  let activeSlot = 0;

  const overlay = document.createElement('div');
  overlay.className = 'bp-overlay';
  overlay.style.display = 'none';

  function getPool() { return getData(activeGroup); }

  function getCats() {
    if (activeGroup === 'armaments') {
      return [...new Set(getPool().map(i => i.category || ''))].filter(Boolean).sort();
    }
    if (activeGroup === 'armor') {
      return ['Head', 'Body', 'Chest', 'Arms', 'Legs'].filter(c => getPool().some(i => i.category === c));
    }
    return [];
  }

  function catLabel(c) { return CAT_CN[c] || c; }

  function openModal(slotIdx) {
    activeSlot = slotIdx;
    const pool = getPool();
    const cats = getCats();

    overlay.innerHTML = `
      <div class="bp-modal">
        <div class="bp-modal-head">
          <div class="bp-modal-head-left">
            <span class="bp-modal-icon">◈</span>
            <span class="bp-modal-title">选择 ${GROUPS.find(g => g.key === activeGroup)?.label || ''} · 第 ${slotIdx + 1} 件</span>
            <span class="bp-modal-count">${pool.length}</span>
          </div>
          <button class="bp-modal-close" id="ic-mclose">✕</button>
        </div>
        <div class="bp-modal-search">
          <input type="text" id="ic-msearch" placeholder="搜索名称...">
        </div>
        ${cats.length ? `<div class="bp-modal-filter" id="ic-mfilter">
          <span class="bp-chip ${activeCat === '' ? 'on' : ''}" data-cat="">全部</span>
          ${cats.map(c => `<span class="bp-chip ${activeCat === c ? 'on' : ''}" data-cat="${c}">${catLabel(c)}</span>`).join('')}
        </div>` : ''}
        <div class="bp-modal-list" id="ic-mlist"></div>
      </div>`;

    function renderItems() {
      const list = overlay.querySelector('#ic-mlist');
      const q = (overlay.querySelector('#ic-msearch')?.value || '').toLowerCase();
      const filtered = pool.filter(i => {
        if (q) {
          const cn = translateName(i.name) || i.name;
          if (!cn.toLowerCase().includes(q) && !i.name.toLowerCase().includes(q)) return false;
        }
        if (activeCat && i.category !== activeCat) return false;
        return true;
      });
      if (!filtered.length) {
        list.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted);font-size:0.85rem">无匹配</div>';
        return;
      }
      list.innerHTML = filtered.map(i => {
        const cn = translateName(i.name) || i.name;
        const thumb = getItemImageUrl(activeGroup, i.name_en || i.name);
        return `<div class="bp-mcard" data-id="${i.id}">
          ${thumb ? `<img class="bp-mcard-thumb" src="${thumb}" alt="">` : ''}
          <div class="bp-mcard-text">
            <div class="bp-mcard-name">${cn}</div>
            <div class="bp-mcard-meta">${i.weight ? i.weight : ''}${i.category ? ' · ' + catLabel(i.category) : ''}</div>
          </div>
        </div>`;
      }).join('');
      list.querySelectorAll('.bp-mcard').forEach(el => {
        el.addEventListener('click', () => {
          const id = parseInt(el.dataset.id);
          const item = pool.find(i => i.id === id);
          if (item) {
            if (selected[activeSlot]) {
              selected[activeSlot] = item;
            } else {
              selected.push(item);
              // sort by slot
              if (activeSlot < selected.length - 1) {
                selected.splice(activeSlot, 0, item);
                selected = selected.slice(0, 4);
              }
            }
            overlay.style.display = 'none';
            updateUI();
          }
        });
      });
    }

    overlay.querySelector('#ic-mclose').addEventListener('click', () => { overlay.style.display = 'none'; });
    const icInput = overlay.querySelector('#ic-msearch');
    if (icInput) {
      let composing = false;
      icInput.addEventListener('compositionstart', () => { composing = true; });
      icInput.addEventListener('compositionend', () => { composing = false; query = icInput.value; renderItems(); });
      icInput.addEventListener('input', () => { if (composing) return; query = icInput.value; renderItems(); });
    }
    const filterDiv = overlay.querySelector('#ic-mfilter');
    if (filterDiv) {
      filterDiv.addEventListener('click', e => {
        const chip = e.target.closest('.bp-chip');
        if (!chip) return;
        filterDiv.querySelectorAll('.bp-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        activeCat = chip.dataset.cat;
        renderItems();
      });
    }
    overlay.style.display = 'flex';
    renderItems();
    setTimeout(() => overlay.querySelector('#ic-msearch')?.focus(), 100);
  }

  function renderTable() {
    const tableDiv = container.querySelector('#ic-table');
    if (selected.length < 2) { tableDiv.innerHTML = ''; return; }

    const fields = [];
    fields.push({ label: '名称', render: i => translateName(i.name) || i.name });

    if (activeGroup === 'armaments') {
      fields.push({ label: '重量', render: i => i.weight || 0 });
      fields.push({ label: '类型', render: i => catLabel(i.category) || i.category || '' });
      const sample = selected[0];
      if (sample.attack_attributes) {
        (sample.attack_attributes || []).forEach(attr => {
          fields.push({ label: ATTR_CN[attr] || attr, render: i => (i.attack || {})[attr] || 0 });
        });
      }
      if (sample.requirements) {
        Object.keys(sample.requirements || {}).forEach(stat => {
          fields.push({ label: REQ_CN[stat] || stat, render: i => (i.requirements || {})[stat] || 0 });
        });
      }
      if (sample.affinity) {
        const firstAff = Object.values(sample.affinity)[0];
        if (firstAff && firstAff.scaling) {
          Object.keys(firstAff.scaling).forEach(stat => {
            fields.push({ label: (REQ_CN[stat] || stat) + '补正', render: i => {
              const aff = i.affinity && i.affinity.Standard;
              return aff && aff.scaling ? scalingGrade(aff.scaling[stat]) : '-';
            }});
          });
        }
      }
    } else if (activeGroup === 'armor') {
      fields.push({ label: '重量', render: i => i.weight || 0 });
      fields.push({ label: '部位', render: i => catLabel(i.category) || i.category || '' });
      const sample = selected[0];
      if (sample.absorptions) {
        Object.keys(sample.absorptions || {}).forEach(k => {
          fields.push({ label: ABS_CN[k] || k, render: i => (i.absorptions[k] || 0) + '%' });
        });
      }
      if (sample.resistances) {
        Object.keys(sample.resistances || {}).forEach(k => {
          fields.push({ label: RES_CN[k] || k, render: i => i.resistances[k] || 0 });
        });
      }
    } else if (activeGroup === 'talismans') {
      fields.push({ label: '重量', render: i => i.weight || 0 });
      const sample = selected[0];
      if (sample.effects) {
        fields.push({ label: '效果', render: i => {
          const eff = i.effects && i.effects[0];
          return eff ? (ATTR_CN[eff.attribute] || eff.attribute) + (eff.value ? ' ' + eff.value : '') : '-';
        }});
      }
    } else if (activeGroup === 'spells') {
      const sample = selected[0];
      if (sample.slots_used !== undefined) fields.push({ label: '记忆格', render: i => i.slots_used });
      if (sample.fp_cost !== undefined) fields.push({ label: 'FP', render: i => i.fp_cost });
      if (sample.requirements) {
        Object.keys(sample.requirements || {}).forEach(stat => {
          fields.push({ label: REQ_CN[stat] || stat, render: i => (i.requirements || {})[stat] || 0 });
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
    container.querySelector('#ic-meta').textContent = `${selected.length} / 4 件已选择`;

    // Render cells
    const grid = container.querySelector('#ic-grid');
    const maxSlots = 4;
    const cells = [];
    for (let i = 0; i < maxSlots; i++) {
      const item = selected[i] || null;
      const cn = item ? (translateName(item.name) || item.name) : null;
      const thumb = item ? getItemImageUrl(activeGroup, item.name_en || item.name) : null;
      cells.push(`<div class="bp-cell ${item ? 'has-item' : ''}" data-icslot="${i}">
        <div class="bp-cell-label">第 ${i + 1} 件</div>
        ${item
          ? `${thumb ? `<img src="${thumb}" style="width:32px;height:32px;object-fit:contain;margin:4px auto;display:block;">` : ''}<div class="bp-cell-name">${cn}</div><div class="bp-cell-weight">${item.weight || ''}</div>`
          : '<div class="bp-cell-empty">空</div>'}
      </div>`);
    }
    grid.innerHTML = cells.join('');

    grid.querySelectorAll('.bp-cell').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.icslot);
        openModal(idx);
      });
      el.addEventListener('contextmenu', e => {
        e.preventDefault();
        const idx = parseInt(el.dataset.icslot);
        if (selected[idx]) {
          selected.splice(idx, 1);
          updateUI();
        }
      });
    });

    renderTable();
  }

  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">物品对比</div>
        <div class="page-meta" id="ic-meta">0 / 4 件已选择</div>
      </div>
      <div class="filter-bar" style="flex-wrap:wrap;gap:6px;margin-bottom:12px;">
        ${GROUPS.map(g => `<button class="filter-btn ${activeGroup === g.key ? 'active' : ''}" data-icg="${g.key}">${g.label}</button>`).join('')}
        <button class="filter-btn" id="ic-clear" style="color:var(--accent-red);display:none">✕ 清空</button>
      </div>
      <div class="bp-grid">
        <div class="bp-section">
          <div class="bp-section-header" id="ic-section-label">${GROUPS.find(g => g.key === activeGroup)?.label || ''}</div>
          <div class="bp-section-body" id="ic-grid" style="grid-template-columns:repeat(4,1fr);"></div>
        </div>
      </div>
      <div id="ic-table"></div>
    </div>`;

  container.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  container.querySelectorAll('[data-icg]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-icg]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGroup = btn.dataset.icg;
      selected = []; activeCat = '';
      container.querySelector('#ic-section-label').textContent = GROUPS.find(g => g.key === activeGroup)?.label || '';
      updateUI();
    });
  });
  container.querySelector('#ic-clear').addEventListener('click', () => { selected = []; activeCat = ''; updateUI(); });

  updateUI();
  return () => {};

  function scalingGrade(val) {
    if (val >= 1.4) return 'S';
    if (val >= 1.0) return 'A';
    if (val >= 0.6) return 'B';
    if (val >= 0.25) return 'C';
    if (val >= 0.0) return 'D';
    return '-';
  }
}
