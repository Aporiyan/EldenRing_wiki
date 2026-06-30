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

function getNpcImage(npc) {
  const localFile = imageManifest[npc.name];
  if (localFile) return `./images/npcs/${localFile}`;
  if (npc.image && !npc.image.includes('missing')) return npc.image;
  return null;
}

function buildFilterList(data, field) {
  return [...new Set(data.map(n => n[field]).filter(Boolean))].sort();
}

export async function renderNpcList(container, params) {
  await loadNpcData();

  let searchQuery = '';
  let filterRegion = '';
  let filterType = '';
  let filterFaction = '';
  let showEn = false;

  const regionList = buildFilterList(npcData, 'region_cn');
  const typeList = buildFilterList(npcData, 'type_cn');
  const factionList = buildFilterList(npcData, 'faction_cn');

  function hasQuest(npc) {
    const clean = npc.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return Object.values(questData).some(q => {
      const nameClean = (q.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return nameClean.includes(clean) || clean.includes(nameClean);
    });
  }

  function render() {
    // Save focus state before re-render
    const activeEl = document.activeElement;
    const activeId = activeEl && activeEl.id;
    const cursorPos = activeEl && activeEl.selectionStart !== undefined ? activeEl.selectionStart : -1;

    let items = [...npcData];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (nameMap[i.name] || '').toLowerCase().includes(q) ||
        (i.location || '').toLowerCase().includes(q) ||
        (i.role || '').toLowerCase().includes(q)
      );
    }
    if (filterRegion) {
      items = items.filter(i => i.region_cn === filterRegion);
    }
    if (filterType) {
      items = items.filter(i => i.type_cn === filterType);
    }
    if (filterFaction) {
      items = items.filter(i => i.faction_cn === filterFaction);
    }

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <div class="page-title">NPC 一览</div>
          <div class="page-meta">共 ${npcData.length} 名 NPC · ${Object.keys(questData).length} 名有支线数据</div>
        </div>
        <div class="filter-bar" style="flex-wrap:wrap;gap:6px">
          <input type="text" id="npc-search" class="filter-btn" placeholder="搜索 NPC 名称/地点..." style="flex:1;min-width:150px;padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text)">
          <select id="npc-region-filter" class="filter-btn" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text)">
            <option value="">全部区域</option>
            ${regionList.map(z => `<option value="${z}" ${filterRegion === z ? 'selected' : ''}>${z}</option>`).join('')}
          </select>
          <select id="npc-type-filter" class="filter-btn" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text)">
            <option value="">全部类型</option>
            ${typeList.map(t => `<option value="${t}" ${filterType === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <select id="npc-faction-filter" class="filter-btn" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-input);color:var(--text)">
            <option value="">全部阵营</option>
            ${factionList.map(f => `<option value="${f}" ${filterFaction === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
          <div id="npc-toggle-en" style="margin-left:auto;display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none">
            <span style="color:${!showEn ? 'var(--accent)' : 'var(--text-muted)'};font-weight:${!showEn ? '600' : '400'};font-size:0.8rem">中文</span>
            <div class="info-toggle-track" style="background:${showEn ? 'var(--accent)' : 'var(--bg-input)'};border-color:${showEn ? 'var(--accent)' : 'var(--border)'}">
              <div class="info-toggle-knob" style="left:${showEn ? '18px' : '1px'}"></div>
            </div>
            <span style="color:${showEn ? 'var(--accent)' : 'var(--text-muted)'};font-weight:${showEn ? '600' : '400'};font-size:0.8rem">EN</span>
          </div>
        </div>
        <div class="items-grid">
          ${items.map(n => {
            const img = getNpcImage(n);
            const hasQ = hasQuest(n);
            const nameCn = nameMap[n.name] || n.name_cn || n.name;
            const displayName = showEn ? n.name : nameCn;
            return `
              <div class="item-card npc-card" data-name="${n.name}">
                <div class="item-card-header">
                  ${img ? `<div class="npc-card-avatar"><img src="${img}" alt="${n.name}" loading="lazy"></div>` : `<div class="npc-card-avatar npc-card-avatar-empty">?</div>`}
                  <div>
                    <div class="item-card-name" title="${displayName}">${displayName}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">${showEn ? (n.role || '') : (n.role_cn || n.role || '')}</div>
                  </div>
                  <div class="item-card-tags">
                    ${hasQ ? '<span class="item-card-tag" style="background:rgba(76,138,201,0.2);color:var(--accent-blue)">支线</span>' : ''}
                    ${n.type_cn ? `<span class="item-card-tag" style="background:rgba(201,168,76,0.12);color:var(--accent-gold);font-size:0.55rem">${n.type_cn}</span>` : ''}
                  </div>
                </div>
                ${n.location ? `<div class="npc-card-location" style="font-size:0.78rem;color:var(--accent-gold)">${showEn ? n.location : (n.location_cn || n.location)}</div>` : ''}
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
                  ${n.region_cn ? `<span style="font-size:0.6rem;padding:1px 6px;background:var(--bg-tertiary);border-radius:4px;color:var(--text-muted)">${showEn ? n.region : n.region_cn}</span>` : ''}
                  ${n.faction_cn ? `<span style="font-size:0.6rem;padding:1px 6px;background:var(--bg-tertiary);border-radius:4px;color:var(--text-muted)">${showEn ? n.faction : n.faction_cn}</span>` : ''}
                </div>
                ${n.quote ? `<div class="npc-card-quote" style="font-size:0.78rem;color:var(--text-muted);font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${showEn ? n.quote : (n.quote_cn || n.quote)}</div>` : ''}
              </div>`;
          }).join('')}
          ${items.length === 0 ? '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-text">未找到匹配</div></div>' : ''}
        </div>
      </div>`;

    // Restore focus to the element that had it before re-render
    if (activeId) {
      const newEl = container.querySelector('#' + activeId);
      if (newEl) {
        newEl.focus();
        if (cursorPos >= 0 && activeId === 'npc-search') {
          newEl.setSelectionRange(cursorPos, cursorPos);
        }
      }
    }

    const npcInput = container.querySelector('#npc-search');
    if (npcInput) {
      let composing = false;
      npcInput.addEventListener('compositionstart', () => { composing = true; });
      npcInput.addEventListener('compositionend', () => { composing = false; searchQuery = npcInput.value; render(); });
      npcInput.addEventListener('input', e => { if (composing) return; searchQuery = e.target.value; render(); });
    }
    container.querySelector('#npc-region-filter').addEventListener('change', e => {
      filterRegion = e.target.value;
      render();
    });
    container.querySelector('#npc-type-filter').addEventListener('change', e => {
      filterType = e.target.value;
      render();
    });
    container.querySelector('#npc-faction-filter').addEventListener('change', e => {
      filterFaction = e.target.value;
      render();
    });
    container.querySelector('#npc-toggle-en').addEventListener('click', e => {
      showEn = !showEn;
      render();
    });

    container.querySelectorAll('.npc-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.dataset.name;
        window.location.hash = `#/npcs/${encodeURIComponent(name)}`;
      });
    });
  }

  render();
  return () => {};
}
