/* Learn Piano Keys - practice tools
   Chords and scales are computed from intervals, not read from a table of
   answers, so any root works and the same engine can drive future pages. */

(function () {
  if (!document.getElementById('chordKeys')) return;
  var audio = new PianoAudio();
  var ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  function fill(sel, items) {
    items.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t; o.textContent = t;
      sel.appendChild(o);
    });
  }
  function light(kb, midis) {
    kb.keys.forEach(function (k) { k.classList.remove('lit'); });
    midis.forEach(function (m) { if (kb.keys.has(m)) kb.keys.get(m).classList.add('lit'); });
  }
  function playSeq(midis, gap, together) {
    audio.resume();
    if (together) { midis.forEach(function (m) { audio.noteOn(m, 0.7); }); setTimeout(function () { midis.forEach(function (m) { audio.noteOff(m); }); }, 1400); return; }
    midis.forEach(function (m, i) {
      setTimeout(function () { audio.noteOn(m, 0.7); setTimeout(function () { audio.noteOff(m); }, 330); }, i * 260);
    });
  }

  /* ---------------- chord finder ---------------- */
  var chordKb = buildKeybed(document.getElementById('chordKeys'), 60, 84, { labels: true, markC: true });
  var cRoot = document.getElementById('chordRoot'), cType = document.getElementById('chordType');
  fill(cRoot, ROOTS); fill(cType, Object.keys(CHORDS));
  cRoot.value = 'C'; cType.value = 'major';

  var CHORD_WHY = {
    major: 'A root, then four semitones up, then three more. The bright, settled sound.',
    minor: 'The same shape with the middle note one semitone lower. That single note is the whole difference.',
    diminished: 'Two minor thirds stacked. Tense, unstable, wants to move somewhere.',
    augmented: 'Two major thirds stacked. Strange and suspended, common in film music.',
    sus2: 'The middle note replaced by the note above the root. Open rather than happy or sad.',
    sus4: 'The middle note replaced by the note below the fifth. Leans forward into the plain chord.',
    'major 7th': 'A major chord plus the note a semitone below the octave. Warm and lounge-like.',
    'minor 7th': 'A minor chord plus a whole tone below the octave. Smooth, jazzy, unfussy.',
    'dominant 7th': 'A major chord with a flattened seventh. The engine of blues and of nearly every cadence.',
    'major 6th': 'A major chord plus the sixth. Old fashioned in the best way.',
    'minor 6th': 'A minor chord plus the sixth. Wistful rather than sad.',
    'half-diminished 7th': 'A diminished triad with a flattened seventh. The classic set-up chord in minor keys.',
    'diminished 7th': 'Minor thirds all the way up. Divides the octave evenly, so it can lead almost anywhere.',
    'add 9': 'A plain major chord with the ninth added on top. Modern and airy.'
  };

  /* Say which fingers to use, in words. A beginner reading "C E G" still
     does not know what to do with their hand. */
  function chordFingers(count) {
    if (count === 3) return 'Right hand: thumb on the lowest note, middle finger, then little finger.';
    if (count === 4) return 'Right hand: thumb, index finger, middle finger, then little finger.';
    return 'Right hand: start with your thumb on the lowest note and spread the rest evenly.';
  }

  function updateChord(play) {
    var root = 60 + ROOTS.indexOf(cRoot.value);
    var iv = CHORDS[cType.value];
    var midis = iv.map(function (i) { return root + i; });
    light(chordKb, midis);
    document.getElementById('chordName').textContent = cRoot.value + ' ' + cType.value;
    document.getElementById('chordNotes').textContent = midis.map(function (m) { return pitchClass(m); }).join(' \u00b7 ');
    document.getElementById('chordWhy').textContent =
      (CHORD_WHY[cType.value] || '') + ' ' + chordFingers(midis.length);
    if (play) playSeq(midis, 0, true);
  }
  cRoot.addEventListener('change', function () { updateChord(false); });
  cType.addEventListener('change', function () { updateChord(false); });
  document.getElementById('chordPlay').addEventListener('click', function () { updateChord(true); });
  updateChord(false);

  /* ---------------- scale explorer ---------------- */
  var scaleKb = buildKeybed(document.getElementById('scaleKeys'), 60, 84, { labels: true, markC: true });
  var sRoot = document.getElementById('scaleRoot'), sType = document.getElementById('scaleType');
  fill(sRoot, ROOTS); fill(sType, Object.keys(SCALES));
  sRoot.value = 'C'; sType.value = 'major';

  var SCALE_WHY = {
    major: 'Tone, tone, semitone, tone, tone, tone, semitone. Learn that pattern once and you can build it from any key.',
    'natural minor': 'The major pattern starting from its sixth note. Same white keys as C major when you start on A.',
    'harmonic minor': 'A natural minor with the seventh raised, which creates the gap that gives it its eastern colour.',
    'melodic minor': 'A minor scale with a major sounding top half. Written differently going up and coming down in classical practice.',
    'major pentatonic': 'Five notes, no semitone clashes. Almost impossible to make sound wrong.',
    'minor pentatonic': 'The backbone of blues and rock soloing. Five notes that always sit well together.',
    blues: 'The minor pentatonic with one extra note squeezed in, the flattened fifth.',
    dorian: 'A minor scale with a raised sixth. Folk, funk and a great deal of film music.',
    mixolydian: 'A major scale with a flattened seventh. Bright but not sweet.',
    chromatic: 'Every key in order. Useful for finger evenness rather than for tunes.'
  };

  function updateScale(play) {
    var root = 60 + ROOTS.indexOf(sRoot.value);
    var midis = SCALES[sType.value].map(function (i) { return root + i; });
    light(scaleKb, midis);
    document.getElementById('scaleName').textContent = sRoot.value + ' ' + sType.value;
    document.getElementById('scaleNotes').textContent = midis.map(function (m) { return pitchClass(m); }).join(' \u00b7 ');
    document.getElementById('scaleWhy').textContent = (SCALE_WHY[sType.value] || '') +
      ' Start with your right thumb on the lowest note. On a seven note scale, tuck your thumb under after the third note and carry on.';
    if (play) playSeq(midis, 260, false);
  }
  sRoot.addEventListener('change', function () { updateScale(false); });
  sType.addEventListener('change', function () { updateScale(false); });
  document.getElementById('scalePlay').addEventListener('click', function () { updateScale(true); });
  updateScale(false);

  /* ---------------- metronome ---------------- */
  var mRange = document.getElementById('metroRange');
  var mBpm = document.getElementById('metroBpm');
  var mStart = document.getElementById('metroStart');
  var mTap = document.getElementById('metroTap');
  var mBeats = document.getElementById('metroBeats');
  var lights = document.getElementById('beatLights');
  var timer = null, beat = 0, taps = [];

  function drawLights() {
    lights.innerHTML = '';
    for (var i = 0; i < +mBeats.value; i++) lights.appendChild(document.createElement('i'));
  }
  function tick() {
    var n = +mBeats.value;
    [].forEach.call(lights.children, function (el, i) {
      el.classList.toggle('on', i === beat % n);
      el.classList.toggle('accent', i === 0 && beat % n === 0);
    });
    audio.click(beat % n === 0);
    beat++;
  }
  function run() {
    clearInterval(timer);
    timer = setInterval(tick, 60000 / (+mRange.value));
  }
  mRange.addEventListener('input', function () {
    mBpm.textContent = mRange.value;
    if (timer) run();
  });
  mBeats.addEventListener('change', function () { beat = 0; drawLights(); });
  mStart.addEventListener('click', function () {
    if (timer) {
      clearInterval(timer); timer = null; beat = 0;
      mStart.textContent = 'Start';
      [].forEach.call(lights.children, function (el) { el.classList.remove('on', 'accent'); });
    } else {
      audio.resume(); beat = 0; tick(); run();
      mStart.textContent = 'Stop';
    }
  });
  mTap.addEventListener('click', function () {
    var now = performance.now();
    taps = taps.filter(function (t) { return now - t < 2600; });
    taps.push(now);
    if (taps.length >= 2) {
      var gaps = [];
      for (var i = 1; i < taps.length; i++) gaps.push(taps[i] - taps[i - 1]);
      var avg = gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length;
      var bpm = Math.round(60000 / avg);
      bpm = Math.min(220, Math.max(30, bpm));
      mRange.value = bpm; mBpm.textContent = bpm;
      if (timer) run();
    }
  });
  drawLights();

  /* ---------------- note quiz ---------------- */
  var quizKb = buildKeybed(document.getElementById('quizKeys'), 60, 84, { labels: false, markC: true });
  var qAsk = document.getElementById('quizAsk');
  var qScore = document.getElementById('quizScore');
  var qBest = document.getElementById('quizBest');
  var qStart = document.getElementById('quizStart');
  var qMode = document.getElementById('quizMode');
  var qFb = document.getElementById('quizFeedback');
  var qRunning = false, qWant = null, qRun = 0;

  qBest.textContent = LPK.load().quizBest || 0;

  function nextQuestion() {
    var pool = [];
    for (var m = 60; m <= 84; m++) {
      if (qMode.value === 'white' && isBlack(m)) continue;
      pool.push(m);
    }
    qWant = pool[Math.floor(Math.random() * pool.length)];
    qAsk.textContent = 'Click ' + noteName(qWant);
  }

  function answer(m) {
    if (!qRunning) return;
    if (m === qWant) {
      qRun++;
      qScore.textContent = qRun;
      qFb.textContent = 'Correct.';
      var s = LPK.load();
      if (qRun > (s.quizBest || 0)) { s.quizBest = qRun; LPK.save(s); qBest.textContent = qRun; }
      LPK.markDay();
      nextQuestion();
    } else {
      qFb.textContent = 'That was ' + noteName(m) + '. Run ended at ' + qRun + '.';
      qRun = 0;
      qScore.textContent = 0;
      nextQuestion();
    }
  }

  document.getElementById('quizKeys').addEventListener('pointerdown', function (e) {
    var m = e.target.dataset && e.target.dataset.midi;
    if (!m) return;
    e.preventDefault();
    m = +m;
    audio.noteOn(m, 0.75);
    quizKb.keys.get(m).classList.add('on', 'rh');
    setTimeout(function () { audio.noteOff(m); quizKb.keys.get(m).classList.remove('on', 'rh'); }, 300);
    answer(m);
  });

  qStart.addEventListener('click', function () {
    audio.resume();
    qRunning = true; qRun = 0; qScore.textContent = 0;
    qStart.textContent = 'Restart quiz';
    qFb.textContent = 'Your best run is kept in this browser.';
    nextQuestion();
  });
  qMode.addEventListener('change', function () { if (qRunning) nextQuestion(); });
})();
