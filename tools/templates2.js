/* Bodies for the guide and tool page families. */
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const faqBlock = (heading, items) => `
<section id="faq">
  <div class="wrap" style="max-width:820px">
    <p class="eyebrow">Questions</p>
    <h2>${heading}</h2>
    <div style="margin-top:24px">
${items.map(([q,a]) => `      <details class="faq"><summary>${esc(q)}</summary>
        <p>${a}</p>
      </details>`).join('\n')}
    </div>
  </div>
</section>`;

/* Related links rotate rather than always taking the first few, so every
   page is linked from somewhere and nothing ends up orphaned. */
function ring(list, self, n) {
  const others = list.filter(x => x.slug !== self);
  const start = list.findIndex(x => x.slug === self);
  const out = [];
  for (let i = 0; i < n && i < others.length; i++) out.push(others[(start + i) % others.length]);
  return out;
}

function guideBody(g, siblings) {
  const sameHub = siblings.filter(s => s.hub === g.hub && s.slug !== g.slug).slice(0, 2);
  const rotated = ring(siblings, g.slug, 4).filter(x => !sameHub.some(h => h.slug === x.slug));
  const rel = sameHub.concat(rotated).slice(0, 4);
  return `<section class="page-head">
  <div class="wrap">
    <p class="eyebrow">${esc(g.hub)}</p>
    <h1>${esc(g.h1)}</h1>
    <p class="answer-first">${esc(g.answer)}</p>
  </div>
</section>

<section id="keyboard">
  <div class="wrap">
    <div class="figure">
      <div class="keybed short"><div class="keys" id="guideKeys" data-low="${g.keys[0]}" data-high="${g.keys[1]}"${g.fingers ? ' data-fingers="1"' : ''} role="group" aria-label="Playable keyboard"></div></div>
      <div class="figure-cap"><p>Click any key to hear it. Your computer's A to K row works too.<span class="note-read" id="guideNote">&nbsp;</span></p></div>
    </div>
  </div>
</section>

${g.sections.map((s, i) => `<section id="s${i + 1}">
  <div class="wrap">
    <h2>${esc(s[0])}</h2>
    <p class="answer-first">${esc(s[1])}</p>
  </div>
</section>`).join('\n\n')}

<section id="next">
  <div class="wrap">
    <p class="eyebrow">Keep going</p>
    <h2>Read next</h2>
    <div class="grid" style="gap:12px">
${rel.map(r => `      <a class="piece" href="/${r.slug}.html"><span class="piece-lvl">&#9834;</span>
        <span><span class="piece-t">${esc(r.h1)}</span><br><span class="piece-c">${esc(r.desc.slice(0, 90))}</span></span>
        <span class="piece-go">Open &rarr;</span></a>`).join('\n')}
    </div>
    <p class="lede" style="margin-top:24px">Put it into practice in the <a href="/app.html">practice room</a>, or start at the beginning with the <a href="/piano-keys-for-beginners.html">five minute walkthrough</a>.</p>
  </div>
</section>

${faqBlock('Common questions', g.faq)}`;
}

const TOOL_UI = {
  chord: `<div class="tool-row">
      <label class="field"><span>Root</span><select id="tkRoot"></select></label>
      <label class="field"><span>Chord</span><select id="tkType"></select></label>
      <button class="btn btn-primary btn-sm" id="tkPlay">Play it</button>
    </div>
    <p class="tool-read"><strong id="tkName">C major</strong><span id="tkNotes">C &middot; E &middot; G</span></p>
    <div class="keybed short"><div class="keys" id="tkKeys" role="img" aria-label="Chord on a keyboard"></div></div>
    <p class="score-note" id="tkWhy"></p>`,
  scale: `<div class="tool-row">
      <label class="field"><span>Root</span><select id="tkRoot"></select></label>
      <label class="field"><span>Scale</span><select id="tkType"></select></label>
      <button class="btn btn-primary btn-sm" id="tkPlay">Play it</button>
    </div>
    <p class="tool-read"><strong id="tkName">C major</strong><span id="tkNotes"></span></p>
    <div class="keybed short"><div class="keys" id="tkKeys" role="img" aria-label="Scale on a keyboard"></div></div>
    <p class="score-note" id="tkWhy"></p>`,
  identify: `<p class="quiz-ask" id="tkName">Play three or more notes</p>
    <p class="tool-read"><span id="tkNotes">Nothing held yet</span></p>
    <div class="keybed short"><div class="keys" id="tkKeys" role="group" aria-label="Play notes here"></div></div>
    <div class="tool-row" style="margin-top:12px">
      <button class="btn btn-ghost btn-sm" id="tkClear">Clear</button>
      <span class="badge" id="tkMidi">Checking for MIDI…</span>
    </div>
    <p class="score-note">Click the keys to add notes. Inversions are recognised, so any order of the same notes gives the same answer.</p>`,
  metro: `<p class="metro-bpm"><strong id="tkBpm">80</strong> <span>BPM</span></p>
    <input type="range" id="tkRange" min="30" max="220" value="80" aria-label="Tempo">
    <div class="tool-row" style="margin-top:14px">
      <button class="btn btn-primary btn-sm" id="tkStart">Start</button>
      <button class="btn btn-ghost btn-sm" id="tkTap">Tap tempo</button>
      <label class="field"><span>Beats per bar</span><select id="tkBeats"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option></select></label>
    </div>
    <div class="beat-lights" id="tkLights" aria-hidden="true"></div>`,
  tap: `<p class="metro-bpm"><strong id="tkBpm">--</strong> <span>BPM</span></p>
    <div class="tool-row"><button class="btn btn-primary" id="tkTap">Tap in time</button>
    <button class="btn btn-ghost btn-sm" id="tkClear">Reset</button></div>
    <p class="score-note" id="tkWhy">Tap at least four times. Eight or more gives a steadier reading.</p>`,
  notequiz: `<p class="quiz-ask" id="tkName">Press start, then click the key it names.</p>
    <div class="quiz-score"><span>Run <strong id="tkScore">0</strong></span><span>Best <strong id="tkBest">0</strong></span></div>
    <div class="keybed short"><div class="keys" id="tkKeys" role="group" aria-label="Quiz keyboard"></div></div>
    <div class="tool-row" style="margin-top:12px">
      <button class="btn btn-primary btn-sm" id="tkStart">Start</button>
      <label class="field"><span>Include</span><select id="tkMode"><option value="white">White keys only</option><option value="all">White and black</option></select></label>
    </div>
    <p class="score-note" id="tkWhy">Your best run is kept in this browser.</p>`,
  sight: `<p class="quiz-ask" id="tkName">Press start, then play the note you see.</p>
    <canvas id="tkStave" role="img" aria-label="A note on the stave"></canvas>
    <div class="keybed short"><div class="keys" id="tkKeys" role="group" aria-label="Answer keyboard"></div></div>
    <div class="tool-row" style="margin-top:12px">
      <button class="btn btn-primary btn-sm" id="tkStart">Start</button>
      <label class="field"><span>Clef</span><select id="tkClef"><option value="treble">Treble</option><option value="bass">Bass</option><option value="both">Both</option></select></label>
    </div>
    <div class="quiz-score" style="margin-top:10px"><span>Run <strong id="tkScore">0</strong></span><span>Best <strong id="tkBest">0</strong></span></div>
    <p class="score-note" id="tkWhy">&nbsp;</p>`,
  timer: `<p class="timer-clock" id="tkClock">00:00</p>
    <div class="tool-row">
      <button class="btn btn-primary btn-sm" id="tkStart">Start</button>
      <button class="btn btn-ghost btn-sm" id="tkSave">Stop and save</button>
    </div>
    <div class="grid g3" style="margin-top:20px">
      <div class="card stat"><span class="card-num">TODAY</span><p class="stat-val"><strong id="tkToday">0</strong> min</p></div>
      <div class="card stat"><span class="card-num">STREAK</span><p class="stat-val"><strong id="tkStreak">0</strong> days</p></div>
      <div class="card stat"><span class="card-num">ALL TIME</span><p class="stat-val"><strong id="tkTotal">0</strong> min</p></div>
    </div>
    <p class="score-note" id="tkWhy">Time is added only when you stop and save, so leaving the tab open will not inflate it.</p>`,
  keyboard: `<div class="tool-row">
      <button class="pill active" id="tkNames" aria-pressed="true">Note names on</button>
      <span class="badge" id="tkMidi">Checking for MIDI…</span>
      <span class="note-read" id="tkName">&nbsp;</span>
    </div>
    <div class="keybed short" style="height:190px"><div class="keys" id="tkKeys" role="group" aria-label="Playable piano keyboard"></div></div>
    <p class="score-note">Computer keys: A S D F G H J K for the white notes, W E T Y U for the black. Z and X shift octave.</p>`,
  fifths: `<div class="fifths" id="tkCircle" role="group" aria-label="Circle of fifths"></div>
    <p class="tool-read"><strong id="tkName">C major</strong><span id="tkNotes"></span></p>
    <div class="keybed short"><div class="keys" id="tkKeys" role="img" aria-label="Scale on a keyboard"></div></div>
    <p class="score-note" id="tkWhy"></p>`
};

function toolBody(t, siblings) {
  const rel = ring(siblings, t.slug, 5);
  return `<section class="page-head">
  <div class="wrap">
    <p class="eyebrow">Free tool</p>
    <h1>${esc(t.h1)}</h1>
    <p class="answer-first">${esc(t.answer)}</p>
  </div>
</section>

<section id="tool">
  <div class="wrap">
    <div class="card tool" data-tool="${t.tool}">
      ${TOOL_UI[t.tool]}
    </div>
  </div>
</section>

<section id="more">
  <div class="wrap">
    <p class="eyebrow">More tools</p>
    <h2>Everything else here is free too</h2>
    <div class="grid" style="gap:12px">
${rel.map(r => `      <a class="piece" href="/${r.slug}.html"><span class="piece-lvl">&#9834;</span>
        <span><span class="piece-t">${esc(r.h1)}</span><br><span class="piece-c">${esc(r.desc.slice(0, 88))}</span></span>
        <span class="piece-go">Open &rarr;</span></a>`).join('\n')}
    </div>
  </div>
</section>

${faqBlock('Common questions', t.faq)}`;
}

module.exports = { guideBody, toolBody };
