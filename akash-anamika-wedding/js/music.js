/* ==========================================================
   music.js — ঐচ্ছিক বিবাহ-সুর
   assets/audio/wedding-instrumental.mp3 থাকলে সেটি বাজবে;
   না থাকলে Web Audio দিয়ে তৈরি সানাই-তানপুরার কোমল সুর।
   ব্যবহারকারী বোতাম না চাপলে কোনো শব্দ বাজবে না।
   ========================================================== */

const AUDIO_FILE = 'assets/audio/wedding-instrumental.mp3';

/* রাগ ভূপালী ধাঁচের পঞ্চস্বর (সা রে গা পা ধা) — উৎসবমুখর, কোমল */
const SA = 220; // A3
const RATIO = { S: 1, R: 9 / 8, G: 5 / 4, P: 3 / 2, D: 5 / 3, 'S\'': 2, 'R\'': 9 / 4, 'G\'': 5 / 2, '.D': 5 / 6, '.P': 3 / 4 };

// [স্বর, মাত্রা] — একটি সুরেলা চলন
const PHRASES = [
  [['G', 1], ['P', 1], ['D', 2], ['P', 1], ['G', 1], ['R', 1], ['G', 1], ['S', 4]],
  [['S', 1], ['R', 1], ['G', 1], ['P', 1], ['D', 2], ['S\'', 2], ['D', 1], ['P', 1], ['G', 2], ['P', 4]],
  [['S\'', 1], ['D', 1], ['P', 1], ['G', 1], ['R', 2], ['G', 1], ['P', 1], ['G', 2], ['R', 1], ['S', 1], ['.D', 2], ['S', 4]],
  [['G', 2], ['P', 1], ['D', 1], ['S\'', 2], ['R\'', 1], ['S\'', 1], ['D', 2], ['P', 2], ['G', 1], ['R', 1], ['S', 4]]
];
const BEAT = 0.62;   // ধীর লয় — কোমল আবহ

class SynthMusic {
  constructor() {
    this.ctx = null;
    this.playing = false;
  }

  _init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    // কৃত্রিম প্রতিধ্বনি
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(this.master);
    this.dry = ctx.createGain(); this.dry.gain.value = 0.6;
    this.dry.connect(this.master);
    this.bus = ctx.createGain();
    this.bus.connect(this.dry); this.bus.connect(this.reverb);

    this.nextDrone = ctx.currentTime + 0.1;
    this.droneStep = 0;
    this.nextNote = ctx.currentTime + 1.2;
    this.phrase = 0; this.noteIdx = 0;
    this.nextBell = ctx.currentTime + 2;
  }

  /* তানপুরা — সা পা সা' সা */
  _pluck(freq, t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    o.type = 'sawtooth'; o2.type = 'triangle';
    o.frequency.value = freq; o2.frequency.value = freq * 2.003;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(1300, t);
    f.frequency.exponentialRampToValueAtTime(380, t + 2.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.032, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0006, t + 3.0);
    o.connect(f); o2.connect(f); f.connect(g).connect(this.bus);
    o.start(t); o2.start(t); o.stop(t + 3); o2.stop(t + 3);
  }

  /* সানাই/বাঁশির মতো সুর — ভাইব্রেটো ও মীড় সহ */
  _note(freq, t, dur, prevFreq) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    const vib = ctx.createOscillator(), vibG = ctx.createGain();
    vib.frequency.value = 4.6; vibG.gain.value = freq * 0.004;
    vib.connect(vibG); vibG.connect(o.frequency); vibG.connect(o2.frequency);
    if (prevFreq) {
      o.frequency.setValueAtTime(prevFreq, t);
      o.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
      o2.frequency.setValueAtTime(prevFreq * 2, t);
      o2.frequency.exponentialRampToValueAtTime(freq * 2, t + 0.12);
    } else { o.frequency.value = freq; o2.frequency.value = freq * 2; }
    const bp = ctx.createBiquadFilter();
    bp.type = 'lowpass'; bp.frequency.value = freq * 4; bp.Q.value = 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1700;
    const g = ctx.createGain();
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 0.22);
    g.gain.setValueAtTime(0.04, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur + 0.25);
    o.connect(bp).connect(lp).connect(g);
    o2.connect(g2).connect(g);
    g.connect(this.bus);
    o.start(t); o2.start(t); vib.start(t);
    const end = t + dur + 0.3;
    o.stop(end); o2.stop(end); vib.stop(end);
  }

  /* মন্দিরের ঘণ্টা/মন্দিরা */
  _bell(t) {
    const ctx = this.ctx;
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = SA * 4 * m;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.01 / (i + 1), t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5 / (i + 1));
      o.connect(g).connect(this.bus);
      o.start(t); o.stop(t + 2.6);
    });
  }

  _schedule() {
    const ctx = this.ctx;
    const ahead = ctx.currentTime + 0.25;
    const droneNotes = [SA * 0.75 / 2 * 2, SA, SA, SA / 2];   // পা(নিচে) সা সা সা(মন্দ্র)
    while (this.nextDrone < ahead) {
      this._pluck(droneNotes[this.droneStep % 4], this.nextDrone);
      this.droneStep++;
      this.nextDrone += BEAT * 1.5;
    }
    while (this.nextNote < ahead) {
      const ph = PHRASES[this.phrase];
      const [sw, beats] = ph[this.noteIdx];
      const freq = SA * RATIO[sw];
      const dur = beats * BEAT;
      this._note(freq, this.nextNote, dur, this._prev);
      this._prev = freq;
      this.nextNote += dur;
      this.noteIdx++;
      if (this.noteIdx >= ph.length) {
        this.noteIdx = 0;
        this.phrase = (this.phrase + 1) % PHRASES.length;
        this.nextNote += BEAT * 2;   // বাক্যের শেষে বিরতি
        this._prev = null;
      }
    }
    while (this.nextBell < ahead) {
      this._bell(this.nextBell);
      this.nextBell += BEAT * 16;
    }
  }

  async play() {
    if (!this.ctx) this._init();
    await this.ctx.resume();
    const t = this.ctx.currentTime;
    if (this.nextNote < t) { this.nextNote = t + 0.4; this.nextDrone = t + 0.1; this.nextBell = t + 1; }
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0.75, t + 4);
    clearInterval(this.timer);
    this.timer = setInterval(() => this._schedule(), 60);
    this.playing = true;
  }

  pause() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.6);
    this.playing = false;
    setTimeout(() => { if (!this.playing) { clearInterval(this.timer); this.ctx.suspend(); } }, 700);
  }
}

class FileMusic {
  constructor(src) {
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = 0;
    this.playing = false;
  }
  async play() {
    await this.audio.play();
    this.playing = true;
    this._fade(0.45);
  }
  pause() {
    this.playing = false;
    this._fade(0, () => this.audio.pause());
  }
  _fade(to, done) {
    cancelAnimationFrame(this._raf);
    const from = this.audio.volume, start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / 900);
      this.audio.volume = from + (to - from) * k;
      if (k < 1) this._raf = requestAnimationFrame(step); else if (done) done();
    };
    this._raf = requestAnimationFrame(step);
  }
}

async function fileExists(url) {
  if (location.protocol === 'file:') return false;
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const type = r.headers.get('content-type') || '';
    return r.ok && !type.includes('text/html');
  } catch (e) {
    return false;
  }
}

export function initMusic() {
  const btn = document.getElementById('music-toggle');
  let player = null;
  let busy = false;
  const setUI = (on) => {
    btn.classList.toggle('is-playing', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'সুর বন্ধ করুন' : 'সানাইয়ের সুর চালু করুন');
    btn.title = on ? 'সুর বন্ধ করুন' : 'সানাইয়ের সুর';
  };
  // ফাইল-যাচাই আগেভাগে — যাতে ক্লিকের মুহূর্তেই বাজানো যায়
  let useFile = false;
  fileExists(AUDIO_FILE).then(ok => { useFile = ok; });
  const start = async () => {
    if (busy || (player && player.playing)) return;
    busy = true;
    try {
      if (!player) player = useFile ? new FileMusic(AUDIO_FILE) : new SynthMusic();
      try { await player.play(); }
      catch (e) {
        // ফাইল বাজাতে না পারলে সংশ্লেষিত সুরে ফিরে যাওয়া
        player = new SynthMusic();
        await player.play();
      }
      setUI(true);
    } catch (e) {
      console.warn('সুর চালু করা যায়নি', e);
    } finally {
      busy = false;
    }
  };
  btn.addEventListener('click', () => {
    if (player && player.playing) { player.pause(); setUI(false); }
    else start();
  });
  // ট্যাব লুকালে থামে, ফিরে এলে আবার বাজে
  let resumeOnShow = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && player && player.playing) { player.pause(); setUI(false); resumeOnShow = true; }
    else if (!document.hidden && resumeOnShow) { resumeOnShow = false; start(); }
  });
  return { start };
}
