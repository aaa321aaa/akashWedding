/* ==========================================================
   invitation.js — ভাসমান ত্রিমাত্রিক নিমন্ত্রণপত্র
   মখমলের মলাট, সোনালি কিনারা, সোনালি সিলমোহর, ভেতরের কার্ড
   ========================================================== */
import * as THREE from 'three';
import { quality, LAYOUT } from './three-scene.js';
import { mats, glowSprite, lightShaft } from './decor.js';
import { makeCanvas, toTexture } from './textures.js';

const W = 4.4, H = 6;
const CW = 1024, CH = Math.round(1024 * H / W);
const SERIF = '"Noto Serif Bengali", "Noto Sans Bengali", serif';

/* ---------- ক্যানভাস-অলংকরণ ---------- */
function goldGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#fff3cf'); g.addColorStop(0.35, '#e8d5a3'); g.addColorStop(0.6, '#c6a15b'); g.addColorStop(1, '#9c7432');
  return g;
}

function drawLotusEmblem(x, cx, cy, s, fill, stroke) {
  x.save();
  x.translate(cx, cy);
  x.scale(s, s);
  x.lineWidth = 3 / s * 1.2;
  x.strokeStyle = stroke; x.fillStyle = fill;
  const petal = (rot, len, wid) => {
    x.save(); x.rotate(rot);
    x.beginPath(); x.moveTo(0, 0);
    x.bezierCurveTo(wid, -len * 0.35, wid * 0.6, -len * 0.85, 0, -len);
    x.bezierCurveTo(-wid * 0.6, -len * 0.85, -wid, -len * 0.35, 0, 0);
    x.fill(); x.stroke(); x.restore();
  };
  petal(-1.2, 70, 26); petal(1.2, 70, 26);
  petal(-0.75, 86, 30); petal(0.75, 86, 30);
  petal(-0.35, 98, 32); petal(0.35, 98, 32);
  petal(0, 110, 34);
  x.beginPath(); x.ellipse(0, 6, 92, 12, 0, 0, Math.PI * 2); x.fill(); x.stroke();
  // মঙ্গলঘটের রেখা
  x.beginPath(); x.arc(0, -46, 10, 0, Math.PI * 2); x.fillStyle = stroke; x.fill();
  x.restore();
}

function drawHeart(x, cx, cy, s, fill) {
  x.save(); x.translate(cx, cy); x.scale(s, s);
  x.beginPath();
  x.moveTo(0, 12);
  x.bezierCurveTo(-28, -8, -16, -34, 0, -18);
  x.bezierCurveTo(16, -34, 28, -8, 0, 12);
  x.fillStyle = fill; x.fill();
  x.restore();
}

function drawCorner(x, px, py, rot, col) {
  x.save(); x.translate(px, py); x.rotate(rot);
  x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 4;
  x.beginPath(); x.moveTo(0, 150); x.lineTo(0, 30); x.quadraticCurveTo(0, 0, 30, 0); x.lineTo(150, 0); x.stroke();
  x.lineWidth = 2;
  x.beginPath(); x.moveTo(18, 120); x.lineTo(18, 40); x.quadraticCurveTo(18, 18, 40, 18); x.lineTo(120, 18); x.stroke();
  x.beginPath(); x.arc(46, 46, 14, 0, Math.PI * 2); x.fill();
  for (let i = 0; i < 4; i++) {
    x.save(); x.translate(46, 46); x.rotate(i * Math.PI / 2 + Math.PI / 4);
    x.beginPath(); x.ellipse(0, -28, 8, 14, 0, 0, Math.PI * 2); x.fill(); x.restore();
  }
  x.restore();
}

function drawBorder(x, inset, col, lw) {
  x.strokeStyle = col; x.lineWidth = lw;
  x.strokeRect(inset, inset, CW - inset * 2, CH - inset * 2);
}

function drawDivider(x, cy, w, col) {
  x.save();
  x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 3;
  x.beginPath(); x.moveTo(CW / 2 - w, cy); x.lineTo(CW / 2 - 24, cy); x.moveTo(CW / 2 + 24, cy); x.lineTo(CW / 2 + w, cy); x.stroke();
  x.translate(CW / 2, cy); x.rotate(Math.PI / 4); x.fillRect(-10, -10, 20, 20);
  x.restore();
}

function drawTextCentered(x, text, y, size, weight, fill, shadow) {
  x.font = `${weight} ${size}px ${SERIF}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (shadow) { x.shadowColor = shadow; x.shadowBlur = 18; x.shadowOffsetY = 3; }
  x.fillStyle = fill;
  x.fillText(text, CW / 2, y);
  x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
}

function coverFrontTexture() {
  const c = makeCanvas(CW, CH), x = c.getContext('2d');
  const bg = x.createRadialGradient(CW / 2, CH * 0.4, 50, CW / 2, CH / 2, CH * 0.75);
  bg.addColorStop(0, '#7a1630'); bg.addColorStop(0.55, '#580D20'); bg.addColorStop(1, '#2a0610');
  x.fillStyle = bg; x.fillRect(0, 0, CW, CH);
  // মখমলের দানা
  const img = x.getImageData(0, 0, CW, CH);
  for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 14; img.data[i] += n; img.data[i + 1] += n * 0.4; img.data[i + 2] += n * 0.5; }
  x.putImageData(img, 0, 0);
  // হালকা অলংকারিক জাল
  x.globalAlpha = 0.08; x.strokeStyle = '#e8d5a3'; x.lineWidth = 2;
  for (let yy = 0; yy < CH; yy += 90) for (let xx = (yy / 90) % 2 ? 45 : 0; xx < CW; xx += 90) { x.beginPath(); x.arc(xx, yy, 22, 0, Math.PI * 2); x.stroke(); }
  x.globalAlpha = 1;
  const gold = goldGradient(x, 0, CH);
  drawBorder(x, 34, gold, 8);
  drawBorder(x, 56, '#c6a15b', 2);
  drawCorner(x, 70, 70, 0, '#d9b061');
  drawCorner(x, CW - 70, 70, Math.PI / 2, '#d9b061');
  drawCorner(x, CW - 70, CH - 70, Math.PI, '#d9b061');
  drawCorner(x, 70, CH - 70, -Math.PI / 2, '#d9b061');
  drawLotusEmblem(x, CW / 2, 330, 1.25, 'rgba(198,161,91,0.25)', '#e8c27a');
  drawTextCentered(x, 'শুভ বিবাহ', 500, 112, 800, goldGradient(x, 440, 560), 'rgba(0,0,0,0.6)');
  drawDivider(x, 600, 230, '#c6a15b');
  drawTextCentered(x, 'আকাশ ঘোষ', 735, 104, 800, goldGradient(x, 680, 790), 'rgba(0,0,0,0.6)');
  drawHeart(x, CW / 2, 860, 1.7, '#e0436e');
  drawTextCentered(x, 'অনামিকা ঘোষ', 985, 104, 800, goldGradient(x, 930, 1040), 'rgba(0,0,0,0.6)');
  drawDivider(x, 1110, 300, '#c6a15b');
  // নিচের আলপনা-অর্ধবৃত্ত
  x.save(); x.translate(CW / 2, CH - 70);
  x.strokeStyle = '#c6a15b'; x.lineWidth = 3;
  for (let r = 60; r <= 150; r += 30) { x.beginPath(); x.arc(0, 0, r, Math.PI, 0); x.stroke(); }
  for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; x.beginPath(); x.arc(Math.cos(a) * 170, Math.sin(a) * 170, 7, 0, Math.PI * 2); x.fillStyle = '#e8d5a3'; x.fill(); }
  x.restore();
  return toTexture(c);
}

function coverInsideTexture() {
  const c = makeCanvas(512, Math.round(512 * H / W)), x = c.getContext('2d');
  const w = c.width, h = c.height;
  x.fillStyle = '#f5e8d2'; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#c6a15b'; x.lineWidth = 6; x.strokeRect(18, 18, w - 36, h - 36);
  x.lineWidth = 2; x.strokeRect(30, 30, w - 60, h - 60);
  x.save(); x.translate(w / 2, h / 2); x.strokeStyle = 'rgba(183,110,121,0.5)'; x.lineWidth = 3;
  for (let i = 0; i < 16; i++) { x.rotate(Math.PI / 8); x.beginPath(); x.ellipse(0, -90, 18, 50, 0, 0, Math.PI * 2); x.stroke(); }
  for (let r = 30; r <= 160; r += 40) { x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke(); }
  x.restore();
  return toTexture(c);
}

function innerCardTexture() {
  const c = makeCanvas(CW, CH), x = c.getContext('2d');
  const bg = x.createRadialGradient(CW / 2, CH / 2, 100, CW / 2, CH / 2, CH * 0.75);
  bg.addColorStop(0, '#fffaf0'); bg.addColorStop(0.7, '#f7ebd5'); bg.addColorStop(1, '#ead6b2');
  x.fillStyle = bg; x.fillRect(0, 0, CW, CH);
  drawBorder(x, 30, '#580D20', 10);
  drawBorder(x, 50, '#c6a15b', 4);
  drawBorder(x, 64, '#c6a15b', 1.5);
  drawCorner(x, 76, 76, 0, '#b8873e');
  drawCorner(x, CW - 76, 76, Math.PI / 2, '#b8873e');
  drawCorner(x, CW - 76, CH - 76, Math.PI, '#b8873e');
  drawCorner(x, 76, CH - 76, -Math.PI / 2, '#b8873e');
  drawLotusEmblem(x, CW / 2, 250, 1.05, 'rgba(183,110,121,0.35)', '#b8873e');
  drawDivider(x, 330, 260, '#b8873e');
  drawDivider(x, CH - 250, 260, '#b8873e');
  // নিচে হালকা আলপনা
  x.save(); x.translate(CW / 2, CH - 140); x.globalAlpha = 0.6;
  x.strokeStyle = '#580D20'; x.lineWidth = 3;
  for (let i = 0; i < 12; i++) { x.rotate(Math.PI / 6); x.beginPath(); x.ellipse(0, -48, 12, 30, 0, 0, Math.PI * 2); x.stroke(); }
  x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 2); x.fillStyle = '#c6a15b'; x.fill();
  x.restore();
  // মাঝের হালকা আভা (নামের জন্য স্থান)
  const g = x.createRadialGradient(CW / 2, CH / 2, 20, CW / 2, CH / 2, 420);
  g.addColorStop(0, 'rgba(255,236,190,0.55)'); g.addColorStop(1, 'rgba(255,236,190,0)');
  x.fillStyle = g; x.fillRect(0, 0, CW, CH);
  return toTexture(c);
}

function sealTexture() {
  const S = 256, c = makeCanvas(S, S), x = c.getContext('2d');
  const g = x.createRadialGradient(S * 0.4, S * 0.35, 10, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#fff1c8'); g.addColorStop(0.45, '#d9b061'); g.addColorStop(1, '#8a6224');
  x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#7a5418'; x.lineWidth = 6; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 18, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 2;
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; x.beginPath(); x.arc(S / 2 + Math.cos(a) * (S / 2 - 9), S / 2 + Math.sin(a) * (S / 2 - 9), 3, 0, Math.PI * 2); x.fillStyle = '#7a5418'; x.fill(); }
  x.font = `800 74px ${SERIF}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#5a3a10';
  x.fillText('আ', S / 2 - 46, S / 2 + 6);
  x.fillText('অ', S / 2 + 46, S / 2 + 6);
  drawHeart(x, S / 2, S / 2 + 4, 0.8, '#9a1830');
  return toTexture(c);
}

/* ---------- নিমন্ত্রণপত্র তৈরি ---------- */
export function createInvitation(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.invite);
  const card = new THREE.Group();    // ভাসমান অংশ
  root.add(card);

  const edgeMat = mats.gold;
  const velvetBack = new THREE.MeshPhysicalMaterial({ color: 0x580D20, roughness: 0.8, sheen: 1, sheenColor: new THREE.Color('#ff9fb4'), sheenRoughness: 0.5 });

  // পেছনের পাটা
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.06), [edgeMat, edgeMat, edgeMat, edgeMat, velvetBack, velvetBack]);
  base.position.z = -0.06;
  base.castShadow = quality.shadows;
  card.add(base);

  // ভেতরের কার্ড
  const innerMat = new THREE.MeshStandardMaterial({ map: innerCardTexture(), roughness: 0.62, emissive: 0xffe6b8, emissiveIntensity: 0.0 });
  const creamEdge = new THREE.MeshStandardMaterial({ color: 0xf2dfb8, roughness: 0.6 });
  const inner = new THREE.Mesh(new THREE.BoxGeometry(W - 0.28, H - 0.28, 0.035), [creamEdge, creamEdge, creamEdge, creamEdge, innerMat, creamEdge]);
  inner.position.z = 0;
  card.add(inner);

  // মলাট (বাঁ কিনারায় কব্জা)
  const coverPivot = new THREE.Group();
  coverPivot.position.set(-W / 2, 0, 0.05);
  const coverFront = new THREE.MeshPhysicalMaterial({ map: coverFrontTexture(), roughness: 0.7, sheen: 0.8, sheenColor: new THREE.Color('#ffb0c0'), sheenRoughness: 0.5, emissive: 0x200408, emissiveIntensity: 0.2 });
  const coverInside = new THREE.MeshStandardMaterial({ map: coverInsideTexture(), roughness: 0.7 });
  const cover = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.05), [edgeMat, edgeMat, edgeMat, edgeMat, coverFront, coverInside]);
  cover.position.x = W / 2;
  cover.castShadow = quality.shadows;
  coverPivot.add(cover);
  card.add(coverPivot);
  // সোনালি কিনারার ফ্রেম (মলাটে)
  const rimGeo = new THREE.BoxGeometry(W + 0.08, 0.08, 0.08);
  for (const y of [-H / 2, H / 2]) { const r = new THREE.Mesh(rimGeo, edgeMat); r.position.set(W / 2, y, 0); coverPivot.add(r); }
  const rimGeoV = new THREE.BoxGeometry(0.08, H + 0.08, 0.08);
  for (const xx of [0, W]) { const r = new THREE.Mesh(rimGeoV, edgeMat); r.position.set(xx, 0, 0); coverPivot.add(r); }

  // সিলমোহর (দুই অর্ধেক)
  const sealTex = sealTexture();
  sealTex.center.set(0.5, 0.5);
  sealTex.rotation = -Math.PI / 2;
  const sealMat = new THREE.MeshStandardMaterial({ map: sealTex, metalness: 0.85, roughness: 0.3, color: 0xffffff });
  const sealSide = new THREE.MeshStandardMaterial({ color: 0xb8873e, metalness: 1, roughness: 0.35 });
  const makeHalf = (start) => {
    const g = new THREE.CylinderGeometry(0.48, 0.5, 0.1, 32, 1, false, start, Math.PI);
    g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, [sealSide, sealMat, sealSide]);
    return m;
  };
  const seal = new THREE.Group();
  const sealR = makeHalf(0), sealL = makeHalf(Math.PI);
  seal.add(sealR, sealL);
  seal.position.set(W / 2 - 0.05, -0.2, 0.14);
  card.add(seal);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.02), new THREE.MeshStandardMaterial({ color: 0x8a1530, roughness: 0.5, metalness: 0.2 }));
  ribbon.position.set(W / 2 - 0.05, -0.2, 0.09);
  card.add(ribbon);

  // ভেতরের সোনালি আলো
  const glowBack = glowSprite(0xffd690, 11, 0.35);
  glowBack.position.set(0, 0, -0.6);
  root.add(glowBack);
  const glowFront = glowSprite(0xffe6b0, 8, 0);
  glowFront.position.set(0, 0, 0.4);
  card.add(glowFront);
  const shaft = lightShaft(5, 9, 0xffe2a8, 0);
  shaft.position.set(0, 4.5, 0.2);
  card.add(shaft);

  world.scene.add(root);

  // ভাসমান গতি
  const state = { float: 1, opened: false, sway: 1 };
  const baseY = 0;
  world.add((dt, t) => {
    const f = state.float;
    card.position.y = baseY + Math.sin(t * 0.8) * 0.14 * f;
    card.rotation.y = Math.sin(t * 0.45) * 0.16 * f * state.sway;
    card.rotation.x = Math.sin(t * 0.6) * 0.04 * f;
    card.rotation.z = Math.sin(t * 0.5 + 1) * 0.02 * f;
    glowBack.material.opacity = 0.3 + Math.sin(t * 1.3) * 0.06 + (state.opened ? 0.25 : 0);
  });

  return { root, card, coverPivot, cover, inner, innerMat, seal, sealL, sealR, ribbon, glowFront, glowBack, shaft, state, center: LAYOUT.invite.clone() };
}

/* ---------- খোলার অ্যানিমেশন ---------- */
export function openInvitation(inv, { petals, butterflies, sparkles, world, onReveal }) {
  const gsap = window.gsap;
  const fast = quality.reduced ? 0.4 : 1;
  inv.state.opened = true;
  const worldSeal = new THREE.Vector3();
  const tl = gsap.timeline();

  // ১. কার্ড দর্শকের দিকে ঘোরে ও এগিয়ে আসে
  tl.to(inv.state, { sway: 0, duration: 0.9 * fast, ease: 'power2.out' }, 0);
  tl.to(inv.card.position, { z: 0.6, duration: 1.1 * fast, ease: 'power3.out' }, 0);
  tl.fromTo(inv.card.rotation, { y: inv.card.rotation.y }, { y: 0, duration: 0.9 * fast, ease: 'power2.out' }, 0);

  // ২. সিলমোহর ভাঙে
  tl.add(() => {
    inv.seal.getWorldPosition(worldSeal);
    sparkles.explode(worldSeal, 70, 3, 0.14);
  }, 0.9 * fast);
  tl.to(inv.sealR.position, { x: 0.9, y: -0.9, z: 0.6, duration: 1.0 * fast, ease: 'power2.in' }, 0.9 * fast);
  tl.to(inv.sealR.rotation, { z: -1.8, x: 1.2, duration: 1.0 * fast, ease: 'power1.in' }, 0.9 * fast);
  tl.to(inv.sealL.position, { x: -0.6, y: -1.1, z: 0.7, duration: 1.0 * fast, ease: 'power2.in' }, 0.95 * fast);
  tl.to(inv.sealL.rotation, { z: 2.1, y: -1, duration: 1.0 * fast, ease: 'power1.in' }, 0.95 * fast);
  tl.to(inv.ribbon.scale, { x: 0.001, duration: 0.6 * fast, ease: 'power2.in' }, 1.0 * fast);
  tl.add(() => { inv.seal.visible = false; inv.ribbon.visible = false; }, 2.0 * fast);

  // ৩. মলাট খোলে
  tl.to(inv.coverPivot.rotation, { y: -2.55, duration: 1.8 * fast, ease: 'power2.inOut' }, 1.25 * fast);
  tl.to(inv.coverPivot.position, { z: 0.15, duration: 1.8 * fast, ease: 'power2.inOut' }, 1.25 * fast);

  // ৪. সোনালি আলো ও ভেতরের কার্ড বেরিয়ে আসে
  tl.to(inv.glowFront.material, { opacity: 0.9, duration: 1.0 * fast, ease: 'power2.out' }, 1.6 * fast);
  tl.to(inv.shaft.material, { opacity: 0.55, duration: 1.2 * fast }, 1.6 * fast);
  tl.to(inv.innerMat, { emissiveIntensity: 0.22, duration: 1.4 * fast }, 1.6 * fast);
  tl.to(world.rig, { keyBoost: 1.5, duration: 1.4 * fast }, 1.6 * fast);
  tl.to(inv.inner.position, { z: 0.55, y: 0.12, duration: 1.6 * fast, ease: 'power3.out' }, 2.1 * fast);
  tl.to(inv.inner.scale, { x: 1.04, y: 1.04, duration: 1.6 * fast, ease: 'power3.out' }, 2.1 * fast);
  tl.to(inv.glowFront.material, { opacity: 0.25, duration: 1.6 * fast }, 3.0 * fast);
  tl.to(inv.shaft.material, { opacity: 0.18, duration: 2 * fast }, 3.2 * fast);

  // ৫. পাপড়ি ও প্রজাপতি
  tl.add(() => {
    const c = new THREE.Vector3(); inv.inner.getWorldPosition(c);
    petals.burst(c.clone().add(new THREE.Vector3(0, 3.5, 0.5)), new THREE.Vector3(0, -0.2, 1), quality.reduced ? 60 : 160, { spread: 2.4, speed: 3.2, life: 6, radius: 2.4 });
    sparkles.explode(c.clone().add(new THREE.Vector3(0, 0, 0.6)), 90, 3.5, 0.15);
    butterflies.circlePoint(c.clone().add(new THREE.Vector3(0, 0, 0.8)), 3.3, 3.8, { count: 6, duration: 5.5, speed: 1.2 });
  }, 2.0 * fast);

  // ৬. নামের প্রকাশ
  tl.add(() => onReveal && onReveal(), 2.6 * fast);
  return tl;
}
