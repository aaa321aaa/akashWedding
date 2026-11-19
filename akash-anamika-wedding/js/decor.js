/* ==========================================================
   decor.js — উপকরণ (materials) ও পুনঃব্যবহারযোগ্য সাজসজ্জা
   স্তম্ভ, খিলান, প্রদীপ, পদ্ম, গাঁদার মালা, ঝাড়বাতি, পর্দা,
   কলাগাছ, মঙ্গলঘট, লণ্ঠন, গাছ, ফুলের কেয়ারি …
   ========================================================== */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { quality } from './three-scene.js';

const SEG = quality.tier === 'high' ? 1 : quality.tier === 'medium' ? 0.75 : 0.55;
const seg = (n) => Math.max(6, Math.round(n * SEG));

/* ---------- অ্যানিমেশন-রেজিস্ট্রি ---------- */
export const animated = { flames: [], sways: [], bobs: [], spins: [], twinkles: [] };
export const interactiveLotuses = [];

export function updateDecor(dt, t) {
  for (const f of animated.flames) {
    const k = 1 + Math.sin(t * 13 + f.phase) * 0.12 + Math.sin(t * 23 + f.phase * 2) * 0.06;
    f.flame.scale.set(f.base * (1 - (k - 1) * 0.5), f.base * k, f.base * (1 - (k - 1) * 0.5));
    f.flame.rotation.z = Math.sin(t * 5 + f.phase) * 0.06;
    if (f.glow) f.glow.material.opacity = f.glowBase * (0.85 + 0.15 * Math.sin(t * 9 + f.phase));
  }
  for (const s of animated.sways) {
    s.obj.rotation[s.axis || 'z'] = (s.base || 0) + Math.sin(t * s.speed + s.phase) * s.amp;
  }
  for (const b of animated.bobs) {
    b.obj.position.y = b.y + Math.sin(t * b.speed + b.phase) * b.amp;
    if (b.rot) b.obj.rotation.y += dt * b.rot;
  }
  for (const s of animated.spins) s.obj.rotation[s.axis || 'y'] += dt * s.speed;
  for (const tw of animated.twinkles) tw.material.opacity = tw.base * (0.65 + 0.35 * Math.sin(t * tw.speed + tw.phase));
}

/* ---------- স্থির জ্যামিতি একত্রীকরণ (ড্র-কল কমাতে) ---------- */
/**
 * একটি দৃশ্যপটের সব স্থির Mesh-কে উপকরণ অনুযায়ী একটি করে Mesh-এ মিলিয়ে দেয়।
 * অ্যানিমেটেড বস্তু (প্রদীপের শিখা, পর্দা, ঝাড়বাতি, পদ্ম, দরজা ইত্যাদি) অক্ষত থাকে।
 */
export function optimizeStatic(root, extraDynamic = []) {
  const dynamic = new Set(extraDynamic);
  for (const f of animated.flames) dynamic.add(f.flame);
  for (const s of animated.sways) dynamic.add(s.obj);
  for (const b of animated.bobs) dynamic.add(b.obj);
  for (const s of animated.spins) dynamic.add(s.obj);
  for (const l of interactiveLotuses) dynamic.add(l);

  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const remove = [];
  const isDynamic = (o) => { for (let p = o; p && p !== root; p = p.parent) if (dynamic.has(p) || p.userData.dynamic) return true; return false; };

  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || !o.visible) return;
    if (isDynamic(o)) return;
    let g = o.geometry;
    const key = o.material.uuid + '|' + Object.keys(g.attributes).sort().join(',');
    g = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) g.deleteAttribute(name);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, geos: [], cast: false, recv: false, order: o.renderOrder });
    const b = buckets.get(key);
    b.geos.push(g);
    b.cast = b.cast || o.castShadow;
    b.recv = b.recv || o.receiveShadow;
    remove.push(o);
  });

  for (const o of remove) o.parent.remove(o);
  for (const b of buckets.values()) {
    const merged = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
    if (!merged) continue;
    b.geos.forEach(g => { if (g !== merged) g.dispose(); });
    const m = new THREE.Mesh(merged, b.mat);
    m.castShadow = b.cast && quality.shadows;
    m.receiveShadow = b.recv && quality.shadows;
    m.renderOrder = b.order;
    m.matrixAutoUpdate = false;
    root.add(m);
  }
  return root;
}

/* ---------- উপকরণ ---------- */
const carvedCache = new Map();
export function carvedGold(rx = 1, ry = 1) {
  const key = rx + 'x' + ry;
  if (carvedCache.has(key)) return carvedCache.get(key);
  const { map, bump } = TX.goldCarved();
  const m = map.clone(); m.repeat.set(rx, ry); m.needsUpdate = true;
  const b = bump.clone(); b.repeat.set(rx, ry); b.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map: m, bumpMap: b, bumpScale: 1.6, metalness: 1, roughness: 0.32, color: 0xffffff, envMapIntensity: 1.25 });
  carvedCache.set(key, mat);
  return mat;
}

export const mats = (() => {
  const wallBump = TX.goldCarved().bump.clone();
  wallBump.repeat.set(6, 3); wallBump.needsUpdate = true;
  const velvetMap = TX.velvet('#6a1028');
  const velvetDeep = TX.velvet('#3d0917');
  const champVelvet = TX.velvet('#d9c08c');
  return {
    gold: new THREE.MeshStandardMaterial({ color: 0xd9b061, metalness: 1, roughness: 0.26, envMapIntensity: 1.3 }),
    goldDark: new THREE.MeshStandardMaterial({ color: 0xa87a32, metalness: 1, roughness: 0.38, envMapIntensity: 1.1 }),
    champagne: new THREE.MeshStandardMaterial({ color: 0xecdcb0, metalness: 0.85, roughness: 0.3 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc08a2e, metalness: 1, roughness: 0.36 }),
    velvet: new THREE.MeshPhysicalMaterial({ map: velvetMap, color: 0xffffff, roughness: 0.82, sheen: 1, sheenColor: new THREE.Color('#ff9fb4'), sheenRoughness: 0.45, side: THREE.DoubleSide }),
    velvetDeep: new THREE.MeshPhysicalMaterial({ map: velvetDeep, color: 0xffffff, roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#d06a80'), sheenRoughness: 0.5, side: THREE.DoubleSide }),
    champagneCloth: new THREE.MeshPhysicalMaterial({ map: champVelvet, color: 0xffffff, roughness: 0.7, sheen: 1, sheenColor: new THREE.Color('#fff2cc'), sheenRoughness: 0.4, side: THREE.DoubleSide }),
    yellowCloth: new THREE.MeshPhysicalMaterial({ color: 0xffc21a, roughness: 0.75, sheen: 1, sheenColor: new THREE.Color('#fff2a0'), sheenRoughness: 0.4, side: THREE.DoubleSide }),
    ivory: new THREE.MeshStandardMaterial({ color: 0xfff2dc, roughness: 0.55 }),
    wall: new THREE.MeshStandardMaterial({ color: 0xf0dcc0, roughness: 0.78, bumpMap: wallBump, bumpScale: 1.2 }),
    wallDark: new THREE.MeshStandardMaterial({ color: 0x8a3a3a, roughness: 0.8 }),
    marble: new THREE.MeshStandardMaterial({ map: TX.marble(), roughness: 0.2, metalness: 0.05 }),
    carpet: new THREE.MeshStandardMaterial({ map: TX.carpet(), roughness: 0.9 }),
    grass: new THREE.MeshStandardMaterial({ map: TX.grass(), roughness: 0.95 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x2f6b2a, roughness: 0.65, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshStandardMaterial({ color: 0x5e9a2e, roughness: 0.6, side: THREE.DoubleSide }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x24501f, roughness: 0.85, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x7a3b1a, roughness: 0.6 }),
    redCloth: new THREE.MeshStandardMaterial({ color: 0xb0182e, roughness: 0.7 }),
    water: new THREE.MeshStandardMaterial({ color: 0x0c2226, metalness: 0.7, roughness: 0.06, envMapIntensity: 1.6 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xd8c4a4, roughness: 0.8 }),
    flower: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }),
    flowerGlow: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0x401a00, emissiveIntensity: 0.6 }),
    lotus: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, emissive: 0x2a0812, emissiveIntensity: 0.35, side: THREE.DoubleSide }),
    amberGlass: new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: 0xffa040, emissiveIntensity: 1.6, roughness: 0.3 }),
    lightPanel: new THREE.MeshBasicMaterial({ color: 0xffe2a8, fog: false }),
    crystal: new THREE.MeshStandardMaterial({ color: 0xfff6e6, metalness: 0.4, roughness: 0.05, emissive: 0x5a4020, emissiveIntensity: 0.5 }),
    flame: new THREE.MeshBasicMaterial({ map: TX.flame(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
    banana: new THREE.MeshStandardMaterial({ color: 0x3f8a2a, roughness: 0.55, side: THREE.DoubleSide }),
    bananaTrunk: new THREE.MeshStandardMaterial({ color: 0x6d8a3a, roughness: 0.8 }),
    turmeric: new THREE.MeshStandardMaterial({ color: 0xf2b705, roughness: 0.9 }),
    tablecloth: new THREE.MeshStandardMaterial({ color: 0xfff7e8, roughness: 0.75 })
  };
})();

/* ---------- আভা-স্প্রাইট ---------- */
export function glowSprite(color = 0xffc070, size = 2, opacity = 0.8) {
  const m = new THREE.SpriteMaterial({ map: TX.glow(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}

export function lightShaft(w = 6, h = 14, color = 0xffe2a8, opacity = 0.5) {
  const m = new THREE.MeshBasicMaterial({ map: TX.rays(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, -h / 2, 0);
  const mesh = new THREE.Mesh(geo, m);
  return mesh;
}

/* ---------- স্তম্ভ ---------- */
const PILLAR_PROFILE = [
  [0, 0], [1.5, 0], [1.5, 0.04], [1.32, 0.05], [1.32, 0.09], [1.12, 0.11], [1.08, 0.15],
  [0.92, 0.17], [1.04, 0.2], [0.88, 0.24], [0.78, 0.28], [0.74, 0.5], [0.86, 0.53], [0.74, 0.56],
  [0.72, 0.7], [0.92, 0.73], [0.78, 0.755], [1.0, 0.79], [0.82, 0.81], [0.72, 0.835],
  [1.0, 0.87], [1.32, 0.91], [1.22, 0.935], [1.46, 0.965], [1.46, 1.0], [0, 1.0]
];
const pillarGeoCache = new Map();
export function pillar(h = 10, r = 0.5, mat) {
  const key = h + ':' + r;
  if (!pillarGeoCache.has(key)) {
    const pts = PILLAR_PROFILE.map(([a, b]) => new THREE.Vector2(a * r, b * h));
    pillarGeoCache.set(key, new THREE.LatheGeometry(pts, seg(24)));
  }
  const m = new THREE.Mesh(pillarGeoCache.get(key), mat || carvedGold(4, Math.max(2, Math.round(h / 3))));
  m.castShadow = quality.shadows;
  m.receiveShadow = quality.shadows;
  return m;
}

/* ---------- খিলান ---------- */
export function archPath(path, w, h) {
  const hw = w / 2;
  const spring = Math.max(0.1, h - hw * 1.15);
  path.moveTo(-hw, 0);
  path.lineTo(-hw, spring);
  path.bezierCurveTo(-hw, spring + (h - spring) * 0.62, -hw * 0.28, h * 0.94, 0, h);
  path.bezierCurveTo(hw * 0.28, h * 0.94, hw, spring + (h - spring) * 0.62, hw, spring);
  path.lineTo(hw, 0);
  path.closePath();
  return path;
}

export function archFrame({ w = 6, h = 9, thick = 0.8, top = 1.4, depth = 0.6, mat } = {}) {
  const outer = new THREE.Shape();
  const ow = w / 2 + thick;
  outer.moveTo(-ow, 0); outer.lineTo(ow, 0); outer.lineTo(ow, h + top); outer.lineTo(-ow, h + top); outer.closePath();
  const hole = new THREE.Path();
  archPath(hole, w, h);
  outer.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: seg(18) });
  geo.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geo, mat || carvedGold(0.25, 0.25));
  mesh.castShadow = quality.shadows;
  mesh.receiveShadow = quality.shadows;
  // অভ্যন্তরীণ সোনালি কিনারা
  const rimPts = [];
  const p = new THREE.Path(); archPath(p, w * 0.985, h * 0.995);
  p.getSpacedPoints(80).forEach(v => rimPts.push(new THREE.Vector3(v.x, v.y, depth / 2 + 0.06)));
  const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts.slice(1, -2)), 120, 0.09, 6), mats.gold);
  const g = new THREE.Group();
  g.add(mesh, rim);
  // শীর্ষ কলস
  const fin = finial(0.5);
  fin.position.set(0, h + top + 0.05, 0);
  g.add(fin);
  return g;
}

export function finial(s = 1) {
  const pts = [[0, 0], [0.5, 0], [0.55, 0.1], [0.3, 0.2], [0.45, 0.45], [0.2, 0.75], [0.25, 0.85], [0.08, 1.0], [0.04, 1.5], [0, 1.6]]
    .map(([a, b]) => new THREE.Vector2(a * s, b * s));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, seg(14)), mats.gold);
  return m;
}

/* গম্বুজ */
export function dome(r = 2, mat) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const a = i / 16;
    const y = a * r * 1.35;
    const rad = r * (Math.sin(Math.min(1, a * 1.15) * Math.PI * 0.62 + 0.55) * (1 - a * a * 0.92));
    pts.push(new THREE.Vector2(Math.max(0.001, rad), y));
  }
  pts.unshift(new THREE.Vector2(0, 0));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, seg(28)), mat || mats.gold);
  m.castShadow = quality.shadows;
  const g = new THREE.Group();
  g.add(m);
  const f = finial(r * 0.35);
  f.position.y = r * 1.3;
  g.add(f);
  return g;
}

/* ---------- সিঁড়ি ---------- */
export function steps(w = 10, n = 4, sh = 0.3, sd = 0.8, mat = mats.marble) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w + (n - i) * 1.2, sh, sd * (n - i)), mat);
    m.position.set(0, sh * (i + 0.5), -sd * (n - i) / 2);
    m.receiveShadow = quality.shadows;
    g.add(m);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + (n - i) * 1.2, 0.05, 0.05), mats.gold);
    trim.position.set(0, sh * (i + 1), -0.02);
    g.add(trim);
  }
  return g;
}

/* ---------- প্রদীপ ---------- */
let diyaGeo, flameGeo;
/* দুটি আড়াআড়ি তল একত্রে — শিখা সব দিক থেকে দেখা যায়, একটিমাত্র ড্র-কল */
export function flameGeometry() {
  if (!flameGeo) {
    const a = new THREE.PlaneGeometry(0.22, 0.44); a.translate(0, 0.22, 0);
    const b = a.clone(); b.rotateY(Math.PI / 2);
    flameGeo = mergeGeometries([a, b], false);
  }
  return flameGeo;
}
export function diya(scale = 1, { light = true } = {}) {
  if (!diyaGeo) {
    const pts = [[0, 0], [0.18, 0], [0.22, 0.04], [0.16, 0.08], [0.32, 0.12], [0.5, 0.2], [0.52, 0.26], [0.46, 0.24], [0.2, 0.16], [0, 0.15]]
      .map(([a, b]) => new THREE.Vector2(a, b));
    diyaGeo = new THREE.LatheGeometry(pts, seg(16));
  }
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(diyaGeo, mats.brass);
  g.add(bowl);
  const flame = new THREE.Mesh(flameGeometry(), mats.flame);
  flame.position.set(0.32, 0.22, 0);
  g.add(flame);
  let gl = null;
  if (light) {
    gl = glowSprite(0xffa040, 1.6, 0.75);
    gl.position.set(0.32, 0.42, 0);
    g.add(gl);
  }
  g.scale.setScalar(scale);
  animated.flames.push({ flame, glow: gl, glowBase: 0.75, base: 1, phase: Math.random() * 10 });
  return g;
}

/* ---------- পদ্ম ---------- */
let lotusGeo;
function petalGeometry(len, wid, tilt, yaw, colBase, colTip) {
  const geo = new THREE.SphereGeometry(0.5, 10, 8);
  geo.scale(wid, 0.08, len);
  geo.translate(0, 0, len * 0.5);
  // পাপড়ির ডগা সামান্য উপরে বাঁকানো
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i) / len;
    pos.setY(i, pos.getY(i) + z * z * len * 0.25);
    c.copy(colBase).lerp(colTip, Math.pow(Math.max(0, z), 1.6));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.rotateX(-tilt);
  geo.rotateY(yaw);
  geo.computeVertexNormals();
  return geo;
}

function buildLotusGeometry() {
  const white = new THREE.Color('#fff4f2'), pink = new THREE.Color('#ef6f9a'), deep = new THREE.Color('#d4407a');
  const parts = [];
  const layers = [
    { n: 9, len: 1.0, wid: 0.42, tilt: 0.28, off: 0 },
    { n: 9, len: 0.86, wid: 0.4, tilt: 0.75, off: Math.PI / 9 },
    { n: 7, len: 0.66, wid: 0.36, tilt: 1.15, off: 0.2 }
  ];
  for (const L of layers) for (let i = 0; i < L.n; i++) {
    parts.push(petalGeometry(L.len, L.wid, L.tilt, (i / L.n) * Math.PI * 2 + L.off, white, L.tilt > 1 ? deep : pink));
  }
  const pod = new THREE.CylinderGeometry(0.16, 0.12, 0.16, 12);
  pod.translate(0, 0.12, 0);
  const yc = new THREE.Color('#ffd34d');
  const pc = new Float32Array(pod.attributes.position.count * 3);
  for (let i = 0; i < pod.attributes.position.count; i++) pc.set([yc.r, yc.g, yc.b], i * 3);
  pod.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  for (const p of parts) { if (p.index) continue; }
  const merged = mergeGeometries(parts.map(p => p.index ? p.toNonIndexed() : p).concat([pod.toNonIndexed()]), false);
  parts.forEach(p => p.dispose()); pod.dispose();
  return merged;
}

export function lotus(scale = 1, { pad = true } = {}) {
  if (!lotusGeo) lotusGeo = buildLotusGeometry();
  const g = new THREE.Group();
  const flower = new THREE.Mesh(lotusGeo, mats.lotus);
  flower.position.y = 0.06;
  g.add(flower);
  if (pad) {
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(1.25, seg(20), 0.25, Math.PI * 2 - 0.5), mats.leaf);
    leaf.rotation.x = -Math.PI / 2;
    leaf.rotation.z = Math.random() * 6;
    g.add(leaf);
  }
  g.scale.setScalar(scale);
  return g;
}

/** ক্লিক করলে ফুটে ওঠা পদ্ম (প্রতিটি পাপড়ি আলাদা) */
export function interactiveLotus(scale = 1) {
  const g = new THREE.Group();
  const white = new THREE.Color('#fff4f2'), pink = new THREE.Color('#f06b98');
  const petals = [];
  const layers = [{ n: 8, len: 1.0, wid: 0.44, tilt: 1.05 }, { n: 8, len: 0.84, wid: 0.4, tilt: 1.3, off: Math.PI / 8 }, { n: 6, len: 0.62, wid: 0.36, tilt: 1.45 }];
  for (const L of layers) for (let i = 0; i < L.n; i++) {
    const geo = petalGeometry(L.len, L.wid, 0, 0, white, pink);
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / L.n) * Math.PI * 2 + (L.off || 0);
    const mesh = new THREE.Mesh(geo, mats.lotus);
    mesh.rotation.x = -L.tilt;
    pivot.add(mesh);
    g.add(pivot);
    petals.push({ mesh, closed: L.tilt, open: L.tilt * 0.32 + 0.05 });
  }
  const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0x6a4000, emissiveIntensity: 0.6 }));
  pod.position.y = 0.1;
  g.add(pod);
  const leaf = new THREE.Mesh(new THREE.CircleGeometry(1.4, 22, 0.25, Math.PI * 2 - 0.5), mats.leaf);
  leaf.rotation.x = -Math.PI / 2;
  g.add(leaf);
  const halo = glowSprite(0xffb0c8, 3.2, 0);
  halo.position.y = 0.5;
  g.add(halo);
  g.scale.setScalar(scale);
  g.userData = { petals, halo, open: false, lotus: true };
  interactiveLotuses.push(g);
  return g;
}

/* ---------- গাঁদা ও রজনীগন্ধার মালা (InstancedMesh ব্যাচ) ---------- */
const FLOWER_COLORS = {
  marigold: ['#ff8a12', '#ffb21a', '#ff9d1f', '#ffc21a', '#ff7a00'],
  yellow: ['#ffc21a', '#ffd84d', '#ffb000', '#ffe066'],
  rose: ['#c2185b', '#e0436e', '#a30d3c', '#ff7aa2', '#fff7e8'],
  white: ['#fff7e8', '#ffffff', '#f5e8d2'],
  champagne: ['#e8d5a3', '#fff7e8', '#f2c6cf', '#ffffff']
};

export class FlowerBatch {
  constructor(radius = 0.13, palette = 'marigold') {
    this.radius = radius;
    this.palette = palette;
    this.items = [];
  }
  add(p, r = this.radius, color) {
    this.items.push({ p: p.clone(), r, color });
  }
  curve(points, count, opts = {}) {
    const c = new THREE.CatmullRomCurve3(points);
    for (let i = 0; i < count; i++) {
      const p = c.getPointAt(i / Math.max(1, count - 1));
      const accent = opts.accentEvery && i % opts.accentEvery === 0;
      this.add(p, (opts.radius || this.radius) * (accent ? 0.8 : 1), accent ? (opts.accent || '#fff7e8') : undefined);
    }
    return this;
  }
  swag(a, b, sag = 1, count = 24, opts) {
    const m = a.clone().lerp(b, 0.5); m.y -= sag;
    const q1 = a.clone().lerp(m, 0.5); q1.y -= sag * 0.35;
    const q2 = m.clone().lerp(b, 0.5); q2.y -= sag * 0.35;
    return this.curve([a, q1, m, q2, b], count, opts);
  }
  strand(top, length = 2, count = 12, opts) {
    const b = top.clone(); b.y -= length;
    this.curve([top, b], count, opts);
    // ঝুলন্ত ঝালর
    const tip = b.clone(); tip.y -= this.radius * 1.4;
    this.add(tip, this.radius * 0.7, '#c2185b');
    return this;
  }
  build(mat = mats.flower) {
    if (!this.items.length) return new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1, quality.tier === 'low' ? 0 : 1);
    const mesh = new THREE.InstancedMesh(geo, mat, this.items.length);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    const pal = FLOWER_COLORS[this.palette] || FLOWER_COLORS.marigold;
    this.items.forEach((it, i) => {
      d.position.copy(it.p);
      d.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      d.scale.set(it.r, it.r * 0.85, it.r);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      col.set(it.color || pal[(Math.random() * pal.length) | 0]);
      mesh.setColorAt(i, col);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = false;
    return mesh;
  }
}

/* ---------- ঝাড়বাতি ---------- */
export function chandelier(scale = 1, { chain = 6 } = {}) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, chain, 6), mats.gold);
  stem.position.y = chain / 2;
  g.add(stem);
  const tiers = [{ r: 1.6, y: 0 }, { r: 1.1, y: 0.7 }, { r: 0.6, y: 1.3 }];
  const crystalGeo = new THREE.OctahedronGeometry(0.09, 0);
  crystalGeo.scale(1, 1.8, 1);
  let crystalCount = 0;
  tiers.forEach(t => crystalCount += Math.round(t.r * 14) * 2);
  const crystals = new THREE.InstancedMesh(crystalGeo, mats.crystal, crystalCount);
  const d = new THREE.Object3D();
  let ci = 0;
  const bulbs = [];
  for (const t of tiers) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(t.r, 0.06, 8, seg(40)), mats.gold);
    ring.rotation.x = Math.PI / 2; ring.position.y = t.y;
    g.add(ring);
    const n = Math.round(t.r * 14);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      for (let k = 0; k < 2; k++) {
        d.position.set(Math.cos(a) * t.r, t.y - 0.18 - k * 0.24, Math.sin(a) * t.r);
        d.rotation.set(0, a, 0);
        d.scale.setScalar(1 - k * 0.25);
        d.updateMatrix();
        crystals.setMatrixAt(ci++, d.matrix);
      }
      if (i % 2 === 0) bulbs.push(new THREE.Vector3(Math.cos(a) * t.r, t.y + 0.22, Math.sin(a) * t.r));
    }
    // শিকল
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const top = new THREE.Vector3(0, 2.2, 0), bot = new THREE.Vector3(Math.cos(a) * t.r, t.y, Math.sin(a) * t.r);
      const len = top.distanceTo(bot);
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 4), mats.gold);
      ch.position.copy(top).add(bot).multiplyScalar(0.5);
      ch.lookAt(bot); ch.rotateX(Math.PI / 2);
      g.add(ch);
    }
  }
  crystals.instanceMatrix.needsUpdate = true;
  g.add(crystals);
  // মোমবাতির আলো — একটি Points বস্তুতে
  const bgeo = new THREE.BufferGeometry().setFromPoints(bulbs);
  const bmat = new THREE.PointsMaterial({ map: TX.glow(), color: 0xffcf80, size: 0.9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  g.add(new THREE.Points(bgeo, bmat));
  animated.twinkles.push({ material: bmat, base: 1, speed: 3 + Math.random() * 2, phase: Math.random() * 6 });
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mats.gold);
  bottom.position.y = -0.4;
  g.add(bottom);
  const big = glowSprite(0xffc070, 7, 0.5);
  big.position.y = 0.5;
  g.add(big);
  optimizeStatic(g);
  g.scale.setScalar(scale);
  animated.sways.push({ obj: g, axis: 'z', amp: 0.012, speed: 0.7, phase: Math.random() * 6 });
  return g;
}

/* ---------- মখমলের পর্দা ---------- */
export function curtain({ w = 3, h = 10, folds = 6, depth = 0.22, pinch = 0.55, tieY = 0.35, side = 1, mat } = {}) {
  const geo = new THREE.PlaneGeometry(w, h, Math.max(12, folds * 6), 14);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const v = (y + h / 2) / h;           // 0 নিচে, 1 উপরে
    const gauss = Math.exp(-Math.pow((v - tieY) / 0.22, 2));
    const anchorX = side * (w / 2);      // বাঁধনের দিকে টানা
    const nx = x + (anchorX - x) * pinch * gauss;
    const z = Math.sin(((x + w / 2) / w) * folds * Math.PI * 2) * depth * (1 - gauss * 0.4) + gauss * depth * 0.6;
    pos.setXYZ(i, nx, y, z);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat || mats.velvet);
  m.castShadow = quality.shadows;
  const g = new THREE.Group();
  g.add(m);
  // সোনালি বাঁধন
  const tie = new THREE.Mesh(new THREE.TorusGeometry(w * 0.16, 0.06, 6, 16), mats.gold);
  tie.position.set(side * w * 0.5 * (1 - pinch * 0.4) * 0.9, -h / 2 + h * tieY, depth);
  tie.rotation.x = Math.PI / 2;
  tie.scale.set(1, 0.6, 1);
  g.add(tie);
  const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 8), mats.gold);
  tassel.position.copy(tie.position); tassel.position.y -= 0.4;
  g.add(tassel);
  animated.sways.push({ obj: m, axis: 'x', amp: 0.012, speed: 0.6 + Math.random() * 0.3, phase: Math.random() * 6 });
  return g;
}

export function valance(w = 10, h = 1.4, scallops = 6, mat) {
  const geo = new THREE.PlaneGeometry(w, h, scallops * 10, 6);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const v = (y + h / 2) / h;
    const s = Math.abs(Math.sin(((x + w / 2) / w) * scallops * Math.PI));
    const drop = (1 - v) * s * h * 0.55;
    pos.setXYZ(i, x, y - drop, s * 0.25 * (1 - v));
  }
  geo.computeVertexNormals();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, mat || mats.velvet));
  const band = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, 0.12), mats.gold);
  band.position.y = h / 2;
  g.add(band);
  return g;
}

/* ---------- কলাগাছ (বাঙালি ছাদনাতলার চার কোণে) ---------- */
let bananaLeafGeo;
export function bananaPlant(h = 4) {
  if (!bananaLeafGeo) {
    bananaLeafGeo = new THREE.PlaneGeometry(0.8, 3, 4, 10);
    bananaLeafGeo.translate(0, 1.5, 0);
    const p = bananaLeafGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 3, x = p.getX(i);
      p.setZ(i, y * y * 1.4 + Math.abs(x) * 0.25);
      p.setX(i, x * (1 - Math.pow(Math.abs(y - 0.45) * 1.6, 2) * 0.45));
    }
    bananaLeafGeo.computeVertexNormals();
  }
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, h, 10), mats.bananaTrunk);
  trunk.position.y = h / 2;
  g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(bananaLeafGeo, i % 2 ? mats.banana : mats.leafLight);
    leaf.position.y = h * (0.82 + Math.random() * 0.15);
    leaf.rotation.y = (i / 7) * Math.PI * 2 + Math.random() * 0.3;
    leaf.rotation.x = -0.35 - Math.random() * 0.35;
    leaf.scale.setScalar(0.7 + Math.random() * 0.35);
    g.add(leaf);
  }
  return g;
}

/* ---------- মঙ্গলঘট ---------- */
let kalashGeo;
export function kalash(scale = 1) {
  if (!kalashGeo) {
    const pts = [[0, 0], [0.35, 0], [0.38, 0.06], [0.3, 0.1], [0.55, 0.35], [0.6, 0.55], [0.5, 0.8], [0.26, 0.95], [0.24, 1.05], [0.36, 1.12], [0.3, 1.16], [0, 1.16]]
      .map(([a, b]) => new THREE.Vector2(a, b));
    kalashGeo = new THREE.LatheGeometry(pts, seg(20));
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(kalashGeo, mats.brass));
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 6, 24), mats.redCloth);
  band.rotation.x = Math.PI / 2; band.position.y = 0.52;
  g.add(band);
  const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 }));
  coconut.position.y = 1.36; coconut.scale.y = 1.2;
  g.add(coconut);
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.6), mats.leaf);
    leaf.geometry.translate(0, 0.3, 0);
    leaf.position.y = 1.12;
    leaf.rotation.y = (i / 5) * Math.PI * 2;
    leaf.rotation.x = 1.0;
    g.add(leaf);
  }
  // সিঁদুরের লাল ফোঁটা
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), mats.redCloth);
  dot.position.set(0, 0.6, 0.6);
  g.add(dot);
  g.scale.setScalar(scale);
  return g;
}

/* ---------- ঝুলন্ত লণ্ঠন ---------- */
export function lantern(scale = 1, chainLen = 2) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.8, 6), mats.amberGlass);
  g.add(glass);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 6), mats.gold);
  cap.position.y = 0.62; g.add(cap);
  const base = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.3, 6), mats.gold);
  base.position.y = -0.55; base.rotation.x = Math.PI; g.add(base);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.84, 0.04), mats.gold);
    bar.position.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3);
    g.add(bar);
  }
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, chainLen, 4), mats.gold);
  chain.position.y = 0.85 + chainLen / 2; g.add(chain);
  const gl = glowSprite(0xffa850, 3.2, 0.7);
  g.add(gl);
  animated.flames.push({ flame: new THREE.Object3D(), glow: gl, glowBase: 0.7, base: 1, phase: Math.random() * 10 });
  optimizeStatic(g);
  animated.sways.push({ obj: g, axis: 'z', amp: 0.03, speed: 0.9, phase: Math.random() * 6 });
  g.scale.setScalar(scale);
  return g;
}

/* ---------- গাছ ---------- */
export function tree(h = 5, { blossom = null, foliageMat } = {}) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, h * 0.55, 8), mats.trunk);
  trunk.position.y = h * 0.275;
  trunk.castShadow = quality.shadows;
  g.add(trunk);
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const f = new THREE.Mesh(geo, foliageMat || mats.foliage);
    const a = (i / n) * Math.PI * 2;
    const r = i === 0 ? 0 : h * 0.22;
    f.position.set(Math.cos(a) * r, h * (0.62 + (i === 0 ? 0.2 : Math.random() * 0.12)), Math.sin(a) * r);
    f.scale.setScalar(h * (i === 0 ? 0.32 : 0.24));
    f.castShadow = quality.shadows;
    g.add(f);
  }
  if (blossom) {
    const fb = new FlowerBatch(0.12, blossom);
    for (let i = 0; i < 40 * quality.density; i++) {
      const a = Math.random() * Math.PI * 2, u = Math.random();
      fb.add(new THREE.Vector3(Math.cos(a) * h * 0.38 * Math.sqrt(u), h * (0.65 + Math.random() * 0.3), Math.sin(a) * h * 0.38 * Math.sqrt(u)), 0.1 + Math.random() * 0.08);
    }
    g.add(fb.build(mats.flowerGlow));
  }
  return g;
}

/* ---------- ফুলের কেয়ারি ---------- */
export function flowerBed(w = 4, d = 1.2, count = 60, palette = 'rose') {
  const g = new THREE.Group();
  const hedge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), mats.foliage);
  hedge.position.y = 0.25;
  hedge.receiveShadow = quality.shadows;
  g.add(hedge);
  const fb = new FlowerBatch(0.11, palette);
  const n = Math.round(count * quality.density);
  for (let i = 0; i < n; i++) fb.add(new THREE.Vector3((Math.random() - 0.5) * w * 0.95, 0.52 + Math.random() * 0.12, (Math.random() - 0.5) * d * 0.9), 0.08 + Math.random() * 0.07);
  g.add(fb.build());
  const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.18, d + 0.2), mats.stone);
  rim.position.y = 0.09;
  g.add(rim);
  return g;
}

/* ---------- পুকুর ---------- */
export function pond(rx = 6, rz = 4) {
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, seg(48)), mats.water);
  water.rotation.x = -Math.PI / 2;
  water.scale.set(rx, rz, 1);
  water.position.y = 0.05;
  water.receiveShadow = quality.shadows;
  g.add(water);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 8, seg(64)), mats.gold);
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(rx, rz, 1);
  rim.position.y = 0.12;
  g.add(rim);
  const stone = new THREE.Mesh(new THREE.TorusGeometry(1, 0.22, 6, seg(48)), mats.stone);
  stone.rotation.x = Math.PI / 2;
  stone.scale.set(rx + 0.25, rz + 0.25, 1);
  stone.position.y = 0.06;
  g.add(stone);
  return g;
}

/* ---------- মেঝে ---------- */
export function floor(w, d, mat = mats.marble, y = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = quality.shadows;
  return m;
}

export function alpanaDecal(r = 4) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, seg(48)), new THREE.MeshStandardMaterial({ map: TX.alpana(), transparent: true, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.receiveShadow = quality.shadows;
  return m;
}

/* ---------- মরিচবাতি ---------- */
export function stringLights(points, count = 40, color = 0xffd27a, size = 0.45) {
  const c = new THREE.CatmullRomCurve3(points);
  const pts = c.getSpacedPoints(count);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.PointsMaterial({ map: TX.glow(), color, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  animated.twinkles.push({ material: mat, base: 1, speed: 2 + Math.random() * 2, phase: Math.random() * 6 });
  return new THREE.Points(geo, mat);
}

/* ---------- পিঁড়ি (বিবাহের আসন) ---------- */
export function piri() {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.8), mats.wood);
  seat.position.y = 0.16;
  g.add(seat);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshStandardMaterial({ map: TX.alpana(), roughness: 0.7, color: 0xffe2c0 }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.235;
  g.add(top);
  for (const [x, z] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mats.wood);
    leg.position.set(x, 0.05, z);
    g.add(leg);
  }
  return g;
}

/* ---------- অলংকৃত ৩D ফ্রেম (খিলান-শীর্ষ) ---------- */
export function ornamentFrame(w = 8, h = 10, mat) {
  const g = new THREE.Group();
  const outer = new THREE.Shape();
  archPath(outer, w + 1, h + 0.8);
  const hole = new THREE.Path();
  archPath(hole, w, h);
  outer.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: seg(24) });
  const frame = new THREE.Mesh(geo, mat || carvedGold(0.3, 0.3));
  frame.castShadow = quality.shadows;
  g.add(frame);
  // রোজেট
  const ros = (x, y, s = 1) => {
    const r = new THREE.Group();
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.4 * s, 0.08 * s, 8, 20), mats.gold);
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 12, 10), mats.gold);
    r.add(t, c);
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 8, 6), mats.champagne);
      const a = (i / 8) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.62 * s, Math.sin(a) * 0.62 * s, 0);
      p.scale.set(1, 0.6, 0.6);
      p.rotation.z = a;
      r.add(p);
    }
    r.position.set(x, y, 0.38);
    g.add(r);
  };
  ros(-w / 2 - 0.5, 0.4); ros(w / 2 + 0.5, 0.4); ros(0, h + 0.8, 1.3);
  return g;
}
