/* Vice Nights — Cover Studio.
 * A GTA-style multi-panel cover maker. Every picture is drawn procedurally
 * on canvas in this file: no external images, no uploads, no network.
 * Lettering: Noto Sans Display Condensed (Black 900 / Bold 700), vendored
 * under app/fonts/ under the SIL Open Font License. */
'use strict';

/* ---------- deterministic pseudo-random ---------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- shared drawing helpers ---------- */
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -60, 4, -118);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.08 + i * 0.14);
    const len = 52 - Math.abs(i - 3) * 7;
    ctx.beginPath();
    ctx.moveTo(4, -118);
    ctx.quadraticCurveTo(
      4 + Math.cos(a) * len * 0.6, -118 + Math.sin(a) * len * 0.55 - 14,
      4 + Math.cos(a) * len, -118 + Math.sin(a) * len + 16
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyline(ctx, w, baseY, seed, color, litColor, maxH) {
  const rnd = mulberry32(seed);
  let x = -20;
  ctx.fillStyle = color;
  while (x < w + 20) {
    const bw = 46 + rnd() * 90;
    const bh = 60 + rnd() * maxH;
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (rnd() < 0.5) {
      ctx.fillRect(x + bw * 0.3, baseY - bh - 18 - rnd() * 26, bw * 0.4, 18 + rnd() * 26);
    }
    ctx.fillStyle = litColor;
    const cols = Math.floor(bw / 16);
    const rows = Math.floor(bh / 22);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() < 0.32) {
          ctx.fillRect(x + 6 + c * 16, baseY - bh + 8 + r * 22, 7, 10);
        }
      }
    }
    ctx.fillStyle = color;
    x += bw + 4 + rnd() * 22;
  }
}

function drawSportsCar(ctx, x, y, s, body, glass, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-150, 0);
  ctx.lineTo(-138, -26);
  ctx.quadraticCurveTo(-96, -34, -58, -36);
  ctx.quadraticCurveTo(-30, -66, 22, -64);
  ctx.quadraticCurveTo(72, -62, 96, -36);
  ctx.quadraticCurveTo(138, -30, 152, -6);
  ctx.lineTo(150, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = glass;
  ctx.beginPath();
  ctx.moveTo(-52, -38);
  ctx.quadraticCurveTo(-26, -60, 18, -58);
  ctx.quadraticCurveTo(58, -56, 82, -38);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0a12';
  ctx.beginPath(); ctx.arc(-92, 2, 26, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(92, 2, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath(); ctx.arc(-92, 2, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(92, 2, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.ellipse(148, -16, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawNeonSign(ctx, x, y, w, h, text, color, fontPx) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.font = '700 ' + fontPx + 'px "Noto Sans Display Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

function drawWetStreet(ctx, w, h, horizonY, base, streakColors) {
  const g = ctx.createLinearGradient(0, horizonY, 0, h);
  g.addColorStop(0, base);
  g.addColorStop(1, '#05030a');
  ctx.fillStyle = g;
  ctx.fillRect(0, horizonY, w, h - horizonY);
  const rnd = mulberry32(77);
  for (let i = 0; i < 26; i++) {
    const sx = rnd() * w;
    const sw = 4 + rnd() * 26;
    const sy = horizonY + 8 + rnd() * (h - horizonY - 30);
    const sh = 30 + rnd() * 120;
    const c = streakColors[Math.floor(rnd() * streakColors.length)];
    const sg = ctx.createLinearGradient(0, sy, 0, sy + sh);
    sg.addColorStop(0, c);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.16 + rnd() * 0.22;
    ctx.fillStyle = sg;
    ctx.fillRect(sx, sy, sw, sh);
  }
  ctx.globalAlpha = 1;
}

/* ---------- scene 1: neon night chase ---------- */
function drawNightChase(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#0b0626');
  sky.addColorStop(0.55, '#2a0a4d');
  sky.addColorStop(1, '#57104e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const rnd = mulberry32(101);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.fillRect(rnd() * w, rnd() * h * 0.4, 2, 2);
  }
  ctx.globalAlpha = 1;
  const mg = ctx.createRadialGradient(w * 0.78, h * 0.16, 6, w * 0.78, h * 0.16, 90);
  mg.addColorStop(0, '#fdf6d8');
  mg.addColorStop(0.35, '#f5e6a8');
  mg.addColorStop(1, 'rgba(245,230,168,0)');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.16, 90, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fdf6d8';
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.16, 34, 0, Math.PI * 2); ctx.fill();
  drawSkyline(ctx, w, h * 0.62, 2024, '#12082e', 'rgba(255,214,120,0.85)', 210);
  drawNeonSign(ctx, w * 0.16, h * 0.30, 160, 54, 'VICE', '#ff2e88', 40);
  drawNeonSign(ctx, w * 0.62, h * 0.38, 200, 54, 'NIGHTS', '#2ee6ff', 40);
  drawWetStreet(ctx, w, h, h * 0.62, '#160a2e', ['#ff2e88', '#2ee6ff', '#ffc53d']);
  ctx.strokeStyle = 'rgba(255,214,120,0.7)';
  ctx.lineWidth = 5;
  ctx.setLineDash([34, 30]);
  ctx.beginPath(); ctx.moveTo(0, h * 0.86); ctx.lineTo(w, h * 0.80); ctx.stroke();
  ctx.setLineDash([]);
  drawSportsCar(ctx, w * 0.34, h * 0.74, 1.05, '#c40e4e', '#9fd8ff', false);
  drawSportsCar(ctx, w * 0.72, h * 0.68, 0.72, '#0e7fd8', '#cfeaff', true);
  ctx.fillStyle = 'rgba(255,233,168,0.20)';
  ctx.beginPath();
  ctx.moveTo(w * 0.34 + 150, h * 0.74 - 14);
  ctx.lineTo(w, h * 0.66);
  ctx.lineTo(w, h * 0.80);
  ctx.lineTo(w * 0.34 + 150, h * 0.74 + 4);
  ctx.closePath();
  ctx.fill();
  drawPalm(ctx, w * 0.05, h * 0.66, 0.9, '#0a0518');
  drawPalm(ctx, w * 0.95, h * 0.64, 1.1, '#0a0518');
}

/* ---------- scene 2: golden-hour boulevard ---------- */
function drawBoulevard(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.66);
  sky.addColorStop(0, '#ff9a3d');
  sky.addColorStop(0.5, '#ff6a5e');
  sky.addColorStop(1, '#c22e6e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sg = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, 260);
  sg.addColorStop(0, 'rgba(255,244,200,0.95)');
  sg.addColorStop(0.4, 'rgba(255,214,120,0.55)');
  sg.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, w, h * 0.7);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.42, 74, 0, Math.PI * 2); ctx.fill();
  const rnd = mulberry32(55);
  ctx.fillStyle = 'rgba(255,220,170,0.5)';
  for (let i = 0; i < 8; i++) {
    const cy = 40 + rnd() * h * 0.3;
    const cw = 120 + rnd() * 220;
    ctx.beginPath();
    ctx.ellipse(rnd() * w, cy, cw, 14 + rnd() * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawSkyline(ctx, w, h * 0.66, 909, '#7a2340', 'rgba(255,236,180,0.9)', 150);
  ctx.fillStyle = '#8a4a2a';
  ctx.fillRect(0, h * 0.66, w, h * 0.34);
  ctx.fillStyle = '#5e3018';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.42, h * 0.66);
  ctx.lineTo(w * 0.58, h * 0.66);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,200,0.85)';
  ctx.lineWidth = 6;
  ctx.setLineDash([40, 34]);
  ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.68); ctx.lineTo(w * 0.5, h); ctx.stroke();
  ctx.setLineDash([]);
  drawSportsCar(ctx, w * 0.5, h * 0.82, 1.15, '#e8e2d4', '#8ec8e8', false);
  drawPalm(ctx, w * 0.08, h * 0.70, 1.15, '#3d1220');
  drawPalm(ctx, w * 0.24, h * 0.68, 0.85, '#3d1220');
  drawPalm(ctx, w * 0.88, h * 0.70, 1.05, '#3d1220');
  ctx.fillStyle = 'rgba(60,10,30,0.35)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.90, 260, 26, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- scene 3: sunset heist ---------- */
function drawSunsetHeist(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.64);
  sky.addColorStop(0, '#2b0a3d');
  sky.addColorStop(0.45, '#a81e5c');
  sky.addColorStop(0.8, '#ff5e2e');
  sky.addColorStop(1, '#ffb03d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath(); ctx.arc(w * 0.68, h * 0.5, 62, 0, Math.PI * 2); ctx.fill();
  const sg = ctx.createRadialGradient(w * 0.68, h * 0.5, 10, w * 0.68, h * 0.5, 240);
  sg.addColorStop(0, 'rgba(255,220,140,0.7)');
  sg.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, w, h * 0.7);
  drawSkyline(ctx, w, h * 0.64, 31337, '#1c0a30', 'rgba(255,190,90,0.9)', 190);
  ctx.fillStyle = '#2b1230';
  ctx.fillRect(w * 0.10, h * 0.30, w * 0.24, h * 0.34);
  ctx.fillStyle = '#ffd27a';
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 5; r++) {
      ctx.fillRect(w * 0.13 + c * w * 0.055, h * 0.33 + r * h * 0.055, 18, 24);
    }
  }
  ctx.fillStyle = '#2b1230';
  ctx.beginPath();
  ctx.moveTo(w * 0.10, h * 0.30);
  ctx.lineTo(w * 0.22, h * 0.22);
  ctx.lineTo(w * 0.34, h * 0.30);
  ctx.closePath();
  ctx.fill();
  drawWetStreet(ctx, w, h, h * 0.64, '#1c0a26', ['#ff5e2e', '#ffb03d', '#ff2e88']);
  drawSportsCar(ctx, w * 0.42, h * 0.80, 1.1, '#11131c', '#ffd27a', false);
  drawRunningFigure(ctx, w * 0.72, h * 0.84, 1.0);
  drawRunningFigure(ctx, w * 0.80, h * 0.86, 0.85);
  drawPalm(ctx, w * 0.04, h * 0.68, 1.0, '#12061f');
  drawPalm(ctx, w * 0.96, h * 0.66, 0.9, '#12061f');
}

function drawRunningFigure(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#0d0518';
  ctx.fillStyle = '#0d0518';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -72, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(-8, -18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -46); ctx.lineTo(-30, -30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -46); ctx.lineTo(22, -58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-34, 4); ctx.lineTo(-28, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(18, 2); ctx.lineTo(34, 20); ctx.stroke();
  ctx.restore();
}

/* ---------- scene registry ---------- */
const SCENES = {
  chase: { name: 'Night Chase', draw: drawNightChase },
  boulevard: { name: 'Golden Boulevard', draw: drawBoulevard },
  heist: { name: 'Sunset Heist', draw: drawSunsetHeist },
};

const sceneCache = {};
function getSceneCanvas(id) {
  if (sceneCache[id]) return sceneCache[id];
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 800;
  SCENES[id].draw(c.getContext('2d'), 1200, 800);
  sceneCache[id] = c;
  return c;
}

/* ---------- state ---------- */
const state = {
  layout: 'hero-left',
  grade: 'sunset',
  size: '1920x1080',
  caption: 'VICE NIGHTS',
  tagline: 'Welcome back to the city that never sleeps',
  panels: [
    { source: 'chase', zoom: 1, x: 0, y: 0, photo: null },
    { source: 'boulevard', zoom: 1, x: 0, y: 0, photo: null },
    { source: 'heist', zoom: 1, x: 0, y: 0, photo: null },
  ],
};

const SIZES = {
  '1920x1080': [1920, 1080],
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
};

const SIZE_LABELS = {
  '1920x1080': '1920 \u00d7 1080 (wide)',
  '1080x1080': '1080 \u00d7 1080 (square)',
  '1080x1350': '1080 \u00d7 1350 (portrait)',
};

/* ---------- layouts ---------- */
function panelRects(layout, W, H) {
  const g = Math.max(6, Math.round(W * 0.006));
  if (layout === 'triple-strip') {
    const w = (W - g * 4) / 3;
    return [
      { x: g, y: g, w, h: H - g * 2 },
      { x: g * 2 + w, y: g, w, h: H - g * 2 },
      { x: g * 3 + w * 2, y: g, w, h: H - g * 2 },
    ];
  }
  if (layout === 'hero-top') {
    const heroH = H * 0.60 - g * 1.5;
    const botH = H - heroH - g * 3;
    const botW = (W - g * 3) / 2;
    return [
      { x: g, y: g, w: W - g * 2, h: heroH },
      { x: g, y: g * 2 + heroH, w: botW, h: botH },
      { x: g * 2 + botW, y: g * 2 + heroH, w: botW, h: botH },
    ];
  }
  const heroW = W * 0.60 - g * 1.5;
  const sideW = W - heroW - g * 3;
  const sideH = (H - g * 3) / 2;
  return [
    { x: g, y: g, w: heroW, h: H - g * 2 },
    { x: g * 2 + heroW, y: g, w: sideW, h: sideH },
    { x: g * 2 + heroW, y: g * 2 + sideH, w: sideW, h: sideH },
  ];
}

/* ---------- panel + grade + caption painting ---------- */
function drawPanelImage(ctx, img, rect, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + panel.x * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + panel.y * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function applyGrade(ctx, W, H, grade) {
  ctx.save();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,122,26,0.10)');
    g.addColorStop(0.6, 'rgba(255,46,136,0.10)');
    g.addColorStop(1, 'rgba(90,10,60,0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,150,60,0.16)';
    ctx.fillRect(0, 0, W, H);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(122,46,255,0.16)');
    g.addColorStop(0.5, 'rgba(255,46,136,0.10)');
    g.addColorStop(1, 'rgba(46,230,255,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(46,230,255,0.12)';
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(27,42,107,0.20)');
    g.addColorStop(1, 'rgba(10,6,30,0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(90,60,180,0.12)';
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function fitCaptionFont(ctx, text, maxWidth, startPx, family, weight) {
  let px = startPx;
  ctx.font = weight + ' ' + px + 'px ' + family;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = weight + ' ' + px + 'px ' + family;
  }
  return px;
}

function drawCaptionBlock(ctx, W, H) {
  const bandH = H * 0.30;
  const bandY = H - bandH;
  const g = ctx.createLinearGradient(0, bandY - H * 0.08, 0, H);
  g.addColorStop(0, 'rgba(5,2,12,0)');
  g.addColorStop(0.45, 'rgba(5,2,12,0.72)');
  g.addColorStop(1, 'rgba(5,2,12,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, bandY - H * 0.08, W, bandH + H * 0.08);

  const pad = W * 0.045;
  const family = '"Noto Sans Display Condensed", "Arial Narrow", sans-serif';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffc53d';
  ctx.font = '700 ' + Math.round(W * 0.016) + 'px ' + family;
  ctx.textAlign = 'left';
  const eyebrow = 'V I C E   N I G H T S   \u2022   C O V E R   S T U D I O';
  ctx.fillText(eyebrow, pad, H - bandH + H * 0.075);

  const caption = (state.caption || 'VICE NIGHTS').toUpperCase();
  const capPx = fitCaptionFont(ctx, caption, W - pad * 2, Math.round(W * 0.105), family, 900);
  ctx.font = '900 ' + capPx + 'px ' + family;
  ctx.textAlign = 'left';
  const capY = H - H * 0.085;
  ctx.lineWidth = Math.max(3, capPx * 0.055);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(caption, pad, capY);
  const grad = ctx.createLinearGradient(0, capY - capPx, 0, capY);
  if (state.grade === 'neon') {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#ffd9ec');
    grad.addColorStop(1, '#ff2e88');
  } else if (state.grade === 'dusk') {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#e8e4ff');
    grad.addColorStop(1, '#9db4ff');
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.55, '#ffe9a8');
    grad.addColorStop(1, '#ff7a1a');
  }
  ctx.fillStyle = grad;
  ctx.fillText(caption, pad, capY);

  if (state.tagline) {
    ctx.font = '700 ' + Math.round(W * 0.021) + 'px ' + family;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(state.tagline, pad, H - H * 0.028);
  }
}

/* ---------- master render ---------- */
function renderCover(ctx, W, H) {
  ctx.fillStyle = '#0d0714';
  ctx.fillRect(0, 0, W, H);
  const rects = panelRects(state.layout, W, H);
  for (let i = 0; i < 3; i++) {
    const panel = state.panels[i];
    const img = panel.source === 'photo' && panel.photo ? panel.photo : getSceneCanvas(panel.source);
    drawPanelImage(ctx, img, rects[i], panel);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, W * 0.002);
  for (const r of rects) ctx.strokeRect(r.x, r.y, r.w, r.h);
  applyGrade(ctx, W, H, state.grade);
  drawCaptionBlock(ctx, W, H);
}

function renderPreview() {
  const canvas = document.getElementById('coverCanvas');
  const [W, H] = SIZES[state.size];
  const scale = Math.min(1, 960 / W);
  const pw = Math.round(W * scale);
  const ph = Math.round(H * scale);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  renderCover(canvas.getContext('2d'), pw, ph);
  document.getElementById('sizeLabel').textContent = 'Preview \u2014 ' + SIZE_LABELS[state.size];
}

/* ---------- export ---------- */
function exportCoverPNG(w, h) {
  return new Promise((resolve, reject) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    renderCover(c.getContext('2d'), w, h);
    c.toBlob((blob) => {
      if (!blob) { reject(new Error('PNG encode failed')); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vice-nights-cover-' + w + 'x' + h + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('PNG read failed'));
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}

function setStatus(text) {
  document.getElementById('statusLine').textContent = text;
}

/* ---------- UI wiring ---------- */
function bindControls() {
  document.querySelectorAll('input[name="layout"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.layout = radio.value;
      renderPreview();
      setStatus('Layout: ' + radio.value + '.');
    });
  });

  document.querySelectorAll('.grade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.grade-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.grade = btn.dataset.grade;
      renderPreview();
      setStatus('Grade: ' + state.grade + '.');
    });
  });

  document.getElementById('captionInput').addEventListener('input', (e) => {
    state.caption = e.target.value;
    renderPreview();
  });
  document.getElementById('taglineInput').addEventListener('input', (e) => {
    state.tagline = e.target.value;
    renderPreview();
  });

  for (let i = 0; i < 3; i++) {
    const idx = i;
    document.getElementById('panelSource' + idx).addEventListener('change', (e) => {
      state.panels[idx].source = e.target.value;
      if (e.target.value !== 'photo') state.panels[idx].photo = null;
      renderPreview();
      setStatus('Panel ' + (idx + 1) + ' source: ' + e.target.value + '.');
    });
    document.getElementById('panelFile' + idx).addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          state.panels[idx].photo = img;
          state.panels[idx].source = 'photo';
          document.getElementById('panelSource' + idx).value = 'photo';
          renderPreview();
          setStatus('Panel ' + (idx + 1) + ' loaded your photo: ' + file.name + '.');
        };
        img.onerror = () => setStatus('Could not read that photo file.');
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    const zoom = document.getElementById('panelZoom' + idx);
    zoom.addEventListener('input', () => {
      state.panels[idx].zoom = parseFloat(zoom.value);
      document.getElementById('panelZoom' + idx + 'Value').textContent = parseFloat(zoom.value).toFixed(2) + '\u00d7';
      renderPreview();
    });
    const px = document.getElementById('panelX' + idx);
    px.addEventListener('input', () => {
      state.panels[idx].x = parseFloat(px.value);
      document.getElementById('panelX' + idx + 'Value').textContent = px.value;
      renderPreview();
    });
    const py = document.getElementById('panelY' + idx);
    py.addEventListener('input', () => {
      state.panels[idx].y = parseFloat(py.value);
      document.getElementById('panelY' + idx + 'Value').textContent = py.value;
      renderPreview();
    });
  }

  document.getElementById('fillAllBtn').addEventListener('click', () => {
    const first = state.panels[0];
    for (let i = 1; i < 3; i++) {
      state.panels[i].source = first.source;
      state.panels[i].photo = first.photo;
      document.getElementById('panelSource' + i).value = first.source;
    }
    renderPreview();
    setStatus('All three panels now use Panel 1\u2019s photo.');
  });

  document.querySelectorAll('.export-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const [w, h] = btn.dataset.size.split('x').map(Number);
      state.size = btn.dataset.size;
      renderPreview();
      setStatus('Exporting ' + w + ' \u00d7 ' + h + ' PNG\u2026');
      try {
        await exportCoverPNG(w, h);
        setStatus('Exported vice-nights-cover-' + w + 'x' + h + '.png \u2014 check your downloads.');
      } catch (err) {
        setStatus('Export failed: ' + err.message);
      }
    });
  });
}

/* ---------- boot ---------- */
function boot() {
  bindControls();
  renderPreview();
  if (document.fonts && document.fonts.ready) {
    document.fonts.load('900 100px "Noto Sans Display Condensed"').then(renderPreview).catch(() => {});
    document.fonts.load('700 40px "Noto Sans Display Condensed"').then(renderPreview).catch(() => {});
    document.fonts.ready.then(renderPreview).catch(() => {});
  }
  const params = new URLSearchParams(location.search);
  if (params.get('shot') === 'cover') {
    const layout = params.get('layout');
    const grade = params.get('grade');
    if (layout && panelRects(layout, 100, 100)) state.layout = layout;
    if (grade === 'sunset' || grade === 'neon' || grade === 'dusk') state.grade = grade;
    renderPreview();
  }
}

window.__studio = {
  state,
  renderPreview,
  exportCoverPNG,
  setLayout(layout) { state.layout = layout; renderPreview(); },
  setGrade(grade) { state.grade = grade; renderPreview(); },
  setSize(size) { state.size = size; renderPreview(); },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
