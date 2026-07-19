/* Learn Piano Keys - practice timer and streak. Everything stays local. */

(function () {
  var clock = document.getElementById('timerClock');
  var hasTracker = !!clock;

  function paintStats() {
    var s = LPK.load();
    var mins = (s.minutes || {})[LPK.today()] || 0;
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set('todayMin', mins);
    set('totalMin', s.totalMinutes || 0);
    set('streakDays', LPK.streak());
    var w = document.getElementById('streakWord');
    if (w) w.textContent = LPK.streak() === 1 ? 'day' : 'days';
    var note = document.getElementById('todayNote');
    if (note) note.textContent = mins ? 'Logged today. That is the hard part done.' : 'Ready when you are.';

    var heat = document.getElementById('heat');
    if (heat) {
      heat.innerHTML = '';
      var days = [], max = 1;
      for (var i = 13; i >= 0; i--) {
        var v = (s.minutes || {})[LPK.dayKey(i)] || 0;
        days.push(v); if (v > max) max = v;
      }
      days.forEach(function (v) {
        var bar = document.createElement('i');
        bar.style.height = Math.max(4, Math.round(v / max * 70)) + 'px';
        if (v > 0) bar.classList.add('has');
        bar.title = v + ' min';
        heat.appendChild(bar);
      });
      var hn = document.getElementById('heatNote');
      if (hn) {
        var total = days.reduce(function (a, b) { return a + b; }, 0);
        hn.textContent = total ? total + ' minutes over the last fourteen days.' : 'Nothing logged yet.';
      }
    }

    var list = document.getElementById('bestList');
    if (list) {
      var best = s.best || {};
      var names = { twinkle: 'Twinkle, Twinkle, Little Star', 'ode-to-joy': 'Ode to Joy', 'fur-elise': 'Für Elise' };
      var keys = Object.keys(best);
      if (!keys.length) {
        list.innerHTML = '<p class="score-note">No saved runs yet. Play something in the practice room and your best scores appear here.</p>';
      } else {
        list.innerHTML = '';
        keys.forEach(function (k) {
          var b = best[k];
          var row = document.createElement('div');
          row.className = 'best-row';
          row.innerHTML = '<b>' + (names[k] || k) + '</b><span>' + b.acc + '% notes · ' + b.tim + '% timing' +
            (b.lit ? ' · ' + b.lit + '% reading' : '') + '</span>';
          list.appendChild(row);
        });
      }
    }
  }

  paintStats();
  if (!hasTracker) return;

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
    var mins = Math.round(elapsed / 60000);
    if (mins < 1) {
      var h = document.getElementById('hint');
      if (h) { h.textContent = 'Less than a minute, so nothing was added.'; h.classList.add('show'); setTimeout(function () { h.classList.remove('show'); }, 1800); }
    } else {
      LPK.addMinutes(mins);
    }
    elapsed = 0; render(); paintStats();
  });

  document.getElementById('timerReset').addEventListener('click', function () {
    if (running) { running = false; clearInterval(tick); document.getElementById('timerToggle').textContent = 'Start'; }
    elapsed = 0; render();
    var s = LPK.load();
    if (s.minutes && s.minutes[LPK.today()]) {
      s.totalMinutes = Math.max(0, (s.totalMinutes || 0) - s.minutes[LPK.today()]);
      delete s.minutes[LPK.today()];
      LPK.save(s);
    }
    paintStats();
  });

  document.getElementById('clearAll').addEventListener('click', function () {
    if (!confirm('Clear your streak, practice minutes, quiz best and saved scores on this device?')) return;
    LPK.clear();
    paintStats();
  });

  render();
})();
