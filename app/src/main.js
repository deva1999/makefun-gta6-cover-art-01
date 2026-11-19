// Wires the page: three photo slots, one caption, three grades, three export
// sizes, and a live preview you can drag to crop and scroll to zoom. Photos
// are read on this machine and never leave it. A `?shot=` query sets up a
// fixed scene for a screenshot instead (./shots.js).
import { drawCover, ensureCoverFonts, layoutPanels, SIZES, GRADES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const captionInput = document.getElementById('caption');
const taglineInput = document.getElementById('tagline');
const sizeButtons = [...document.querySelectorAll('[data-size]')];
const gradeButtons = [...document.querySelectorAll('[data-grade]')];
const panelButtons = [...document.querySelectorAll('[data-panel]')];
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const exportButton = document.getElementById('export');

const state = {
  photos: [null, null, null],
  transforms: [
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
  ],
  caption: 'Neon Getaway',
  tagline: 'One last ride into the sunset',
  grade: 'sunset',
  size: 'landscape',
  selectedPanel: 0,
};

let fontsReady = false;

function currentSize() {
  return SIZES[state.size];
}

/** Sizes the preview canvas to the export size, then paints the cover. */
function redraw() {
  const { width, height } = currentSize();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  drawCover(canvas, state);
  syncPanelControls();
}

/** Mirrors the selected panel's crop into the sliders. */
function syncPanelControls() {
  const t = state.transforms[state.selectedPanel];
  zoomInput.value = String(Math.round(t.zoom * 100));
  panXInput.value = String(Math.round(t.dx * 100));
  panYInput.value = String(Math.round(t.dy * 100));
  panelButtons.forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.panel) === state.selectedPanel);
    b.setAttribute('aria-pressed', String(Number(b.dataset.panel) === state.selectedPanel));
  });
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function loadFileIntoSlot(file, slot) {
  if (!file) return;
  state.photos[slot] = await loadImage(URL.createObjectURL(file));
  state.selectedPanel = slot;
  redraw();
}

async function loadSampleIntoSlot(name, slot) {
  state.photos[slot] = await loadImage(`./samples/${name}.jpg`);
  state.selectedPanel = slot;
  redraw();
}

/** One photo fills every panel slot, so a single portrait covers the poster. */
function fillAllWith(slot) {
  const photo = state.photos[slot];
  if (!photo) return;
  state.photos = [photo, photo, photo];
  redraw();
}

function setSize(size) {
  if (!SIZES[size]) return;
  state.size = size;
  sizeButtons.forEach((b) => b.classList.toggle('active', b.dataset.size === size));
  exportButton.textContent = `Export PNG ${SIZES[size].label}`;
  redraw();
}

function setGrade(grade) {
  if (!GRADES[grade]) return;
  state.grade = grade;
  gradeButtons.forEach((b) => b.classList.toggle('active', b.dataset.grade === grade));
  redraw();
}

/** Renders the cover at full export size and downloads it as a PNG. */
export async function exportPng() {
  const started = performance.now();
  const { width, height } = currentSize();
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  drawCover(off, state);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const ms = Math.round(performance.now() - started);
  const name = `vice-nights-${width}x${height}.png`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  statusEl.textContent = `Exported ${name} (${(blob.size / 1024).toFixed(0)} KiB) in ${ms} ms.`;
  return { name, bytes: blob.size, width, height, ms };
}

// Photo slots: file pick, sample, fill-all.
document.querySelectorAll('[data-slot]').forEach((slotEl) => {
  const slot = Number(slotEl.dataset.slot);
  slotEl.querySelector('input[type=file]').addEventListener('change', (e) => {
    loadFileIntoSlot(e.target.files[0], slot).catch((err) => {
      statusEl.textContent = `That photo could not be read: ${err.message}`;
    });
  });
  slotEl.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadSampleIntoSlot(btn.dataset.sample, slot).catch((err) => {
        statusEl.textContent = `Sample could not load: ${err.message}`;
      });
    });
  });
  slotEl.querySelector('[data-fillall]').addEventListener('click', () => fillAllWith(slot));
});

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });
sizeButtons.forEach((b) => b.addEventListener('click', () => setSize(b.dataset.size)));
gradeButtons.forEach((b) => b.addEventListener('click', () => setGrade(b.dataset.grade)));
panelButtons.forEach((b) => b.addEventListener('click', () => {
  state.selectedPanel = Number(b.dataset.panel);
  syncPanelControls();
}));
zoomInput.addEventListener('input', () => {
  state.transforms[state.selectedPanel].zoom = Number(zoomInput.value) / 100;
  redraw();
});
panXInput.addEventListener('input', () => {
  state.transforms[state.selectedPanel].dx = Number(panXInput.value) / 100;
  redraw();
});
panYInput.addEventListener('input', () => {
  state.transforms[state.selectedPanel].dy = Number(panYInput.value) / 100;
  redraw();
});
exportButton.addEventListener('click', () => {
  exportPng().catch((err) => { statusEl.textContent = `Export failed: ${err.message}`; });
});

// Drag the preview to pan the selected panel; scroll to zoom it.
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const px = ((clientX - r.left) / r.width) * canvas.width;
  const py = ((clientY - r.top) / r.height) * canvas.height;
  const { panels } = layoutPanels(canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (px >= p.x && px < p.x + p.w && py >= p.y && py < p.y + p.h) return i;
  }
  return 0;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const panel = panelAt(e.clientX, e.clientY);
  state.selectedPanel = panel;
  const t = state.transforms[panel];
  drag = { x: e.clientX, y: e.clientY, dx: t.dx, dy: t.dy };
  canvas.setPointerCapture(e.pointerId);
  syncPanelControls();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const r = canvas.getBoundingClientRect();
  const t = state.transforms[state.selectedPanel];
  t.dx = Math.max(-0.5, Math.min(0.5, drag.dx + (e.clientX - drag.x) / r.width));
  t.dy = Math.max(-0.5, Math.min(0.5, drag.dy + (e.clientY - drag.y) / r.height));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const t = state.transforms[state.selectedPanel];
  t.zoom = Math.max(1, Math.min(3, t.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
  redraw();
}, { passive: false });

// Test seam: readiness plus a JSON snapshot of the editor state.
window.__TEST__ = {
  get ready() { return fontsReady; },
  state: () => ({
    size: state.size,
    grade: state.grade,
    caption: state.caption,
    tagline: state.tagline,
    selectedPanel: state.selectedPanel,
    photosLoaded: state.photos.map((p) => Boolean(p)),
    transforms: state.transforms.map((t) => ({ ...t })),
    exportPng,
  }),
};

const shot = new URLSearchParams(location.search).get('shot');
ensureCoverFonts().then(() => {
  fontsReady = true;
  if (shot) {
    runShot(shot, new URLSearchParams(location.search), {
      loadSample: loadSampleIntoSlot,
      setCaption: (caption, tagline) => {
        state.caption = caption;
        state.tagline = tagline;
        captionInput.value = caption;
        taglineInput.value = tagline;
      },
      setGrade,
      setSize,
      setTransform: (panel, t) => { Object.assign(state.transforms[panel], t); },
      redraw,
    });
  }
  redraw();
});
