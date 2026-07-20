/* Learn Piano Keys - reading the stave.
   A self-contained stave renderer plus the note trainer, so nothing in the
   practice room had to change to add this. */

(function () {
  if (!document.getElementById('trainerStave')) return;

  const audio = new PianoAudio();

  /* ---------------- stave rendering ---------------- */
  const STEP = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const PC_TO_STEP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const SHARP = [1, 3, 6, 8, 10];

  function diatonic(midi) {
    const pc = ((midi % 12) + 12) % 12;
    return (Math.floor(midi / 12) - 1) * 7 + PC_TO_STEP[pc];
  }
  const isSharp = m => SHARP.includes(((m % 12) + 12) % 12);
  const letterOf = m => STEP[PC_TO_STEP[((m % 12) + 12) % 12]];

  function trebleClef(c, x, y, gap) {
    const s = gap / 9;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = c.fillStyle; c.lineWidth = 2.1; c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= 70; i++) {
      const t = i / 70, a = t * Math.PI * 3.1 + Math.PI, r = 10.5 * (1 - t * 0.9);
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
    c.beginPath();
    c.moveTo(-10.5, 0);
    c.bezierCurveTo(-14, -20, 7, -28, 5.5, -39);
    c.bezierCurveTo(4, -49, -5.5, -47, -4, -35);
    c.bezierCurveTo(-2.5, -22, 5.5, -6, 4, 15);
    c.bezierCurveTo(3, 28, -9, 30, -10, 22);
    c.stroke();
    c.restore();
  }

  function bassClef(c, x, y, gap) {
    const s = gap / 9;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = c.fillStyle;
    c.lineWidth = 2.4; c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, 4.2, -Math.PI * 0.95, Math.PI * 0.30);
    c.bezierCurveTo(3.2, 8, -2, 14, -8, 17);
    c.stroke();
    c.beginPath(); c.arc(8.5, -4.5, 1.5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(8.5, 4.5, 1.5, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  /* One routine draws every stave on the page.
     opts: { clef: 'treble'|'bass'|'grand', notes: [{midi,label,tone}], gap } */
  function drawStave(cv, opts) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!w || !h) return;

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ivory').trim() || '#F4EDE2';
    const dim = css.getPropertyValue('--ivory-3').trim() || '#6F655C';
    const brass = css.getPropertyValue('--brass').trim() || '#D4A343';
    const good = css.getPropertyValue('--good').trim() || '#7FA86F';
    const felt = css.getPropertyValue('--felt').trim() || '#9E3B45';

    const gap = opts.gap || 11;
    const grand = opts.clef === 'grand';
    const padL = 58, padR = 18;
    const trebleBottom = grand ? gap * 5.4 : (h / 2 + gap * 2);
    const bassBottom = trebleBottom + gap * 8.6;

    ctx.strokeStyle = dim; ctx.lineWidth = 1;
    const staves = [];
    if (opts.clef === 'treble' || grand) staves.push(['treble', trebleBottom]);
    if (opts.clef === 'bass' || grand) staves.push(['bass', grand ? bassBottom : trebleBottom]);

    staves.forEach(([, base]) => {
      for (let i = 0; i < 5; i++) {
        const y = base - i * gap;
        ctx.beginPath(); ctx.moveTo(padL, y + .5); ctx.lineTo(w - padR, y + .5); ctx.stroke();
      }
    });

    ctx.fillStyle = ink;
    staves.forEach(([kind, base]) => {
      if (kind === 'treble') trebleClef(ctx, padL + 20, base - gap, gap);
      else bassClef(ctx, padL + 18, base - 3 * gap, gap);
    });

    const notes = opts.notes || [];
    const usable = w - padL - padR - 62;
    notes.forEach((n, i) => {
      const x = padL + 62 + (notes.length === 1 ? usable / 2 : (i / Math.max(1, notes.length - 1)) * usable * 0.94);
      const onBass = grand ? n.midi < 60 : opts.clef === 'bass';
      const base = onBass ? (grand ? bassBottom : trebleBottom) : trebleBottom;
      const ref = onBass ? diatonic(43) : diatonic(64);
      const y = base - (diatonic(n.midi) - ref) * (gap / 2);

      ctx.strokeStyle = dim; ctx.lineWidth = 1;
      for (let ly = base + gap; ly <= y + 0.1; ly += gap) {
        ctx.beginPath(); ctx.moveTo(x - 11, ly + .5); ctx.lineTo(x + 11, ly + .5); ctx.stroke();
      }
      for (let ly = base - 5 * gap; ly >= y - 0.1; ly -= gap) {
        ctx.beginPath(); ctx.moveTo(x - 11, ly + .5); ctx.lineTo(x + 11, ly + .5); ctx.stroke();
      }

      const colour = n.tone === 'good' ? good : n.tone === 'bad' ? felt : n.tone === 'key' ? brass : ink;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(-0.32);
      ctx.beginPath();
      ctx.ellipse(0, 0, gap * 0.62, gap * 0.46, 0, 0, Math.PI * 2);
      ctx.fillStyle = colour; ctx.fill();
      ctx.restore();

      ctx.strokeStyle = colour; ctx.lineWidth = 1.5;
      const up = y > base - 2 * gap;
      ctx.beginPath();
      ctx.moveTo(x + (up ? gap * 0.58 : -gap * 0.58), y);
      ctx.lineTo(x + (up ? gap * 0.58 : -gap * 0.58), y + (up ? -gap * 2.9 : gap * 2.9));
      ctx.stroke();

      if (isSharp(n.midi)) {
        ctx.fillStyle = colour;
        ctx.font = `${Math.round(gap * 1.6)}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'right';
        ctx.fillText('\u266F', x - gap * 1.1, y + gap * 0.55);
      }
      if (n.label) {
        ctx.fillStyle = n.tone === 'key' ? brass : dim;
        ctx.font = `600 ${Math.round(gap * 1.05)}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label, x, (grand ? bassBottom : trebleBottom) + gap * 2.6);
      }
    });
  }

  /* ---------------- the teaching diagrams ---------------- */
  const DIAGRAMS = [
    ['anatomyStave', { clef: 'grand', gap: 11, notes: [{ midi: 60, label: 'middle C', tone: 'key' }] }],
    ['trebleLinesStave', { clef: 'treble', gap: 12, notes:
      [64, 67, 71, 74, 77].map(m => ({ midi: m, label: letterOf(m) })) }],
    ['trebleSpacesStave', { clef: 'treble', gap: 12, notes:
      [65, 69, 72, 76].map(m => ({ midi: m, label: letterOf(m) })) }],
    ['bassLinesStave', { clef: 'bass', gap: 12, notes:
      [43, 47, 50, 53, 57].map(m => ({ midi: m, label: letterOf(m) })) }],
    ['bassSpacesStave', { clef: 'bass', gap: 12, notes:
      [45, 48, 52, 55].map(m => ({ midi: m, label: letterOf(m) })) }],
    ['ledgerStave', { clef: 'grand', gap: 11, notes:
      [{ midi: 60, label: 'C4', tone: 'key' }, { midi: 57, label: 'A3' }, { midi: 64, label: 'E4' }, { midi: 81, label: 'A5' }] }]
  ];

  function drawAll() {
    DIAGRAMS.forEach(([id, opts]) => {
      const cv = document.getElementById(id);
      if (cv) drawStave(cv, opts);
    });
    drawTrainer();
  }

  /* let people hear any diagram */
  document.querySelectorAll('[data-hear]').forEach(btn => {
    btn.addEventListener('click', () => {
      audio.resume();
      const list = btn.dataset.hear.split(',').map(Number);
      list.forEach((m, i) => setTimeout(() => {
        audio.noteOn(m, 0.7);
        setTimeout(() => audio.noteOff(m), 380);
      }, i * 430));
    });
  });

  /* ---------------- the note trainer ---------------- */
  const stave = document.getElementById('trainerStave');
  const kbHost = document.getElementById('trainerKeys');
  const askEl = document.getElementById('trainerAsk');
  const fbEl = document.getElementById('trainerFeedback');
  const scoreEl = document.getElementById('trainerScore');
  const bestEl = document.getElementById('trainerBest');
  const startBtn = document.getElementById('trainerStart');
  const clefSel = document.getElementById('trainerClef');
  const accSel = document.getElementById('trainerAcc');
  const namesBtn = document.getElementById('trainerNames');

  let kb = null, running = false, want = null, run = 0, showNames = true;

  function range() {
    if (clefSel.value === 'treble') return [60, 81];
    if (clefSel.value === 'bass') return [40, 60];
    return [40, 81];
  }

  function buildTrainerKeys() {
    const r = range();
    const low = Math.max(36, r[0] - 2), high = Math.min(84, r[1] + 2);
    kb = buildKeybed(kbHost, low, high, { labels: showNames, markC: true });
  }

  function pick() {
    const [lo, hi] = range();
    const pool = [];
    for (let m = lo; m <= hi; m++) {
      if (accSel.value === 'natural' && isSharp(m)) continue;
      pool.push(m);
    }
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (next === want && pool.length > 1) next = pool[(pool.indexOf(next) + 1) % pool.length];
    want = next;
    askEl.textContent = 'Play this note';
    drawTrainer();
  }

  function drawTrainer() {
    if (!stave) return;
    drawStave(stave, {
      clef: clefSel.value === 'both' ? 'grand' : clefSel.value,
      gap: 13,
      notes: want === null ? [] : [{ midi: want, tone: 'key' }]
    });
  }

  function answer(midi) {
    if (!running || want === null) return;
    if (midi === want) {
      run++;
      scoreEl.textContent = run;
      fbEl.textContent = 'Correct. That is ' + letterOf(want) + '.';
      fbEl.className = 'step-feedback ok';
      const s = LPK.load();
      if (run > (s.readBest || 0)) { s.readBest = run; LPK.save(s); bestEl.textContent = run; }
      s.readTotal = (s.readTotal || 0) + 1;
      LPK.save(s);
      LPK.markDay();
      setTimeout(pick, 450);
    } else {
      fbEl.textContent = 'That was ' + letterOf(midi) + '. The note on the stave is ' + letterOf(want) + '.';
      fbEl.className = 'step-feedback no';
      run = 0;
      scoreEl.textContent = 0;
    }
  }

  kbHost.addEventListener('pointerdown', e => {
    const m = e.target.dataset && e.target.dataset.midi;
    if (!m) return;
    e.preventDefault();
    const midi = +m;
    audio.noteOn(midi, 0.8);
    const k = kb.keys.get(midi);
    if (k) k.classList.add('on', 'rh');
    setTimeout(() => { audio.noteOff(midi); if (k) k.classList.remove('on', 'rh'); }, 320);
    answer(midi);
  });

  const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12 };
  let octave = 60;
  addEventListener('keydown', e => {
    if (e.repeat || e.metaKey || e.ctrlKey) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const key = e.key.toLowerCase();
    if (key === 'z') { octave = Math.max(36, octave - 12); return; }
    if (key === 'x') { octave = Math.min(72, octave + 12); return; }
    if (!(key in KEYMAP)) return;
    e.preventDefault();
    const midi = octave + KEYMAP[key];
    audio.noteOn(midi, 0.8);
    const k = kb && kb.keys.get(midi);
    if (k) k.classList.add('on', 'rh');
    setTimeout(() => { audio.noteOff(midi); if (k) k.classList.remove('on', 'rh'); }, 320);
    answer(midi);
  });

  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(access => {
      const attach = () => {
        Array.from(access.inputs.values()).forEach(i => {
          i.onmidimessage = ev => {
            const cmd = ev.data[0] & 0xf0;
            if (cmd === 0x90 && ev.data[2] > 0) {
              const midi = ev.data[1];
              const k = kb && kb.keys.get(midi);
              if (k) { k.classList.add('on', 'rh'); setTimeout(() => k.classList.remove('on', 'rh'), 320); }
              audio.noteOn(midi, ev.data[2] / 127);
              setTimeout(() => audio.noteOff(midi), 320);
              answer(midi);
            }
          };
        });
        const badge = document.getElementById('trainerMidi');
        if (badge) {
          const n = Array.from(access.inputs.values()).length;
          badge.textContent = n ? 'MIDI: ' + Array.from(access.inputs.values())[0].name : 'MIDI ready. Plug in a keyboard';
          badge.className = n ? 'badge ok' : 'badge';
        }
      };
      access.onstatechange = attach; attach();
    }).catch(() => {});
  } else {
    const badge = document.getElementById('trainerMidi');
    if (badge) { badge.textContent = 'No MIDI in this browser'; badge.className = 'badge warn'; }
  }

  startBtn.addEventListener('click', () => {
    audio.resume();
    running = true; run = 0;
    scoreEl.textContent = 0;
    startBtn.textContent = 'Restart';
    fbEl.textContent = 'Find the note on the keyboard and play it.';
    fbEl.className = 'step-feedback';
    pick();
  });

  clefSel.addEventListener('change', () => { buildTrainerKeys(); if (running) pick(); else drawTrainer(); });
  accSel.addEventListener('change', () => { if (running) pick(); });
  namesBtn.addEventListener('click', () => {
    showNames = !showNames;
    namesBtn.classList.toggle('active', showNames);
    namesBtn.setAttribute('aria-pressed', String(showNames));
    namesBtn.textContent = showNames ? 'Note names on' : 'Note names off';
    buildTrainerKeys();
  });

  bestEl.textContent = LPK.load().readBest || 0;
  buildTrainerKeys();
  drawAll();
  window.addEventListener('resize', drawAll);
})();
