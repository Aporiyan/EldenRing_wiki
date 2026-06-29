let npcData = [];
let questData = {};
let nameMap = {};
let imageManifest = {};

async function loadNpcData() {
  if (npcData.length) return;
  try {
    const [npcResp, questResp, mapResp, imgResp] = await Promise.all([
      fetch('./data/npcs.json'),
      fetch('./data/npc-quests.json'),
      fetch('./data/name_map.json'),
      fetch('./data/npc-images.json'),
    ]);
    npcData = await npcResp.json();
    try { questData = await questResp.json(); } catch (e) {}
    try { nameMap = await mapResp.json(); } catch (e) {}
    try { imageManifest = await imgResp.json(); } catch (e) {}
  } catch (e) {
    console.warn('NPC data load failed:', e);
  }
}

const ZONE_CN = {
  LIMGRAVE: '宁姆格福', CAELID: '盖利德', LIURNIA: '利耶尼亚',
  MOUNT_GELMIR: '格密尔火山', MOUNTAINTOP: '巨人山顶', FARUM_AZULA: '法姆·亚兹拉',
  ALTUS: '亚坛高原', ALTUS_PLATEAU: '亚坛高原',
  CAPITAL: '王城罗德尔', LEYNDELL: '王城罗德尔', LEYNDELL_ASHEN: '灰灭王城',
  DEEPROOT: '深根底层', CONSECRATED_SNOWFIELD: '化圣雪原', HALIGTREE: '圣树',
  AINSEL_RIVER: '安瑟尔河', LAKE_OF_ROT: '腐败湖', MOHGWYN_PALACE: '蒙格温王朝',
  NOKRON: '诺克隆恩', RAYA_LUCARIA: '雷亚卢卡利亚', SIOFRA_RIVER: '希芙拉河',
  ROUNDTABLE_HOLD: '圆桌厅堂', WEEPING_PENINSULA: '啜泣半岛', STORMVEIL: '史东薇尔城',
  MULTIPLE: '多个地点', LANDS_BETWEEN: '交界地', DRAGONBARROW: '龙墓',
  FORBIDDEN_LANDS: '禁域', CAPITAL_OUTSKIRTS: '王城外围',
  VOLCANO_MANOR: '火山官邸',
  // DLC 幽影地
  GRAVESITE_PLAIN: '墓地平原', SCADU_ALTUS: '幽影亚坛', BELURAT: '塔之镇贝瑞特',
  CASTLE_ENSIS: '恩希斯城', MOORTH: '穆斯废墟', MANUS_METYR: '马努斯美缇尔大教堂',
  SHADOW_KEEP: '幽影城', STONE_COFFIN: '石棺裂谷', ENIR_ILIM: '艾尼尔伊利姆',
  JAGGED_PEAK: '尖刺山', CERULEAN_COAST: '青蓝海岸',
  DLC_MULTIPLE: '幽影地多处',
};

function zoneCn(zone) { return ZONE_CN[zone] || zone; }

function findNpcByName(name) { return npcData.find(n => n.name === name) || null; }

function findQuest(npcName) {
  const clean = npcName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const q of Object.values(questData)) {
    const nameClean = (q.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (nameClean.includes(clean) || clean.includes(nameClean)) return q;
  }
  return null;
}

export async function renderNpcDetail(container, params) {
  await loadNpcData();

  const npcName = decodeURIComponent(params.id);
  const npc = findNpcByName(npcName);
  const quest = findQuest(npcName);
  let showEn = false;

  if (!npc) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">未找到该 NPC</div></div><a href="#/npcs" style="display:inline-block;margin-top:16px;color:var(--accent-gold)">← 返回 NPC 列表</a>';
    return () => {};
  }

  function getImg() {
    const localFile = imageManifest[npc.name];
    if (localFile) return `./images/npcs/${localFile}`;
    if (npc.image && !npc.image.includes('missing')) return npc.image;
    return null;
  }

  function getTitle() { return showEn ? npc.name : (nameMap[npc.name] || npc.name); }

  function render() {
    const img = getImg();
    const title = getTitle();

    container.innerHTML = `
      <div class="detail-view">
        <a class="detail-back" href="#/npcs">← NPC 列表</a>
        <div style="display:flex;align-items:center;gap:12px;margin:12px 0">
          <div id="npc-detail-toggle" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;font-size:0.8rem">
            <span style="color:${!showEn ? 'var(--accent-gold)' : 'var(--text-muted)'};font-weight:${!showEn ? '600' : '400'}">中文</span>
            <div class="info-toggle-track" style="background:${showEn ? 'var(--accent-gold)' : 'var(--bg-input)'};border-color:${showEn ? 'var(--accent-gold)' : 'var(--border)'}">
              <div class="info-toggle-knob" style="left:${showEn ? '18px' : '1px'}"></div>
            </div>
            <span style="color:${showEn ? 'var(--accent-gold)' : 'var(--text-muted)'};font-weight:${showEn ? '600' : '400'}">EN</span>
          </div>
        </div>
        <div class="detail-header">
          ${img ? '<div class="detail-weapon-img-wrap" style="width:140px;height:140px;border-radius:70px;overflow:hidden;margin:0 auto 16px"><img class="detail-weapon-img" src="' + img + '" alt="' + npc.name + '" style="width:100%;height:100%;object-fit:cover;display:block"></div>' : ''}
          <div class="detail-title" style="font-size:1.6rem">${title}</div>
          ${npc.role ? `<div style="font-size:0.85rem;color:var(--text-muted)">${showEn ? npc.role : (npc.role_cn || npc.role)}</div>` : ''}
          ${npc.location ? `<div style="margin-top:8px;font-size:0.9rem">🗺 <span style="color:var(--accent-gold)">${showEn ? npc.location : (npc.location_cn || npc.location)}</span></div>` : ''}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
            ${npc.region_cn ? `<span style="font-size:0.7rem;padding:3px 10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:12px;color:var(--text-secondary)">📍 ${showEn ? npc.region : npc.region_cn}</span>` : ''}
            ${npc.type_cn ? `<span style="font-size:0.7rem;padding:3px 10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:12px;color:var(--text-secondary)">🏷 ${showEn ? npc.type : npc.type_cn}</span>` : ''}
            ${npc.faction_cn ? `<span style="font-size:0.7rem;padding:3px 10px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:12px;color:var(--text-secondary)">⚔ ${showEn ? npc.faction : npc.faction_cn}</span>` : ''}
          </div>
          ${npc.quote ? `<div style="margin-top:12px;padding:12px 16px;background:var(--bg-tertiary);border-left:3px solid var(--accent-gold);border-radius:0 6px 6px 0;font-style:italic;color:var(--text-secondary)">"${showEn ? npc.quote : (npc.quote_cn || npc.quote)}"</div>` : ''}
        </div>
        ${quest ? renderQuest(quest) : '<div class="stat-block" style="margin-top:16px"><div class="stat-block-title">说明</div><div class="stat-block-content" style="flex-direction:column"><div style="font-size:0.85rem;color:var(--text-muted)">暂无支线数据</div></div></div>'}
      </div>`;

    const toggle = container.querySelector('#npc-detail-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        showEn = !showEn;
        render();
      });
    }

    const overlay = container.querySelector('#npc-info-overlay');
    if (overlay) {
      overlay.querySelector('.bp-modal-close').addEventListener('click', () => { overlay.style.display = 'none'; });
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
    }
  }

  function renderQuest(q) {
    const steps = q.steps || [];
    const rewards = q.rewards || [];
    const fcs = q.failureConditions || [];
    const desc = showEn ? q.description : (q.description_cn || q.description);
    const rList = showEn ? rewards : (q.rewards_cn || rewards);
    const fcList = showEn ? fcs : (q.failureConditions_cn || fcs);
    return `
      ${desc ? `<div class="stat-block"><div class="stat-block-title">简介</div><div class="stat-block-content" style="flex-direction:column"><div style="font-size:0.85rem;color:var(--text-secondary)">${desc}</div></div></div>` : ''}
      <div class="stat-block">
        <div class="stat-block-title">支线步骤 (${steps.length})</div>
        <div class="stat-block-content" style="flex-direction:column;gap:0">
          ${steps.map(s => {
            const stepDesc = showEn ? s.description : (s.description_cn || s.description);
            const stepNote = showEn ? s.note : (s.note_cn || s.note);
            return `
              <div class="quest-step ${s.optional ? 'quest-step-optional' : ''}">
                <div class="quest-step-num">${s.id}</div>
                <div class="quest-step-body">
                  <div class="quest-step-text">${stepDesc}</div>
                  <div class="quest-step-meta">
                    <span class="quest-step-zone">${zoneCn(s.zone)}</span>
                    ${s.optional ? '<span class="quest-step-optional-tag">可选</span>' : '<span class="quest-step-required-tag">必要</span>'}
                  </div>
                  ${stepNote ? `<div class="quest-step-note">💡 ${stepNote}</div>` : ''}
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
      ${rList.length ? `<div class="stat-block"><div class="stat-block-title">奖励 (${rList.length})</div><div class="stat-block-content" style="flex-direction:column"><ul style="list-style:none;padding:0;margin:0">${rList.map(r => `<li style="padding:4px 0;font-size:0.85rem;color:var(--accent-gold)">✦ ${r}</li>`).join('')}</ul></div></div>` : ''}
      ${fcList.length ? `<div class="stat-block"><div class="stat-block-title" style="color:var(--accent-red)">失败条件</div><div class="stat-block-content" style="flex-direction:column">${fcList.map(fc => `<div style="padding:4px 0;font-size:0.85rem;color:var(--accent-red)">⚠ ${fc}</div>`).join('')}</div></div>` : ''}
    `;
  }

  render();
  return () => {};
}
