import { translateName } from '../store.js';

let materials = [];
let allItems = [];
let toolsMap = {};
let cookbookData = {};

async function loadAll() {
  if (materials.length) return;
  try {
    const [matResp, toolResp, cbResp] = await Promise.all([
      fetch('./data/crafting-materials.json'),
      fetch('./data/tools.json'),
      fetch('./data/cookbook-recipes.json'),
    ]);
    const matData = await matResp.json();
    const toolData = await toolResp.json();
    materials = Object.values(matData).filter(m => m.products && m.products.length);
    allItems = [...Object.values(toolData), ...Object.values(matData)];
    for (const t of Object.values(toolData)) {
      toolsMap[t.name] = t;
    }
    for (const m of Object.values(matData)) {
      toolsMap[m.name] = m;
    }
    try { cookbookData = await cbResp.json(); } catch (e) {}
  } catch (e) {
    console.warn('Recipes load failed:', e);
  }
}

export async function renderRecipes(container, params) {
  await loadAll();

  let searchQuery = '';
  let viewMode = 'byMaterial'; // 'byMaterial' | 'byProduct' | 'byCookbook'

  function render() {
    const q = searchQuery.toLowerCase();

    let html = `
      <div class="page-header">
        <div class="page-title" style="font-family:'Cinzel',serif;">制作配方</div>
        <div class="page-subtitle">制作配方一览</div>
        <div class="page-meta">${materials.length} 种材料 · ${Object.keys(cookbookData).length} 本制作笔记</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="tag-filter-btn ${viewMode === 'byMaterial' ? 'active' : ''}" data-view="byMaterial">按材料</button>
        <button class="tag-filter-btn ${viewMode === 'byProduct' ? 'active' : ''}" data-view="byProduct">按成品</button>
        <button class="tag-filter-btn ${viewMode === 'byCookbook' ? 'active' : ''}" data-view="byCookbook">按制作笔记</button>
      </div>
      <input type="text" id="recipeSearch" placeholder="搜索材料、成品或制作笔记..." value="${searchQuery.replace(/"/g, '&quot;')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;margin-bottom:16px;">
    `;

    if (viewMode === 'byCookbook') {
      let cbkEntries = Object.entries(cookbookData);
      if (q) {
        cbkEntries = cbkEntries.filter(([key, cbk]) =>
          (translateName(key) || key).toLowerCase().includes(q) ||
          cbk.recipes.some(r => (translateName(r) || r).toLowerCase().includes(q))
        );
      }

      html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
      for (const [cbKey, cbk] of cbkEntries) {
        const cbName = translateName(cbKey) || cbKey;
        const filteredRecipes = q
          ? cbk.recipes.filter(r => (translateName(r) || r).toLowerCase().includes(q))
          : cbk.recipes;

        html += `
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:12px;">
            <div style="font-weight:600;font-size:0.9rem;margin-bottom:8px;color:var(--accent-gold);">${cbName}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${filteredRecipes.map(r => `<span class="item-card-tag" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text);">${translateName(r) || r}</span>`).join('')}
            </div>
            ${cbk.recipes.length !== filteredRecipes.length ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">显示 ${filteredRecipes.length}/${cbk.recipes.length} 个配方</div>` : ''}
          </div>`;
      }
      html += `</div>`;

      if (!cbkEntries.length) {
        html += '<div class="empty-state"><div class="empty-state-icon">📖</div><div class="empty-state-text">无匹配制作笔记</div></div>';
      }
    } else if (viewMode === 'byMaterial') {
      let filtered = materials;
      if (q) {
        filtered = filtered.filter(m =>
          (translateName(m.name) || m.name || '').toLowerCase().includes(q) ||
          (m.products || []).some(p => (translateName(p) || p).toLowerCase().includes(q))
        );
      }

      html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
      for (const mat of filtered) {
        const name = translateName(mat.name) || mat.name;
        const products = (mat.products || []).map(p => {
          const item = toolsMap[p];
          return translateName(p) || item?.name_cn || p;
        });

        html += `
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:12px;">
            <div style="font-weight:600;font-size:0.85rem;margin-bottom:6px;">${name}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${products.map(p => `<span class="item-card-tag" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text);">${p}</span>`).join('')}
            </div>
          </div>
        `;
      }
      html += `</div>`;

      if (!filtered.length) {
        html += '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">无匹配材料</div></div>';
      }
    } else {
      // byProduct: build reverse map
      const productMap = {};
      for (const mat of materials) {
        for (const prod of (mat.products || [])) {
          if (!productMap[prod]) productMap[prod] = [];
          productMap[prod].push(mat.name);
        }
      }
      let products = Object.keys(productMap).sort();
      if (q) {
        products = products.filter(p => p.toLowerCase().includes(q) || productMap[p].some(m => m.toLowerCase().includes(q)));
      }

      html += `<div style="display:flex;flex-direction:column;gap:8px;">`;
      for (const prod of products) {
        const item = toolsMap[prod];
        const name = translateName(prod) || item?.name_cn || prod;
        const mats = productMap[prod].map(m => translateName(m) || toolsMap[m]?.name_cn || m);

        html += `
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:12px;">
            <div style="font-weight:600;font-size:0.85rem;margin-bottom:6px;">${name}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              <span style="font-size:0.7rem;color:var(--text-muted);margin-right:4px;">需要:</span>
              ${mats.map(m => `<span class="item-card-tag" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text);">${m}</span>`).join('')}
            </div>
          </div>
        `;
      }
      html += `</div>`;

      if (!products.length) {
        html += '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">无匹配成品</div></div>';
      }
    }

    // Save focus before DOM rebuild
    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    container.innerHTML = html;

    // Restore focus
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) {
        el.focus();
        if (typeof activeSelStart === 'number') {
          el.setSelectionRange(activeSelStart, activeSelEnd);
        }
      }
    }

    document.getElementById('recipeSearch')?.addEventListener('input', e => {
      searchQuery = e.target.value;
      render();
    });
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        render();
      });
    });
  }

  render();
  return () => {};
}
