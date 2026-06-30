export function renderWalkthrough(container, params) {
  container.innerHTML = `
    <div class="page">
      <div class="page-header">
        <div class="page-title">推图路线</div>
        <div class="page-meta">推荐探索顺序 · 等级建议 · 关键道具</div>
      </div>
      <div id="wt-progress" style="display:flex;gap:4px;overflow-x:auto;padding:8px 0;margin-bottom:12px"></div>
      <div id="wt-content"></div>
      <div class="empty-state" id="wt-loading">
        <div class="empty-state-icon">⏳</div>
        <div class="empty-state-text">加载推图数据...</div>
      </div>
    </div>`;

  const progressBar = container.querySelector('#wt-progress');
  const contentDiv = container.querySelector('#wt-content');
  const loadingDiv = container.querySelector('#wt-loading');

  (async () => {
    try {
      const resp = await fetch('./data/walkthrough.json');
      const areas = await resp.json();
      loadingDiv.style.display = 'none';

      progressBar.innerHTML = areas.map((a, i) => `
        <div class="wt-progress-step" data-idx="${i}"
          style="flex-shrink:0;padding:6px 14px;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;font-size:0.75rem;white-space:nowrap;background:var(--bg-card);transition:all .15s"
          onmouseenter="this.style.background='var(--bg-card-hover)'"
          onmouseleave="this.style.background='var(--bg-card)'">
          <span style="font-weight:600">${a.name}</span>
          <span style="color:var(--text-muted);margin-left:4px">Lv.${a.recommended_level}</span>
        </div>`).join('');

      function renderArea(area) {
        contentDiv.innerHTML = `
          <div class="wt-area" style="animation:fadeIn .3s ease">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:16px">
              <div>
                <h2 style="margin:0;font-family:var(--font-display);font-weight:400;font-size:1.3rem;color:var(--accent-gold)">${area.name}</h2>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${area.name_en}</div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <span class="wt-badge">推荐等级 Lv.${area.recommended_level}</span>
                <span class="wt-badge">范围 ${area.level_range}</span>
                <span class="wt-badge">强化 ${area.recommended_upgrade}</span>
              </div>
            </div>
            <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.5;margin-bottom:20px">${area.description}</p>

            ${area.sub_areas && area.sub_areas.length ? `
            <div class="wt-section">
              <div class="wt-section-title">子区域</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">
                ${area.sub_areas.map(sa => `
                  <div style="padding:10px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card)">
                    <div style="font-weight:600;font-size:0.85rem">${sa.name}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:4px">Lv.${sa.recommended_level}（${sa.level_range}）</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary)">${sa.description}</div>
                  </div>`).join('')}
              </div>
            </div>` : ''}

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
              <div>
                <div class="wt-section">
                  <div class="wt-section-title">必打 Boss</div>
                  ${renderBossCards(area.mandatory_bosses)}
                </div>
                ${area.key_bosses && area.key_bosses.length ? `
                <div class="wt-section">
                  <div class="wt-section-title">重要 Boss</div>
                  ${renderBossCards(area.key_bosses)}
                </div>` : ''}
              </div>
              <div>
                ${area.key_items && area.key_items.length ? `
                <div class="wt-section">
                  <div class="wt-section-title">关键道具</div>
                  <div style="display:flex;flex-direction:column;gap:6px">
                    ${area.key_items.map(ki => `
                      <div style="padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card)">
                        <div style="font-weight:500;font-size:0.85rem">${ki.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">${ki.location}</div>
                      </div>`).join('')}
                  </div>
                </div>` : ''}
              </div>
            </div>

            ${area.tips && area.tips.length ? `
            <div class="wt-section">
              <div class="wt-section-title">💡 小贴士</div>
              <ul style="margin:8px 0 0;padding-left:18px;color:var(--text-secondary);font-size:0.85rem;line-height:1.7">
                ${area.tips.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>` : ''}
          </div>`;
      }

      function renderBossCards(bosses) {
        if (!bosses || !bosses.length) return '<div style="font-size:0.8rem;color:var(--text-muted);padding:8px">无</div>';
        return `<div style="display:flex;flex-direction:column;gap:6px">
          ${bosses.map(b => {
            const drops = b.drops && b.drops.length ? `<div style="font-size:0.72rem;color:var(--accent-gold-dim);margin-top:2px">掉落：${b.drops.join('、')}</div>` : '';
            return `<div style="padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card)">
              <div style="font-weight:500;font-size:0.85rem">${b.name}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">${b.location}</div>
              ${drops}
            </div>`;
          }).join('')}
        </div>`;
      }

      // Render first area
      let currentIdx = 0;

      function selectArea(idx) {
        if (idx < 0 || idx >= areas.length) return;
        currentIdx = idx;
        progressBar.querySelectorAll('.wt-progress-step').forEach((el, i) => {
          el.style.borderColor = i === idx ? 'var(--accent-gold-dim)' : 'var(--border-color)';
          el.style.background = i === idx ? 'var(--bg-card-hover)' : 'var(--bg-card)';
          el.style.color = i === idx ? 'var(--accent-gold)' : 'var(--text-primary)';
        });
        renderArea(areas[idx]);
        contentDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      progressBar.addEventListener('click', e => {
        const step = e.target.closest('.wt-progress-step');
        if (step) selectArea(parseInt(step.dataset.idx));
      });

      selectArea(0);
    } catch (e) {
      loadingDiv.style.display = 'none';
      contentDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠</div>
          <div class="empty-state-text">加载推图数据失败</div>
        </div>`;
    }
  })();
}
