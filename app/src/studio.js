/* Vice Nights Cover Studio — offline multi-panel GTA 6-style cover maker.
   Every picture here is drawn in code: three procedural scenes, three layouts,
   three colour grades, three post sizes. No external assets, no network. */
(function () {
  "use strict";

  /* ---------- constants ---------- */

  var SIZES = {
    wide: { w: 1920, h: 1080, label: "Wide 1920x1080" },
    square: { w: 1080, h: 1080, label: "Square 1080x1080" },
    portrait: { w: 1080, h: 1350, label: "Portrait 1080x1350" }
  };

  var PREVIEW = {
    wide: { w: 960, h: 540 },
    square: { w: 600, h: 600 },
    portrait: { w: 480, h: 600 }
  };

  var SCENES = {
    neon: {
      name: "Midnight Run",
      title: "MIDNIGHT RUN",
      tagline: "Neon streets. No brakes.",
      paint: paintNeonChase
    },
    boulevard: {
      name: "Golden Hour",
      title: "GOLDEN HOUR",
      tagline: "Golden light. Open road. No regrets.",
      paint: paintBoulevard
    },
    heist: {
      name: "Sunset Score",
      title: "SUNSET SCORE",
      tagline: "One last job before dark.",
      paint: paintHeist
    }
  };

  var GRADES = {
    sunset: { name: "Sunset gold" },
    neon: { name: "Neon nights" },
    dusk: { name: "Dusk noir" }
  };

  var FONT = '"Vice Condensed", "Arial Narrow", "Impact", sans-serif';
  var FONT_BODY = '"Segoe UI", system-ui, sans-serif';

  /* ---------- deterministic random ---------- */

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- small canvas helpers ---------- */

  function gradV(ctx, x, y0, y1, stops) {
    var g = ctx.createLinearGradient(x, y0, x, y1);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }

  function circle(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function palmTree(ctx, x, y, s, lean, col) {
    // A palm as one curved trunk and seven single-arc fronds fanning from
    // the crown: smooth strokes, no zigzags, tips drooping downward.
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(lean);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = "round";
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(5, -62, 2, -116); ctx.stroke();
    ctx.lineWidth = 4.5;
    var angles = [-1.25, -0.85, -0.45, -0.1, 0.3, 0.7, 1.1];
    for (var i = 0; i < angles.length; i++) {
      var a = angles[i], L = 56 + (i % 2) * 6;
      var tx = Math.sin(a) * L, ty = -Math.cos(a) * L + 16;
      ctx.beginPath();
      ctx.moveTo(2, -116);
      ctx.quadraticCurveTo(Math.sin(a) * L * 0.55, -116 - Math.cos(a) * L * 0.55 - 14, tx, -116 + ty);
      ctx.stroke();
    }
    circle(ctx, -3, -112, 5); circle(ctx, 5, -110, 4);
    ctx.restore();
  }

  function skylineRow(ctx, w, baseY, minH, maxH, col, seed, lit) {
    var rng = mulberry32(seed);
    var x = -10;
    ctx.fillStyle = col;
    while (x < w + 10) {
      var bw = 26 + rng() * 70;
      var bh = minH + rng() * (maxH - minH);
      ctx.fillRect(x, baseY - bh, bw, bh);
      if (rng() < 0.5) { ctx.fillRect(x + bw * 0.3, baseY - bh - 12 - rng() * 18, bw * 0.25, 14 + rng() * 18); }
      if (lit) {
        for (var wy = baseY - bh + 8; wy < baseY - 8; wy += 14) {
          for (var wx = x + 5; wx < x + bw - 5; wx += 11) {
            if (rng() < 0.22) {
              ctx.fillStyle = rng() < 0.6 ? "rgba(255,196,90,0.85)" : (rng() < 0.5 ? "rgba(255,80,160,0.8)" : "rgba(80,220,255,0.8)");
              ctx.fillRect(wx, wy, 4, 6);
              ctx.fillStyle = col;
            }
          }
        }
      }
      x += bw + 2 + rng() * 8;
    }
  }

  function stars(ctx, w, h, n, seed) {
    var rng = mulberry32(seed);
    ctx.save();
    for (var i = 0; i < n; i++) {
      var a = 0.25 + rng() * 0.6;
      ctx.fillStyle = "rgba(255,255,255," + a.toFixed(2) + ")";
      ctx.fillRect(rng() * w, rng() * h * 0.5, 1.6, 1.6);
    }
    ctx.restore();
  }

  function birds(ctx, points, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = "round";
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      ctx.beginPath();
      ctx.moveTo(p[0] - 8, p[1]); ctx.quadraticCurveTo(p[0], p[1] - 6, p[0] + 8, p[1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- scene 1: neon car chase ---------- */

  function paintNeonChase(ctx, w, h) {
    var rng = mulberry32(4101);
    var u = Math.min(w, h);
    ctx.fillStyle = gradV(ctx, 0, 0, h, [[0, "#070313"], [0.55, "#1c0740"], [0.8, "#3a0a54"], [1, "#12081f"]]);
    ctx.fillRect(0, 0, w, h);
    stars(ctx, w, h, 46, 77);
    // neon moon
    ctx.save();
    ctx.shadowColor = "#ff5ec4"; ctx.shadowBlur = 60;
    ctx.fillStyle = "#ffd7f2"; circle(ctx, w * 0.78, h * 0.2, h * 0.075); ctx.restore();
    ctx.fillStyle = "#f7b8e4"; circle(ctx, w * 0.78, h * 0.2, h * 0.055);
    skylineRow(ctx, w, h * 0.74, h * 0.10, h * 0.30, "#150829", 910, true);
    // neon sign bars on the skyline
    ctx.save();
    var signs = [["#ff2e88", 0.16, 0.52], ["#22d3ee", 0.55, 0.46], ["#ffb020", 0.84, 0.55]];
    for (var s = 0; s < signs.length; s++) {
      ctx.shadowColor = signs[s][0]; ctx.shadowBlur = 26;
      ctx.fillStyle = signs[s][0];
      ctx.fillRect(w * signs[s][1], h * signs[s][2], w * 0.012, h * 0.16);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(w * signs[s][1] + 2, h * signs[s][2] + 6, w * 0.012 - 4, h * 0.16 - 12);
    }
    ctx.restore();
    // wet street
    ctx.fillStyle = gradV(ctx, 0, h * 0.74, h, [[0, "#160a2c"], [1, "#040208"]]);
    ctx.fillRect(0, h * 0.74, w, h * 0.26);
    ctx.save(); ctx.globalAlpha = 0.16;
    for (var i = 0; i < 26; i++) {
      ctx.fillStyle = i % 2 ? "#ff2e88" : "#22d3ee";
      var rx = rng() * w;
      ctx.fillRect(rx, h * 0.75, 3 + rng() * 5, h * 0.1 + rng() * h * 0.12);
    }
    ctx.restore();
    // lane dashes in perspective
    ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (var d = 0; d < 5; d++) {
      var ly = h * (0.78 + d * 0.045);
      ctx.fillRect(w * 0.5 - 2, ly, 4, 8 + d * 4);
    }
    ctx.restore();
    // sports car silhouette
    var cx = w * 0.5, cy = h * 0.86, cl = w * 0.54, chh = u * 0.085;
    ctx.save();
    ctx.shadowColor = "#ff2e88"; ctx.shadowBlur = 34;
    ctx.fillStyle = "rgba(255,46,136,0.5)";
    ctx.beginPath(); ctx.ellipse(cx, cy + chh * 0.72, cl * 0.52, chh * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#0a0514";
    ctx.beginPath();
    ctx.moveTo(cx - cl / 2, cy);
    ctx.quadraticCurveTo(cx - cl * 0.46, cy - chh * 0.72, cx - cl * 0.28, cy - chh * 0.78);
    ctx.quadraticCurveTo(cx - cl * 0.12, cy - chh * 1.28, cx + cl * 0.08, cy - chh * 1.24);
    ctx.quadraticCurveTo(cx + cl * 0.3, cy - chh * 1.1, cx + cl * 0.46, cy - chh * 0.5);
    ctx.quadraticCurveTo(cx + cl * 0.52, cy - chh * 0.1, cx + cl * 0.48, cy);
    ctx.closePath(); ctx.fill();
    // windows
    ctx.fillStyle = "rgba(120,220,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(cx - cl * 0.1, cy - chh * 1.12);
    ctx.quadraticCurveTo(cx + cl * 0.06, cy - chh * 1.14, cx + cl * 0.2, cy - chh * 0.72);
    ctx.lineTo(cx - cl * 0.08, cy - chh * 0.72);
    ctx.closePath(); ctx.fill();
    // wheels
    var wy = cy + chh * 0.02, wr = chh * 0.52;
    ctx.fillStyle = "#05030a";
    circle(ctx, cx - cl * 0.32, wy, wr); circle(ctx, cx + cl * 0.32, wy, wr);
    ctx.fillStyle = "#c8c8d8";
    circle(ctx, cx - cl * 0.32, wy, wr * 0.45); circle(ctx, cx + cl * 0.32, wy, wr * 0.45);
    // headlight beam + taillight
    ctx.save(); ctx.globalAlpha = 0.5;
    var beam = ctx.createLinearGradient(cx - cl / 2, cy, cx - cl * 0.95, cy);
    beam.addColorStop(0, "rgba(255,244,180,0.85)"); beam.addColorStop(1, "rgba(255,244,180,0)");
    ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(cx - cl / 2, cy - chh * 0.35); ctx.lineTo(cx - cl * 0.95, cy - chh * 0.9);
    ctx.lineTo(cx - cl * 0.95, cy + chh * 0.3); ctx.lineTo(cx - cl / 2, cy + chh * 0.2); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.shadowColor = "#ff2038"; ctx.shadowBlur = 22;
    ctx.fillStyle = "#ff2038"; ctx.fillRect(cx + cl * 0.46, cy - chh * 0.55, 7, 5); ctx.restore();
    // speed lines
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
    for (var sl = 0; sl < 8; sl++) {
      var sy = h * (0.3 + rng() * 0.5);
      ctx.beginPath(); ctx.moveTo(w * (0.05 + rng() * 0.2), sy); ctx.lineTo(w * (0.2 + rng() * 0.25), sy); ctx.stroke();
    }
    ctx.restore();
    palmTree(ctx, w * 0.06, h * 0.78, Math.min(w, h) / 260, -0.12, "#0a0514");
    palmTree(ctx, w * 0.94, h * 0.8, Math.min(w, h) / 300, 0.14, "#0a0514");
  }

  /* ---------- scene 2: boulevard glamour ---------- */

  function paintBoulevard(ctx, w, h) {
    var rng = mulberry32(2207);
    var u = Math.min(w, h);
    ctx.fillStyle = gradV(ctx, 0, 0, h, [[0, "#ffb347"], [0.45, "#ff7a59"], [0.75, "#c94b7c"], [1, "#5b2a72"]]);
    ctx.fillRect(0, 0, w, h);
    // sun with glow
    ctx.save();
    ctx.shadowColor = "#ffd76a"; ctx.shadowBlur = 90;
    ctx.fillStyle = "#fff3c4"; circle(ctx, w * 0.68, h * 0.3, h * 0.11); ctx.restore();
    ctx.fillStyle = "rgba(255,214,106,0.5)"; circle(ctx, w * 0.68, h * 0.3, h * 0.15);
    birds(ctx, [[w * 0.2, h * 0.18], [w * 0.28, h * 0.14], [w * 0.36, h * 0.2], [w * 0.46, h * 0.12]], "rgba(40,10,40,0.8)");
    // far palms + buildings
    ctx.fillStyle = "#3d1747";
    skylineRow(ctx, w, h * 0.66, h * 0.06, h * 0.16, "#3d1747", 515, false);
    palmTree(ctx, w * 0.1, h * 0.66, Math.min(w, h) / 320, -0.1, "#33123e");
    palmTree(ctx, w * 0.9, h * 0.66, Math.min(w, h) / 340, 0.1, "#33123e");
    // boulevard road in perspective
    ctx.fillStyle = gradV(ctx, 0, h * 0.66, h, [[0, "#7a3a5e"], [1, "#2a1030"]]);
    ctx.beginPath();
    ctx.moveTo(w * 0.42, h * 0.66); ctx.lineTo(w * 0.58, h * 0.66);
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.fillStyle = "rgba(255,240,200,0.85)";
    for (var d = 0; d < 4; d++) {
      var t = d / 4, ly = h * (0.68 + t * 0.3), lw = 3 + t * 10;
      ctx.fillRect(w * 0.5 - lw / 2, ly, lw, 6 + t * 14);
    }
    ctx.restore();
    // convertible silhouette
    var cx = w * 0.5, cy = h * 0.88, cl = w * 0.56, chh = u * 0.095;
    ctx.fillStyle = "#160a20";
    ctx.beginPath();
    ctx.moveTo(cx - cl / 2, cy);
    ctx.quadraticCurveTo(cx - cl * 0.48, cy - chh * 0.6, cx - cl * 0.3, cy - chh * 0.66);
    ctx.lineTo(cx - cl * 0.05, cy - chh * 0.66);
    ctx.lineTo(cx + cl * 0.12, cy - chh * 0.2);
    ctx.quadraticCurveTo(cx + cl * 0.4, cy - chh * 0.35, cx + cl * 0.48, cy - chh * 0.08);
    ctx.quadraticCurveTo(cx + cl * 0.52, cy, cx + cl * 0.46, cy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,220,150,0.9)";
    ctx.beginPath();
    ctx.moveTo(cx - cl * 0.04, cy - chh * 0.62);
    ctx.lineTo(cx + cl * 0.1, cy - chh * 0.62);
    ctx.lineTo(cx + cl * 0.14, cy - chh * 0.24);
    ctx.lineTo(cx - cl * 0.02, cy - chh * 0.24);
    ctx.closePath(); ctx.fill();
    // warm top-edge highlight so the car reads against the dark road
    ctx.save();
    ctx.strokeStyle = "rgba(255,190,90,0.75)"; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - cl * 0.46, cy - chh * 0.5);
    ctx.quadraticCurveTo(cx - cl * 0.3, cy - chh * 0.68, cx - cl * 0.05, cy - chh * 0.66);
    ctx.lineTo(cx + cl * 0.12, cy - chh * 0.2);
    ctx.stroke();
    ctx.restore();
    var wy = cy + chh * 0.02, wr = chh * 0.5;
    ctx.fillStyle = "#0b0512";
    circle(ctx, cx - cl * 0.32, wy, wr); circle(ctx, cx + cl * 0.32, wy, wr);
    ctx.fillStyle = "#e8d9b0";
    circle(ctx, cx - cl * 0.32, wy, wr * 0.42); circle(ctx, cx + cl * 0.32, wy, wr * 0.42);
    // glamorous figure leaning on the car door, sized to the car (a person is
    // about one and a half car-heights, not four); standing on the road clear
    // of the car's rear, tall enough to read above its roofline
    var fx = cx - cl * 0.44, fy = cy + chh * 0.15;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(0.75, 0.75);
    ctx.fillStyle = "#160a20";
    // hair mass
    ctx.beginPath();
    ctx.moveTo(-u * 0.055, -u * 0.02);
    ctx.quadraticCurveTo(-u * 0.075, -u * 0.16, -u * 0.02, -u * 0.185);
    ctx.quadraticCurveTo(u * 0.045, -u * 0.19, u * 0.05, -u * 0.1);
    ctx.quadraticCurveTo(u * 0.06, -u * 0.02, u * 0.03, u * 0.01);
    ctx.quadraticCurveTo(u * 0.01, -u * 0.06, -u * 0.02, -u * 0.05);
    ctx.quadraticCurveTo(-u * 0.04, -u * 0.01, -u * 0.055, -u * 0.02);
    ctx.closePath(); ctx.fill();
    // head + neck + shoulders
    circle(ctx, 0, -u * 0.1, u * 0.052);
    ctx.fillRect(-u * 0.014, -u * 0.055, u * 0.028, u * 0.05);
    ctx.beginPath();
    ctx.moveTo(-u * 0.075, u * 0.02);
    ctx.quadraticCurveTo(-u * 0.08, -u * 0.045, -u * 0.02, -u * 0.05);
    ctx.lineTo(u * 0.02, -u * 0.05);
    ctx.quadraticCurveTo(u * 0.08, -u * 0.045, u * 0.085, u * 0.02);
    ctx.quadraticCurveTo(u * 0.06, u * 0.075, u * 0.02, u * 0.085);
    ctx.lineTo(-u * 0.02, u * 0.085);
    ctx.quadraticCurveTo(-u * 0.06, u * 0.075, -u * 0.075, u * 0.02);
    ctx.closePath(); ctx.fill();
    // sunglasses band + gold hoop
    ctx.fillStyle = "#0b0512";
    ctx.fillRect(-u * 0.045, -u * 0.118, u * 0.09, u * 0.014);
    ctx.strokeStyle = "#ffd76a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-u * 0.048, -u * 0.07, u * 0.011, 0, Math.PI * 2); ctx.stroke();
    // warm rim light on the sun side
    ctx.strokeStyle = "rgba(255,190,90,0.9)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(u * 0.01, -u * 0.1, u * 0.052, -1.1, 0.9); ctx.stroke();
    ctx.restore();
    // lens flare dots
    ctx.save(); ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#fff3c4";
    circle(ctx, w * 0.82, h * 0.42, 7); circle(ctx, w * 0.86, h * 0.5, 4); circle(ctx, w * 0.78, h * 0.55, 3);
    ctx.restore();
    palmTree(ctx, w * 0.05, h * 0.98, Math.min(w, h) / 280, -0.08, "#160a20");
    palmTree(ctx, w * 0.96, h * 0.98, Math.min(w, h) / 300, 0.08, "#160a20");
    void rng;
  }

  /* ---------- scene 3: sunset heist ---------- */

  function paintHeist(ctx, w, h) {
    var rng = mulberry32(9917);
    var u = Math.min(w, h);
    ctx.fillStyle = gradV(ctx, 0, 0, h, [[0, "#ff8a1e"], [0.45, "#ff4d6a"], [0.8, "#7a2a6d"], [1, "#2a1445"]]);
    ctx.fillRect(0, 0, w, h);
    // low sun half behind the skyline
    ctx.save();
    ctx.shadowColor = "#ff9a3c"; ctx.shadowBlur = 80;
    ctx.fillStyle = "#ffe9b0"; circle(ctx, w * 0.5, h * 0.52, h * 0.13); ctx.restore();
    birds(ctx, [[w * 0.16, h * 0.2], [w * 0.24, h * 0.16], [w * 0.7, h * 0.14], [w * 0.78, h * 0.2]], "rgba(30,8,40,0.85)");
    skylineRow(ctx, w, h * 0.72, h * 0.12, h * 0.34, "#1c0b2e", 313, true);
    // helicopter with searchlight: slim body, thin tail boom, long rotor
    var hx = w * 0.76, hy = h * 0.2;
    ctx.save(); ctx.fillStyle = "#12081f";
    ctx.beginPath(); ctx.ellipse(hx, hy, u * 0.075, u * 0.03, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(hx - u * 0.02, hy + u * 0.02, u * 0.04, u * 0.012);
    ctx.fillRect(hx + u * 0.06, hy - u * 0.005, u * 0.05, u * 0.008);
    ctx.beginPath(); ctx.moveTo(hx + u * 0.11, hy - u * 0.005); ctx.lineTo(hx + u * 0.11, hy - u * 0.026); ctx.lineTo(hx + u * 0.096, hy - u * 0.005); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#12081f"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(hx - u * 0.13, hy - u * 0.035); ctx.lineTo(hx + u * 0.13, hy - u * 0.035); ctx.stroke();
    ctx.restore();
    ctx.save();
    var cone = ctx.createLinearGradient(0, hy + h * 0.03, 0, h * 0.72);
    cone.addColorStop(0, "rgba(255,244,200,0.5)"); cone.addColorStop(1, "rgba(255,244,200,0)");
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(hx - 4, hy + h * 0.03); ctx.lineTo(hx + 4, hy + h * 0.03);
    ctx.lineTo(hx + u * 0.08, h * 0.72); ctx.lineTo(hx - u * 0.08, h * 0.72);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // street
    ctx.fillStyle = gradV(ctx, 0, h * 0.72, h, [[0, "#241038"], [1, "#0a0514"]]);
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    // long shadows
    ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath(); ctx.ellipse(w * 0.42, h * 0.93, w * 0.16, h * 0.02, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // figure with duffel bag, mid-stride, caught in the searchlight cone so
    // the silhouette separates from the dark street
    var fx = w * 0.66, fy = h * 0.82;
    ctx.save();
    var glow = ctx.createRadialGradient(fx, fy - u * 0.1, 4, fx, fy - u * 0.1, u * 0.17);
    glow.addColorStop(0, "rgba(255,190,100,0.30)");
    glow.addColorStop(1, "rgba(255,190,100,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(fx - u * 0.17, fy - u * 0.27, u * 0.34, u * 0.34);
    ctx.restore();
    ctx.save(); ctx.translate(fx, fy); ctx.scale(1.25, 1.25);
    ctx.fillStyle = "#12081f"; ctx.strokeStyle = "#12081f";
    ctx.lineCap = "round"; ctx.lineWidth = h * 0.016;
    // legs, one forward one back
    ctx.beginPath(); ctx.moveTo(0, -u * 0.075); ctx.lineTo(-u * 0.035, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -u * 0.075); ctx.lineTo(u * 0.03, -u * 0.008); ctx.stroke();
    // torso + head
    ctx.beginPath(); ctx.ellipse(0, -u * 0.115, u * 0.026, u * 0.042, 0.08, 0, Math.PI * 2); ctx.fill();
    circle(ctx, u * 0.006, -u * 0.185, u * 0.021);
    // cap brim
    ctx.fillRect(-u * 0.012, -u * 0.205, u * 0.045, u * 0.007);
    // arm to the bag
    ctx.beginPath(); ctx.moveTo(u * 0.018, -u * 0.14); ctx.lineTo(u * 0.075, -u * 0.06); ctx.stroke();
    // duffel bag
    ctx.save(); ctx.translate(u * 0.085, -u * 0.035); ctx.rotate(0.12);
    ctx.beginPath();
    ctx.ellipse(0, 0, u * 0.038, u * 0.02, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-u * 0.02, -u * 0.028, u * 0.04, u * 0.008);
    ctx.restore();
    // rim light from the sunset
    ctx.strokeStyle = "rgba(255,150,60,0.95)"; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(u * 0.006, -u * 0.185, u * 0.021, -1.2, 0.6); ctx.stroke();
    ctx.restore();
    // second distant figure
    ctx.save(); ctx.fillStyle = "rgba(18,8,31,0.85)";
    ctx.beginPath(); ctx.ellipse(w * 0.68, h * 0.84, u * 0.012, u * 0.03, 0, 0, Math.PI * 2); ctx.fill();
    circle(ctx, w * 0.68, h * 0.79, u * 0.011);
    ctx.restore();
    palmTree(ctx, w * 0.07, h * 0.74, Math.min(w, h) / 300, -0.1, "#12081f");
    palmTree(ctx, w * 0.93, h * 0.75, Math.min(w, h) / 320, 0.12, "#12081f");
    void rng;
  }

  /* ---------- scene cache ---------- */

  var sceneCache = {};
  function getSceneCanvas(sceneId, w, h) {
    var key = sceneId + "@" + w + "x" + h;
    if (sceneCache[key]) return sceneCache[key];
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    SCENES[sceneId].paint(c.getContext("2d"), w, h);
    sceneCache[key] = c;
    return c;
  }

  /* ---------- state ---------- */

  function freshPanel(photo) {
    return { photo: photo, scale: 1, ox: 0, oy: 0 };
  }

  var state = {
    layout: "hero-left",
    grade: "sunset",
    size: "wide",
    caption: "VICE NIGHTS",
    tagline: "Neon streets. Golden light. One last score.",
    panels: [freshPanel("scene:neon"), freshPanel("scene:boulevard"), freshPanel("scene:heist")],
    selected: 0
  };

  /* ---------- cover renderer ---------- */

  function layoutRects(W, H) {
    var m = Math.round(W * 0.016);
    var g = Math.round(W * 0.011);
    var innerW = W - 2 * m, innerH = H - 2 * m;
    if (state.layout === "hero-top") {
      var heroH = Math.round((innerH - g) * 0.56);
      var botH = innerH - g - heroH;
      var botW = Math.round((innerW - g) / 2);
      return [
        { x: m, y: m, w: innerW, h: heroH },
        { x: m, y: m + heroH + g, w: botW, h: botH },
        { x: m + botW + g, y: m + heroH + g, w: innerW - botW - g, h: botH }
      ];
    }
    if (state.layout === "triple") {
      var colW = Math.round((innerW - 2 * g) / 3);
      return [
        { x: m, y: m, w: colW, h: innerH },
        { x: m + colW + g, y: m, w: colW, h: innerH },
        { x: m + 2 * (colW + g), y: m, w: innerW - 2 * (colW + g), h: innerH }
      ];
    }
    var heroW = Math.round((innerW - g) * 0.62);
    var sideW = innerW - g - heroW;
    var sideH = Math.round((innerH - g) / 2);
    return [
      { x: m, y: m, w: heroW, h: innerH },
      { x: m + heroW + g, y: m, w: sideW, h: sideH },
      { x: m + heroW + g, y: m + sideH + g, w: sideW, h: innerH - sideH - g }
    ];
  }

  function photoOf(panel, rect) {
    if (typeof panel.photo === "string" && panel.photo.indexOf("scene:") === 0) {
      var id = panel.photo.slice(6);
      var sw = Math.max(480, Math.round(rect.w * 1.2));
      var sh = Math.max(480, Math.round(rect.h * 1.2));
      return getSceneCanvas(id, sw, sh);
    }
    if (panel.photo && panel.photo.img) return panel.photo.img;
    return getSceneCanvas("neon", 640, 640);
  }

  function drawPanelPhoto(ctx, photo, rect, crop) {
    var pw = photo.naturalWidth || photo.width;
    var ph = photo.naturalHeight || photo.height;
    if (!pw || !ph) return;
    var base = Math.max(rect.w / pw, rect.h / ph);
    var scale = base * crop.scale;
    var dw = pw * scale, dh = ph * scale;
    var dx = rect.x + (rect.w - dw) / 2 + (crop.ox / 100) * rect.w * 0.45;
    var dy = rect.y + (rect.h - dh) / 2 + (crop.oy / 100) * rect.h * 0.45;
    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    ctx.drawImage(photo, dx, dy, dw, dh);
    ctx.restore();
  }

  function applyGrade(ctx, W, H) {
    if (state.grade === "neon") {
      ctx.fillStyle = gradV(ctx, 0, 0, H, [[0, "rgba(255,0,150,0.10)"], [0.6, "rgba(120,0,255,0.06)"], [1, "rgba(0,210,255,0.14)"]]);
      ctx.fillRect(0, 0, W, H);
    } else if (state.grade === "dusk") {
      ctx.fillStyle = "rgba(10,6,28,0.24)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = gradV(ctx, 0, 0, H, [[0, "rgba(70,50,140,0.10)"], [1, "rgba(0,0,0,0.30)"]]);
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = gradV(ctx, 0, 0, H, [[0, "rgba(255,120,40,0.10)"], [0.55, "rgba(255,80,60,0.05)"], [1, "rgba(255,40,110,0.16)"]]);
      ctx.fillRect(0, 0, W, H);
    }
    // grain, seeded so every export is identical
    var rng = mulberry32(20261121);
    ctx.save();
    for (var i = 0; i < 2200; i++) {
      var a = 0.02 + rng() * 0.05;
      ctx.fillStyle = rng() < 0.5 ? "rgba(255,255,255," + a.toFixed(3) + ")" : "rgba(0,0,0," + a.toFixed(3) + ")";
      ctx.fillRect(rng() * W, rng() * H, 1.4, 1.4);
    }
    ctx.restore();
    // vignette
    var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitleBlock(ctx, W, H) {
    var band = ctx.createLinearGradient(0, H * 0.72, 0, H);
    band.addColorStop(0, "rgba(8,3,18,0)");
    band.addColorStop(1, "rgba(8,3,18,0.62)");
    ctx.fillStyle = band;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    var caption = (state.caption || "VICE NIGHTS").toUpperCase();
    var size = Math.round(H * 0.115);
    ctx.textBaseline = "alphabetic";
    var fit = function (px) { ctx.font = "900 " + px + "px " + FONT; return ctx.measureText(caption).width; };
    while (size > 20 && fit(size) > W * 0.93) size -= 2;
    ctx.font = "900 " + size + "px " + FONT;
    var cx = W * 0.045, cy = H * 0.925;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.65)"; ctx.shadowBlur = Math.round(H * 0.012); ctx.shadowOffsetY = Math.round(H * 0.006);
    ctx.lineWidth = Math.max(3, Math.round(size * 0.085));
    ctx.strokeStyle = "rgba(16,4,28,0.92)";
    ctx.lineJoin = "round";
    ctx.strokeText(caption, cx, cy);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(caption, cx, cy);
    ctx.restore();

    var tag = state.tagline || "";
    if (tag) {
      var tsize = Math.round(H * 0.032);
      ctx.font = "italic 700 " + tsize + "px " + FONT_BODY;
      ctx.fillStyle = "#ffe9a8";
      ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
      ctx.fillText(tag, cx, H * 0.972);
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    // corner mark, bottom right where the tagline does not reach
    ctx.font = "700 " + Math.round(H * 0.018) + "px " + FONT_BODY;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.textAlign = "right";
    ctx.fillText("NEON COAST  ·  2026", W * 0.97, H * 0.972);
    ctx.textAlign = "left";
  }

  function renderCover(ctx, W, H) {
    // base backdrop: deep dusk gradient so gutters read as night sky
    ctx.fillStyle = gradV(ctx, 0, 0, H, [[0, "#1c0a33"], [0.6, "#12081f"], [1, "#0a0514"]]);
    ctx.fillRect(0, 0, W, H);
    var rects = layoutRects(W, H);
    var frame = Math.max(3, Math.round(W * 0.005));
    for (var i = 0; i < 3; i++) {
      var r = rects[i];
      // soft drop shadow
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(r.x + 4, r.y + 6, r.w, r.h);
      ctx.restore();
      drawPanelPhoto(ctx, photoOf(state.panels[i], r), r, state.panels[i]);
      ctx.save();
      ctx.lineWidth = frame;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(r.x + frame / 2, r.y + frame / 2, r.w - frame, r.h - frame);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x + frame + 0.5, r.y + frame + 0.5, r.w - 2 * frame - 1, r.h - 2 * frame - 1);
      ctx.restore();
    }
    drawTitleBlock(ctx, W, H);
    applyGrade(ctx, W, H);
  }

  /* ---------- preview + export ---------- */

  var preview = document.getElementById("preview");
  var statusLine = document.getElementById("status-line");
  var selectedLabel = document.getElementById("selected-label");

  function setStatus(msg) { if (statusLine) statusLine.textContent = msg; }

  function renderPreview() {
    var pv = PREVIEW[state.size];
    if (preview.width !== pv.w || preview.height !== pv.h) {
      preview.width = pv.w; preview.height = pv.h;
    }
    renderCover(preview.getContext("2d"), pv.w, pv.h);
  }

  function exportPNG(sizeId) {
    return new Promise(function (resolve, reject) {
      var s = SIZES[sizeId] || SIZES.wide;
      var c = document.createElement("canvas");
      c.width = s.w; c.height = s.h;
      try {
        renderCover(c.getContext("2d"), s.w, s.h);
      } catch (e) { reject(e); return; }
      c.toBlob(function (blob) {
        if (!blob) { reject(new Error("PNG export produced no data")); return; }
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function () { reject(new Error("PNG read failed")); };
        reader.readAsDataURL(blob);
      }, "image/png");
    });
  }

  function downloadExport(sizeId) {
    setStatus("Exporting " + SIZES[sizeId].label + "…");
    exportPNG(sizeId).then(function (url) {
      var a = document.createElement("a");
      a.href = url;
      a.download = "vice-nights-cover-" + sizeId + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus("Exported " + SIZES[sizeId].label + " — check your downloads.");
    }).catch(function (e) {
      setStatus("Export failed: " + (e && e.message ? e.message : e));
    });
  }

  /* ---------- controls ---------- */

  var PANEL_NAMES = ["Panel 1 · Hero", "Panel 2", "Panel 3"];

  function selectPanel(i) {
    state.selected = i;
    for (var k = 0; k < 3; k++) {
      var card = document.getElementById("panel-card-" + k);
      if (card) card.classList.toggle("active", k === i);
    }
    if (selectedLabel) selectedLabel.textContent = "Selected: " + PANEL_NAMES[i];
  }

  function syncPanelControls(i) {
    var p = state.panels[i];
    var z = document.getElementById("zoom-" + i);
    var ox = document.getElementById("ox-" + i);
    var oy = document.getElementById("oy-" + i);
    if (z) z.value = Math.round(p.scale * 100);
    if (ox) ox.value = Math.round(p.ox);
    if (oy) oy.value = Math.round(p.oy);
    var zv = document.getElementById("zoom-val-" + i);
    var xv = document.getElementById("ox-val-" + i);
    var yv = document.getElementById("oy-val-" + i);
    if (zv) zv.textContent = Math.round(p.scale * 100) + "%";
    if (xv) xv.textContent = Math.round(p.ox);
    if (yv) yv.textContent = Math.round(p.oy);
    var sel = document.getElementById("photo-" + i);
    if (sel) {
      if (typeof p.photo === "string") sel.value = p.photo;
      else if (p.photo && p.photo.img) sel.value = "upload";
    }
  }

  function syncAllControls() {
    for (var i = 0; i < 3; i++) syncPanelControls(i);
    var cap = document.getElementById("caption");
    var tag = document.getElementById("tagline");
    if (cap) cap.value = state.caption;
    if (tag) tag.value = state.tagline;
    var groups = [
      ["data-layout", state.layout],
      ["data-grade", state.grade],
      ["data-size", state.size]
    ];
    for (var g = 0; g < groups.length; g++) {
      var btns = document.querySelectorAll("[" + groups[g][0] + "]");
      for (var b = 0; b < btns.length; b++) {
        btns[b].classList.toggle("on", btns[b].getAttribute(groups[g][0]) === groups[g][1]);
      }
    }
  }

  function applyScenePreset(sceneId) {
    var sc = SCENES[sceneId];
    if (!sc) return;
    for (var i = 0; i < 3; i++) {
      state.panels[i] = freshPanel("scene:" + sceneId);
    }
    state.caption = sc.title;
    state.tagline = sc.tagline;
    syncAllControls();
    renderPreview();
  }

  function bindControls() {
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var card = document.getElementById("panel-card-" + idx);
        if (card) card.addEventListener("click", function () { selectPanel(idx); });
        var sel = document.getElementById("photo-" + idx);
        if (sel) sel.addEventListener("change", function () {
          selectPanel(idx);
          if (sel.value === "upload") {
            var f = document.getElementById("file-" + idx);
            if (f) f.click();
            return;
          }
          state.panels[idx] = freshPanel(sel.value);
          syncPanelControls(idx);
          renderPreview();
        });
        var file = document.getElementById("file-" + idx);
        if (file) file.addEventListener("change", function () {
          var f = file.files && file.files[0];
          if (!f) { syncPanelControls(idx); return; }
          var reader = new FileReader();
          reader.onload = function () {
            var img = new Image();
            img.onload = function () {
              state.panels[idx] = { photo: { kind: "upload", img: img, name: f.name }, scale: 1, ox: 0, oy: 0 };
              syncPanelControls(idx);
              renderPreview();
              setStatus("Loaded " + f.name + " into " + PANEL_NAMES[idx] + ".");
            };
            img.onerror = function () { setStatus("Could not read that image file."); syncPanelControls(idx); };
            img.src = reader.result;
          };
          reader.readAsDataURL(f);
        });
        var zoom = document.getElementById("zoom-" + idx);
        if (zoom) zoom.addEventListener("input", function () {
          state.panels[idx].scale = Number(zoom.value) / 100;
          syncPanelControls(idx); renderPreview();
        });
        var ox = document.getElementById("ox-" + idx);
        if (ox) ox.addEventListener("input", function () {
          state.panels[idx].ox = Number(ox.value);
          syncPanelControls(idx); renderPreview();
        });
        var oy = document.getElementById("oy-" + idx);
        if (oy) oy.addEventListener("input", function () {
          state.panels[idx].oy = Number(oy.value);
          syncPanelControls(idx); renderPreview();
        });
      })(i);
    }

    var fillAll = document.getElementById("fill-all");
    if (fillAll) fillAll.addEventListener("click", function () {
      var src = state.panels[state.selected];
      for (var i = 0; i < 3; i++) {
        state.panels[i] = { photo: src.photo, scale: 1, ox: 0, oy: 0 };
        syncPanelControls(i);
      }
      renderPreview();
      setStatus("All three panels now use " + PANEL_NAMES[state.selected] + "’s photo.");
    });

    var cap = document.getElementById("caption");
    if (cap) cap.addEventListener("input", function () { state.caption = cap.value; renderPreview(); });
    var tag = document.getElementById("tagline");
    if (tag) tag.addEventListener("input", function () { state.tagline = tag.value; renderPreview(); });

    var layoutBtns = document.querySelectorAll("[data-layout]");
    for (var a = 0; a < layoutBtns.length; a++) {
      layoutBtns[a].addEventListener("click", function () {
        state.layout = this.getAttribute("data-layout");
        syncAllControls(); renderPreview();
      });
    }
    var gradeBtns = document.querySelectorAll("[data-grade]");
    for (var b = 0; b < gradeBtns.length; b++) {
      gradeBtns[b].addEventListener("click", function () {
        state.grade = this.getAttribute("data-grade");
        syncAllControls(); renderPreview();
      });
    }
    var sizeBtns = document.querySelectorAll("[data-size]");
    for (var c = 0; c < sizeBtns.length; c++) {
      sizeBtns[c].addEventListener("click", function () {
        state.size = this.getAttribute("data-size");
        syncAllControls(); renderPreview();
      });
    }
    var ew = document.getElementById("export-wide");
    if (ew) ew.addEventListener("click", function () { downloadExport("wide"); });
    var es = document.getElementById("export-square");
    if (es) es.addEventListener("click", function () { downloadExport("square"); });
    var ep = document.getElementById("export-portrait");
    if (ep) ep.addEventListener("click", function () { downloadExport("portrait"); });

    // drag to pan, wheel to zoom, on the live preview
    var drag = null;
    preview.addEventListener("pointerdown", function (e) {
      var rect = preview.getBoundingClientRect();
      var px = (e.clientX - rect.left) * (preview.width / rect.width);
      var py = (e.clientY - rect.top) * (preview.height / rect.height);
      var rects = layoutRects(preview.width, preview.height);
      for (var i = 0; i < 3; i++) {
        var r = rects[i];
        if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
          selectPanel(i);
          drag = { panel: i, x: e.clientX, y: e.clientY, ox: state.panels[i].ox, oy: state.panels[i].oy, rw: r.w, rh: r.h };
          preview.setPointerCapture(e.pointerId);
          break;
        }
      }
    });
    preview.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var p = state.panels[drag.panel];
      p.ox = Math.max(-100, Math.min(100, drag.ox + ((e.clientX - drag.x) / (drag.rw * 0.45)) * 100));
      p.oy = Math.max(-100, Math.min(100, drag.oy + ((e.clientY - drag.y) / (drag.rh * 0.45)) * 100));
      syncPanelControls(drag.panel);
      renderPreview();
    });
    preview.addEventListener("pointerup", function () { drag = null; });
    preview.addEventListener("wheel", function (e) {
      e.preventDefault();
      var p = state.panels[state.selected];
      var step = e.deltaY < 0 ? 8 : -8;
      p.scale = Math.max(1, Math.min(2.6, p.scale + step / 100));
      syncPanelControls(state.selected);
      renderPreview();
    }, { passive: false });
  }

  /* ---------- shot mode (deep links for screenshots) ---------- */

  function applyQuery() {
    var q = new URLSearchParams(window.location.search);
    var shot = q.get("shot");
    if (q.get("scene") && SCENES[q.get("scene")]) applyScenePreset(q.get("scene"));
    if (q.get("layout") && ["hero-left", "hero-top", "triple"].indexOf(q.get("layout")) >= 0) state.layout = q.get("layout");
    if (q.get("grade") && GRADES[q.get("grade")]) state.grade = q.get("grade");
    if (q.get("size") && SIZES[q.get("size")]) state.size = q.get("size");
    if (q.get("caption")) state.caption = q.get("caption");
    if (q.get("tagline")) state.tagline = q.get("tagline");
    if (shot === "cover") {
      document.body.classList.add("shot");
      var s = SIZES[state.size];
      preview.width = s.w; preview.height = s.h;
    }
    syncAllControls();
  }

  /* ---------- boot ---------- */

  function boot() {
    bindControls();
    applyQuery();
    var fontsReady = Promise.resolve();
    try {
      fontsReady = Promise.race([
        Promise.all([
          document.fonts.load('900 40px "Vice Condensed"'),
          document.fonts.load('700 40px "Vice Condensed"')
        ]),
        new Promise(function (res) { setTimeout(res, 1500); })
      ]);
    } catch (e) { fontsReady = Promise.resolve(); }
    fontsReady.then(function () {
      renderPreview();
      window.__viceNightsReady = true;
      setStatus("Ready — pick a scene, layout and grade, then export a PNG.");
    });
  }

  // driver API for verification and screenshots
  window.__viceNights = {
    state: state,
    sizes: SIZES,
    scenes: SCENES,
    exportPNG: exportPNG,
    renderPreview: renderPreview,
    applyScenePreset: applyScenePreset,
    selectPanel: selectPanel
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
