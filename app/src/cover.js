// Vice Nights cover engine: draws a multi-panel poster cover in the style of a
// Vice City sunset poster — several photo panels under one bold caption — onto
// any canvas. No Rockstar artwork, logo, wordmark or font is used anywhere: the
// skyline, the sun and the lettering are all drawn here from scratch, and the
// caption face is a file under app/fonts/ under the SIL Open Font License.
//
// Everything drawn here is deterministic: the skyline and the grain use a seeded
// generator, so the same state always paints the same pixels.

export const SIZES = {
  landscape: { width: 1920, height: 1080, label: '1920 x 1080' },
  square: { width: 1080, height: 1080, label: '1080 x 1080' },
  portrait: { width: 1080, height: 1350, label: '1080 x 1350' },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    skyTop: '#2b0a4e', skyMid: '#c2276b', skyLow: '#ff7a3d',
    sun: '#ffd166', sunCore: '#fff3c4',
    gradeTop: 'rgba(255, 46, 136, 0)', gradeLow: 'rgba(255, 122, 61, 0.34)',
    band: '#160a20', rule: ['#ff2e88', '#ff7a3d', '#29e6ff'],
    caption: '#ffffff', tagline: '#ffb347', accent: '#ff2e88',
  },
  neon: {
    name: 'Neon',
    skyTop: '#060b2e', skyMid: '#7a1fa2', skyLow: '#00c2ff',
    sun: '#ff5df2', sunCore: '#ffe9fd',
    gradeTop: 'rgba(41, 230, 255, 0)', gradeLow: 'rgba(255, 93, 242, 0.30)',
    band: '#080a24', rule: ['#29e6ff', '#ff5df2', '#7affd8'],
    caption: '#ffffff', tagline: '#7affd8', accent: '#29e6ff',
  },
  dusk: {
    name: 'Dusk',
    skyTop: '#0d1030', skyMid: '#3b2a7a', skyLow: '#e2607a',
    sun: '#ff9d76', sunCore: '#ffe8d6',
    gradeTop: 'rgba(59, 42, 122, 0)', gradeLow: 'rgba(226, 96, 122, 0.32)',
    band: '#120e26', rule: ['#8f7bff', '#e2607a', '#ffb347'],
    caption: '#ffffff', tagline: '#c9b8ff', accent: '#8f7bff',
  },
};

/** Small seeded generator, so skylines and grain paint identically every run. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Panel geometry for a cover of width w and height h. Three photo panels sit
 * above one caption band: a hero panel plus two smaller ones, arranged for the
 * aspect (landscape: hero left, pair stacked right; square: hero top-left,
 * pair right; portrait: hero on top, pair in a row beneath it).
 */
export function layoutPanels(w, h) {
  const bandH = Math.round(h * (w >= h ? 0.22 : w === h ? 0.30 : 0.26));
  const artH = h - bandH;
  let panels;
  if (w > h) {
    const heroW = Math.round(w * 0.60);
    panels = [
      { x: 0, y: 0, w: heroW, h: artH },
      { x: heroW, y: 0, w: w - heroW, h: Math.round(artH / 2) },
      { x: heroW, y: Math.round(artH / 2), w: w - heroW, h: artH - Math.round(artH / 2) },
    ];
  } else if (w === h) {
    const heroW = Math.round(w * 0.62);
    const halfH = Math.round(artH / 2);
    panels = [
      { x: 0, y: 0, w: heroW, h: artH },
      { x: heroW, y: 0, w: w - heroW, h: halfH },
      { x: heroW, y: halfH, w: w - heroW, h: artH - halfH },
    ];
  } else {
    const halfW = Math.round(w / 2);
    const midH = Math.round(artH * 0.28);
    panels = [
      { x: 0, y: 0, w, h: artH - midH },
      { x: 0, y: artH - midH, w: halfW, h: midH },
      { x: halfW, y: artH - midH, w: w - halfW, h: midH },
    ];
  }
  return { panels, band: { x: 0, y: artH, w, h: bandH } };
}

/** The fallback art for an empty panel: a synthwave sun over a lit skyline. */
export function drawSkyline(ctx, rect, grade, seed) {
  const { x, y, w, h } = rect;
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.55, grade.skyMid);
  sky.addColorStop(1, grade.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  // Slatted sun, low over the horizon.
  const sunR = Math.min(w, h) * 0.30;
  const cx = x + w * 0.5;
  const cy = y + h * 0.62;
  const sun = ctx.createLinearGradient(0, cy - sunR, 0, cy + sunR);
  sun.addColorStop(0, grade.sunCore);
  sun.addColorStop(1, grade.sun);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fillRect(cx - sunR, cy - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = sky;
  let gapY = cy + sunR * 0.05;
  let gapH = Math.max(2, sunR * 0.045);
  while (gapY < cy + sunR) {
    ctx.fillRect(cx - sunR, gapY, sunR * 2, gapH);
    gapY += gapH * 2.6;
    gapH *= 1.5;
  }
  ctx.restore();

  // Skyline: dark slabs with lit windows, seeded so it never changes.
  const rnd = mulberry32(seed);
  const horizon = y + h * 0.72;
  ctx.fillStyle = '#12081f';
  let bx = x;
  while (bx < x + w) {
    const bw = w * (0.06 + rnd() * 0.10);
    const bh = h * (0.10 + rnd() * 0.22);
    ctx.fillRect(bx, horizon - bh, bw, bh + (y + h - horizon));
    if (rnd() > 0.6) { // antenna on some slabs
      ctx.fillRect(bx + bw / 2 - 1, horizon - bh - h * 0.06, 2, h * 0.06);
    }
    // Lit windows on this slab.
    const cols = Math.max(1, Math.floor(bw / (w * 0.02)));
    const rows = Math.max(1, Math.floor(bh / (h * 0.045)));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rnd() > 0.62) {
          ctx.fillStyle = rnd() > 0.5 ? '#ffd166' : '#29e6ff';
          ctx.fillRect(bx + 3 + c * (w * 0.02), horizon - bh + 4 + r * (h * 0.045), w * 0.008, h * 0.018);
          ctx.fillStyle = '#12081f';
        }
      }
    }
    bx += bw + w * 0.008;
  }
  // Sea of light at the foot of the skyline.
  const glow = ctx.createLinearGradient(0, horizon, 0, y + h);
  glow.addColorStop(0, 'rgba(255, 122, 61, 0.25)');
  glow.addColorStop(1, 'rgba(18, 8, 31, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, horizon, w, y + h - horizon);
}

/**
 * One photo panel: the photo cover-fitted with a zoom and a pan, then the
 * grade wash and a white frame. `t` is { zoom, dx, dy } — dx/dy are fractions
 * of the panel size, zoom 1 means exactly cover-fitted.
 */
export function drawPhotoPanel(ctx, rect, photo, t, grade, seed) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (photo) {
    const zoom = t?.zoom ?? 1;
    const base = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * zoom;
    const pw = photo.naturalWidth * base;
    const ph = photo.naturalHeight * base;
    const ox = (t?.dx ?? 0) * w;
    const oy = (t?.dy ?? 0) * h;
    const px = x + (w - pw) / 2 + ox;
    const py = y + (h - ph) / 2 + oy;
    // Clamp the pan so the photo never leaves a gap at the panel edge.
    const cx = Math.max(Math.min(px, x), x + w - pw);
    const cy = Math.max(Math.min(py, y), y + h - ph);
    ctx.drawImage(photo, cx, cy, pw, ph);
  } else {
    drawSkyline(ctx, rect, grade, seed);
  }
  const wash = ctx.createLinearGradient(0, y, 0, y + h);
  wash.addColorStop(0, grade.gradeTop);
  wash.addColorStop(1, grade.gradeLow);
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // White poster frame around the panel.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.008));
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Fits one line of text to a width by shrinking it, never below a floor. */
export function fitFont(ctx, text, family, weight, startPx, maxWidth, minPx) {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > minPx && ctx.measureText(text).width > maxWidth) {
    size = Math.max(minPx, size - 2);
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** The caption band: neon rule, bold caption, tagline, and a small sun mark. */
export function drawCaptionBand(ctx, band, caption, tagline, grade, coverW) {
  const { x, y, w, h } = band;
  ctx.fillStyle = grade.band;
  ctx.fillRect(x, y, w, h);
  const ruleH = Math.max(3, Math.round(h * 0.03));
  const rule = ctx.createLinearGradient(x, 0, x + w, 0);
  grade.rule.forEach((c, i) => rule.addColorStop(i / (grade.rule.length - 1), c));
  ctx.fillStyle = rule;
  ctx.fillRect(x, y, w, ruleH);

  const text = (caption || '').trim().toUpperCase();
  const pad = w * 0.04;
  // The sun mark lives at the band's right edge; the caption is fitted to the
  // space left of it, so the two can never collide at any size.
  const sunR = h * 0.26;
  const sunSpace = sunR * 2 + pad * 1.5;
  const captionPx = fitFont(
    ctx, text || ' ', '"Vice Condensed", "Arial Narrow", sans-serif', '900',
    Math.round(h * 0.46), w - pad * 2 - sunSpace, Math.round(h * 0.10),
  );
  const captionY = y + h * 0.52;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (text) {
    ctx.lineWidth = Math.max(2, captionPx * 0.06);
    ctx.strokeStyle = '#12081f';
    ctx.lineJoin = 'round';
    ctx.shadowColor = grade.accent;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = Math.round(captionPx * 0.07);
    ctx.shadowOffsetY = Math.round(captionPx * 0.07);
    ctx.strokeText(text, x + pad, captionY);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = grade.caption;
    ctx.fillText(text, x + pad, captionY);
  }

  const line = (tagline || '').trim();
  if (line) {
    const tagPx = Math.round(h * 0.17);
    ctx.font = `700 ${tagPx}px "Vice Condensed", "Arial Narrow", sans-serif`;
    ctx.fillStyle = grade.tagline;
    ctx.fillText(line.toUpperCase(), x + pad, y + h * 0.85);
  }

  // Small slatted sun at the band's right edge; the caption was fitted to
  // leave this space, so it always fits.
  const sunX = x + w - pad - sunR;
  if (text) {
    const sunCx = sunX + sunR;
    const sunCy = y + h * 0.5;
    const sun = ctx.createLinearGradient(0, sunCy - sunR, 0, sunCy + sunR);
    sun.addColorStop(0, grade.sunCore);
    sun.addColorStop(1, grade.sun);
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunCx, sunCy, sunR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = sun;
    ctx.fillRect(sunCx - sunR, sunCy - sunR, sunR * 2, sunR * 2);
    ctx.fillStyle = grade.band;
    let gapY = sunCy + sunR * 0.1;
    let gapH = Math.max(1.5, sunR * 0.08);
    while (gapY < sunCy + sunR) {
      ctx.fillRect(sunCx - sunR, gapY, sunR * 2, gapH);
      gapY += gapH * 2.4;
      gapH *= 1.5;
    }
    ctx.restore();
  }
  void coverW;
}

/** Light print grain over the whole cover, seeded so it is stable. */
export function drawGrain(ctx, w, h) {
  const rnd = mulberry32(7);
  ctx.save();
  for (let i = 0; i < 900; i++) {
    const gx = rnd() * w;
    const gy = rnd() * h;
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.035)';
    ctx.fillRect(gx, gy, 1.6, 1.6);
  }
  ctx.restore();
}

/**
 * Paints a whole cover onto `canvas` (which must already be sized to the
 * export size). `state` is { photos, transforms, caption, tagline, grade }:
 * photos has one image per panel slot (or null), transforms one { zoom, dx, dy }
 * per panel, grade one key of GRADES.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, w, h);
  const { panels, band } = layoutPanels(w, h);
  panels.forEach((rect, i) => {
    const slot = [0, 1, 2][i];
    const photo = state.photos?.[slot] ?? state.photos?.[0] ?? null;
    drawPhotoPanel(ctx, rect, photo, state.transforms?.[i], grade, 11 + i * 17);
  });
  drawCaptionBand(ctx, band, state.caption, state.tagline, grade, w);
  drawGrain(ctx, w, h);
}

/** Loads the two vendored caption faces; resolves even if they fail to load. */
export async function ensureCoverFonts() {
  try {
    const black = new FontFace('Vice Condensed', 'url(./fonts/NotoSansDisplay-CondensedBlack.ttf)', { weight: '900' });
    const bold = new FontFace('Vice Condensed', 'url(./fonts/NotoSansDisplay-CondensedBold.ttf)', { weight: '700' });
    const [a, b] = await Promise.all([black.load(), bold.load()]);
    document.fonts.add(a);
    document.fonts.add(b);
    await document.fonts.load('900 100px "Vice Condensed"');
    await document.fonts.load('700 40px "Vice Condensed"');
  } catch (err) {
    // The canvas falls back to a system sans; the cover still draws.
    console.warn('cover font did not load, using fallback', err);
  }
}
