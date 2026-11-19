/* ==========================================================
   interactions.js — কার্ডের ৩D হেলান, পদ্ম ফোটানো, ক্লিকে স্বর্ণকণা
   ========================================================== */
import * as THREE from 'three';
import { quality } from './three-scene.js';
import { interactiveLotuses } from './decor.js';

export function initCardTilt() {
  const gsap = window.gsap;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover || quality.reduced) return;
  document.querySelectorAll('.tilt').forEach(card => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.7, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.7, ease: 'power3' });
    card.addEventListener('pointermove', (e) => {
      gsap.set(card, { transformPerspective: 1000 });
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * 14);
      rx(-(y - 0.5) * 11);
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); gsap.delayedCall(0.8, () => { if (!card.matches(':hover')) gsap.set(card, { clearProps: 'transform' }); }); });
  });
}

export function initWorldInteractions({ world, sparkles, butterflies }) {
  const gsap = window.gsap;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tmp = new THREE.Vector3();

  const findLotus = (obj) => {
    while (obj && !(obj.userData && obj.userData.lotus)) obj = obj.parent;
    return obj;
  };

  const pick = (e) => {
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, world.camera);
    const visible = interactiveLotuses.filter(l => l.parent && l.getWorldPosition(tmp).distanceTo(world.camera.position) < 60);
    const hits = ray.intersectObjects(visible, true);
    return hits.length ? { lotus: findLotus(hits[0].object), point: hits[0].point } : null;
  };

  function bloom(l) {
    const d = l.userData;
    d.open = !d.open;
    d.petals.forEach((p, i) => {
      gsap.to(p.mesh.rotation, { x: -(d.open ? p.open : p.closed), duration: quality.reduced ? 0.4 : 1.8, delay: quality.reduced ? 0 : (i % 8) * 0.03 + Math.floor(i / 8) * 0.12, ease: d.open ? 'elastic.out(1, 0.55)' : 'power2.inOut' });
    });
    gsap.to(d.halo.material, { opacity: d.open ? 0.85 : 0, duration: 1.2 });
    gsap.fromTo(l.scale, { x: l.scale.x * 0.92, y: l.scale.y * 0.92, z: l.scale.z * 0.92 }, { x: l.scale.x, y: l.scale.y, z: l.scale.z, duration: 1, ease: 'elastic.out(1, 0.4)' });
    l.getWorldPosition(tmp);
    if (d.open) {
      sparkles.explode(tmp.clone().add(new THREE.Vector3(0, 0.8, 0)), 60, 2.6, 0.14);
      butterflies.circlePoint(tmp.clone().add(new THREE.Vector3(0, 1.4, 0)), 1.6, 1, { count: 2, duration: 4, speed: 2 });
    }
  }

  // সব পদ্মকে কিছুটা পরে নিজে থেকেই ফুটিয়ে তোলা (স্পর্শ-যন্ত্রেও যেন দেখা যায়)
  setTimeout(() => interactiveLotuses.forEach((l, i) => setTimeout(() => { if (!l.userData.open) bloom(l); }, i * 900)), 14000);

  world.canvas.addEventListener('click', (e) => {
    const hit = pick(e);
    if (hit && hit.lotus) { bloom(hit.lotus); return; }
    // খালি জায়গায় ক্লিক — জাদুকরী স্বর্ণকণা
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    tmp.set(ndc.x, ndc.y, 0.5).unproject(world.camera).sub(world.camera.position).normalize().multiplyScalar(6).add(world.camera.position);
    sparkles.explode(tmp, quality.reduced ? 20 : 45, 2.2, 0.1);
  });

  let last = 0;
  world.canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - last < 120) return;
    last = now;
    world.canvas.style.cursor = pick(e) ? 'pointer' : '';
  }, { passive: true });
}
