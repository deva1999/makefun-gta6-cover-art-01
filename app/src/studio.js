// Vice Nights — Cover Studio: a canvas poster renderer and its editor.
// One canvas draws the whole poster (three photo panels + a title band) and
// the same drawing routine exports the PNG and paints the preset thumbnails.

const SIZES = {
  square: { label: "1080 × 1080 · square", width: 1080, height: 1080 },
  portrait: { label: "1080 × 1350 · portrait", width: 1080, height: 1350 },
  wide: { label: "1920 × 1080 · wide", width: 1920, height: 1080 },
};

// Panel rectangles as fractions of the poster, one layout per post size.
// Portrait and square stack a hero on top, a title band, and two panels below;
// wide puts a tall hero on the left and the title band plus two portrait
// panels in the right column, so faces still fit in a landscape poster.
const LAYOUTS = {
  portrait: {
    hero: { x: 0, y: 0, w: 1, h: 0.5 },
    left: { x: 0, y: 0.66, w: 0.56, h: 0.34 },
    right: { x: 0.56, y: 0.66, w: 0.44, h: 0.34 },
    band: { x: 0, y: 0.5, w: 1, h: 0.16 },
  },
  square: {
    hero: { x: 0, y: 0, w: 1, h: 0.5 },
    left: { x: 0, y: 0.66, w: 0.56, h: 0.34 },
    right: { x: 0.56, y: 0.66, w: 0.44, h: 0.34 },
    band: { x: 0, y: 0.5, w: 1, h: 0.16 },
  },
  wide: {
    hero: { x: 0, y: 0, w: 0.52, h: 1 },
    left: { x: 0.52, y: 0.26, w: 0.24, h: 0.74 },
    right: { x: 0.76, y: 0.26, w: 0.24, h: 0.74 },
    band: { x: 0.52, y: 0, w: 0.48, h: 0.26 },
  },
};
const PANELS = ["hero", "left", "right"];

const SAMPLES = {
  boulevard: "samples/boulevard.jpg",
  pier: "samples/pier.jpg",
};

const GRADES = {
  sunset: {
    filter: "saturate(1.3) contrast(1.06) brightness(1.02)",
    stops: ["rgba(255, 140, 60, 0.20)", "rgba(255, 60, 120, 0.16)", "rgba(120, 40, 180, 0.10)"],
    blend: "overlay",
  },
  neon: {
    filter: "saturate(1.45) contrast(1.1)",
    stops: ["rgba(0, 240, 255, 0.16)", "rgba(255, 40, 220, 0.16)", "rgba(90, 40, 255, 0.12)"],
    blend: "overlay",
  },
  dusk: {
    filter: "saturate(1.1) contrast(1.04) brightness(0.96)",
    stops: ["rgba(70, 50, 200, 0.20)", "rgba(160, 60, 160, 0.14)", "rgba(20, 10, 60, 0.16)"],
    blend: "soft-light",
  },
  mono: {
    filter: "grayscale(1) contrast(1.12) brightness(1.03)",
    stops: ["rgba(255, 255, 255, 0.05)", "rgba(0, 0, 0, 0.08)"],
    blend: "overlay",
  },
};

const TITLE_GRADIENTS = {
  sunset: ["#ffd166", "#ff5e78", "#c86bff"],
  neon: ["#7df9ff", "#ff5df2", "#7b61ff"],
  gold: ["#ffe259", "#ffa751", "#ff7e2e"],
  mono: ["#ffffff", "#e8e8e8", "#bdbdbd"],
};

const PRESETS = {
  "sunset-boulevard": {
    size: "portrait", grade: "sunset", titleGradient: "sunset",
    title: "VICE NIGHTS", subtitle: "A COVER STORY IN THREE PANELS",
    panels: {
      hero: { photo: "boulevard", zoom: 1.0, ox: 0, oy: 0.55 },
      left: { photo: "pier", zoom: 1.2, ox: 0, oy: 0 },
      right: { photo: "boulevard", zoom: 1.35, ox: 0.08, oy: 0.18 },
    },
  },
  "neon-pier": {
    size: "wide", grade: "neon", titleGradient: "neon",
    title: "NEON PIER", subtitle: "MIDNIGHT ON THE BOARDWALK",
    panels: {
      hero: { photo: "pier", zoom: 1.15, ox: 0, oy: 0.05 },
      left: { photo: "boulevard", zoom: 1.3, ox: 0, oy: 0.15 },
      right: { photo: "pier", zoom: 1.5, ox: 0.05, oy: 0.1 },
    },
  },
  "dusk-mix": {
    size: "square", grade: "dusk", titleGradient: "gold",
    title: "DUSK MIX", subtitle: "TWO STREETS, ONE NIGHT",
    panels: {
      hero: { photo: "pier", zoom: 1.15, ox: 0, oy: 0.3 },
      left: { photo: "pier", zoom: 1.4, ox: -0.08, oy: 0.2 },
      right: { photo: "boulevard", zoom: 1.2, ox: 0, oy: 0.25 },
    },
  },
};

const state = {
  size: "portrait",
  grade: "sunset",
  titleGradient: "sunset",
  title: "VICE NIGHTS",
  subtitle: "A COVER STORY IN THREE PANELS",
  titleScale: 1,
  activePanel: "hero",
  panels: {
    hero: { photo: "boulevard", zoom: 1.0, ox: 0, oy: 0.55 },
    left: { photo: "pier", zoom: 1.2, ox: 0, oy: 0 },
    right: { photo: "boulevard", zoom: 1.35, ox: 0.08, oy: 0.18 },
  },
};

const canvas = document.getElementById("poster");
const ctx = canvas.getContext("2d");
const imageCache = new Map();

function loadPhoto(key) {
  const src = SAMPLES[key] ?? key;
  if (!imageCache.has(src)) {
    const img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return imageCache.get(src);
}

function photoReady(key) {
  const img = loadPhoto(key);
  return img.complete && img.naturalWidth > 0;
}

function allPhotosReady(panelSet) {
  return Object.values(panelSet).every((p) => photoReady(p.photo));
}

// Draw one photo into a panel rect, cover-fit, with zoom and pan offsets.
// The pan is clamped so the photo always covers the panel: no empty edges,
// however far the sliders or a drag push it.
function drawPanelPhoto(target, rect, panel, grade) {
  const img = loadPhoto(panel.photo);
  if (!img.complete || img.naturalWidth === 0) return;
  const { x, y, w, h } = rect;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const maxOx = Math.max(0, (dw - w) / 2 / w);
  const maxOy = Math.max(0, (dh - h) / 2 / h);
  const ox = Math.max(-maxOx, Math.min(maxOx, panel.ox));
  const oy = Math.max(-maxOy, Math.min(maxOy, panel.oy));
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
  target.save();
  target.beginPath();
  target.rect(x, y, w, h);
  target.clip();
  target.filter = grade.filter;
  target.drawImage(img, dx, dy, dw, dh);
  target.restore();
}

function drawGradeWash(target, width, height, grade) {
  const wash = target.createLinearGradient(0, 0, width, height);
  grade.stops.forEach((color, i) => wash.addColorStop(i / (grade.stops.length - 1), color));
  target.save();
  target.globalCompositeOperation = grade.blend;
  target.fillStyle = wash;
  target.fillRect(0, 0, width, height);
  target.restore();
}

function drawTitleBand(target, width, height, snap, layout) {
  const f = layout.band;
  const band = {
    x: f.x * width,
    y: f.y * height,
    w: f.w * width,
    h: f.h * height,
  };
  target.fillStyle = "#0e0b14";
  target.fillRect(band.x, band.y, band.w, band.h);

  // Thin gradient rule above the title.
  const rule = target.createLinearGradient(band.x, 0, band.x + band.w, 0);
  rule.addColorStop(0, "#ffb347");
  rule.addColorStop(0.5, "#ff5e78");
  rule.addColorStop(1, "#b967ff");
  target.fillStyle = rule;
  target.fillRect(band.x + width * 0.04, band.y + band.h * 0.1, band.w * 0.92, Math.max(3, height * 0.004));

  const titleSize = height * 0.082 * snap.titleScale;
  target.font = `900 ${titleSize}px ViceCond, "Arial Narrow", sans-serif`;
  target.textBaseline = "middle";
  const titleX = band.x + width * 0.045;
  const titleY = band.y + band.h * 0.48;
  const grad = target.createLinearGradient(titleX, 0, titleX + target.measureText(snap.title).width, 0);
  const colors = TITLE_GRADIENTS[snap.titleGradient];
  colors.forEach((color, i) => grad.addColorStop(i / (colors.length - 1), color));
  target.save();
  target.shadowColor = "rgba(0, 0, 0, 0.5)";
  target.shadowBlur = height * 0.008;
  target.shadowOffsetY = height * 0.003;
  target.lineWidth = Math.max(2, height * 0.003);
  target.strokeStyle = "rgba(12, 6, 18, 0.9)";
  target.strokeText(snap.title, titleX, titleY);
  target.fillStyle = grad;
  target.fillText(snap.title, titleX, titleY);
  target.restore();

  const subSize = Math.max(14, height * 0.02);
  target.font = `700 ${subSize}px ViceCond, "Arial Narrow", sans-serif`;
  if ("letterSpacing" in target) target.letterSpacing = `${Math.max(2, height * 0.004)}px`;
  target.fillStyle = "rgba(244, 240, 255, 0.85)";
  target.fillText(snap.subtitle, titleX, band.y + band.h * 0.84);
  if ("letterSpacing" in target) target.letterSpacing = "0px";
}

// The one routine that paints a poster: panels, grade, title band.
function drawPoster(target, width, height, snap) {
  const layout = LAYOUTS[snap.size];
  const grade = GRADES[snap.grade];
  target.fillStyle = "#0d0b12";
  target.fillRect(0, 0, width, height);
  const gutter = Math.max(6, width * 0.012);
  for (const name of PANELS) {
    const f = layout[name];
    const rect = {
      x: f.x * width + gutter / 2,
      y: f.y * height + gutter / 2,
      w: f.w * width - gutter,
      h: f.h * height - gutter,
    };
    drawPanelPhoto(target, rect, snap.panels[name], grade);
    target.strokeStyle = "rgba(255, 255, 255, 0.16)";
    target.lineWidth = 1;
    target.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  }
  drawGradeWash(target, width, height, grade);
  drawTitleBand(target, width, height, snap, layout);
}

function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

function render() {
  const { width, height } = SIZES[state.size];
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  drawPoster(ctx, width, height, snapshot());
  document.getElementById("sizeNote").textContent = SIZES[state.size].label;
  renderThumbs();
}

function renderThumbs() {
  for (const thumb of document.querySelectorAll(".thumb")) {
    const preset = PRESETS[thumb.dataset.preset];
    if (!preset || !allPhotosReady(preset.panels)) continue;
    const tctx = thumb.getContext("2d");
    const snap = {
      size: preset.size,
      grade: preset.grade,
      titleGradient: preset.titleGradient,
      title: preset.title,
      subtitle: preset.subtitle,
      titleScale: 1,
      panels: preset.panels,
    };
    drawPoster(tctx, thumb.width, thumb.height, snap);
  }
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.size = preset.size;
  state.grade = preset.grade;
  state.titleGradient = preset.titleGradient;
  state.title = preset.title;
  state.subtitle = preset.subtitle;
  state.titleScale = 1;
  state.panels = JSON.parse(JSON.stringify(preset.panels));
  syncControls();
  render();
}

function setSize(name) {
  if (!SIZES[name]) return;
  state.size = name;
  syncControls();
  render();
}

function setGrade(name) {
  if (!GRADES[name]) return;
  state.grade = name;
  syncControls();
  render();
}

function syncControls() {
  for (const btn of document.querySelectorAll("#sizeSeg button")) {
    btn.classList.toggle("active", btn.dataset.size === state.size);
  }
  for (const btn of document.querySelectorAll("#panelSeg button")) {
    btn.classList.toggle("active", btn.dataset.panel === state.activePanel);
  }
  for (const btn of document.querySelectorAll("#gradeSwatches button")) {
    btn.classList.toggle("active", btn.dataset.grade === state.grade);
  }
  const panel = state.panels[state.activePanel];
  document.getElementById("photoSelect").value = SAMPLES[panel.photo] ? panel.photo : "upload";
  document.getElementById("zoomRange").value = panel.zoom;
  document.getElementById("zoomVal").textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById("panXRange").value = panel.ox;
  document.getElementById("panXVal").textContent = panel.ox.toFixed(2);
  document.getElementById("panYRange").value = panel.oy;
  document.getElementById("panYVal").textContent = panel.oy.toFixed(2);
  document.getElementById("titleInput").value = state.title;
  document.getElementById("subtitleInput").value = state.subtitle;
  document.getElementById("titleSizeRange").value = Math.round(state.titleScale * 100);
  document.getElementById("titleSizeVal").textContent = `${Math.round(state.titleScale * 100)}%`;
  document.getElementById("titleGradientSelect").value = state.titleGradient;
}

function exportCover() {
  return new Promise((resolve, reject) => {
    render();
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("export failed"));
      const reader = new FileReader();
      reader.onload = () => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vice-nights-${state.size}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        resolve({
          dataUrl: reader.result,
          width: canvas.width,
          height: canvas.height,
          filename: a.download,
        });
      };
      reader.onerror = () => reject(new Error("export read failed"));
      reader.readAsDataURL(blob);
    }, "image/png");
  });
}

function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const fx = (clientX - box.left) / box.width;
  const fy = (clientY - box.top) / box.height;
  const layout = LAYOUTS[state.size];
  for (const name of PANELS) {
    const f = layout[name];
    if (fx >= f.x && fx < f.x + f.w && fy >= f.y && fy < f.y + f.h) return name;
  }
  return null;
}

function wireControls() {
  document.getElementById("sizeSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-size]");
    if (btn) setSize(btn.dataset.size);
  });
  document.getElementById("panelSeg").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-panel]");
    if (!btn) return;
    state.activePanel = btn.dataset.panel;
    syncControls();
  });
  document.getElementById("gradeSwatches").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-grade]");
    if (btn) setGrade(btn.dataset.grade);
  });
  document.getElementById("photoSelect").addEventListener("change", (e) => {
    const value = e.target.value;
    if (value === "upload") return;
    state.panels[state.activePanel].photo = value;
    render();
  });
  document.getElementById("photoUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.panels[state.activePanel].photo = reader.result;
      const select = document.getElementById("photoSelect");
      if (!select.querySelector('option[value="upload"]')) {
        const opt = document.createElement("option");
        opt.value = "upload";
        opt.textContent = "Your upload";
        select.appendChild(opt);
      }
      select.value = "upload";
      render();
    };
    reader.readAsDataURL(file);
  });
  const bindRange = (id, apply) => {
    document.getElementById(id).addEventListener("input", (e) => {
      apply(parseFloat(e.target.value));
      render();
    });
  };
  bindRange("zoomRange", (v) => { state.panels[state.activePanel].zoom = v; syncControls(); });
  bindRange("panXRange", (v) => { state.panels[state.activePanel].ox = v; syncControls(); });
  bindRange("panYRange", (v) => { state.panels[state.activePanel].oy = v; syncControls(); });
  bindRange("titleSizeRange", (v) => { state.titleScale = v / 100; syncControls(); });
  document.getElementById("titleInput").addEventListener("input", (e) => {
    state.title = e.target.value.toUpperCase();
    render();
  });
  document.getElementById("subtitleInput").addEventListener("input", (e) => {
    state.subtitle = e.target.value.toUpperCase();
    render();
  });
  document.getElementById("titleGradientSelect").addEventListener("change", (e) => {
    state.titleGradient = e.target.value;
    render();
  });
  document.getElementById("exportBtn").addEventListener("click", () => {
    exportCover().catch((err) => console.error(err));
  });
  document.getElementById("surpriseBtn").addEventListener("click", () => {
    const grades = Object.keys(GRADES);
    const gradients = Object.keys(TITLE_GRADIENTS);
    const photos = Object.keys(SAMPLES);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    state.grade = pick(grades);
    state.titleGradient = pick(gradients);
    for (const name of Object.keys(state.panels)) {
      state.panels[name].photo = pick(photos);
      state.panels[name].zoom = 1.05 + Math.random() * 0.45;
      state.panels[name].ox = (Math.random() - 0.5) * 0.4;
      state.panels[name].oy = (Math.random() - 0.5) * 0.4;
    }
    syncControls();
    render();
  });
  document.getElementById("gallery").addEventListener("click", (e) => {
    const thumb = e.target.closest(".thumb");
    if (thumb) applyPreset(thumb.dataset.preset);
  });

  // Drag a photo inside its panel to pan it; a plain click selects the panel.
  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    const name = panelAt(e.clientX, e.clientY);
    if (!name) return;
    canvas.setPointerCapture(e.pointerId);
    drag = { panel: name, x: e.clientX, y: e.clientY, moved: false };
    state.activePanel = name;
    syncControls();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const box = canvas.getBoundingClientRect();
    const f = LAYOUTS[state.size][drag.panel];
    const dx = (e.clientX - drag.x) / box.width / f.w;
    const dy = (e.clientY - drag.y) / box.height / f.h;
    if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) drag.moved = true;
    if (!drag.moved) return;
    const panel = state.panels[drag.panel];
    panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox + dx));
    panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy + dy));
    drag.x = e.clientX;
    drag.y = e.clientY;
    syncControls();
    render();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
}

async function boot() {
  wireControls();
  syncControls();
  try {
    await Promise.all([
      document.fonts.load('900 100px ViceCond'),
      document.fonts.load('700 40px ViceCond'),
      ...Object.keys(SAMPLES).map((key) => new Promise((resolve) => {
        const img = loadPhoto(key);
        if (img.complete) resolve();
        else { img.onload = resolve; img.onerror = resolve; }
      })),
    ]);
  } catch (err) {
    console.warn("font/photo preload", err);
  }
  render();
  window.viceStudio = {
    state,
    setSize,
    setGrade,
    applyPreset,
    exportCover,
    render,
    ready: true,
  };
}

boot();
