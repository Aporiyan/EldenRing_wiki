import { getData } from '../store.js';

let bossesData = {};
let imageManifest = {};
let reverseNameMap = null;
let bossItemCache = [];

function buildReverseMap() {
  if (reverseNameMap) return reverseNameMap;
  // Build Chinese → English from cached items (all data loaded by store.js)
  const map = {};
  const cats = ['armaments','armor','talismans','spells','tools','keys','crafting-materials','bolstering-materials','spirit-ashes','ashes-of-war'];
  for (const cat of cats) {
    const items = getData(cat);
    for (const item of items) {
      if (item.name_cn && item.name_en) {
        map[item.name_cn] = { key: cat, item };
      }
    }
  }
  reverseNameMap = map;
  return map;
}

const DROP_ROUTES = {
  armaments: '#/weapons/',
  armor: '#/armor/',
  talismans: '#/talismans/',
  spells: '#/spells/',
  tools: '#/items/',
  keys: '#/items/',
  'crafting-materials': '#/items/',
  'bolstering-materials': '#/items/',
  'spirit-ashes': '#/spirits/',
  'ashes-of-war': '#/ashes/',
};

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
        ${boss.is_dlc ? '<span class="item-card-tag" style="background:#2a5a3a;color:#fff;">DLC</span>' : ''}
        ${(boss.tags || []).map(t => {
          const colors = { '追忆': 'background:var(--accent-gold);color:#000;', '主线': 'background:#8b0000;color:#fff;', '隐藏': 'background:#4a0080;color:#fff;', '普通': 'background:var(--bg-card);color:var(--text);border:1px solid var(--border-color);' };
          return `<span class="item-card-tag" style="${colors[t] || colors['普通']}">${t}</span>`;
        }).join('')}
      </div>
      ${desc ? `<p style="color:var(--text-secondary);line-height:1.6;margin-bottom:20px;">${desc}</p>` : ''}

      ${boss.weaknesses ? (() => {
        const parts = boss.weaknesses.split('|').map(s => s.trim()).filter(Boolean);
        if (!parts.length) return '';
        const colors = { '物理': '#d47a4a', '属性': '#7a8fc9', '异常': '#6a9a4a' };
        return `
          <div class="stat-block" style="margin-top:16px;">
            <div class="stat-block-title">抗性 / 弱点</div>
            <div class="stat-block-content" style="flex-direction:column;">
              ${parts.map(p => {
                const colon = p.indexOf(':');
                if (colon < 0) return '';
                const label = p.slice(0, colon);
                const val = p.slice(colon + 1);
                return `<div class="stat-row"><span class="stat-label" style="color:${colors[label] || 'var(--text-muted)'};font-weight:600;">${label}</span><span class="stat-value" style="font-size:0.85rem;">${val}</span></div>`;
              }).join('')}
            </div>
          </div>`;
      })() : ''}
  `;

  if (boss.drops && boss.drops.length) {
    const revMap = buildReverseMap();
    html += `
      <div style="margin-top:24px;">
        <h3 style="font-size:1rem;margin-bottom:8px;color:var(--accent-gold);">掉落物</h3>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${boss.drops.map(d => {
            const matched = revMap[d];
            if (matched) {
              const route = DROP_ROUTES[matched.key] || '#/items/';
              return `<a href="${route}${matched.item.id}" class="item-card-tag" style="background:var(--bg-card);border:1px solid var(--accent-gold);color:var(--accent-gold);text-decoration:none;cursor:pointer;display:inline-block;">${d}</a>`;
            }
            return `<span class="item-card-tag" style="background:var(--bg-card);border:1px solid var(--border-color);color:var(--text);">${d}</span>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
  return () => {};
}
