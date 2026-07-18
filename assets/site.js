/* Learn Piano Keys · homepage */

(function () {
  var toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var n = document.getElementById('nav');
      n.classList.toggle('open');
      this.setAttribute('aria-expanded', n.classList.contains('open'));
    });
  }

  var host = document.getElementById('heroKeys');
  if (!host) return;

  var audio = new PianoAudio();
  var low = 55, high = 84;                        // G3 .. C6
  if (window.matchMedia('(max-width: 700px)').matches) { low = 60; high = 79; }
  var kb = buildKeybed(host, low, high, { labels: true, markC: true });

  function on(midi) {
    if (!kb.keys.has(midi)) return;
    audio.noteOn(midi, 0.8);
    kb.keys.get(midi).classList.add('on', 'rh');
  }
  function off(midi) {
    if (!kb.keys.has(midi)) return;
    audio.noteOff(midi);
    kb.keys.get(midi).classList.remove('on', 'rh');
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
})();
