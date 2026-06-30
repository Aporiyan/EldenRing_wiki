const CAT_CN = { Spellbook: '魔法卷轴', 'Bell Bearing': '铃珠', Cookbook: '笔记' };
const CAT_ICON = { Spellbook: '📜', 'Bell Bearing': '🔔', Cookbook: '📖' };
const CAT_CLS = { Spellbook: 'sh-tag-spell', 'Bell Bearing': 'sh-tag-bell', Cookbook: 'sh-tag-cook' };
const CAT_CLS_RAW = { Spellbook: '#c9a84c', 'Bell Bearing': '#4c8ac9', Cookbook: '#6a9a4a' };

const DESC_LEAD = {
  'Can be given to a learned sorcerer to gain access to the following sorceries:': '可交给睿智法师解锁以下魔法：',
  'Can be given to a learned cleric to gain access to the following incantations:': '可交给虔诚牧师解锁以下祷告：',
  'Offer to the Twin Maiden Husks at the Roundtable Hold to gain access to new items.': '交给孪生老妪可解锁新商品。',
  'Offer to the Twin Maiden Husks at the Roundtable Hold to gain access to the following items:': '交给孪生老妪可解锁以下商品：',
  'Acquire the knowledge to craft the following:': '习得以下制作配方：',
};

const CAT_DESC = {
  Spellbook: '交给 NPC 法师/牧师可学习新魔法或祷告',
  'Bell Bearing': '交给孪生老妪可解锁新商品',
  Cookbook: '使用后可习得新的制作配方',
};

function translateLead(text) {
  for (const [en, cn] of Object.entries(DESC_LEAD)) {
    text = text.replace(en, cn);
  }
  return text;
}

// Translate item/NPC names in text using name_map
function translateNames(text, nm) {
  text = translateLead(text);
  for (const [en, cn] of Object.entries(NPC_MAP)) {
    text = text.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cn);
  }
  // Translate by checking all known name_map keys (longest match first)
  const known = Object.keys(nm).sort((a, b) => b.length - a.length);
  for (const en of known) {
    const idx = text.indexOf(en);
    if (idx >= 0) {
      text = text.slice(0, idx) + nm[en] + text.slice(idx + en.length);
    }
  }
  return text;
}

function isUnlockLine(line) {
  return line.trim().startsWith('- ') || /^(Defeat |Dropped by |Reward for |Purchase from )/.test(line.trim());
}

export async function renderShopItems(container, params) {
  let query = '';
  let filterCat = '';

  async function render() {
    const [shopData, nm] = await Promise.all([
      fetch('./data/shop.json').then(r => r.json()),
      fetch('./data/name_map.json').then(r => r.json()),
    ]);

    let list = Object.values(shopData);
    const cats = [...new Set(list.map(i => i.category))].filter(Boolean).sort();

    if (filterCat) list = list.filter(i => i.category === filterCat);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(i => {
        const cn = nm[i.name] || i.name;
        return cn.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
      });
    }

    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <div class="page-title">卷轴 / 铃珠 / 笔记</div>
          <div class="page-meta">${list.length} 件 · 可交给 NPC 解锁新内容</div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <span class="wc-fl">分类：</span>
          <div style="display:flex;flex-wrap:wrap;gap:6px;flex:1">
            <button class="tag-filter-btn ${!filterCat ? 'active' : ''}" data-cat="">全部</button>
            ${cats.map(c => `<button class="tag-filter-btn ${filterCat === c ? 'active' : ''}" data-cat="${c}">${CAT_CN[c] || c}</button>`).join('')}
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <input type="text" id="shSearch" placeholder="搜索名称..." value="${query.replace(/"/g, '&quot;')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;">
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px">
          ${list.map(i => {
            const cn = nm[i.name] || i.name;
            const desc = Array.isArray(i.description) ? i.description.join('\n') : (i.description || '');
            const lines = desc.split('\n');
            const unlockLines = lines.filter(l => isUnlockLine(l)).map(l => translateNames(l.replace(/^- /, '').replace(/^\* /, ''), nm));
            const leadLine = lines.map(l => { const t = l.trim(); return { orig: t, trans: translateLead(t) }; }).find(({ orig, trans }) => trans !== orig && !isUnlockLine(orig) && !/^(Sell at|can be sold|sell for|Purchase for|no\b)/i.test(orig));
            // Description footnote (sell price, etc.)
            const footnotes = lines.filter(l => /^(Sell at|can be sold|sell for|Purchase for)/.test(l.trim())).map(l => translateNames(l.trim(), nm));
            const loc = i.locations && i.locations[0] && i.locations[0].summary !== 'no summary' ? i.locations[0].summary : '';
            const catColor = CAT_CLS_RAW[i.category] || 'var(--text-muted)';
            return `<div class="item-card" style="cursor:default">
              <div class="item-card-header" style="gap:10px">
                <div style="width:40px;height:40px;border-radius:6px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">${CAT_ICON[i.category] || '📦'}</div>
                <div style="min-width:0">
                  <div class="item-card-name">${cn}</div>
                  <div><span style="display:inline-block;padding:0 6px;border-radius:3px;font-size:0.65rem;line-height:1.6;font-weight:600;color:${catColor};background:${catColor}18;border:1px solid ${catColor}30;">${CAT_CN[i.category] || i.category}</span></div>
                </div>
              </div>
              ${leadLine ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:6px;line-height:1.4">${leadLine.trans}</div>` : ''}
              ${unlockLines.length ? `<div style="margin-top:8px;padding:8px 10px;background:var(--bg-tertiary);border-radius:6px;font-size:0.78rem;color:var(--accent-gold);line-height:1.7">${unlockLines.map(l => `<div>· ${l}</div>`).join('')}</div>` : ''}
              ${footnotes.length ? `<div style="margin-top:4px;font-size:0.72rem;color:var(--text-muted)">${footnotes.join('<br>')}</div>` : ''}
              ${loc ? `<div style="font-size:0.72rem;color:var(--accent-blue);margin-top:6px">📍 ${loc}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
        ${!list.length ? '<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-text">无匹配物品</div></div>' : ''}
      </div>`;

    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) { el.focus(); if (typeof activeSelStart === 'number') el.setSelectionRange(activeSelStart, activeSelEnd); }
    }

    const inp = document.getElementById('shSearch');
    if (inp) {
      let composing = false;
      inp.addEventListener('compositionstart', () => { composing = true; });
      inp.addEventListener('compositionend', () => { composing = false; query = inp.value; render(); });
      inp.addEventListener('input', e => { if (composing) return; query = e.target.value; render(); });
    }
    container.querySelectorAll('[data-cat]').forEach(b => {
      b.addEventListener('click', () => { filterCat = b.dataset.cat; render(); });
    });
  }

  await render();
  return () => {};
}
