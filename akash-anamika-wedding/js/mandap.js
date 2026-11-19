/* ==========================================================
   mandap.js — বাঙালি হিন্দু বিবাহের ছাদনাতলা / মণ্ডপ
   চার সোনালি স্তম্ভ, কলাগাছ, মঙ্গলঘট, যজ্ঞকুণ্ড, পিঁড়ি,
   মখমলের চাঁদোয়া, গাঁদার মালা, ঝাড়বাতি, প্রদীপ
   ========================================================== */
import * as THREE from 'three';
import { quality } from './three-scene.js';
import {
  mats, carvedGold, pillar, dome, finial, diya, lotus, FlowerBatch, chandelier, curtain, valance,
  bananaPlant, kalash, piri, glowSprite, lightShaft, alpanaDecal, steps, archFrame, animated, flameGeometry
} from './decor.js';

function canopy(w, d, sag, mat) {
  const geo = new THREE.PlaneGeometry(w, d, 24, 24);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (w / 2), z = p.getZ(i) / (d / 2);
    const k = (1 - x * x) * (1 - z * z);
    p.setY(i, -k * sag + Math.sin(x * 9) * 0.04);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = quality.shadows;
  return m;
}

/* যজ্ঞকুণ্ড (পবিত্র অগ্নি) */
function yagnaKund() {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), mats.brass);
  outer.position.y = 0.25;
  g.add(outer);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), new THREE.MeshStandardMaterial({ color: 0x2a1408, roughness: 1 }));
  inner.position.y = 0.48;
  g.add(inner);
  const fl = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(flameGeometry(), mats.flame);
    f.scale.set(2.3, 2.5, 2.3);
    f.position.set((Math.random() - 0.5) * 0.5, 0.5, (Math.random() - 0.5) * 0.5);
    f.scale.multiplyScalar(0.7 + Math.random() * 0.5);
    fl.add(f);
    animated.flames.push({ flame: f, glow: null, base: f.scale.y, phase: Math.random() * 10 });
  }
  g.add(fl);
  const gl = glowSprite(0xff9a40, 4, 0.8);
  gl.position.y = 1.1;
  g.add(gl);
  animated.flames.push({ flame: new THREE.Object3D(), glow: gl, glowBase: 0.8, base: 1, phase: 1 });
  return g;
}

/**
 * মণ্ডপ তৈরি
 * @param {object} o  { scale, grand }
 */
export function createMandap({ scale = 1, grand = false } = {}) {
  const root = new THREE.Group();
  const S = 5.2;                       // স্তম্ভের অর্ধ-দূরত্ব
  const PH = grand ? 10.5 : 9;         // স্তম্ভের উচ্চতা
  const PLAT = 0.9;

  // মঞ্চ
  const plat = new THREE.Mesh(new THREE.BoxGeometry(S * 2 + 3, PLAT, S * 2 + 3), mats.marble);
  plat.position.y = PLAT / 2;
  plat.receiveShadow = quality.shadows;
  root.add(plat);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(S * 2 + 3.15, 0.18, S * 2 + 3.15), carvedGold(2, 0.2));
  trim.position.y = PLAT - 0.05;
  root.add(trim);
  const st = steps(6, 3, PLAT / 3, 0.6, mats.marble);
  st.rotation.y = Math.PI;
  st.position.set(0, 0, S + 1.5);
  root.add(st);
  const al = alpanaDecal(S * 0.95);
  al.position.y = PLAT + 0.02;
  root.add(al);

  // স্তম্ভ, কলাগাছ, মঙ্গলঘট
  const corners = [[-S, -S], [S, -S], [-S, S], [S, S]];
  for (const [x, z] of corners) {
    const p = pillar(PH, 0.48);
    p.position.set(x, PLAT, z);
    root.add(p);
    const b = bananaPlant(PH * 0.55);
    b.position.set(x + Math.sign(x) * 1.1, PLAT, z + Math.sign(z) * 0.9);
    root.add(b);
    const k = kalash(0.9);
    k.position.set(x - Math.sign(x) * 0.9, PLAT, z + Math.sign(z) * 0.5);
    root.add(k);
  }

  // স্তম্ভের মাথায় বিম ও ছাদ
  const top = PLAT + PH;
  const beamMat = carvedGold(4, 0.3);
  for (const z of [-S, S]) { const b = new THREE.Mesh(new THREE.BoxGeometry(S * 2 + 1.4, 0.6, 0.6), beamMat); b.position.set(0, top + 0.3, z); root.add(b); }
  for (const x of [-S, S]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, S * 2 + 1.4), beamMat); b.position.set(x, top + 0.3, 0); root.add(b); }

  // চাঁদোয়া (মখমল)
  const cn = canopy(S * 2 + 1.2, S * 2 + 1.2, 1.1, mats.velvet);
  cn.position.y = top + 0.15;
  root.add(cn);

  // পিরামিডাকার ছাদ ও গম্বুজ
  const roofH = grand ? 4.2 : 3.2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry((S + 1) * 1.414, roofH, 4, 1, true), carvedGold(3, 1));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = top + 0.6 + roofH / 2;
  roof.castShadow = quality.shadows;
  root.add(roof);
  const roofUnder = new THREE.Mesh(new THREE.ConeGeometry((S + 1) * 1.414, roofH, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0x580D20, side: THREE.BackSide, roughness: 0.8 }));
  roofUnder.rotation.y = Math.PI / 4;
  roofUnder.position.copy(roof.position);
  root.add(roofUnder);
  const dm = dome(1.3, mats.gold);
  dm.position.y = top + 0.6 + roofH - 0.3;
  root.add(dm);
  for (const [x, z] of corners) {
    const f = finial(0.8);
    f.position.set(x, top + 0.6, z);
    root.add(f);
  }
  // ছাদের কিনারায় ঝালর
  const beadGeo = new THREE.ConeGeometry(0.1, 0.36, 6);
  beadGeo.rotateX(Math.PI);
  const perSide = 26;
  const beads = new THREE.InstancedMesh(beadGeo, mats.gold, perSide * 4);
  const d = new THREE.Object3D();
  let bi = 0;
  for (let s = 0; s < 4; s++) for (let i = 0; i < perSide; i++) {
    const u = -S - 0.6 + (i / (perSide - 1)) * (S * 2 + 1.2);
    const pos = [[u, -S - 0.7], [u, S + 0.7], [-S - 0.7, u], [S + 0.7, u]][s];
    d.position.set(pos[0], top - 0.15, pos[1]);
    d.updateMatrix();
    beads.setMatrixAt(bi++, d.matrix);
  }
  root.add(beads);

  // পর্দা — প্রতিটি স্তম্ভে বাঁধা
  for (const [x, z] of corners) {
    for (const face of ['front', 'side']) {
      const c = curtain({ w: 2.2, h: PH - 0.4, folds: 4, depth: 0.18, side: face === 'front' ? -Math.sign(x) : -Math.sign(z), pinch: 0.6, tieY: 0.36, mat: mats.velvet });
      if (face === 'front') { c.position.set(x - Math.sign(x) * 1.1, PLAT + PH / 2, z + Math.sign(z) * 0.35); if (z < 0) c.rotation.y = Math.PI; }
      else { c.position.set(x + Math.sign(x) * 0.35, PLAT + PH / 2, z - Math.sign(z) * 1.1); c.rotation.y = Math.sign(x) * Math.PI / 2; }
      root.add(c);
    }
  }

  // গাঁদা ফুলের মালা
  const fb = new FlowerBatch(0.15, 'marigold');
  const gy = top - 0.4;
  const edges = [[[-S, gy, S], [S, gy, S]], [[-S, gy, -S], [S, gy, -S]], [[-S, gy, -S], [-S, gy, S]], [[S, gy, -S], [S, gy, S]]];
  for (const [a, b] of edges) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    fb.swag(A, B, 1.6, 40, { accentEvery: 6 });
    fb.swag(A.clone().setY(gy - 0.5), B.clone().setY(gy - 0.5), 2.4, 46, { accentEvery: 5 });
  }
  // ঝুলন্ত ফুলের লহর
  const strands = grand ? 9 : 6;
  for (let i = 0; i < strands; i++) {
    const u = -S + 0.6 + (i / (strands - 1)) * (S * 2 - 1.2);
    for (const z of [-S, S]) fb.strand(new THREE.Vector3(u, gy - 0.2, z), 2.2 + Math.sin(i * 1.3) * 0.6, 12, { accentEvery: 4 });
  }
  // স্তম্ভে প্যাঁচানো মালা
  for (const [x, z] of corners) {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const a = i * 0.5; pts.push(new THREE.Vector3(x + Math.cos(a) * 0.62, PLAT + 0.6 + i * (PH - 1.2) / 40, z + Math.sin(a) * 0.62)); }
    fb.curve(pts, 70, { accentEvery: 7 });
  }
  root.add(fb.build());

  // রজনীগন্ধার সাদা লহর (কেন্দ্রে)
  const wb = new FlowerBatch(0.09, 'white');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    wb.strand(new THREE.Vector3(Math.cos(a) * 1.6, top - 0.6, Math.sin(a) * 1.6), 2.4, 16);
  }
  root.add(wb.build());

  // ঝাড়বাতি
  const ch = chandelier(grand ? 1.3 : 1.0, { chain: 2 });
  ch.position.set(0, top - 3.6, 0);
  root.add(ch);

  // যজ্ঞকুণ্ড ও পিঁড়ি
  const kund = yagnaKund();
  kund.position.set(0, PLAT, -0.6);
  root.add(kund);
  const p1 = piri(); p1.position.set(-1.6, PLAT, 1.4); p1.rotation.y = 0.35; root.add(p1);
  const p2 = piri(); p2.position.set(1.6, PLAT, 1.4); p2.rotation.y = -0.35; root.add(p2);

  // প্রদীপ ও পদ্ম — মঞ্চের কিনারায়
  const diyaN = grand ? 16 : 10;
  for (let i = 0; i < diyaN; i++) {
    const a = (i / diyaN) * Math.PI * 2;
    const r = S + 1.1;
    const dd = diya(0.75, { light: i % 2 === 0 });
    dd.position.set(Math.cos(a) * r, PLAT, Math.sin(a) * r);
    dd.rotation.y = -a;
    root.add(dd);
  }
  for (const [x, z] of [[-S + 1.4, S - 0.6], [S - 1.4, S - 0.6], [-S + 1.4, -S + 1.2], [S - 1.4, -S + 1.2]]) {
    const lt = lotus(0.55, { pad: false });
    lt.position.set(x, PLAT + 0.02, z);
    root.add(lt);
  }

  // আলোর আভা ও রশ্মি (আলোকসজ্জা নিয়ন্ত্রণের জন্য)
  const glows = [];
  const g1 = glowSprite(0xffc070, grand ? 22 : 16, 0.25);
  g1.position.set(0, top - 2, 0);
  root.add(g1); glows.push({ s: g1, base: 0.25 });
  for (const [x, z] of corners) {
    const g = glowSprite(0xffb050, 5, 0.3);
    g.position.set(x, top + 0.8, z);
    root.add(g); glows.push({ s: g, base: 0.3 });
  }
  const shafts = [];
  if (grand) {
    for (let i = 0; i < 3; i++) {
      const sh = lightShaft(4 + i, PH + 6, 0xffe2a8, 0);
      sh.position.set((i - 1) * 2.6, top + 6, 0);
      sh.rotation.z = (i - 1) * 0.18;
      root.add(sh); shafts.push(sh);
    }
    // পেছনের রাজকীয় পটভূমি — খিলান ও পর্দা
    const bg = archFrame({ w: 16, h: 16, thick: 1.4, top: 2.2, depth: 0.8 });
    bg.position.set(0, 0, -S - 4.5);
    root.add(bg);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mats.velvetDeep);
    back.position.set(0, 8, -S - 4.9);
    root.add(back);
    const v = valance(18, 1.6, 8);
    v.position.set(0, 16.6, -S - 4.1);
    root.add(v);
    for (const s of [-1, 1]) {
      const c = curtain({ w: 4, h: 15, folds: 6, side: -s, pinch: 0.5, tieY: 0.3 });
      c.position.set(s * 6.3, 7.6, -S - 4.2);
      root.add(c);
      for (const zz of [-S - 2, S + 3]) {
        const outer = pillar(PH + 3, 0.55);
        outer.position.set(s * (S + 4.8), 0, zz);
        root.add(outer);
        const ff = finial(1.1);
        ff.position.set(s * (S + 4.8), PH + 3, zz);
        root.add(ff);
      }
    }
    // উপরের অতিরিক্ত ঝাড়বাতি
    for (const s of [-1, 1]) {
      const c2 = chandelier(0.8, { chain: 3 });
      c2.position.set(s * (S + 4.8), PH + 1, 0.5);
      root.add(c2);
    }
    const fb2 = new FlowerBatch(0.17, 'rose');
    fb2.swag(new THREE.Vector3(-S - 4.8, PH + 2.4, S + 3), new THREE.Vector3(S + 4.8, PH + 2.4, S + 3), 2.8, 70, { accentEvery: 4, accent: '#fff7e8' });
    fb2.swag(new THREE.Vector3(-S - 4.8, PH + 2.4, -S - 2), new THREE.Vector3(-S - 4.8, PH + 2.4, S + 3), 2, 50, { accentEvery: 4 });
    fb2.swag(new THREE.Vector3(S + 4.8, PH + 2.4, -S - 2), new THREE.Vector3(S + 4.8, PH + 2.4, S + 3), 2, 50, { accentEvery: 4 });
    root.add(fb2.build());
  }

  root.scale.setScalar(scale);

  const api = {
    root,
    glow: 0,
    /** সোনালি আলোকসজ্জা (০–১) */
    setGlow(v) {
      api.glow = v;
      for (const g of glows) g.s.material.opacity = g.base * (1 + v * 2.2);
      for (const s of shafts) s.material.opacity = v * 0.45;
    }
  };
  api.setGlow(0);
  return api;
}
