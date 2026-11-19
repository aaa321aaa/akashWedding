/* ==========================================================
   main.js — সূচনা-বিন্দু
   আকাশ ❤️ অনামিকা — রাজকীয় বাঙালি হিন্দু বিবাহ
   ========================================================== */
import * as THREE from 'three';
import { World, quality, webglAvailable, LAYOUT } from './three-scene.js';
import { updateDecor, optimizeStatic } from './decor.js';
import { createPalace } from './palace.js';
import { createInvitation } from './invitation.js';
import { createGround, createCourtyard, createFamilyScene, createGarden, createHaldi, createWeddingScene, createReception, createFinale } from './environments.js';
import { AmbientPetals, PetalBurst, GoldenDust, Sparkles } from './particles.js';
import { Butterflies } from './butterflies.js';
import { Experience } from './animations.js';
import { initCardTilt, initWorldInteractions } from './interactions.js';
import { initMusic } from './music.js';

const $ = (s) => document.querySelector(s);
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function setProgress(p) {
  const bar = $('#loader-progress');
  if (bar) bar.style.width = Math.round(p) + '%';
}

async function waitForGsap() {
  for (let i = 0; i < 200 && !(window.gsap && window.ScrollTrigger); i++) await wait(25);
  if (!window.gsap || !window.ScrollTrigger) throw new Error('GSAP লোড হয়নি');
  window.gsap.registerPlugin(window.ScrollTrigger);
}

async function loadFonts() {
  if (!document.fonts) return;
  const list = [
    '900 64px "Noto Serif Bengali"', '800 64px "Noto Serif Bengali"', '700 64px "Noto Serif Bengali"',
    '500 24px "Hind Siliguri"', '600 24px "Hind Siliguri"', '500 24px "Noto Sans Bengali"'
  ];
  await Promise.race([
    Promise.all(list.map(f => document.fonts.load(f, 'আকাশ অনামিকা শুভ বিবাহ ঘোষ'))),
    wait(5000)
  ]).catch(() => {});
}

function hideLoader() {
  const l = $('#loader');
  l.classList.add('is-done');
  setTimeout(() => l.remove(), 1400);
  document.documentElement.classList.add('is-ready');
}

/* ---------- ওয়েবজিএল ছাড়া বিকল্প অভিজ্ঞতা ---------- */
function fallback() {
  const html = document.documentElement;
  html.classList.add('no-webgl');
  hideLoader();
  const gsap = window.gsap;
  const intro = document.querySelectorAll('#opening [data-intro]');
  if (gsap) gsap.to(intro, { opacity: 1, y: 0, duration: 1.2, stagger: 0.25 });
  else intro.forEach(e => (e.style.opacity = 1));
  $('#enter-btn').addEventListener('click', () => {
    $('#opening').classList.add('is-hidden');
    html.classList.remove('is-locked');
    html.classList.add('is-entered');
    window.scrollTo(0, 0);
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }, { once: true });
  document.querySelectorAll('.scene-nav a, .scroll-hint').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth' });
  }));
  initCardTilt();
}

/* ---------- মূল সূচনা ---------- */
async function boot() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  initMusic();
  setProgress(5);

  try { await waitForGsap(); } catch (e) { console.error(e); }
  await loadFonts();
  setProgress(18);

  if (!webglAvailable()) return fallback();

  let world;
  try {
    world = new World($('#world'));
  } catch (e) {
    console.error(e);
    return fallback();
  }

  const steps = [];
  const refs = { world };
  steps.push(() => createGround(world));
  const zone = (root, key, r = 100) => { world.addZone(root, LAYOUT[key], r); return root; };
  steps.push(() => {
    refs.palace = createPalace(world);
    optimizeStatic(refs.palace.root, [refs.palace.doors.left, refs.palace.doors.right]);
    world.addZone(refs.palace.root, new THREE.Vector3(0, 0, -22), 125);
  });
  steps.push(() => { refs.invitation = createInvitation(world); zone(refs.invitation.root, 'invite', 90); });
  steps.push(() => { refs.courtyard = createCourtyard(world); zone(optimizeStatic(refs.courtyard.root), 'hero'); });
  steps.push(() => { zone(optimizeStatic(createFamilyScene(world).root), 'family'); });
  steps.push(() => { zone(optimizeStatic(createGarden(world).root), 'story'); });
  steps.push(() => { zone(optimizeStatic(createHaldi(world).root), 'haldi'); });
  steps.push(() => { refs.wedding = createWeddingScene(world); zone(optimizeStatic(refs.wedding.root), 'wedding'); });
  steps.push(() => { zone(optimizeStatic(createReception(world).root), 'bouvat'); });
  steps.push(() => { zone(optimizeStatic(createFinale(world).root), 'finale', 120); });
  steps.push(() => {
    refs.petals = new AmbientPetals(world);
    refs.burst = new PetalBurst(world);
    refs.dust = new GoldenDust(world);
    refs.sparkles = new Sparkles(world);
    refs.butterflies = new Butterflies(world, refs.sparkles);
  });

  for (let i = 0; i < steps.length; i++) {
    steps[i]();
    setProgress(18 + ((i + 1) / steps.length) * 62);
    await nextFrame();
  }

  world.add(updateDecor);
  world.add((dt, t) => refs.petals.update(dt, t));
  world.add((dt, t) => refs.burst.update(dt, t));
  world.add((dt, t) => refs.dust.update(dt, t));
  world.add((dt) => refs.sparkles.update(dt));
  world.add((dt, t) => refs.butterflies.update(dt, t));

  const experience = new Experience(refs);
  window.__wedding = { world, refs, experience, quality };

  // শেডার আগেভাগে কম্পাইল — প্রথম দৃশ্যান্তরে ঝাঁকুনি এড়াতে
  try { world.renderer.compile(world.scene, world.camera); } catch (e) { /* ঐচ্ছিক */ }
  setProgress(92);

  world.start();
  await nextFrame(); await nextFrame();
  setProgress(100);
  await wait(350);

  initCardTilt();
  initWorldInteractions({ world, sparkles: refs.sparkles, butterflies: refs.butterflies });
  hideLoader();
  experience.playIntro();
}

boot().catch(err => {
  console.error('সূচনায় ত্রুটি:', err);
  try { fallback(); } catch (e) { /* শেষ ভরসা */ }
});
