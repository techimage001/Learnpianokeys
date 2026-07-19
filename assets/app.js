/* Learn Piano Keys - practice engine */

const audio = new PianoAudio();
let detector = null;

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
    loadPiece();
  });
}

function loadPiece() {
  stop();
  S.cursor = pickup() - 4;
  S.results.clear();
  S.loop = null;
  S.take = [];
  S.transpose = 0;
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
    badge.className = 'badge warn';
    return;
  }
  navigator.requestMIDIAccess().then(access => {
    const attach = () => {
      const inputs = [...access.inputs.values()];
      inputs.forEach(i => { i.onmidimessage = onMidi; });
      badge.textContent = inputs.length ? `MIDI: ${inputs[0].name}` : 'MIDI ready. Plug in a keyboard';
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
    badge.className = 'badge';
    return;
  }
  audio.resume();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    badge.textContent = 'No microphone access in this browser';
    badge.className = 'badge warn';
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
    badge.className = 'badge warn';
  } catch (err) {
    badge.textContent = 'Microphone permission refused';
    badge.className = 'badge warn';
    el('micMode').classList.remove('active');
    el('micMode').setAttribute('aria-pressed', 'false');
  }
}

/* ---------------- player note handling ---------------- */
function playerNoteOn(midi, fromUser, vel = 0.85) {
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

function updateScores() {
  const n = S.session.notes;
  const acc = n ? Math.round(S.session.hit / n * 100) : 0;
  const tim = S.session.hit ? Math.round(S.session.timing / S.session.hit * 100) : 0;
  const lit = S.session.literacyNotes ? Math.round(S.session.literacyHit / S.session.literacyNotes * 100) : 0;
  el('accVal').textContent = n ? acc + '%' : '·';
  el('timVal').textContent = S.session.hit ? tim + '%' : '·';
  el('litVal').textContent = S.session.literacyNotes ? lit + '%' : '·';
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
    if (LPKGate.shouldBlock()) { LPKGate.open(() => { sessionCounted = false; start(); }); return; }
    if (!sessionCounted) { sessionCounted = true; LPKGate.countSession(); }
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
  if (kb) kb.keys.forEach(k => k.classList.remove('on', 'lh', 'rh'));
  const b = el('playBtn');
  if (b) { b.textContent = 'Play'; b.classList.remove('is-playing'); }
  if (wasPlaying) { recordBest(); renderTrouble(); say('Paused'); }
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
          if (n.h === S.hand || n._p) return;
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

  const px = h / LOOKAHEAD;
  S.piece.notes.forEach((n, i) => {
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

    let fill = n.h === 'l' ? '#6FA3C0' : '#C9605C';
    if (!isActive) fill = 'rgba(167,154,140,.22)';
    else if (res && res.hit) fill = '#7FA86F';
    else if (res && !res.hit) fill = 'rgba(158,59,69,.55)';

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
    if (n.s < o.fromUnit || n.s >= o.toUnit) return;
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
      : res && res.hit ? '#7FA86F'
      : res && !res.hit ? '#9E3B45'
      : (n.h === 'l' ? '#6FA3C0' : '#C9605C');

    c.save();
    c.translate(x, y); c.rotate(-0.32);
    c.beginPath();
    c.ellipse(0, 0, gap * 0.6, gap * 0.44, 0, 0, Math.PI * 2);
    c.fillStyle = colour; c.strokeStyle = colour; c.lineWidth = 1.6;
    if (n.d >= S.piece.barUnits * 1.2) c.stroke(); else c.fill();
    c.restore();

    c.strokeStyle = colour; c.lineWidth = 1.4;
    const up = y > base - 2 * gap;
    c.beginPath();
    c.moveTo(x + (up ? gap * 0.55 : -gap * 0.55), y);
    c.lineTo(x + (up ? gap * 0.55 : -gap * 0.55), y + (up ? -gap * 2.7 : gap * 2.7));
    c.stroke();

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

/* ---------------- printable score ---------------- */
function buildScoreImage() {
  const bu = S.piece.barUnits;
  const barsPerSystem = bu <= 6 ? 6 : 4;
  const off = pickup() > 0 ? 1 : 0;
  const totalBars = barCount() + off;
  const systems = Math.ceil(totalBars / barsPerSystem);

  const W = 1240, gap = 13, sysH = 190, top = 190;
  const H = top + systems * sysH + 80;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);

  c.fillStyle = '#14100F';
  c.textAlign = 'center';
  c.font = '600 40px "Bodoni Moda", Georgia, serif';
  c.fillText(S.piece.title, W / 2, 74);
  c.font = '18px "Instrument Sans", system-ui, sans-serif';
  c.fillStyle = 'rgba(20,16,15,.65)';
  c.fillText(`${S.piece.composer} · ${S.piece.origin}`, W / 2, 104);
  c.font = '14px "IBM Plex Mono", monospace';
  c.fillText(`${S.piece.keyName} · ${S.piece.meter.join('/')} · quarter = ${S.bpm}`, W / 2, 130);

  for (let sIdx = 0; sIdx < systems; sIdx++) {
    const firstBar = sIdx * barsPerSystem;
    const fromUnit = (firstBar === 0 && off) ? 0 : barStart(firstBar - off);
    const lastBar = Math.min(totalBars, firstBar + barsPerSystem);
    const toUnit = barStart(lastBar - off);
    paintSystem(c, {
      x: 80, y: top + sIdx * sysH, w: W - 160, gap,
      fromUnit, toUnit: Math.max(toUnit, fromUnit + bu),
      names: false, fingers: true, light: true
    });
  }

  c.textAlign = 'center';
  c.font = '13px "IBM Plex Mono", monospace';
  c.fillStyle = 'rgba(20,16,15,.5)';
  c.fillText('learnpianokeys.com · public domain · fingering shown above the staff', W / 2, H - 34);

  return cv.toDataURL('image/png');
}

/* Open in a new tab so the score can be SEEN before saving, printing or
   sharing, on desktop and on mobile. Never auto-route into a share sheet. */
function printScore() {
  const url = buildScoreImage();
  const win = window.open('', '_blank');
  if (!win) { flashHint('Allow pop-ups to open the printable score'); return; }
  win.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${S.piece.title} · sheet music</title>` +
    `<style>body{margin:0;background:#f5f2ec;font:16px system-ui;text-align:center}` +
    `img{max-width:100%;height:auto;background:#fff;box-shadow:0 2px 24px rgba(0,0,0,.15);margin:18px auto;display:block}` +
    `button{font:inherit;padding:10px 18px;margin:14px;border:0;border-radius:8px;background:#14100F;color:#F4EDE2;cursor:pointer}` +
    `@media print{button{display:none}body{background:#fff}img{box-shadow:none;margin:0}}</style></head><body>` +
    `<button onclick="window.print()">Print or save as PDF</button>` +
    `<img src="${url}" alt="${S.piece.title} sheet music"></body></html>`
  );
  win.document.close();
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
  el('printBtn').addEventListener('click', printScore);

  el('shareScoreBtn').addEventListener('click', () => {
    const url = buildScoreImage();
    const slug = S.piece.id;
    LPKShare.shareImage(url, `learnpianokeys-${slug}-sheet-music.png`,
      `${S.piece.title} sheet music`,
      `${S.piece.title} by ${S.piece.composer}, free sheet music from learnpianokeys.com`);
  });

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
    renderProgress();
    flashHint('Saved progress cleared');
  });
}

document.addEventListener('DOMContentLoaded', boot);
