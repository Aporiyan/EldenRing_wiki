import { translateName, getItemImageUrl } from '../store.js';

let allWeapons = [];

async function loadWeapons() {
  if (allWeapons.length) return;
  try {
    const armResp = await fetch('./data/armaments.json');
    allWeapons = Object.values(await armResp.json());
  } catch (e) {
    console.warn('Weapon affinity load failed:', e);
  }
}

const AFFINITY_CN = {
  Standard: '标准', Heavy: '厚重', Keen: '锋利', Quality: '优质',
  Magic: '魔力', Fire: '火焰', 'Flame Art': '焰术', Lightning: '雷电',
  Sacred: '神圣', Poison: '毒', Blood: '血', Cold: '冰冻',
  Occult: '神秘',
};

const AFFINITY_COLORS = {
  Standard: '#aaa', Heavy: '#d4a574', Keen: '#8ab8d4', Quality: '#c9a84c',
  Magic: '#7a8fc9', Fire: '#d4743a', 'Flame Art': '#e8943a', Lightning: '#8ad4c9',
  Sacred: '#d4c97a', Poison: '#6a9a4a', Blood: '#d44a4a', Cold: '#7ac9d4',
  Occult: '#a07ad4',
};

const SCALE_COLORS = {
  S: { color: '#e8d44a', bg: 'rgba(232,212,74,0.15)' },
  A: { color: '#d44a4a', bg: 'rgba(212,74,74,0.15)' },
  B: { color: '#d47a4a', bg: 'rgba(212,122,74,0.15)' },
  C: { color: '#8ac94a', bg: 'rgba(138,201,74,0.15)' },
  D: { color: '#8ab8d4', bg: 'rgba(138,184,212,0.15)' },
  E: { color: '#aaa', bg: 'rgba(170,170,170,0.1)' },
};

const SCN = { strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };
const REQ_CN = { strength: '力气', dexterity: '灵巧', intelligence: '智力', faith: '信仰', arcane: '感应' };

const CAT_CN = {
  Dagger: '匕首', 'Straight Sword': '直剑', Greatsword: '大剑',
  'Colossal Sword': '特大剑', 'Colossal Weapon': '特大武器',
  'Thrusting Sword': '刺剑', 'Heavy Thrusting Sword': '大重剑',
  'Curved Sword': '曲剑', 'Curved Greatsword': '大刀', Katana: '武士刀',
  Twinblade: '双头剑', Hammer: '锤', 'Great Hammer': '大锤',
  Flail: '连枷', Axe: '斧', Greataxe: '大斧',
  Halberd: '戟', Spear: '矛', 'Great Spear': '大矛',
  Lance: '长矛', Reaper: '镰刀', Whip: '鞭',
  Fist: '拳', Claw: '爪', 'Light Bow': '小弓', Bow: '弓',
  Greatbow: '大弓', Crossbow: '弩', Ballista: '弩炮',
  'Glintstone Staff': '杖', Staff: '法杖', 'Sacred Seal': '圣印记',
  Torch: '火把', 'Small Shield': '小盾', 'Medium Shield': '中盾',
  Shield: '盾', Greatshield: '大盾', Lance: '长矛',
  Arrow: '箭', Bolt: '弩箭',
};

function scalingGrade(val) {
  if (val >= 1.4) return 'S';
  if (val >= 1.0) return 'A';
  if (val >= 0.6) return 'B';
  if (val >= 0.25) return 'C';
  if (val >= 0.0) return 'D';
  return '-';
}

export async function renderAffinityCompare(container, params) {
  await loadWeapons();

  let selectedWeapon = null;
  let query = '';
  let activeCat = '';

  const cats = [...new Set(allWeapons.map(w => w.category || ''))].filter(Boolean).sort();

  const overlay = document.createElement('div');
  overlay.className = 'bp-overlay';
  overlay.style.display = 'none';

  function openModal() {
    overlay.innerHTML = `
      <div class="bp-modal">
        <div class="bp-modal-head">
          <div class="bp-modal-head-left">
            <span class="bp-modal-icon">◈</span>
            <span class="bp-modal-title">选择武器</span>
            <span class="bp-modal-count">${allWeapons.length}</span>
          </div>
          <button class="bp-modal-close" id="ac-mclose">✕</button>
        </div>
        <div class="bp-modal-search">
          <input type="text" id="ac-msearch" placeholder="搜索名称...">
        </div>
        <div class="bp-modal-filter" id="ac-mfilter">
          <span class="bp-chip ${activeCat === '' ? 'on' : ''}" data-cat="">全部</span>
          ${cats.map(c => `<span class="bp-chip ${activeCat === c ? 'on' : ''}" data-cat="${c}">${CAT_CN[c] || c}</span>`).join('')}
        </div>
        <div class="bp-modal-list" id="ac-mlist"></div>
      </div>`;

    function renderItems() {
      const list = overlay.querySelector('#ac-mlist');
      const q = (overlay.querySelector('#ac-msearch')?.value || '').toLowerCase();
      const filtered = allWeapons.filter(w => {
        if (q) {
          const cn = w.name_cn || w.name;
          if (!cn.toLowerCase().includes(q) && !w.name.toLowerCase().includes(q)) return false;
        }
        if (activeCat && w.category !== activeCat) return false;
        return true;
      });
      if (!filtered.length) {
        list.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted);font-size:0.85rem">无匹配</div>';
        return;
      }
      list.innerHTML = filtered.map(w => {
        const thumb = getItemImageUrl('armaments', w.name);
        return `<div class="bp-mcard" data-name="${w.name}">
          ${thumb ? `<img class="bp-mcard-thumb" src="${thumb}" alt="">` : ''}
          <div class="bp-mcard-text">
            <div class="bp-mcard-name">${translateName(w.name) || w.name}</div>
            <div class="bp-mcard-meta">${CAT_CN[w.category] || w.category || ''}</div>
          </div>
        </div>`;
      }).join('');
      list.querySelectorAll('.bp-mcard').forEach(el => {
        el.addEventListener('click', () => {
          selectedWeapon = allWeapons.find(w => w.name === el.dataset.name);
          overlay.style.display = 'none';
          render();
        });
      });
    }

    overlay.querySelector('#ac-mclose').addEventListener('click', () => { overlay.style.display = 'none'; });
    const acInput = overlay.querySelector('#ac-msearch');
    if (acInput) {
      let composing = false;
      acInput.addEventListener('compositionstart', () => { composing = true; });
      acInput.addEventListener('compositionend', () => { composing = false; query = acInput.value; renderItems(); });
      acInput.addEventListener('input', () => { if (composing) return; query = acInput.value; renderItems(); });
    }
    overlay.querySelector('#ac-mfilter')?.addEventListener('click', e => {
      const chip = e.target.closest('.bp-chip');
      if (!chip) return;
      overlay.querySelectorAll('.bp-chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      activeCat = chip.dataset.cat;
      renderItems();
    });
    overlay.style.display = 'flex';
    renderItems();
    setTimeout(() => overlay.querySelector('#ac-msearch')?.focus(), 100);
  }

  function render() {
    if (!selectedWeapon) {
      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <div class="page-title">武器质变对比</div>
            <div class="page-meta">点击下方格子选择武器</div>
          </div>
          <div class="bp-grid">
            <div class="bp-section">
              <div class="bp-section-header">武器</div>
              <div class="bp-section-body" style="grid-template-columns:1fr;">
                <div class="bp-cell" id="ac-cell">
                  <div class="bp-cell-label">选择武器</div>
                  <div class="bp-cell-empty">空</div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      container.querySelector('#ac-cell').addEventListener('click', openModal);
      container.appendChild(overlay);
      return;
    }

    const w = selectedWeapon;
    const affinities = w.affinity || {};
    const affKeys = Object.keys(affinities);
    const statKeys = ['strength', 'dexterity', 'intelligence', 'faith', 'arcane'];

    let html = `
      <div class="page">
        <div class="page-header">
          <div class="page-title">武器质变对比</div>
          <div class="page-meta">${translateName(w.name) || w.name}</div>
        </div>
        <div class="bp-grid">
          <div class="bp-section">
            <div class="bp-section-header">武器</div>
            <div class="bp-section-body" style="grid-template-columns:1fr;">
              <div class="bp-cell has-item" id="ac-cell">
                <div class="bp-cell-label">选择武器</div>
                <div class="bp-cell-name">${translateName(w.name) || w.name}</div>
                <div class="bp-cell-weight">${CAT_CN[w.category] || w.category || ''}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="upgrade-table-wrap" style="margin-top:16px;">
          <table class="upgrade-table">
            <thead>
              <tr>
                <th>质变</th>
                <th>物理</th>
                <th>魔力</th>
                <th>火</th>
                <th>雷</th>
                <th>圣</th>
                <th>补正</th>
                <th>需求</th>
              </tr>
            </thead>
            <tbody>`;

    for (const key of affKeys) {
      const aff = affinities[key];
      const dmg = aff.damage || {};

      const sca = aff.scaling || {};
      const scaHtml = statKeys.map(k => {
        const v = sca[k];
        if (v && v > 0) {
          const grade = scalingGrade(v);
          const c = SCALE_COLORS[grade] || {};
          return `<span style="display:inline-flex;align-items:center;gap:2px;margin:0 2px;"><span style="font-size:0.6rem;color:var(--text-muted);">${SCN[k][0]}</span><span style="font-weight:700;font-size:0.75rem;color:${c.color};">${grade}</span></span>`;
        }
        return '';
      }).join('');

      const req = aff.requirements || {};
      const reqHtml = statKeys.filter(k => req[k] > 0)
        .map(k => `${REQ_CN[k]}${req[k]}`).join(' ') || '—';

      const color = AFFINITY_COLORS[key] || '#aaa';
      const DMG_KEYS = ['physical', 'magic', 'fire', 'lightning', 'holy'];
      html += `
        <tr>
          <td><span style="color:${color};font-weight:600;">${AFFINITY_CN[key] || key}</span></td>
          ${DMG_KEYS.map(k => `<td style="text-align:right">${dmg[k] > 0 ? `<span style="color:var(--text);">${dmg[k]}</span>` : '<span style="color:var(--text-muted);">—</span>'}</td>`).join('')}
          <td style="font-size:0.75rem;">${scaHtml || '<span style="color:var(--text-muted);">—</span>'}</td>
          <td style="font-size:0.75rem;color:var(--text-muted);">${reqHtml}</td>
        </tr>`;
    }

    html += '</tbody></table></div></div>';

    container.innerHTML = html;
    container.querySelector('#ac-cell')?.addEventListener('click', openModal);
    container.appendChild(overlay);
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  render();
  return () => {};
}
