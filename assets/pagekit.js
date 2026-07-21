/* Learn Piano Keys - the interactive bits on generated song, chord and scale
   pages. Every one of these pages carries a real playable keyboard rather
   than a picture of one, which is what stops them being thin pages. */

(function () {
  if (typeof PianoAudio === 'undefined') return;
  const audio = new PianoAudio();
  const NAT = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function midiOf(name, octave) {
    const letter = name[0];
    let acc = 0;
    for (const ch of name.slice(1)) { if (ch === '#') acc++; if (ch === 'b') acc--; }
    return (octave + 1) * 12 + NAT[letter] + acc;
  }

  function light(kb, midis) {
    kb.keys.forEach(k => k.classList.remove('lit'));
    midis.forEach(m => { const k = kb.keys.get(m); if (k) k.classList.add('lit'); });
  }

  function play(midis, together) {
    audio.resume();
    if (together) {
      midis.forEach(m => audio.noteOn(m, 0.7));
      setTimeout(() => midis.forEach(m => audio.noteOff(m)), 1500);
      return;
    }
    midis.forEach((m, i) => setTimeout(() => {
      audio.noteOn(m, 0.7);
      setTimeout(() => audio.noteOff(m), 340);
    }, i * 280));
  }

  function wireKeybed(id, low, high) {
    const host = document.getElementById(id);
    if (!host) return null;
    const kb = buildKeybed(host, low, high, { labels: true, markC: true });
    host.addEventListener('pointerdown', e => {
      const m = e.target.dataset && e.target.dataset.midi;
      if (!m) return;
      e.preventDefault();
      const midi = +m;
      audio.noteOn(midi, 0.8);
      const k = kb.keys.get(midi);
      if (k) k.classList.add('on', 'rh');
      setTimeout(() => { audio.noteOff(midi); if (k) k.classList.remove('on', 'rh'); }, 320);
    });
    return kb;
  }

  /* ---- chord page ---- */
  const chordBtn = document.querySelector('[data-hear-chord]');
  if (chordBtn) {
    const kb = wireKeybed('chordKeys', 60, 84);
    const names = [...document.querySelectorAll('.figure-cap b')][0];
    const list = names ? names.textContent.split('\u00b7').map(s => s.trim()) : [];
    let midis = [], last = -1;
    list.forEach(n => { let m = midiOf(n, 4); while (m <= last) m += 12; midis.push(m); last = m; });
    if (kb) light(kb, midis);
    chordBtn.addEventListener('click', () => play(midis, true));
  }

  /* ---- scale page ---- */
  const scaleBtn = document.querySelector('[data-hear-scale]');
  if (scaleBtn) {
    const kb = wireKeybed('scaleKeys', 60, 84);
    const names = [...document.querySelectorAll('.figure-cap b')][0];
    const list = names ? names.textContent.split('\u00b7').map(s => s.trim()) : [];
    let midis = [], last = -1;
    list.forEach(n => { let m = midiOf(n, 4); while (m <= last) m += 12; midis.push(m); last = m; });
    if (midis.length) midis.push(midis[0] + 12);
    if (kb) light(kb, midis);
    scaleBtn.addEventListener('click', () => play(midis, false));
  }

  /* ---- song page ---- */
  const songBtn = document.querySelector('[data-hear-piece]');
  if (songBtn && typeof PIECES !== 'undefined') {
    const piece = PIECES.find(p => p.id === songBtn.dataset.hearPiece);
    if (piece) {
      const mel = piece.notes.filter(n => n.h === 'r').sort((a, b) => a.s - b.s);
      const lo = Math.max(48, Math.min(...mel.map(n => n.m)) - 2);
      const hi = Math.min(84, Math.max(...mel.map(n => n.m)) + 2);
      const kb = wireKeybed('songKeys', lo, hi);
      if (kb) light(kb, [...new Set(mel.map(n => n.m))]);
      songBtn.addEventListener('click', () => {
        audio.resume();
        const unit = 60 / piece.bpm / 4;
        mel.slice(0, 24).forEach(n => setTimeout(() => {
          audio.noteOn(n.m, 0.75);
          const k = kb && kb.keys.get(n.m);
          if (k) k.classList.add('on', 'rh');
          setTimeout(() => { audio.noteOff(n.m); if (k) k.classList.remove('on', 'rh'); }, n.d * unit * 1000);
        }, (n.s - mel[0].s) * unit * 1000));
      });
    }
  }
})();
