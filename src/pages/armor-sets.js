import { getData, getArmorSets, translateName, getItemImageUrl } from '../store.js';

const SLOT_CN = { Head: '头部', Body: '身体', Arms: '手臂', Legs: '腿部' };
const SLOT_ORDER = ['Head', 'Body', 'Arms', 'Legs'];

function getPrimaryPieces(pieces) {
  const bySlot = {};
  for (const p of pieces) {
    const slot = p.category;
    if (!bySlot[slot]) bySlot[slot] = [];
    bySlot[slot].push(p);
  }
  const result = [];
  for (const slot of SLOT_ORDER) {
    const slotPieces = bySlot[slot];
    if (!slotPieces) continue;
    const normal = slotPieces.find(p => !p.name.endsWith(' (Altered)'));
    result.push(normal || slotPieces[0]);
  }
  return result;
}

function getFilteredArmorSets(scope) {
  const all = getArmorSets();
  if (scope === '全部') return all;
  return all.filter(set =>
    set.pieces.some(p => scope === 'DLC' ? p.is_dlc : !p.is_dlc)
  ).map(set => ({
    ...set,
    pieces: set.pieces.filter(p => scope === 'DLC' ? p.is_dlc : !p.is_dlc),
  }));
}

export function renderArmorSetsList(container, params) {
  let activeScope = (params && params.scope) ? params.scope : (params && params.dlc === 'true') ? 'DLC' : '全部';
  const allArmor = getData('armor');
  const hasDlc = allArmor.some(i => i.is_dlc);

  function render() {
    const sets = getFilteredArmorSets(activeScope);

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title">防具套装</div>
        <div class="page-meta"><span>共 ${sets.length} 套</span></div>
      </div>
      ${hasDlc ? `
      <div class="filter-bar scope-bar" id="scope-bar">
        <button class="scope-btn filter-btn ${activeScope === '全部' ? 'active' : ''}" data-scope="全部">全部</button>
        <button class="scope-btn filter-btn ${activeScope === '本体' ? 'active' : ''}" data-scope="本体">本体</button>
        <button class="scope-btn filter-btn ${activeScope === 'DLC' ? 'active' : ''}" data-scope="DLC">DLC</button>
      </div>` : ''}
      <div class="items-grid">
        ${sets.map(set => `
        <div class="item-card" data-set="${set.key}">
          <div class="item-card-header">
            <div class="item-card-name">${set.name_cn || set.key}</div>
            <div class="item-card-category">${set.pieces.length} 件${set.hasAllSlots ? ' · 四件套' : ''}</div>
          </div>
          <div class="item-card-body">
            <div style="font-size:0.8rem;color:var(--text-secondary);display:flex;flex-wrap:wrap;gap:4px">
              ${getPrimaryPieces(set.pieces).map(p => `<span style="background:var(--bg-input);padding:2px 8px;border-radius:4px;font-size:0.7rem">${SLOT_CN[p.category] || p.category}: ${p.name}</span>`).join('')}
            </div>
          </div>
          <div class="item-card-footer" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <span style="font-size:0.6rem;color:var(--text-muted)">总重: ${getPrimaryPieces(set.pieces).reduce((s, p) => s + (p.weight || 0), 0).toFixed(1)}</span>
          </div>
        </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', () => {
        const setKey = card.dataset.set;
        window.location.hash = `#/armor-sets/${encodeURIComponent(setKey)}`;
      });
    });

    const scopeBar = container.querySelector('#scope-bar');
    if (scopeBar) {
      scopeBar.querySelectorAll('.scope-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          scopeBar.querySelectorAll('.scope-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeScope = btn.dataset.scope;
          const hash = window.location.hash.split('?')[0];
          window.location.hash = `${hash}?scope=${activeScope}`;
          render();
        });
      });
    }
  }

  render();
  return () => {};
}

export function renderArmorSetDetail(container, params) {
  const setKey = decodeURIComponent(params.id || '');
  const sets = getArmorSets();
  const set = sets.find(s => s.key === setKey);
  if (!set) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-text">未找到套装</div></div>`;
    return () => {};
  }

  container.innerHTML = `
    <div class="detail-view">
      <a class="detail-back" href="#/armor-sets">← 返回套装列表</a>
      <div class="page-header" style="border:none;padding:16px 24px 0">
        <div class="page-title">${set.name_cn || set.key}</div>
        <div class="page-meta"><span>${getPrimaryPieces(set.pieces).length} 件装备</span></div>
      </div>
      <div style="padding:0 24px">
        <div style="display:flex;flex-direction:column;gap:8px;max-width:600px">
          ${getPrimaryPieces(set.pieces).map(piece => {
            const thumb = getItemImageUrl('armor', piece.name_en || piece.name);
            return `
            <div class="item-card" data-key="armor" data-id="${piece.id}" data-setkey="${setKey}" style="cursor:pointer">
              <div class="item-card-header">
                ${thumb ? `<img class="item-card-weapon-thumb" src="${thumb}" alt="" loading="lazy">` : ''}
                <div class="item-card-name">${piece.name}</div>
                <div class="item-card-category">${SLOT_CN[piece.category]}</div>
              </div>
              <div class="item-card-body">
                ${piece.weight !== undefined ? `<span class="item-card-stat"><span class="item-card-stat-label">重</span> <span class="item-card-stat-value">${piece.weight}</span></span>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const encodedBack = encodeURIComponent('/armor-sets/' + setKey);
      window.location.hash = `#/armor/${id}?back=${encodedBack}`;
    });
  });

  return () => {};
}
