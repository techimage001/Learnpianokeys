/* Page bodies for the generated families. One template per kind. */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const kb = (id, label) => `<div class="keybed short"><div class="keys" id="${id}" role="img" aria-label="${label}"></div></div>`;

function songBody(p, all) {
  const piece = p.piece;
  /* Related pieces chosen by difficulty: easier first if any, then peers,
     then the next step up. Each row explains its relationship in its own
     words, so no two pages carry the same link text. */
  const rest = all.filter(x => x.slug !== p.slug);
  const easier = rest.filter(x => x.piece.level < piece.level).sort((a, b) => b.piece.level - a.piece.level);
  const peers = rest.filter(x => x.piece.level === piece.level);
  const harder = rest.filter(x => x.piece.level > piece.level).sort((a, b) => a.piece.level - b.piece.level);
  const related = [];
  if (easier.length) related.push({ o: easier[0], rel: 'A step easier' });
  peers.slice(0, related.length ? 1 : 2).forEach(o => related.push({ o, rel: 'About the same level' }));
  if (harder.length) related.push({ o: harder[0], rel: 'The next step up' });
  while (related.length < 3 && related.length < rest.length) {
    const seen = related.map(r => r.o.slug);
    const next = rest.find(x => !seen.includes(x.slug));
    if (!next) break;
    related.push({ o: next, rel: next.piece.level === piece.level ? 'About the same level' : (next.piece.level < piece.level ? 'A step easier' : 'The next step up') });
  }
  const others = all.filter(x => x.slug !== p.slug).slice(0, 4);
  return `<section class="page-head">
  <div class="wrap">
    <p class="eyebrow">${esc(piece.composer)} &middot; ${esc(piece.keyName)}</p>
    <h1>${esc(p.h1)}</h1>
    <p class="answer-first">${esc(p.answer)}</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="/app.html?piece=${piece.id}">Play it now</a>
      <a class="btn btn-ghost" href="#levels">See the three levels</a>
    </div>
  </div>
</section>

<section id="levels">
  <div class="wrap">
    <p class="eyebrow">Three levels</p>
    <h2>Start at whichever one you can manage</h2>
    <div class="grid g3">
      ${piece.levels.map(l => `<a class="path-card" href="/app.html?piece=${piece.id}&level=${l.n}">
        <span class="card-num">LEVEL ${l.n}</span><h3>${esc(l.name)}</h3><p>${esc(l.hint)}</p>
        <span class="path-go">Play level ${l.n} &rarr;</span></a>`).join('\n      ')}
    </div>
    <p class="lede" style="margin-top:26px">${esc(piece.tip)}</p>
  </div>
</section>

<section id="notes">
  <div class="wrap">
    <p class="eyebrow">The notes</p>
    <h2>What notes are in ${esc(piece.title)}?</h2>
    <p class="answer-first">The melody uses ${esc(p.noteSummary)}. It is written in ${esc(piece.keyName)} in ${piece.meter.join('/')} time, and runs to ${piece.bars} bars.</p>
    <div class="figure">
      ${kb('songKeys', 'The notes used in this piece, shown on a keyboard')}
      <div class="figure-cap"><p>Every note the melody uses, lit on the keyboard. ${esc(piece.keyName)}.</p>
      <button class="pill" data-hear-piece="${piece.id}">Hear the opening</button></div>
    </div>
  </div>
</section>

<section id="mistakes">
  <div class="wrap">
    <p class="eyebrow">Before you start</p>
    <h2>Common mistakes on ${esc(piece.title)}</h2>
    <ol class="howto-steps">
      ${piece.mistakes.map(m => `<li>${esc(m)}</li>`).join('\n      ')}
    </ol>
    <p class="lede">The practice room highlights the bars you keep fluffing and offers to loop them, so you do not have to spot these yourself.</p>
  </div>
</section>

<section id="provenance">
  <div class="wrap">
    <p class="eyebrow">Copyright</p>
    <h2>Why this piece is free</h2>
    <p class="answer-first">${esc(piece.pd)} The arrangement, the fingering and the notation on this page are our own original work.</p>
    <p class="muted">See the full <a href="/public-domain-policy.html">public domain policy</a> for every piece on this site.</p>
  </div>
</section>

<section id="next">
  <div class="wrap">
    <p class="eyebrow">Keep going</p>
    <h2>After this piece</h2>
    <div class="grid" style="gap:12px">
      ${related.map(r => `<a class="piece" href="/${r.o.slug}.html"><span class="piece-lvl">${r.o.piece.level}</span>
        <span><span class="piece-t">${esc(r.o.piece.title)}</span><br><span class="piece-c">${r.rel}: ${esc(r.o.piece.levelName.toLowerCase())} &middot; ${esc(r.o.piece.keyName)} in ${r.o.piece.meter.join('/')} time</span></span>
        <span class="piece-go">Open &rarr;</span></a>`).join('\n      ')}
    </div>
    <p class="lede" style="margin-top:24px">New to reading the dots? The <a href="/how-to-read-music.html">guide to reading music</a> is free, and the <a href="/piano-keys-for-beginners.html">five minute walkthrough</a> comes before everything else.</p>
  </div>
</section>`;
}

function chordBody(p, allChords) {
  const others = allChords.filter(c => c.slug !== p.slug).slice(0, 5);
  return `<section class="page-head">
  <div class="wrap">
    <p class="eyebrow">Chord</p>
    <h1>${esc(p.h1)}</h1>
    <p class="answer-first">${esc(p.answer)}</p>
    <div class="figure" style="margin-top:24px">
      ${kb('chordKeys', p.root + ' ' + p.type + ' shown on a keyboard')}
      <div class="figure-cap"><p><b>${esc(p.names.join(' \u00b7 '))}</b></p>
      <button class="pill" data-hear-chord="${p.root}|${p.type}">Hear it</button></div>
    </div>
  </div>
</section>

<section id="how">
  <div class="wrap">
    <h2>How do you play ${esc(p.root)} ${esc(p.type)} on the piano?</h2>
    <p class="answer-first">Put your right thumb on ${esc(p.names[0])}, your middle finger on ${esc(p.names[1])} and your little finger on ${esc(p.names[2])}, then press all three together. Fingers 1, 3 and 5. Keep the hand relaxed and let the arm carry the weight rather than pushing with the fingers.</p>
    <h2>What is the difference between ${esc(p.root)} ${esc(p.type)} and ${esc(p.root)} ${p.type === 'major' ? 'minor' : 'major'}?</h2>
    <p class="answer-first">One note. The middle note moves by a single semitone. ${p.type === 'major'
      ? `In ${esc(p.root)} major the middle note is ${esc(p.names[1])}; in ${esc(p.root)} minor it drops one semitone.`
      : `In ${esc(p.root)} minor the middle note is ${esc(p.names[1])}; in ${esc(p.root)} major it rises one semitone.`} That single semitone is the whole difference between the bright sound and the sad one.</p>
    <p class="lede"><a href="/tools.html#chords">Try it in the chord finder</a>, which draws any chord on a keyboard and plays it.</p>
  </div>
</section>

<section id="more">
  <div class="wrap">
    <p class="eyebrow">Related</p>
    <h2>Other chords worth learning</h2>
    <div class="grid" style="gap:12px">
      ${others.map(o => `<a class="piece" href="/${o.slug}.html"><span class="piece-lvl">&#9834;</span>
        <span><span class="piece-t">${esc(o.root)} ${esc(o.type)}</span><br><span class="piece-c">${esc(o.names.join(' \u00b7 '))}</span></span>
        <span class="piece-go">Open &rarr;</span></a>`).join('\n      ')}
    </div>
    <p class="lede" style="margin-top:24px">Chords are built from scales, so the <a href="/scales.html">scale pages</a> are the natural next step, and <a href="/how-to-read-music.html">reading the stave</a> makes both easier.</p>
  </div>
</section>`;
}

function scaleBody(p, allScales) {
  const others = allScales.filter(c => c.slug !== p.slug).slice(0, 5);
  const notes = p.names.slice(0, -1);
  return `<section class="page-head">
  <div class="wrap">
    <p class="eyebrow">Scale</p>
    <h1>${esc(p.h1)}</h1>
    <p class="answer-first">${esc(p.answer)}</p>
    <div class="figure" style="margin-top:24px">
      ${kb('scaleKeys', p.root + ' ' + p.type + ' shown on a keyboard')}
      <div class="figure-cap"><p><b>${esc(notes.join(' \u00b7 '))}</b></p>
      <button class="pill" data-hear-scale="${p.root}|${p.type}">Hear it</button></div>
    </div>
  </div>
</section>

<section id="fingering">
  <div class="wrap">
    <h2>What is the fingering for the ${esc(p.root)} ${esc(p.type)} scale?</h2>
    <p class="answer-first">Right hand: ${esc(p.fingering)}. Start with the thumb on ${esc(p.names[0])} and tuck it under after the third note so the hand can carry on without stopping. The left hand mirrors it, starting with the little finger.</p>
    <h2>Why learn this scale?</h2>
    <p class="answer-first">A scale is the set of notes a piece is built from. Learning ${esc(p.root)} ${esc(p.type)} means the notes of any piece in that key are already under your fingers, and the chords come from the same set. It is pattern practice, not a test.</p>
    <p class="lede"><a href="/tools.html#scales">Open the scale explorer</a> to see any scale drawn on a keyboard, or practise reading it on the <a href="/how-to-read-music.html#trainer">note trainer</a>.</p>
  </div>
</section>

<section id="more">
  <div class="wrap">
    <p class="eyebrow">Related</p>
    <h2>Other scales worth learning</h2>
    <div class="grid" style="gap:12px">
      ${others.map(o => `<a class="piece" href="/${o.slug}.html"><span class="piece-lvl">&#9834;</span>
        <span><span class="piece-t">${esc(o.root)} ${esc(o.type)}</span><br><span class="piece-c">${esc(o.names.slice(0,-1).join(' \u00b7 '))}</span></span>
        <span class="piece-go">Open &rarr;</span></a>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

module.exports = { songBody, chordBody, scaleBody, esc };
