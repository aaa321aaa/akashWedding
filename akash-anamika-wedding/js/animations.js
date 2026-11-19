/* ==========================================================
   animations.js — GSAP টাইমলাইন ও ScrollTrigger
   উদ্বোধনী দৃশ্য, দরজা খোলা, ক্যামেরার যাত্রাপথ, লেখার প্রকাশ,
   দৃশ্য-ভিত্তিক বিশেষ মুহূর্ত
   ========================================================== */
import * as THREE from 'three';
import { quality, LAYOUT, hexToLinear } from './three-scene.js';
import { openInvitation } from './invitation.js';

const gsap = () => window.gsap;

/* ---------- ক্যামেরা-স্টেশন ---------- */
const V = (x, y, z) => [x, y, z];
function station(p, t, sky, extra = {}) {
  return { p, t, top: hexToLinear(sky.top), hor: hexToLinear(sky.hor), sun: sky.sun || 0, stars: sky.stars ?? 1, exposure: extra.exposure ?? 1.05, orbit: extra.orbit || 0, lift: extra.lift || 0, petals: extra.petals ?? 0.5, fit: extra.fit ?? 1.75 };
}
const L = LAYOUT;
export const STATIONS = {
  introFar: station(V(0, 8, 58), V(0, 8.5, 0), { top: '#08020a', hor: '#3a0b18', stars: 1 }, { petals: 0.25 }),
  intro:    station(V(0, 5.4, 25), V(0, 7.4, 0), { top: '#0b0208', hor: '#3a0b18', stars: 1 }, { petals: 0.3 }),
  invite:   station(V(0, 4.6, L.invite.z + 11.5), V(0, 4.6, L.invite.z), { top: '#12030a', hor: '#2f0712', stars: 0.8 }, { petals: 0.35 }),
  hero:     station(V(0, 9, L.hero.z + 30), V(0, 3.6, L.hero.z), { top: '#160410', hor: '#4a1222', stars: 1 }, { orbit: 1, lift: 4.5, petals: 0.65, fit: 1.0 }),
  family:   station(V(L.family.x, 6.5, L.family.z + 21), V(L.family.x, 3, L.family.z), { top: '#1a0618', hor: '#5a1830', stars: 0.8 }, { lift: 10, orbit: 0.4, petals: 0.45, fit: 1.4 }),
  story:    station(V(L.story.x + 2, 4, L.story.z + 22), V(L.story.x, 4, L.story.z), { top: '#1c1036', hor: '#7a3448', stars: 0.5, sun: 0.15 }, { lift: 10, petals: 0.65 }),
  haldi:    station(V(L.haldi.x + 9, 5, L.haldi.z + 19), V(L.haldi.x, 4.5, L.haldi.z - 2), { top: '#5a3410', hor: '#d99a3a', stars: 0, sun: 0.45 }, { lift: 2, exposure: 0.95, petals: 0.75 }),
  wedding:  station(V(0, 8, L.wedding.z + 29), V(0, 7, L.wedding.z), { top: '#0e0208', hor: '#45101e', stars: 1 }, { lift: 6, orbit: 0.5, petals: 0.95 }),
  bouvat:   station(V(L.bouvat.x - 7, 5.5, L.bouvat.z + 20), V(L.bouvat.x, 4.5, L.bouvat.z), { top: '#22142a', hor: '#8a6448', stars: 0.4, sun: 0.2 }, { lift: 3, petals: 0.5 }),
  finale:   station(V(0, 4.5, L.finale.z + 22), V(0, 6.5, L.finale.z - 6), { top: '#3a1d50', hor: '#f08a4b', stars: 0.1, sun: 1 }, { lift: 6, exposure: 1.0, petals: 0.8 }),
  finaleWide: station(V(0, 13, L.finale.z + 50), V(0, 7, L.finale.z - 4), { top: '#2a1640', hor: '#e07a45', stars: 0.15, sun: 1 }, { exposure: 1.0, petals: 0.9 })
};

function applyStation(rig, s) {
  rig.px = s.p[0]; rig.py = s.p[1]; rig.pz = s.p[2];
  rig.tx = s.t[0]; rig.ty = s.t[1]; rig.tz = s.t[2];
  rig.topR = s.top[0]; rig.topG = s.top[1]; rig.topB = s.top[2];
  rig.horR = s.hor[0]; rig.horG = s.hor[1]; rig.horB = s.hor[2];
  rig.sun = s.sun; rig.stars = s.stars; rig.exposure = s.exposure; rig.orbit = s.orbit; rig.fit = s.fit;
}

function stationTweenVars(s) {
  return {
    px: s.p[0], py: s.p[1], pz: s.p[2], tx: s.t[0], ty: s.t[1], tz: s.t[2],
    topR: s.top[0], topG: s.top[1], topB: s.top[2], horR: s.hor[0], horG: s.hor[1], horB: s.hor[2],
    sun: s.sun, stars: s.stars, exposure: s.exposure, orbit: s.orbit, fit: s.fit
  };
}

const lerp = (a, b, k) => a + (b - a) * k;
const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

/* ---------- শব্দ-বিভাজন (যুক্তাক্ষর অক্ষত রেখে) ---------- */
export function splitWords(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.word')];
  el.dataset.split = '1';
  const gold = el.classList.contains('gold-text');
  const frag = document.createDocumentFragment();
  const words = [];
  [...el.childNodes].forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/);
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'word' + (gold ? ' gold-text' : '');
        s.textContent = part;
        frag.appendChild(s);
        words.push(s);
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add('word');
      frag.appendChild(node);
      words.push(node);
    }
  });
  el.textContent = '';
  el.appendChild(frag);
  if (gold) el.classList.remove('gold-text');
  return words;
}

/* ==========================================================
   অভিজ্ঞতা-নিয়ন্ত্রক
   ========================================================== */
export class Experience {
  constructor(refs) {
    this.r = refs;            // { world, palace, invitation, petals, burst, sparkles, butterflies, courtyard, wedding, music }
    this.mode = 'intro';
    this.segments = [];
    this.sSmooth = 0;
    this.entered = false;
    this.cardOpened = false;
    this.activeStation = 'intro';
    const rig = refs.world.rig;
    applyStation(rig, STATIONS.introFar);
    refs.petals.density = STATIONS.introFar.petals;
    refs.world.add((dt, t) => this.update(dt, t));
  }

  /* ---------- ১. উদ্বোধনী দৃশ্য ---------- */
  playIntro() {
    const g = gsap();
    const rig = this.r.world.rig;
    const fast = quality.reduced ? 0.35 : 1;
    this.introTween = g.to(rig, { ...stationTweenVars(STATIONS.intro), duration: 7.5 * fast, ease: 'power2.out' });
    const items = document.querySelectorAll('#opening [data-intro]');
    g.fromTo(items, { opacity: 0, y: 24, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4 * fast, stagger: 0.38 * fast, delay: 1.0 * fast, ease: 'power3.out', clearProps: 'filter' });
    // উদ্বোধনী নামের চারপাশে প্রজাপতি
    g.delayedCall(3.6 * fast, () => {
      const names = document.querySelector('.opening-names');
      if (names && !this.entered) this.r.butterflies.circleElement(names, { count: 5, duration: 6, depth: 8 });
    });
    const btn = document.getElementById('enter-btn');
    btn.addEventListener('click', () => this.enterPalace(), { once: true });
  }

  /* ---------- ২. দরজা খোলা ও প্রাসাদে প্রবেশ ---------- */
  enterPalace() {
    if (this.entered) return;
    this.entered = true;
    const g = gsap();
    const { world, palace, burst, butterflies, sparkles } = this.r;
    const rig = world.rig;
    const fast = quality.reduced ? 0.45 : 1;
    if (this.introTween) this.introTween.kill();
    const btn = document.getElementById('enter-btn');
    btn.disabled = true;

    const tl = g.timeline({ defaults: { ease: 'power2.inOut' } });
    // লেখা সরে যায়
    tl.to('#opening .opening-inner', { opacity: 0, y: -30, duration: 0.8 * fast, ease: 'power2.in' }, 0);
    tl.add(() => document.getElementById('opening').classList.add('is-hidden'), 0.85 * fast);
    // ক্যামেরা দরজার কাছে
    tl.to(rig, { px: 0, py: 5.2, pz: 17, tx: 0, ty: 5.8, tz: 0, duration: 1.6 * fast, ease: 'power2.inOut' }, 0);

    // কব্জায় দরজা ঘোরে — প্রথমে সামান্য খটকা, তারপর ভারী গতিতে খোলা
    const L = palace.doors.left.rotation, R = palace.doors.right.rotation;
    tl.to(L, { y: -0.025, duration: 0.18 * fast, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0.55 * fast);
    tl.to(R, { y: 0.025, duration: 0.18 * fast, ease: 'power1.inOut', yoyo: true, repeat: 1 }, 0.55 * fast);
    tl.to(L, { y: 1.92, duration: 3.4 * fast, ease: 'power2.inOut' }, 0.95 * fast);
    tl.to(R, { y: -1.92, duration: 3.4 * fast, ease: 'power2.inOut' }, 1.0 * fast);

    // ভেতর থেকে সোনালি আলো
    tl.to(palace.innerGlow.material, { opacity: 1, duration: 1.2 * fast }, 1.0 * fast);
    tl.to(palace.doorGlow.material, { opacity: 0.95, duration: 2.0 * fast }, 1.2 * fast);
    tl.to(palace.doorLight, { intensity: 420, duration: 2.0 * fast }, 1.0 * fast);
    palace.shafts.forEach((s, i) => tl.to(s.material, { opacity: 0.55 - i * 0.1, duration: 2.2 * fast }, (1.3 + i * 0.15) * fast));
    tl.to(rig, { exposure: 1.3, duration: 2 * fast }, 1.2 * fast);

    // পাপড়ি, প্রজাপতি ও স্বর্ণকণা বেরিয়ে আসে
    const origin = palace.doorCenter.clone().add(new THREE.Vector3(0, 0, -2.5));
    tl.add(() => {
      burst.burst(origin, new THREE.Vector3(0, 0.12, 1), quality.burst, { spread: 1.3, speed: quality.reduced ? 6 : 11, life: 5.5, radius: 2.4 });
      sparkles.explode(origin.clone().add(new THREE.Vector3(0, 0, 2)), 140, 6, 0.18);
    }, 1.55 * fast);
    tl.add(() => butterflies.burstFrom(origin, world.camera.position, Math.min(16, butterflies.list.length)), 1.8 * fast);
    tl.add(() => burst.burst(origin, new THREE.Vector3(0, 0.25, 1), Math.round(quality.burst * 0.5), { spread: 1.8, speed: 8, life: 5, radius: 3 }), 2.5 * fast);

    // ক্যামেরা দরজা দিয়ে প্রাসাদে প্রবেশ করে
    const inv = STATIONS.invite;
    tl.to(rig, { px: 0, py: 5, pz: -1, tx: 0, ty: 4.8, tz: L_INVITE_Z(), duration: 2.4 * fast, ease: 'power2.in' }, 3.1 * fast);
    tl.to('#flash', { opacity: 0.85, duration: 0.45 * fast, ease: 'power2.in' }, 4.9 * fast);
    tl.to(rig, { exposure: inv.exposure, duration: 1.2 * fast }, 5.3 * fast);
    tl.to([palace.doorGlow.material, palace.innerGlow.material, ...palace.shafts.map(s => s.material)], { opacity: 0, duration: 0.6 * fast }, 5.3 * fast);
    tl.to(palace.doorLight, { intensity: 0, duration: 1 * fast }, 5.3 * fast);
    tl.to('#flash', { opacity: 0, duration: 1.4 * fast, ease: 'power2.out' }, 5.4 * fast);
    tl.to(rig, { ...stationTweenVars(inv), duration: 2.6 * fast, ease: 'power3.out' }, 5.5 * fast);
    tl.add(() => {
      this.r.petals.density = inv.petals;
      butterflies.circlePoint(this.r.invitation.center.clone().add(new THREE.Vector3(0, 0, 0.5)), 3.4, 4, { count: 5, duration: 5, speed: 1 });
    }, 6 * fast);
    tl.add(() => this.beginJourney(), 6.6 * fast);
  }

  /* ---------- ৩. স্ক্রল-নিয়ন্ত্রিত যাত্রা শুরু ---------- */
  beginJourney() {
    const g = gsap();
    const html = document.documentElement;
    html.classList.remove('is-locked');
    html.classList.add('is-entered');
    window.scrollTo(0, 0);
    this.mode = 'scroll';
    this.sSmooth = 0;
    this.setupScroll();
    this.setupReveals();
    this.setupInvitationUI();
    this.setupNav();
    window.ScrollTrigger.refresh();
    // বিন্যাস বদলালে (ফন্ট, ঘূর্ণন, আকার) ট্রিগার-অবস্থান পুনর্গণনা
    if ('ResizeObserver' in window) {
      let tm;
      new ResizeObserver(() => { clearTimeout(tm); tm = setTimeout(() => window.ScrollTrigger.refresh(), 250); }).observe(document.getElementById('journey'));
    }
    g.fromTo('#invitation .invite-ui', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' });
    document.getElementById('open-card-btn').focus({ preventScroll: true });
  }

  setupScroll() {
    const ST = window.ScrollTrigger;
    const els = [...document.querySelectorAll('[data-station]')];
    this.stationEls = els;
    for (let i = 1; i < els.length; i++) {
      const from = STATIONS[els[i - 1].dataset.station];
      const to = STATIONS[els[i].dataset.station];
      this.segments.push({ from, to, st: ST.create({ trigger: els[i], start: 'top bottom', end: 'top top' }) });
    }
    const fin = document.getElementById('finale');
    this.segments.push({ from: STATIONS.finale, to: STATIONS.finaleWide, st: ST.create({ trigger: fin, start: 'top top', end: 'bottom bottom' }), noLift: true });

    // সক্রিয় দৃশ্য
    els.forEach(el => {
      ST.create({
        trigger: el, start: 'top 55%', end: 'bottom 45%',
        onToggle: (self) => { if (self.isActive) this.onStation(el.dataset.station, el); }
      });
    });
  }

  /** প্রতি ফ্রেমে স্ক্রল-অবস্থান থেকে ক্যামেরা নির্ধারণ */
  update(dt) {
    if (this.mode !== 'scroll' || !this.segments.length) return;
    let s = 0;
    for (let k = 0; k < this.segments.length; k++) {
      const p = this.segments[k].st.progress;
      if (p > 0) s = k + p;
    }
    const kSm = 1 - Math.pow(quality.reduced ? 0.0005 : 0.03, dt);
    this.sSmooth += (s - this.sSmooth) * kSm;
    if (Math.abs(s - this.sSmooth) < 1e-4) this.sSmooth = s;
    let k = Math.floor(this.sSmooth);
    let p = this.sSmooth - k;
    if (k >= this.segments.length) { k = this.segments.length - 1; p = 1; }
    const seg = this.segments[k];
    const e = easeInOut(p);
    const a = seg.from, b = seg.to, rig = this.r.world.rig;
    rig.px = lerp(a.p[0], b.p[0], e); rig.py = lerp(a.p[1], b.p[1], e); rig.pz = lerp(a.p[2], b.p[2], e);
    rig.tx = lerp(a.t[0], b.t[0], e); rig.ty = lerp(a.t[1], b.t[1], e); rig.tz = lerp(a.t[2], b.t[2], e);
    rig.topR = lerp(a.top[0], b.top[0], p); rig.topG = lerp(a.top[1], b.top[1], p); rig.topB = lerp(a.top[2], b.top[2], p);
    rig.horR = lerp(a.hor[0], b.hor[0], p); rig.horG = lerp(a.hor[1], b.hor[1], p); rig.horB = lerp(a.hor[2], b.hor[2], p);
    rig.sun = lerp(a.sun, b.sun, p); rig.stars = lerp(a.stars, b.stars, p);
    rig.exposure = lerp(a.exposure, b.exposure, p);
    rig.orbit = lerp(a.orbit, b.orbit, e);
    rig.fit = lerp(a.fit, b.fit, e);
    rig.lift = seg.noLift ? 0 : Math.sin(Math.PI * p) * (b.lift || 0);
    const pd = lerp(a.petals, b.petals, p);
    this.r.petals.density += (pd - this.r.petals.density) * Math.min(1, dt * 2);
  }

  /* ---------- দৃশ্য-ভিত্তিক মুহূর্ত ---------- */
  onStation(name, el) {
    if (this.activeStation === name) return;
    this.activeStation = name;
    const { butterflies, petals, burst, world } = this.r;
    const g = gsap();
    if (name !== 'wedding') g.to(world.rig, { keyBoost: name === 'invite' && this.cardOpened ? 1.5 : 1, duration: 2 });
    butterflies.setTheme(name === 'haldi' ? 'yellow' : 'default');
    petals.setPalette(name === 'haldi' ? 'yellow' : 'mixed');
    document.querySelectorAll('.scene-nav a').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const map = { invite: 'invitation', hero: 'hero', family: 'family', story: 'story', haldi: 'schedule', wedding: 'schedule', bouvat: 'schedule', finale: 'finale' };
      a.classList.toggle('is-active', map[name] === id);
    });

    if (name === 'hero') {
      const m = this.r.courtyard.mandap;
      const proxy = { v: m.glow };
      g.to(proxy, { v: 1, duration: 2.5, onUpdate: () => m.setGlow(proxy.v) });
      g.delayedCall(0.8, () => butterflies.circleElement(document.getElementById('hero-names'), { count: 6, duration: 6.5, depth: 7 }));
    }
    if (name === 'family') {
      g.delayedCall(0.6, () => document.querySelectorAll('.family-name').forEach((n, i) => g.delayedCall(i * 1.2, () => butterflies.circleElement(n, { count: 3, duration: 4.5, depth: 6.5 }))));
    }
    if (name === 'story') {
      g.delayedCall(0.5, () => butterflies.circleElement(document.querySelector('.story-panel .section-title'), { count: 4, duration: 5, depth: 7 }));
    }
    if (name === 'haldi') {
      burst.rain(new THREE.Vector3(LAYOUT.haldi.x, 4, LAYOUT.haldi.z + 4), quality.reduced ? 50 : 140, { width: 16, height: 6, palette: 'yellow' });
      g.delayedCall(0.6, () => butterflies.circleElement(el.querySelector('.event-title'), { count: 4, duration: 5, depth: 6.5 }));
    }
    if (name === 'wedding') this.weddingMoment(el);
    if (name === 'bouvat') {
      burst.rain(new THREE.Vector3(LAYOUT.bouvat.x, 5, LAYOUT.bouvat.z + 2), quality.reduced ? 40 : 110, { width: 16, height: 6 });
      g.delayedCall(0.6, () => butterflies.circleElement(el.querySelector('.event-title'), { count: 4, duration: 5, depth: 6.5 }));
    }
    if (name === 'finale') this.finaleMoment();
  }

  weddingMoment(el) {
    const g = gsap();
    const { butterflies, burst, world } = this.r;
    const m = this.r.wedding.mandap;
    const proxy = { v: m.glow };
    // সোনালি আলোয় মণ্ডপ আলোকিত
    g.to(proxy, { v: 1.4, duration: 3, ease: 'power2.out', onUpdate: () => m.setGlow(proxy.v) });
    g.to(world.rig, { keyBoost: 1.7, duration: 2.5 });
    // পাপড়ি বর্ষণ
    burst.rain(new THREE.Vector3(LAYOUT.wedding.x, 9, LAYOUT.wedding.z + 6), quality.reduced ? 80 : quality.burst, { width: 18, height: 8, life: 8 });
    // প্রজাপতি শিরোনামের চারপাশে
    g.delayedCall(0.9, () => butterflies.circleElement(document.getElementById('wedding-title'), { count: 7, duration: 7, depth: 6.5, speed: 1.3 }));
    el.querySelector('.event-card--grand').classList.add('is-lit');
    document.getElementById('wedding-frame').classList.add('is-lit');
    if (!this._weddingFrameShown) {
      this._weddingFrameShown = true;
      g.fromTo('#wedding-frame', { opacity: 0, scale: 0.9, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 1.4, delay: 0.5, ease: 'back.out(1.6)' });
      g.fromTo('#wedding-frame > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.18, delay: 0.9, ease: 'power3.out' });
    }
  }

  finaleMoment() {
    const g = gsap();
    const { butterflies, burst } = this.r;
    burst.rain(new THREE.Vector3(0, 8, LAYOUT.finale.z + 8), quality.reduced ? 80 : quality.burst, { width: 22, height: 8, life: 9 });
    g.delayedCall(1, () => butterflies.circleElement(document.getElementById('finale-names'), { count: 6, duration: 7, depth: 7 }));
    g.delayedCall(2.4, () => butterflies.circleElement(document.getElementById('finale-frame'), { count: 6, duration: 9, depth: 8, speed: 0.9 }));
    // বারবার মালার মতো ঘোরা — দৃশ্যে থাকাকালীন
    clearInterval(this._finaleLoop);
    this._finaleLoop = setInterval(() => {
      if (this.activeStation !== 'finale') { clearInterval(this._finaleLoop); return; }
      butterflies.circleElement(document.getElementById('finale-frame'), { count: 5, duration: 8, depth: 8, speed: 0.9 });
      burst.rain(new THREE.Vector3(0, 8, LAYOUT.finale.z + 8), Math.round(quality.burst * 0.4), { width: 22, height: 8, life: 9 });
    }, 10000);
  }

  /* ---------- লেখার প্রকাশ ---------- */
  setupReveals() {
    const g = gsap();
    const ST = window.ScrollTrigger;
    const fast = quality.reduced ? 0.3 : 1;
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const words = splitWords(el);
      g.set(words, { opacity: 0, y: 22, filter: 'blur(6px)' });
      ST.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => g.to(words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1 * fast, stagger: 0.07 * fast, ease: 'power3.out', clearProps: 'filter' })
      });
    });

    // হিরো-নাম
    const heroNames = document.querySelectorAll('.hero-names > *');
    g.set(heroNames, { opacity: 0, y: 40, scale: 0.85 });
    ST.create({ trigger: '#hero-names', start: 'top 85%', once: true, onEnter: () => g.to(heroNames, { opacity: 1, y: 0, scale: 1, duration: 1.6 * fast, stagger: 0.35 * fast, ease: 'power3.out' }) });

    // পরিবারের কার্ড — দু'দিক থেকে ৩D প্রবেশ
    const cards = document.querySelectorAll('.family-card');
    cards.forEach((c, i) => {
      const dir = i === 0 ? -1 : 1;
      g.set(c, { opacity: 0, x: dir * 80, rotationY: dir * -35, z: -120, transformPerspective: 1200 });
      ST.create({ trigger: c, start: 'top 85%', once: true, onEnter: () => g.to(c, { opacity: 1, x: 0, rotationY: 0, z: 0, duration: 1.6 * fast, ease: 'power3.out', delay: i * 0.15, clearProps: 'transform' }) });
    });
    g.set('.family-union', { opacity: 0, scale: 0 });
    ST.create({ trigger: '.family-grid', start: 'top 75%', once: true, onEnter: () => g.to('.family-union', { opacity: 1, scale: 1, duration: 1, delay: 0.8 * fast, ease: 'back.out(2)' }) });

    // অনুষ্ঠান-কার্ড
    document.querySelectorAll('.event-card').forEach(c => {
      const grand = c.classList.contains('event-card--grand');
      g.set(c, { opacity: 0, y: 90, rotationX: 18, scale: grand ? 0.86 : 0.92, transformPerspective: 1200 });
      ST.create({ trigger: c, start: 'top 88%', once: true, onEnter: () => g.to(c, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: (grand ? 1.8 : 1.3) * fast, ease: 'power3.out', clearProps: 'transform' }) });
    });
    if (!quality.reduced) g.set('#wedding-frame', { opacity: 0 });

    // সংযোগরেখা
    g.to('#timeline-fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 70%', scrub: true } });
    document.querySelectorAll('.event').forEach(ev => ST.create({ trigger: ev, start: 'top 60%', end: 'bottom 40%', toggleClass: 'is-active' }));

    // সমাপ্তি-ফ্রেম
    g.set('#finale-frame', { opacity: 0, scale: 0.92, y: 30 });
    g.set('#finale-names', { opacity: 0, scale: 0.8 });
    ST.create({
      trigger: '#finale', start: 'top 40%', once: true,
      onEnter: () => {
        g.to('#finale-frame', { opacity: 1, scale: 1, y: 0, duration: 1.6 * fast, ease: 'power3.out' });
        g.to('#finale-names', { opacity: 1, scale: 1, duration: 1.8 * fast, delay: 1.6 * fast, ease: 'back.out(1.4)' });
      }
    });
  }

  /* ---------- নিমন্ত্রণপত্র খোলা ---------- */
  setupInvitationUI() {
    const btn = document.getElementById('open-card-btn');
    btn.addEventListener('click', () => {
      if (this.cardOpened) return;
      this.cardOpened = true;
      btn.disabled = true;
      gsap().to('#invitation .invite-ui', { autoAlpha: 0, y: 20, duration: 0.6, ease: 'power2.in' });
      // দৃশ্যটি স্ক্রলের শীর্ষে থাকা নিশ্চিত করা
      if (window.scrollY > 4) window.scrollTo({ top: 0, behavior: 'smooth' });
      const { invitation, burst, butterflies, sparkles, world } = this.r;
      openInvitation(invitation, { petals: burst, butterflies, sparkles, world, onReveal: () => this.revealNames() });
    });
    document.getElementById('scroll-hint').addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('hero').scrollIntoView({ behavior: quality.reduced ? 'auto' : 'smooth' });
    });
  }

  revealNames() {
    const g = gsap();
    const box = document.getElementById('name-reveal');
    const fast = quality.reduced ? 0.4 : 1;
    const title = box.querySelector('.nr-title');
    const groom = document.getElementById('nr-groom');
    const bride = document.getElementById('nr-bride');
    const heart = box.querySelector('.nr-heart');
    const gw = splitWords(groom), bw = splitWords(bride);
    g.set(box, { visibility: 'visible' });
    const tl = g.timeline();
    tl.fromTo(title, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 * fast, ease: 'power2.out' }, 0);
    tl.fromTo(gw, { opacity: 0, y: 34, scale: 0.7, filter: 'blur(14px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.6 * fast, stagger: 0.3 * fast, ease: 'power3.out', clearProps: 'filter' }, 0.4 * fast);
    tl.fromTo(heart, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 1 * fast, ease: 'back.out(3)' }, 1.4 * fast);
    tl.fromTo(bw, { opacity: 0, y: 34, scale: 0.7, filter: 'blur(14px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.6 * fast, stagger: 0.3 * fast, ease: 'power3.out', clearProps: 'filter' }, 1.8 * fast);
    tl.to([...gw, ...bw], { backgroundPosition: '220% 50%', duration: 5, ease: 'none', repeat: -1 }, 2.4 * fast);
    tl.to(heart, { scale: 1.15, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' }, 2.6 * fast);
    tl.add(() => this.r.butterflies.circleElement(groom, { count: 4, duration: 6.5, depth: 6, speed: 1.4 }), 1.0 * fast);
    tl.add(() => this.r.butterflies.circleElement(bride, { count: 4, duration: 6.5, depth: 6, speed: 1.4 }), 2.3 * fast);
    tl.add(() => this.r.butterflies.circleElement(heart, { count: 3, duration: 5, depth: 5.5, speed: 1.8 }), 3.2 * fast);
    tl.to('#scroll-hint', { autoAlpha: 1, duration: 1.2 }, 4.2 * fast);
  }

  /* ---------- পার্শ্ব-নেভিগেশন ---------- */
  setupNav() {
    document.querySelectorAll('.scene-nav a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: quality.reduced ? 'auto' : 'smooth' });
      });
    });
  }
}

function L_INVITE_Z() { return LAYOUT.invite.z; }
