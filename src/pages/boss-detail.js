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

export async function renderBossDetail(container, params) {
  await loadBossData();

  const bossId = decodeURIComponent(params.id);
  const boss = bossesData[bossId];

  if (!boss) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">未找到该 Boss</div></div><a href="#/bosses" style="display:inline-block;margin-top:16px;color:var(--accent-gold);">← 返回 Boss 列表</a>';
    return () => {};
  }

  function getImg() {
    const localFile = imageManifest[boss.name];
    if (localFile) return localFile;
    if (boss.image) return boss.image;
    return null;
  }

  const img = getImg();
  const name = boss.name_cn || boss.name;
  const region = boss.region_cn || boss.region;
  const location = boss.location_cn || boss.location;
  const desc = boss.description_cn || boss.description;

  let html = `
    <div class="detail-view">
      <a href="#/bosses" class="detail-back">← 返回 Boss 列表</a>
      <div class="detail-header">
        ${img ? `<img src="${img}" alt="${name}" style="max-width:300px;width:100%;border-radius:8px;margin-bottom:16px;">` : ''}
        <h1 class="detail-title">${name}</h1>
        ${boss.name_cn ? `<div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:8px;">${boss.name}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        <span class="item-card-tag" style="background:var(--accent-gold);color:#000;">${region}</span>
        ${location ? `<span class="item-card-tag" style="background:var(--bg-card);color:var(--text);border:1px solid var(--border-color);">${location}</span>` : ''}
        ${boss.healthPoints && boss.healthPoints !== '未知' ? `<span class="item-card-tag" style="background:var(--accent-red);color:#fff;">HP ${boss.healthPoints}</span>` : ''}
        ${(boss.tags || []).map(t => {
          const colors = { '追忆': 'background:var(--accent-gold);color:#000;', '主线': 'background:#8b0000;color:#fff;', '隐藏': 'background:#4a0080;color:#fff;', '普通': 'background:var(--bg-card);color:var(--text);border:1px solid var(--border-color);' };
          return `<span class="item-card-tag" style="${colors[t] || colors['普通']}">${t}</span>`;
        }).join('')}
      </div>
      ${desc ? `<p style="color:var(--text-secondary);line-height:1.6;margin-bottom:20px;">${desc}</p>` : ''}
  `;

  if (boss.drops && boss.drops.length) {
    html += `
      <div style="margin-top:24px;">
        <h3 style="font-size:1rem;margin-bottom:8px;color:var(--accent-gold);">掉落物</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${boss.drops.map(d => `<span class="item-card-tag" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text);">${d}</span>`).join('')}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
  return () => {};
}
