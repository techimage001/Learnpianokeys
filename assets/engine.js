/* Learn Piano Keys - audio + keybed engine
   All sound is synthesised in the browser with the Web Audio API.
   No sample libraries, no external services, no API keys. */

const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const isBlack = m => [1,3,6,8,10].includes(((m % 12) + 12) % 12);
const noteName = (m, flats) => (flats ? FLAT_NAMES : NOTE_NAMES)[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
const pitchClass = m => NOTE_NAMES[((m % 12) + 12) % 12];
const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12);

class PianoAudio {
  constructor() {
    this.ctx = null;
    this.voices = new Map();
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
    if (this.voices.has(midi)) this.noteOff(midi, true);

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

    // hammer transient
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

    // reclaim
    setTimeout(() => {
      const v = this.voices.get(midi);
      if (v && v.stop <= this.ctx.currentTime) this.kill(midi);
    }, (decay + 0.2) * 1000);
  }

  noteOff(midi, immediate = false) {
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

  kill(midi) {
    const v = this.voices.get(midi);
    if (!v) return;
    v.oscs.forEach(([o]) => { try { o.stop(); } catch (e) {} });
    try { v.out.disconnect(); } catch (e) {}
    this.voices.delete(midi);
  }

  allOff() { [...this.voices.keys()].forEach(m => this.kill(m)); }

  click(accent) {
    this.resume();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1600 : 1050;
    g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.06);
  }
}

/* Builds a proportionally correct keybed into a container element.
   Returns { keys: Map(midi -> HTMLElement), whiteWidth, xOf(midi) }      */
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
    if (opts.labels) {
      const lab = document.createElement('span');
      lab.className = 'kn';
      lab.textContent = pitchClass(m) + (m === 60 && opts.markC ? '' : '');
      el.appendChild(lab);
    }
    if (m === 60 && opts.markC) el.style.boxShadow = 'inset 0 -6px 8px -6px rgba(0,0,0,.35), inset 0 0 0 2px rgba(212,163,67,.5)';
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
    container.appendChild(el);
    keys.set(m, el);
  }

  const xOf = midi => {
    let idx = 0;
    for (let m = lowMidi; m < midi; m++) if (!isBlack(m)) idx++;
    return isBlack(midi) ? (idx * w - w * 0.31 + w * 0.31) : (idx * w + w / 2);
  };

  return { keys, whiteWidth: w, xOf, whites };
}
