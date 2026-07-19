/* Learn Piano Keys - shared site behaviour (loaded on every page) */

(function () {
  /* ---- mobile nav, on every page family ---- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      this.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---- theme ---- */
  var tt = document.getElementById('themeToggle');
  function currentTheme() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function paintToggle() { if (tt) tt.textContent = currentTheme() === 'light' ? 'Dark' : 'Light'; }
  paintToggle();
  if (tt) {
    tt.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      if (next === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('lpk.theme', next); } catch (e) {}
      paintToggle();
    });
  }

  /* ---- pick up where you left off ---- */
  (function () {
    var slot = document.getElementById('resume');
    if (!slot || typeof LPK === 'undefined') return;
    var s = LPK.load();
    var names = { twinkle: 'Twinkle, Twinkle, Little Star', 'ode-to-joy': 'Ode to Joy', 'fur-elise': 'F\u00fcr Elise' };
    var bits = [];
    if (s.session && s.session.piece) {
      bits.push('<a href="/app.html?piece=' + s.session.piece + '">Carry on with ' + (names[s.session.piece] || s.session.piece) + '</a>');
    }
    if (s.lessonDone) {
      bits.push('<a href="/piano-keys-for-beginners.html">Run the first lesson again</a>');
    } else if (s.lessonStep) {
      bits.push('<a href="/piano-keys-for-beginners.html">Back to step ' + (s.lessonStep + 1) + ' of the first lesson</a>');
    }
    if (LPK.streak()) bits.push('<span>' + LPK.streak() + ' day' + (LPK.streak() === 1 ? '' : 's') + ' in a row</span>');
    if (!bits.length) return;
    slot.innerHTML = '<span class="resume-tag">Where you were</span>' + bits.join('<span class="sep">/</span>');
    slot.hidden = false;
  })();

  /* ---- lesson progress on the beginner path card ---- */
  (function () {
    var tag = document.getElementById('pathProgress');
    if (!tag || typeof LPK === 'undefined') return;
    var s = LPK.load();
    if (s.lessonDone) { tag.textContent = 'Completed'; tag.hidden = false; }
    else if (s.lessonStep) { tag.textContent = 'Step ' + (s.lessonStep + 1) + ' of 6'; tag.hidden = false; }
  })();

  /* ---- playable keyboards on content pages ---- */
  if (typeof PianoAudio === 'undefined') return;
  var audio = new PianoAudio();

  function wire(hostId, low, high, readoutId, onPlay) {
    var host = document.getElementById(hostId);
    if (!host) return null;
    var kb = buildKeybed(host, low, high, { labels: true, markC: true });
    var readout = readoutId ? document.getElementById(readoutId) : null;

    function on(m) {
      if (!kb.keys.has(m)) return;
      audio.noteOn(m, 0.8);
      kb.keys.get(m).classList.add('on', 'rh');
      if (readout) readout.textContent = noteName(m);
      if (onPlay) onPlay(m);
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
    return { kb: kb, on: on, off: off };
  }

  var narrow = window.matchMedia('(max-width: 700px)').matches;
  var hero = wire('heroKeys', narrow ? 60 : 55, narrow ? 79 : 84, 'heroNote');

  var feedback = document.getElementById('basicsFeedback');
  var basics = wire('basicsKeys', 60, 72, 'basicsNote', function (m) {
    if (!feedback) return;
    var n = pitchClass(m);
    feedback.textContent = n === 'C'
      ? 'That is C. It is always the white key just left of a pair of black keys.'
      : 'That is ' + noteName(m) + '. C is the white key just left of a pair of black keys.';
  });

  /* computer keys drive whichever keyboard is on the page */
  var map = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 };
  var target = hero || basics;
  if (!target) return;
  addEventListener('keydown', function (e) {
    if (e.repeat || e.metaKey || e.ctrlKey) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].indexOf(document.activeElement.tagName) > -1) return;
    var m = map[e.key.toLowerCase()];
    if (m) { e.preventDefault(); target.on(m); }
  });
  addEventListener('keyup', function (e) {
    var m = map[e.key.toLowerCase()];
    if (m) target.off(m);
  });
})();
