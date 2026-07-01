import { translateName } from '../store.js';

let ammoData = [];

async function loadAmmo() {
  if (ammoData.length) return;
  try {
    const resp = await fetch('./data/ammo.json');
    const raw = await resp.json();
    ammoData = Object.values(raw);
  } catch (e) {
    console.warn('Ammo data load failed:', e);
  }
}

const CAT_CN = { Arrow: '箭', Greatarrow: '大箭', Bolt: '弩箭', Greatbolt: '大弩箭' };
const CAT_ORDER = ['Arrow', 'Greatarrow', 'Bolt', 'Greatbolt'];

const DMG_TYPE_CN = {
  physical: '物理', magic: '魔法', fire: '火', lightning: '雷', holy: '圣', stamina: '精力'
};
const DMG_COLORS = {
  physical: '#d4b84c', magic: '#6ba6d9', fire: '#d96b4a',
  lightning: '#8ad96b', holy: '#d9c46b', stamina: '#8a847a'
};

const EFFECT_TYPE_CN = {
  poison: '中毒', scarlet_rot: '猩红腐败', bleed: '出血', frost: '冰冻',
  sleep: '睡眠', madness: '发狂', death: '即死'
};

function formatEffects(d) {
  const parts = [];
  for (const [k, v] of Object.entries(d)) {
    const name = EFFECT_TYPE_CN[k] || k;
    parts.push(v ? `${name}(${v})` : name);
  }
  return parts.join(' | ');
}

function renderDamageIcons(damage) {
  if (!damage) return '';
  const types = Object.keys(damage).filter(k => k !== 'stamina');
  return types.map(t => {
    const v = damage[t];
    if (!v) return '';
    return `<span style="font-size:0.75rem;color:${DMG_COLORS[t] || 'var(--text)'};font-weight:600;">${DMG_TYPE_CN[t]||t} ${v}</span>`;
  }).filter(Boolean).join(' · ');
}

export async function renderAmmo(container, params) {
  let detached = false;
  let searchQuery = '';
  let filterCat = '';

  function render() {
    const q = searchQuery.toLowerCase();

    let filtered = ammoData;
    if (filterCat) filtered = filtered.filter(a => a.category === filterCat);
    if (q) filtered = filtered.filter(a =>
      (translateName(a.name) || a.name).toLowerCase().includes(q)
    );

    const cats = [];
    const catSet = new Set();
    for (const a of ammoData) {
      if (!catSet.has(a.category)) { catSet.add(a.category); cats.push(a.category); }
    }
    cats.sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b));

    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-title" style="font-family:'Cinzel',serif;">弹药图鉴</div>
        <div class="page-subtitle">弓箭 · 弩箭 · 大箭 · 大弩箭</div>
        <div class="page-meta">${ammoData.length} 种弹药</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="tag-filter-btn ${!filterCat ? 'active' : ''}" data-acat="">全部</button>
        ${cats.map(c => `
          <button class="tag-filter-btn ${filterCat === c ? 'active' : ''}" data-acat="${c}">${CAT_CN[c]||c} (${ammoData.filter(a=>a.category===c).length})</button>
        `).join('')}
      </div>
      <input type="text" id="ammoSearch" placeholder="搜索弹药名称..." value="${searchQuery.replace(/"/g, '&quot;')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;margin-bottom:16px;">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;">
        ${filtered.map(a => {
          const cn = translateName(a.name) || a.name;
          const damage = a.damage || {};
          const effects = a.status_effects || {};
          const hasEffects = Object.keys(effects).length > 0;
          return `
            <div class="ammo-card" data-aname="${a.name}" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:14px;cursor:pointer;transition:all 0.15s;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                <div style="font-weight:600;font-size:0.85rem;color:var(--text);line-height:1.3;flex:1;">${cn}</div>
                <span style="font-size:0.65rem;padding:2px 8px;border-radius:8px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-muted);white-space:nowrap;margin-left:8px;">${CAT_CN[a.category]||a.category}</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:${hasEffects?'6px':'0'};">
                ${renderDamageIcons(damage)}
              </div>
              ${hasEffects ? `<div style="font-size:0.7rem;color:var(--accent-red);">${formatEffects(effects)}</div>` : ''}
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;">${a.price_sold ? a.price_sold+' 卢恩' : ''}</div>
            </div>`;
        }).join('')}
      </div>
      ${!filtered.length ? '<div class="empty-state"><div class="empty-state-icon">🏹</div><div class="empty-state-text">无匹配弹药</div></div>' : ''}
    `;

    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) { el.focus(); if (typeof activeSelStart === 'number') el.setSelectionRange(activeSelStart, activeSelEnd); }
    }

    const asInput = document.getElementById('ammoSearch');
    if (asInput) {
      let composing = false;
      asInput.addEventListener('compositionstart', () => { composing = true; });
      asInput.addEventListener('compositionend', () => { composing = false; searchQuery = asInput.value; render(); });
      asInput.addEventListener('input', e => { if (composing) return; searchQuery = e.target.value; render(); });
    }
    container.querySelectorAll('[data-acat]').forEach(btn => {
      btn.addEventListener('click', () => {
        filterCat = btn.dataset.acat;
        render();
      });
    });
    container.querySelectorAll('.ammo-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.aname;
        showDetail(name);
      });
    });
  }

  function showDetail(name) {
    const item = ammoData.find(a => a.name === name);
    if (!item) return;
    const cn = translateName(item.name) || item.name;
    const damage = item.damage || {};
    const effects = item.status_effects || {};
    const hasEffects = Object.keys(effects).length > 0;

    const overlay = document.createElement('div');
    overlay.className = 'bp-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:85vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-size:1.1rem;font-weight:700;color:var(--accent-gold);">${cn}</div>
          <span class="bp-modal-close" style="font-size:1.3rem;cursor:pointer;color:var(--text-muted);line-height:1;">✕</span>
        </div>
        <div style="margin-bottom:12px;">
          <span style="font-size:0.7rem;padding:2px 10px;border-radius:8px;background:var(--bg-tertiary);border:1px solid var(--border-color);color:var(--text-muted);">${CAT_CN[item.category]||item.category}</span>
          <span style="font-size:0.7rem;color:var(--text-muted);margin-left:8px;">ID: ${item.id}</span>
        </div>
        ${(item.description||[]).filter(Boolean).length ? `
        <div class="stat-block" style="margin-bottom:12px;">
          <div class="stat-block-title">描述</div>
          <div class="stat-block-content" style="flex-direction:column;">
            ${item.description.filter(Boolean).map(d => `<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:4px;">${d}</div>`).join('')}
          </div>
        </div>` : ''}
        ${Object.keys(damage).length ? `
        <div class="stat-block" style="margin-bottom:12px;">
          <div class="stat-block-title">伤害</div>
          <div class="stat-block-content" style="flex-direction:column;gap:4px;">
            ${Object.entries(damage).filter(([k]) => k !== 'stamina').map(([k, v]) => `
              <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
                <span style="color:${DMG_COLORS[k]||'var(--text)'};">${DMG_TYPE_CN[k]||k}</span>
                <span style="font-weight:600;">${v}</span>
              </div>`).join('')}
            ${damage.stamina ? `<div style="display:flex;justify-content:space-between;font-size:0.85rem;border-top:1px solid var(--border-color);padding-top:4px;margin-top:2px;"><span style="color:${DMG_COLORS.stamina};">${DMG_TYPE_CN.stamina}</span><span style="font-weight:600;">${damage.stamina}</span></div>` : ''}
          </div>
        </div>` : ''}
        ${hasEffects ? `
        <div class="stat-block" style="margin-bottom:12px;">
          <div class="stat-block-title">异常状态</div>
          <div class="stat-block-content" style="flex-direction:column;gap:4px;">
            ${Object.entries(effects).map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:0.85rem;"><span style="color:var(--accent-red);">${EFFECT_TYPE_CN[k]||k}</span><span style="font-weight:600;">${v}</span></div>`).join('')}
          </div>
        </div>` : ''}
        ${item.effects && item.effects.length ? `
        <div class="stat-block" style="margin-bottom:12px;">
          <div class="stat-block-title">特效</div>
          <div class="stat-block-content" style="flex-direction:column;gap:4px;">
            ${item.effects.map(e => `<div style="font-size:0.8rem;color:var(--text-secondary);">${e}</div>`).join('')}
          </div>
        </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem;color:var(--text-muted);margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color);">
          <div>价格: ${item.price_sold || 0} 卢恩</div>
          <div>持有上限: ${item.max_held || '-'}</div>
          <div>存放上限: ${item.max_stored || '-'}</div>
          <div>稀有度: ${item.rarity || '-'}</div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.bp-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">正在加载...</div></div></div>';
  loadAmmo().then(() => {
    if (detached) return;
    render();
  }, () => {
    if (detached) return;
    container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">数据加载失败</div></div></div>';
  });
  return () => { detached = true; };
}
