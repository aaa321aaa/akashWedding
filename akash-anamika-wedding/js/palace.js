/* ==========================================================
   palace.js — রাজপ্রাসাদের প্রবেশদ্বার, বিশাল সোনালি দরজা ও অন্দরমহলের দালান
   ========================================================== */
import * as THREE from 'three';
import { quality } from './three-scene.js';
import {
  mats, carvedGold, pillar, archFrame, archPath, dome, finial, steps, diya, lantern, curtain,
  FlowerBatch, chandelier, glowSprite, lightShaft, floor, alpanaDecal, kalash, flowerBed, pond, lotus,
  bananaPlant, valance
} from './decor.js';
import * as TX from './textures.js';

const DOOR_W = 10;      // দরজার মোট প্রস্থ
const DOOR_H = 8.6;     // দরজার পাল্লার উচ্চতা
const ARCH_H = 13;      // খিলানের উচ্চতা
const BASE = 0.9;       // প্রাসাদের ভিত্তি-উচ্চতা

/* ---------- একটি দরজার পাল্লা ---------- */
function doorLeaf(side) {
  const leafW = DOOR_W / 2;
  const leaf = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(leafW, DOOR_H, 0.36), carvedGold(1, 1.7));
  slab.castShadow = quality.shadows;
  slab.receiveShadow = quality.shadows;
  leaf.add(slab);

  // উত্থিত প্যানেল
  const panelMat = mats.goldDark;
  const panels = [
    { y: 2.6, h: 2.6 }, { y: -0.6, h: 2.6 }, { y: -3.2, h: 1.6 }
  ];
  for (const p of panels) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(leafW - 1.0, p.h, 0.12), panelMat);
    frame.position.set(0, p.y, 0.22);
    leaf.add(frame);
    const inner = new THREE.Mesh(new THREE.BoxGeometry(leafW - 1.5, p.h - 0.5, 0.1), carvedGold(0.6, 0.4));
    inner.position.set(0, p.y, 0.3);
    leaf.add(inner);
  }
  // খিলানাকৃতি উপরের প্যানেল-অলংকার
  const archShape = new THREE.Shape();
  archPath(archShape, leafW - 1.4, 1.6);
  const archMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(archShape, { depth: 0.1, bevelEnabled: false, curveSegments: 12 }), mats.champagne);
  archMesh.position.set(0, 2.6 + 1.3 - 1.6 + 0.2, 0.36);
  archMesh.scale.set(1, 0.9, 1);
  leaf.add(archMesh);

  // পিতলের বোতাম-কাঁটা (stud)
  const studGeo = new THREE.SphereGeometry(0.1, 8, 6);
  const rows = 11, cols = 6;
  const studs = new THREE.InstancedMesh(studGeo, mats.gold, rows * 2 + cols * 2);
  const d = new THREE.Object3D();
  let k = 0;
  for (let j = 0; j < rows; j++) for (const x of [-leafW / 2 + 0.28, leafW / 2 - 0.5]) {
    d.position.set(x, -DOOR_H / 2 + 0.35 + (j / (rows - 1)) * (DOOR_H - 0.7), 0.2);
    d.updateMatrix();
    studs.setMatrixAt(k++, d.matrix);
  }
  for (let i = 0; i < cols; i++) for (const y of [-DOOR_H / 2 + 0.35, DOOR_H / 2 - 0.35]) {
    d.position.set(-leafW / 2 + 0.75 + (i / (cols - 1)) * (leafW - 1.5), y, 0.2);
    d.updateMatrix();
    studs.setMatrixAt(k++, d.matrix);
  }
  leaf.add(studs);

  // কড়া (ring knocker)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 8, 24), mats.gold);
  ring.position.set(side * (leafW / 2 - 0.7), -0.4, 0.45);
  leaf.add(ring);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mats.gold);
  boss.position.set(side * (leafW / 2 - 0.7), -0.05, 0.4);
  leaf.add(boss);
  // মধ্যরেখার সোনালি পাত
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.22, DOOR_H, 0.46), mats.gold);
  strip.position.set(side * (leafW / 2 - 0.11), 0, 0);
  leaf.add(strip);

  // কব্জা (hinge)
  for (const hy of [-3, 0, 3]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 10), mats.brass);
    hinge.position.set(-side * leafW / 2, hy, 0.2);
    leaf.add(hinge);
  }

  // কব্জা-বিন্দুতে পিভট
  const pivot = new THREE.Group();
  leaf.position.set(side * leafW / 2, DOOR_H / 2, 0);
  pivot.add(leaf);
  pivot.position.set(-side * leafW, 0, 0);
  return pivot;
}

/* ---------- খিলানের উপরের জালি ---------- */
function tympanum() {
  const p = new THREE.Path();
  archPath(p, DOOR_W, ARCH_H);
  const pts = p.getPoints(40).filter(v => v.y >= DOOR_H - 0.05);
  const shape = new THREE.Shape();
  shape.moveTo(-DOOR_W / 2 + 0.01, DOOR_H);
  pts.forEach(v => shape.lineTo(v.x, v.y));
  shape.lineTo(DOOR_W / 2 - 0.01, DOOR_H);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 16);
  // UV স্বাভাবিক করা
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + DOOR_W / 2) / DOOR_W, (pos.getY(i) - DOOR_H) / (ARCH_H - DOOR_H));
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd9b061, metalness: 1, roughness: 0.3, alphaMap: TX.jaali(), alphaTest: 0.5, side: THREE.DoubleSide }));
  m.material.alphaMap.repeat.set(5, 2);
  return m;
}

/* ---------- মূল প্রাসাদ ---------- */
export function createPalace(world) {
  const root = new THREE.Group();
  root.name = 'palace';

  /* সম্মুখ প্রাঙ্গণ */
  const yard = floor(140, 80, mats.marble);
  yard.position.set(0, 0, 38);
  root.add(yard);
  const alp = alpanaDecal(5.2);
  alp.position.set(0, 0.02, 11);
  root.add(alp);

  /* সম্মুখভাগ (ভিত্তির উপর) */
  const facade = new THREE.Group();
  facade.position.y = BASE;
  root.add(facade);

  // প্রাচীর
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-26, -BASE); wallShape.lineTo(26, -BASE); wallShape.lineTo(26, 22); wallShape.lineTo(-26, 22); wallShape.closePath();
  const hole = new THREE.Path(); archPath(hole, DOOR_W, ARCH_H);
  wallShape.holes.push(hole);
  const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: 2, bevelEnabled: false, curveSegments: 24 });
  wallGeo.translate(0, 0, -1);
  const wallMat = mats.wall.clone();
  wallMat.bumpMap = mats.wall.bumpMap.clone(); wallMat.bumpMap.repeat.set(0.18, 0.18); wallMat.bumpMap.needsUpdate = true;
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.receiveShadow = quality.shadows;
  wall.castShadow = quality.shadows;
  facade.add(wall);

  // দরজার সোনালি খিলান
  const af = archFrame({ w: DOOR_W, h: ARCH_H, thick: 1.2, top: 1.8, depth: 0.6 });
  af.position.z = 1.15;
  facade.add(af);
  // খিলানের ভেতরের দ্বিতীয় রেখা
  const af2 = archFrame({ w: DOOR_W + 3.2, h: ARCH_H + 1.8, thick: 0.45, top: 0.4, depth: 0.3, mat: mats.goldDark });
  af2.position.z = 1.05;
  af2.children[2].visible = false;
  facade.add(af2);

  // জালি
  const tym = tympanum();
  tym.position.z = -0.1;
  facade.add(tym);

  // দরজা
  const left = doorLeaf(1);    // বাঁদিকের পাল্লা (কব্জা x = -5)
  const right = doorLeaf(-1);  // ডানদিকের পাল্লা (কব্জা x = +5)
  left.position.z = right.position.z = 0;
  facade.add(left, right);

  // দরজার পেছনের সোনালি আলো
  const doorGlow = glowSprite(0xffe3a8, 22, 0);
  doorGlow.position.set(0, 6, -4);
  facade.add(doorGlow);
  const innerGlow = glowSprite(0xffd690, 12, 0);
  innerGlow.position.set(0, 5, -1.5);
  facade.add(innerGlow);
  const shafts = [];
  for (let i = 0; i < 3; i++) {
    const s = lightShaft(8 + i * 2, 24, 0xffe2a8, 0);
    s.position.set((i - 1) * 1.2, 11, 2 + i * 0.4);
    s.rotation.x = -1.15;
    s.rotation.z = (i - 1) * 0.12;
    facade.add(s);
    shafts.push(s);
  }
  const doorLight = new THREE.PointLight(0xffd59a, 0, 60, 2);
  doorLight.position.set(0, 5, -2);
  facade.add(doorLight);

  // স্তম্ভ
  const pillarXs = [7.6, 13, 19, 24.6];
  for (const x of pillarXs) for (const s of [-1, 1]) {
    const p = pillar(15, 0.62);
    p.position.set(s * x, 0, 1.7);
    facade.add(p);
    const cap = finial(0.9);
    cap.position.set(s * x, 15.1, 1.7);
    facade.add(cap);
  }

  // কার্নিশ
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(53, 0.7, 3.4), mats.gold);
  cornice.position.set(0, 15.4, 1.2);
  cornice.castShadow = quality.shadows;
  facade.add(cornice);
  const cornice2 = new THREE.Mesh(new THREE.BoxGeometry(53, 0.5, 2.6), mats.goldDark);
  cornice2.position.set(0, 22.1, 0.6);
  facade.add(cornice2);
  // ঝুলন্ত সোনালি ঝালর (কার্নিশের নিচে)
  const beadGeo = new THREE.ConeGeometry(0.16, 0.5, 6);
  beadGeo.rotateX(Math.PI);
  const beads = new THREE.InstancedMesh(beadGeo, mats.gold, 130);
  const bd = new THREE.Object3D();
  for (let i = 0; i < 130; i++) { bd.position.set(-26 + i * 0.4, 14.85, 2.75); bd.updateMatrix(); beads.setMatrixAt(i, bd.matrix); }
  facade.add(beads);

  // ছোট গম্বুজের সারি (ছত্রী)
  for (const x of [-24.6, -19, -13, -7.6, 7.6, 13, 19, 24.6]) {
    const dm = dome(1.15, mats.gold);
    dm.position.set(x, 22.35, 0.6);
    facade.add(dm);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.9, 12), mats.champagne);
    base.position.set(x, 22.6, 0.6);
    facade.add(base);
  }
  // কেন্দ্রীয় গম্বুজ
  const bigDrum = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6, 3, 32), mats.wall);
  bigDrum.position.set(0, 23.8, -5);
  facade.add(bigDrum);
  const bigDome = dome(5.4, carvedGold(3, 1));
  bigDome.position.set(0, 25.2, -5);
  facade.add(bigDome);
  for (const x of [-15, 15]) {
    const sd = dome(2.8, mats.gold);
    sd.position.set(x, 22.5, -4);
    facade.add(sd);
  }

  // ঝরোখা-জানালা
  const winMat = mats.amberGlass;
  const addWindow = (x, y, w, h) => {
    const fr = archFrame({ w, h, thick: 0.35, top: 0.5, depth: 0.35 });
    fr.position.set(x, y, 1.15);
    fr.children[2].scale.setScalar(0.6);
    facade.add(fr);
    const s = new THREE.Shape(); archPath(s, w, h);
    const g = new THREE.Mesh(new THREE.ShapeGeometry(s, 10), winMat);
    g.position.set(x, y, 1.02);
    facade.add(g);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 0.25, 0.9), mats.gold);
    sill.position.set(x, y - 0.1, 1.4);
    facade.add(sill);
  };
  for (const x of [-21.8, -16, -10.3, 10.3, 16, 21.8]) {
    addWindow(x, 2.2, 2.6, 4.6);
    addWindow(x, 17, 2.0, 3.2);
  }
  for (const x of [-4.5, 0, 4.5]) addWindow(x, 17.2, 1.6, 2.8);

  // মখমলের পর্দা (দরজার দু'পাশে)
  for (const s of [-1, 1]) {
    const c = curtain({ w: 3.6, h: 13.5, folds: 5, side: -s, pinch: 0.5, tieY: 0.32 });
    c.position.set(s * 9.3, 7.4, 2.1);
    facade.add(c);
  }
  const val = valance(14, 1.3, 7);
  val.position.set(0, 16.4, 3);
  facade.add(val);

  // তোরণ: গাঁদা ফুলের মালা ও আমপাতা
  const fb = new FlowerBatch(0.17, 'marigold');
  const ty = ARCH_H + 1.0;
  fb.swag(new THREE.Vector3(-6.4, ty, 1.9), new THREE.Vector3(0, ty + 0.4, 1.9), 1.3, 26, { accentEvery: 5 });
  fb.swag(new THREE.Vector3(0, ty + 0.4, 1.9), new THREE.Vector3(6.4, ty, 1.9), 1.3, 26, { accentEvery: 5 });
  for (let i = -5; i <= 5; i++) fb.strand(new THREE.Vector3(i * 1.15, ty - 0.2 - Math.abs(i) * 0.08, 2.05), 1.6 + (5 - Math.abs(i)) * 0.18, 9, { accentEvery: 4 });
  // স্তম্ভে প্যাঁচানো মালা
  for (const x of [7.6, -7.6]) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const a = i * 0.42; pts.push(new THREE.Vector3(x + Math.cos(a) * 0.72, 0.5 + i * 0.22, 1.7 + Math.sin(a) * 0.72)); }
    fb.curve(pts, 90, { accentEvery: 6 });
  }
  facade.add(fb.build());

  // লণ্ঠন
  for (const x of [-10.3, 10.3, -16, 16]) {
    const l = lantern(1.1, 1.6);
    l.position.set(x, 12.4, 3.1);
    facade.add(l);
  }

  // সিঁড়ি
  const st = steps(16, 3, 0.3, 0.9, mats.marble);
  st.rotation.y = Math.PI;
  st.position.set(0, 0, 3.2);
  root.add(st);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(54, BASE, 4), mats.marble);
  plinth.position.set(0, BASE / 2, 2.6 - 4 / 2 + 0.6);
  plinth.receiveShadow = quality.shadows;
  root.add(plinth);

  // প্রদীপের সারি ও মঙ্গলঘট
  for (const s of [-1, 1]) {
    const k = kalash(1.3);
    k.position.set(s * 6.2, BASE, 2.1);
    root.add(k);
    for (let i = 0; i < 6; i++) {
      const d = diya(0.9, { light: i % 2 === 0 });
      d.position.set(s * 4.2, 0.02, 7 + i * 3.2);
      d.rotation.y = s > 0 ? Math.PI : 0;
      root.add(d);
    }
    // প্রাঙ্গণের পদ্মপুকুর
    const pd = pond(6, 3.5);
    pd.position.set(s * 17, 0, 16);
    root.add(pd);
    for (let i = 0; i < 4; i++) {
      const lt = lotus(0.7 + Math.random() * 0.4);
      lt.position.set(s * 17 + (Math.random() - 0.5) * 7, 0.08, 16 + (Math.random() - 0.5) * 3.5);
      root.add(lt);
    }
    const fbd = flowerBed(10, 1.4, 70, 'rose');
    fbd.position.set(s * 17, 0, 22);
    root.add(fbd);
    const bp = bananaPlant(4.5);
    bp.position.set(s * 11.5, 0, 6);
    root.add(bp);
  }

  /* ---------- অন্দরমহলের দালান (নিমন্ত্রণপত্রের দৃশ্য) ---------- */
  const hall = new THREE.Group();
  hall.position.y = BASE;
  root.add(hall);
  const hf = floor(30, 62, mats.marble);
  hf.position.set(0, 0.005, -31);
  hall.add(hf);
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 60), mats.carpet);
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.02, -32);
  runner.receiveShadow = quality.shadows;
  hall.add(runner);
  const hallAlpana = alpanaDecal(4.4);
  hallAlpana.position.set(0, 0.03, -30);
  hall.add(hallAlpana);

  const colZ = [-6, -14, -22, -38, -46, -54];
  for (const z of colZ) for (const s of [-1, 1]) {
    const p = pillar(12, 0.5);
    p.position.set(s * 8.5, 0, z);
    hall.add(p);
  }
  // খিলানযুক্ত অলিন্দ
  const archZ = quality.tier === 'low' ? [-10, -50] : [-10, -18, -42, -50];
  for (const z of archZ) for (const s of [-1, 1]) {
    const a = archFrame({ w: 6.8, h: 9, thick: 0.4, top: 2.4, depth: 0.5 });
    a.position.set(s * 8.5, 0, z);
    a.rotation.y = Math.PI / 2;
    hall.add(a);
  }
  // পাশের দেয়াল ও জানালা
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(64, 18), mats.wallDark);
    sw.position.set(s * 14, 9, -32);
    sw.rotation.y = -s * Math.PI / 2;
    sw.receiveShadow = quality.shadows;
    hall.add(sw);
    for (const z of [-10, -22, -42, -54]) {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5), mats.amberGlass);
      g.position.set(s * 13.9, 5.5, z);
      g.rotation.y = -s * Math.PI / 2;
      hall.add(g);
      const c = curtain({ w: 2.2, h: 9, folds: 4, side: s > 0 ? 1 : -1, pinch: 0.45 });
      c.position.set(s * 13.4, 5.2, z + 2.2);
      c.rotation.y = -s * Math.PI / 2;
      hall.add(c);
    }
  }
  // ঝাড়বাতি
  for (const z of [-12, -48]) {
    const ch = chandelier(1.2, { chain: 6 });
    ch.position.set(0, 12, z);
    hall.add(ch);
  }
  const chMain = chandelier(1.5, { chain: 5 });
  chMain.position.set(0, 13.5, -31);
  hall.add(chMain);
  // গালিচার দু'পাশে প্রদীপ
  const step = quality.tier === 'low' ? 10 : 6;
  for (let z = -4; z > -60; z -= step) for (const s of [-1, 1]) {
    const d = diya(0.8, { light: true });
    d.position.set(s * 2.8, 0.02, z);
    hall.add(d);
  }
  // উপরে ঝুলন্ত মালা
  const hb = new FlowerBatch(0.14, 'marigold');
  for (const z of colZ) {
    hb.swag(new THREE.Vector3(-8.5, 11, z), new THREE.Vector3(8.5, 11, z), 2.2, 46, { accentEvery: 6 });
  }
  hall.add(hb.build());

  // তোরণদ্বার (মণ্ডপ-প্রাঙ্গণে যাওয়ার খিলান)
  const gate = new THREE.Group();
  gate.position.set(0, 0, -62);
  hall.add(gate);
  const gwShape = new THREE.Shape();
  gwShape.moveTo(-15, -BASE); gwShape.lineTo(15, -BASE); gwShape.lineTo(15, 21); gwShape.lineTo(-15, 21); gwShape.closePath();
  const gh = new THREE.Path(); archPath(gh, 12, 16);
  gwShape.holes.push(gh);
  const gwGeo = new THREE.ExtrudeGeometry(gwShape, { depth: 1.6, bevelEnabled: false, curveSegments: 24 });
  gwGeo.translate(0, 0, -0.8);
  const gw = new THREE.Mesh(gwGeo, wallMat);
  gate.add(gw);
  const gaf = archFrame({ w: 12, h: 16, thick: 1, top: 1.6, depth: 0.5 });
  gaf.position.z = 0.9;
  gate.add(gaf);
  for (const s of [-1, 1]) {
    const c = curtain({ w: 3.4, h: 15.5, folds: 5, side: -s, pinch: 0.55, tieY: 0.3 });
    c.position.set(s * 7.4, 7.8, 1.4);
    gate.add(c);
  }
  const gb = new FlowerBatch(0.16, 'marigold');
  gb.swag(new THREE.Vector3(-7, 17, 1.5), new THREE.Vector3(7, 17, 1.5), 1.6, 50, { accentEvery: 5 });
  for (let i = -6; i <= 6; i++) gb.strand(new THREE.Vector3(i * 1.05, 16.7 - Math.abs(i) * 0.1, 1.6), 1.3, 8);
  gate.add(gb.build());
  const gst = steps(12, 3, 0.3, 0.9, mats.marble);
  gst.position.set(0, -BASE, -0.8);
  gate.add(gst);

  world.scene.add(root);

  return {
    root,
    doors: { left, right },
    doorGlow, innerGlow, shafts, doorLight,
    doorCenter: new THREE.Vector3(0, BASE + 5, 0)
  };
}
