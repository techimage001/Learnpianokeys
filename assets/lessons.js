/* Learn Piano Keys - the lesson course engine.
   One module, three exercise types and the quiz machine:
   - sequence: follow the glow (lessons 1 to 3), with finger chips and a demo
   - rhythm: tap the beat against a metronome (lesson 4)
   - staff: read a note, press its key (lesson 5)
   Quiz: ten questions drawn from a pool of twenty, shuffled, one at a time,
   a calm ten minute clock (untimed on request), every answer explained,
   full review at the end, best score saved. Nothing is ever locked. */

(function () {
  'use strict';

  function store() { return (typeof LPK !== 'undefined') ? LPK.load() : {}; }
  function saveStore(s) { if (typeof LPK !== 'undefined') LPK.save(s); }

  /* ---------------- hub: paint each lesson's status ---------------- */
  var hubEl = document.querySelector('[data-lessons-hub]');
  if (hubEl) {
    var st = store();
    var ex = st.lessons2 || {};
    var qz = st.quizL || {};
    hubEl.querySelectorAll('[data-lesson-status]').forEach(function (el) {
      var slug = el.getAttribute('data-lesson-status');
      var bits = [];
      if (ex[slug] && ex[slug].ex) bits.push('Exercise done');
      if (qz[slug] && qz[slug].best != null) bits.push('Best quiz: ' + qz[slug].best + '%');
      el.textContent = bits.length ? bits.join(' \u00b7 ') : 'Not started';
      if (bits.length) el.classList.add('has-progress');
    });
    return;
  }

  var dataEl = document.getElementById('lessonData');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);

  /* ---------------- sound, always fail-safe ---------------- */
  var audio = null;
  try { if (typeof PianoAudio !== 'undefined') audio = new PianoAudio(); } catch (e) { audio = null; }
  function pOn(m, v) { try { if (audio) audio.noteOn(m, v || 0.75); } catch (e) {} }
  function pOff(m) { try { if (audio) audio.noteOff(m); } catch (e) {} }
  function click(strong) {
    try {
      if (!audio) return;
      audio.resume();
      var ctx = audio.ctx;
      if (!ctx) return;
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = strong ? 1680 : 1180;
      g.gain.value = 0.12;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.setTargetAtTime(0.0001, ctx.currentTime + 0.02, 0.015);
      o.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  }

  /* ---------------- keybed + input ---------------- */
  var keysEl = document.getElementById('exKeys');
  var kb = buildKeybed(keysEl, D.exercise.keybed.low, D.exercise.keybed.high, { labels: true, markC: true });
  var onPress = null;
  var inputLocked = false;

  kb.keys.forEach(function (el, m) {
    el.addEventListener('pointerdown', function () { press(m); });
  });
  try {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(function (access) {
        access.inputs.forEach(function (input) {
          input.onmidimessage = function (msg) {
            var d = msg.data;
            if ((d[0] & 0xf0) === 0x90 && d[2] > 0) press(d[1]);
          };
        });
      }).catch(function () {});
    }
  } catch (e) {}

  function press(m) {
    if (inputLocked) return;
    if (window.LPKSession) LPKSession.activity();
    flashKey(m, null, 260);
    pOn(m, 0.7);
    setTimeout(function () { pOff(m); }, 300);
    if (onPress) onPress(m);
  }

  function flashKey(m, hand, ms) {
    var k = kb.keys.get(m);
    if (!k) return;
    k.classList.add('on');
    if (hand) k.classList.add(hand === 'l' ? 'lh' : 'rh');
    setTimeout(function () { k.classList.remove('on', 'lh', 'rh'); }, ms || 300);
  }

  var glowing = [];
  function clearGlow() {
    glowing.forEach(function (m) {
      var k = kb.keys.get(m);
      if (k) {
        k.classList.remove('target', 't-l', 't-r');
        var c = k.querySelector('.fchip');
        if (c) c.remove();
      }
    });
    glowing = [];
  }
  function glow(m, hand, finger) {
    var k = kb.keys.get(m);
    if (!k) return;
    k.classList.add('target', hand === 'l' ? 't-l' : 't-r');
    if (finger) {
      var c = document.createElement('span');
      c.className = 'fchip ' + (hand === 'l' ? 'fc-l' : 'fc-r');
      c.textContent = finger;
      k.appendChild(c);
    }
    glowing.push(m);
  }

  var promptEl = document.getElementById('exPrompt');
  var fbEl = document.getElementById('exFeedback');
  var progEl = document.getElementById('exProgress');
  var doneEl = document.getElementById('exDone');
  var demoBtn = document.getElementById('exDemo');

  function feedback(t, good) {
    fbEl.textContent = t;
    fbEl.classList.toggle('good', !!good);
  }

  function markDone() {
    var s = store();
    s.lessons2 = s.lessons2 || {};
    s.lessons2[D.slug] = s.lessons2[D.slug] || {};
    s.lessons2[D.slug].ex = true;
    saveStore(s);
    doneEl.hidden = false;
    clearGlow();
    promptEl.textContent = 'All steps done. The quiz below is waiting when you are.';
    feedback('', true);
  }

  /* ================= sequence exercise (lessons 1 to 3) ================= */
  if (D.exercise.type === 'sequence') {
    var steps = D.exercise.steps;
    var idx = 0, cursor = 0, gotSet = {};

    function fingerOf(step, m) { return (step.fingers || {})[m] || null; }
    function handOf(step) { return step.hand || 'r'; }

    function paintStep() {
      clearGlow();
      var st = steps[idx];
      promptEl.textContent = 'Step ' + (idx + 1) + ' of ' + steps.length + ': ' + st.prompt;
      progEl.textContent = 'Step ' + (idx + 1) + ' of ' + steps.length;
      if (st.ordered) {
        glow(st.targets[cursor], handOf(st), fingerOf(st, st.targets[cursor]));
      } else if (st.all) {
        st.targets.forEach(function (m) { if (!gotSet[m]) glow(m, handOf(st), fingerOf(st, m)); });
      } else {
        st.targets.forEach(function (m) { glow(m, handOf(st), fingerOf(st, m)); });
      }
    }

    function nextStep() {
      idx++; cursor = 0; gotSet = {};
      if (idx >= steps.length) { markDone(); return; }
      feedback('Step done. Next one.', true);
      paintStep();
    }

    onPress = function (m) {
      var st = steps[idx];
      if (!st) return;
      if (st.ordered) {
        if (m === st.targets[cursor]) {
          cursor++;
          feedback('Yes: ' + pitchClass(m) + '.', true);
          if (cursor >= st.targets.length) nextStep(); else paintStep();
        } else {
          feedback('That was ' + pitchClass(m) + '. The glowing key is next.', false);
        }
      } else if (st.all) {
        if (st.targets.indexOf(m) !== -1 && !gotSet[m]) {
          gotSet[m] = true;
          feedback('Yes: ' + pitchClass(m) + '.', true);
          if (Object.keys(gotSet).length >= st.targets.length) nextStep(); else paintStep();
        } else if (st.targets.indexOf(m) !== -1) {
          feedback('You already have that one. Find the others still glowing.', false);
        } else {
          feedback('That was ' + pitchClass(m) + '. Look for the glowing keys.', false);
        }
      } else {
        if (st.targets.indexOf(m) !== -1) { feedback('Yes: ' + pitchClass(m) + '.', true); nextStep(); }
        else feedback('That was ' + pitchClass(m) + '. The glowing key is the one you want.', false);
      }
    };

    demoBtn.addEventListener('click', function () {
      if (inputLocked) return;
      inputLocked = true;
      clearGlow();
      feedback('Watch: this is the whole exercise, played for you.', true);
      var seq = [];
      steps.forEach(function (st) {
        var list = st.ordered || st.all ? st.targets : st.targets.slice(0, 1);
        list.forEach(function (m) { seq.push({ m: m, h: handOf(st), f: fingerOf(st, m) }); });
      });
      var i = 0;
      (function tick() {
        if (i >= seq.length) {
          inputLocked = false;
          feedback('Your turn.', true);
          paintStep();
          return;
        }
        var n = seq[i++];
        clearGlow();
        glow(n.m, n.h, n.f);
        flashKey(n.m, n.h, 420);
        pOn(n.m, 0.7);
        setTimeout(function () { pOff(n.m); }, 430);
        setTimeout(tick, 560);
      })();
    });

    paintStep();
  }

  /* ================= rhythm exercise (lesson 4) ================= */
  if (D.exercise.type === 'rhythm') {
    var pats = D.exercise.patterns;
    var pIdx = 0;
    var bpm = D.exercise.bpm || 80;
    var beatMs = 60000 / bpm;
    var goBtn = document.getElementById('exGo');
    var beatsEl = document.getElementById('exBeats');
    var running = false;
    var expected = [];   /* [{at, hit}] absolute ms */
    var runStart = 0;

    function paintPattern() {
      clearGlow();
      var p = pats[pIdx];
      promptEl.textContent = 'Pattern ' + (pIdx + 1) + ' of ' + pats.length + ': ' + p.name + '. ' + p.desc;
      progEl.textContent = 'Pattern ' + (pIdx + 1) + ' of ' + pats.length;
      glow(D.exercise.tapMidi, 'r', 1);
      beatsEl.innerHTML = '';
      for (var b = 0; b < 4; b++) {
        var d = document.createElement('span');
        d.className = 'bdot' + (p.beats.indexOf(b) !== -1 ? ' expect' : '');
        d.textContent = b + 1;
        beatsEl.appendChild(d);
      }
    }

    function runPattern(demo) {
      if (running) return;
      running = true;
      inputLocked = !!demo;
      feedback(demo ? 'Listen: four clicks in, then the taps.' : 'Four clicks to count you in.', true);
      var p = pats[pIdx];
      var dots = beatsEl.children;
      expected = [];
      var t0 = Date.now() + 60;
      /* count-in bar + the pattern bar: 8 beats of clicks */
      for (var b = 0; b < 8; b++) {
        (function (b) {
          setTimeout(function () {
            click(b % 4 === 0);
            if (b >= 4) {
              var beat = b - 4;
              for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('now', i === beat);
              if (demo && p.beats.indexOf(beat) !== -1) {
                flashKey(D.exercise.tapMidi, 'r', 300);
                pOn(D.exercise.tapMidi, 0.75);
                setTimeout(function () { pOff(D.exercise.tapMidi); }, 320);
              }
            }
          }, (t0 - Date.now()) + b * beatMs);
        })(b);
      }
      if (!demo) {
        runStart = t0 + 4 * beatMs;
        p.beats.forEach(function (beat) { expected.push({ at: runStart + beat * beatMs, hit: false }); });
      }
      setTimeout(function () {
        running = false;
        inputLocked = false;
        for (var i = 0; i < dots.length; i++) dots[i].classList.remove('now');
        if (demo) { feedback('Your turn. Press Start the pattern.', true); return; }
        var hits = expected.filter(function (e) { return e.hit; }).length;
        expected.forEach(function (e, i2) {
          var beat = p.beats[i2];
          if (!e.hit) dots[beat].classList.add('missed');
        });
        if (hits === expected.length) {
          feedback('All ' + hits + ' taps with the beat. Lovely.', true);
          pIdx++;
          if (pIdx >= pats.length) { markDone(); } else { setTimeout(paintPattern, 900); }
        } else {
          feedback(hits + ' of ' + expected.length + ' taps with the beat. Have another go, and stay with the click.', false);
        }
      }, (t0 - Date.now()) + 8 * beatMs + 380);
    }

    onPress = function () {
      if (!running || !expected.length) return;
      var now = Date.now();
      var best = null, bestD = 1e9;
      expected.forEach(function (e) {
        var d = Math.abs(now - e.at);
        if (!e.hit && d < bestD) { bestD = d; best = e; }
      });
      if (best && bestD <= 300) {
        best.hit = true;
        var beat = pats[pIdx].beats[expected.indexOf(best)];
        beatsEl.children[beat].classList.add('hit');
      }
    };

    goBtn.addEventListener('click', function () { runPattern(false); });
    demoBtn.addEventListener('click', function () { runPattern(true); });
    paintPattern();
  }

  /* ================= staff exercise (lesson 5) ================= */
  if (D.exercise.type === 'staff') {
    var cv = document.getElementById('exStaff');
    var range = D.exercise.range;
    var rounds = D.exercise.rounds || 10;
    var score = 0, current = null, lastNote = null;

    /* y positions on a five line staff: bottom line E4 (midi 64). Middle C
       sits below on its own short ledger line. Steps of a line or space are
       half the line gap. */
    function draw(midi) {
      var c;
      try { c = cv.getContext('2d'); } catch (e) { c = null; }
      if (!c) return;
      var W = cv.width, H = cv.height;
      c.clearRect(0, 0, W, H);
      var gap = 16, top = 30, left = 20, right = W - 20;
      var ink = '#F4EDE2';
      try {
        ink = getComputedStyle(document.documentElement).getPropertyValue('--ivory').trim() || ink;
      } catch (e) {}
      c.fillStyle = ink;
      for (var l = 0; l < 5; l++) c.fillRect(left, top + l * gap, right - left, 1.5);
      c.font = '54px serif';
      c.fillText('\uD834\uDD1E', left + 6, top + 4 * gap + 12);
      /* diatonic distance above middle C decides height */
      var stepsUp = { 60: 0, 62: 1, 64: 2, 65: 3, 67: 4 }[midi] || 0;
      var yC = top + 5 * gap;            /* middle C: one ledger below bottom line */
      var y = yC - stepsUp * (gap / 2);
      var x = left + (right - left) * 0.62;
      c.beginPath();
      c.ellipse ? c.ellipse(x, y, 8.5, 6.5, -0.25, 0, Math.PI * 2) : c.arc(x, y, 7, 0, Math.PI * 2);
      c.fill();
      if (midi === 60) c.fillRect(x - 15, yC, 30, 1.5); /* the ledger line */
    }

    function nextRound() {
      var pick;
      do { pick = range[Math.floor(Math.random() * range.length)]; } while (pick === lastNote && range.length > 1);
      lastNote = pick;
      current = pick;
      draw(pick);
      promptEl.textContent = 'Round ' + (score + 1) + ' of ' + rounds + ': which note is on the staff? Press its key.';
      progEl.textContent = score + ' of ' + rounds + ' correct';
    }

    onPress = function (m) {
      if (current == null) return;
      if (m === current || (m % 12) === (current % 12)) {
        score++;
        feedback('Yes: ' + pitchClass(current) + '.', true);
        progEl.textContent = score + ' of ' + rounds + ' correct';
        if (score >= rounds) { current = null; markDone(); } else nextRound();
      } else {
        var dir = m < current ? 'higher' : 'lower';
        feedback('That was ' + pitchClass(m) + '. The note on the staff is ' + dir + '.', false);
      }
    };

    demoBtn.addEventListener('click', function () {
      if (inputLocked) return;
      inputLocked = true;
      draw(64);
      feedback('Worked example: the note sits ON the bottom line, so it is E. Watch.', true);
      clearGlow();
      glow(64, 'r', null);
      setTimeout(function () {
        flashKey(64, 'r', 500);
        pOn(64, 0.75);
        setTimeout(function () { pOff(64); }, 520);
      }, 700);
      setTimeout(function () {
        clearGlow();
        inputLocked = false;
        feedback('Your turn.', true);
        nextRound();
      }, 1800);
    });

    nextRound();
  }

  /* ================= the quiz machine ================= */
  var startBtn = document.getElementById('quizStart');
  if (!startBtn) return;
  var intro = document.getElementById('quizIntro');
  var live = document.getElementById('quizLive');
  var noClockBox = document.getElementById('quizNoClock');
  var bestEl = document.getElementById('quizBest');

  var QUIZ_TIME = 600; /* seconds */
  var SERVE = 10;

  (function paintBest() {
    var s = store();
    noClockBox.checked = !!s.quizNoClock;
    var b = (s.quizL || {})[D.slug];
    bestEl.textContent = b && b.best != null
      ? 'Your best so far: ' + b.best + '%' + (b.untimed ? ' (untimed)' : '') + '.'
      : 'No attempt yet. The first one is just a look around.';
  })();

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  startBtn.addEventListener('click', function () {
    var s = store();
    s.quizNoClock = !!noClockBox.checked;
    saveStore(s);

    var picks = shuffle(D.quiz.map(function (_, i) { return i; })).slice(0, SERVE);
    var qs = picks.map(function (i) {
      var q = D.quiz[i];
      var order = shuffle([0, 1, 2, 3]);
      return {
        q: q.q,
        options: order.map(function (o) { return q.options[o]; }),
        a: order.indexOf(q.a),
        explain: q.explain,
        chosen: null
      };
    });

    var qi = 0, right = 0, finished = false;
    var untimed = !!noClockBox.checked;
    var remain = QUIZ_TIME, timerId = null;

    intro.hidden = true;
    live.hidden = false;

    function fmtT(t) { return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }

    function renderQ() {
      var q = qs[qi];
      live.innerHTML = '';
      var head = document.createElement('div');
      head.className = 'quiz-head';
      head.innerHTML = '<span>Question ' + (qi + 1) + ' of ' + SERVE + '</span>' +
        (untimed ? '<span class="q-timer">untimed</span>' : '<span class="q-timer" id="qTimer">' + fmtT(remain) + '</span>');
      live.appendChild(head);
      var qt = document.createElement('p');
      qt.className = 'q-text';
      qt.textContent = q.q;
      live.appendChild(qt);
      var opts = document.createElement('div');
      opts.className = 'q-opts';
      q.options.forEach(function (o, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'qopt';
        b.textContent = o;
        b.addEventListener('click', function () { answer(i, opts, q); });
        opts.appendChild(b);
      });
      live.appendChild(opts);
      var fb = document.createElement('div');
      fb.id = 'qFb';
      live.appendChild(fb);
    }

    function answer(i, opts, q) {
      if (q.chosen !== null || finished) return;
      q.chosen = i;
      var btns = opts.querySelectorAll('.qopt');
      btns.forEach(function (b, bi) {
        b.disabled = true;
        if (bi === q.a) b.classList.add('q-right');
        if (bi === i && i !== q.a) b.classList.add('q-wrong');
      });
      var good = i === q.a;
      if (good) right++;
      var fb = document.getElementById('qFb');
      fb.innerHTML = '';
      var line = document.createElement('p');
      line.className = 'q-verdict ' + (good ? 'good' : 'bad');
      line.textContent = good ? '\u2713 Correct.' : '\u2717 Not this one. The correct answer is highlighted.';
      fb.appendChild(line);
      var ex = document.createElement('p');
      ex.className = 'q-explain';
      ex.textContent = q.explain;
      fb.appendChild(ex);
      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'btn btn-primary btn-sm';
      next.textContent = qi + 1 >= SERVE ? 'See your score' : 'Next question';
      next.addEventListener('click', function () {
        qi++;
        if (qi >= SERVE) finish(false); else renderQ();
      });
      fb.appendChild(next);
    }

    function finish(timedOut) {
      if (finished) return;
      finished = true;
      if (timerId) clearInterval(timerId);
      var pct = Math.round(right / SERVE * 100);

      var s2 = store();
      s2.quizL = s2.quizL || {};
      var prev = s2.quizL[D.slug];
      if (!prev || pct > prev.best) s2.quizL[D.slug] = { best: pct, untimed: untimed };
      saveStore(s2);

      var band;
      if (pct >= 95) band = 'Ready for the next lesson.';
      else if (pct >= 80) band = 'Nearly there. One more pass and this is yours.';
      else band = 'Worth re-reading the lesson above, then take the quiz again.';

      live.innerHTML = '';
      var h = document.createElement('h3');
      h.className = 'q-score';
      h.textContent = right + ' out of ' + SERVE + ' \u00b7 ' + pct + '%';
      live.appendChild(h);
      if (timedOut) {
        var to = document.createElement('p');
        to.className = 'q-verdict bad';
        to.textContent = 'Time is up. Unanswered questions count as wrong.';
        live.appendChild(to);
      }
      var bp = document.createElement('p');
      bp.className = 'q-band';
      bp.textContent = band;
      live.appendChild(bp);

      var toReview = qs.filter(function (q) { return q.chosen !== q.a; });
      if (toReview.length) {
        var rh = document.createElement('p');
        rh.className = 'muted';
        rh.textContent = 'Worth another look:';
        live.appendChild(rh);
        toReview.forEach(function (q) {
          var d = document.createElement('div');
          d.className = 'q-review';
          d.innerHTML = '<b></b><span class="q-review-a"></span><span class="q-explain"></span>';
          d.querySelector('b').textContent = q.q;
          d.querySelector('.q-review-a').textContent = (q.chosen === null ? 'Not answered. ' : '') + 'Correct answer: ' + q.options[q.a];
          d.querySelector('.q-explain').textContent = q.explain;
          live.appendChild(d);
        });
      }

      var row = document.createElement('div');
      row.className = 'tool-row';
      row.style.marginTop = '18px';
      var again = document.createElement('button');
      again.type = 'button';
      again.className = 'btn btn-primary btn-sm';
      again.textContent = 'Retake the quiz';
      again.addEventListener('click', function () {
        live.hidden = true;
        intro.hidden = false;
        var s3 = store();
        var b = (s3.quizL || {})[D.slug];
        bestEl.textContent = b ? 'Your best so far: ' + b.best + '%' + (b.untimed ? ' (untimed)' : '') + '.' : '';
      });
      row.appendChild(again);
      live.appendChild(row);
    }

    if (!untimed) {
      timerId = setInterval(function () {
        remain--;
        var t = document.getElementById('qTimer');
        if (t) {
          t.textContent = fmtT(Math.max(0, remain));
          t.classList.toggle('warn', remain <= 60);
        }
        if (remain <= 0) finish(true);
      }, 1000);
    }

    renderQ();
  });
})();
