/* Learn Piano Keys · practice engine */

const audio = new PianoAudio();

const S = {
  piece: PIECES[0],
  bpm: 88,
  hand: 'both',        // both | r | l
  wait: true,
  read: false,         // notation only, falling notes hidden
  showFingers: true,
  showNames: true,
  metronome: false,
  accompany: true,     // play the hand you are not practising
  playing: false,
  cursor: 0,           // position in units (float)
  loop: null,          // [startUnit, endUnit] or null
  lastTs: 0,
  held: new Set(),
  results: new Map(),  // note index -> { hit, dt }
  session: { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 },
  waitingAt: null,
  lastClickUnit: -1
};

const LOW = 36, HIGH = 84;          // C2 .. C6
const LOOKAHEAD = 20;               // units visible on the roll
const HIT_WINDOW = 0.55;            // in units, for rhythm grading

let kb, rollCv, rollCx, staffCv, staffCx;

/* ---------------- helpers ---------------- */
const unitSec = () => 60 / S.bpm / 4;
const activeNotes = () => S.piece.notes.filter(n => S.hand === 'both' || n.h === S.hand);
const el = id => document.getElementById(id);

function diatonic(midi) {
  const map = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const pc = ((midi % 12) + 12) % 12;
  return (Math.floor(midi / 12) - 1) * 7 + map[pc];
}
const needsSharp = midi => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
const pickup = () => S.piece.pickup || 0;
const barCount = () => Math.ceil((S.piece.totalUnits - pickup()) / S.piece.barUnits);
const barStart = b => pickup() + b * S.piece.barUnits;
const barOf = u => Math.floor(Math.max(0, u - pickup()) / S.piece.barUnits);

/* ---------------- setup ---------------- */
function boot() {
  const params = new URLSearchParams(location.search);
  const want = params.get('piece');
  if (want && PIECES.some(p => p.id === want)) S.piece = PIECES.find(p => p.id === want);
  S.bpm = S.piece.bpm;

  buildPieceMenu();
  kb = buildKeybed(el('keys'), LOW, HIGH, { labels: true, markC: true });
  bindKeybed();
  bindControls();
  bindComputerKeys();
  initMidi();

  rollCv = el('roll'); rollCx = rollCv.getContext('2d');
  staffCv = el('staff'); staffCx = staffCv.getContext('2d');
  window.addEventListener('resize', sizeCanvases);
  sizeCanvases();

  loadPiece();
  requestAnimationFrame(frame);
}

function sizeCanvases() {
  [rollCv, staffCv].forEach(cv => {
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  });
}

function buildPieceMenu() {
  const sel = el('pieceSel');
  PIECES.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = `${p.title} · ${p.levelName}`;
    sel.appendChild(o);
  });
  sel.value = S.piece.id;
  sel.addEventListener('change', () => {
    S.piece = PIECES.find(p => p.id === sel.value);
    S.bpm = S.piece.bpm;
    el('bpm').value = S.bpm;
    el('bpmOut').textContent = S.bpm;
    loadPiece();
  });
}

function loadPiece() {
  stop();
  S.cursor = -4;
  S.results.clear();
  S.loop = null;
  S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 };
  el('pieceTitle').textContent = S.piece.title;
  el('pieceMeta').textContent = `${S.piece.composer} · ${S.piece.origin} · ${S.piece.keyName} · ${S.piece.meter.join('/')}`;
  el('pieceTip').textContent = S.piece.tip;
  el('bpm').value = S.bpm;
  el('bpmOut').textContent = S.bpm;
  el('loopOut').textContent = 'off';
  buildBarStrip();
  updateScores();
}

function buildBarStrip() {
  const strip = el('bars');
  strip.innerHTML = '';
  if (pickup() > 0) {
    const pb = document.createElement('button');
    pb.className = 'bar-chip';
    pb.textContent = '0';
    pb.title = 'Pick-up bar';
    pb.addEventListener('click', () => toggleLoopRange(0, pickup()));
    strip.appendChild(pb);
  }
  for (let b = 0; b < barCount(); b++) {
    const btn = document.createElement('button');
    btn.className = 'bar-chip';
    btn.textContent = b + 1;
    btn.title = `Loop from bar ${b + 1}`;
    btn.addEventListener('click', () => toggleLoopRange(barStart(b), barStart(b + 1)));
    strip.appendChild(btn);
  }
}

function toggleLoopRange(from, to) {
  if (S.loop && S.loop[0] === from && S.loop[1] === to) S.loop = null;
  else if (S.loop && S.loop[0] < from) S.loop = [S.loop[0], to];
  else S.loop = [from, to];
  if (S.loop) { S.cursor = S.loop[0] - 2; clearResultsOutsideLoop(); }
  paintBarStrip();
  el('loopOut').textContent = S.loop
    ? (S.loop[0] < pickup() ? 'from pick-up' : `bars ${barOf(S.loop[0]) + 1}\u2013${barOf(S.loop[1] - 0.001) + 1}`)
    : 'off';
}

function clearResultsOutsideLoop() {
  if (!S.loop) return;
  S.piece.notes.forEach((n, i) => {
    if (n.s < S.loop[0] || n.s >= S.loop[1]) S.results.delete(i);
  });
}

function paintBarStrip() {
  const chips = [...el('bars').children];
  const off = pickup() > 0 ? 1 : 0;
  chips.forEach((c, idx) => {
    const from = (idx === 0 && off) ? 0 : barStart(idx - off);
    const to = (idx === 0 && off) ? pickup() : barStart(idx - off + 1);
    const inLoop = S.loop && from >= S.loop[0] && from < S.loop[1];
    c.classList.toggle('loop', !!inLoop);
    c.classList.toggle('here', S.cursor >= from && S.cursor < to);
  });
}

/* ---------------- input ---------------- */
function bindKeybed() {
  const down = e => {
    const m = e.target.dataset && e.target.dataset.midi;
    if (!m) return;
    e.preventDefault();
    playerNoteOn(+m, true);
  };
  const up = e => {
    const m = e.target.dataset && e.target.dataset.midi;
    if (m) playerNoteOff(+m);
  };
  el('keys').addEventListener('pointerdown', down);
  el('keys').addEventListener('pointerup', up);
  el('keys').addEventListener('pointerleave', up);
  el('keys').addEventListener('pointercancel', up);
}

const KEYMAP = { a:0, w:1, s:2, e:3, d:4, f:5, t:6, g:7, y:8, h:9, u:10, j:11, k:12, o:13, l:14, p:15, ';':16 };
let kbOctave = 60;
function bindComputerKeys() {
  addEventListener('keydown', e => {
    if (e.repeat || e.metaKey || e.ctrlKey) return;
    if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); S.playing ? stop() : start(); return; }
    if (k === 'z') { kbOctave = Math.max(36, kbOctave - 12); flashHint(`Octave: ${noteName(kbOctave)}`); return; }
    if (k === 'x') { kbOctave = Math.min(72, kbOctave + 12); flashHint(`Octave: ${noteName(kbOctave)}`); return; }
    if (k === 'r') { el('readMode').click(); return; }
    if (k in KEYMAP) { e.preventDefault(); playerNoteOn(kbOctave + KEYMAP[k], true); }
  });
  addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k in KEYMAP) playerNoteOff(kbOctave + KEYMAP[k]);
  });
}

function initMidi() {
  const badge = el('midiBadge');
  if (!navigator.requestMIDIAccess) {
    badge.textContent = 'MIDI not supported in this browser';
    badge.className = 'badge warn';
    return;
  }
  navigator.requestMIDIAccess().then(access => {
    const attach = () => {
      const inputs = [...access.inputs.values()];
      inputs.forEach(i => { i.onmidimessage = onMidi; });
      badge.textContent = inputs.length
        ? `MIDI: ${inputs[0].name}`
        : 'MIDI ready. Plug in a keyboard';
      badge.className = inputs.length ? 'badge ok' : 'badge';
    };
    access.onstatechange = attach;
    attach();
  }).catch(() => {
    badge.textContent = 'MIDI blocked. Use the on-screen keys';
    badge.className = 'badge warn';
  });
}

function onMidi(e) {
  const [status, note, vel] = e.data;
  const cmd = status & 0xf0;
  if (cmd === 0x90 && vel > 0) playerNoteOn(note, true, vel / 127);
  else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) playerNoteOff(note);
}

/* ---------------- player note handling ---------------- */
function playerNoteOn(midi, fromUser, vel = 0.85) {
  audio.noteOn(midi, vel);
  S.held.add(midi);
  paintKey(midi, true, null);
  if (fromUser) judge(midi);
}
function playerNoteOff(midi) {
  audio.noteOff(midi);
  S.held.delete(midi);
  paintKey(midi, false, null);
}
function paintKey(midi, on, hand) {
  const k = kb.keys.get(midi);
  if (!k) return;
  k.classList.toggle('on', on);
  k.classList.toggle('lh', hand === 'l');
  k.classList.toggle('rh', hand === 'r');
}

function judge(midi) {
  const notes = activeNotes();
  let best = -1, bestD = Infinity;
  notes.forEach(n => {
    const i = S.piece.notes.indexOf(n);
    if (S.results.has(i)) return;
    if (n.m !== midi) return;
    const d = Math.abs(n.s - S.cursor);
    if (d < bestD) { bestD = d; best = i; }
  });
  if (best < 0 || bestD > 2.5) { flashJudge('miss'); return; }
  const dt = S.piece.notes[best].s - S.cursor;
  S.results.set(best, { hit: true, dt });
  S.session.notes++; S.session.hit++;
  S.session.timing += Math.max(0, 1 - Math.abs(dt) / HIT_WINDOW);
  if (S.read) { S.session.literacyNotes++; S.session.literacyHit++; }
  flashJudge(Math.abs(dt) <= HIT_WINDOW ? 'good' : 'late');
  updateScores();
}

function flashJudge(kind) {
  const f = el('judge');
  f.textContent = kind === 'good' ? 'in time' : kind === 'late' ? 'off the beat' : 'wrong note';
  f.className = 'judge ' + kind;
  clearTimeout(f._t);
  f._t = setTimeout(() => { f.className = 'judge'; f.textContent = ''; }, 700);
}

function updateScores() {
  const n = S.session.notes;
  const acc = n ? Math.round(S.session.hit / n * 100) : 0;
  const tim = n ? Math.round(S.session.timing / n * 100) : 0;
  const lit = S.session.literacyNotes ? Math.round(S.session.literacyHit / S.session.literacyNotes * 100) : 0;
  el('accVal').textContent = n ? acc + '%' : '·';
  el('timVal').textContent = n ? tim + '%' : '·';
  el('litVal').textContent = S.session.literacyNotes ? lit + '%' : '·';
  el('litCount').textContent = S.session.literacyNotes
    ? `${S.session.literacyNotes} notes read`
    : 'Turn on Read mode to build this';
}

/* ---------------- transport ---------------- */
function start() {
  audio.resume();
  S.playing = true;
  S.lastTs = performance.now();
  el('playBtn').textContent = 'Pause';
  el('playBtn').classList.add('is-playing');
}
function stop() {
  S.playing = false;
  S.waitingAt = null;
  audio.allOff();
  S.held.clear();
  kb && kb.keys.forEach(k => k.classList.remove('on', 'lh', 'rh'));
  const b = el('playBtn');
  if (b) { b.textContent = 'Play'; b.classList.remove('is-playing'); }
}
function restart() {
  const from = S.loop ? S.loop[0] : 0;
  S.cursor = from - 4;
  if (!S.loop) { S.results.clear(); S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 }; }
  else clearResultsOutsideLoop();
  updateScores();
}

/* Wait mode: hold the transport at the next onset until the learner
   has played every note of that chord for the hands they are practising. */
function pendingAt(unit) {
  const need = activeNotes().filter(n => Math.abs(n.s - unit) < 0.001);
  if (!need.length) return null;
  const unmet = need.filter(n => !S.results.has(S.piece.notes.indexOf(n)));
  return unmet.length ? unmet : null;
}
function nextOnset(from) {
  let best = Infinity;
  activeNotes().forEach(n => { if (n.s >= from - 0.001 && n.s < best) best = n.s; });
  return best === Infinity ? null : best;
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - S.lastTs) / 1000);
  S.lastTs = ts;

  if (S.playing) {
    let advance = dt / unitSec();
    if (S.wait) {
      const on = nextOnset(S.cursor);
      if (on !== null && S.cursor + advance >= on) {
        const unmet = pendingAt(on);
        if (unmet) { S.cursor = on; advance = 0; S.waitingAt = on; }
        else S.waitingAt = null;
      } else S.waitingAt = null;
    }
    S.cursor += advance;

    // metronome
    if (S.metronome) {
      const clickUnits = S.piece.meter[1] === 8 ? 2 : 4;
      const beat = Math.floor((S.cursor - pickup()) / clickUnits);
      if (beat !== S.lastClickUnit && S.cursor >= pickup()) {
        S.lastClickUnit = beat;
        const perBar = S.piece.barUnits / clickUnits;
        audio.click(((beat % perBar) + perBar) % perBar === 0);
      }
    }

    // auto-play the hand not being practised
    if (S.accompany && S.hand !== 'both') {
      S.piece.notes.forEach((n, i) => {
        if (n.h === S.hand) return;
        if (n._p) return;
        if (S.cursor >= n.s && S.cursor < n.s + 0.5) {
          n._p = true;
          audio.noteOn(n.m, 0.5);
          paintKey(n.m, true, n.h);
          setTimeout(() => { audio.noteOff(n.m); paintKey(n.m, false, null); n._p = false; }, n.d * unitSec() * 1000);
        }
      });
    }

    const end = S.loop ? S.loop[1] : S.piece.totalUnits + 4;
    if (S.cursor >= end) {
      if (S.loop) { S.cursor = S.loop[0]; clearResultsOutsideLoop(); }
      else { stop(); S.cursor = -4; }
    }
  }

  drawRoll();
  drawStaff();
  paintBarStrip();
  el('waitBadge').style.opacity = S.waitingAt !== null ? '1' : '0';
  requestAnimationFrame(frame);
}

/* ---------------- falling note roll ---------------- */
function drawRoll() {
  const w = rollCv.clientWidth, h = rollCv.clientHeight;
  rollCx.clearRect(0, 0, w, h);

  // key gridlines so notes read against the keybed below
  rollCx.strokeStyle = 'rgba(244,237,226,.05)';
  rollCx.lineWidth = 1;
  kb.whites.forEach((m, i) => {
    const x = (i * kb.whiteWidth) / 100 * w;
    rollCx.beginPath(); rollCx.moveTo(x, 0); rollCx.lineTo(x, h); rollCx.stroke();
    if (pitchClass(m) === 'C') {
      rollCx.strokeStyle = 'rgba(212,163,67,.14)';
      rollCx.beginPath(); rollCx.moveTo(x, 0); rollCx.lineTo(x, h); rollCx.stroke();
      rollCx.strokeStyle = 'rgba(244,237,226,.05)';
    }
  });

  // strike line
  rollCx.strokeStyle = 'rgba(212,163,67,.55)';
  rollCx.lineWidth = 2;
  rollCx.beginPath(); rollCx.moveTo(0, h - 1); rollCx.lineTo(w, h - 1); rollCx.stroke();

  if (S.read) {
    rollCx.fillStyle = 'rgba(167,154,140,.55)';
    rollCx.font = '13px "IBM Plex Mono", monospace';
    rollCx.textAlign = 'center';
    rollCx.fillText('READ MODE · notes hidden, play from the staff', w / 2, h / 2);
    return;
  }

  const px = h / LOOKAHEAD;
  S.piece.notes.forEach((n, i) => {
    const rel = n.s - S.cursor;
    if (rel > LOOKAHEAD || rel + n.d < -1) return;
    const isActive = S.hand === 'both' || n.h === S.hand;
    const x = kb.xOf(n.m) / 100 * w;
    const bw = (isBlack(n.m) ? kb.whiteWidth * 0.62 : kb.whiteWidth * 0.86) / 100 * w;
    const y = h - rel * px;
    const nh = Math.max(10, n.d * px);
    const top = y - nh;
    const res = S.results.get(i);

    let fill = n.h === 'l' ? '#6FA3C0' : '#C9605C';
    if (!isActive) fill = 'rgba(167,154,140,.22)';
    else if (res) fill = '#7FA86F';

    rollCx.fillStyle = fill;
    rollCx.globalAlpha = isActive ? (rel < 0 ? 0.5 : 1) : 1;
    roundRect(rollCx, x - bw / 2, top, bw, nh, 4);
    rollCx.fill();

    if (S.showFingers && isActive && n.f && nh > 16 && rel < LOOKAHEAD - 1) {
      rollCx.globalAlpha = 1;
      rollCx.fillStyle = '#14100F';
      rollCx.font = '600 11px "IBM Plex Mono", monospace';
      rollCx.textAlign = 'center';
      rollCx.fillText(n.f, x, top + nh - 6);
    }
    rollCx.globalAlpha = 1;
  });
}

function roundRect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* ---------------- grand staff ---------------- */
function drawStaff() {
  const w = staffCv.clientWidth, h = staffCv.clientHeight;
  staffCx.clearRect(0, 0, w, h);
  const gap = 9;
  const trebleBottom = 46;            // y of E4 line
  const bassBottom = trebleBottom + 74; // y of G2 line
  const padL = 62, padR = 16;

  staffCx.strokeStyle = 'rgba(244,237,226,.28)';
  staffCx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    [trebleBottom, bassBottom].forEach(base => {
      const y = base - i * gap;
      staffCx.beginPath(); staffCx.moveTo(padL, y + .5); staffCx.lineTo(w - padR, y + .5); staffCx.stroke();
    });
  }
  // brace
  staffCx.beginPath();
  staffCx.moveTo(padL - 10, trebleBottom - 4 * gap);
  staffCx.lineTo(padL - 10, bassBottom);
  staffCx.strokeStyle = 'rgba(244,237,226,.45)';
  staffCx.lineWidth = 2; staffCx.stroke();

  drawTrebleClef(staffCx, padL + 18, trebleBottom - gap, gap);
  drawBassClef(staffCx, padL + 16, bassBottom - 3 * gap, gap);

  // window of notes: two bars around the cursor
  const bu = S.piece.barUnits;
  const barIdx = Math.max(0, barOf(S.cursor));
  const winStart = barStart(barIdx);
  const winEnd = winStart + bu * 2;
  const usable = w - padL - padR - 44;
  const xAt = u => padL + 44 + ((u - winStart) / (bu * 2)) * usable;

  // barline
  staffCx.strokeStyle = 'rgba(244,237,226,.2)';
  staffCx.lineWidth = 1;
  [winStart + bu, winEnd].forEach(u => {
    const x = xAt(u);
    staffCx.beginPath();
    staffCx.moveTo(x, trebleBottom - 4 * gap); staffCx.lineTo(x, trebleBottom);
    staffCx.moveTo(x, bassBottom - 4 * gap); staffCx.lineTo(x, bassBottom);
    staffCx.stroke();
  });

  // cursor
  if (S.cursor >= winStart && S.cursor <= winEnd) {
    staffCx.strokeStyle = 'rgba(212,163,67,.5)';
    staffCx.lineWidth = 2;
    const x = xAt(S.cursor);
    staffCx.beginPath();
    staffCx.moveTo(x, trebleBottom - 4 * gap - 8);
    staffCx.lineTo(x, bassBottom + 8);
    staffCx.stroke();
  }

  S.piece.notes.forEach((n, i) => {
    if (n.s < winStart || n.s >= winEnd) return;
    const isActive = S.hand === 'both' || n.h === S.hand;
    const treble = n.m >= 60 || n.h === 'r';
    const base = treble ? trebleBottom : bassBottom;
    const ref = treble ? diatonic(64) : diatonic(43); // E4 / G2 bottom lines
    const d = diatonic(n.m);
    const y = base - (d - ref) * (gap / 2);
    const x = xAt(n.s);
    const res = S.results.get(i);

    // ledger lines
    staffCx.strokeStyle = 'rgba(244,237,226,.3)';
    const topLine = base - 4 * gap;
    for (let ly = base + gap; ly <= y + 0.1; ly += gap) {
      staffCx.beginPath(); staffCx.moveTo(x - 9, ly + .5); staffCx.lineTo(x + 9, ly + .5); staffCx.stroke();
    }
    for (let ly = topLine - gap; ly >= y - 0.1; ly -= gap) {
      staffCx.beginPath(); staffCx.moveTo(x - 9, ly + .5); staffCx.lineTo(x + 9, ly + .5); staffCx.stroke();
    }

    staffCx.save();
    staffCx.translate(x, y);
    staffCx.rotate(-0.32);
    staffCx.beginPath();
    staffCx.ellipse(0, 0, 5.4, 3.9, 0, 0, Math.PI * 2);
    staffCx.fillStyle = !isActive ? 'rgba(167,154,140,.3)'
      : res ? '#7FA86F' : (n.h === 'l' ? '#6FA3C0' : '#C9605C');
    if (n.d >= 8) { staffCx.lineWidth = 1.6; staffCx.strokeStyle = staffCx.fillStyle; staffCx.stroke(); }
    else staffCx.fill();
    staffCx.restore();

    // stem
    staffCx.strokeStyle = !isActive ? 'rgba(167,154,140,.3)' : (n.h === 'l' ? '#6FA3C0' : '#C9605C');
    staffCx.lineWidth = 1.4;
    const up = y > base - 2 * gap;
    staffCx.beginPath();
    staffCx.moveTo(x + (up ? 5 : -5), y);
    staffCx.lineTo(x + (up ? 5 : -5), y + (up ? -24 : 24));
    staffCx.stroke();

    if (needsSharp(n.m)) {
      staffCx.fillStyle = isActive ? 'rgba(244,237,226,.85)' : 'rgba(167,154,140,.35)';
      staffCx.font = '14px "IBM Plex Mono", monospace';
      staffCx.textAlign = 'right';
      staffCx.fillText('\u266F', x - 8, y + 5);
    }
    if (S.showNames && isActive) {
      staffCx.fillStyle = 'rgba(167,154,140,.65)';
      staffCx.font = '9px "IBM Plex Mono", monospace';
      staffCx.textAlign = 'center';
      staffCx.fillText(pitchClass(n.m), x, base + 5 * gap + 4);
    }
  });
}

function drawTrebleClef(c, x, y, gap) {
  const s = gap / 9;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = 'rgba(244,237,226,.75)'; c.lineWidth = 2.1; c.lineCap = 'round';
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

function drawBassClef(c, x, y, gap) {
  const s = gap / 9;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = 'rgba(244,237,226,.75)'; c.fillStyle = 'rgba(244,237,226,.75)';
  c.lineWidth = 2.4; c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 0, 4.2, -Math.PI * 0.95, Math.PI * 0.30);
  c.bezierCurveTo(3.2, 8, -2, 14, -8, 17);
  c.stroke();
  c.beginPath(); c.arc(8.5, -4.5, 1.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(8.5, 4.5, 1.5, 0, Math.PI * 2); c.fill();
  c.restore();
}

/* ---------------- controls ---------------- */
function flashHint(text) {
  const h = el('hint');
  h.textContent = text;
  h.classList.add('show');
  clearTimeout(h._t);
  h._t = setTimeout(() => h.classList.remove('show'), 1400);
}

function bindControls() {
  el('playBtn').addEventListener('click', () => S.playing ? stop() : start());
  el('restartBtn').addEventListener('click', restart);

  el('bpm').addEventListener('input', e => {
    S.bpm = +e.target.value;
    el('bpmOut').textContent = S.bpm;
  });

  document.querySelectorAll('[data-hand]').forEach(b => {
    b.addEventListener('click', () => {
      S.hand = b.dataset.hand;
      document.querySelectorAll('[data-hand]').forEach(x => x.classList.toggle('active', x === b));
      S.results.clear();
      S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 };
      updateScores();
    });
  });

  const toggles = [
    ['waitMode', v => S.wait = v, () => S.wait],
    ['readMode', v => { S.read = v; el('readCard').classList.toggle('lit', v); }, () => S.read],
    ['fingerMode', v => S.showFingers = v, () => S.showFingers],
    ['nameMode', v => { S.showNames = v; el('keys').classList.toggle('hide-names', !v); }, () => S.showNames],
    ['metroMode', v => S.metronome = v, () => S.metronome],
    ['accompMode', v => S.accompany = v, () => S.accompany]
  ];
  toggles.forEach(([id, set, get]) => {
    const b = el(id);
    if (!b) return;
    b.classList.toggle('active', get());
    b.setAttribute('aria-pressed', String(get()));
    b.addEventListener('click', () => {
      set(!get());
      b.classList.toggle('active', get());
      b.setAttribute('aria-pressed', String(get()));
    });
  });

  el('clearLoop').addEventListener('click', () => {
    S.loop = null;
    el('loopOut').textContent = 'off';
    paintBarStrip();
  });
}

document.addEventListener('DOMContentLoaded', boot);
