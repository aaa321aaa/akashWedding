/* ==========================================================
   butterflies.js — ত্রিমাত্রিক প্রজাপতি
   দুই ডানার ঝাপটানি, বাঁকা উড়ানপথ, মাউস-প্রতিক্রিয়া,
   নামের চারপাশে ঘোরা, দৃশ্যান্তরে উড়ে যাওয়া
   ========================================================== */
import * as THREE from 'three';
import * as TX from './textures.js';
import { quality } from './three-scene.js';

const PALETTES = ['gold', 'champagne', 'pink', 'cream', 'purple', 'rose', 'gold', 'champagne', 'pink'];

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _right = new THREE.Vector3(), _up = new THREE.Vector3(), _fwd = new THREE.Vector3();
const _ndc = new THREE.Vector3();
const _look = new THREE.Object3D();

function wingMaterial(name) {
  const map = TX.wing(name);
  return new THREE.MeshStandardMaterial({
    map, alphaTest: 0.35, side: THREE.DoubleSide, transparent: false,
    roughness: 0.45, metalness: 0.25,
    emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.42
  });
}

export class Butterflies {
  constructor(world, sparkles, count = quality.butterflies) {
    this.world = world;
    this.sparkles = sparkles;
    this.group = new THREE.Group();
    world.scene.add(this.group);
    this.materials = {};
    for (const n of new Set([...PALETTES, 'yellow'])) this.materials[n] = wingMaterial(n);

    const wingGeo = new THREE.PlaneGeometry(1, 1, 3, 1);
    wingGeo.translate(0.5, 0, 0);
    wingGeo.rotateX(Math.PI / 2);
    // ডানায় সামান্য বাঁক
    const wp = wingGeo.attributes.position;
    for (let i = 0; i < wp.count; i++) wp.setY(i, wp.getY(i) + Math.pow(wp.getX(i), 2) * 0.08);
    wingGeo.computeVertexNormals();

    const bodyGeo = new THREE.CapsuleGeometry(0.035, 0.36, 3, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a1408, roughness: 0.5, metalness: 0.4, emissive: 0x3a2008, emissiveIntensity: 0.3 });
    const antGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(0.09, 0.08, 0.36),
      new THREE.Vector3(0, 0, 0.18), new THREE.Vector3(-0.09, 0.08, 0.36)
    ]);
    const antMat = new THREE.LineBasicMaterial({ color: 0x6b4a1a });

    this.list = [];
    for (let i = 0; i < count; i++) {
      const pal = PALETTES[i % PALETTES.length];
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      g.add(body, new THREE.LineSegments(antGeo, antMat));
      const wr = new THREE.Group(), wl = new THREE.Group();
      const mr = new THREE.Mesh(wingGeo, this.materials[pal]);
      const ml = new THREE.Mesh(wingGeo, this.materials[pal]);
      wr.add(mr); wl.add(ml);
      wl.scale.x = -1;
      g.add(wr, wl);
      const near = i % 5 === 0;                // কিছু প্রজাপতি ক্যামেরার একদম কাছে
      const size = near ? 0.22 + Math.random() * 0.12 : 0.28 + Math.random() * 0.34;
      g.scale.setScalar(size);
      this.group.add(g);
      const b = {
        g, wr, wl, mr, ml, pal, size, near,
        p: new THREE.Vector3(), v: new THREE.Vector3(),
        offset: new THREE.Vector3(), target: new THREE.Vector3(),
        mode: 'wander', timer: 0, life: 0,
        maxSpeed: (near ? 1.6 : 2.2) + Math.random() * 1.6,
        flapRate: 5.5 + (0.6 - size) * 6 + Math.random() * 2,
        flap: Math.random() * 10, glide: 0,
        wobble: 0.6 + Math.random() * 1.4, phase: Math.random() * 10,
        sparkT: Math.random(), sparkles: i % 2 === 0,
        orbit: null
      };
      this._newOffset(b);
      b.p.copy(world.target).add(b.offset).add(new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 4, (Math.random() - 0.5) * 10));
      b.v.set(Math.random() - 0.5, 0, Math.random() - 0.5);
      this.list.push(b);
    }
    this.focus = new THREE.Vector3().copy(world.target);
    this.raycastPoint = new THREE.Vector3();
  }

  _newOffset(b) {
    if (b.near) {
      // ক্যামেরা-স্থানে: সামনে ৩–৭ একক
      b.offset.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3, -(3 + Math.random() * 4));
    } else {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 9;
      b.offset.set(Math.cos(a) * r, -1 + Math.random() * 6, Math.sin(a) * r * 0.8);
    }
    b.timer = 2.5 + Math.random() * 4;
    b.glide = Math.random() < 0.25 ? 0.6 + Math.random() * 0.8 : 0;
  }

  /** ডানার রঙ বদল (যেমন গায়ে হলুদে হলুদ প্রজাপতি) */
  setTheme(theme) {
    if (this.theme === theme) return;
    this.theme = theme;
    this.list.forEach((b, i) => {
      const pal = theme === 'yellow' && i % 3 !== 2 ? 'yellow' : b.pal;
      b.mr.material = b.ml.material = this.materials[pal];
    });
  }

  /** একটি বিন্দু থেকে প্রজাপতির ঝাঁক ক্যামেরার দিকে উড়িয়ে দেওয়া */
  burstFrom(origin, towards, count = 12) {
    const dir = _v1.copy(towards).sub(origin).normalize();
    const picks = this.list.filter(b => b.mode !== 'orbit').slice(0, count);
    for (const b of picks) {
      b.mode = 'burst';
      b.life = 2.2 + Math.random() * 1.6;
      b.p.copy(origin).add(_v2.set((Math.random() - 0.5) * 4, (Math.random() - 0.2) * 4, (Math.random() - 0.5) * 1.5));
      b.v.copy(dir).multiplyScalar(4 + Math.random() * 4).add(_v2.set((Math.random() - 0.5) * 4, (Math.random() - 0.3) * 3, (Math.random() - 0.5) * 2));
    }
  }

  /**
   * নির্দিষ্ট কেন্দ্রের চারপাশে ঘোরা।
   * getCenter() → { point, rx, ry }
   */
  circle(getCenter, { count = 6, duration = 6, speed = 1.5 } = {}) {
    const free = this.list.filter(b => b.mode !== 'orbit');
    // ক্যামেরার কাছের প্রজাপতি আগে বাছাই
    const cam = this.world.camera.position;
    free.sort((a, b) => a.p.distanceToSquared(cam) - b.p.distanceToSquared(cam));
    const picks = free.slice(0, Math.min(count, free.length));
    const dirSign = Math.random() < 0.5 ? 1 : -1;
    picks.forEach((b, i) => {
      b.mode = 'orbit';
      b.orbit = {
        getCenter, angle: (i / picks.length) * Math.PI * 2, speed: speed * dirSign * (0.85 + Math.random() * 0.3),
        t: 0, duration: duration + Math.random() * 1.5, lane: 0.82 + (i % 3) * 0.12, depth: (Math.random() - 0.5) * 0.8
      };
    });
  }

  circleElement(el, opts = {}) {
    if (!el) return;
    const depth = opts.depth || 7;
    const res = { point: new THREE.Vector3(), rx: 1, ry: 1 };
    this.circle(() => {
      const r = this.world.elementToWorld(el, depth, res.point);
      res.rx = Math.max(0.8, r.rx); res.ry = Math.max(0.5, r.ry);
      return res;
    }, opts);
  }

  circlePoint(point, rx = 2, ry = 1.4, opts = {}) {
    const res = { point: point.clone(), rx, ry };
    this.circle(() => res, opts);
  }

  update(dt, t) {
    const world = this.world;
    const cam = world.camera;
    const reduced = quality.reduced;
    const kFocus = 1 - Math.pow(0.35, dt);
    this.focus.lerp(world.target, kFocus);

    cam.getWorldDirection(_fwd);
    _right.crossVectors(_fwd, cam.up).normalize();
    _up.crossVectors(_right, _fwd).normalize();

    const ptr = world.pointer.ndc;
    const speedMul = reduced ? 0.55 : 1;

    for (const b of this.list) {
      b.timer -= dt;
      let steer = 2.2, maxSpeed = b.maxSpeed;

      if (b.mode === 'orbit') {
        const o = b.orbit;
        o.t += dt;
        o.angle += o.speed * dt;
        const c = o.getCenter();
        b.target.copy(c.point)
          .addScaledVector(_right, Math.cos(o.angle) * c.rx * o.lane)
          .addScaledVector(_up, Math.sin(o.angle) * c.ry * o.lane)
          .addScaledVector(_fwd, Math.sin(o.angle * 2) * 0.35 + o.depth);
        steer = 7; maxSpeed = 8;
        if (o.t > o.duration) {
          b.mode = 'wander'; b.orbit = null;
          // কেন্দ্র থেকে দূরে উড়ে যাওয়া
          _v1.copy(b.p).sub(c.point).normalize().multiplyScalar(4);
          b.v.add(_v1);
          this._newOffset(b);
        }
      } else if (b.mode === 'burst') {
        b.life -= dt;
        b.v.multiplyScalar(Math.pow(0.6, dt));
        if (b.life <= 0) { b.mode = 'wander'; this._newOffset(b); }
      } else {
        if (b.timer <= 0) this._newOffset(b);
        if (b.near) {
          b.target.copy(cam.position)
            .addScaledVector(_right, b.offset.x)
            .addScaledVector(_up, b.offset.y)
            .addScaledVector(_fwd, -b.offset.z);
        } else {
          b.target.copy(this.focus).add(b.offset);
        }
        // অনেক দূরে পড়ে গেলে কাছাকাছি নিয়ে আসা (দৃশ্যের বাইরে থেকে)
        if (b.p.distanceToSquared(b.target) > 70 * 70) {
          b.p.copy(b.target).addScaledVector(_fwd, 8).addScaledVector(_right, (Math.random() < 0.5 ? -1 : 1) * 14);
        }
      }

      if (b.mode !== 'burst') {
        _v1.copy(b.target).sub(b.p);
        const dist = _v1.length();
        const desiredSpeed = maxSpeed * Math.min(1, dist / 2.5 + 0.25);
        _v1.normalize().multiplyScalar(desiredSpeed);
        _v2.copy(_v1).sub(b.v).multiplyScalar(Math.min(1, steer * dt));
        b.v.add(_v2);
        // বাঁকা পথ
        _v3.set(-b.v.z, 0, b.v.x).normalize().multiplyScalar(Math.sin(t * b.wobble + b.phase) * 1.4 * dt);
        b.v.add(_v3);
      }

      // মাউস-প্রতিক্রিয়া: কার্সারের কাছ থেকে সরে যাওয়া
      _ndc.copy(b.p).project(cam);
      if (_ndc.z < 1) {
        const dx = _ndc.x - ptr.x, dy = _ndc.y - ptr.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 0.035) {
          const f = (0.035 - d2) * 160 * dt;
          b.v.addScaledVector(_right, Math.sign(dx || 1) * f).addScaledVector(_up, Math.sign(dy || 1) * f * 0.7);
        }
      }

      // ডানা ঝাপটানোর সঙ্গে ওঠানামা
      const gliding = b.glide > 0 && b.mode === 'wander' && b.timer < b.glide;
      b.flap += dt * (gliding ? 1.5 : b.flapRate) * Math.PI * 2 * speedMul;
      const s = Math.sin(b.flap);
      b.v.y += (gliding ? -0.25 : s * 1.1) * dt;

      const vlen = b.v.length();
      const cap = (b.mode === 'burst' ? 10 : maxSpeed * 1.2);
      if (vlen > cap) b.v.multiplyScalar(cap / vlen);
      b.p.addScaledVector(b.v, dt * speedMul);

      // অভিমুখ
      b.g.position.copy(b.p);
      if (vlen > 0.05) {
        _look.position.copy(b.p);
        _look.lookAt(_v1.copy(b.p).add(b.v));
        b.g.quaternion.slerp(_look.quaternion, 1 - Math.pow(0.004, dt));
      }
      const theta = gliding ? 0.22 + Math.sin(t * 2 + b.phase) * 0.05 : 0.42 + 0.82 * s;
      b.wr.rotation.z = theta;
      b.wl.rotation.z = -theta;
      b.wr.rotation.x = b.wl.rotation.x = Math.cos(b.flap) * 0.12;

      // সোনালি ঝিকিমিকি রেখা
      if (this.sparkles && (b.sparkles || b.mode !== 'wander')) {
        b.sparkT -= dt;
        if (b.sparkT <= 0) {
          b.sparkT = b.mode === 'wander' ? 0.16 : 0.05;
          this.sparkles.emit(b.p, null, 0.9 + Math.random() * 0.6, 0.05 + b.size * 0.12);
        }
      }
    }
  }
}
