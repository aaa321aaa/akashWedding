/* ==========================================================
   three-scene.js — রেন্ডারার, ক্যামেরা, আকাশ, আলো ও রেন্ডার-লুপ
   ========================================================== */
import * as THREE from 'three';

/* ---------- ডিভাইস সক্ষমতা অনুযায়ী মান ---------- */
export const quality = (() => {
  const ua = navigator.userAgent || '';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (coarse && Math.min(screen.width, screen.height) < 900);
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = window.devicePixelRatio || 1;

  let tier = 'high';
  if (mobile || mem <= 4 || cores <= 4) tier = 'medium';
  if (mobile && (mem <= 3 || cores <= 4)) tier = 'low';

  const presets = {
    high:   { pixelRatio: Math.min(dpr, 1.75), shadows: true,  shadowSize: 2048, antialias: true,  butterflies: 30, petals: 520, dust: 1500, burst: 460, sparkles: 500, density: 1.0 },
    medium: { pixelRatio: Math.min(dpr, 1.5),  shadows: false, shadowSize: 1024, antialias: true,  butterflies: 20, petals: 280, dust: 800,  burst: 260, sparkles: 300, density: 0.7 },
    low:    { pixelRatio: Math.min(dpr, 1.25), shadows: false, shadowSize: 512,  antialias: false, butterflies: 13, petals: 150, dust: 420,  burst: 160, sparkles: 180, density: 0.5 }
  };
  const p = { ...presets[tier] };
  if (reduced) {
    p.butterflies = Math.ceil(p.butterflies * 0.6);
    p.petals = Math.ceil(p.petals * 0.5);
    p.burst = Math.ceil(p.burst * 0.5);
  }
  return { ...p, tier, mobile, reduced };
})();

/* ---------- দৃশ্যপটের বিন্যাস (বিশ্ব-স্থানাঙ্ক) ---------- */
export const LAYOUT = {
  palace:  new THREE.Vector3(0, 0, 0),
  invite:  new THREE.Vector3(0, 4.6, -30),
  hero:    new THREE.Vector3(0, 0, -95),
  family:  new THREE.Vector3(26, 0, -152),
  story:   new THREE.Vector3(-6, 0, -208),
  haldi:   new THREE.Vector3(-26, 0, -262),
  wedding: new THREE.Vector3(0, 0, -312),
  bouvat:  new THREE.Vector3(26, 0, -364),
  finale:  new THREE.Vector3(0, 0, -436)
};

/* ---------- আকাশের শেডার ---------- */
const skyVertex = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w * 0.99999;
  }
`;
const skyFragment = /* glsl */`
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uBottom;
  uniform vec3 uSunDir;
  uniform float uSun;
  uniform float uStars;
  uniform float uTime;
  varying vec3 vDir;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uHorizon, uTop, smoothstep(-0.02, 0.55, h));
    col = mix(col, uBottom, smoothstep(0.0, -0.25, h));
    float s = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSun * (pow(s, 900.0) * vec3(1.0, 0.92, 0.75) * 3.0
                 + pow(s, 24.0) * vec3(1.0, 0.62, 0.3) * 0.55
                 + pow(s, 3.0) * vec3(0.55, 0.22, 0.08) * 0.35);
    vec3 cell = floor(d * 260.0);
    float n = hash(cell);
    float star = step(0.9972, n) * smoothstep(0.04, 0.35, h);
    float tw = 0.55 + 0.45 * sin(uTime * (1.5 + n * 3.0) + n * 80.0);
    col += star * tw * uStars * vec3(1.0, 0.93, 0.8) * 1.4;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* ---------- উষ্ণ পরিবেশ-মানচিত্র (সোনালি প্রতিফলনের জন্য) ---------- */
function buildWarmEnvironment(renderer) {
  const envScene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const colors = [];
  const pos = geo.attributes.position;
  const top = new THREE.Color('#5a2a1a');
  const mid = new THREE.Color('#2a0a12');
  const low = new THREE.Color('#120306');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10;
    if (y > 0) c.copy(mid).lerp(top, y); else c.copy(mid).lerp(low, -y);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  envScene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));

  const panel = (color, intensity, x, y, z, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  panel('#ffd9a0', 6, 0, 8, 2, 6, 3);
  panel('#ffb36b', 3.5, -7, 3, 5, 3, 4);
  panel('#fff0d0', 3, 7, 4, -4, 3, 3);
  panel('#ff9a6a', 1.5, 0, 2, -8, 8, 2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  envScene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}

/* ---------- মূল ত্রিমাত্রিক জগৎ ---------- */
export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality.antialias,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false
    });
    const r = this.renderer;
    r.setPixelRatio(quality.pixelRatio);
    r.setSize(window.innerWidth, window.innerHeight, false);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = quality.shadows;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.environment = buildWarmEnvironment(r);
    this.scene.fog = new THREE.Fog(0x350814, 22, 130);

    this.camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 190);
    this.scene.add(this.camera);

    /* ক্যামেরা-রিগ: GSAP এই মানগুলো অ্যানিমেট করে */
    this.rig = {
      px: 0, py: 7, pz: 52,
      tx: 0, ty: 8, tz: 0,
      lift: 0, orbit: 0, sway: 1, roll: 0,
      topR: 0.006, topG: 0.001, topB: 0.003,
      horR: 0.04, horG: 0.004, horB: 0.01,
      sun: 0, stars: 1, exposure: 1.05, keyBoost: 1, fit: 1.75
    };

    this.pointer = { x: 0, y: 0, sx: 0, sy: 0, ndc: new THREE.Vector2(9, 9) };
    this.updaters = new Set();
    this.zones = [];
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.target = new THREE.Vector3();
    this.distScale = 1;

    this._buildSky();
    this._buildLights();
    this._bindEvents();
    this.resize();
  }

  _buildSky() {
    this.skyUniforms = {
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color('#0d0206') },
      uSunDir: { value: new THREE.Vector3(0, 0.08, -1) },
      uSun: { value: 0 },
      uStars: { value: 1 },
      uTime: { value: 0 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat);
    this.sky.frustumCulled = false;
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);
  }

  _buildLights() {
    const s = this.scene;
    this.ambient = new THREE.AmbientLight(0xffe2c4, 0.28);
    s.add(this.ambient);
    this.hemi = new THREE.HemisphereLight(0xffe7c2, 0x3a0a14, 0.55);
    s.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffdcae, 1.5);
    this.sun.position.set(10, 22, 14);
    this.sun.castShadow = quality.shadows;
    if (quality.shadows) {
      const sc = this.sun.shadow;
      sc.mapSize.set(quality.shadowSize, quality.shadowSize);
      sc.camera.near = 1; sc.camera.far = 80;
      sc.camera.left = -26; sc.camera.right = 26; sc.camera.top = 26; sc.camera.bottom = -26;
      sc.bias = -0.0006; sc.normalBias = 0.03;
    }
    s.add(this.sun, this.sun.target);

    /* ক্যামেরার লক্ষ্যবস্তুর কাছে ঘুরে বেড়ানো উষ্ণ আলো — নির্দিষ্ট সংখ্যক আলো রেখে শেডার স্থির রাখা হয় */
    this.keyLights = [
      new THREE.PointLight(0xffb066, 70, 45, 2),
      new THREE.PointLight(0xffc88a, 55, 45, 2),
      new THREE.PointLight(0xff8a5a, 35, 40, 2)
    ];
    this.keyOffsets = [new THREE.Vector3(-7, 7, 6), new THREE.Vector3(7, 6, 5), new THREE.Vector3(0, 3, -6)];
    this.keyLights.forEach(l => { l.userData.base = l.intensity; s.add(l); });
  }

  _bindEvents() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('orientationchange', this._onResize, { passive: true });

    this._onPointer = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      this.pointer.x = x * 2 - 1;
      this.pointer.y = -(y * 2 - 1);
      this.pointer.ndc.set(this.pointer.x, this.pointer.y);
    };
    window.addEventListener('pointermove', this._onPointer, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.renderer.setAnimationLoop(null);
      else if (this.running) { this.clock.getDelta(); this.renderer.setAnimationLoop(this._tick); }
    });
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.75 ? 58 : aspect < 1.1 ? 52 : 46;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    /* প্রতিকৃতি-মোডে দৃশ্য দূর থেকে দেখানো, যাতে সব কিছু পর্দায় আঁটে */
    this.distScale = aspect < 1 ? THREE.MathUtils.clamp(0.78 / aspect, 1, 1.75) : 1;
  }

  add(fn) { this.updaters.add(fn); return () => this.updaters.delete(fn); }

  /** দৃশ্যপটকে দূরত্ব-ভিত্তিক দৃশ্যমানতা-নিয়ন্ত্রণে যুক্ত করা */
  addZone(root, center, radius = 105) {
    this.zones.push({ root, center: center.clone ? center.clone() : center, radius });
  }

  start() {
    this.running = true;
    this._tick = this._tick || (() => this.tick());
    this.clock.getDelta();
    this.renderer.setAnimationLoop(this._tick);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;
    const t = this.elapsed;
    const rig = this.rig;
    const cam = this.camera;

    /* মসৃণ মাউস-প্যারালাক্স */
    const p = this.pointer;
    const k = 1 - Math.pow(0.0025, dt);
    p.sx += (p.x - p.sx) * k;
    p.sy += (p.y - p.sy) * k;

    this.target.set(rig.tx, rig.ty + rig.lift * 0.35, rig.tz);
    const off = this._off || (this._off = new THREE.Vector3());
    off.set(rig.px - rig.tx, rig.py - rig.ty, rig.pz - rig.tz).multiplyScalar(Math.min(this.distScale, rig.fit));

    if (!quality.reduced) {
      if (rig.orbit > 0) off.applyAxisAngle(THREE.Object3D.DEFAULT_UP, Math.sin(t * 0.11) * 0.42 * rig.orbit);
      const sway = rig.sway;
      off.x += (p.sx * 1.6 + Math.sin(t * 0.21) * 0.35) * sway;
      off.y += (p.sy * 0.9 + Math.sin(t * 0.17) * 0.2) * sway;
    }
    cam.position.copy(this.target).add(off);
    cam.position.y += rig.lift;
    cam.lookAt(this.target);
    if (rig.roll) cam.rotateZ(rig.roll);

    /* আকাশ ও কুয়াশা */
    const u = this.skyUniforms;
    u.uTop.value.setRGB(rig.topR, rig.topG, rig.topB);
    u.uHorizon.value.setRGB(rig.horR, rig.horG, rig.horB);
    u.uSun.value = rig.sun;
    u.uStars.value = rig.stars;
    u.uTime.value = t;
    this.scene.fog.color.copy(u.uHorizon.value);
    this.sky.position.copy(cam.position);
    this.renderer.toneMappingExposure = rig.exposure;

    /* আলো লক্ষ্যবস্তুকে অনুসরণ করে */
    this.sun.position.set(this.target.x + 12, this.target.y + 24, this.target.z + 14);
    this.sun.target.position.copy(this.target);
    for (let i = 0; i < this.keyLights.length; i++) {
      const l = this.keyLights[i];
      l.position.copy(this.target).add(this.keyOffsets[i]);
      l.intensity = l.userData.base * rig.keyBoost * (0.92 + 0.08 * Math.sin(t * 7 + i * 2.1) * Math.sin(t * 3.3 + i));
    }

    /* দূরের দৃশ্যপট লুকিয়ে রাখা — ড্র-কল ও GPU-খরচ কমাতে */
    for (const z of this.zones) {
      const d = Math.min(z.center.distanceTo(cam.position), z.center.distanceTo(this.target));
      z.root.visible = d < z.radius;
    }

    for (const fn of this.updaters) fn(dt, t);
    this.renderer.render(this.scene, cam);
  }

  /** একটি HTML উপাদানের কেন্দ্রকে ক্যামেরা থেকে নির্দিষ্ট দূরত্বে বিশ্ব-স্থানাঙ্কে রূপান্তর */
  elementToWorld(el, depth = 7, out = new THREE.Vector3()) {
    const r = el.getBoundingClientRect();
    const nx = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
    const ny = -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1);
    out.set(nx, ny, 0.5).unproject(this.camera).sub(this.camera.position).normalize();
    out.multiplyScalar(depth).add(this.camera.position);
    const vh = 2 * depth * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const vw = vh * this.camera.aspect;
    return { point: out, rx: (r.width / window.innerWidth) * vw * 0.58, ry: (r.height / window.innerHeight) * vh * 0.62 };
  }
}

/* ---------- সাহায্যকারী ---------- */
export function hexToLinear(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
