/* Learn Piano Keys - the Progress page. Everything stays local.
   Minutes arrive here on their own, from the practice room's automatic
   session clock and the beginner lesson's quiet counting. The manual
   timer below the chart exists only for practice away from the app. */

(function () {
  var clock = document.getElementById('timerClock');
  var hasTracker = !!clock;

  var PIECE_NAMES = {
    'twinkle-twinkle-little-star': 'Twinkle, Twinkle, Little Star',
    'mary-had-a-little-lamb': 'Mary Had a Little Lamb',
    'frere-jacques': 'Fr\u00e8re Jacques',
    'london-bridge-is-falling-down': 'London Bridge Is Falling Down',
    'ode-to-joy': 'Ode to Joy',
    'jingle-bells': 'Jingle Bells',
    'silent-night': 'Silent Night',
    'fur-elise': 'F\u00fcr Elise',
    'twinkle': 'Twinkle, Twinkle, Little Star'
  };

  function dayList() { return LPK.practiceDays(); }

  function longestStreak(s) {
    var days = dayList();
    if (!days.length) return 0;
    var best = 1, run = 1;
    for (var i = 1; i < days.length; i++) {
      var prev = new Date(days[i - 1] + 'T00:00:00Z');
      var cur = new Date(days[i] + 'T00:00:00Z');
      run = (cur - prev === 86400000) ? run + 1 : 1;
      if (run > best) best = run;
    }
    return Math.max(best, LPK.streak());
  }

  function paintStats() {
    var s = LPK.load();
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    var todaySec = LPK.secOn(LPK.today());
    set('todayMin', LPK.fmtDur(todaySec));
    set('totalMin', LPK.fmtDur(LPK.totalSeconds()));
    set('streakDays', LPK.streak());
    var w = document.getElementById('streakWord');
    if (w) w.textContent = LPK.streak() === 1 ? 'day' : 'days';
    set('longestOut', longestStreak(s));
    set('daysOut', dayList().length);
    set('piecesOut', Object.keys(s.best || {}).length);
    var note = document.getElementById('todayNote');
    if (note) note.textContent = todaySec ? 'Logged today. That is the hard part done.' : 'Ready when you are.';

    paintLessons(s);

    var lp = document.getElementById('lessonProgress');
    if (lp) {
      lp.textContent = s.lessonDone
        ? 'First lesson completed.'
        : (s.lessonStep ? 'First lesson: step ' + (s.lessonStep + 1) + ' of 6.' : 'First lesson not started.');
    }
    var qb = document.getElementById('quizBestOut');
    if (qb) qb.textContent = s.quizBest ? s.quizBest + ' in a row' : 'not played yet';

    paintBest(s);
    paintChart();
  }

  /* ------- the lesson course ------- */
  var COURSE = [
    ['piano-lesson-keyboard-layout', 'Lesson 1: The keyboard map'],
    ['piano-lesson-finger-numbers', 'Lesson 2: Fingers and hand position'],
    ['piano-lesson-steps-and-skips', 'Lesson 3: Steps, skips and your first melody'],
    ['piano-lesson-rhythm-and-counting', 'Lesson 4: Rhythm and counting'],
    ['piano-lesson-reading-the-staff', 'Lesson 5: Reading the staff']
  ];

  function paintLessons(s) {
    var box = document.getElementById('lessonList');
    if (!box) return;
    var ex = s.lessons2 || {};
    var qz = s.quizL || {};
    box.innerHTML = '';
    COURSE.forEach(function (pair) {
      var row = document.createElement('div');
      row.className = 'course-row';
      var name = document.createElement('span');
      name.textContent = pair[1];
      var stat = document.createElement('span');
      stat.className = 'course-stat';
      var bits = [];
      if (ex[pair[0]] && ex[pair[0]].ex) bits.push('exercise done');
      var b = qz[pair[0]];
      if (b && b.best != null) bits.push('best quiz ' + b.best + '%' + (b.untimed ? ' untimed' : ''));
      stat.textContent = bits.length ? bits.join(' \u00b7 ') : 'not started';
      if (bits.length) stat.classList.add('has-progress');
      row.appendChild(name);
      row.appendChild(stat);
      box.appendChild(row);
    });
  }

  /* ------- best scores as labelled bars ------- */
  function scoreBar(label, val, cls) {
    var v = Math.max(0, Math.min(100, val || 0));
    return '<div class="score-line"><span class="score-lab">' + label + '</span>' +
      '<span class="score-bar"><i class="' + cls + '" style="width:' + v + '%"></i></span>' +
      '<span class="score-pct">' + (val ? v + '%' : 'not yet') + '</span></div>';
  }

  function paintBest(s) {
    var list = document.getElementById('bestList');
    if (!list) return;
    var best = s.best || {};
    var keys = Object.keys(best);
    if (!keys.length) {
      list.innerHTML = '<p class="score-note">No saved runs yet. Play something in the practice room and your best scores appear here.</p>';
      return;
    }
    list.innerHTML = '';
    keys.forEach(function (k) {
      var b = best[k];
      var row = document.createElement('div');
      row.className = 'best-block';
      row.innerHTML = '<b>' + (PIECE_NAMES[k] || k) + '</b>' +
        scoreBar('Right notes', b.acc, 'sb-acc') +
        scoreBar('In time', b.tim, 'sb-tim') +
        scoreBar('Reading', b.lit, 'sb-lit');
      list.appendChild(row);
    });
  }

  /* ------- minutes per day chart, any range ------- */
  var range = { mode: '30' };

  function keyOf(d) { return d.toISOString().slice(0, 10); }

  function chartDays(s) {
    var from, to;
    var today = new Date(LPK.today() + 'T00:00:00Z');
    if (range.mode === 'custom' && range.from && range.to) {
      from = new Date(range.from + 'T00:00:00Z');
      to = new Date(range.to + 'T00:00:00Z');
      if (from > to) { var t = from; from = to; to = t; }
    } else if (range.mode === 'all') {
      var all = dayList();
      from = all.length ? new Date(all[0] + 'T00:00:00Z') : today;
      to = today;
    } else {
      var n = parseInt(range.mode, 10) || 30;
      to = today;
      from = new Date(today.getTime() - (n - 1) * 86400000);
    }
    var days = [];
    var span = Math.round((to - from) / 86400000);
    if (span < 0) span = 0;
    if (span > 1500) { from = new Date(to.getTime() - 1500 * 86400000); span = 1500; }
    for (var i = 0; i <= span; i++) {
      var d = new Date(from.getTime() + i * 86400000);
      var k = keyOf(d);
      days.push({ key: k, v: LPK.secOn(k) / 60 });
    }
    return days;
  }

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  function paintChart() {
    var cv = document.getElementById('progChart');
    if (!cv) return;
    var s = LPK.load();
    var days = chartDays(s);
    var wrap = cv.parentElement;
    var W = Math.max(280, wrap.clientWidth || 600);
    var H = 220;
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var c = cv.getContext('2d');
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    var brass = cssVar('--brass', '#D4A343');
    var faint = cssVar('--ink-4', '#332A24');
    var inkTx = cssVar('--ivory-2', '#A79A8C');

    var max = 0, total = 0, active = 0;
    days.forEach(function (d) { if (d.v > max) max = d.v; total += d.v; if (d.v > 0) active++; });

    var padL = 30, padB = 26, padT = 12, padR = 6;
    var plotW = W - padL - padR, plotH = H - padT - padB;

    /* baseline and a mid gridline */
    c.fillStyle = faint;
    c.fillRect(padL, H - padB, plotW, 1);
    if (max > 0) c.fillRect(padL, padT + plotH / 2, plotW, 1);

    c.fillStyle = inkTx;
    c.font = '10px "IBM Plex Mono", monospace';
    c.textAlign = 'right';
    c.fillText(String(Math.ceil(max) || 0), padL - 6, padT + 10);
    if (max > 0) c.fillText(String(Math.round(max / 2)), padL - 6, padT + plotH / 2 + 4);
    c.fillText('0', padL - 6, H - padB + 4);

    var n = days.length;
    var gap = n > 60 ? 0 : 2;
    var bw = Math.max(1, (plotW - gap * (n - 1)) / n);
    days.forEach(function (d, i) {
      var x = padL + i * (bw + gap);
      if (d.v > 0 && max > 0) {
        var h = Math.max(2, Math.round(d.v / max * plotH));
        c.fillStyle = brass;
        c.fillRect(x, H - padB - h, bw, h);
      } else {
        c.fillStyle = faint;
        c.fillRect(x, H - padB - 2, bw, 2);
      }
    });

    /* first and last date labels */
    c.fillStyle = inkTx;
    c.textAlign = 'left';
    c.fillText(days[0].key, padL, H - 8);
    c.textAlign = 'right';
    c.fillText(days[n - 1].key, W - padR, H - 8);

    var noteEl = document.getElementById('progNote');
    if (noteEl) {
      noteEl.textContent = total
        ? LPK.fmtDur(Math.round(total * 60)) + ' over ' + n + ' days, practised on ' + active + ' of them.'
        : 'Nothing logged in this range yet. Minutes from the practice room land here on their own.';
    }
  }

  function setRange(mode) {
    range.mode = mode;
    document.querySelectorAll('[data-range]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-range') === mode));
      b.classList.toggle('active', b.getAttribute('data-range') === mode);
    });
    paintChart();
  }

  document.querySelectorAll('[data-range]').forEach(function (b) {
    b.addEventListener('click', function () { setRange(b.getAttribute('data-range')); });
  });
  var rf = document.getElementById('rangeFrom');
  var rt = document.getElementById('rangeTo');
  function customChanged() {
    if (rf && rt && rf.value && rt.value) {
      range.from = rf.value; range.to = rt.value; setRange('custom');
      document.querySelectorAll('[data-range]').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false'); b.classList.remove('active');
      });
    }
  }
  if (rf) rf.addEventListener('change', customChanged);
  if (rt) rt.addEventListener('change', customChanged);

  /* live numbers: repaint whenever the tab comes back */
  document.addEventListener('visibilitychange', function () { if (!document.hidden) paintStats(); });
  window.addEventListener('focus', paintStats);
  window.addEventListener('resize', paintChart);

  paintStats();
  if (!hasTracker) return;

  /* ------- the away-from-the-app timer ------- */
  var running = false, started = 0, elapsed = 0, tick = null;

  function fmt(ms) {
    var t = Math.floor(ms / 1000);
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }
  function render() { clock.textContent = fmt(elapsed + (running ? performance.now() - started : 0)); }

  document.getElementById('timerToggle').addEventListener('click', function () {
    if (running) {
      elapsed += performance.now() - started;
      running = false; clearInterval(tick); this.textContent = 'Resume';
    } else {
      started = performance.now(); running = true;
      tick = setInterval(render, 500);
      this.textContent = 'Pause';
    }
    render();
  });

  document.getElementById('timerSave').addEventListener('click', function () {
    if (running) { elapsed += performance.now() - started; running = false; clearInterval(tick); }
    document.getElementById('timerToggle').textContent = 'Start';
    var secs = Math.round(elapsed / 1000);
    if (secs < 1) {
      var h = document.getElementById('hint');
      if (h) { h.textContent = 'Nothing on the clock yet.'; h.classList.add('show'); setTimeout(function () { h.classList.remove('show'); }, 1800); }
    } else {
      LPK.addSeconds(secs);
    }
    elapsed = 0; render(); paintStats();
  });

  document.getElementById('timerReset').addEventListener('click', function () {
    if (running) { running = false; clearInterval(tick); document.getElementById('timerToggle').textContent = 'Start'; }
    elapsed = 0; render();
    var s = LPK.load();
    var t = LPK.today();
    if (s.minutes && s.minutes[t]) {
      s.totalMinutes = Math.max(0, (s.totalMinutes || 0) - s.minutes[t]);
      delete s.minutes[t];
    }
    if (s.sec && s.sec[t]) {
      s.totalSec = Math.max(0, (s.totalSec || 0) - s.sec[t]);
      delete s.sec[t];
    }
    LPK.save(s);
    paintStats();
  });

  document.getElementById('clearAll').addEventListener('click', function () {
    if (!confirm('Clear your streak, practice minutes, quiz best and saved scores on this device?')) return;
    LPK.clear();
    paintStats();
  });

  render();
})();
