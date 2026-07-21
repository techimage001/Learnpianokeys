/* Learn Piano Keys - the standalone tools.
   One script, driven by data-tool on the page, so every tool page carries a
   working instrument rather than a link to one. */

(function () {
  const host = document.querySelector('[data-tool]');
  const guideKeys = document.getElementById('guideKeys');
  if (!host && !guideKeys) return;
  if (typeof PianoAudio === 'undefined') return;

  const audio = new PianoAudio();
  const el = id => document.getElementById(id);
  const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FINGERS = { 60: 1, 62: 2, 64: 3, 65: 4, 67: 5 };

  function play(midis, together, gap) {
    audio.resume();
    if (together) {
      midis.forEach(m => audio.noteOn(m, 0.7));
      setTimeout(() => midis.forEach(m => audio.noteOff(m)), 1500);
      return;
    }
    midis.forEach((m, i) => setTimeout(() => {
      audio.noteOn(m, 0.7);
      setTimeout(() => audio.noteOff(m), 320);
    }, i * (gap || 270)));
  }
  function light(kb, midis) {
    kb.keys.forEach(k => k.classList.remove('lit'));
    midis.forEach(m => { const k = kb.keys.get(m); if (k) k.classList.add('lit'); });
  }
  function fill(sel, items, selected) {
    items.forEach(t => {
      const o = document.createElement('option');
      o.value = t; o.textContent = t;
      sel.appendChild(o);
    });
    if (selected) sel.value = selected;
  }
  function playable(kb, hostEl, readout) {
    hostEl.addEventListener('pointerdown', e => {
      const m = e.target.dataset && e.target.dataset.midi;
      if (!m) return;
      e.preventDefault();
      const midi = +m;
      audio.noteOn(midi, 0.8);
      const k = kb.keys.get(midi);
      if (k) k.classList.add('on', 'rh');
      if (readout) readout.textContent = noteName(midi);
      setTimeout(() => { audio.noteOff(midi); if (k) k.classList.remove('on', 'rh'); }, 340);
    });
  }
  const KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12 };
  function computerKeys(kb, onPlay) {
    let oct = 60;
    addEventListener('keydown', e => {
      if (e.repeat || e.metaKey || e.ctrlKey) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'z') { oct = Math.max(36, oct - 12); return; }
      if (k === 'x') { oct = Math.min(72, oct + 12); return; }
      if (!(k in KEYMAP)) return;
      e.preventDefault();
      const midi = oct + KEYMAP[k];
      if (!kb.keys.has(midi)) return;
      audio.noteOn(midi, 0.8);
      const el2 = kb.keys.get(midi);
      if (el2) el2.classList.add('on', 'rh');
      setTimeout(() => { audio.noteOff(midi); if (el2) el2.classList.remove('on', 'rh'); }, 340);
      if (onPlay) onPlay(midi);
    });
  }
  function midiIn(onNote, badgeId) {
    const badge = el(badgeId);
    if (!navigator.requestMIDIAccess) {
      if (badge) { badge.textContent = 'No MIDI in this browser'; badge.className = 'badge warn'; }
      return;
    }
    navigator.requestMIDIAccess().then(access => {
      const attach = () => {
        const ins = Array.from(access.inputs.values());
        ins.forEach(i => {
          i.onmidimessage = e => {
            if ((e.data[0] & 0xf0) === 0x90 && e.data[2] > 0) onNote(e.data[1]);
          };
        });
        if (badge) {
          badge.textContent = ins.length ? 'MIDI: ' + ins[0].name : 'MIDI ready. Plug in a keyboard';
          badge.className = ins.length ? 'badge ok' : 'badge';
        }
      };
      access.onstatechange = attach; attach();
    }).catch(() => {
      if (badge) { badge.textContent = 'MIDI blocked'; badge.className = 'badge warn'; }
    });
  }

  /* ---- the playable keyboard on every guide page ---- */
  if (guideKeys) {
    const low = +guideKeys.dataset.low || 48, high = +guideKeys.dataset.high || 72;
    const kb = buildKeybed(guideKeys, low, high, { labels: true, markC: true });
    if (guideKeys.dataset.fingers) {
      kb.keys.forEach((k, m) => {
        if (FINGERS[m]) {
          const s = document.createElement('span');
          s.className = 'kf'; s.textContent = FINGERS[m];
          k.appendChild(s);
        }
      });
    }
    playable(kb, guideKeys, el('guideNote'));
    computerKeys(kb);
  }

  if (!host) return;
  const kind = host.dataset.tool;

  /* ---- chord finder ---- */
  if (kind === 'chord') {
    const kb = buildKeybed(el('tkKeys'), 60, 84, { labels: true, markC: true });
    fill(el('tkRoot'), ROOTS, 'C');
    fill(el('tkType'), Object.keys(CHORDS), 'major');
    const why = {
      major: 'Root, four semitones, then three. The bright, settled sound.',
      minor: 'The same shape with the middle note one semitone lower.',
      diminished: 'Two minor thirds stacked. Tense and unstable.',
      augmented: 'Two major thirds stacked. Strange and suspended.'
    };
    function draw(playIt) {
      const root = 60 + ROOTS.indexOf(el('tkRoot').value);
      const midis = CHORDS[el('tkType').value].map(i => root + i);
      light(kb, midis);
      el('tkName').textContent = el('tkRoot').value + ' ' + el('tkType').value;
      el('tkNotes').textContent = midis.map(m => pitchClass(m)).join(' \u00b7 ');
      el('tkWhy').textContent = (why[el('tkType').value] || '') + ' Right hand: thumb, middle finger, little finger.';
      if (playIt) play(midis, true);
    }
    ['tkRoot', 'tkType'].forEach(id => el(id).addEventListener('change', () => draw(false)));
    el('tkPlay').addEventListener('click', () => draw(true));
    playable(kb, el('tkKeys'));
    draw(false);
  }

  /* ---- scale finder ---- */
  if (kind === 'scale') {
    const kb = buildKeybed(el('tkKeys'), 60, 84, { labels: true, markC: true });
    fill(el('tkRoot'), ROOTS, 'C');
    fill(el('tkType'), Object.keys(SCALES), 'major');
    function draw(playIt) {
      const root = 60 + ROOTS.indexOf(el('tkRoot').value);
      const midis = SCALES[el('tkType').value].map(i => root + i);
      light(kb, midis);
      el('tkName').textContent = el('tkRoot').value + ' ' + el('tkType').value;
      el('tkNotes').textContent = midis.map(m => pitchClass(m)).join(' \u00b7 ');
      el('tkWhy').textContent = 'Start with the right thumb on the lowest note and tuck it under after the third.';
      if (playIt) play(midis, false);
    }
    ['tkRoot', 'tkType'].forEach(id => el(id).addEventListener('change', () => draw(false)));
    el('tkPlay').addEventListener('click', () => draw(true));
    playable(kb, el('tkKeys'));
    draw(false);
  }

  /* ---- chord identifier: the reverse lookup ---- */
  if (kind === 'identify') {
    const kb = buildKeybed(el('tkKeys'), 48, 84, { labels: true, markC: true });
    let held = [];
    function identify() {
      el('tkNotes').textContent = held.length ? held.map(m => noteName(m)).join(' \u00b7 ') : 'Nothing held yet';
      if (held.length < 2) { el('tkName').textContent = 'Play three or more notes'; return; }
      if (held.length === 2) {
        const gap = Math.abs(held[1] - held[0]) % 12;
        const names = { 1: 'minor 2nd', 2: 'major 2nd', 3: 'minor 3rd', 4: 'major 3rd', 5: 'perfect 4th',
          6: 'tritone', 7: 'perfect 5th', 8: 'minor 6th', 9: 'major 6th', 10: 'minor 7th', 11: 'major 7th', 0: 'octave' };
        el('tkName').textContent = 'Two notes: a ' + names[gap] + ', not yet a chord';
        return;
      }
      const pcs = [...new Set(held.map(m => ((m % 12) + 12) % 12))].sort((a, b) => a - b);
      let found = null;
      pcs.forEach(root => {
        const rel = pcs.map(p => ((p - root) + 12) % 12).sort((a, b) => a - b);
        Object.keys(CHORDS).forEach(name => {
          const want = [...new Set(CHORDS[name].map(i => i % 12))].sort((a, b) => a - b);
          if (want.length === rel.length && want.every((v, i) => v === rel[i]) && !found) {
            found = ROOTS[root] + ' ' + name;
          }
        });
      });
      el('tkName').textContent = found || 'Not a standard chord. Try three notes from one scale.';
    }
    function toggle(midi) {
      const i = held.indexOf(midi);
      if (i > -1) held.splice(i, 1); else held.push(midi);
      held.sort((a, b) => a - b);
      light(kb, held);
      audio.resume(); audio.noteOn(midi, 0.7);
      setTimeout(() => audio.noteOff(midi), 400);
      identify();
    }
    el('tkKeys').addEventListener('pointerdown', e => {
      const m = e.target.dataset && e.target.dataset.midi;
      if (!m) return;
      e.preventDefault(); toggle(+m);
    });
    el('tkClear').addEventListener('click', () => { held = []; light(kb, []); identify(); });
    midiIn(toggle, 'tkMidi');
    identify();
  }

  /* ---- metronome ---- */
  if (kind === 'metro') {
    let timer = null, beat = 0, taps = [];
    function lights() {
      el('tkLights').innerHTML = '';
      for (let i = 0; i < +el('tkBeats').value; i++) el('tkLights').appendChild(document.createElement('i'));
    }
    function tick() {
      const n = +el('tkBeats').value;
      [...el('tkLights').children].forEach((x, i) => {
        x.classList.toggle('on', i === beat % n);
        x.classList.toggle('accent', i === 0 && beat % n === 0);
      });
      audio.click(beat % n === 0);
      beat++;
    }
    function run() { clearInterval(timer); timer = setInterval(tick, 60000 / +el('tkRange').value); }
    el('tkRange').addEventListener('input', () => { el('tkBpm').textContent = el('tkRange').value; if (timer) run(); });
    el('tkBeats').addEventListener('change', () => { beat = 0; lights(); });
    el('tkStart').addEventListener('click', () => {
      if (timer) {
        clearInterval(timer); timer = null; beat = 0;
        el('tkStart').textContent = 'Start';
        [...el('tkLights').children].forEach(x => x.classList.remove('on', 'accent'));
      } else { audio.resume(); beat = 0; tick(); run(); el('tkStart').textContent = 'Stop'; }
    });
    el('tkTap').addEventListener('click', () => {
      const now = performance.now();
      taps = taps.filter(t => now - t < 2600); taps.push(now);
      if (taps.length >= 2) {
        const gaps = taps.slice(1).map((t, i) => t - taps[i]);
        const bpm = Math.min(220, Math.max(30, Math.round(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length))));
        el('tkRange').value = bpm; el('tkBpm').textContent = bpm;
        if (timer) run();
      }
    });
    lights();
  }

  /* ---- tap tempo calculator ---- */
  if (kind === 'tap') {
    let taps = [];
    el('tkTap').addEventListener('click', () => {
      const now = performance.now();
      taps = taps.filter(t => now - t < 3000); taps.push(now);
      audio.click(false);
      if (taps.length < 2) { el('tkWhy').textContent = 'Keep tapping. At least four taps.'; return; }
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const bpm = Math.round(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
      el('tkBpm').textContent = bpm;
      el('tkWhy').textContent = taps.length + ' taps. ' +
        (taps.length < 4 ? 'Two more for a reliable figure.' : 'That is a steady reading.');
    });
    el('tkClear').addEventListener('click', () => {
      taps = []; el('tkBpm').textContent = '--';
      el('tkWhy').textContent = 'Tap at least four times. Eight or more gives a steadier reading.';
    });
  }

  /* ---- note name quiz ---- */
  if (kind === 'notequiz') {
    const kb = buildKeybed(el('tkKeys'), 60, 84, { labels: false, markC: true });
    let running = false, want = null, run = 0;
    el('tkBest').textContent = LPK.load().quizBest || 0;
    function next() {
      const pool = [];
      for (let m = 60; m <= 84; m++) {
        if (el('tkMode').value === 'white' && isBlack(m)) continue;
        pool.push(m);
      }
      want = pool[Math.floor(Math.random() * pool.length)];
      el('tkName').textContent = 'Click ' + noteName(want);
    }
    function answer(m) {
      if (!running) return;
      if (m === want) {
        run++; el('tkScore').textContent = run;
        const s = LPK.load();
        if (run > (s.quizBest || 0)) { s.quizBest = run; LPK.save(s); el('tkBest').textContent = run; }
        LPK.markDay();
        el('tkWhy').textContent = 'Correct.';
        next();
      } else {
        el('tkWhy').textContent = 'That was ' + noteName(m) + '. Run ended at ' + run + '.';
        run = 0; el('tkScore').textContent = 0; next();
      }
    }
    el('tkKeys').addEventListener('pointerdown', e => {
      const m = e.target.dataset && e.target.dataset.midi;
      if (!m) return;
      e.preventDefault();
      const midi = +m;
      audio.noteOn(midi, 0.75);
      const k = kb.keys.get(midi);
      if (k) k.classList.add('on', 'rh');
      setTimeout(() => { audio.noteOff(midi); if (k) k.classList.remove('on', 'rh'); }, 320);
      answer(midi);
    });
    el('tkStart').addEventListener('click', () => {
      audio.resume(); running = true; run = 0;
      el('tkScore').textContent = 0;
      el('tkStart').textContent = 'Restart';
      next();
    });
    el('tkMode').addEventListener('change', () => { if (running) next(); });
    midiIn(answer, 'tkMidi');
  }

  /* ---- sight reading trainer ---- */
  if (kind === 'sight') {
    const cv = el('tkStave');
    const kb = buildKeybed(el('tkKeys'), 48, 84, { labels: true, markC: true });
    let running = false, want = null, run = 0;
    el('tkBest').textContent = LPK.load().readBest || 0;
    const NAT = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const MAP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
    const dia = m => (Math.floor(m / 12) - 1) * 7 + MAP[((m % 12) + 12) % 12];

    function draw() {
      const ctx = cv.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth, h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (!w) return;
      const css = getComputedStyle(document.documentElement);
      const ink = css.getPropertyValue('--ivory-3').trim() || '#6F655C';
      const key = css.getPropertyValue('--brass').trim() || '#D4A343';
      const gap = 12, base = h / 2 + gap * 2;
      ctx.strokeStyle = ink; ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = base - i * gap;
        ctx.beginPath(); ctx.moveTo(30, y + .5); ctx.lineTo(w - 20, y + .5); ctx.stroke();
      }
      if (want === null) return;
      const bass = el('tkClef').value === 'bass' || (el('tkClef').value === 'both' && want < 60);
      const ref = bass ? dia(43) : dia(64);
      const y = base - (dia(want) - ref) * (gap / 2);
      const x = w / 2;
      ctx.strokeStyle = ink;
      for (let ly = base + gap; ly <= y + .1; ly += gap) { ctx.beginPath(); ctx.moveTo(x - 12, ly + .5); ctx.lineTo(x + 12, ly + .5); ctx.stroke(); }
      for (let ly = base - 5 * gap; ly >= y - .1; ly -= gap) { ctx.beginPath(); ctx.moveTo(x - 12, ly + .5); ctx.lineTo(x + 12, ly + .5); ctx.stroke(); }
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.32);
      ctx.beginPath(); ctx.ellipse(0, 0, gap * .62, gap * .46, 0, 0, Math.PI * 2);
      ctx.fillStyle = key; ctx.fill(); ctx.restore();
      ctx.fillStyle = ink; ctx.font = '12px "IBM Plex Mono", monospace'; ctx.textAlign = 'left';
      ctx.fillText(bass ? 'bass clef' : 'treble clef', 34, base + gap * 2.6);
    }
    function next() {
      const clef = el('tkClef').value;
      const lo = clef === 'bass' ? 43 : clef === 'both' ? 43 : 60;
      const hi = clef === 'bass' ? 60 : clef === 'both' ? 81 : 81;
      const pool = [];
      for (let m = lo; m <= hi; m++) if (!isBlack(m)) pool.push(m);
      want = pool[Math.floor(Math.random() * pool.length)];
      el('tkName').textContent = 'Play this note';
      draw();
    }
    function answer(m) {
      if (!running || want === null) return;
      if (m === want) {
        run++; el('tkScore').textContent = run;
        const s = LPK.load();
        if (run > (s.readBest || 0)) { s.readBest = run; LPK.save(s); el('tkBest').textContent = run; }
        LPK.markDay();
        el('tkWhy').textContent = 'Correct. That is ' + pitchClass(want) + '.';
        setTimeout(next, 400);
      } else {
        el('tkWhy').textContent = 'That was ' + pitchClass(m) + '. The note is ' + pitchClass(want) + '.';
        run = 0; el('tkScore').textContent = 0;
      }
    }
    el('tkKeys').addEventListener('pointerdown', e => {
      const m = e.target.dataset && e.target.dataset.midi;
      if (!m) return;
      e.preventDefault();
      const midi = +m;
      audio.noteOn(midi, 0.75);
      const k = kb.keys.get(midi);
      if (k) k.classList.add('on', 'rh');
      setTimeout(() => { audio.noteOff(midi); if (k) k.classList.remove('on', 'rh'); }, 320);
      answer(midi);
    });
    el('tkStart').addEventListener('click', () => {
      audio.resume(); running = true; run = 0;
      el('tkScore').textContent = 0; el('tkStart').textContent = 'Restart';
      next();
    });
    el('tkClef').addEventListener('change', () => { if (running) next(); else draw(); });
    midiIn(answer);
    addEventListener('resize', draw);
    draw();
  }

  /* ---- practice timer ---- */
  if (kind === 'timer') {
    let running = false, started = 0, elapsed = 0, tick = null;
    const fmt = ms => {
      const t = Math.floor(ms / 1000);
      return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    };
    const render = () => { el('tkClock').textContent = fmt(elapsed + (running ? performance.now() - started : 0)); };
    function stats() {
      const s = LPK.load();
      el('tkToday').textContent = (s.minutes || {})[LPK.today()] || 0;
      el('tkTotal').textContent = s.totalMinutes || 0;
      el('tkStreak').textContent = LPK.streak();
    }
    el('tkStart').addEventListener('click', function () {
      if (running) { elapsed += performance.now() - started; running = false; clearInterval(tick); this.textContent = 'Resume'; }
      else { started = performance.now(); running = true; tick = setInterval(render, 500); this.textContent = 'Pause'; }
      render();
    });
    el('tkSave').addEventListener('click', () => {
      if (running) { elapsed += performance.now() - started; running = false; clearInterval(tick); }
      el('tkStart').textContent = 'Start';
      const mins = Math.round(elapsed / 60000);
      if (mins >= 1) LPK.addMinutes(mins);
      el('tkWhy').textContent = mins >= 1 ? mins + ' minutes saved to today.' : 'Less than a minute, so nothing was added.';
      elapsed = 0; render(); stats();
    });
    stats(); render();
  }

  /* ---- plain playable keyboard ---- */
  if (kind === 'keyboard') {
    const narrow = window.matchMedia('(max-width: 700px)').matches;
    const kb = buildKeybed(el('tkKeys'), narrow ? 55 : 48, narrow ? 79 : 84, { labels: true, markC: true });
    playable(kb, el('tkKeys'), el('tkName'));
    computerKeys(kb);
    midiIn(m => {
      if (!kb.keys.has(m)) return;
      audio.noteOn(m, 0.8);
      const k = kb.keys.get(m);
      if (k) k.classList.add('on', 'rh');
      el('tkName').textContent = noteName(m);
      setTimeout(() => { audio.noteOff(m); if (k) k.classList.remove('on', 'rh'); }, 400);
    }, 'tkMidi');
    let names = true;
    el('tkNames').addEventListener('click', function () {
      names = !names;
      el('tkKeys').classList.toggle('hide-names', !names);
      this.classList.toggle('active', names);
      this.setAttribute('aria-pressed', String(names));
      this.textContent = names ? 'Note names on' : 'Note names off';
    });
  }

  /* ---- circle of fifths ---- */
  if (kind === 'fifths') {
    const ORDER = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
    const SIG = ['no sharps or flats', 'one sharp', 'two sharps', 'three sharps', 'four sharps', 'five sharps',
      'six sharps', 'five flats', 'four flats', 'three flats', 'two flats', 'one flat'];
    const REL = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F', 'C', 'G', 'D'];
    const kb = buildKeybed(el('tkKeys'), 60, 84, { labels: true, markC: true });
    const circle = el('tkCircle');
    ORDER.forEach((k, i) => {
      const b = document.createElement('button');
      b.className = 'fifth-key';
      b.textContent = k;
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      b.style.left = (50 + Math.cos(a) * 38) + '%';
      b.style.top = (50 + Math.sin(a) * 38) + '%';
      b.addEventListener('click', () => select(i));
      circle.appendChild(b);
    });
    function select(i) {
      [...circle.children].forEach((c, j) => c.classList.toggle('on', j === i));
      const root = 60 + ROOTS.indexOf(ORDER[i]);
      const midis = SCALES.major.map(s => root + s);
      light(kb, midis);
      el('tkName').textContent = ORDER[i] + ' major';
      el('tkNotes').textContent = midis.slice(0, 7).map(m => pitchClass(m)).join(' \u00b7 ');
      el('tkWhy').textContent = 'Key signature: ' + SIG[i] + '. Relative minor: ' + REL[i] +
        ' minor, which uses the same notes starting from ' + REL[i] + '.';
      play(midis, false, 200);
    }
    playable(kb, el('tkKeys'));
    select(0);
  }
})();
