import { translateName } from '../store.js';

const CN_MAP = {
  'Bow': '鞠躬', 'Polite Bow': '郑重行礼', 'My Thanks': '感谢', 'Curtsy': '行屈膝礼',
  'Reverential Bow': '敬意', 'My Lord': '陛下', 'Warm Welcome': '热烈欢迎', 'Wave': '挥手',
  'Casual Greeting': '随意打招呼', 'Strength!': '加油！', 'As You Wish': '悉听尊便',
  'Point Forwards': '向前指', 'Point Upwards': '向上指', 'Point Downwards': '向下指',
  'Beckon': '过来', 'Wait!': '等等！', 'Calm Down!': '冷静点！', 'Nod In Thought': '沉思点头',
  'Extreme Repentance': '极度忏悔', 'Grovel For Mercy': '乞求饶恕', 'Rallying Cry': '战吼',
  'Heartening Cry': '呐喊', 'By My Sword': '剑之誓约', "Hoslow's Oath": '霍斯劳的誓言',
  'Fire Spur Me': '火啊，燃烧吧', 'Bravo!': '好！', 'Jump for Joy': '雀跃',
  'Triumphant Delight': '欢欣鼓舞', 'Fancy Spin': '华丽旋转', 'Finger Snap': '弹指',
  'Dejection': '沮丧', "Patches' Crouch": '帕奇蹲', 'Crossed Legs': '二郎腿', 'Rest': '休息',
  'Sitting Sideways': '侧坐', 'Dozing Cross-Legged': '盘腿打盹', 'Spread Out': '摊开四肢',
  'Balled Up': '缩成一团', 'What Do You Want?': '想要什么？', 'Prayer': '祈祷',
  'Desperate Prayer': '绝望祈祷', 'Rapture': '狂喜', 'Erudition': '博学',
  'Outer Order': '外律', 'Inner Order': '内律', 'Golden Order Totality': '黄金律法全貌',
  'The Ring': '指环',
};

const DESC_MAP = {
  'Bow': '正式鞠躬', 'Polite Bow': '款款施礼', 'My Thanks': '表达谢意',
  'Curtsy': '行屈膝礼', 'Reverential Bow': '俯首鞠躬', 'My Lord': '参见陛下',
  'Warm Welcome': '热情的欢迎', 'Wave': '挥手致意', 'Casual Greeting': '随意地打招呼',
  'Strength!': '鼓励喝彩', 'As You Wish': '表示服从', 'Point Forwards': '向前方示意',
  'Point Upwards': '向上方示意', 'Point Downwards': '向下方示意', 'Beckon': '招呼过来',
  'Wait!': '表示等待', 'Calm Down!': '示意冷静', 'Nod In Thought': '思考中点头',
  'Extreme Repentance': '极度后悔', 'Grovel For Mercy': '乞求饶命', 'Rallying Cry': '鼓舞士气的呐喊',
  'Heartening Cry': '壮胆的呐喊', 'By My Sword': '以剑起誓', "Hoslow's Oath": '霍斯劳一族的誓言',
  'Fire Spur Me': '火焰啊，助我一臂之力', 'Bravo!': '表示称赞', 'Jump for Joy': '高兴得跳起',
  'Triumphant Delight': '胜利的喜悦', 'Fancy Spin': '华丽转身', 'Finger Snap': '打响指',
  'Dejection': '意志消沉', "Patches' Crouch": '帕奇式抱头蹲防', 'Crossed Legs': '翘二郎腿坐',
  'Rest': '放松坐', 'Sitting Sideways': '侧身坐', 'Dozing Cross-Legged': '盘腿打盹',
  'Spread Out': '舒展开手脚', 'Balled Up': '蜷缩身体', 'What Do You Want?': '询问对方意图',
  'Prayer': '虔诚祷告', 'Desperate Prayer': '绝望中祈祷', 'Rapture': '狂喜之情',
  'Erudition': '深不可测的学识', 'Outer Order': '外部的律法', 'Inner Order': '内部的律法',
  'Golden Order Totality': '黄金律法的全部', 'The Ring': '指环',
};

let _gesturesCache = null;

async function ensureGestureCache() {
  if (_gesturesCache) return;
  const resp = await fetch('./data/gestures.json');
  _gesturesCache = await resp.json();
}

export async function renderGestures(container, params) {
  let query = '';
  let detached = false;

  async function render() {
    await ensureGestureCache();
    const data = _gesturesCache;
    let list = Object.values(data);

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(g => {
        const cn = CN_MAP[g.name] || translateName(g.name) || g.name;
        return cn.toLowerCase().includes(q) || g.name.toLowerCase().includes(q);
      });
    }

    const activeId = document.activeElement?.id;
    const activeSelStart = document.activeElement?.selectionStart;
    const activeSelEnd = document.activeElement?.selectionEnd;

    container.innerHTML = `
      <div class="page">
        <div class="page-header">
          <div class="page-title">姿势图鉴</div>
          <div class="page-meta">${list.length} 种</div>
        </div>
        <div style="margin-bottom:12px;">
          <input type="text" id="gSearch" placeholder="搜索姿势..." value="${query.replace(/"/g, '&quot;')}" style="width:100%;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text);font-size:0.85rem;">
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
          ${list.map(g => {
            const cn = CN_MAP[g.name] || translateName(g.name) || g.name;
            const rawDesc = Array.isArray(g.description) ? g.description.join(' ') : (g.description || '');
            const desc = DESC_MAP[g.name] || (rawDesc.includes('no description') || rawDesc.includes('no summary') ? '' : rawDesc);
            const loc = g.locations && g.locations[0] && g.locations[0].summary !== 'no summary' ? g.locations[0].summary : '';
            return `<div class="item-card" style="cursor:default">
              <div class="item-card-header" style="gap:10px">
                <div style="width:44px;height:44px;border-radius:6px;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">🙌</div>
                <div style="min-width:0">
                  <div class="item-card-name">${cn}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted)">${g.name}</div>
                </div>
              </div>
              ${desc ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:6px;line-height:1.4">${desc}</div>` : ''}
              ${loc ? `<div style="font-size:0.72rem;color:var(--accent-gold-dim);margin-top:4px">📍 ${loc}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
        ${!list.length ? '<div class="empty-state"><div class="empty-state-icon">🙌</div><div class="empty-state-text">无匹配姿势</div></div>' : ''}
      </div>`;

    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) { el.focus(); if (typeof activeSelStart === 'number') el.setSelectionRange(activeSelStart, activeSelEnd); }
    }

    const inp = document.getElementById('gSearch');
    if (inp) {
      let composing = false;
      inp.addEventListener('compositionstart', () => { composing = true; });
      inp.addEventListener('compositionend', () => { composing = false; query = inp.value; render(); });
      inp.addEventListener('input', e => { if (composing) return; query = e.target.value; render(); });
    }
  }

  container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⏳</div><div class="empty-state-text">正在加载...</div></div></div>';
  ensureGestureCache().then(async () => {
    if (detached) return;
    try { await render(); } catch (e) {
      if (detached) return;
      container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">渲染出错：' + e.message + '</div></div></div>';
    }
  }, () => {
    if (detached) return;
    container.innerHTML = '<div class="page"><div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-text">数据加载失败</div></div></div>';
  });
  return () => { detached = true; };
}
