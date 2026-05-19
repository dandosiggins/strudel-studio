// Runs in a Web Worker. Owns the OffscreenCanvas and does all rendering.
// Main thread only reads analyser data and posts it here via setInterval.

let canvas = null;
let ctx = null;
let cw = 0; // CSS-pixel width
let ch = 0; // CSS-pixel height
let dpr = 1;
let rotation = 0;
let time = 0;
const particles = [];

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    canvas = data.canvas;
    dpr = data.dpr;
    cw = data.w;
    ch = data.h;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  } else if (data.type === 'resize') {
    dpr = data.dpr;
    cw = data.w;
    ch = data.h;
    if (canvas) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  } else if (data.type === 'draw') {
    if (!ctx) return;
    if (!data.isPlaying) {
      particles.length = 0;
      drawIdle(ctx, cw, ch);
      return;
    }
    time++;
    rotation += 0.005;
    if (data.mode === 'main') {
      drawMainBars(ctx, cw, ch, data.freqData);
    } else {
      drawPerf(ctx, cw, ch, data.freqData, data.waveData, data.vizIdx);
    }
  }
};

// ── Idle ───────────────────────────────────────────────────────────────────

function drawIdle(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(52,211,153,0.05)';
  ctx.fillRect(0, h / 2 - 1, w, 2);
}

// ── Main-view bar chart (no shadowBlur) ────────────────────────────────────

const BAR_COUNT = 80;

function drawMainBars(ctx, w, h, data) {
  ctx.clearRect(0, 0, w, h);
  const bufLen = data.length;
  const gap = Math.floor(w / BAR_COUNT);
  const barW = Math.max(1, gap - 1);
  for (let i = 0; i < BAR_COUNT; i++) {
    const bin = Math.floor((i / BAR_COUNT) * bufLen * 0.7);
    const v = data[bin] / 255;
    const barH = Math.max(2, v * h);
    const x = i * gap;
    const y = h - barH;
    const alpha = 0.12 + v * 0.88;
    const g = Math.floor(150 + v * 61);
    ctx.fillStyle = `rgba(16,${g},129,${alpha})`;
    ctx.fillRect(x, y, barW, barH);
    if (v > 0.25) {
      ctx.fillStyle = `rgba(110,231,183,${v * 0.9})`;
      ctx.fillRect(x, y, barW, 2);
    }
  }
}

// ── Performance mode — dispatch to selected visualizer ────────────────────

function drawPerf(ctx, w, h, freqData, waveData, vizIdx) {
  if (vizIdx === 1)      drawWaveform(ctx, w, h, waveData);
  else if (vizIdx === 2) drawCircular(ctx, w, h, freqData);
  else if (vizIdx === 3) drawParticles(ctx, w, h, freqData);
  else if (vizIdx === 4) drawTunnel(ctx, w, h, freqData);
  else                   drawSpectrum(ctx, w, h, freqData);
}

// ── Spectrum ───────────────────────────────────────────────────────────────

function drawSpectrum(ctx, w, h, data) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const barW = Math.max(2, Math.floor(w / 160));
  const step = barW + 1;
  const numBars = Math.floor(cx / step);
  const usedBins = Math.floor(data.length * 0.7);
  for (let i = 0; i < numBars; i++) {
    const bin = Math.floor((i / numBars) * usedBins);
    const v = data[bin] / 255;
    const halfH = Math.max(1, v * cy * 0.88);
    const alpha = (0.08 + v * 0.92).toFixed(2);
    const green = Math.round(150 + v * 61);
    ctx.fillStyle = `rgba(52,${green},99,${alpha})`;
    const rx = cx + i * step, lx = cx - (i + 1) * step;
    ctx.fillRect(rx, cy - halfH, barW, halfH * 2);
    ctx.fillRect(lx, cy - halfH, barW, halfH * 2);
    if (v > 0.2) {
      ctx.fillStyle = `rgba(167,243,208,${Math.min(1, v * 1.3).toFixed(2)})`;
      ctx.fillRect(rx, cy - halfH, barW, 2);
      ctx.fillRect(rx, cy + halfH - 2, barW, 2);
      ctx.fillRect(lx, cy - halfH, barW, 2);
      ctx.fillRect(lx, cy + halfH - 2, barW, 2);
    }
  }
}

// ── Waveform ───────────────────────────────────────────────────────────────

function drawWaveform(ctx, w, h, waveData) {
  ctx.clearRect(0, 0, w, h);
  const cy = h / 2;
  const sliceW = w / (waveData.length - 1);
  let sum = 0;
  for (let i = 0; i < waveData.length; i++) sum += Math.abs(waveData[i] - 128);
  const avg = sum / waveData.length / 128;
  ctx.lineWidth = 1.5 + avg * 3;
  ctx.strokeStyle = `rgba(52,211,153,${(0.55 + avg * 0.45).toFixed(2)})`;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < waveData.length; i++) {
    const v = (waveData[i] - 128) / 128;
    const y = cy + v * cy * 0.8;
    const x = i * sliceW;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      const px = (i - 1) * sliceW;
      const pv = (waveData[i - 1] - 128) / 128;
      const py = cy + pv * cy * 0.8;
      const cpX = (px + x) / 2;
      ctx.bezierCurveTo(cpX, py, cpX, y, x, y);
    }
  }
  ctx.stroke();
}

// ── Circular ───────────────────────────────────────────────────────────────

function drawCircular(ctx, w, h, data) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const base = Math.min(w, h) * 0.22;
  const maxLen = Math.min(w, h) * 0.28;
  const numBars = 180;
  const usedBins = Math.floor(data.length * 0.7);
  let bassSum = 0;
  for (let i = 0; i < 8; i++) bassSum += data[i];
  const bass = bassSum / (8 * 255);
  ctx.beginPath();
  ctx.arc(cx, cy, base * (0.85 + bass * 0.35), 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(52,211,153,${(0.15 + bass * 0.45).toFixed(2)})`;
  ctx.lineWidth = 1.5 + bass * 3;
  ctx.stroke();
  for (let i = 0; i < numBars; i++) {
    const bin = Math.floor((i / numBars) * usedBins);
    const v = data[bin] / 255;
    const angle = (i / numBars) * Math.PI * 2 + rotation;
    const len = Math.max(1, v * maxLen);
    const x1 = cx + Math.cos(angle) * base, y1 = cy + Math.sin(angle) * base;
    const x2 = cx + Math.cos(angle) * (base + len), y2 = cy + Math.sin(angle) * (base + len);
    ctx.strokeStyle = `rgba(52,${Math.round(150 + v * 61)},99,${(0.15 + v * 0.85).toFixed(2)})`;
    ctx.lineWidth = Math.max(1, 1.5 + v * 2);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

// ── Particles ──────────────────────────────────────────────────────────────

function drawParticles(ctx, w, h, data) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 0, w, h);
  let amp = 0;
  for (let i = 0; i < data.length; i++) amp += data[i];
  amp /= data.length * 255;
  let bassSum = 0;
  for (let i = 0; i < 8; i++) bassSum += data[i];
  const bass = bassSum / (8 * 255);
  const count = Math.floor(1 + amp * 12);
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w, y: h + Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.5 * (1 + bass * 3),
      vy: -(1 + Math.random() * 3 + amp * 8),
      size: 1.5 + Math.random() * 3 + amp * 6,
      life: 1.0, decay: 0.008 + Math.random() * 0.012 + amp * 0.01,
      brightness: amp,
    });
  }
  let write = 0;
  for (let i = 0; i < particles.length; i++) {
    if (particles[i].life > 0) particles[write++] = particles[i];
  }
  particles.length = write;
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.life -= p.decay; p.vx *= 0.99;
    const a = Math.max(0, p.life * 0.85);
    const wh = Math.round(p.brightness * 160);
    const rb = Math.min(255, 20 + wh * 2);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${rb},${Math.min(255, 150 + wh)},${rb},${a.toFixed(2)})`;
    ctx.fill();
  }
}

// ── Tunnel ─────────────────────────────────────────────────────────────────

function drawTunnel(ctx, w, h, data) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) * 1.1;
  let bassSum = 0;
  for (let i = 0; i < 8; i++) bassSum += data[i];
  const bass = bassSum / (8 * 255);
  const binCount = data.length;
  const hStart = Math.floor(binCount * 0.5);
  let highSum = 0;
  for (let i = hStart; i < binCount; i++) highSum += data[i];
  const high = highSum / ((binCount - hStart) * 255);
  for (let i = 18; i >= 0; i--) {
    const norm = ((i / 18) + (time * 0.0004)) % 1;
    const r = norm * maxR + bass * 40 * (1 - norm);
    const wobble = high * 25 * (1 - norm * 0.6);
    const alpha = (1 - norm) * 0.5 + 0.05;
    const green = Math.round(130 + bass * 80 * (1 - norm));
    ctx.lineWidth = Math.max(0.5, 1 + (1 - norm) * 2 + bass * 3 * (1 - norm));
    ctx.strokeStyle = `rgba(52,${green},99,${alpha.toFixed(2)})`;
    if (wobble > 2) {
      ctx.beginPath();
      for (let s = 0; s <= 64; s++) {
        const ang = (s / 64) * Math.PI * 2;
        const wb = Math.sin(ang * 6 + time * 0.003) * wobble;
        const rx = cx + Math.cos(ang) * (r + wb), ry = cy + Math.sin(ang) * (r + wb);
        s === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
      }
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2);
    }
    ctx.stroke();
  }
}
