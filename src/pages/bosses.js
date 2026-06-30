let bossesData = {};
let imageManifest = {};

async function loadBossData() {
  if (Object.keys(bossesData).length) return;
  try {
    const [bossResp, imgResp] = await Promise.all([
      fetch('./data/bosses.json'),
      fetch('./data/bosses-images.json'),
    ]);
    bossesData = await bossResp.json();
    try { imageManifest = await imgResp.json(); } catch (e) {}
  } catch (e) {
    console.warn('Boss data load failed:', e);
  }
}

function getBossImage(boss) {
  const localFile = imageManifest[boss.name];
  if (localFile) return localFile;
  if (boss.image) return boss.image;
  return null;
}

const TAG_LABEL = { '追忆': '追忆', '主线': '主线', '隐藏': '隐藏', '普通': '普通' };
const TAG_COLOR = {
  '追忆': 'background:var(--accent-gold);color:#000;',
  '主线': 'background:#8b0000;color:#fff;',
  '隐藏': 'background:#4a0080;color:#fff;',
  '普通': 'background:var(--bg-card);color:var(--text);border:1px solid var(--border-color);',
};

export async function renderBossList(container, params) {
  await loadBossData();

  let searchQuery = '';
  let filterRegion = '';
  let filterTag = '';
  const bossList = Object.values(bossesData).sort((a, b) => {
    const order = ['Limgrave', 'Weeping Peninsula', 'Liurnia of the Lakes', 'Caelid', 'Dragonbarrow',
      'Altus Plateau', 'Mount Gelmir', 'Mountaintops of the Giants', 'Consecrated Snowfield'];
    const ia = order.indexOf(a.region);
    const ib = order.indexOf(b.region);
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name);
  });
  const regionList = [...new Set(bossList.map(b => b.region))].sort();
  const tagList = ['追忆', '主线', '隐藏', '普通'];

  function render() {
    let filtered = bossList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.name_cn || '').includes(q) ||
        (b.location || '').toLowerCase().includes(q) ||
        (b.location_cn || '').includes(q) ||
        (b.region_cn || '').includes(q)
      );
    }
    if (filterRegion) {
      filtered = filtered.filter(b => b.region === filterRegion);
    }
    if (filterTag) {
      filtered = filtered.filter(b => (b.tags || []).includes(filterTag));
    }

    let html = `
      <div class="page-header">
        <div class="page-title" style="font-family:'Cinzel',serif;">Boss</div>
        <div class="page-subtitle">交界地的首领一览</div>
        <div class="page-meta">共 ${filtered.length} 个首领</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="tag-filter-btn ${!filterTag ? 'active' : ''}" data-tag="">全部</button>
        ${tagList.map(t => `<button class="tag-filter-btn ${filterTag === t ? 'active' : ''}" data-tag="${t}" style="${TAG_COLOR[t]}">${TAG_LABEL[t]}</button>`).join('')}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;align-items:center;">
        <input type="text" id="bossSearch" placeholder="搜索 Boss..." value="${searchQuery.replace(/"/g, '&quot;')}" style="flex:1;min-width:180px;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;">
        <select id="bossRegionFilter" style="padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;">
          <option value="">全部区域</option>
          ${regionList.map(r => `<option value="${r}" ${filterRegion === r ? 'selected' : ''}>${bossList.find(b => b.region === r)?.region_cn || r}</option>`).join('')}
        </select>
      </div>
      <div class="items-grid">
    `;

    for (const boss of filtered) {
      const img = getBossImage(boss);
      const name = boss.name_cn || boss.name;
      const tags = (boss.tags || []).filter(t => TAG_LABEL[t]);

      html += `
        <a href="#/bosses/${encodeURIComponent(boss.name)}" class="item-card" style="text-decoration:none;color:inherit;">
          <div class="item-card-header">
            ${img ? `<img src="${img}" alt="${name}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin-right:12px;">` : `<div style="width:60px;height:60px;border-radius:6px;margin-right:12px;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:var(--text-muted);">?</div>`}
            <div style="flex:1;min-width:0;">
              <div class="item-card-name">${name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${boss.region_cn || boss.region}${boss.location_cn ? ' · ' + boss.location_cn : boss.location ? ' · ' + boss.location : ''}</div>
              <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">
                ${boss.is_dlc ? '<span class="item-card-tag" style="font-size:0.65rem;padding:1px 6px;background:#2a5a3a;color:#fff;">DLC</span>' : ''}
                ${tags.map(t => `<span class="item-card-tag" style="font-size:0.65rem;padding:1px 6px;${TAG_COLOR[t]}">${t}</span>`).join('')}
              </div>
            </div>
          </div>
        </a>
      `;
    }

    html += '</div>';
    if (!filtered.length) {
      html = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">未找到匹配的 Boss</div></div>';
    }

    // 保存输入框焦点和光标位置，防止每次 render() 丢失焦点
    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    container.innerHTML = html;

    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) {
        el.focus();
        if (typeof activeSelStart === 'number') {
          el.setSelectionRange(activeSelStart, activeSelEnd);
        }
      }
    }

    const bsInput = document.getElementById('bossSearch');
    if (bsInput) {
      let composing = false;
      bsInput.addEventListener('compositionstart', () => { composing = true; });
      bsInput.addEventListener('compositionend', () => { composing = false; searchQuery = bsInput.value; render(); });
      bsInput.addEventListener('input', e => { if (composing) return; searchQuery = e.target.value; render(); });
    }
    document.getElementById('bossRegionFilter')?.addEventListener('change', e => { filterRegion = e.target.value; render(); });
    container.querySelectorAll('.tag-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterTag = btn.dataset.tag;
        render();
      });
    });
  }

  render();
  return () => {};
}
