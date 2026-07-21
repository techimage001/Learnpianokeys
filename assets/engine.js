/* Learn Piano Keys - audio, input and keybed engine
   All sound is synthesised in the browser with the Web Audio API.
   No sample libraries, no external services, no API keys. */

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const isBlack = m => [1,3,6,8,10].includes(((m % 12) + 12) % 12);
const noteName = (m, flats) => (flats ? FLAT_NAMES : NOTE_NAMES)[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const pitchClass = m => NOTE_NAMES[((m % 12) + 12) % 12];
const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12);
const hzToMidi = f => 69 + 12 * Math.log2(f / 440);

class PianoAudio {
  constructor() {
    this.ctx = null;
    this.voices = new Map();
    this.sustain = false;
    this.sustained = new Set();
    this.ready = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;

    // A short procedural room impulse. Generated, never downloaded.
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * 1.5);
    const imp = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = imp.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6) * 0.5;
      }
    }
    this.verb = this.ctx.createConvolver();
    this.verb.buffer = imp;
    this.verbGain = this.ctx.createGain();
    this.verbGain.gain.value = 0.16;

    this.master.connect(this.ctx.destination);
    this.master.connect(this.verbGain);
    this.verbGain.connect(this.verb);
    this.verb.connect(this.ctx.destination);
    this.ready = true;
  }

  resume() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  /* A struck-string approximation: a small stack of slightly inharmonic
     partials, a noise transient for the hammer, and a decay that shortens
     as you go up the keyboard, the way a real piano behaves. */
  noteOn(midi, velocity = 0.8) {
    this.resume();
    this.sustained.delete(midi);
    if (this.voices.has(midi)) this.release(midi, true);

    const t = this.ctx.currentTime;
    const hz = midiToHz(midi);
    const bright = Math.min(1, Math.max(0.2, 1 - (midi - 36) / 70));
    const decay = 1.6 + bright * 6.5;

    const out = this.ctx.createGain();
    out.gain.value = 0;
    const tone = this.ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 1400 + velocity * 5200 * bright;
    tone.Q.value = 0.6;
    tone.connect(out);
    out.connect(this.master);

    const partials = [
      [1, 1.0], [2, 0.40], [3, 0.19], [4, 0.11], [5, 0.06], [6, 0.035], [8, 0.018]
    ];
    const oscs = [];
    partials.forEach(([mult, amp]) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      // slight stretch tuning, which is what gives a piano its shimmer
      o.frequency.value = hz * mult * (1 + 0.00045 * mult * mult);
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp * velocity * 0.28, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay / (1 + mult * 0.34));
      o.connect(g); g.connect(tone);
      o.start(t);
      oscs.push([o, g]);
    });

    const nlen = Math.floor(this.ctx.sampleRate * 0.03);
    const nbuf = this.ctx.createBuffer(1, nlen, this.ctx.sampleRate);
    const nd = nbuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nlen, 5);
    const nsrc = this.ctx.createBufferSource();
    nsrc.buffer = nbuf;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = hz * 3.2;
    nf.Q.value = 0.9;
    const ng = this.ctx.createGain();
    ng.gain.value = velocity * 0.09;
    nsrc.connect(nf); nf.connect(ng); ng.connect(tone);
    nsrc.start(t);

    out.gain.setValueAtTime(1, t);
    this.voices.set(midi, { out, oscs, stop: t + decay });

    setTimeout(() => {
      const v = this.voices.get(midi);
      if (v && v.stop <= this.ctx.currentTime && !this.sustained.has(midi)) this.kill(midi);
    }, (decay + 0.2) * 1000);
  }

  /* Lifting a key while the pedal is down does not stop the string. */
  noteOff(midi) {
    if (this.sustain && this.voices.has(midi)) { this.sustained.add(midi); return; }
    this.release(midi);
  }

  release(midi, immediate = false) {
    const v = this.voices.get(midi);
    if (!v) return;
    const t = this.ctx.currentTime;
    const rel = immediate ? 0.02 : 0.28;
    try {
      v.out.gain.cancelScheduledValues(t);
      v.out.gain.setValueAtTime(v.out.gain.value, t);
      v.out.gain.exponentialRampToValueAtTime(0.0001, t + rel);
    } catch (e) { /* voice already finished */ }
    setTimeout(() => this.kill(midi), (rel + 0.05) * 1000);
  }

  setSustain(on) {
    this.sustain = !!on;
    if (!on) {
      [...this.sustained].forEach(m => this.release(m));
      this.sustained.clear();
    }
  }

  kill(midi) {
    const v = this.voices.get(midi);
    if (!v) return;
    v.oscs.forEach(([o]) => { try { o.stop(); } catch (e) {} });
    try { v.out.disconnect(); } catch (e) {}
    this.voices.delete(midi);
    this.sustained.delete(midi);
  }

  allOff() {
    this.sustained.clear();
    [...this.voices.keys()].forEach(m => this.kill(m));
  }

  click(accent) {
    this.resume();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1600 : 1050;
    g.gain.setValueAtTime(accent ? 0.11 : 0.075, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.06);
  }
}

/* Monophonic pitch detection for acoustic pianos.
   Autocorrelation over a 2048 sample window. Honestly approximate: it
   follows one note at a time and will not read chords or fast runs. */
class PitchDetector {
  constructor(audioCtx, onNote, onSilence) {
    this.ctx = audioCtx;
    this.onNote = onNote;
    this.onSilence = onSilence;
    this.running = false;
    this.current = null;
    this.pending = null;
    this.stable = 0;
    this.buf = new Float32Array(2048);
  }

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    this.stream = stream;
    this.src = this.ctx.createMediaStreamSource(stream);
    this.hp = this.ctx.createBiquadFilter();
    this.hp.type = 'highpass';
    this.hp.frequency.value = 60;
    this.an = this.ctx.createAnalyser();
    this.an.fftSize = 2048;
    this.src.connect(this.hp);
    this.hp.connect(this.an);
    this.running = true;
    this.loop();
    return true;
  }

  stop() {
    this.running = false;
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.src) { try { this.src.disconnect(); } catch (e) {} }
    this.current = null;
  }

  loop() {
    if (!this.running) return;
    this.an.getFloatTimeDomainData(this.buf);
    const f = this.detect(this.buf, this.ctx.sampleRate);
    if (f > 0) {
      const midi = Math.round(hzToMidi(f));
      if (midi === this.pending) this.stable++;
      else { this.pending = midi; this.stable = 1; }
      if (this.stable === 2 && midi !== this.current && midi >= 24 && midi <= 96) {
        if (this.current !== null) this.onSilence(this.current);
        this.current = midi;
        this.onNote(midi);
      }
    } else if (this.current !== null) {
      this.onSilence(this.current);
      this.current = null;
      this.stable = 0;
    }
    requestAnimationFrame(() => this.loop());
  }

  detect(buf, rate) {
    const n = buf.length;
    let rms = 0;
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / n);
    if (rms < 0.012) return -1;

    let r1 = 0, r2 = n - 1;
    const thr = 0.2;
    for (let i = 0; i < n / 2; i++) if (Math.abs(buf[i]) < thr) { r1 = i; break; }
    for (let i = 1; i < n / 2; i++) if (Math.abs(buf[n - i]) < thr) { r2 = n - i; break; }
    const b = buf.slice(r1, r2);
    const m = b.length;
    if (m < 256) return -1;
    const c = new Float32Array(m).fill(0);
    for (let lag = 0; lag < m; lag++) {
      for (let i = 0; i < m - lag; i++) c[lag] += b[i] * b[i + lag];
    }
    let d = 0;
    while (d < m - 1 && c[d] > c[d + 1]) d++;
    let max = -1, pos = -1;
    for (let i = d; i < m; i++) if (c[i] > max) { max = c[i]; pos = i; }
    if (pos <= 0 || max / (c[0] || 1) < 0.32) return -1;

    const x1 = c[pos - 1] || 0, x2 = c[pos], x3 = c[pos + 1] || 0;
    const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
    const peak = a ? pos - bb / (2 * a) : pos;
    return peak > 0 ? rate / peak : -1;
  }
}

/* Builds a proportionally correct keybed into a container element.
   Returns { keys: Map(midi -> HTMLElement), whiteWidth, xOf, whites }  */
function buildKeybed(container, lowMidi, highMidi, opts = {}) {
  container.innerHTML = '';
  const keys = new Map();
  const whites = [];
  for (let m = lowMidi; m <= highMidi; m++) if (!isBlack(m)) whites.push(m);
  const w = 100 / whites.length;

  whites.forEach((m, i) => {
    const el = document.createElement('div');
    el.className = 'wkey';
    el.style.left = (i * w) + '%';
    el.style.width = w + '%';
    el.dataset.midi = m;
    el.setAttribute('aria-hidden', 'true');
    if (opts.labels) {
      const lab = document.createElement('span');
      lab.className = 'kn';
      lab.textContent = pitchClass(m);
      el.appendChild(lab);
    }
    if (m === 60 && opts.markC) el.classList.add('middle-c');
    container.appendChild(el);
    keys.set(m, el);
  });

  let wi = 0;
  for (let m = lowMidi; m <= highMidi; m++) {
    if (!isBlack(m)) { wi++; continue; }
    const el = document.createElement('div');
    el.className = 'bkey';
    el.style.left = (wi * w - w * 0.31) + '%';
    el.style.width = (w * 0.62) + '%';
    el.dataset.midi = m;
    el.setAttribute('aria-hidden', 'true');
    if (opts.labels) {
      const lab = document.createElement('span');
      lab.className = 'kn';
      lab.textContent = pitchClass(m);
      el.appendChild(lab);
    }
    container.appendChild(el);
    keys.set(m, el);
  }

  const xOf = midi => {
    let idx = 0;
    for (let m = lowMidi; m < midi; m++) if (!isBlack(m)) idx++;
    return isBlack(midi) ? (idx * w) : (idx * w + w / 2);
  };

  return { keys, whiteWidth: w, xOf, whites, low: lowMidi, high: highMidi };
}

/* Shared local store. Everything here stays in the visitor's own browser. */
const LPK = {
  KEY: 'lpk.store.v1',
  load() { try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { return {}; } },
  save(s) { try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch (e) {} },
  clear() { try { localStorage.removeItem(this.KEY); } catch (e) {} },
  today() { return new Date().toISOString().slice(0, 10); },
  dayKey(offset) {
    const d = new Date(); d.setDate(d.getDate() - (offset || 0));
    return d.toISOString().slice(0, 10);
  },
  /* Marks today as practised and rolls the streak. Safe to call repeatedly. */
  markDay() {
    const s = this.load();
    if (s.lastDay === this.today()) return s;
    s.streak = (s.lastDay === this.dayKey(1)) ? (s.streak || 0) + 1 : 1;
    s.lastDay = this.today();
    this.save(s);
    return s;
  },
  addMinutes(mins) {
    return this.addSeconds(Math.round(mins * 60));
  },
  /* Seconds are the canonical unit from V14 on. Days recorded before V14
     live in the old minutes map and are still counted, never migrated. */
  addSeconds(sec) {
    if (!(sec > 0)) return this.load();
    const s = this.load();
    s.sec = s.sec || {};
    s.sec[this.today()] = (s.sec[this.today()] || 0) + Math.round(sec);
    s.totalSec = (s.totalSec || 0) + Math.round(sec);
    this.save(s);
    this.markDay();
    return this.load();
  },
  secOn(day) {
    const s = this.load();
    return ((s.sec || {})[day] || 0) + (((s.minutes || {})[day] || 0) * 60);
  },
  totalSeconds() {
    const s = this.load();
    return (s.totalSec || 0) + ((s.totalMinutes || 0) * 60);
  },
  practiceDays() {
    const s = this.load();
    const set = {};
    Object.keys(s.minutes || {}).forEach(k => { set[k] = 1; });
    Object.keys(s.sec || {}).forEach(k => { set[k] = 1; });
    return Object.keys(set).sort();
  },
  fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60), r = sec % 60;
    if (!m) return r + ' sec';
    if (!r) return m + ' min';
    return m + ' min ' + r + ' sec';
  },
  streak() { const s = this.load(); return s.lastDay === this.today() || s.lastDay === this.dayKey(1) ? (s.streak || 0) : 0; }
};

/* Chord and scale theory, computed rather than looked up, so the same
   engine can generate any root in any key. */
const CHORDS = {
  major: [0, 4, 7], minor: [0, 3, 7], diminished: [0, 3, 6], augmented: [0, 4, 8],
  sus2: [0, 2, 7], sus4: [0, 5, 7], 'major 7th': [0, 4, 7, 11], 'minor 7th': [0, 3, 7, 10],
  'dominant 7th': [0, 4, 7, 10], 'major 6th': [0, 4, 7, 9], 'minor 6th': [0, 3, 7, 9],
  'half-diminished 7th': [0, 3, 6, 10], 'diminished 7th': [0, 3, 6, 9], 'add 9': [0, 4, 7, 14]
};
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  'natural minor': [0, 2, 3, 5, 7, 8, 10, 12],
  'harmonic minor': [0, 2, 3, 5, 7, 8, 11, 12],
  'melodic minor': [0, 2, 3, 5, 7, 9, 11, 12],
  'major pentatonic': [0, 2, 4, 7, 9, 12],
  'minor pentatonic': [0, 3, 5, 7, 10, 12],
  blues: [0, 3, 5, 6, 7, 10, 12],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};
