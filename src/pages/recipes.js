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
  let detached = false;
  let searchQuery = '';
  let viewMode = 'byMaterial'; // 'byMaterial' | 'byProduct' | 'byCookbook'
  let activeGroup = '';

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
      // Parse full-width numbers: ０→0, １→1, etc.
      const fwDigit = ch => '０１２３４５６７８９'.indexOf(ch);
      const parseNum = cn => {
        const m = cn.match(/【(.+?)】/);
        if (!m) return 99;
        let n = 0;
        for (const ch of m[1]) {
          const d = fwDigit(ch);
          if (d >= 0) n = n * 10 + d;
        }
        return n;
      };
      const parsePrefix = cn => {
        const m = cn.match(/^(.+?)的制作笔记/);
        return m ? m[1] : cn;
      };

      // Build grouped data sorted by number
      let groups = {};
      for (const [key, cbk] of Object.entries(cookbookData)) {
        const cn = cbk.name_cn || translateName(key) || key;
        const prefix = parsePrefix(cn);
        const num = parseNum(cn);
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push({ key, cbk, cn, num });
      }
      for (const p of Object.keys(groups)) {
        groups[p].sort((a, b) => a.num - b.num);
      }

      const groupList = Object.keys(groups).sort();

      // Filter by search and group
      let filteredGroups = {};
      for (const g of groupList) {
        const entries = groups[g];
        if (activeGroup && g !== activeGroup) continue;
        const matched = entries.filter(e =>
          !q || e.cn.toLowerCase().includes(q) ||
          e.cbk.recipes.some(r => (translateName(r) || r).toLowerCase().includes(q))
        );
        if (matched.length) filteredGroups[g] = matched;
      }

      // Group filter chips
      if (!q) {
        html += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">`;
        html += `<button class="bp-chip ${!activeGroup ? 'on' : ''}" data-cbg="">全部</button>`;
        for (const g of groupList) {
          html += `<button class="bp-chip ${activeGroup === g ? 'on' : ''}" data-cbg="${g}">${g} (${groups[g].length})</button>`;
        }
        html += `</div>`;
      }

      // Card grid
      let hasAny = false;
      html += `<div style="display:flex;flex-direction:column;gap:24px;">`;
      for (const [prefix, entries] of Object.entries(filteredGroups)) {
        html += `<div style="font-weight:700;font-size:1rem;color:var(--accent-gold);padding:4px 0 2px 0;">${prefix}</div>`;
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;">`;
        for (const { cn, cbk } of entries) {
          hasAny = true;
          const filteredRecipes = q
            ? cbk.recipes.filter(r => (translateName(r) || r).toLowerCase().includes(q))
            : cbk.recipes;
          html += `
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:14px;transition:box-shadow 0.15s;display:flex;flex-direction:column;">
              <div style="font-weight:600;font-size:0.9rem;margin-bottom:10px;color:var(--text);line-height:1.3;">${cn}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;">
                ${filteredRecipes.map(r => `<span class="item-card-tag" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text);font-size:0.78rem;padding:3px 8px;">${translateName(r) || r}</span>`).join('')}
              </div>
            </div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;

      if (!hasAny) {
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

    const searchInput = document.getElementById('recipeSearch');
    if (searchInput) {
      let composing = false;
      searchInput.addEventListener('compositionstart', () => { composing = true; });
      searchInput.addEventListener('compositionend', () => {
        composing = false;
        searchQuery = searchInput.value;
        render();
      });
      searchInput.addEventListener('input', e => {
        if (composing) return;
        searchQuery = e.target.value;
        render();
      });
    }
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        render();
      });
    });
    container.querySelectorAll('[data-cbg]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeGroup = btn.dataset.cbg;
        render();
      });
    });
  }

  container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">正在加载...</div></div></div>';
  loadAll().then(() => {
    if (detached) return;
    render();
  }, () => {
    if (detached) return;
    container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">数据加载失败</div></div></div>';
  });
  return () => { detached = true; };
}
