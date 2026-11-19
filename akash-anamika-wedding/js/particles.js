/* ==========================================================
   particles.js — ঝরে পড়া পাপড়ি, পাপড়ি-বিস্ফোরণ, সোনালি ধূলিকণা, ঝিকিমিকি
   ========================================================== */
import * as THREE from 'three';
import * as TX from './textures.js';
import { quality } from './three-scene.js';

const PETAL_COLORS = ['#c2185b', '#e0436e', '#ff7aa2', '#a30d3c', '#ff8a12', '#ffc21a', '#fff7e8', '#f2c6cf', '#b76e79'];
const YELLOW_COLORS = ['#ffc21a', '#ffd84d', '#ff9d1f', '#ffb000', '#fff3a0'];

function petalGeometry() {
  const geo = new THREE.PlaneGeometry(0.22, 0.3, 3, 3);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, x * x * 3.2 + y * y * 0.8);
  }
  geo.computeVertexNormals();
  return geo;
}

function petalMaterial() {
  return new THREE.MeshStandardMaterial({
    map: TX.petal(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.55,
    emissive: 0x2a0610, emissiveIntensity: 0.4
  });
}

/* ---------- চারপাশে ঝরে পড়া পাপড়ি ---------- */
export class AmbientPetals {
  constructor(world, count = quality.petals) {
    this.world = world;
    this.count = count;
    this.box = new THREE.Vector3(26, 18, 26);
    this.mesh = new THREE.InstancedMesh(petalGeometry(), petalMaterial(), count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.data = [];
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      this.data.push({
        p: new THREE.Vector3((Math.random() - 0.5) * this.box.x, (Math.random() - 0.5) * this.box.y, (Math.random() - 0.5) * this.box.z),
        fall: 0.35 + Math.random() * 0.6,
        sway: 0.4 + Math.random() * 0.9,
        phase: Math.random() * 10,
        rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        spin: new THREE.Vector3((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4),
        s: 0.7 + Math.random() * 0.8
      });
      col.set(PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0]);
      this.mesh.setColorAt(i, col);
    }
    this.mesh.instanceColor.needsUpdate = true;
    this.center = new THREE.Vector3();
    this.density = 0.5;
    this.palette = 'mixed';
    this._d = new THREE.Object3D();
    world.scene.add(this.mesh);
  }

  setPalette(name) {
    if (name === this.palette) return;
    this.palette = name;
    const list = name === 'yellow' ? YELLOW_COLORS : PETAL_COLORS;
    const col = new THREE.Color();
    for (let i = 0; i < this.count; i++) { col.set(list[(Math.random() * list.length) | 0]); this.mesh.setColorAt(i, col); }
    this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt, t) {
    const cam = this.world.camera.position;
    const tgt = this.world.target;
    this.center.copy(cam).lerp(tgt, 0.45);
    const n = Math.floor(this.count * THREE.MathUtils.clamp(this.density, 0, 1));
    this.mesh.count = n;
    const hx = this.box.x / 2, hy = this.box.y / 2, hz = this.box.z / 2;
    const d = this._d;
    const speed = quality.reduced ? 0.45 : 1;
    for (let i = 0; i < n; i++) {
      const it = this.data[i];
      it.p.y -= it.fall * dt * speed;
      it.p.x += Math.sin(t * it.sway + it.phase) * dt * 0.6 * speed;
      it.p.z += Math.cos(t * it.sway * 0.7 + it.phase) * dt * 0.4 * speed;
      // কেন্দ্রের সাপেক্ষে মোড়ানো (wrap)
      let rx = it.p.x - this.center.x, ry = it.p.y - this.center.y, rz = it.p.z - this.center.z;
      if (rx > hx) it.p.x -= this.box.x; else if (rx < -hx) it.p.x += this.box.x;
      if (ry < -hy) it.p.y += this.box.y; else if (ry > hy) it.p.y -= this.box.y;
      if (rz > hz) it.p.z -= this.box.z; else if (rz < -hz) it.p.z += this.box.z;
      it.rot.x += it.spin.x * dt * speed; it.rot.y += it.spin.y * dt * speed; it.rot.z += it.spin.z * dt * speed;
      d.position.copy(it.p);
      d.rotation.copy(it.rot);
      d.scale.setScalar(it.s);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ---------- পাপড়ি-বিস্ফোরণ (অবজেক্ট পুল) ---------- */
export class PetalBurst {
  constructor(world, count = quality.burst) {
    this.world = world;
    this.count = count;
    this.mesh = new THREE.InstancedMesh(petalGeometry(), petalMaterial(), count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.pool = [];
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      this.pool.push({ alive: false, life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), rot: new THREE.Euler(), spin: new THREE.Vector3(), s: 1 });
      col.set(PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0]);
      this.mesh.setColorAt(i, col);
    }
    this.mesh.instanceColor.needsUpdate = true;
    this.cursor = 0;
    this.active = 0;
    this._d = new THREE.Object3D();
    this._zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < count; i++) this.mesh.setMatrixAt(i, this._zero);
    world.scene.add(this.mesh);
  }

  /** origin থেকে direction অভিমুখে n-টি পাপড়ি ছোড়া */
  burst(origin, direction, n = 200, { spread = 1.2, speed = 9, life = 5, radius = 1.5, palette } = {}) {
    n = Math.min(n, this.count);
    const dir = direction.clone().normalize();
    const col = new THREE.Color();
    const list = palette === 'yellow' ? YELLOW_COLORS : null;
    for (let k = 0; k < n; k++) {
      const i = this.cursor; this.cursor = (this.cursor + 1) % this.count;
      const it = this.pool[i];
      it.alive = true; it.life = 0; it.max = life * (0.6 + Math.random() * 0.6);
      it.p.copy(origin).add(new THREE.Vector3((Math.random() - 0.5) * radius * 2, (Math.random() - 0.5) * radius * 2, (Math.random() - 0.5) * radius));
      const rnd = new THREE.Vector3((Math.random() - 0.5) * spread, (Math.random() - 0.3) * spread, (Math.random() - 0.5) * spread);
      it.v.copy(dir).add(rnd).normalize().multiplyScalar(speed * (0.4 + Math.random() * 0.8));
      it.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      it.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
      it.s = 0.8 + Math.random() * 1.1;
      if (list) { col.set(list[(Math.random() * list.length) | 0]); this.mesh.setColorAt(i, col); }
    }
    if (list) this.mesh.instanceColor.needsUpdate = true;
  }

  /** উপর থেকে বৃষ্টির মতো পাপড়ি ঝরানো */
  rain(center, n = 160, { width = 12, height = 10, life = 7, palette } = {}) {
    n = Math.min(n, this.count);
    const col = new THREE.Color();
    const list = palette === 'yellow' ? YELLOW_COLORS : null;
    for (let k = 0; k < n; k++) {
      const i = this.cursor; this.cursor = (this.cursor + 1) % this.count;
      const it = this.pool[i];
      it.alive = true; it.life = -Math.random() * 2.5; it.max = life * (0.7 + Math.random() * 0.5);
      it.p.set(center.x + (Math.random() - 0.5) * width, center.y + height * (0.6 + Math.random() * 0.6), center.z + (Math.random() - 0.5) * width * 0.6);
      it.v.set((Math.random() - 0.5) * 0.6, -0.8 - Math.random() * 0.8, (Math.random() - 0.5) * 0.6);
      it.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      it.spin.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
      it.s = 0.8 + Math.random() * 0.9;
      if (list) { col.set(list[(Math.random() * list.length) | 0]); this.mesh.setColorAt(i, col); }
    }
    if (list) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt, t) {
    const d = this._d;
    let any = false;
    for (let i = 0; i < this.count; i++) {
      const it = this.pool[i];
      if (!it.alive) continue;
      any = true;
      it.life += dt;
      if (it.life < 0) { this.mesh.setMatrixAt(i, this._zero); continue; }
      if (it.life > it.max) { it.alive = false; this.mesh.setMatrixAt(i, this._zero); continue; }
      const drag = Math.pow(0.35, dt);
      it.v.multiplyScalar(drag);
      it.v.y -= 0.6 * dt;
      it.v.x += Math.sin(t * 2 + i) * dt * 0.5;
      it.p.addScaledVector(it.v, dt);
      it.rot.x += it.spin.x * dt; it.rot.y += it.spin.y * dt; it.rot.z += it.spin.z * dt;
      const fade = Math.min(1, it.life * 4) * Math.min(1, (it.max - it.life) * 1.2);
      d.position.copy(it.p); d.rotation.copy(it.rot); d.scale.setScalar(it.s * fade);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    if (any || this._wasAny) this.mesh.instanceMatrix.needsUpdate = true;
    this._wasAny = any;
  }
}

/* ---------- সোনালি ধূলিকণা (GPU-তে মোড়ানো) ---------- */
export class GoldenDust {
  constructor(world, count = quality.dust) {
    this.world = world;
    const size = new THREE.Vector3(40, 22, 40);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random() * size.x;
      pos[i * 3 + 1] = Math.random() * size.y;
      pos[i * 3 + 2] = Math.random() * size.z;
      seed[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    this.uniforms = {
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector3() },
      uSize: { value: size },
      uMap: { value: TX.glow() },
      uOpacity: { value: 0.85 },
      uScale: { value: window.innerHeight * 0.5 * Math.min(window.devicePixelRatio, 2) },
      uColor: { value: new THREE.Color('#ffd68a') }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float seed;
        uniform float uTime; uniform vec3 uCenter; uniform vec3 uSize; uniform float uScale;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y += uTime * (0.15 + seed * 0.35);
          p.x += sin(uTime * 0.4 + seed * 30.0) * 0.8;
          p.z += cos(uTime * 0.3 + seed * 20.0) * 0.8;
          vec3 hs = uSize * 0.5;
          p = mod(p - uCenter + hs, uSize) - hs + uCenter;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float sz = 0.05 + seed * 0.12;
          gl_PointSize = sz * uScale / -mv.z;
          vAlpha = (0.35 + 0.65 * abs(sin(uTime * (1.0 + seed * 2.5) + seed * 40.0))) * smoothstep(60.0, 8.0, -mv.z) * smoothstep(0.5, 2.0, -mv.z);
        }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; uniform float uOpacity; uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(uColor * 1.6, tex.a * vAlpha * uOpacity);
        }
      `
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    world.scene.add(this.points);
    window.addEventListener('resize', () => { this.uniforms.uScale.value = window.innerHeight * 0.5 * Math.min(window.devicePixelRatio, 2); }, { passive: true });
  }
  update(dt, t) {
    this.uniforms.uTime.value = t;
    this.uniforms.uCenter.value.copy(this.world.camera.position).lerp(this.world.target, 0.5);
  }
}

/* ---------- ঝিকিমিকি (প্রজাপতির রেখা ও বিস্ফোরণের জন্য পুল) ---------- */
export class Sparkles {
  constructor(world, count = quality.sparkles) {
    this.world = world;
    this.count = count;
    this.pos = new Float32Array(count * 3);
    this.alpha = new Float32Array(count);
    this.size = new Float32Array(count);
    this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count);
    this.max = new Float32Array(count).fill(1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    this.geo = geo;
    this.uniforms = { uMap: { value: TX.glow() }, uScale: { value: window.innerHeight * 0.5 * Math.min(window.devicePixelRatio, 2) } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float alpha; attribute float psize; uniform float uScale; varying float vA;
        void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = psize * uScale / -mv.z; vA = alpha; }
      `,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; varying float vA;
        void main() { vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vec3(1.0, 0.86, 0.55) * 1.8, t.a * vA); }
      `
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.cursor = 0;
    world.scene.add(this.points);
    window.addEventListener('resize', () => { this.uniforms.uScale.value = window.innerHeight * 0.5 * Math.min(window.devicePixelRatio, 2); }, { passive: true });
  }
  emit(p, v = null, life = 1.2, size = 0.12) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.count;
    this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z;
    this.vel[i * 3] = v ? v.x : (Math.random() - 0.5) * 0.3;
    this.vel[i * 3 + 1] = v ? v.y : -0.1 - Math.random() * 0.2;
    this.vel[i * 3 + 2] = v ? v.z : (Math.random() - 0.5) * 0.3;
    this.life[i] = 0; this.max[i] = life; this.size[i] = size;
    this.alpha[i] = 1;
  }
  explode(center, n = 80, speed = 4, size = 0.16) {
    const v = new THREE.Vector3();
    for (let k = 0; k < n; k++) {
      v.set(Math.random() - 0.5, Math.random() - 0.4, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.3 + Math.random()));
      this.emit(center, v, 1 + Math.random() * 1.4, size * (0.5 + Math.random()));
    }
  }
  update(dt) {
    for (let i = 0; i < this.count; i++) {
      if (this.alpha[i] <= 0) continue;
      this.life[i] += dt;
      const k = this.life[i] / this.max[i];
      if (k >= 1) { this.alpha[i] = 0; continue; }
      const drag = Math.pow(0.4, dt);
      this.vel[i * 3] *= drag; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * drag - 0.15 * dt; this.vel[i * 3 + 2] *= drag;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.alpha[i] = (1 - k) * Math.min(1, this.life[i] * 8);
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.alpha.needsUpdate = true;
    this.geo.attributes.psize.needsUpdate = true;
  }
}
