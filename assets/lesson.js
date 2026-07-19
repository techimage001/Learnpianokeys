/* Learn Piano Keys - the first five minutes
   One octave, one instruction at a time, and Next stays locked until the
   learner has actually played the thing being asked for. */

(function () {
  var host = document.getElementById('lessonKeys');
  if (!host) return;

  var audio = new PianoAudio();
  var LOW = 60, HIGH = 72;                       // middle C to the C above
  var kb = buildKeybed(host, LOW, HIGH, { labels: false, markC: false });
  var readout = document.getElementById('lessonRead');
  var elTitle = document.getElementById('stepTitle');
  var elBody = document.getElementById('stepBody');
  var elKick = document.getElementById('stepKicker');
  var elFb = document.getElementById('stepFeedback');
  var elHelp = document.getElementById('stepHelp');
  var btnNext = document.getElementById('stepNext');
  var btnBack = document.getElementById('stepBack');
  var btnHear = document.getElementById('stepHear');
  var dots = document.getElementById('stepDots');
  var doneBox = document.getElementById('lessonDone');
  var card = document.querySelector('.lesson-card');

  var FINGERS = { 60: 1, 62: 2, 64: 3, 65: 4, 67: 5 };

  var STEPS = [
    {
      title: 'Find middle C',
      body: 'Look at the black keys. They come in groups of two and three. Find the group of two, and the white key immediately to its left is C. Click it.',
      help: 'There is nothing to break here. Click any key you like first if you want to hear what it sounds like.',
      targets: [60],
      mode: 'single',
      hint: 'labelC'
    },
    {
      title: 'Name the next four',
      body: 'From C, the white keys go up in alphabetical order: C, D, E, F, G. Play them one at a time, in order, going up.',
      help: 'If you play the wrong one, nothing bad happens. It just waits for the right one.',
      targets: [60, 62, 64, 65, 67],
      mode: 'sequence',
      hint: 'names'
    },
    {
      title: 'Put five fingers down',
      body: 'Rest your right thumb on C and let the other four fall naturally on D, E, F and G. Thumb is finger 1, little finger is 5. Play each finger in turn, 1 to 5.',
      help: 'Keep your wrist level and your fingers curved, as if holding a small ball. Do not press hard: the sound comes from the weight of the hand, not from force.',
      targets: [60, 62, 64, 65, 67],
      mode: 'sequence',
      hint: 'fingers'
    },
    {
      title: 'Walk up and back down',
      body: 'Now the same five notes up and then back down again, without looking at your hand if you can manage it. Ten notes in total.',
      help: 'Slow and even beats fast and lumpy. There is no timer on this page.',
      targets: [60, 62, 64, 65, 67, 65, 64, 62, 60],
      mode: 'sequence',
      hint: 'fingers'
    },
    {
      title: 'Your first phrase',
      body: 'Three notes, and it already sounds like music: E, D, C. Play them in that order.',
      help: 'That is the end of countless tunes. Descending to the home note is what makes a phrase sound finished.',
      targets: [64, 62, 60],
      mode: 'sequence',
      hint: 'names'
    },
    {
      title: 'Play a real tune',
      body: 'This is the opening of Ode to Joy, and it uses only the five notes you have just learned: E, E, F, G, G, F, E, D.',
      help: 'Take it slowly. When you get to the end of this you have played a two hundred year old melody on your first day.',
      targets: [64, 64, 65, 67, 67, 65, 64, 62],
      mode: 'sequence',
      hint: 'names'
    }
  ];

  var idx = 0, progress = 0;
  var saved = LPK.load();
  if (!saved.lessonDone && saved.lessonStep && saved.lessonStep < STEPS.length) idx = saved.lessonStep;

  function labelKeys(hint) {
    kb.keys.forEach(function (elKey, midi) {
      var old = elKey.querySelector('.kn, .kf');
      if (old) old.remove();
      elKey.classList.remove('target', 'lit');
      if (isBlack(midi)) return;
      if (hint === 'labelC' && midi === 60) add(elKey, 'kn', 'C');
      if (hint === 'names') add(elKey, 'kn', pitchClass(midi));
      if (hint === 'fingers') {
        add(elKey, 'kn', pitchClass(midi));
        if (FINGERS[midi]) add(elKey, 'kf', FINGERS[midi]);
      }
    });
  }
  function add(parent, cls, text) {
    var s = document.createElement('span');
    s.className = cls; s.textContent = text;
    parent.appendChild(s);
  }

  function markTarget() {
    kb.keys.forEach(function (k) { k.classList.remove('target'); });
    var step = STEPS[idx];
    var want = step.mode === 'single' ? step.targets[0] : step.targets[progress];
    if (want !== undefined && kb.keys.has(want)) kb.keys.get(want).classList.add('target');
  }

  function render() {
    var step = STEPS[idx];
    progress = 0;
    elKick.textContent = 'Step ' + (idx + 1) + ' of ' + STEPS.length;
    elTitle.textContent = step.title;
    elBody.textContent = step.body;
    elHelp.textContent = step.help;
    elFb.textContent = '\u00a0';
    elFb.className = 'step-feedback';
    btnNext.disabled = true;
    btnBack.disabled = idx === 0;
    labelKeys(step.hint);
    markTarget();
    [].forEach.call(dots.children, function (li, i) {
      li.classList.toggle('on', i === idx);
      li.classList.toggle('done', i < idx);
    });
    say('Step ' + (idx + 1) + '. ' + step.title);
  }

  function say(msg) { var r = document.getElementById('sr'); if (r) r.textContent = msg; }

  function pass(msg) {
    elFb.textContent = msg;
    elFb.className = 'step-feedback ok';
    btnNext.disabled = false;
    kb.keys.forEach(function (k) { k.classList.remove('target'); });
    LPK.markDay();
    var s = LPK.load();
    s.lessonStep = Math.max(s.lessonStep || 0, idx + 1);
    LPK.save(s);
  }

  function nudge(msg) {
    elFb.textContent = msg;
    elFb.className = 'step-feedback no';
  }

  function played(midi) {
    var step = STEPS[idx];
    if (btnNext.disabled === false) return;

    if (step.mode === 'single') {
      if (midi === step.targets[0]) pass('That is middle C. Every piece you play will start from somewhere near it.');
      else nudge(noteName(midi) + '. Look for the pair of black keys, then take the white key to their left.');
      return;
    }

    var want = step.targets[progress];
    if (midi !== want) {
      nudge('That was ' + pitchClass(midi) + '. Try ' + pitchClass(want) + ', the one glowing.');
      progress = 0;
      markTarget();
      return;
    }
    progress++;
    if (progress >= step.targets.length) {
      var msgs = [
        '', 'C, D, E, F, G. Those five notes are most of your first month.',
        'That is a five finger position. Nearly every beginner piece lives inside it.',
        'Up and down cleanly. That is the motion behind every scale you will ever play.',
        'That is a phrase, not just three notes.',
        'That is Ode to Joy. You have played a real tune.'
      ];
      pass(msgs[idx] || 'Done.');
    } else {
      elFb.textContent = progress + ' of ' + step.targets.length;
      elFb.className = 'step-feedback';
      markTarget();
    }
  }

  function on(m) {
    if (!kb.keys.has(m)) return;
    audio.noteOn(m, 0.8);
    kb.keys.get(m).classList.add('on', 'rh');
    if (readout) readout.textContent = noteName(m);
    played(m);
  }
  function off(m) {
    if (!kb.keys.has(m)) return;
    audio.noteOff(m);
    kb.keys.get(m).classList.remove('on', 'rh');
  }

  host.addEventListener('pointerdown', function (e) {
    var m = e.target.dataset && e.target.dataset.midi;
    if (m) { e.preventDefault(); on(+m); }
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) {
    host.addEventListener(ev, function (e) {
      var m = e.target.dataset && e.target.dataset.midi;
      if (m) off(+m);
    });
  });

  var map = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 };
  addEventListener('keydown', function (e) {
    if (e.repeat || e.metaKey || e.ctrlKey) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].indexOf(document.activeElement.tagName) > -1) return;
    var m = map[e.key.toLowerCase()];
    if (m) { e.preventDefault(); on(m); }
  });
  addEventListener('keyup', function (e) {
    var m = map[e.key.toLowerCase()];
    if (m) off(m);
  });

  /* a MIDI keyboard works here too, without any setup fuss */
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(function (access) {
      function attach() {
        [].forEach.call(Array.from(access.inputs.values()), function (i) {
          i.onmidimessage = function (e) {
            var cmd = e.data[0] & 0xf0;
            var n = e.data[1];
            while (n < LOW) n += 12;
            while (n > HIGH) n -= 12;
            if (cmd === 0x90 && e.data[2] > 0) on(n);
            else if (cmd === 0x80 || (cmd === 0x90 && e.data[2] === 0)) off(n);
          };
        });
      }
      access.onstatechange = attach; attach();
    }).catch(function () {});
  }

  btnHear.addEventListener('click', function () {
    var step = STEPS[idx];
    audio.resume();
    var seq = step.mode === 'single' ? [step.targets[0]] : step.targets;
    seq.forEach(function (m, i) {
      setTimeout(function () {
        audio.noteOn(m, 0.7);
        kb.keys.get(m) && kb.keys.get(m).classList.add('lit');
        setTimeout(function () {
          audio.noteOff(m);
          kb.keys.get(m) && kb.keys.get(m).classList.remove('lit');
        }, 380);
      }, i * 450);
    });
  });

  btnNext.addEventListener('click', function () {
    if (idx < STEPS.length - 1) { idx++; render(); window.scrollTo({ top: card.offsetTop - 90, behavior: 'smooth' }); }
    else finish();
  });
  btnBack.addEventListener('click', function () {
    if (idx > 0) { idx--; render(); }
  });

  function finish() {
    card.hidden = true;
    dots.hidden = true;
    doneBox.hidden = false;
    var s = LPK.load();
    s.lessonDone = true;
    LPK.save(s);
    LPK.markDay();
    say('Lesson complete.');
    window.scrollTo({ top: doneBox.offsetTop - 90, behavior: 'smooth' });
  }

  document.getElementById('lessonRestart').addEventListener('click', function () {
    var st = LPK.load(); st.lessonDone = false; st.lessonStep = 0; LPK.save(st);
    idx = 0; card.hidden = false; dots.hidden = false; doneBox.hidden = true; render();
    window.scrollTo({ top: card.offsetTop - 90, behavior: 'smooth' });
  });

  render();
  if (idx > 0) {
    elFb.textContent = 'Carried on from where you stopped last time.';
    elFb.className = 'step-feedback';
  }
})();
