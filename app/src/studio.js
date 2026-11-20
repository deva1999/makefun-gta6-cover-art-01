"use strict";
// Vice Nights Cover Studio — panel state, drag/zoom, grades and PNG export.
const SAMPLES = ["samples/boulevard.jpg", "samples/pier.jpg", "samples/beach.jpg", "samples/boulevard.jpg"];
const GRADES = {
  sunset: { filter: "saturate(1.35) contrast(1.08) sepia(0.28) hue-rotate(-8deg)", wash: ["rgba(255,120,40,0.28)", "rgba(255,45,120,0.20)"] },
  neon: { filter: "saturate(1.6) contrast(1.2) hue-rotate(18deg) brightness(0.94)", wash: ["rgba(0,220,255,0.26)", "rgba(190,40,255,0.30)"] },
  dusk: { filter: "saturate(0.82) contrast(1.02) brightness(0.86) sepia(0.18) hue-rotate(12deg)", wash: ["rgba(70,60,160,0.30)", "rgba(20,10,50,0.28)"] }
};
const poster = document.getElementById("poster");
const panelEls = Array.from(document.querySelectorAll(".panel"));
const statusEl = document.getElementById("status");
const zoomRange = document.getElementById("zoomRange");
let grade = "sunset";
let selected = 0;
const panels = panelEls.map(() => ({ img: null, url: "", x: 0, y: 0, zoom: 1 }));

function say(msg) { statusEl.textContent = msg; }

function layoutPanel(i) {
  const p = panels[i], el = panelEls[i], img = el.querySelector("img");
  if (!p.img) { img.removeAttribute("src"); return; }
  if (img.src !== p.url) img.src = p.url;
  const pw = el.clientWidth, ph = el.clientHeight;
  const scale = Math.max(pw / p.img.naturalWidth, ph / p.img.naturalHeight) * p.zoom;
  const w = p.img.naturalWidth * scale, h = p.img.naturalHeight * scale;
  img.style.width = w + "px";
  img.style.height = h + "px";
  img.style.transform = "translate(calc(-50% + " + p.x + "px), calc(-50% + " + p.y + "px))";
}

function layoutAll() { panels.forEach((_, i) => layoutPanel(i)); }

function selectPanel(i) {
  selected = i;
  panelEls.forEach((el, j) => el.classList.toggle("selected", j === i));
  zoomRange.value = String(panels[i].zoom);
}

function loadInto(i, url) {
  const image = new Image();
  image.onload = () => {
    panels[i].img = image; panels[i].url = url;
    panels[i].x = 0; panels[i].y = 0; panels[i].zoom = 1;
    if (i === selected) zoomRange.value = "1";
    layoutPanel(i);
  };
  image.src = url;
}

function loadSamples() {
  SAMPLES.forEach((src, i) => loadInto(i, src));
  say("Sample scenes loaded. Drop your own photos onto any panel.");
}

function readFile(file, done) {
  const reader = new FileReader();
  reader.onload = () => done(String(reader.result));
  reader.readAsDataURL(file);
}

panelEls.forEach((el, i) => {
  el.addEventListener("click", () => selectPanel(i));
  el.addEventListener("dragover", (e) => { e.preventDefault(); selectPanel(i); });
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) readFile(file, (url) => { loadInto(i, url); say("Photo placed in panel " + (i + 1) + "."); });
  });
  let drag = null;
  el.addEventListener("pointerdown", (e) => {
    selectPanel(i);
    drag = { x: e.clientX, y: e.clientY, px: panels[i].x, py: panels[i].y };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", (e) => {
    if (!drag) return;
    panels[i].x = drag.px + (e.clientX - drag.x);
    panels[i].y = drag.py + (e.clientY - drag.y);
    layoutPanel(i);
  });
  el.addEventListener("pointerup", () => { drag = null; });
  el.addEventListener("pointercancel", () => { drag = null; });
});

document.getElementById("panelFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) readFile(file, (url) => { loadInto(selected, url); say("Photo placed in panel " + (selected + 1) + "."); });
  e.target.value = "";
});
document.getElementById("fillFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) readFile(file, (url) => { panels.forEach((_, i) => loadInto(i, url)); say("One photo now fills every panel."); });
  e.target.value = "";
});
document.getElementById("samplesBtn").addEventListener("click", loadSamples);
zoomRange.addEventListener("input", () => {
  panels[selected].zoom = Number(zoomRange.value);
  layoutPanel(selected);
});
const captionInput = document.getElementById("captionInput");
const taglineInput = document.getElementById("taglineInput");
captionInput.addEventListener("input", () => {
  document.getElementById("coverCaption").textContent = captionInput.value || " ";
});
taglineInput.addEventListener("input", () => {
  document.getElementById("coverTagline").textContent = taglineInput.value || " ";
});
document.querySelectorAll(".gradeBtn").forEach((btn) => {
  btn.addEventListener("click", () => {
    grade = btn.dataset.grade;
    poster.className = "poster grade-" + grade;
    document.querySelectorAll(".gradeBtn").forEach((b) => b.classList.toggle("active", b === btn));
    say("Grade applied: " + btn.textContent + ".");
  });
});

function drawCover(ctx, W, H) {
  const cols = 2, rows = 2, gap = Math.round(W * 0.006);
  const pw = (W - gap * (cols + 1)) / cols;
  const ph = (H - gap * (rows + 1)) / rows;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = GRADES[grade].filter;
  panels.forEach((p, i) => {
    if (!p.img) return;
    const cx = gap + (i % cols) * (pw + gap), cy = gap + Math.floor(i / cols) * (ph + gap);
    ctx.save();
    ctx.beginPath(); ctx.rect(cx, cy, pw, ph); ctx.clip();
    const scale = Math.max(pw / p.img.naturalWidth, ph / p.img.naturalHeight) * p.zoom;
    const w = p.img.naturalWidth * scale, h = p.img.naturalHeight * scale;
    const sx = poster.clientWidth ? pw / panelEls[i].clientWidth : 1;
    ctx.drawImage(p.img, cx + pw / 2 - w / 2 + p.x * sx, cy + ph / 2 - h / 2 + p.y * sx, w, h);
    ctx.restore();
  });
  ctx.restore();
  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, GRADES[grade].wash[0]);
  wash.addColorStop(1, GRADES[grade].wash[1]);
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  const shade = ctx.createLinearGradient(0, H * 0.62, 0, H);
  shade.addColorStop(0, "rgba(5,2,12,0)");
  shade.addColorStop(0.55, "rgba(5,2,12,0.88)");
  ctx.fillStyle = shade; ctx.fillRect(0, H * 0.62, W, H * 0.38);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  try { ctx.letterSpacing = "2px"; } catch (e) { /* older canvas */ }
  ctx.font = "900 " + Math.round(H * 0.105) + "px 'Cover Display', sans-serif";
  ctx.shadowColor = "#ff2e88"; ctx.shadowOffsetY = Math.round(H * 0.006); ctx.shadowBlur = 0;
  const caption = (captionInput.value || "VICE NIGHTS").toUpperCase();
  ctx.fillText(caption, W / 2, H * 0.93, W * 0.94);
  ctx.shadowColor = "transparent"; ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#ffd23f";
  ctx.font = "700 " + Math.round(H * 0.032) + "px 'Cover Display', sans-serif";
  ctx.fillText((taglineInput.value || "").toUpperCase(), W / 2, H * 0.975, W * 0.94);
}

function exportPNG(W, H) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  drawCover(canvas.getContext("2d"), W, H);
  const a = document.createElement("a");
  a.download = "vice-nights-cover-" + W + "x" + H + ".png";
  a.href = canvas.toDataURL("image/png");
  a.click();
  say("Exported PNG at " + W + " x " + H + ".");
  return canvas;
}
document.querySelectorAll("[data-export]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const parts = btn.dataset.export.split("x").map(Number);
    exportPNG(parts[0], parts[1]);
  });
});
window.__coverStudio = { exportPNG, loadInto, selectPanel, panels, setGrade: (g) => { grade = g; poster.className = "poster grade-" + g; } };
window.addEventListener("resize", layoutAll);
selectPanel(0);
loadSamples();
