import { translateName } from '../store.js';

let allWeapons = [];
let reinforcementData = null;

async function loadReinforcements() {
  if (reinforcementData) return;
  const resp = await fetch('./data/reinforcements.json');
  reinforcementData = await resp.json();
}

const REINF_DMG_MAP = { physicsAtkRate: 'physical', magicAtkRate: 'magic', fireAtkRate: 'fire', thunderAtkRate: 'lightning', darkAtkRate: 'holy', staminaAtkRate: 'stamina' };
const REINF_SCA_MAP = { correctStrengthRate: 'strength', correctAgilityRate: 'dexterity', correctMagicRate: 'intelligence', correctFaithRate: 'faith', correctLuckRate: 'arcane' };

function calcLevels(w) {
  const aff = w.affinity?.Standard;
  if (!aff) return null;
  const reinfId = aff.reinforcement_id;
  const maxLvl = w.upgrade_material?.includes('Somber') ? 10 : 25;
  const curve = reinforcementData?.weapon || {};
  const levels = [];
  for (let i = 0; i <= maxLvl; i++) {
    const row = curve[String(reinfId + i)];
    // For missing rows, use base values (i=0) or previous level values
    if (!row) {
      if (i === 0) {
        // Base level: use affinity base values directly
        const damage = {}, scaling = {};
        for (const [, rv] of Object.entries(REINF_DMG_MAP)) damage[rv] = Math.round(aff.damage?.[rv] || 0);
        for (const [, rv] of Object.entries(REINF_SCA_MAP)) scaling[rv] = aff.scaling?.[rv] || 0;
        levels.push({ damage, scaling });
      } else if (levels.length) {
        // Carry forward previous level
        levels.push({ ...levels[i - 1] });
      } else {
        levels.push({ damage: {}, scaling: {} });
      }
      continue;
    }
    const damage = {}, scaling = {};
    for (const [rk, rv] of Object.entries(REINF_DMG_MAP)) damage[rv] = Math.round((aff.damage?.[rv] || 0) * (row[rk] || 1));
    for (const [rk, rv] of Object.entries(REINF_SCA_MAP)) scaling[rv] = parseFloat(((aff.scaling?.[rv] || 0) * (row[rk] || 1)).toFixed(3));
    levels.push({ damage, scaling });
  }
  return levels;
}

const DMG_CN = { physical: '物理', magic: '魔力', fire: '火', lightning: '雷', holy: '圣' };
const DMG_COLORS = { physical: '#c9a84c', magic: '#7a8fc9', fire: '#d4743a', lightning: '#8ad4c9', holy: '#d4c97a' };

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

const cats = [];

export async function renderDataCharts(container, params) {
  await loadReinforcements();
  if (!allWeapons.length) {
    try {
      const armResp = await fetch('./data/armaments.json');
      allWeapons = Object.values(await armResp.json());
      cats.length = 0;
      cats.push(...new Set(allWeapons.map(w => w.category || '').filter(Boolean)).sort());
    } catch (e) { console.warn('Charts load failed:', e); }
  }

  let selectedWeapon = null;
  let chartMode = 'damage';
  let query = '';
  let activeCat = '';

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
          <button class="bp-modal-close" id="ch-mclose">✕</button>
        </div>
        <div class="bp-modal-search">
          <input type="text" id="ch-msearch" placeholder="搜索名称...">
        </div>
        <div class="bp-modal-filter" id="ch-mfilter">
          <span class="bp-chip ${activeCat === '' ? 'on' : ''}" data-cat="">全部</span>
          ${cats.map(c => `<span class="bp-chip ${activeCat === c ? 'on' : ''}" data-cat="${c}">${CAT_CN[c] || c}</span>`).join('')}
        </div>
        <div class="bp-modal-list" id="ch-mlist"></div>
      </div>`;

    function renderItems() {
      const list = overlay.querySelector('#ch-mlist');
      const q = (overlay.querySelector('#ch-msearch')?.value || '').toLowerCase();
      const filtered = allWeapons.filter(w => {
        if (q) {
          const cn = translateName(w.name) || w.name;
          if (!cn.toLowerCase().includes(q) && !w.name.toLowerCase().includes(q)) return false;
        }
        if (activeCat && w.category !== activeCat) return false;
        return true;
      });
      if (!filtered.length) {
        list.innerHTML = '<div style="grid-column:1/-1;padding:32px;text-align:center;color:var(--text-muted);font-size:0.85rem">无匹配</div>';
        return;
      }
      list.innerHTML = filtered.map(w => `
        <div class="bp-mcard" data-name="${w.name}">
          <div class="bp-mcard-text">
            <div class="bp-mcard-name">${translateName(w.name) || w.name}</div>
            <div class="bp-mcard-meta">${CAT_CN[w.category] || w.category || ''} · ${w.upgrade_material?.includes('Somber') ? '特殊' : '普通'}强化</div>
          </div>
        </div>
      `).join('');
      list.querySelectorAll('.bp-mcard').forEach(el => {
        el.addEventListener('click', () => {
          selectedWeapon = allWeapons.find(w => w.name === el.dataset.name);
          overlay.style.display = 'none';
          render();
        });
      });
    }

    overlay.querySelector('#ch-mclose').addEventListener('click', () => { overlay.style.display = 'none'; });
    const chsInput = overlay.querySelector('#ch-msearch');
    if (chsInput) {
      let composing = false;
      chsInput.addEventListener('compositionstart', () => { composing = true; });
      chsInput.addEventListener('compositionend', () => { composing = false; query = chsInput.value; renderItems(); });
      chsInput.addEventListener('input', () => { if (composing) return; query = chsInput.value; renderItems(); });
    }
    overlay.querySelector('#ch-mfilter')?.addEventListener('click', e => {
      const chip = e.target.closest('.bp-chip');
      if (!chip) return;
      overlay.querySelectorAll('.bp-chip').forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      activeCat = chip.dataset.cat;
      renderItems();
    });
    overlay.style.display = 'flex';
    renderItems();
    setTimeout(() => overlay.querySelector('#ch-msearch')?.focus(), 100);
  }

  async function render() {
    if (!selectedWeapon) {
      container.innerHTML = `
        <div class="page">
          <div class="page-header">
            <div class="page-title">数据图表</div>
            <div class="page-meta">点击格子选择武器，查看伤害/补正曲线</div>
          </div>
          <div class="bp-grid">
            <div class="bp-section">
              <div class="bp-section-header">武器</div>
              <div class="bp-section-body" style="grid-template-columns:1fr;">
                <div class="bp-cell" id="ch-cell">
                  <div class="bp-cell-label">选择武器</div>
                  <div class="bp-cell-empty">空</div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      container.querySelector('#ch-cell').addEventListener('click', openModal);
      container.appendChild(overlay);
      return;
    }

    const w = selectedWeapon;
    const levels = calcLevels(w);
    if (!levels) {
      container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">该武器无强化数据</div></div></div>';
      return;
    }

    const maxLvl = w.upgrade_material?.includes('Somber') ? 10 : 25;
    const dmgKeys = ['physical', 'magic', 'fire', 'lightning', 'holy'].filter(k => levels[maxLvl]?.damage?.[k] > 0);

    let html = `
      <div class="page">
        <div class="page-header">
          <div class="page-title">数据图表</div>
          <div class="page-meta">${translateName(w.name) || w.name}</div>
        </div>
        <div class="bp-grid">
          <div class="bp-section">
            <div class="bp-section-header">武器</div>
            <div class="bp-section-body" style="grid-template-columns:1fr;">
              <div class="bp-cell has-item" id="ch-cell">
                <div class="bp-cell-label">选择武器</div>
                <div class="bp-cell-name">${translateName(w.name) || w.name}</div>
                <div class="bp-cell-weight">${CAT_CN[w.category] || w.category || ''}</div>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin:16px 0;">
          <button class="tag-filter-btn ${chartMode === 'damage' ? 'active' : ''}" data-mode="damage">伤害曲线</button>
          <button class="tag-filter-btn ${chartMode === 'compare' ? 'active' : ''}" data-mode="compare">满级对比</button>
        </div>
        ${chartMode === 'damage' ? `
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:8px;">
            <canvas id="dmgChart" style="width:100%;height:300px;"></canvas>
          </div>
          ${dmgKeys.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            ${dmgKeys.map(k => `<span style="display:flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--text-muted);"><span style="width:10px;height:10px;border-radius:2px;background:${DMG_COLORS[k]};display:inline-block;"></span>${DMG_CN[k]}</span>`).join('')}
          </div>` : '<div style="margin-top:12px;font-size:0.85rem;color:var(--text-muted);text-align:center;">该武器无伤害数据（可能是法杖/圣印记等触媒类武器）</div>'}
        ` : `
          <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:8px;">
            <canvas id="cmpChart" style="width:100%;height:300px;"></canvas>
          </div>
          ${dmgKeys.length ? '' : '<div style="margin-top:12px;font-size:0.85rem;color:var(--text-muted);text-align:center;">无伤害数据可对比</div>'}
        `}
      </div>`;

    container.innerHTML = html;
    container.querySelector('#ch-cell')?.addEventListener('click', openModal);
    container.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => { chartMode = btn.dataset.mode; render(); });
    });
    container.appendChild(overlay);

    if (chartMode === 'damage') {
      const canvas = document.getElementById('dmgChart');
      if (canvas && dmgKeys.length) {
        const { drawLineChart } = await import('../charts.js');
        requestAnimationFrame(() => {
          drawLineChart(canvas, null, {
            title: '各属性伤害 · 强化等级',
            yLabel: '伤害',
            xLabels: levels.map((_, i) => `+${i}`),
            datasets: dmgKeys.map(k => ({
              label: DMG_CN[k],
              color: DMG_COLORS[k],
              values: levels.map(l => l.damage?.[k] || 0),
            })),
          });
        });
      }
    } else if (chartMode === 'compare') {
      const canvas = document.getElementById('cmpChart');
      if (canvas && dmgKeys.length) {
        const { drawBarChart } = await import('../charts.js');
        requestAnimationFrame(() => {
          drawBarChart(canvas, null, {
            title: '强化前后对比 · +0 vs +' + maxLvl,
            yLabel: '伤害',
            labels: dmgKeys.map(k => DMG_CN[k]),
            groups: dmgKeys.map(k => ({
              values: [levels[0].damage?.[k] || 0, levels[maxLvl].damage?.[k] || 0]
            })),
            colors: ['rgba(201,168,76,0.4)', '#c9a84c'],
            legend: ['+0', '+' + maxLvl],
          });
        });
      }
    }
  }

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

  render();
  return () => {};
}
