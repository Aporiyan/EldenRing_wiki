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

export async function renderBossList(container, params) {
  await loadBossData();

  let searchQuery = '';
  let filterRegion = '';
  const bossList = Object.values(bossesData).sort((a, b) => {
    const order = ['Limgrave', 'Weeping Peninsula', 'Liurnia of the Lakes', 'Caelid', 'Dragonbarrow',
      'Altus Plateau', 'Mount Gelmir', 'Mountaintops of the Giants', 'Consecrated Snowfield'];
    const ia = order.indexOf(a.region);
    const ib = order.indexOf(b.region);
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name);
  });
  const regionList = [...new Set(bossList.map(b => b.region))].sort();

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

    let html = `
      <div class="page-header">
        <div class="page-title" style="font-family:'Cinzel',serif;">Boss</div>
        <div class="page-subtitle">交界地的首领一览</div>
        <div class="page-meta">共 ${filtered.length} 个首领</div>
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
      
      html += `
        <a href="#/bosses/${encodeURIComponent(boss.name)}" class="item-card" style="text-decoration:none;color:inherit;">
          <div class="item-card-header">
            ${img ? `<img src="${img}" alt="${name}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin-right:12px;">` : `<div style="width:60px;height:60px;border-radius:6px;margin-right:12px;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:var(--text-muted);">?</div>`}
            <div style="flex:1;min-width:0;">
              <div class="item-card-name">${name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${boss.region_cn || boss.region}${boss.location_cn ? ' · ' + boss.location_cn : boss.location ? ' · ' + boss.location : ''}</div>
            </div>
          </div>
        </a>
      `;
    }

    html += '</div>';
    if (!filtered.length) {
      html = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">未找到匹配的 Boss</div></div>';
    }

    container.innerHTML = html;

    document.getElementById('bossSearch')?.addEventListener('input', e => { searchQuery = e.target.value; render(); });
    document.getElementById('bossRegionFilter')?.addEventListener('change', e => { filterRegion = e.target.value; render(); });
  }

  render();
  return () => {};
}
