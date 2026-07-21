/* Learn Piano Keys - runtime smoke test
   node tools/smoke.js

   tools/tests.js checks the files. This one actually RUNS them: it loads each
   page in a DOM, executes every script in order, boots the app, and clicks
   every button.

   It exists because `node --check` only validates syntax. A refactor once
   deleted the practice room's entire state object and every helper function,
   and the syntax check passed happily while the page was completely dead in a
   real browser. Nothing but executing the code catches that. */

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let fails = 0, checks = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { fails++; console.log('  FAIL  ' + label); }
}
function head(t) { console.log('\n' + t); }

/* A 2D context that swallows everything. Enough to catch reference errors,
   bad arguments and undefined variables inside the drawing code. */
function fakeCtx() {
  const noop = () => {};
  const ctx = {
    canvas: { width: 800, height: 300 },
    setTransform: noop, clearRect: noop, fillRect: noop, strokeRect: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop,
    arcTo: noop, ellipse: noop, bezierCurveTo: noop, quadraticCurveTo: noop,
    rect: noop, fill: noop, stroke: noop, save: noop, restore: noop,
    translate: noop, rotate: noop, scale: noop, clip: noop,
    fillText: noop, strokeText: noop,
    measureText: () => ({ width: 10 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: noop, drawImage: noop
  };
  ['fillStyle','strokeStyle','lineWidth','font','textAlign','textBaseline',
   'globalAlpha','lineCap','lineJoin'].forEach(k => { ctx[k] = ''; });
  return ctx;
}

function boot(file, opts = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message + (e.detail ? ' :: ' + e.detail : '')));
  vc.on('error', (...a) => errors.push(a.join(' ')));

  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, file), 'utf8'), {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    url: 'https://learnpianokeys.com/' + (file === 'index.html' ? '' : file) + (opts.query || ''),
    virtualConsole: vc
  });

  const w = dom.window;

  // stubs for things jsdom does not implement
  w.HTMLCanvasElement.prototype.getContext = fakeCtx;
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAA';
  w.innerWidth = opts.width || 1200;
  w.matchMedia = q => ({ matches: /max-width:\s*(\d+)/.test(q)
      ? (opts.width || 1200) <= parseInt(RegExp.$1, 10) : false,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  w.requestAnimationFrame = () => 0;   // one pass only, no infinite loop
  w.cancelAnimationFrame = () => {};
  w.fetch = () => Promise.resolve({ json: () => Promise.resolve({ ok: true, known: false }) });
  w.confirm = () => false;
  w.open = () => null;
  w.scrollTo = () => {};
  w.Element.prototype.scrollIntoView = function () {};
  w.alert = () => {};
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'running';
      this.destination = {}; }
    createGain() { return gainNode(); }
    createOscillator() { return { type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {}, disconnect() {} }; }
    createBiquadFilter() { return { type: '', frequency: { value: 0 }, Q: { value: 0 }, connect() {}, disconnect() {} }; }
    createConvolver() { return { buffer: null, connect() {}, disconnect() {} }; }
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len), length: len }; }
    createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {}, disconnect() {} }; }
    createAnalyser() { return { fftSize: 2048, getFloatTimeDomainData() {}, connect() {}, disconnect() {} }; }
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
    resume() { return Promise.resolve(); }
  }
  function gainNode() {
    const p = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {},
                exponentialRampToValueAtTime() {}, cancelScheduledValues() {} };
    return { gain: p, connect() {}, disconnect() {} };
  }
  w.AudioContext = FakeAudioContext;
  w.webkitAudioContext = FakeAudioContext;
  Object.defineProperty(w.navigator, 'mediaDevices', {
    value: { getUserMedia: () => Promise.reject(new Error('no mic in test')) }, configurable: true
  });

  // Run every script tag in document order. They must be evaluated together,
  // because separate <script> tags in a browser share one global lexical scope:
  // a top-level `const` in one file IS visible to the next. Evaluating them one
  // eval() at a time would give each its own scope and hide real breakage.
  const srcs = [...dom.window.document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
  const bundle = srcs.map(src => {
    const f = path.join(ROOT, src.split('?')[0].replace(/^\//, ''));
    return `/* ${src} */\n` + fs.readFileSync(f, 'utf8');
  }).join('\n;\n');
  try { w.eval(bundle); }
  catch (e) {
    errors.push(e.message);
    // attribute it: find the first file that fails on its own
    srcs.forEach(src => {
      const f = path.join(ROOT, src.split('?')[0].replace(/^\//, ''));
      try { new Function(fs.readFileSync(f, 'utf8')); }
      catch (e2) { errors.push(`${src}: ${e2.message}`); }
    });
  }

  // fire DOMContentLoaded so anything waiting on it runs
  try {
    const ev = new w.Event('DOMContentLoaded', { bubbles: true });
    w.document.dispatchEvent(ev);
  } catch (e) { errors.push('DOMContentLoaded: ' + e.message); }

  return { dom, w, doc: w.document, errors };
}

/* ---------- every page loads without throwing ---------- */
head('page boot');
const PAGES = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const booted = {};
PAGES.forEach(p => {
  const r = boot(p);
  booted[p] = r;
  ok(r.errors.length === 0, `${p}: loads with no script errors` +
    (r.errors.length ? '\n          ' + r.errors.slice(0, 3).join('\n          ') : ''));
});

/* ---------- the practice room actually builds itself ---------- */
head('practice room');
{
  const { doc, errors } = booted['app.html'];
  ok(errors.length === 0, 'app.html: no errors during boot');
  const sel = doc.getElementById('pieceSel');
  ok(sel && sel.options.length >= 3, `piece selector is populated (${sel ? sel.options.length : 0} options)`);
  const keys = doc.getElementById('keys');
  ok(keys && keys.children.length > 20, `keyboard rendered (${keys ? keys.children.length : 0} keys)`);
  ok(doc.getElementById('pieceTitle').textContent.trim().length > 3, 'piece title filled in');
  ok(doc.getElementById('pieceMeta').textContent.trim().length > 3, 'piece meta filled in');
  ok(doc.getElementById('pieceTip').textContent.trim().length > 10, 'teacher note filled in');
  ok(doc.getElementById('bars').children.length > 3, 'bar strip built');
  ok(doc.getElementById('trouble').innerHTML.trim().length > 10, 'trouble panel has its empty state');
  ok(!/Checking for MIDI/.test(doc.getElementById('midiBadge').textContent),
    'MIDI badge resolved away from its placeholder');
}

/* ---------- the beginner lesson builds itself ---------- */
head('beginner lesson');
{
  const { doc, errors } = booted['piano-keys-for-beginners.html'];
  ok(errors.length === 0, 'no errors during boot');
  const keys = doc.getElementById('lessonKeys');
  ok(keys && keys.children.length >= 12, `one octave rendered (${keys ? keys.children.length : 0} keys)`);
  ok(doc.getElementById('stepTitle').textContent.trim().length > 3, 'step title filled in');
  ok(doc.getElementById('stepBody').textContent.trim().length > 20, 'step body filled in');
  ok(doc.getElementById('stepKicker').textContent.includes('Step 1'), 'starts at step 1');
  ok(doc.getElementById('stepNext').disabled === true, 'Next starts locked');
}

/* ---------- the tools build themselves ---------- */
head('tools');
{
  const { doc, errors } = booted['tools.html'];
  ok(errors.length === 0, 'no errors during boot');
  ok(doc.getElementById('chordRoot').options.length === 12, 'chord roots populated');
  ok(doc.getElementById('chordType').options.length > 8, 'chord types populated');
  ok(doc.getElementById('scaleType').options.length > 5, 'scale types populated');
  ok(doc.getElementById('chordKeys').children.length > 10, 'chord keyboard rendered');
  ok(doc.getElementById('scaleKeys').children.length > 10, 'scale keyboard rendered');
  ok(doc.getElementById('quizKeys').children.length > 10, 'quiz keyboard rendered');
  ok(doc.getElementById('chordNotes').textContent.includes('C'), 'chord notes computed');
  ok(doc.getElementById('beatLights').children.length === 4, 'metronome beat lights drawn');
}

/* ---------- the tracker builds itself ---------- */
head('practice tracker');
{
  const { doc, errors } = booted['practice.html'];
  ok(errors.length === 0, 'no errors during boot');
  ok(doc.getElementById('timerClock').textContent === '00:00', 'away-from-app timer starts at zero');
  ok(!!doc.getElementById('progChart'), 'minutes chart canvas present');
  ok(doc.querySelectorAll('[data-range]').length === 4, 'four range buttons present');
  ['60', '90', 'all', '30'].forEach(mode => {
    doc.querySelector(`[data-range="${mode}"]`).click();
    ok(doc.querySelector(`[data-range="${mode}"]`).getAttribute('aria-pressed') === 'true',
      `range button ${mode} takes the selection`);
  });
  ok(/land here on their own|minutes over/.test(doc.getElementById('progNote').textContent),
    'chart note painted for the current range');
  ok(doc.getElementById('bestList').innerHTML.trim().length > 10, 'best scores panel has its empty state');
  ok(!!doc.getElementById('rangeFrom') && !!doc.getElementById('rangeTo'), 'custom date pickers present');
}

/* ---------- the reading page builds itself ---------- */
head('how to read music');
{
  const { doc, w, errors } = booted['how-to-read-music.html'];
  ok(errors.length === 0, 'no errors during boot');
  ok(doc.getElementById('trainerKeys').children.length > 15,
    `trainer keyboard rendered (${doc.getElementById('trainerKeys').children.length} keys)`);
  ok(doc.getElementById('trainerClef').options.length === 3, 'clef choices populated');
  ok(doc.getElementById('trainerAcc').options.length === 2, 'accidental choices populated');
  ok(doc.getElementById('trainerBest').textContent.trim().length > 0, 'best run reads from the store');
  ['anatomyStave', 'trebleLinesStave', 'trebleSpacesStave', 'bassLinesStave', 'bassSpacesStave', 'ledgerStave']
    .forEach(id => ok(!!doc.getElementById(id), `diagram canvas present: #${id}`));

  // starting the trainer must actually pose a question
  doc.getElementById('trainerStart').click();
  ok(/Play this note/.test(doc.getElementById('trainerAsk').textContent),
    'pressing Start asks for a note');
  // and every "hear this" button must fire without throwing
  let heardErrors = 0;
  [...doc.querySelectorAll('[data-hear]')].forEach(b => {
    try { b.click(); } catch (e) { heardErrors++; }
  });
  ok(heardErrors === 0, 'every listen button plays without throwing');
}

/* ---------- every button responds without throwing ---------- */
head('every control');
PAGES.forEach(p => {
  const { doc, w } = booted[p];
  const clickErrors = [];
  const onErr = e => clickErrors.push(e.message || String(e));
  w.addEventListener('error', onErr);

  const controls = [...doc.querySelectorAll('button')];
  controls.forEach(btn => {
    if (btn.id === 'resetProgress' || btn.id === 'clearAll') return;   // confirm() returns false anyway
    try { btn.click(); }
    catch (e) { clickErrors.push(`#${btn.id || btn.className}: ${e.message}`); }
  });

  // and every select fires its change handler on each option
  [...doc.querySelectorAll('select')].forEach(sel => {
    [...sel.options].slice(0, 4).forEach(o => {
      try {
        sel.value = o.value;
        sel.dispatchEvent(new w.Event('change', { bubbles: true }));
      } catch (e) { clickErrors.push(`select#${sel.id}=${o.value}: ${e.message}`); }
    });
  });

  ok(clickErrors.length === 0, `${p}: ${controls.length} buttons and every select respond cleanly` +
    (clickErrors.length ? '\n          ' + clickErrors.slice(0, 4).join('\n          ') : ''));
});

/* ---------- narrow screens get a smaller keyboard, not a squashed one ---------- */
head('small screen');
{
  const r = boot('app.html', { width: 390 });
  ok(r.errors.length === 0, 'app.html boots at 390px');
  const keys = r.doc.getElementById('keys');
  const n = keys ? keys.children.length : 0;
  ok(n > 10 && n < 40, `keyboard reduced for a narrow screen (${n} keys, desktop shows more)`);
}

/* ---------- the deep link from the homepage works ---------- */
head('deep links');
['twinkle', 'ode-to-joy', 'fur-elise'].forEach(id => {
  const r = boot('app.html', { query: '?piece=' + id });
  ok(r.errors.length === 0, `?piece=${id} boots cleanly`);
  const t = r.doc.getElementById('pieceTitle').textContent.trim();
  ok(t.length > 3, `?piece=${id} loads a piece (${t})`);
});

console.log(`\n${checks - fails}/${checks} runtime checks passed`);
if (fails) { console.log(`${fails} FAILING`); process.exit(1); }
console.log('all clear');
process.exit(0);
