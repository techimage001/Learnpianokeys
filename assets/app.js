/* Learn Piano Keys - practice engine */

const audio = new PianoAudio();
let detector = null;

/* ---------------- state ---------------- */
const S = {
  piece: PIECES[0],
  bpm: 88,
  hand: 'both',        // both | r | l
  level: 3,            // 1 melody, 2 melody plus bass, 3 both hands
  wait: true,
  read: false,         // notation only, falling notes hidden
  showFingers: true,
  showLetters: true,   // L / R on every block, for people who should not have to remember
  showNames: true,
  metronome: false,
  accompany: true,     // play the hand you are not practising
  countIn: true,
  transpose: 0,
  mic: false,
  playing: false,
  cursor: 0,           // position in units (float)
  loop: null,          // [startUnit, endUnit] or null
  lastTs: 0,
  held: new Set(),
  results: new Map(),  // note index -> { hit, dt }
  session: { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 },
  waitingAt: null,
  stuck: null,         // { at, amount } hesitation while wait mode holds
  lastClickBeat: null,
  countInUntil: null,
  take: [],
  takePlaying: false
};

/* The keyboard shrinks on small screens rather than being squeezed:
   a 49 key range at 390px is unusable, two octaves is fine. */
function keyRange() {
  const w = window.innerWidth || 1024;
  if (w < 560) return [55, 79];    // G3 to G5
  if (w < 900) return [48, 84];    // C3 to C6
  return [36, 84];                 // C2 to C6
}
let LOW = 36, HIGH = 84;
const HAND_L = '#6FB6DC';           // left hand, everywhere, always
const HAND_R = '#D96E68';           // right hand, everywhere, always
const GOOD   = '#7FA86F';           // played correctly, shown as an outline
const FELT   = '#9E3B45';           // missed, shown as an outline
const LOOKAHEAD = 20;               // units visible on the roll
const HIT_WINDOW = 0.55;            // in units, for rhythm grading
const CATCH = 2.5;                  // in units, how far a note counts as "this one"

let kb, rollCv, rollCx, staffCv, staffCx;

/* ---------------- helpers ---------------- */
const el = id => document.getElementById(id);
const unitSec = () => 60 / S.bpm / 4;
const tm = n => n.m + S.transpose;
const inLevel = n => (n.lvl || 1) <= S.level;
const activeNotes = () => S.piece.notes.filter(n => inLevel(n) && (S.hand === 'both' || n.h === S.hand));
const pickup = () => S.piece.pickup || 0;
const barCount = () => Math.ceil((S.piece.totalUnits - pickup()) / S.piece.barUnits);
const barStart = b => pickup() + b * S.piece.barUnits;
const barOf = u => Math.floor(Math.max(0, u - pickup()) / S.piece.barUnits);

function diatonic(midi) {
  const map = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const pc = ((midi % 12) + 12) % 12;
  return (Math.floor(midi / 12) - 1) * 7 + map[pc];
}
const needsSharp = midi => [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
const say = msg => { const r = el('sr'); if (r) r.textContent = msg; };

/* ---------------- persistence (shared LPK store) ---------------- */
let practiceMarked = false;
function markPractice() {
  if (practiceMarked) return;
  practiceMarked = true;
  LPK.markDay();
  renderProgress();
}

function recordBest() {
  if (S.session.notes < 8) return;
  const s = LPK.load();
  s.best = s.best || {};
  const acc = Math.round(S.session.hit / S.session.notes * 100);
  const tim = S.session.hit ? Math.round(S.session.timing / S.session.hit * 100) : 0;
  const lit = S.session.literacyNotes
    ? Math.round(S.session.literacyHit / S.session.literacyNotes * 100) : 0;
  const cur = s.best[S.piece.id] || { acc: 0, tim: 0, lit: 0 };
  s.best[S.piece.id] = { acc: Math.max(cur.acc, acc), tim: Math.max(cur.tim, tim), lit: Math.max(cur.lit, lit) };
  s.lastPiece = S.piece.id;
  LPK.save(s);
  renderProgress();
}

function renderProgress() {
  const s = LPK.load();
  const streak = LPK.streak();
  el('streakVal').textContent = streak;
  el('streakLab').textContent = streak === 1 ? 'day in a row' : 'days in a row';
  const b = (s.best || {})[S.piece.id];
  el('bestLine').textContent = b
    ? `Best on this piece: ${b.acc}% notes, ${b.tim}% timing${b.lit ? `, ${b.lit}% reading` : ''}`
    : 'No saved run for this piece yet.';
}

/* ---------------- setup ---------------- */
function boot() {
  const params = new URLSearchParams(location.search);
  const store = LPK.load();
  const want = params.get('piece') || store.lastPiece;
  if (want && PIECES.some(p => p.id === want)) S.piece = PIECES.find(p => p.id === want);
  const lvl = parseInt(params.get('level'), 10);
  if (lvl >= 1 && lvl <= 3) S.level = lvl;
  S.bpm = S.piece.bpm;

  buildPieceMenu();
  const r = keyRange(); LOW = r[0]; HIGH = r[1];
  kb = buildKeybed(el('keys'), LOW, HIGH, { labels: true, markC: true });
  bindKeybed();
  bindControls();
  bindComputerKeys();
  initMidi();

  rollCv = el('roll'); rollCx = rollCv.getContext('2d');
  staffCv = el('staff'); staffCx = staffCv.getContext('2d');
  window.addEventListener('resize', () => {
    const r2 = keyRange();
    if (r2[0] !== LOW || r2[1] !== HIGH) {
      LOW = r2[0]; HIGH = r2[1];
      kb = buildKeybed(el('keys'), LOW, HIGH, { labels: true, markC: true });
      el('keys').classList.toggle('hide-names', !S.showNames);
    }
    sizeCanvases();
  });
  sizeCanvases();

  const resumed = restoreSession();
  loadPiece(true);
  if (resumed) {
    const strip = el('resumeStrip');
    if (strip) strip.hidden = false;
    say('Resumed from bar ' + (barOf(S.cursor) + 1));
  }
  el('freshBtn').addEventListener('click', () => {
    const st = LPK.load();
    delete st.session;
    LPK.save(st);
    location.href = '/app.html';
  });
  reflectControls();
  bindHowto();
  bindInvite();
  maybeInvite();
  setInterval(saveSession, 5000);
  addEventListener('pagehide', saveSession);
  addEventListener('beforeunload', saveSession);
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

function switchPiece(id) {
  if (id === S.piece.id) return;
  S.piece = PIECES.find(p => p.id === id) || S.piece;
  S.bpm = S.piece.bpm;
  loadPiece(false);
  reflectControls();
  saveSession();
}

function paintPieceCards() {
  const wrap = el('pieceCards');
  if (!wrap) return;
  wrap.querySelectorAll('.piece-card').forEach(b => {
    b.classList.toggle('active', b.dataset.piece === S.piece.id);
    b.setAttribute('aria-pressed', String(b.dataset.piece === S.piece.id));
  });
  const sel = el('pieceSel');
  if (sel && sel.value !== S.piece.id) sel.value = S.piece.id;
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
    switchPiece(sel.value);
  });

  const wrap = el('pieceCards');
  if (wrap) {
    PIECES.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'piece-card';
      b.dataset.piece = p.id;
      b.innerHTML = '<b>' + p.title + '</b><span>' + p.levelName + '</span>';
      b.addEventListener('click', () => switchPiece(p.id));
      wrap.appendChild(b);
    });
    paintPieceCards();
  }
}

function loadPiece(keepSession) {
  stop();
  paintPieceCards();
  S.cursor = pickup() - 4;
  S.results.clear();
  S.take = [];
  if (!keepSession) { S.transpose = 0; S.loop = null; }
  S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 };
  el('pieceTitle').textContent = S.piece.title;
  el('pieceMeta').textContent = `${S.piece.composer} · ${S.piece.origin} · ${S.piece.keyName} · ${S.piece.meter.join('/')}`;
  el('pieceTip').textContent = S.piece.tip;
  el('bpm').value = S.bpm;
  el('bpmOut').textContent = S.bpm;
  el('loopOut').textContent = 'off';
  updateTransposeUI();
  buildBarStrip();
  updateScores();
  renderTrouble();
  renderProgress();
  const st = LPK.load(); st.lastPiece = S.piece.id; LPK.save(st);
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
    btn.title = `Loop bar ${b + 1}`;
    btn.addEventListener('click', () => toggleLoopRange(barStart(b), barStart(b + 1)));
    strip.appendChild(btn);
  }
}

function setLoop(from, to) {
  S.loop = [from, to];
  S.cursor = from - 2;
  clearResultsOutsideLoop();
  paintBarStrip();
  el('loopOut').textContent = from < pickup()
    ? 'from pick-up'
    : `bars ${barOf(from) + 1}\u2013${barOf(to - 0.001) + 1}`;
}

function toggleLoopRange(from, to) {
  if (S.loop && S.loop[0] === from && S.loop[1] === to) {
    S.loop = null;
    el('loopOut').textContent = 'off';
    paintBarStrip();
    return;
  }
  if (S.loop && S.loop[0] < from) setLoop(S.loop[0], to);
  else setLoop(from, to);
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
    c.classList.toggle('loop', !!(S.loop && from >= S.loop[0] && from < S.loop[1]));
    c.classList.toggle('here', S.cursor >= from && S.cursor < to);
  });
}

/* ---------------- input ---------------- */
function bindKeybed() {
  const host = el('keys');
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
  host.addEventListener('pointerdown', down);
  host.addEventListener('pointerup', up);
  host.addEventListener('pointerleave', up);
  host.addEventListener('pointercancel', up);
}

const KEYMAP = { a:0, w:1, s:2, e:3, d:4, f:5, t:6, g:7, y:8, h:9, u:10, j:11, k:12, o:13, l:14, p:15 };
let kbOctave = 60;
function bindComputerKeys() {
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey) return;
    if (['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'Shift' && !e.repeat) { audio.setSustain(true); reflectPedal(true); return; }
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); S.playing ? stop() : start(); return; }
    if (k === 'z') { kbOctave = Math.max(36, kbOctave - 12); flashHint(`Computer keys start at ${noteName(kbOctave)}`); return; }
    if (k === 'x') { kbOctave = Math.min(72, kbOctave + 12); flashHint(`Computer keys start at ${noteName(kbOctave)}`); return; }
    if (k === 'r') { el('readMode').click(); return; }
    if (k in KEYMAP) { e.preventDefault(); playerNoteOn(kbOctave + KEYMAP[k], true); }
  });
  addEventListener('keyup', e => {
    if (e.key === 'Shift') { audio.setSustain(false); reflectPedal(false); return; }
    const k = e.key.toLowerCase();
    if (k in KEYMAP) playerNoteOff(kbOctave + KEYMAP[k]);
  });
  addEventListener('blur', () => { audio.setSustain(false); reflectPedal(false); });
}

function reflectPedal(on) {
  const b = el('pedalMode');
  if (b) { b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); }
}

function initMidi() {
  const badge = el('midiBadge');
  if (!navigator.requestMIDIAccess) {
    badge.textContent = 'No MIDI in this browser';
    badge.className = 'badge status warn';
    return;
  }
  navigator.requestMIDIAccess().then(access => {
    const attach = () => {
      const inputs = [...access.inputs.values()];
      inputs.forEach(i => { i.onmidimessage = onMidi; });
      badge.textContent = inputs.length ? `MIDI: ${inputs[0].name}` : 'MIDI ready. Plug in a keyboard';
      badge.className = inputs.length ? 'badge status ok' : 'badge status';
    };
    access.onstatechange = attach;
    attach();
  }).catch(() => {
    badge.textContent = 'MIDI blocked. Use the on-screen keys';
    badge.className = 'badge status warn';
  });
}

function onMidi(e) {
  const [status, a, b] = e.data;
  const cmd = status & 0xf0;
  if (cmd === 0x90 && b > 0) playerNoteOn(a, true, b / 127);
  else if (cmd === 0x80 || (cmd === 0x90 && b === 0)) playerNoteOff(a);
  else if (cmd === 0xB0 && a === 64) { audio.setSustain(b >= 64); reflectPedal(b >= 64); }
}

async function toggleMic(on) {
  const badge = el('micBadge');
  if (!on) {
    if (detector) detector.stop();
    S.mic = false;
    badge.textContent = 'Microphone off';
    badge.className = 'badge status';
    badge.setAttribute('aria-pressed', 'false');
    return;
  }
  audio.resume();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    badge.textContent = 'No microphone access in this browser';
    badge.className = 'badge status warn';
    badge.setAttribute('aria-pressed', 'false');
    el('micMode').classList.remove('active');
    return;
  }
  detector = new PitchDetector(audio.ctx,
    m => { S.held.add(m); paintKey(m, true, null); judge(m); },
    m => { S.held.delete(m); paintKey(m, false, null); });
  try {
    await detector.start();
    S.mic = true;
    badge.textContent = 'Microphone on (one note at a time)';
    badge.className = 'badge status warn';
    badge.setAttribute('aria-pressed', 'true');
  } catch (err) {
    badge.textContent = 'Microphone permission refused';
    badge.className = 'badge status warn';
    badge.setAttribute('aria-pressed', 'false');
    el('micMode').classList.remove('active');
    el('micMode').setAttribute('aria-pressed', 'false');
  }
}

/* ---------------- player note handling ---------------- */
function playerNoteOn(midi, fromUser, vel = 0.85) {
  if (fromUser && window.LPKSession) LPKSession.activity();
  audio.noteOn(midi, vel);
  S.held.add(midi);
  paintKey(midi, true, null);
  if (fromUser) {
    judge(midi);
    if (S.playing && !S.takePlaying) S.take.push({ m: midi, u: S.cursor, d: null });
  }
}
function playerNoteOff(midi) {
  audio.noteOff(midi);
  S.held.delete(midi);
  paintKey(midi, false, null);
  for (let i = S.take.length - 1; i >= 0; i--) {
    if (S.take[i].m === midi && S.take[i].d === null) { S.take[i].d = Math.max(0.4, S.cursor - S.take[i].u); break; }
  }
}
function paintKey(midi, on, hand) {
  const k = kb && kb.keys.get(midi);
  if (!k) return;
  k.classList.toggle('on', on);
  k.classList.toggle('lh', hand === 'l');
  k.classList.toggle('rh', hand === 'r');
}

function judge(midi) {
  markPractice();
  let best = -1, bestD = Infinity;
  activeNotes().forEach(n => {
    const i = S.piece.notes.indexOf(n);
    if (S.results.has(i) || tm(n) !== midi) return;
    const d = Math.abs(n.s - S.cursor);
    if (d < bestD) { bestD = d; best = i; }
  });
  if (best < 0 || bestD > CATCH) {
    flashJudge('miss');
    if (S.playing && !(S.countInUntil !== null && S.cursor < S.countInUntil)) {
      S.session.notes++;
      if (S.read) S.session.literacyNotes++;
      updateScores();
    }
    return;
  }
  const onset = S.piece.notes[best].s;
  const stuckHere = (S.stuck && Math.abs(S.stuck.at - onset) < 0.001) ? S.stuck.amount : 0;
  const dt = stuckHere > 0 ? -stuckHere : (onset - S.cursor);
  S.results.set(best, { hit: true, dt });
  S.session.notes++; S.session.hit++;
  S.session.timing += Math.max(0, 1 - Math.abs(dt) / HIT_WINDOW);
  if (S.read) { S.session.literacyNotes++; S.session.literacyHit++; }
  flashJudge(Math.abs(dt) <= HIT_WINDOW ? 'good' : 'late');
  updateScores();
}

/* Anything the transport has left behind unplayed counts as a miss,
   which is what makes the trouble-spot panel worth reading. */
function sweepMisses() {
  activeNotes().forEach(n => {
    const i = S.piece.notes.indexOf(n);
    if (S.results.has(i)) return;
    if (n.s + CATCH < S.cursor) {
      S.results.set(i, { hit: false, dt: null });
      S.session.notes++;
      if (S.read) S.session.literacyNotes++;
      updateScores();
    }
  });
}

function flashJudge(kind) {
  const f = el('judge');
  f.textContent = kind === 'good' ? 'in time' : kind === 'late' ? 'off the beat' : 'wrong note';
  f.className = 'judge ' + kind;
  clearTimeout(f._t);
  f._t = setTimeout(() => { f.className = 'judge'; f.textContent = ''; }, 700);
}

function setScore(id, value) {
  const e = el(id);
  if (!e) return;
  e.textContent = value === null ? 'not yet' : value;
  e.classList.toggle('empty', value === null);
}

function updateScores() {
  const n = S.session.notes;
  const acc = n ? Math.round(S.session.hit / n * 100) : 0;
  const tim = S.session.hit ? Math.round(S.session.timing / S.session.hit * 100) : 0;
  const lit = S.session.literacyNotes ? Math.round(S.session.literacyHit / S.session.literacyNotes * 100) : 0;
  setScore('accVal', n ? acc + '%' : null);
  setScore('timVal', S.session.hit ? tim + '%' : null);
  setScore('litVal', S.session.literacyNotes ? lit + '%' : null);
  el('litCount').textContent = S.session.literacyNotes
    ? `${S.session.literacyNotes} notes read`
    : 'Turn on Read mode to build this';
}

/* ---------------- trouble spots ---------------- */
function troubleBars() {
  const rows = [];
  const off = pickup() > 0 ? 1 : 0;
  const total = barCount() + off;
  for (let idx = 0; idx < total; idx++) {
    const from = (idx === 0 && off) ? 0 : barStart(idx - off);
    const to = (idx === 0 && off) ? pickup() : barStart(idx - off + 1);
    const notes = activeNotes().filter(n => n.s >= from && n.s < to);
    if (!notes.length) continue;
    let attempted = 0, hit = 0, err = 0;
    notes.forEach(n => {
      const r = S.results.get(S.piece.notes.indexOf(n));
      if (!r) return;
      attempted++;
      if (r.hit) { hit++; err += Math.min(2, Math.abs(r.dt) / HIT_WINDOW); }
    });
    if (attempted < Math.max(1, Math.ceil(notes.length / 2))) continue;
    const missRate = 1 - hit / attempted;
    const timingErr = hit ? err / hit : 1;
    const pain = missRate * 2 + timingErr;
    if (pain < 0.28) continue;
    rows.push({ from, to, label: (idx === 0 && off) ? 'Pick-up' : `Bar ${idx - off + 1}`, missRate, timingErr, pain });
  }
  return rows.sort((a, b) => b.pain - a.pain).slice(0, 3);
}

function renderTrouble() {
  const host = el('trouble');
  const rows = troubleBars();
  if (!rows.length) {
    host.innerHTML = '<p class="score-note">Play a run and the bars you keep fluffing will be listed here, with a one-tap loop for each.</p>';
    return;
  }
  host.innerHTML = '';
  rows.forEach(r => {
    const why = r.missRate > 0.34
      ? `${Math.round(r.missRate * 100)}% of notes missed`
      : 'notes right, timing loose';
    const row = document.createElement('div');
    row.className = 'trouble-row';
    row.innerHTML = `<span class="trouble-bar">${r.label}</span><span class="trouble-why">${why}</span>`;
    const btn = document.createElement('button');
    btn.className = 'pill';
    btn.textContent = 'Loop it';
    btn.addEventListener('click', () => { setLoop(r.from, r.to); say(`Looping ${r.label}`); });
    row.appendChild(btn);
    host.appendChild(row);
  });
}

/* ---------------- transport ---------------- */
function startUnit() { return S.loop ? S.loop[0] : pickup(); }

let sessionCounted = false;
function start() {
  if (typeof LPKGate !== 'undefined') {
    if (LPKGate.shouldBlock()) {
      LPKGate.open('wall', () => { sessionCounted = false; start(); });
      return;
    }
    if (!sessionCounted) { sessionCounted = true; LPKGate.countSession(); maybeInvite(); }
  }
  audio.resume();
  if (S.cursor < startUnit() - S.piece.barUnits * 2.5 || S.cursor >= (S.loop ? S.loop[1] : S.piece.totalUnits)) {
    S.cursor = startUnit();
  }
  if (S.countIn) {
    S.cursor = startUnit() - S.piece.barUnits * 2;
    S.countInUntil = startUnit();
  } else S.countInUntil = null;
  S.take = [];
  S.lastClickBeat = null;
  S.stuck = null;
  S.playing = true;
  S.lastTs = performance.now();
  el('playBtn').textContent = 'Pause';
  el('playBtn').classList.add('is-playing');
  say('Playing');
}

function stop() {
  const wasPlaying = S.playing;
  S.playing = false;
  S.waitingAt = null;
  S.stuck = null;
  S.countInUntil = null;
  audio.allOff();
  S.held.clear();
  if (kb) kb.keys.forEach(k => k.classList.remove('on', 'lh', 'rh', 'target', 't-l', 't-r'));
  litTargets = [];
  const b = el('playBtn');
  if (b) { b.textContent = 'Play'; b.classList.remove('is-playing'); }
  if (wasPlaying) { recordBest(); renderTrouble(); saveSession(); say('Paused'); }
}

function restart() {
  S.cursor = startUnit();
  if (!S.loop) {
    S.results.clear();
    S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 };
  } else clearResultsOutsideLoop();
  S.take = [];
  updateScores();
  renderTrouble();
}

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
    const leadIn = S.countInUntil !== null && S.cursor < S.countInUntil;
    let advance = dt / unitSec();

    if (S.wait && !leadIn) {
      const on = nextOnset(S.cursor);
      if (on !== null && S.cursor + advance >= on) {
        const unmet = pendingAt(on);
        if (unmet) {
          if (!S.stuck || S.stuck.at !== on) S.stuck = { at: on, amount: 0 };
          S.stuck.amount += Math.max(0, S.cursor + advance - on);
          S.cursor = on; advance = 0; S.waitingAt = on;
        } else { S.waitingAt = null; }
      } else S.waitingAt = null;
    }
    S.cursor += advance;

    if (S.metronome || leadIn) {
      const clickUnits = S.piece.meter[1] === 8 ? 2 : 4;
      const beat = Math.floor((S.cursor - pickup()) / clickUnits);
      if (beat !== S.lastClickBeat) {
        S.lastClickBeat = beat;
        const perBar = S.piece.barUnits / clickUnits;
        const accent = ((beat % perBar) + perBar) % perBar === 0;
        audio.click(accent);
        pulse(accent);
      }
    }

    if (!leadIn) {
      sweepMisses();
      if (S.accompany && S.hand !== 'both' && !S.takePlaying) {
        S.piece.notes.forEach(n => {
          if (!inLevel(n) || n.h === S.hand || n._p) return;
          if (S.cursor >= n.s && S.cursor < n.s + 0.5) {
            n._p = true;
            const m = tm(n);
            audio.noteOn(m, 0.45);
            paintKey(m, true, n.h);
            setTimeout(() => { audio.noteOff(m); paintKey(m, false, null); n._p = false; }, n.d * unitSec() * 1000);
          }
        });
      }
    }

    const end = S.loop ? S.loop[1] : S.piece.totalUnits + 4;
    if (S.cursor >= end) {
      if (S.loop) { S.cursor = S.loop[0]; clearResultsOutsideLoop(); renderTrouble(); }
      else { stop(); S.cursor = pickup() - 4; }
    }
  }

  drawRoll();
  drawStaff();
  paintBarStrip();
  paintNextKeys();
  updateCoach();
  el('waitBadge').style.opacity = S.waitingAt !== null ? '1' : '0';
  requestAnimationFrame(frame);
}

let pulseT = null;
function pulse(accent) {
  const p = el('pulse');
  if (!p) return;
  p.classList.remove('beat', 'accent');
  void p.offsetWidth;
  p.classList.add('beat');
  if (accent) p.classList.add('accent');
  clearTimeout(pulseT);
  pulseT = setTimeout(() => p.classList.remove('beat', 'accent'), 180);
}

/* An invitation, never a countdown. It leads with what signing up gives,
   and it can be waved away without losing anything. */
function maybeInvite() {
  const box = el('invite');
  if (!box || typeof LPKGate === 'undefined') return;
  if (LPKGate.unlocked()) { box.hidden = true; return; }
  const s = LPK.load();
  if (s.inviteDismissed) return;
  if (LPKGate.remaining() > 1) return;
  box.hidden = false;
}

function bindHowto() {
  const box = el('howto');
  if (!box) return;
  const body = el('howtoBody');
  const toggle = el('howtoToggle');
  const store = LPK.load();
  const collapsed = !!store.howtoSeen;

  function setOpen(open) {
    body.hidden = !open;
    toggle.textContent = open ? 'Hide' : 'Show';
    toggle.setAttribute('aria-expanded', String(open));
    box.classList.toggle('is-open', open);
  }
  setOpen(!collapsed);

  toggle.addEventListener('click', () => setOpen(body.hidden));
  el('howtoDone').addEventListener('click', () => {
    const st = LPK.load(); st.howtoSeen = true; LPK.save(st);
    setOpen(false);
    flashHint('It is under How this works whenever you want it back.');
  });
  el('howtoOpen').addEventListener('click', () => {
    setOpen(true);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function bindInvite() {
  const box = el('invite');
  if (!box) return;
  el('inviteGo').addEventListener('click', () => {
    LPKGate.open('wall', () => { box.hidden = true; });
  });
  el('inviteLater').addEventListener('click', () => {
    const s = LPK.load(); s.inviteDismissed = true; LPK.save(s);
    box.hidden = true;
  });
}

/* ---------------- session state, so practice resumes where it stopped ---------------- */
function saveSession() {
  const s = LPK.load();
  s.session = {
    piece: S.piece.id,
    cursor: Math.max(pickup(), Math.floor(S.cursor)),
    bpm: S.bpm,
    hand: S.hand,
    level: S.level,
    transpose: S.transpose,
    loop: S.loop,
    wait: S.wait, read: S.read, countIn: S.countIn, metronome: S.metronome,
    fingers: S.showFingers, letters: S.showLetters, names: S.showNames, accompany: S.accompany,
    at: Date.now()
  };
  LPK.save(s);
}

function restoreSession() {
  const saved = (LPK.load().session) || null;
  if (!saved || saved.piece !== S.piece.id) return false;
  S.bpm = saved.bpm || S.bpm;
  S.hand = saved.hand || 'both';
  if (saved.level >= 1 && saved.level <= 3) S.level = saved.level;
  S.transpose = saved.transpose || 0;
  S.loop = saved.loop || null;
  ['wait', 'read', 'countIn', 'metronome', 'accompany'].forEach(k => {
    if (typeof saved[k] === 'boolean') S[k] = saved[k];
  });
  if (typeof saved.fingers === 'boolean') S.showFingers = saved.fingers;
  if (typeof saved.letters === 'boolean') S.showLetters = saved.letters;
  if (typeof saved.names === 'boolean') S.showNames = saved.names;
  const end = S.piece.totalUnits;
  if (typeof saved.cursor === 'number' && saved.cursor > pickup() + 2 && saved.cursor < end - 2) {
    S.cursor = saved.cursor;
    return true;
  }
  return false;
}

function reflectControls() {
  el('bpm').value = S.bpm;
  el('bpmOut').textContent = S.bpm;
  updateTransposeUI();
  document.querySelectorAll('[data-level]').forEach(b => {
    b.addEventListener('click', () => {
      S.level = +b.dataset.level;
      document.querySelectorAll('[data-level]').forEach(x => {
        const on = x === b;
        x.classList.toggle('active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      S.results.clear();
      S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 };
      updateScores(); renderTrouble(); saveSession();
      flashHint(S.level === 1 ? 'Melody only, right hand.'
        : S.level === 2 ? 'Melody with one bass note under each bar.'
        : 'Both hands, the full arrangement.');
    });
  });

  document.querySelectorAll('[data-level]').forEach(b => {
    const on = +b.dataset.level === S.level;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  document.querySelectorAll('[data-hand]').forEach(b => {
    const on = b.dataset.hand === S.hand;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  const map = { waitMode: S.wait, readMode: S.read, countMode: S.countIn, metroMode: S.metronome,
                letterMode: S.showLetters, fingerMode: S.showFingers,
                nameMode: S.showNames, accompMode: S.accompany };
  Object.keys(map).forEach(id => {
    const b = el(id);
    if (!b) return;
    b.classList.toggle('active', !!map[id]);
    b.setAttribute('aria-pressed', String(!!map[id]));
  });
  el('keys').classList.toggle('hide-names', !S.showNames);
  el('readCard').classList.toggle('lit', S.read);
  if (S.loop) {
    el('loopOut').textContent = S.loop[0] < pickup()
      ? 'from pick-up'
      : `bars ${barOf(S.loop[0]) + 1}\u2013${barOf(S.loop[1] - 0.001) + 1}`;
  }
  paintBarStrip();
}

/* ---------------- hear your take ---------------- */
function playTake(withReference) {
  if (!S.take.length) { flashHint('Play a run first, then you can hear it back'); return; }
  if (S.takePlaying) return;
  stop();
  S.takePlaying = true;
  audio.resume();
  el('takeBadge').style.opacity = '1';
  el('takeBadge').textContent = withReference ? 'your take against the reference' : 'your take';

  const t0 = Math.min(...S.take.map(e => e.u));
  const timers = [];
  S.take.forEach(e => {
    const at = (e.u - t0) * unitSec() * 1000;
    timers.push(setTimeout(() => {
      audio.noteOn(e.m, 0.85);
      paintKey(e.m, true, null);
      setTimeout(() => { audio.noteOff(e.m); paintKey(e.m, false, null); }, (e.d || 1) * unitSec() * 1000);
    }, at));
  });

  let last = Math.max(...S.take.map(e => (e.u - t0) + (e.d || 1)));
  if (withReference) {
    activeNotes().forEach(n => {
      const at = (n.s - t0) * unitSec() * 1000;
      if (at < -50) return;
      timers.push(setTimeout(() => {
        audio.noteOn(tm(n), 0.3);
        setTimeout(() => audio.noteOff(tm(n)), n.d * unitSec() * 1000);
      }, at));
      last = Math.max(last, (n.s - t0) + n.d);
    });
  }

  setTimeout(() => {
    S.takePlaying = false;
    el('takeBadge').style.opacity = '0';
  }, last * unitSec() * 1000 + 700);
}

/* Show the learner the exact key to press, on the keyboard itself. */
let litTargets = [];
function paintNextKeys() {
  const want = [];
  if (S.playing && S.wait && S.waitingAt !== null) {
    activeNotes().forEach(n => {
      if (Math.abs(n.s - S.waitingAt) < 0.001 && !S.results.has(S.piece.notes.indexOf(n))) want.push({ m: tm(n), h: n.h });
    });
  }
  if (want.length === litTargets.length && want.every((t, i) => t.m === litTargets[i].m && t.h === litTargets[i].h)) return;
  litTargets.forEach(t => { const k = kb && kb.keys.get(t.m); if (k) k.classList.remove('target', 't-l', 't-r'); });
  litTargets = want;
  litTargets.forEach(t => { const k = kb && kb.keys.get(t.m); if (k) k.classList.add('target', t.h === 'l' ? 't-l' : 't-r'); });
}

/* Plain English, always on screen, saying what to do right now. */
const FINGER_NAMES = { 1: 'thumb', 2: 'index finger', 3: 'middle finger', 4: 'ring finger', 5: 'little finger' };
let lastCoach = '';
function updateCoach() {
  const box = el('coach');
  if (!box) return;
  let msg;

  if (S.takePlaying) {
    msg = 'Listening back to what you just played.';
  } else if (!S.playing) {
    msg = S.cursor > pickup() + 2
      ? 'Paused. Press Play to carry on, or Restart to go back to the beginning.'
      : 'Press Play when you are ready. Nothing will run away from you.';
  } else if (S.countInUntil !== null && S.cursor < S.countInUntil) {
    msg = 'Counting you in. Get your hands on the keys.';
  } else if (S.waitingAt !== null) {
    const pending = activeNotes().filter(n =>
      Math.abs(n.s - S.waitingAt) < 0.001 && !S.results.has(S.piece.notes.indexOf(n)));
    if (pending.length === 1) {
      const n = pending[0];
      const hand = n.h === 'l' ? 'left' : 'right';
      const finger = n.f ? ' with your ' + hand + ' ' + FINGER_NAMES[n.f] : ' with your ' + hand + ' hand';
      msg = 'Waiting for you: play ' + pitchClass(tm(n)) + finger + '. It is glowing on the keyboard.';
    } else if (pending.length > 1) {
      msg = 'Waiting for you: play ' + pending.map(n => pitchClass(tm(n))).join(' and ') +
            ' together. Both are glowing on the keyboard.';
    } else {
      msg = 'Keep going.';
    }
  } else if (S.read) {
    msg = 'Read mode. The blocks are hidden, so play from the music above.';
  } else {
    msg = 'Follow the blocks down to the keys. Take your time.';
  }

  if (msg !== lastCoach) { box.textContent = msg; lastCoach = msg; }
}

/* ---------------- falling note roll ---------------- */
function drawRoll() {
  const w = rollCv.clientWidth, h = rollCv.clientHeight;
  rollCx.clearRect(0, 0, w, h);

  rollCx.lineWidth = 1;
  kb.whites.forEach((m, i) => {
    const x = (i * kb.whiteWidth) / 100 * w;
    rollCx.strokeStyle = pitchClass(m) === 'C' ? 'rgba(212,163,67,.14)' : 'rgba(244,237,226,.05)';
    rollCx.beginPath(); rollCx.moveTo(x, 0); rollCx.lineTo(x, h); rollCx.stroke();
  });

  rollCx.strokeStyle = 'rgba(212,163,67,.55)';
  rollCx.lineWidth = 2;
  rollCx.beginPath(); rollCx.moveTo(0, h - 1); rollCx.lineTo(w, h - 1); rollCx.stroke();

  if (S.countInUntil !== null && S.cursor < S.countInUntil && S.playing) {
    const beatsLeft = Math.ceil((S.countInUntil - S.cursor) / (S.piece.meter[1] === 8 ? 2 : 4));
    rollCx.fillStyle = 'rgba(212,163,67,.9)';
    rollCx.font = '600 40px "Bodoni Moda", Georgia, serif';
    rollCx.textAlign = 'center';
    rollCx.fillText(beatsLeft, w / 2, h / 2);
    rollCx.fillStyle = 'rgba(167,154,140,.7)';
    rollCx.font = '12px "IBM Plex Mono", monospace';
    rollCx.fillText('count in', w / 2, h / 2 + 24);
    return;
  }

  if (S.read) {
    rollCx.fillStyle = 'rgba(167,154,140,.55)';
    rollCx.font = '13px "IBM Plex Mono", monospace';
    rollCx.textAlign = 'center';
    rollCx.fillText('READ MODE · notes hidden, play from the staff', w / 2, h / 2);
    return;
  }

  /* An idle panel should never be a blank black rectangle. */
  if (!S.playing) {
    rollCx.textAlign = 'center';
    rollCx.fillStyle = 'rgba(212,163,67,.85)';
    rollCx.font = '600 15px "Instrument Sans", system-ui, sans-serif';
    rollCx.fillText('Press Play to begin', w / 2, 34);
    rollCx.fillStyle = 'rgba(167,154,140,.7)';
    rollCx.font = '12px "IBM Plex Mono", monospace';
    rollCx.fillText('blocks fall to the keys below · rose is your right hand, blue your left', w / 2, 56);
  }

  const px = h / LOOKAHEAD;
  S.piece.notes.forEach((n, i) => {
    if (!inLevel(n)) return;
    const rel = n.s - S.cursor;
    if (rel > LOOKAHEAD || rel + n.d < -1) return;
    const midi = tm(n);
    const isActive = S.hand === 'both' || n.h === S.hand;
    const x = kb.xOf(midi) / 100 * w;
    const bw = (isBlack(midi) ? kb.whiteWidth * 0.62 : kb.whiteWidth * 0.86) / 100 * w;
    const y = h - rel * px;
    const nh = Math.max(10, n.d * px);
    const top = y - nh;
    const res = S.results.get(i);

    /* Hue always means the hand, never the outcome. Colouring a missed
       left-hand note red made it look like a right-hand note, which broke
       the one piece of information the colours are there to carry. */
    const handColour = n.h === 'l' ? HAND_L : HAND_R;
    rollCx.fillStyle = isActive ? handColour : 'rgba(167,154,140,.22)';
    rollCx.globalAlpha = !isActive ? 1
      : res && !res.hit ? 0.4
      : rel < 0 ? 0.5 : 1;
    roundRect(rollCx, x - bw / 2, top, bw, nh, 4);
    rollCx.fill();

    if (isActive && res) {
      rollCx.globalAlpha = 1;
      rollCx.lineWidth = 2;
      rollCx.strokeStyle = res.hit ? GOOD : FELT;
      roundRect(rollCx, x - bw / 2 + 1, top + 1, bw - 2, nh - 2, 4);
      rollCx.stroke();
    }

    if (isActive && rel < LOOKAHEAD - 1) {
      rollCx.globalAlpha = 1;
      rollCx.fillStyle = 'rgba(20,16,15,.92)';
      rollCx.textAlign = 'center';
      if (S.showLetters && nh > 14) {
        rollCx.font = '700 11px "IBM Plex Mono", monospace';
        rollCx.fillText(n.h === 'l' ? 'L' : 'R', x, top + 13);
      }
      if (S.showFingers && n.f && nh > (S.showLetters ? 30 : 16)) {
        rollCx.font = '700 11px "IBM Plex Mono", monospace';
        rollCx.fillText(n.f, x, top + nh - 6);
      }
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
/* One routine draws the live staff and the printable score. */
function paintSystem(c, o) {
  const gap = o.gap, padL = o.x, w = o.w;
  const trebleBottom = o.y;
  const bassBottom = o.y + gap * 8.2;
  const ink = o.light ? 'rgba(20,16,15,.85)' : 'rgba(244,237,226,.28)';
  const inkStrong = o.light ? '#14100F' : 'rgba(244,237,226,.45)';

  c.strokeStyle = ink; c.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    [trebleBottom, bassBottom].forEach(base => {
      const y = base - i * gap;
      c.beginPath(); c.moveTo(padL, y + .5); c.lineTo(padL + w, y + .5); c.stroke();
    });
  }
  c.beginPath();
  c.moveTo(padL - 10, trebleBottom - 4 * gap);
  c.lineTo(padL - 10, bassBottom);
  c.strokeStyle = inkStrong; c.lineWidth = 2; c.stroke();

  drawTrebleClef(c, padL + 18, trebleBottom - gap, gap, o.light);
  drawBassClef(c, padL + 16, bassBottom - 3 * gap, gap, o.light);

  const span = o.toUnit - o.fromUnit;
  const usable = w - 44;
  const xAt = u => padL + 44 + ((u - o.fromUnit) / span) * usable;

  c.strokeStyle = ink; c.lineWidth = 1;
  for (let u = o.fromUnit; u <= o.toUnit + 0.001; u += S.piece.barUnits) {
    if (u === o.fromUnit) continue;
    const x = xAt(u);
    c.beginPath();
    c.moveTo(x, trebleBottom - 4 * gap); c.lineTo(x, trebleBottom);
    c.moveTo(x, bassBottom - 4 * gap); c.lineTo(x, bassBottom);
    c.stroke();
  }

  if (o.cursor !== undefined && o.cursor >= o.fromUnit && o.cursor <= o.toUnit) {
    c.strokeStyle = 'rgba(212,163,67,.5)'; c.lineWidth = 2;
    const x = xAt(o.cursor);
    c.beginPath();
    c.moveTo(x, trebleBottom - 4 * gap - 8);
    c.lineTo(x, bassBottom + 8);
    c.stroke();
  }

  S.piece.notes.forEach((n, i) => {
    if (!inLevel(n) || n.s < o.fromUnit || n.s >= o.toUnit) return;
    const midi = tm(n);
    const isActive = o.light || S.hand === 'both' || n.h === S.hand;
    const treble = midi >= 60 || n.h === 'r';
    const base = treble ? trebleBottom : bassBottom;
    const ref = treble ? diatonic(64) : diatonic(43);
    const y = base - (diatonic(midi) - ref) * (gap / 2);
    const x = xAt(n.s);
    const res = o.light ? null : S.results.get(i);

    c.strokeStyle = ink;
    for (let ly = base + gap; ly <= y + 0.1; ly += gap) {
      c.beginPath(); c.moveTo(x - 9, ly + .5); c.lineTo(x + 9, ly + .5); c.stroke();
    }
    for (let ly = base - 5 * gap; ly >= y - 0.1; ly -= gap) {
      c.beginPath(); c.moveTo(x - 9, ly + .5); c.lineTo(x + 9, ly + .5); c.stroke();
    }

    const colour = o.light ? '#14100F'
      : !isActive ? 'rgba(167,154,140,.3)'
      : (n.h === 'l' ? HAND_L : HAND_R);

    c.save();
    c.globalAlpha = (res && !res.hit && !o.light) ? 0.45 : 1;
    c.translate(x, y); c.rotate(-0.32);
    c.beginPath();
    c.ellipse(0, 0, gap * 0.6, gap * 0.44, 0, 0, Math.PI * 2);
    c.fillStyle = colour; c.strokeStyle = colour; c.lineWidth = 1.6;
    if (n.d >= S.piece.barUnits * 1.2) c.stroke(); else c.fill();
    c.restore();
    c.globalAlpha = 1;

    c.strokeStyle = colour; c.lineWidth = 1.4;
    const up = y > base - 2 * gap;
    c.beginPath();
    c.moveTo(x + (up ? gap * 0.55 : -gap * 0.55), y);
    c.lineTo(x + (up ? gap * 0.55 : -gap * 0.55), y + (up ? -gap * 2.7 : gap * 2.7));
    c.stroke();

    if (res && !o.light) {
      c.globalAlpha = 1;
      c.fillStyle = res.hit ? GOOD : FELT;
      c.beginPath();
      c.arc(x, base - 5.6 * gap, 2.4, 0, Math.PI * 2);
      c.fill();
    }

    if (needsSharp(midi)) {
      c.fillStyle = o.light ? '#14100F' : (isActive ? 'rgba(244,237,226,.85)' : 'rgba(167,154,140,.35)');
      c.font = `${Math.round(gap * 1.55)}px "IBM Plex Mono", monospace`;
      c.textAlign = 'right';
      c.fillText('\u266F', x - gap, y + gap * 0.55);
    }
    if (o.names && isActive) {
      c.fillStyle = o.light ? 'rgba(20,16,15,.55)' : 'rgba(167,154,140,.65)';
      c.font = `${Math.round(gap * 1.05)}px "IBM Plex Mono", monospace`;
      c.textAlign = 'center';
      c.fillText(pitchClass(midi), x, bassBottom + gap * 2.4);
    }
    if (o.fingers && n.f) {
      c.fillStyle = o.light ? 'rgba(20,16,15,.7)' : 'rgba(212,163,67,.8)';
      c.font = `${Math.round(gap * 1.05)}px "IBM Plex Mono", monospace`;
      c.textAlign = 'center';
      c.fillText(n.f, x, (treble ? trebleBottom - 5 * gap : y + gap * 2));
    }
  });
}

function drawStaff() {
  const w = staffCv.clientWidth, h = staffCv.clientHeight;
  staffCx.clearRect(0, 0, w, h);
  if (!w || !h) return;
  const bu = S.piece.barUnits;
  const barIdx = Math.max(0, barOf(S.cursor));
  const from = barStart(barIdx);
  paintSystem(staffCx, {
    x: 62, y: 44, w: w - 78, gap: 9,
    fromUnit: from, toUnit: from + bu * 2,
    cursor: S.cursor, names: S.showNames, fingers: false, light: false
  });
}

function drawTrebleClef(c, x, y, gap, light) {
  const s = gap / 9;
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = light ? '#14100F' : 'rgba(244,237,226,.75)';
  c.lineWidth = 2.1; c.lineCap = 'round';
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

function drawBassClef(c, x, y, gap, light) {
  const s = gap / 9;
  c.save(); c.translate(x, y); c.scale(s, s);
  const col = light ? '#14100F' : 'rgba(244,237,226,.75)';
  c.strokeStyle = col; c.fillStyle = col;
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
  h._t = setTimeout(() => h.classList.remove('show'), 1600);
}

function updateTransposeUI() {
  const t = S.transpose;
  el('transOut').textContent = t === 0 ? 'concert' : (t > 0 ? '+' + t : String(t));
  el('transKey').textContent = t === 0 ? S.piece.keyName : `sounds ${Math.abs(t)} semitone${Math.abs(t) === 1 ? '' : 's'} ${t > 0 ? 'higher' : 'lower'}`;
}

function bindControls() {
  el('playBtn').addEventListener('click', () => S.playing ? stop() : start());
  el('restartBtn').addEventListener('click', restart);
  el('shareLinkBtn').addEventListener('click', () => {
    LPKShare.shareLink(`https://learnpianokeys.com/app.html?piece=${S.piece.id}`,
      `Play ${S.piece.title} free`,
      `${S.piece.title} with wait mode, looping and fingering, free at Learn Piano Keys`);
  });
  el('takeBtn').addEventListener('click', () => playTake(false));
  el('takeRefBtn').addEventListener('click', () => playTake(true));

  el('bpm').addEventListener('input', e => {
    S.bpm = +e.target.value;
    el('bpmOut').textContent = S.bpm;
  });

  el('transDown').addEventListener('click', () => { S.transpose = Math.max(-6, S.transpose - 1); updateTransposeUI(); });
  el('transUp').addEventListener('click', () => { S.transpose = Math.min(6, S.transpose + 1); updateTransposeUI(); });

  document.querySelectorAll('[data-level]').forEach(b => {
    b.addEventListener('click', () => {
      S.level = +b.dataset.level;
      document.querySelectorAll('[data-level]').forEach(x => {
        const on = x === b;
        x.classList.toggle('active', on);
        x.setAttribute('aria-pressed', String(on));
      });
      S.results.clear();
      S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 };
      updateScores(); renderTrouble(); saveSession();
      flashHint(S.level === 1 ? 'Melody only, right hand.'
        : S.level === 2 ? 'Melody with one bass note under each bar.'
        : 'Both hands, the full arrangement.');
    });
  });

  document.querySelectorAll('[data-hand]').forEach(b => {
    b.addEventListener('click', () => {
      S.hand = b.dataset.hand;
      document.querySelectorAll('[data-hand]').forEach(x => {
        x.classList.toggle('active', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      S.results.clear();
      S.session = { notes: 0, hit: 0, timing: 0, literacyNotes: 0, literacyHit: 0 };
      updateScores();
      renderTrouble();
    });
  });

  const toggles = [
    ['waitMode', v => S.wait = v, () => S.wait],
    ['readMode', v => { S.read = v; el('readCard').classList.toggle('lit', v); }, () => S.read],
    ['letterMode', v => S.showLetters = v, () => S.showLetters],
    ['fingerMode', v => S.showFingers = v, () => S.showFingers],
    ['nameMode', v => { S.showNames = v; el('keys').classList.toggle('hide-names', !v); }, () => S.showNames],
    ['metroMode', v => S.metronome = v, () => S.metronome],
    ['countMode', v => S.countIn = v, () => S.countIn],
    ['accompMode', v => S.accompany = v, () => S.accompany],
    ['pedalMode', v => audio.setSustain(v), () => audio.sustain],
    ['micMode', v => toggleMic(v), () => S.mic]
  ];
  toggles.forEach(([id, set, get]) => {
    const b = el(id);
    if (!b) return;
    b.classList.toggle('active', get());
    b.setAttribute('aria-pressed', String(get()));
    b.addEventListener('click', () => {
      const next = !b.classList.contains('active');
      set(next);
      b.classList.toggle('active', next);
      b.setAttribute('aria-pressed', String(next));
    });
  });

  el('micBadge').addEventListener('click', () => el('micMode').click());

  el('clearLoop').addEventListener('click', () => {
    S.loop = null;
    el('loopOut').textContent = 'off';
    paintBarStrip();
  });

  el('resetProgress').addEventListener('click', () => {
    if (!confirm('Clear your saved streak and best scores on this device?')) return;
    LPK.clear();
    practiceMarked = false;
    sessionCounted = false;
    if (typeof LPKGate !== 'undefined') LPKGate.paintAccount();
    renderProgress();
    flashHint('Saved progress cleared');
  });
}

document.addEventListener('DOMContentLoaded', boot);
