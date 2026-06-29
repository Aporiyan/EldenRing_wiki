function cssVar(name, fallback) {
  try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
  catch (e) { return fallback; }
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  let W = rect.width, H = rect.height;
  if (W === 0 || H === 0) {
    // Fallback: read inline or computed style
    W = parseInt(canvas.style.width) || canvas.offsetWidth || 400;
    H = parseInt(canvas.style.height) || canvas.offsetHeight || 300;
    if (W === 0 || H === 0) return null;
  }
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, W, H };
}

function drawAxes(ctx, pad, cw, ch, maxVal, minVal, yLabel, xLabels, W, H) {
  const gridColor = cssVar('--border-color', 'rgba(255,255,255,0.12)');
  const axisColor = cssVar('--border-color', 'rgba(255,255,255,0.35)');
  const labelColor = cssVar('--text-muted', 'rgba(255,255,255,0.6)');
  const gridLines = 5;

  // Y axis
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + ch);
  ctx.stroke();

  // X axis
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + ch);
  ctx.lineTo(pad.left + cw, pad.top + ch);
  ctx.stroke();

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let i = 1; i < gridLines; i++) {
    const y = pad.top + (ch / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cw, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Y axis labels
  ctx.fillStyle = labelColor;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  const decimals = maxVal < 5 ? 2 : maxVal < 50 ? 1 : 0;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (ch / gridLines) * i;
    const val = maxVal - ((maxVal - minVal) / gridLines) * i;
    ctx.fillText(val.toFixed(decimals), pad.left - 8, y + 4);
  }

  // Y axis label
  if (yLabel) {
    ctx.save();
    ctx.translate(14, pad.top + ch / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = labelColor;
    ctx.font = '11px sans-serif';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }

  // X axis labels
  if (xLabels && xLabels.length > 1) {
    ctx.fillStyle = labelColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < xLabels.length; i++) {
      const x = pad.left + (cw / (xLabels.length - 1)) * i;
      ctx.fillText(xLabels[i], x, pad.top + ch + 18);
    }
  }
}

export function drawLineChart(canvas, data, options = {}) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, W, H } = setup;

  const pad = { top: 28, right: 20, bottom: 38, left: 52 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  if (cw <= 0 || ch <= 0) return;

  const datasets = options.datasets || [];
  const xLabels = options.xLabels || [];
  const yLabel = options.yLabel || '';
  const title = options.title || '';

  if (!datasets.length || !datasets[0].values.length) return;

  let maxVal = 0, minVal = Infinity;
  for (const ds of datasets) {
    for (const v of ds.values) {
      if (v > maxVal) maxVal = v;
      if (v < minVal) minVal = v;
    }
  }
  if (maxVal === minVal) { maxVal = maxVal + 1; minVal = Math.max(0, minVal - 1); }
  maxVal = Math.ceil(maxVal * 1.1);
  minVal = Math.max(0, Math.floor(minVal * 0.9));
  if (maxVal === minVal) maxVal = minVal + 1;

  ctx.clearRect(0, 0, W, H);

  // Title
  if (title) {
    ctx.fillStyle = cssVar('--accent-gold', '#c9a84c');
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 16);
  }

  drawAxes(ctx, pad, cw, ch, maxVal, minVal, yLabel, xLabels, W, H);

  const textColor = cssVar('--text', '#ddd');

  for (let di = 0; di < datasets.length; di++) {
    const ds = datasets[di];
    const color = ds.color || '#c9a84c';
    const vals = ds.values;
    if (vals.length < 2) continue;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < vals.length; i++) {
      const x = pad.left + (cw / (vals.length - 1)) * i;
      const y = pad.top + ch - ((vals[i] - minVal) / (maxVal - minVal)) * ch;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Points
    for (let i = 0; i < vals.length; i++) {
      const x = pad.left + (cw / (vals.length - 1)) * i;
      const y = pad.top + ch - ((vals[i] - minVal) / (maxVal - minVal)) * ch;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Last value label
    const li = vals.length - 1;
    ctx.fillStyle = color;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    const lx = pad.left + cw;
    const ly = pad.top + ch - ((vals[li] - minVal) / (maxVal - minVal)) * ch;
    ctx.fillText(ds.label + ' ' + vals[li], lx + 6, ly + 3);
  }
}

export function drawBarChart(canvas, data, options = {}) {
  const setup = setupCanvas(canvas);
  if (!setup) return;
  const { ctx, W, H } = setup;

  const pad = { top: 28, right: 20, bottom: 55, left: 52 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  if (cw <= 0 || ch <= 0) return;

  const groups = options.groups || [];
  const labels = options.labels || [];
  const colors = options.colors || ['rgba(201,168,76,0.4)', '#c9a84c'];
  const title = options.title || '';
  const yLabel = options.yLabel || '';
  const legend = options.legend || [];

  if (!groups.length) return;

  let maxVal = 0;
  for (const g of groups) {
    for (const v of g.values) {
      if (v > maxVal) maxVal = v;
    }
  }
  maxVal = Math.ceil(maxVal * 1.15) || 1;

  ctx.clearRect(0, 0, W, H);

  if (title) {
    ctx.fillStyle = cssVar('--accent-gold', '#c9a84c');
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 16);
  }

  drawAxes(ctx, pad, cw, ch, maxVal, 0, yLabel, [], W, H);

  // Bar chart x-axis labels (centered per group)
  const groupGap = cw / groups.length;
  const labelColor = cssVar('--text-muted', 'rgba(255,255,255,0.6)');
  ctx.fillStyle = labelColor;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  for (let gi = 0; gi < groups.length; gi++) {
    const gx = pad.left + groupGap * gi + groupGap / 2;
    ctx.fillText(labels[gi] || '', gx, pad.top + ch + 18);
  }

  // Bars
  const nBars = groups[0]?.values.length || 1;
  const barW = Math.min(groupGap / nBars * 0.5, 28);
  const barGap = barW * 0.2;

  const textColor = cssVar('--text', '#ddd');

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    const gx = pad.left + groupGap * gi;

    for (let bi = 0; bi < g.values.length; bi++) {
      const v = g.values[bi];
      const barH = Math.max((v / maxVal) * ch, 1);
      const x = gx + (groupGap - barW * nBars - barGap * (nBars - 1)) / 2 + bi * (barW + barGap);
      const y = pad.top + ch - barH;
      ctx.fillStyle = colors[bi % colors.length];
      ctx.fillRect(x, y, barW, barH);

      // Value on top
      if (v > 0) {
        ctx.fillStyle = textColor;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(v.toString(), x + barW / 2, y - 4);
      }
    }
  }

  // Legend
  if (legend.length && nBars > 1) {
    ctx.font = '10px sans-serif';
    let lx = pad.left;
    for (let i = 0; i < legend.length && i < colors.length; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, H - 10, 8, 8);
      ctx.fillStyle = labelColor;
      ctx.textAlign = 'left';
      ctx.fillText(legend[i], lx + 12, H - 2);
      lx += ctx.measureText(legend[i]).width + 28;
    }
  }
}
