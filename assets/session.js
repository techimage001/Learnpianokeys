/* Learn Piano Keys - session clock
   Starts by itself when the practice room opens, counts up quietly, and is
   honest about what it records: it pauses when the tab is hidden or when
   nothing has been played or touched for a few minutes, and resumes on the
   next note. Whole minutes are saved into the same store the practice
   tracker reads, so the tracker page needs nothing new to show them. */

(function () {
  'use strict';

  var timeEl = document.getElementById('sessTime');
  var finEl = document.getElementById('sessFinish');
  /* Two homes: the practice room shows the clock; the beginner lesson counts
     the same minutes silently, with no clock on screen, as that page promises. */
  var silent = !timeEl || !finEl;
  if (silent && !document.getElementById('lessonKeys')) return;

  var IDLE_MS = 3 * 60 * 1000;

  var startAt = Date.now();
  var banked = 0;            /* ms accumulated while paused */
  var running = true;
  var lastActivity = Date.now();
  var savedSecs = 0;         /* whole seconds already written to the store */
  var finished = false;

  function elapsedMs() { return banked + (running ? Date.now() - startAt : 0); }

  function fmt(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function paint() {
    if (silent) return;
    timeEl.textContent = fmt(elapsedMs());
    timeEl.classList.toggle('paused', !running);
  }

  function pause() {
    if (!running) return;
    banked += Date.now() - startAt;
    running = false;
    paint();
  }

  function resume() {
    if (running || finished) return;
    startAt = Date.now();
    running = true;
    paint();
  }

  function activity() {
    lastActivity = Date.now();
    if (!running && !document.hidden && !finished) resume();
  }

  function saveTime() {
    var secs = Math.floor(elapsedMs() / 1000) - savedSecs;
    if (secs >= 1 && typeof LPK !== 'undefined') {
      LPK.addSeconds(secs);
      savedSecs += secs;
    }
  }

  /* ------- encouragement, written here, never repeated until all are used ------- */
  var LINES = [
    'You showed up. That is the hard part.',
    'Small sessions stack. This one is in the bank.',
    'Every good pianist was once exactly where you are now.',
    'Your fingers learned something today, even if it did not feel like it.',
    'Slow and correct beats fast and messy. Nice work.',
    'The keyboard will remember you tomorrow. Come and prove it.',
    'One more session than most people managed today.',
    'Progress hides in sessions like this one.',
    'That was real practice, not scrolling. Well done.',
    'The first minutes are the heaviest. You lifted them.',
    'Wrong notes are just the right notes being rehearsed.',
    'You are building a hand that knows where to go.',
    'Ten quiet minutes beat one loud hour of wishing.',
    'The piece did not beat you today.',
    'Come back tomorrow and it will feel a little easier.',
    'Your future self just thanked you.',
    'Notes first, speed later. You did it in the right order.',
    'That counted. All of it.',
    'Practice is a deposit. You just made one.',
    'Nobody plays well before playing badly. You are on schedule.',
    'The distance between you and the music got smaller today.',
    'A day with the piano in it is a good day.',
    'You gave the tune a chance to sink in. It will.',
    'Steady hands are made exactly like this.',
    'Another brick in the wall of a real skill.',
    'You practised while it was easier not to.',
    'The streak does not care how long. It cares that you came.',
    'Muscle memory was listening the whole time.',
    'Today you played. Tomorrow you play a little better.',
    'Even the shaky bars are further than silence.',
    'What felt hard today is tomorrow warming up.',
    'You kept your promise to yourself.',
    'Short, honest, done. The best kind of session.',
    'Each pass smooths the path for the next one.',
    'The music noticed. So did your hands.',
    'You are past the part where most people stop.',
    'Learning sounds like this before it sounds like music.',
    'A little every day is how every player got there.',
    'That was worth more than it felt like.',
    'The piano is patient, and you are persistent. Good match.',
    'Seeds planted. Give them a night to grow.',
    'Well played, in every sense.',
    'You made time for it. That is the whole secret.',
    'Consistency looks exactly like what you just did.',
    'One session closer to playing it without thinking.',
    'Your ears got sharper today too.',
    'Difficult passages shrink when you visit them often.',
    'That is how habits sound.',
    'Quietly, you are getting good at this.',
    'Done is the best note to end on.'
  ];

  function nextLine() {
    var s = (typeof LPK !== 'undefined') ? LPK.load() : {};
    var used = Array.isArray(s.sessLines) ? s.sessLines : [];
    if (used.length >= LINES.length) used = [];
    var pool = [];
    for (var i = 0; i < LINES.length; i++) if (used.indexOf(i) === -1) pool.push(i);
    var pick = pool[Math.floor(Math.random() * pool.length)];
    used.push(pick);
    if (typeof LPK !== 'undefined') { s.sessLines = used; LPK.save(s); }
    return LINES[pick];
  }

  /* ------- end of session card ------- */
  function showDone() {
    finished = true;
    pause();
    saveTime();

    var todaySec = (typeof LPK !== 'undefined') ? LPK.secOn(LPK.today()) : 0;
    var streak = (typeof LPK !== 'undefined') ? LPK.streak() : 0;

    var old = document.getElementById('sessDone');
    if (old) old.parentNode.removeChild(old);

    var box = document.createElement('div');
    box.className = 'sess-done';
    box.id = 'sessDone';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Session finished');

    var card = document.createElement('div');
    card.className = 'sess-card';

    var h = document.createElement('h2');
    h.textContent = 'Session finished';
    card.appendChild(h);

    var stats = document.createElement('div');
    stats.className = 'sess-stats';
    [[fmt(elapsedMs()), 'this session'],
     [(typeof LPK !== 'undefined') ? LPK.fmtDur(todaySec) : '0 sec', 'saved today'],
     [streak + (streak === 1 ? ' day' : ' days'), 'streak']].forEach(function (pair) {
      var d = document.createElement('div');
      var b = document.createElement('b');
      b.textContent = pair[0];
      d.appendChild(b);
      d.appendChild(document.createTextNode(pair[1]));
      stats.appendChild(d);
    });
    card.appendChild(stats);

    var moti = document.createElement('p');
    moti.className = 'sess-moti';
    moti.textContent = nextLine();
    card.appendChild(moti);

    var actions = document.createElement('div');
    actions.className = 'sess-actions';

    var see = document.createElement('a');
    see.className = 'btn btn-primary';
    see.href = '/practice.html';
    see.textContent = 'See how you did today';
    actions.appendChild(see);

    var keep = document.createElement('button');
    keep.type = 'button';
    keep.className = 'btn btn-ghost';
    keep.textContent = 'Keep practising';
    keep.addEventListener('click', function () {
      finished = false;
      box.parentNode.removeChild(box);
      activity();
    });
    actions.appendChild(keep);

    card.appendChild(actions);
    box.appendChild(card);
    document.body.appendChild(box);
  }

  /* ------- wiring ------- */
  if (!silent) {
    finEl.addEventListener('click', showDone);
    /* The controls ship hidden and only appear once this script is running,
       so a blocked script can never leave a dead clock on screen. */
    timeEl.hidden = false;
    finEl.hidden = false;
  }

  document.addEventListener('pointerdown', activity);
  document.addEventListener('keydown', activity);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { saveTime(); pause(); }
  });
  window.addEventListener('pagehide', saveTime);
  window.addEventListener('pageshow', function () {
    if (!silent) { timeEl.hidden = false; finEl.hidden = false; }
    activity();
    paint();
  });

  setInterval(function () {
    if (running && Date.now() - lastActivity > IDLE_MS) pause();
    if (running) paint();
  }, 1000);

  paint();

  /* MIDI and microphone notes arrive without DOM events; app.js reports them here. */
  window.LPKSession = { activity: activity };
})();
