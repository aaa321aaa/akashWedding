/* ==========================================================
   environments.js — মণ্ডপ-প্রাঙ্গণ, দুই পরিবারের পদ্মপুকুর,
   রাজবাগান, গায়ে হলুদ, শুভ বিবাহের মহামণ্ডপ, প্রীতিভোজ,
   সূর্যাস্তের আশীর্বাদ-বাগান
   ========================================================== */
import * as THREE from 'three';
import { quality, LAYOUT } from './three-scene.js';
import {
  mats, carvedGold, pillar, archFrame, dome, finial, diya, lotus, interactiveLotus, FlowerBatch,
  chandelier, curtain, valance, bananaPlant, kalash, piri, lantern, tree, flowerBed, pond, floor,
  alpanaDecal, stringLights, glowSprite, ornamentFrame, animated, steps
} from './decor.js';
import { createMandap } from './mandap.js';
import * as TX from './textures.js';

const D = quality.density;

/* ---------- পুরো জগতের ঘাসের মাটি ---------- */
export function createGround(world) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 620), mats.grass);
  g.rotation.x = -Math.PI / 2;
  g.position.set(0, -0.03, -250);
  g.receiveShadow = quality.shadows;
  world.scene.add(g);
  return g;
}

function lampPost(h = 4) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, h, 8), mats.gold);
  pole.position.y = h / 2;
  g.add(pole);
  const l = lantern(0.7, 0.3);
  l.position.y = h + 0.2;
  g.add(l);
  return g;
}

/* ---------- মণ্ডপ-প্রাঙ্গণ (হিরো) ---------- */
export function createCourtyard(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.hero);
  const f = floor(56, 62, mats.marble, 0.01);
  root.add(f);
  const mandap = createMandap({ scale: 1 });
  root.add(mandap.root);

  // ঘেরা অলিন্দ
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const z = -24 + i * 9.6;
      const p = pillar(10, 0.45);
      p.position.set(s * 22, 0, z);
      root.add(p);
      if (i < 5) {
        const a = archFrame({ w: 8.2, h: 8, thick: 0.35, top: 2, depth: 0.4 });
        a.position.set(s * 22, 0, z + 4.8);
        a.rotation.y = Math.PI / 2;
        root.add(a);
        const l = lantern(0.9, 0.8);
        l.position.set(s * 21.4, 7.4, z + 4.8);
        root.add(l);
      }
    }
    const bed = flowerBed(16, 1.2, 80, 'rose');
    bed.position.set(s * 15, 0, 6);
    bed.rotation.y = Math.PI / 2;
    root.add(bed);
    const t1 = tree(6, { blossom: 'rose' });
    t1.position.set(s * 17, 0, -20);
    root.add(t1);
    const t2 = tree(5, { blossom: 'champagne' });
    t2.position.set(s * 18, 0, 18);
    root.add(t2);
    for (const z of [-10, 0, 12]) {
      const lp = lampPost(3.6);
      lp.position.set(s * 11, 0, z);
      root.add(lp);
    }
  }
  // মণ্ডপ থেকে চারদিকে মরিচবাতি
  const top = new THREE.Vector3(0, 13.6, 0);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const end = new THREE.Vector3(Math.cos(a) * 21, 9.5, Math.sin(a) * 26);
    const mid = top.clone().lerp(end, 0.5); mid.y -= 1.6;
    root.add(stringLights([top, mid, end], Math.round(36 * D), 0xffd27a, 0.42));
  }
  // সামনের আলপনা ও প্রদীপের বৃত্ত
  const al = alpanaDecal(4);
  al.position.set(0, 0.03, 14);
  root.add(al);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const d = diya(0.75, { light: i % 3 === 0 });
    d.position.set(Math.cos(a) * 4.6, 0.02, 14 + Math.sin(a) * 4.6);
    root.add(d);
  }
  world.scene.add(root);
  return { root, mandap };
}

/* ---------- দুই পরিবার — পদ্মপুকুর ও দুই মণ্ডপিকা ---------- */
function pavilion(theme = 'gold') {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.6, 8), mats.marble);
  base.position.y = 0.3;
  g.add(base);
  const r = 2.9;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = pillar(5.4, 0.28);
    p.position.set(Math.cos(a) * r, 0.6, Math.sin(a) * r);
    g.add(p);
  }
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.5, 6), carvedGold(3, 0.3));
  ring.position.y = 6.2;
  g.add(ring);
  const dm = dome(2.7, theme === 'rose' ? new THREE.MeshStandardMaterial({ color: 0xd99aa2, metalness: 0.9, roughness: 0.28 }) : mats.gold);
  dm.position.y = 6.4;
  g.add(dm);
  const fb = new FlowerBatch(0.12, theme === 'rose' ? 'rose' : 'marigold');
  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI * 2, a2 = ((i + 1) / 6) * Math.PI * 2;
    fb.swag(new THREE.Vector3(Math.cos(a1) * r, 5.8, Math.sin(a1) * r), new THREE.Vector3(Math.cos(a2) * r, 5.8, Math.sin(a2) * r), 0.9, 18, { accentEvery: 5 });
  }
  g.add(fb.build());
  const l = lantern(0.9, 1.2);
  l.position.y = 4.6;
  g.add(l);
  const lt = lotus(0.8, { pad: false });
  lt.position.y = 0.62;
  g.add(lt);
  return g;
}

export function createFamilyScene(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.family);
  root.add(floor(48, 40, mats.marble, 0.01));
  const pd = pond(8, 5);
  pd.position.set(0, 0.02, 1);
  root.add(pd);
  // ভাসমান প্রদীপ ও পদ্ম
  for (let i = 0; i < Math.round(10 * D + 2); i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random());
    const d = diya(0.65, { light: i % 2 === 0 });
    const y = 0.08;
    d.position.set(Math.cos(a) * 6.5 * rr, y, 1 + Math.sin(a) * 3.8 * rr);
    root.add(d);
    animated.bobs.push({ obj: d, y, amp: 0.04, speed: 1 + Math.random(), phase: Math.random() * 6, rot: 0.1 * (Math.random() - 0.5) });
  }
  for (const [x, z] of [[-3, 2], [3.2, 0], [0, 3.6]]) {
    const il = interactiveLotus(1.1);
    il.position.set(x, 0.1, 1 + z - 1);
    root.add(il);
  }
  for (let i = 0; i < 6; i++) {
    const l = lotus(0.6 + Math.random() * 0.3);
    l.position.set((Math.random() - 0.5) * 12, 0.08, 1 + (Math.random() - 0.5) * 7);
    root.add(l);
  }
  // দুই মণ্ডপিকা
  const left = pavilion('gold');
  left.position.set(-13, 0, -2);
  root.add(left);
  const right = pavilion('rose');
  right.position.set(13, 0, -2);
  root.add(right);
  // পেছনের জালি-প্রাচীর
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(46, 12), new THREE.MeshStandardMaterial({ color: 0xd9b061, metalness: 0.9, roughness: 0.35, alphaMap: TX.jaali(), alphaTest: 0.5, side: THREE.DoubleSide }));
  wall.position.set(0, 6, -14);
  root.add(wall);
  const glowWall = new THREE.Mesh(new THREE.PlaneGeometry(46, 12), new THREE.MeshBasicMaterial({ color: 0xff9a50, transparent: true, opacity: 0.35, fog: false }));
  glowWall.position.set(0, 6, -14.4);
  root.add(glowWall);
  for (const x of [-23, -7.7, 7.7, 23]) {
    const p = pillar(13, 0.5);
    p.position.set(x, 0, -13.6);
    root.add(p);
  }
  const fa = archFrame({ w: 8, h: 10, thick: 1, top: 2, depth: 0.6 });
  fa.position.set(0, 0, -13.4);
  root.add(fa);
  const fbx = new FlowerBatch(0.15, 'marigold');
  fbx.swag(new THREE.Vector3(-23, 12, -13), new THREE.Vector3(-7.7, 12, -13), 2, 50, { accentEvery: 5 });
  fbx.swag(new THREE.Vector3(7.7, 12, -13), new THREE.Vector3(23, 12, -13), 2, 50, { accentEvery: 5 });
  root.add(fbx.build());
  for (const s of [-1, 1]) {
    const bp = bananaPlant(4);
    bp.position.set(s * 20, 0, 8);
    root.add(bp);
    const k = kalash(1);
    k.position.set(s * 7, 0, 9);
    root.add(k);
  }
  world.scene.add(root);
  return { root };
}

/* ---------- রাজবাগান (নতুন অধ্যায়) ---------- */
export function createGarden(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.story);
  // পাথরের পথ
  const path = new THREE.Mesh(new THREE.PlaneGeometry(4, 60), mats.stone);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, 8);
  path.receiveShadow = quality.shadows;
  root.add(path);

  // ফুলের খিলান (rose arch)
  const archG = new THREE.Group();
  const arch = archFrame({ w: 6, h: 7.5, thick: 0.35, top: 0.6, depth: 0.5, mat: mats.gold });
  archG.add(arch);
  const fb = new FlowerBatch(0.16, 'rose');
  const pts = [];
  const hw = 3.25, h = 7.7, spring = h - hw * 1.15;
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    let x, y;
    if (u < 0.25) { x = -hw; y = (u / 0.25) * spring; }
    else if (u > 0.75) { x = hw; y = ((1 - u) / 0.25) * spring; }
    else { const k = (u - 0.25) / 0.5; const ang = Math.PI * (1 - k); x = Math.cos(ang) * hw; y = spring + Math.sin(ang) * (h - spring); }
    pts.push(new THREE.Vector3(x, y, 0.35));
  }
  fb.curve(pts, Math.round(160 * Math.max(0.6, D)), { accentEvery: 5, accent: '#fff7e8', radius: 0.2 });
  archG.add(fb.build());
  archG.position.set(0, 0, 10);
  root.add(archG);
  const arch2 = archG.clone();
  arch2.position.set(0, 0, -6);
  root.add(arch2);

  // গাছ ও কেয়ারি
  const palettes = ['rose', 'champagne', 'marigold', 'white'];
  for (let i = 0; i < 8; i++) {
    for (const s of [-1, 1]) {
      const t = tree(4.5 + Math.random() * 2.5, { blossom: palettes[(i + (s > 0 ? 1 : 0)) % palettes.length] });
      t.position.set(s * (9 + Math.random() * 6), 0, 18 - i * 6.5);
      root.add(t);
    }
  }
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const bed = flowerBed(5, 1.4, 50, palettes[i % palettes.length]);
    bed.position.set(s * 4.4, 0, 14 - i * 7);
    bed.rotation.y = Math.PI / 2;
    root.add(bed);
  }
  // পদ্মপুকুর ও ঝরনা
  const pd = pond(5.5, 3.6);
  pd.position.set(0, 0.02, 2);
  root.add(pd);
  const fountain = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 0.5, 20), mats.gold);
  bowl.position.y = 1.6;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.6, 12), mats.gold);
  stem.position.y = 0.8;
  fountain.add(bowl, stem);
  const sprayGlow = glowSprite(0xbfe6ff, 2.5, 0.35);
  sprayGlow.position.y = 2.2;
  fountain.add(sprayGlow);
  fountain.position.set(0, 0, 2);
  root.add(fountain);
  for (const [x, z] of [[-3, 2.6], [3, 1.2], [-2.4, 0.4]]) {
    const il = interactiveLotus(0.9);
    il.position.set(x, 0.1, z);
    root.add(il);
  }
  // মরিচবাতি গাছে গাছে
  for (let i = 0; i < 5; i++) {
    const z = 16 - i * 7;
    root.add(stringLights([new THREE.Vector3(-10, 5, z), new THREE.Vector3(0, 3.6, z - 1), new THREE.Vector3(10, 5, z)], Math.round(30 * D), i % 2 ? 0xffd27a : 0xffb0c8, 0.4));
  }
  for (const s of [-1, 1]) for (const z of [12, 0, -12]) {
    const lp = lampPost(3.2);
    lp.position.set(s * 2.6, 0, z);
    root.add(lp);
  }
  // দূরে প্রাসাদের অবয়ব
  // কেবল এই দৃশ্যে দেখা যায় — পরের দৃশ্যে যাওয়ার সময় ধীরে মিলিয়ে যায়
  const silMat = new THREE.MeshBasicMaterial({ map: TX.palaceSilhouette('#1d0a22', 'rgba(255,190,110,0.9)'), transparent: true, fog: false, depthWrite: false });
  const sil = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), silMat);
  sil.position.set(0, 13, -40);
  root.add(sil);
  const center = LAYOUT.story.clone();
  world.add(() => {
    const d = world.target.distanceTo(center);
    silMat.opacity = THREE.MathUtils.clamp((26 - d) / 12, 0, 1);
    silMat.visible = silMat.opacity > 0.01;
  });
  world.scene.add(root);
  return { root };
}

/* ---------- গায়ে হলুদ ---------- */
export function createHaldi(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.haldi);
  root.add(floor(30, 26, new THREE.MeshStandardMaterial({ color: 0xf6e3b4, roughness: 0.6 }), 0.01));
  const al = alpanaDecal(4.5);
  al.position.y = 0.03;
  al.position.z = 2;
  root.add(al);
  // মঞ্চ
  const plat = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 5), mats.yellowCloth);
  plat.position.set(0, 0.3, -3);
  root.add(plat);
  const pr = piri();
  pr.position.set(0, 0.6, -2.6);
  pr.scale.setScalar(1.3);
  root.add(pr);
  // গাঁদার লহরের প্রাচীর
  const fb = new FlowerBatch(0.16, 'yellow');
  const strands = Math.round(26 * Math.max(0.6, D));
  for (let i = 0; i < strands; i++) {
    const x = -8 + (i / (strands - 1)) * 16;
    fb.strand(new THREE.Vector3(x, 9.5, -6.5 + Math.sin(i) * 0.2), 8.5 + Math.sin(i * 0.7) * 0.4, 30, { accentEvery: 6, accent: '#ff8a12' });
  }
  fb.swag(new THREE.Vector3(-8.5, 9.6, -5.8), new THREE.Vector3(8.5, 9.6, -5.8), 1.2, 60, { accentEvery: 4, accent: '#ff7a00' });
  root.add(fb.build());
  const of = ornamentFrame(10, 10, mats.gold);
  of.position.set(0, 0, -5.4);
  root.add(of);
  // হলুদ পর্দা
  for (const s of [-1, 1]) {
    const c = curtain({ w: 3, h: 10, folds: 5, side: -s, pinch: 0.5, mat: mats.yellowCloth });
    c.position.set(s * 8, 5, -5);
    root.add(c);
    const bp = bananaPlant(4.5);
    bp.position.set(s * 6, 0.6, -3.2);
    root.add(bp);
    const k = kalash(1);
    k.position.set(s * 3.4, 0.6, -2);
    root.add(k);
  }
  // পিতলের হলুদ-বাটি
  for (let i = 0; i < 5; i++) {
    const bowl = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.brass);
    b.rotation.x = Math.PI;
    b.position.y = 0.45;
    const paste = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), mats.turmeric);
    paste.rotation.x = -Math.PI / 2; paste.position.y = 0.42;
    bowl.add(b, paste);
    bowl.position.set(-2.4 + i * 1.2, 0.6, -1.2);
    root.add(bowl);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const d = diya(0.75, { light: i % 2 === 0 });
    d.position.set(Math.cos(a) * 5, 0.02, 2 + Math.sin(a) * 3.4);
    root.add(d);
  }
  root.add(stringLights([new THREE.Vector3(-12, 8, 4), new THREE.Vector3(0, 6.5, 6), new THREE.Vector3(12, 8, 4)], Math.round(36 * D), 0xffe066, 0.5));
  const gl = glowSprite(0xffd84d, 18, 0.3);
  gl.position.set(0, 5, -4);
  root.add(gl);
  world.scene.add(root);
  return { root };
}

/* ---------- শুভ বিবাহ — মহামণ্ডপ ---------- */
export function createWeddingScene(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.wedding);
  root.add(floor(50, 52, mats.marble, 0.01));
  const mandap = createMandap({ scale: 1.2, grand: true });
  root.add(mandap.root);
  // গালিচাপথ
  const runner = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 18), mats.carpet);
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(0, 0.03, 17);
  root.add(runner);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
    const z = 10 + i * 3.4;
    const lp = lampPost(3);
    lp.position.set(s * 3.2, 0, z);
    root.add(lp);
    const fb = flowerBed(1.6, 1.6, 26, i % 2 ? 'rose' : 'marigold');
    fb.position.set(s * 4.8, 0, z);
    root.add(fb);
  }
  const top = new THREE.Vector3(0, 17, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const end = new THREE.Vector3(Math.cos(a) * 22, 8, Math.sin(a) * 22);
    const mid = top.clone().lerp(end, 0.5); mid.y -= 2;
    root.add(stringLights([top, mid, end], Math.round(40 * D), i % 2 ? 0xffd27a : 0xfff0c0, 0.45));
  }
  for (const s of [-1, 1]) {
    const t = tree(6.5, { blossom: 'rose' });
    t.position.set(s * 18, 0, 6);
    root.add(t);
  }
  world.scene.add(root);
  return { root, mandap };
}

/* ---------- প্রীতিভোজ (বৌভাত) ---------- */
function banquetTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 24), mats.tablecloth);
  top.position.y = 1.0;
  const cloth = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.75, 1.0, 24, 1, true), mats.champagneCloth);
  cloth.position.y = 0.5;
  g.add(top, cloth);
  // কলাপাতার থালা
  const plateMat = mats.banana;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.32, 12), plateMat);
    leaf.rotation.x = -Math.PI / 2;
    leaf.position.set(Math.cos(a) * 1.05, 1.05, Math.sin(a) * 1.05);
    leaf.scale.set(1.4, 1, 1);
    g.add(leaf);
  }
  // ফুলের সাজ
  const fb = new FlowerBatch(0.1, 'champagne');
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.35;
    fb.add(new THREE.Vector3(Math.cos(a) * r, 1.2 + Math.random() * 0.35, Math.sin(a) * r));
  }
  g.add(fb.build());
  const cand = glowSprite(0xffd890, 1.4, 0.7);
  cand.position.y = 1.5;
  g.add(cand);
  return g;
}

export function createReception(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.bouvat);
  root.add(floor(40, 34, mats.marble, 0.01));
  const rows = quality.tier === 'low' ? [[-5, 2], [5, 2]] : [[-6, 3], [0, 6], [6, 3], [-8, -3], [8, -3]];
  for (const [x, z] of rows) {
    const t = banquetTable();
    t.position.set(x, 0, z);
    root.add(t);
  }
  // শ্যাম্পেন রঙের পটভূমি
  const back = new THREE.Mesh(new THREE.PlaneGeometry(24, 13), mats.champagneCloth);
  back.position.set(0, 6.5, -9.5);
  root.add(back);
  const fr = ornamentFrame(9, 9, mats.champagne);
  fr.position.set(0, 0.3, -9);
  root.add(fr);
  const v = valance(24, 1.5, 9, mats.champagneCloth);
  v.position.set(0, 13, -9);
  root.add(v);
  for (const s of [-1, 1]) {
    const c = curtain({ w: 4, h: 12.5, folds: 6, side: -s, pinch: 0.5, mat: mats.champagneCloth });
    c.position.set(s * 10, 6.2, -8.6);
    root.add(c);
    for (const z of [-9, 0, 9]) {
      const p = pillar(9, 0.4, mats.champagne);
      p.position.set(s * 13, 0, z);
      root.add(p);
    }
  }
  const fb = new FlowerBatch(0.16, 'champagne');
  fb.swag(new THREE.Vector3(-12, 12.4, -8.4), new THREE.Vector3(12, 12.4, -8.4), 2.2, 70, { accentEvery: 4, accent: '#c2185b' });
  for (let i = 0; i < 9; i++) fb.strand(new THREE.Vector3(-8 + i * 2, 12 - Math.abs(i - 4) * 0.2, -8.3), 2 + (4 - Math.abs(i - 4)) * 0.4, 12, { accentEvery: 3, accent: '#e0436e' });
  root.add(fb.build());
  for (const x of [-6, 0, 6]) {
    const ch = chandelier(x === 0 ? 1.2 : 0.9, { chain: 3 });
    ch.position.set(x, 10, 0);
    root.add(ch);
  }
  // মরিচবাতির চাঁদোয়া
  for (let i = 0; i < 6; i++) {
    const z = -7 + i * 3;
    root.add(stringLights([new THREE.Vector3(-13, 9, z), new THREE.Vector3(0, 7.6, z), new THREE.Vector3(13, 9, z)], Math.round(30 * D), 0xfff0c0, 0.38));
  }
  world.scene.add(root);
  return { root };
}

/* ---------- সূর্যাস্তের আশীর্বাদ-বাগান ---------- */
export function createFinale(world) {
  const root = new THREE.Group();
  root.position.copy(LAYOUT.finale);
  // দূরের প্রাসাদ
  const sil = new THREE.Mesh(new THREE.PlaneGeometry(150, 56), new THREE.MeshBasicMaterial({ map: TX.palaceSilhouette('#3a1220', 'rgba(255,200,120,0.95)'), transparent: true, fog: false, depthWrite: false }));
  sil.position.set(0, 22, -85);
  root.add(sil);
  // বড় পদ্মদিঘি
  const pd = pond(14, 7);
  pd.position.set(0, 0.02, -14);
  root.add(pd);
  for (let i = 0; i < 12; i++) {
    const l = lotus(0.7 + Math.random() * 0.4);
    l.position.set((Math.random() - 0.5) * 24, 0.08, -14 + (Math.random() - 0.5) * 11);
    root.add(l);
  }
  for (const [x, z] of [[-5, -11], [5, -12], [0, -9]]) {
    const il = interactiveLotus(1.2);
    il.position.set(x, 0.1, z);
    root.add(il);
  }
  for (let i = 0; i < Math.round(12 * D + 2); i++) {
    const d = diya(0.7, { light: i % 2 === 0 });
    const y = 0.08;
    d.position.set((Math.random() - 0.5) * 22, y, -14 + (Math.random() - 0.5) * 10);
    root.add(d);
    animated.bobs.push({ obj: d, y, amp: 0.05, speed: 0.8 + Math.random(), phase: Math.random() * 6, rot: 0.1 });
  }
  // সোনালি অলংকৃত ফ্রেম (বার্তার পেছনে)
  const fr = ornamentFrame(13, 14);
  fr.position.set(0, 0.2, -6);
  root.add(fr);
  const frGlow = glowSprite(0xffb070, 26, 0.35);
  frGlow.position.set(0, 7, -6.5);
  root.add(frGlow);
  // বাগান
  const palettes = ['rose', 'champagne', 'marigold', 'white'];
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) {
    const t = tree(5 + Math.random() * 3, { blossom: palettes[(i + 2) % 4] });
    t.position.set(s * (16 + Math.random() * 10), 0, 14 - i * 7);
    root.add(t);
  }
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const bed = flowerBed(6, 1.4, 60, palettes[i]);
    bed.position.set(s * 9, 0, 10 - i * 6);
    bed.rotation.y = Math.PI / 2;
    root.add(bed);
    const lp = lampPost(3.4);
    lp.position.set(s * 6, 0, 10 - i * 6);
    root.add(lp);
  }
  for (const s of [-1, 1]) {
    const pav = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const p = pillar(6, 0.3);
      p.position.set(Math.cos(a) * 2, 0, Math.sin(a) * 2);
      pav.add(p);
    }
    const dm = dome(2.2, mats.gold);
    dm.position.y = 6;
    pav.add(dm);
    pav.position.set(s * 20, 0, -10);
    root.add(pav);
  }
  root.add(stringLights([new THREE.Vector3(-20, 6, -10), new THREE.Vector3(0, 9, -7), new THREE.Vector3(20, 6, -10)], Math.round(50 * D), 0xffd27a, 0.5));
  world.scene.add(root);
  return { root, frame: fr };
}
