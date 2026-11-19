/* ==========================================================
   textures.js — ক্যানভাসে আঁকা প্রক্রিয়াগত টেক্সচার
   (বাইরের কোনো ছবি ছাড়াই অলংকরণ, আলপনা, প্রজাপতির ডানা ইত্যাদি)
   ========================================================== */
import * as THREE from 'three';

const cache = new Map();

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function toTexture(canvas, { repeat = null, srgb = true, mips = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  t.generateMipmaps = mips;
  t.needsUpdate = true;
  return t;
}

function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

/* ---------- অলংকৃত মোটিফ (খোদাই) ---------- */
function drawMotif(ctx, s, style, lw, ox = 0, oy = 0) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.strokeStyle = style;
  ctx.fillStyle = style;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  const h = s / 2;
  // হীরক জাল
  ctx.beginPath();
  ctx.moveTo(h, 0); ctx.lineTo(s, h); ctx.lineTo(h, s); ctx.lineTo(0, h); ctx.closePath();
  ctx.stroke();
  // কেন্দ্রীয় পদ্ম-মেডেলিয়ন
  ctx.beginPath(); ctx.arc(h, h, s * 0.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(h, h, s * 0.07, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.translate(h, h); ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.08);
    ctx.quadraticCurveTo(s * 0.06, -s * 0.15, 0, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.06, -s * 0.15, 0, -s * 0.08);
    ctx.stroke();
    ctx.restore();
  }
  // কোণের ছোট ফুল
  for (const [cx, cy] of [[0, 0], [s, 0], [0, s], [s, s]]) {
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.09, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.03, 0, Math.PI * 2); ctx.fill();
  }
  // মধ্যবর্তী বিন্দু
  for (const [cx, cy] of [[h, s * 0.08], [h, s * 0.92], [s * 0.08, h], [s * 0.92, h]]) {
    ctx.beginPath(); ctx.arc(cx, cy, s * 0.018, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function goldCarved() {
  return cached('goldCarved', () => {
    const S = 512, tile = 256;
    const map = makeCanvas(S, S);
    const m = map.getContext('2d');
    const g = m.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#e2bf72'); g.addColorStop(0.5, '#c9a050'); g.addColorStop(1, '#e8cc86');
    m.fillStyle = g; m.fillRect(0, 0, S, S);
    for (let x = 0; x < S; x += tile) for (let y = 0; y < S; y += tile) {
      drawMotif(m, tile, 'rgba(255,240,190,0.55)', 4, x - 1.5, y - 1.5);
      drawMotif(m, tile, 'rgba(90,55,10,0.55)', 4, x + 1.5, y + 1.5);
      drawMotif(m, tile, 'rgba(200,160,80,0.9)', 3, x, y);
    }
    const bump = makeCanvas(S, S);
    const b = bump.getContext('2d');
    b.fillStyle = '#000'; b.fillRect(0, 0, S, S);
    for (let x = 0; x < S; x += tile) for (let y = 0; y < S; y += tile) drawMotif(b, tile, '#fff', 7, x, y);
    return { map: toTexture(map, { repeat: [1, 1] }), bump: toTexture(bump, { repeat: [1, 1], srgb: false }) };
  });
}

/* ---------- আলপনা (চালের গুঁড়োর সাদা নকশা) ---------- */
export function alpana() {
  return cached('alpana', () => {
    const S = 1024, c = makeCanvas(S, S), x = c.getContext('2d');
    const C = S / 2;
    x.translate(C, C);
    const white = '#fff7e8', red = '#b0182e', gold = '#e8c26a';
    const ring = (r, w, col = white) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); };
    const petals = (n, r0, r1, w, fill, stroke = white, lw = 6) => {
      for (let i = 0; i < n; i++) {
        x.save(); x.rotate((i / n) * Math.PI * 2);
        x.beginPath();
        x.moveTo(0, -r0);
        x.bezierCurveTo(w, -r0 - (r1 - r0) * 0.35, w * 0.7, -r1 + 10, 0, -r1);
        x.bezierCurveTo(-w * 0.7, -r1 + 10, -w, -r0 - (r1 - r0) * 0.35, 0, -r0);
        if (fill) { x.fillStyle = fill; x.fill(); }
        x.strokeStyle = stroke; x.lineWidth = lw; x.stroke();
        x.restore();
      }
    };
    const dots = (n, r, size, col = white) => {
      x.fillStyle = col;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; x.beginPath(); x.arc(Math.cos(a) * r, Math.sin(a) * r, size, 0, Math.PI * 2); x.fill(); }
    };
    // কেন্দ্র
    x.fillStyle = red; x.beginPath(); x.arc(0, 0, 46, 0, Math.PI * 2); x.fill();
    ring(46, 8); dots(1, 0, 16);
    petals(8, 50, 150, 52, 'rgba(176,24,46,0.85)');
    ring(160, 7);
    dots(32, 176, 7);
    petals(16, 190, 290, 34, null, white, 7);
    petals(16, 196, 268, 14, 'rgba(232,194,106,0.85)', gold, 3);
    ring(300, 10);
    ring(316, 3, gold);
    // শঙ্খ-লতা ঢেউ
    x.strokeStyle = white; x.lineWidth = 7;
    for (let i = 0; i < 24; i++) {
      x.save(); x.rotate((i / 24) * Math.PI * 2);
      x.beginPath(); x.arc(0, -350, 26, Math.PI * 0.1, Math.PI * 1.4); x.stroke();
      x.beginPath(); x.arc(0, -350, 8, 0, Math.PI * 2); x.fillStyle = white; x.fill();
      x.restore();
    }
    petals(32, 390, 480, 22, 'rgba(255,247,232,0.95)', white, 4);
    dots(64, 494, 6);
    ring(505, 6);
    return toTexture(c);
  });
}

/* ---------- মখমল ---------- */
export function velvet(hex = '#580D20') {
  return cached('velvet' + hex, () => {
    const S = 256, c = makeCanvas(S, S), x = c.getContext('2d');
    x.fillStyle = hex; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 48; i++) {
      const px = Math.random() * S, w = 2 + Math.random() * 10;
      const g = x.createLinearGradient(px - w, 0, px + w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(${Math.random() < 0.5 ? '255,200,210' : '0,0,0'},${0.05 + Math.random() * 0.08})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(px - w, 0, w * 2, S);
    }
    const img = x.getImageData(0, 0, S, S);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      img.data[i] += n; img.data[i + 1] += n * 0.6; img.data[i + 2] += n * 0.7;
    }
    x.putImageData(img, 0, 0);
    return toTexture(c, { repeat: [2, 1] });
  });
}

/* ---------- মার্বেল মেঝে ---------- */
export function marble() {
  return cached('marble', () => {
    const S = 512, c = makeCanvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#efe2cb'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 26; i++) {
      x.strokeStyle = `rgba(${150 + Math.random() * 40},${120 + Math.random() * 30},${90 + Math.random() * 30},${0.08 + Math.random() * 0.15})`;
      x.lineWidth = 0.6 + Math.random() * 2.2;
      x.beginPath();
      let px = Math.random() * S, py = Math.random() * S;
      x.moveTo(px, py);
      for (let j = 0; j < 5; j++) { px += (Math.random() - 0.3) * 160; py += (Math.random() - 0.5) * 160; x.quadraticCurveTo(px + 40, py - 40, px, py); }
      x.stroke();
    }
    // সোনালি টাইল রেখা ও তারকা
    x.strokeStyle = 'rgba(176,130,50,0.9)'; x.lineWidth = 4;
    x.strokeRect(2, 2, S - 4, S - 4);
    x.fillStyle = 'rgba(160,30,50,0.85)';
    for (const [cx, cy] of [[0, 0], [S, 0], [0, S], [S, S]]) {
      x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4);
      x.fillRect(-26, -26, 52, 52);
      x.strokeStyle = 'rgba(200,160,80,1)'; x.lineWidth = 3; x.strokeRect(-26, -26, 52, 52);
      x.restore();
    }
    return toTexture(c, { repeat: [10, 10] });
  });
}

/* ---------- রাজপথের গালিচা ---------- */
export function carpet() {
  return cached('carpet', () => {
    const W = 256, H = 512, c = makeCanvas(W, H), x = c.getContext('2d');
    x.fillStyle = '#5c0d22'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#c6a15b'; x.fillRect(10, 0, 8, H); x.fillRect(W - 18, 0, 8, H);
    x.fillStyle = '#350814'; x.fillRect(24, 0, 6, H); x.fillRect(W - 30, 0, 6, H);
    for (let y = 0; y < H; y += 128) {
      x.save(); x.translate(W / 2, y + 64);
      x.strokeStyle = 'rgba(232,213,163,0.8)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(0, -50); x.lineTo(50, 0); x.lineTo(0, 50); x.lineTo(-50, 0); x.closePath(); x.stroke();
      x.fillStyle = 'rgba(198,161,91,0.75)';
      for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); x.beginPath(); x.ellipse(0, -20, 6, 14, 0, 0, Math.PI * 2); x.fill(); }
      x.restore();
    }
    return toTexture(c, { repeat: [1, 8] });
  });
}

/* ---------- ঘাস ---------- */
export function grass() {
  return cached('grass', () => {
    const S = 256, c = makeCanvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#2d4a1e'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      x.fillStyle = `hsl(${85 + Math.random() * 30}, ${35 + Math.random() * 25}%, ${16 + Math.random() * 18}%)`;
      x.fillRect(Math.random() * S, Math.random() * S, 1.5, 3 + Math.random() * 4);
    }
    return toTexture(c, { repeat: [90, 140] });
  });
}

/* ---------- জালি (ছিদ্রযুক্ত পর্দা) ---------- */
export function jaali() {
  return cached('jaali', () => {
    const S = 256, c = makeCanvas(S, S), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, S, S);
    x.fillStyle = '#000';
    const n = 4, s = S / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = i * s + s / 2, cy = j * s + s / 2;
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        x.beginPath(); x.arc(cx + Math.cos(a) * s * 0.16, cy + Math.sin(a) * s * 0.16, s * 0.15, 0, Math.PI * 2); x.fill();
      }
      x.beginPath(); x.arc(i * s, j * s, s * 0.08, 0, Math.PI * 2); x.fill();
    }
    return toTexture(c, { repeat: [4, 4], srgb: false });
  });
}

/* ---------- প্রজাপতির ডানা ---------- */
export const WING_PALETTES = {
  gold:      ['#fff3c4', '#f0c45a', '#b07a1c', '#3d2306'],
  champagne: ['#fffaf0', '#ecdcae', '#c6a15b', '#4f3316'],
  pink:      ['#ffe4ec', '#f59bbb', '#c2185b', '#3f0b20'],
  cream:     ['#ffffff', '#f7ead6', '#d8b885', '#5e4126'],
  purple:    ['#f1e6ff', '#bba4e0', '#7e57c2', '#26124a'],
  rose:      ['#ffeaea', '#e6a9b1', '#b76e79', '#43161e'],
  yellow:    ['#fffbd0', '#ffd84d', '#f2a516', '#4d3000']
};

export function wing(name) {
  return cached('wing-' + name, () => {
    const [c0, c1, c2, c3] = WING_PALETTES[name] || WING_PALETTES.gold;
    const S = 512, c = makeCanvas(S, S), x = c.getContext('2d');
    const fore = new Path2D();
    fore.moveTo(6, 236);
    fore.bezierCurveTo(60, 120, 250, 20, 470, 30);
    fore.bezierCurveTo(505, 70, 470, 190, 420, 236);
    fore.bezierCurveTo(330, 268, 150, 262, 6, 262);
    fore.closePath();
    const hind = new Path2D();
    hind.moveTo(6, 262);
    hind.bezierCurveTo(160, 252, 340, 270, 372, 330);
    hind.bezierCurveTo(400, 400, 320, 470, 220, 482);
    hind.bezierCurveTo(150, 500, 60, 430, 6, 330);
    hind.closePath();

    const paint = (path, cx, cy, r) => {
      const g = x.createRadialGradient(0, cy, 10, 0, cy, r);
      g.addColorStop(0, c2); g.addColorStop(0.18, c1); g.addColorStop(0.62, c0); g.addColorStop(0.86, c1); g.addColorStop(1, c3);
      x.fillStyle = g; x.fill(path);
    };
    paint(hind, 0, 300, 420);
    paint(fore, 0, 250, 500);

    // শিরা
    x.save();
    x.clip(fore);
    x.strokeStyle = c3; x.globalAlpha = 0.35; x.lineWidth = 2.2;
    for (let i = 0; i < 7; i++) {
      x.beginPath(); x.moveTo(8, 248);
      const a = -1.25 + i * 0.2;
      x.quadraticCurveTo(200 * Math.cos(a) + 40, 248 + 200 * Math.sin(a) * 0.9, 500 * Math.cos(a), 248 + 500 * Math.sin(a) * 0.95);
      x.stroke();
    }
    x.restore();
    x.save();
    x.clip(hind);
    x.strokeStyle = c3; x.globalAlpha = 0.32; x.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      x.beginPath(); x.moveTo(8, 290);
      const a = 0.05 + i * 0.25;
      x.quadraticCurveTo(150 * Math.cos(a), 290 + 150 * Math.sin(a), 420 * Math.cos(a), 290 + 420 * Math.sin(a));
      x.stroke();
    }
    x.restore();

    // প্রান্তের গাঢ় পাড় ও মুক্তো-বিন্দু
    x.save();
    x.lineWidth = 16; x.strokeStyle = c3; x.globalAlpha = 0.85;
    x.stroke(fore); x.stroke(hind);
    x.restore();
    x.fillStyle = '#fffbe8';
    const spots = [[440, 60, 9], [455, 110, 7], [440, 160, 6], [405, 205, 6], [340, 455, 7], [270, 474, 6], [365, 400, 6], [380, 350, 5]];
    for (const [sx, sy, r] of spots) { x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill(); }
    // চোখ-চিহ্ন
    const eye = (ex, ey, r) => {
      const g = x.createRadialGradient(ex, ey, 1, ex, ey, r);
      g.addColorStop(0, '#fffbe8'); g.addColorStop(0.3, c3); g.addColorStop(0.55, c1); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(ex, ey, r, 0, Math.PI * 2); x.fill();
    };
    eye(300, 130, 34); eye(250, 380, 30);
    const t = toTexture(c);
    return t;
  });
}

/* ---------- পাপড়ি (সাদা — instanceColor দিয়ে রং হয়) ---------- */
export function petal() {
  return cached('petal', () => {
    const S = 128, c = makeCanvas(S, S), x = c.getContext('2d');
    const p = new Path2D();
    p.moveTo(64, 124);
    p.bezierCurveTo(4, 92, 6, 26, 40, 8);
    p.quadraticCurveTo(64, 22, 88, 8);
    p.bezierCurveTo(122, 26, 124, 92, 64, 124);
    const g = x.createRadialGradient(64, 110, 4, 64, 60, 80);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#f2f2f2'); g.addColorStop(1, '#c8c8c8');
    x.fillStyle = g; x.fill(p);
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(64, 120); x.quadraticCurveTo(60, 70, 64, 24); x.stroke();
    return toTexture(c);
  });
}

/* ---------- আভা ---------- */
export function glow() {
  return cached('glow', () => {
    const S = 128, c = makeCanvas(S, S), x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.65)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return toTexture(c);
  });
}

export function flame() {
  return cached('flame', () => {
    const W = 64, H = 128, c = makeCanvas(W, H), x = c.getContext('2d');
    const p = new Path2D();
    p.moveTo(32, 4);
    p.bezierCurveTo(46, 40, 60, 80, 32, 124);
    p.bezierCurveTo(4, 80, 18, 40, 32, 4);
    const g = x.createLinearGradient(0, 124, 0, 4);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,236,150,1)');
    g.addColorStop(0.6, 'rgba(255,150,40,0.95)');
    g.addColorStop(1, 'rgba(255,60,0,0)');
    x.fillStyle = g; x.fill(p);
    return toTexture(c);
  });
}

export function rays() {
  return cached('rays', () => {
    const W = 256, H = 512, c = makeCanvas(W, H), x = c.getContext('2d');
    for (let i = 0; i < 26; i++) {
      const px = 20 + Math.random() * (W - 40), w = 4 + Math.random() * 22;
      const g = x.createLinearGradient(px - w, 0, px + w, 0);
      const a = 0.12 + Math.random() * 0.3;
      g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, `rgba(255,236,190,${a})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      x.fillStyle = g; x.fillRect(px - w, 0, w * 2, H);
    }
    x.globalCompositeOperation = 'destination-in';
    const v = x.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.7, 'rgba(0,0,0,0.5)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    return toTexture(c);
  });
}

/* ---------- দূরের রাজবাড়ির অবয়ব (ছত্রী ও মন্দির-শিখর সহ) ---------- */
export function palaceSilhouette(tint = '#2a0c1c', glowCol = 'rgba(255,190,110,0.9)') {
  return cached('sil' + tint, () => {
    const W = 1024, H = 384, c = makeCanvas(W, H), x = c.getContext('2d');
    x.fillStyle = tint;
    // ছত্রী: চার খুঁটির উপর ছোট গম্বুজ
    const chhatri = (cx, base, w) => {
      const h = w * 0.7;
      x.fillRect(cx - w / 2 - 4, base - 6, w + 8, 6);
      for (const px of [-w / 2, -w / 6, w / 6 - 4, w / 2 - 4]) x.fillRect(cx + px, base - h, 4, h);
      x.fillRect(cx - w / 2 - 6, base - h - 6, w + 12, 7);
      x.beginPath();
      x.moveTo(cx - w / 2, base - h - 6);
      x.quadraticCurveTo(cx - w / 2, base - h - w * 0.75, cx, base - h - w * 0.8);
      x.quadraticCurveTo(cx + w / 2, base - h - w * 0.75, cx + w / 2, base - h - 6);
      x.fill();
      x.fillRect(cx - 1.5, base - h - w * 0.8 - 12, 3, 12);
    };
    // মন্দির-শিখর (বাঁকা চূড়া)
    const shikhara = (cx, base, w, h) => {
      x.beginPath();
      x.moveTo(cx - w / 2, base);
      x.bezierCurveTo(cx - w / 2, base - h * 0.55, cx - w * 0.22, base - h * 0.92, cx, base - h);
      x.bezierCurveTo(cx + w * 0.22, base - h * 0.92, cx + w / 2, base - h * 0.55, cx + w / 2, base);
      x.fill();
      x.beginPath(); x.ellipse(cx, base - h - 6, w * 0.16, 7, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.moveTo(cx, base - h - 34); x.lineTo(cx + 22, base - h - 26); x.lineTo(cx, base - h - 20); x.fill();
      x.fillRect(cx - 1.5, base - h - 34, 3, 28);
    };
    x.fillRect(60, 262, 904, 122);
    x.fillRect(250, 212, 524, 52);
    x.fillRect(390, 170, 244, 44);
    shikhara(512, 172, 150, 150);
    for (const cx of [300, 724]) chhatri(cx, 212, 56);
    for (const cx of [430, 594]) chhatri(cx, 170, 40);
    for (const cx of [110, 190, 834, 914]) chhatri(cx, 262, 46);
    // আলোকিত খিলান-জানালা
    x.fillStyle = glowCol;
    const win = (wx, wy, ww, wh) => { x.beginPath(); x.moveTo(wx, wy); x.lineTo(wx, wy - wh); x.quadraticCurveTo(wx + ww / 2, wy - wh - ww * 0.8, wx + ww, wy - wh); x.lineTo(wx + ww, wy); x.fill(); };
    for (let i = 0; i < 20; i++) win(80 + i * 44, 350, 16, 26);
    for (let i = 0; i < 10; i++) win(270 + i * 50, 252, 18, 22);
    for (let i = 0; i < 4; i++) win(420 + i * 50, 208, 16, 18);
    return toTexture(c);
  });
}
