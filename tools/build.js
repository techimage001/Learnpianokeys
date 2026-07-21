/* Learn Piano Keys - page generator
   node tools/build.js
   Emits every page at the repo root from src/*.html bodies, so head, nav,
   footer, favicons and asset versions can never drift between page families. */

const fs = require('fs');
const path = require('path');

const ASSET_V = '17';
const SITE = 'https://learnpianokeys.com';
const AUTHOR = 'Learn Piano Keys';
const BUILT = new Date().toISOString().slice(0, 10);
const BRAND = 'Learn Piano Keys';

/* IndexNow. One key, shared by Bing, Yandex, Seznam, Naver and Yep: submit
   once and every participating engine is told. Google does not take part,
   so Google is handled through Search Console and the sitemap.
   Do not change this key once live: the key file at the root must match. */
const INDEXNOW_KEY = '79e2624f7b502947f1147e5f7b9c8dd2';

/* Search engine ownership verification. Paste the value each webmaster tool
   gives you. Empty entries emit no tag at all, so there are never any
   dangling meta tags on the page. */
const VERIFY = {
  'google-site-verification': '',   // Google Search Console
  'msvalidate.01':            '',   // Bing Webmaster Tools
  'yandex-verification':      '',   // Yandex Webmaster
  'naver-site-verification':  '',   // Naver Search Advisor
  'baidu-site-verification':  '',   // Baidu Ziyuan
  'seznam-wmt':               '',   // Seznam Webmaster
  'p:domain_verify':          ''    // Pinterest
};
const ROOT = path.join(__dirname, '..');
const gen = require('./gen-content.js');
const tpl = require('./templates.js');
const tpl2 = require('./templates2.js');
const GUIDES = require('../data/guides.js');
const TOOLPAGES = require('../data/toolpages.js');
const LESSONS = require('./lessons-data.js');
gen.emitRuntime();

const SONGS  = gen.songPages();
const CHORDS = gen.chordPages();
const SCALES = gen.scalePages();

/* Which notes each melody uses, stated in words for the answer paragraph. */
const PC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
SONGS.forEach(sp => {
  const used = [...new Set(sp.piece.notes.filter(n => n.h === 'r').map(n => PC[n.m % 12]))];
  const order = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  used.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  sp.noteSummary = used.length + ' different notes: ' + used.join(', ');
});

/* ---------------- the five lesson course, generated from lessons-data ---------------- */
function esc2(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function lessonBody(L, all) {
  const prev = all.find(x => x.n === L.n - 1);
  const next = all.find(x => x.n === L.n + 1);
  const json = JSON.stringify({ slug: L.slug, exercise: L.exercise, quiz: L.quiz })
    .replace(/</g, '\\u003c');
  const sections = L.sections.map((sec, i) => {
    /* one contextual link woven under a section, so the internal linking sits
       inside the reading rather than in a box nobody reads */
    const lk = L.links[i];
    const tail = lk ? `\n    <p class="muted read-on">More on this: <a href="${lk[0]}">${esc2(lk[1])}</a>.</p>` : '';
    return `    <h2>${esc2(sec.h)}</h2>\n` + sec.ps.map(t => `    <p class="muted">${esc2(t)}</p>`).join('\n') + tail;
  }).join('\n');

  const learnBox = `    <div class="card learn-box">
      <span class="card-num">WHAT YOU WILL LEARN</span>
      <ul class="learn-list">
${L.learn.map(x => `        <li>${esc2(x)}</li>`).join('\n')}
      </ul>
      <p class="muted">About ten minutes of reading, a keyboard exercise you play yourself, and a ten question quiz at the end.</p>
    </div>`;

  const recapBox = `<section id="recap">
  <div class="wrap" style="max-width:820px">
    <div class="card">
      <span class="card-num">QUICK RECAP</span>
      <ul class="recap-list">
${L.recap.map(x => `        <li>${esc2(x)}</li>`).join('\n')}
      </ul>
      <p class="muted">Read these four lines again before the quiz and you will almost certainly pass it first time.</p>
    </div>
  </div>
</section>`;

  const pairBox = `<section id="reference">
  <div class="wrap" style="max-width:820px">
    <p class="muted">Want the short version instead of the lesson? <a href="/${L.pair[0]}.html">${esc2(L.pair[1])}</a> is ${esc2(L.pair[2])}.</p>
  </div>
</section>`;
  const isRhythm = L.exercise.type === 'rhythm';
  const isStaff = L.exercise.type === 'staff';
  return `<section class="page-head">
  <div class="wrap">
    <p class="eyebrow">${esc2(L.eyebrow)}</p>
    <h1>${esc2(L.navTitle)}</h1>
    <p class="lede">${esc2(L.lede)}</p>
  </div>
</section>

<section>
  <div class="wrap" style="max-width:820px">
${learnBox}
${sections}
  </div>
</section>

<section id="exercise" data-quiet-practice>
  <div class="wrap">
    <div class="card lesson-ex">
      <span class="card-num">${esc2(L.exercise.heading).toUpperCase()}</span>
      <p class="muted">${esc2(L.exercise.note)}</p>
      ${isStaff ? '<div class="staff-wrap"><canvas id="exStaff" width="360" height="150" role="img" aria-label="A treble staff showing one note to name"></canvas></div>' : ''}
      <p class="ex-prompt" id="exPrompt">Loading the exercise&hellip;</p>
      ${isRhythm ? '<div class="beat-dots" id="exBeats" aria-hidden="true"></div>' : ''}
      <div class="keybed lesson-kb"><div class="keys" id="exKeys" role="group" aria-label="Piano keyboard for this exercise"></div></div>
      <p class="ex-feedback" id="exFeedback" aria-live="polite"></p>
      <div class="tool-row" style="margin-top:14px">
        <button class="btn btn-ghost btn-sm" id="exDemo" type="button">Hear the demo</button>
        ${isRhythm ? '<button class="btn btn-primary btn-sm" id="exGo" type="button">Start the pattern</button>' : ''}
        <span class="badge" id="exProgress"></span>
      </div>
      <div class="ex-done" id="exDone" hidden>
        <p><b>Exercise complete.</b> Nicely done.</p>
        ${L.exercise.handoff ? `<p class="muted">${esc2(L.exercise.handoff.text)}</p><p><a class="btn btn-primary btn-sm" href="${L.exercise.handoff.href}">${esc2(L.exercise.handoff.label)}</a></p>` : ''}
      </div>
    </div>
  </div>
</section>

${recapBox}

<section id="quiz">
  <div class="wrap" style="max-width:820px">
    <div class="card" id="quizBox">
      <span class="card-num">TEST YOUR KNOWLEDGE</span>
      <div id="quizIntro">
        <p class="muted">Ten questions from this lesson, one at a time, four answers each. You get ten minutes, the same pace as a real theory test, and every answer is explained whether you get it right or not. Score ten out of ten and you are ready for the next lesson.</p>
        <p class="score-note" id="quizBest"></p>
        <label class="quiz-toggle"><input type="checkbox" id="quizNoClock"> Prefer no clock? Take it untimed.</label>
        <p style="margin-top:14px"><button class="btn btn-primary" id="quizStart" type="button">Start the quiz</button></p>
      </div>
      <div id="quizLive" hidden></div>
    </div>
  </div>
</section>

<section id="lesson-faq">
  <div class="wrap" style="max-width:820px">
    <p class="eyebrow">Questions</p>
    <h2>About this lesson</h2>
    <div style="margin-top:24px">
${L.faq.map(f => `      <details class="faq"><summary>${esc2(f.q)}</summary>\n        <p>${esc2(f.a)}</p>\n      </details>`).join('\n')}
    </div>
    <p class="lede" style="margin-top:28px">${prev ? `<a href="/${prev.slug}.html">&larr; Lesson ${prev.n}: ${esc2(prev.navTitle)}</a> &middot; ` : `<a href="/piano-keys-for-beginners.html">&larr; The five minute walkthrough</a> &middot; `}<a href="/piano-lessons.html">All lessons</a>${next ? ` &middot; <a href="/${next.slug}.html">Lesson ${next.n}: ${esc2(next.navTitle)} &rarr;</a>` : ` &middot; <a href="/app.html">To the practice room &rarr;</a>`}</p>
  </div>
</section>

${pairBox}

<script type="application/json" id="lessonData">${json}</script>`;
}

function lessonsHubBody(all) {
  return `<section class="page-head">
  <div class="wrap">
    <p class="eyebrow">The course</p>
    <h1>Free piano lessons, in order</h1>
    <p class="lede">Five lessons that take you from a wall of identical keys to reading real notes on a staff. Each one teaches a single idea, lets you practise it on a playable keyboard, and ends with a ten question quiz that tells you when you are ready to move on. Work through them in order, at whatever pace suits you. Nothing is locked.</p>
  </div>
</section>

<section>
  <div class="wrap" style="max-width:820px">
    <div class="card" style="margin-bottom:20px">
      <span class="card-num">BEFORE LESSON 1</span>
      <p class="muted"><b>Never touched a piano?</b> Start with the five minute walkthrough: six tiny steps that end with you playing the opening of a real tune. It asks nothing of you and takes about five minutes.</p>
      <p><a class="btn btn-primary btn-sm" href="/piano-keys-for-beginners.html">Do the five minute walkthrough</a></p>
    </div>
    <div class="lesson-list" data-lessons-hub>
${all.map(L => `      <a class="lesson-card" href="/${L.slug}.html" data-lesson="${L.slug}">
        <span class="lesson-num">${L.n}</span>
        <span class="lesson-body"><b>${esc2(L.navTitle)}</b><span class="muted">${esc2(L.lede.split('.')[0])}.</span><span class="lesson-status" data-lesson-status="${L.slug}"></span></span>
        <span class="piece-go">Open &rarr;</span>
      </a>`).join('\n')}
    </div>
    <p class="lede" style="margin-top:28px">Your quiz scores and exercise progress are saved in this browser and shown on your <a href="/practice.html">progress page</a>.</p>
  </div>
</section>

<section id="how-it-works">
  <div class="wrap" style="max-width:820px">
    <h2>How each lesson works</h2>
    <p class="muted">Every lesson is built the same way, so once you have done one you know exactly what to expect from the rest. There is no jargon, no sheet music you cannot yet read, and nothing you have to buy or sign up for.</p>
    <p class="muted"><b>First you read.</b> One idea per lesson, explained in plain English, in about ten minutes. If a word needs explaining, it gets explained on the spot rather than in a glossary somewhere else.</p>
    <p class="muted"><b>Then you play it.</b> A real keyboard sits inside the lesson. Keys light up in the colour of the hand you should use, with the finger number printed on them, and you follow the glow. If you would rather watch first, <b>Hear the demo</b> plays the whole exercise for you, keys and all, then hands it back.</p>
    <p class="muted"><b>Then you test yourself.</b> Ten multiple choice questions, one at a time, four answers each. Right or wrong, you are told why, because the explanation is the part that teaches. Score ten out of ten and the lesson tells you that you are ready to move on. Score less and it suggests another read, which is advice, not a locked door.</p>
    <p class="muted">You can play the keyboard by tapping it, by using your computer keys, or by plugging in a MIDI keyboard. Nothing needs installing and nothing needs tuning.</p>
  </div>
</section>

<section id="who-for">
  <div class="wrap" style="max-width:820px">
    <h2>Who this course is for</h2>
    <p class="muted">Complete beginners. If you have never sat at a piano, never read a note, and are not sure whether the black keys even matter, you are exactly who this was written for. Everything starts from nothing.</p>
    <p class="muted">It suits a curious ten year old and a curious sixty year old equally, because the explanations do not assume anything and the exercises are played rather than read about. Younger learners tend to move fastest through lessons one to three; adults often prefer to slow down on rhythm and reading, which is lessons four and five.</p>
    <p class="muted">It also works as a refresher. If you played as a child and the note names have faded, the five quizzes will find your gaps in about half an hour.</p>
    <p class="muted">You do not need a real piano to start. A phone or a laptop is enough for the first three lessons, though a keyboard with real keys makes lessons two and four feel much more natural when you get there.</p>
  </div>
</section>

<section id="course-time">
  <div class="wrap" style="max-width:820px">
    <h2>How long the whole course takes</h2>
    <p class="muted">Each lesson runs about fifteen to twenty minutes: ten minutes reading, a few minutes on the keyboard exercise, and up to ten on the quiz. Five lessons is therefore an afternoon if you push, or a comfortable week at one lesson a day.</p>
    <p class="muted">A week is the better plan. Rhythm and note reading both improve with sleep in between, and the quizzes are more useful when you take them a day after the lesson rather than three minutes after it. Nothing expires, so there is no reason to rush.</p>
    <p class="muted">After lesson five, the natural next steps are the <a href="/app.html">practice room</a>, where you play real songs with the same glowing keys and timing feedback, and the <a href="/how-to-read-music.html">full reading guide</a>, which picks up the bass clef and note lengths where lesson five stops. The <a href="/beginner-piano-roadmap.html">beginner roadmap</a> lays out what comes after that.</p>
  </div>
</section>

<section id="hub-faq">
  <div class="wrap" style="max-width:820px">
    <p class="eyebrow">Questions</p>
    <h2>About the course</h2>
    <div style="margin-top:24px">
      <details class="faq"><summary>Do I have to take the lessons in order?</summary>
        <p>It is the order they were written in, and each one leans on the one before, so working straight through is the fastest route. Nothing is locked though. If you already know the keyboard layout, open lesson two and start there.</p>
      </details>
      <details class="faq"><summary>Where are my quiz scores saved?</summary>
        <p>In your own browser, on the device you used, rather than on a server. That is why your progress follows you on that device and does not appear on a different one, and why clearing your browser data clears it. Nothing about your practice is uploaded anywhere.</p>
      </details>
      <details class="faq"><summary>Do I need a real piano or keyboard?</summary>
        <p>Not to start. The keyboard inside each lesson makes real sound in your browser, so a phone or laptop covers the first three lessons. Once you reach hand position and rhythm, physical keys under your fingers help a great deal, and a basic 61 key keyboard is enough for everything on this site.</p>
      </details>
      <details class="faq"><summary>What if I score badly on a quiz?</summary>
        <p>Nothing happens except a suggestion to read the lesson again and retake it. Retakes are unlimited, and each one draws a fresh ten questions from a bank of twenty, so a retake is a genuinely different test rather than the same one in a new order. Only your best score is kept.</p>
      </details>
      <details class="faq"><summary>Is the quiz timer compulsory?</summary>
        <p>No. Ten minutes for ten questions is the default because it mirrors a real theory test and keeps you focused, and it is far more time than the questions need. If a clock puts you off, tick the untimed box on the quiz start card and it will remember that choice.</p>
      </details>
      <details class="faq"><summary>Is this course suitable for children?</summary>
        <p>The site is written for adults, but the language is deliberately plain and every idea is demonstrated on a keyboard rather than described in theory, so a child of about ten upwards can follow it comfortably. Younger children usually do better with a person sitting next to them.</p>
      </details>
    </div>
  </div>
</section>`;
}

/* Hubs, the policy page and every generated family, added to the page list. */
const GENERATED = []
  .concat([{ slug: 'piano-lessons', url: '/piano-lessons.html',
      title: 'Free Piano Lessons for Beginners: A Five Lesson Course',
      desc: 'Five free piano lessons in order: keyboard layout, finger numbers, steps and skips, rhythm, and reading the staff. Each with a quiz.',
      scripts: ['engine', 'gate', 'site', 'lessons'],
      crumbs: [['Lessons', '/piano-lessons.html']],
      published: '2026-07-21', ogAlt: 'Five free piano lessons for beginners, each with a playable keyboard',
      body: lessonsHubBody(LESSONS) }])
  .concat(LESSONS.map(L => ({ slug: L.slug, url: '/' + L.slug + '.html',
      title: L.metaTitle, desc: L.desc,
      scripts: ['engine', 'gate', 'site', 'session', 'lessons'],
      crumbs: [['Lessons', '/piano-lessons.html'], [L.navTitle, '/' + L.slug + '.html']],
      published: '2026-07-21', ogAlt: L.ogAlt,
      body: lessonBody(L, LESSONS) })))
  .concat(SONGS.map(x  => ({ slug: x.slug, url: '/' + x.slug + '.html', title: x.title, desc: x.desc,
      scripts: ['pieces','engine','gate','site','pagekit'], crumbs: [['Songs','/songs.html'],[x.piece.title,'/' + x.slug + '.html']],
      published: '2026-07-20', ogAlt: x.piece.title + ' piano notes for beginners',
      body: tpl.songBody(x, SONGS), speakable: true, faqFrom: x })))
  .concat(CHORDS.map(x => ({ slug: x.slug, url: '/' + x.slug + '.html', title: x.title, desc: x.desc,
      scripts: ['engine','gate','site','pagekit'], crumbs: [['Chords','/chords.html'],[x.root + ' ' + x.type,'/' + x.slug + '.html']],
      published: '2026-07-20', ogAlt: x.root + ' ' + x.type + ' chord shown on a piano keyboard',
      body: tpl.chordBody(x, CHORDS), speakable: true })))
  .concat(SCALES.map(x => ({ slug: x.slug, url: '/' + x.slug + '.html', title: x.title, desc: x.desc,
      scripts: ['engine','gate','site','pagekit'], crumbs: [['Scales','/scales.html'],[x.root + ' ' + x.type,'/' + x.slug + '.html']],
      published: '2026-07-20', ogAlt: x.root + ' ' + x.type + ' scale shown on a piano keyboard',
      body: tpl.scaleBody(x, SCALES), speakable: true })))
  .concat(GUIDES.map(x => ({ slug: x.slug, url: '/' + x.slug + '.html', title: x.title, desc: x.desc,
      scripts: ['engine','gate','site','toolkit'], crumbs: [[x.hub, hubUrl(x.hub)], [x.h1, '/' + x.slug + '.html']],
      published: '2026-07-20', ogAlt: x.h1 + ' for beginners on Learn Piano Keys',
      body: tpl2.guideBody(x, GUIDES), speakable: true })))
  .concat(TOOLPAGES.map(x => ({ slug: x.slug, url: '/' + x.slug + '.html', title: x.title, desc: x.desc,
      scripts: ['engine','gate','site','toolkit'], crumbs: [['Tools','/tools.html'], [x.h1, '/' + x.slug + '.html']],
      published: '2026-07-20', ogAlt: x.h1 + ', a free tool on Learn Piano Keys',
      body: tpl2.toolBody(x, TOOLPAGES), speakable: true })));

function hubUrl(hub) {
  return { 'Start learning': '/piano-keys-for-beginners.html', 'Read music': '/how-to-read-music.html',
           'Chords': '/chords.html', 'Scales': '/scales.html', 'Practice': '/practice.html' }[hub] || '/';
}


const PAGES = [
  {
    slug: 'index',
    url: '/',
    published: '2026-07-18',
    ogAlt: 'Learn Piano Keys: a free browser piano practice room, shown with a piano keybed',
    title: 'Learn Piano Keys: Free Lessons, Tools and Practice Room',
    desc: 'Learn the piano keys from scratch, then practise real pieces with fingering, three levels and music that waits for you. Free, no card.',
    scripts: ['engine', 'gate', 'site', 'tracker'],
    crumbs: []
  },
  {
    slug: 'piano-keys-for-beginners',
    url: '/piano-keys-for-beginners.html',
    published: '2026-07-19',
    ogAlt: 'Your first five minutes at the piano: a six step beginner walkthrough',
    title: 'Piano Keys for Beginners: Your First Five Minutes',
    desc: 'Never touched a piano? Six short steps, one octave, no jargon. Find middle C and play a real tune in about five minutes. Free.',
    scripts: ['engine', 'gate', 'site', 'session', 'lesson'],
    crumbs: [['Lessons', '/piano-lessons.html'], ['Piano keys for beginners', '/piano-keys-for-beginners.html']]
  },
  {
    slug: 'how-to-read-music',
    url: '/how-to-read-music.html',
    published: '2026-07-19',
    ogAlt: 'How to read music: the treble and bass clef explained with playable diagrams',
    title: 'How to Read Music Notes: Free Interactive Guide',
    desc: 'Learn the treble and bass clef with playable diagrams, then practise on a note trainer that waits for you to play what you see.',
    scripts: ['engine', 'gate', 'site', 'reading'],
    speakable: true,
    crumbs: [['How to read music', '/how-to-read-music.html']]
  },
  {
    slug: 'tools',
    url: '/tools.html',
    published: '2026-07-19',
    ogAlt: 'Free piano tools: chord finder, scale explorer, metronome and note quiz',
    title: 'Free Piano Tools: Chords, Scales, Metronome, Quiz',
    desc: 'Four practice tools that run in your browser. Find any chord, see any scale, keep time with a tap tempo metronome, test your notes.',
    scripts: ['engine', 'gate', 'site', 'tools'],
    crumbs: [['Tools', '/tools.html']]
  },
  {
    slug: 'practice',
    url: '/practice.html',
    published: '2026-07-19',
    ogAlt: 'Your piano practice progress: minutes, streaks and scores kept in your own browser',
    title: 'Piano Practice Progress: Minutes, Streaks and Scores',
    desc: 'Your practice minutes, streaks and best scores, charted over any date range and kept in your own browser rather than on a server. Nothing uploaded.',
    scripts: ['engine', 'gate', 'site', 'tracker'],
    crumbs: [['Progress', '/practice.html']]
  },
  {
    slug: 'app',
    url: '/app.html',
    published: '2026-07-18',
    ogAlt: 'The Learn Piano Keys practice room, with falling notes above a piano keybed',
    title: 'Practice Room: Play a Real Piece',
    desc: 'Practise real pieces with wait mode, section looping, hand separation, tempo, transpose, count-in, sustain pedal and a grand staff.',
    scripts: ['pieces', 'engine', 'gate', 'site', 'share', 'session', 'app'],
    crumbs: [['Practice room', '/app.html']],
    noindex: true,
    wide: true
  },
  { slug: 'songs', url: '/songs.html', published: '2026-07-20',
    ogAlt: 'Free piano songs for beginners with notes and fingering',
    title: 'Easy Piano Songs for Beginners: Notes and Fingering',
    desc: 'Free piano notes for easy beginner songs. Three levels each, fingering on every note, and the music waits for you.',
    scripts: ['engine','gate','site'], crumbs: [['Songs','/songs.html']] },
  { slug: 'chords', url: '/chords.html', published: '2026-07-20',
    ogAlt: 'Piano chords for beginners shown on a keyboard',
    title: 'Piano Chords for Beginners: Major and Minor',
    desc: 'Every beginner piano chord with the notes, the fingering and a keyboard diagram you can hear. Free, nothing to install.',
    scripts: ['engine','gate','site'], crumbs: [['Chords','/chords.html']] },
  { slug: 'scales', url: '/scales.html', published: '2026-07-20',
    ogAlt: 'Piano scales for beginners shown on a keyboard',
    title: 'Piano Scales for Beginners: Notes and Fingering',
    desc: 'Piano scales with the correct notes, standard fingering and a keyboard you can hear. Start with C major.',
    scripts: ['engine','gate','site'], crumbs: [['Scales','/scales.html']] },
  { slug: 'public-domain-policy', url: '/public-domain-policy.html', published: '2026-07-20',
    ogAlt: 'The public domain policy for Learn Piano Keys',
    title: 'Public Domain Music Policy',
    desc: 'Every piece on this site, its composer, when they died and why it is out of copyright. Our arrangements are our own work.',
    scripts: ['engine','gate','site'], crumbs: [['Public domain policy','/public-domain-policy.html']], narrow: true },
  { slug: '404', url: '/404.html', published: '2026-07-19',
    ogAlt: 'Page not found on Learn Piano Keys', title: 'Page Not Found',
    desc: 'That page does not exist. Here is the way back to the lessons, the tools and the practice room.',
    scripts: ['engine', 'gate', 'site'], crumbs: [], noindex: true, narrow: true },
  { slug: 'privacy', url: '/privacy.html', published: '2026-07-18',
    ogAlt: 'Privacy at Learn Piano Keys: no advertising and nothing uploaded', title: 'Privacy: What We Collect',
    desc: 'What Learn Piano Keys does and does not collect. Your playing never leaves your device.',
    scripts: ['engine', 'gate', 'site'], crumbs: [['Privacy', '/privacy.html']], narrow: true },
  { slug: 'terms', url: '/terms.html', published: '2026-07-18',
    ogAlt: 'Terms of use for Learn Piano Keys', title: 'Terms of Use',
    desc: 'Terms of use for Learn Piano Keys, a free browser piano practice tool.',
    scripts: ['engine', 'gate', 'site'], crumbs: [['Terms', '/terms.html']], narrow: true },
  { slug: 'contact', url: '/contact.html', published: '2026-07-18',
    ogAlt: 'Contact Learn Piano Keys', title: 'Contact Learn Piano Keys',
    desc: 'Contact Learn Piano Keys about a bug, a piece you would like added, or anything else.',
    scripts: ['engine', 'gate', 'site'], crumbs: [['Contact', '/contact.html']], narrow: true }
];

const FAVICONS = `  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-48.png" sizes="48x48" type="image/png">
  <link rel="icon" href="/favicon-96.png" sizes="96x96" type="image/png">
  <link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">`;

const FONTS = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=IBM+Plex+Mono:wght@400;600&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">`;

function ogImage(p) {
  return 'og-' + (p.slug === 'index' ? 'index' : p.slug) + '.png';
}

function verifyTags() {
  return Object.keys(VERIFY)
    .filter(k => VERIFY[k])
    .map(k => `  <meta name="${k}" content="${VERIFY[k]}">\n`)
    .join('');
}

function nav(active) {
  const items = [
    ['Start here', '/piano-keys-for-beginners.html', 'piano-keys-for-beginners'],
    ['Lessons', '/piano-lessons.html', 'piano-lessons'],
    ['Read music', '/how-to-read-music.html', 'how-to-read-music'],
    ['Songs', '/songs.html', 'songs'],
    ['Chords', '/chords.html', 'chords'],
    ['Tools', '/tools.html', 'tools'],
    ['Progress', '/practice.html', 'practice'],
    ['What is free', '/#compare', null]
  ];
  return items.map(([label, href, slug]) =>
    `      <a href="${href}"${slug && slug === active ? ' aria-current="page"' : ''}>${label}</a>`
  ).join('\n');
}

function breadcrumbHtml(crumbs) {
  if (!crumbs.length) return '';
  const parts = ['<a href="/">Home</a>'].concat(
    crumbs.map((c, i) => i === crumbs.length - 1 ? `<span aria-current="page">${c[0]}</span>` : `<a href="${c[1]}">${c[0]}</a>`)
  );
  return `<nav class="crumbs" aria-label="Breadcrumb"><div class="wrap">${parts.join('<span class="sep">/</span>')}</div></nav>\n`;
}

function breadcrumbSchema(crumbs, url) {
  if (!crumbs.length) return null;
  const list = [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }];
  crumbs.forEach((c, i) => list.push({ '@type': 'ListItem', position: i + 2, name: c[0], item: SITE + c[1] }));
  return { '@type': 'BreadcrumbList', '@id': SITE + url + '#breadcrumb', itemListElement: list };
}

function siteSchema(p) {
  return [
    { '@type': 'Organization', '@id': SITE + '/#org', name: BRAND, url: SITE + '/',
      logo: { '@type': 'ImageObject', url: SITE + '/favicon-512.png', width: 512, height: 512 },
      email: 'info@learnpianokeys.com',
      description: 'Free piano lessons, practice tools and a browser practice room. No advertising.' },
    { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: BRAND,
      publisher: { '@id': SITE + '/#org' }, inLanguage: 'en-GB' },
    {
      '@type': 'WebPage',
      '@id': SITE + p.url + '#webpage',
      url: SITE + p.url,
      name: p.title,
      description: p.desc,
      isPartOf: { '@id': SITE + '/#website' },
      about: { '@id': SITE + '/#org' },
      inLanguage: 'en-GB',
      datePublished: p.published,
      dateModified: BUILT,
      isAccessibleForFree: true,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: SITE + '/' + ogImage(p),
        width: 1200, height: 630,
        caption: p.ogAlt
      },
      author: { '@id': SITE + '/#org' },
      publisher: { '@id': SITE + '/#org' },
      ...(p.crumbs.length ? { breadcrumb: { '@id': SITE + p.url + '#breadcrumb' } } : {}),
      ...(p.speakable ? { speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.answer-first'] } } : {})
    }
  ];
}

function shell(p, body, extraSchema) {
  const graph = siteSchema(p);
  const bc = breadcrumbSchema(p.crumbs, p.url);
  if (bc) graph.push(bc);
  (extraSchema || []).forEach(s => graph.push(s));

  const robots = p.noindex
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1';

  const scripts = p.scripts.map(s => `<script src="/assets/${s}.js?v=${ASSET_V}"></script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${p.title}</title>
  <meta name="description" content="${p.desc}">
  <meta name="robots" content="${robots}">
  <meta name="theme-color" content="#14100F">
  <link rel="canonical" href="${SITE}${p.url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:title" content="${p.title}">
  <meta property="og:description" content="${p.desc}">
  <meta property="og:url" content="${SITE}${p.url}">
  <meta property="og:image" content="${SITE}/${ogImage(p)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:alt" content="${p.ogAlt}">
  <meta property="og:locale" content="en_GB">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${p.title}">
  <meta name="twitter:description" content="${p.desc}">
  <meta name="twitter:image" content="${SITE}/${ogImage(p)}">
  <meta name="twitter:image:alt" content="${p.ogAlt}">
  <meta name="author" content="${AUTHOR}">
  <meta name="format-detection" content="telephone=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Piano Keys">
  <link rel="alternate" hreflang="en-gb" href="${SITE}${p.url}">
  <link rel="alternate" hreflang="x-default" href="${SITE}${p.url}">
${verifyTags()}${FAVICONS}
${FONTS}
  <link rel="stylesheet" href="/assets/styles.css?v=${ASSET_V}">
  <script>(function(){try{var t=localStorage.getItem('lpk.theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
</head>
<body${p.wide ? ' class="wide"' : ''}>

<a class="skip" href="#main">Skip to the main content</a>

<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span>Piano Keys</a>
    <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">
${nav(p.slug)}
      <button class="theme-toggle" id="themeToggle" aria-label="Switch between light and dark">Light</button>
      <button class="pill signin" id="signInBtn" hidden>Sign in</button>
      <div class="acct" id="acct" hidden>
        <button class="acct-btn" id="acctBtn" aria-expanded="false" aria-haspopup="true" aria-label="Your account"><span id="acctInitial">P</span></button>
        <div class="acct-menu" id="acctMenu" hidden>
          <p class="acct-email" id="acctEmail"></p>
          <p class="acct-state">Unlocked, free</p>
          <button class="pill" id="acctOut">Sign out</button>
        </div>
      </div>
      <a class="btn btn-primary btn-sm nav-cta" href="/app.html">Practice room</a>
    </nav>
  </div>
</header>

${breadcrumbHtml(p.crumbs)}<main id="main"${p.narrow ? ' class="narrow"' : ''}>
${body}
</main>

<footer class="site-foot">
  <div class="wrap">
    <div class="foot-cols">
      <div>
        <h2>Learn</h2>
        <a href="/piano-keys-for-beginners.html">Piano keys for beginners</a>
        <a href="/#paths">Learning paths</a>
        <a href="/how-to-read-music.html">How to read music notes</a>
        <a href="/how-to-read-music.html#trainer">Note trainer</a>
        <a href="/#basics">Piano keys explained</a>
      </div>
      <div>
        <h2>Play</h2>
        <a href="/songs.html">All songs</a>
        <a href="/twinkle-twinkle-little-star-piano-notes.html">Twinkle, Twinkle</a>
        <a href="/ode-to-joy-piano-notes.html">Ode to Joy</a>
        <a href="/fur-elise-piano-notes.html">F&uuml;r Elise</a>
      </div>
      <div>
        <h2>Guides</h2>
        <a href="/piano-keyboard-layout.html">Piano keyboard layout</a>
        <a href="/middle-c-on-piano.html">Where is middle C</a>
        <a href="/piano-finger-numbers.html">Finger numbers</a>
        <a href="/beginner-piano-roadmap.html">Beginner roadmap</a>
        <a href="/how-long-to-learn-piano.html">How long does it take</a>
      </div>
      <div>
        <h2>Tools</h2>
        <a href="/piano-chord-finder.html">Chord finder</a>
        <a href="/piano-scale-finder.html">Scale finder</a>
        <a href="/online-piano-metronome.html">Metronome</a>
        <a href="/online-piano-keyboard.html">Online keyboard</a>
        <a href="/circle-of-fifths-piano.html">Circle of fifths</a>
        <a href="/chords.html">Piano chords</a>
        <a href="/scales.html">Piano scales</a>
        <a href="/songs.html">All songs</a>
      </div>
      <div>
        <h2>Site</h2>
        <a href="/contact.html">Contact</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/public-domain-policy.html">Public domain policy</a>
      </div>
    </div>
    <p class="foot-legal">
      ${BRAND} · info@learnpianokeys.com<br>
      Every piece on this site is in the public domain and all sound is synthesised in your browser. No recordings are used.
    </p>
  </div>
</footer>


<div class="gate" id="gate" hidden>
  <div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gateTitle">
    <button class="gate-close" id="gateClose" aria-label="Close" hidden>&times;</button>
    <p class="eyebrow" id="gateKicker">Free, and it stays free</p>
    <h2 id="gateTitle">Unlock everything with an email</h2>
    <p id="gateBlurb"><strong>Signing up is 100% free. Nothing is charged and no card details are ever requested.</strong> It lets us tell you when new pieces, lessons and tools are added, and it keeps the practice room open on this device.</p>
    <div class="gate-form">
      <label class="sr-only" for="gateEmail">Your email address</label>
      <input type="email" id="gateEmail" placeholder="you@example.com" autocomplete="email" inputmode="email">
      <button class="btn btn-primary" id="gateSubmit">Unlock everything</button>
    </div>
    <div class="hp" aria-hidden="true">
      <label>Leave this empty<input type="text" id="gateWebsite" tabindex="-1" autocomplete="off"></label>
    </div>
    <p class="gate-msg" id="gateMsg"></p>
    <p class="score-note">We send a one-click confirmation link, so nothing happens until you click it in your inbox. Every email has an unsubscribe link and you can ask us to delete your address at any time. See the <a href="/privacy.html">privacy page</a>.</p>
    <p class="score-note">Already signed up? Enter the same email to unlock this device.</p>
    <div class="gate-alt" id="gateAlt">
      <a class="pill" href="/piano-keys-for-beginners.html">Use the free beginner lesson instead</a>
      <a class="pill" href="/tools.html">Use the free tools instead</a>
    </div>
  </div>
</div>

<div class="hint" id="hint"></div>
<div id="sr" class="sr-only" role="status" aria-live="polite"></div>

${scripts}

<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)}
</script>
</body>
</html>
`;
}

/* ---- extra schema per page, generated FROM the visible text ---- */
function faqSchema(body, url) {
  const qs = [...body.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)];
  if (!qs.length) return null;
  const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    '@type': 'FAQPage', '@id': SITE + url + '#faq',
    mainEntityOfPage: { '@id': SITE + url + '#webpage' },
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
    author: { '@id': SITE + '/#org' },
    publisher: { '@id': SITE + '/#org' },
    mainEntity: qs.map(m => ({
      '@type': 'Question', name: strip(m[1]),
      acceptedAnswer: { '@type': 'Answer', text: strip(m[2]) }
    }))
  };
}

const APP_SCHEMA = {
  '@type': 'WebApplication', '@id': SITE + '/#app', name: BRAND,
  url: SITE + '/app.html', applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any modern web browser',
  browserRequirements: 'Requires JavaScript and the Web Audio API',
  featureList: [
    'Guided first lesson for absolute beginners', 'Wait mode', 'Section looping',
    'Practise hands separately', 'Tempo control', 'Transpose', 'Count-in',
    'Fingering on every note', 'Grand staff notation', 'Metronome with tap tempo',
    'Chord finder', 'Scale explorer', 'Note quiz', 'Practice timer and streak',
    'Separate rhythm scoring', 'Separate reading literacy scoring',
    'MIDI keyboard input', 'Sustain pedal', 'Microphone input', 'Carry on where you stopped'
  ],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' }
};

const READ_SCHEMA = {
  '@type': 'HowTo',
  '@id': SITE + '/how-to-read-music.html#howto',
  name: 'How to read music notes on the piano',
  description: 'Learn the stave, the treble clef, the bass clef, ledger lines and note lengths, then practise reading with an interactive note trainer.',
  totalTime: 'PT10M',
  image: { '@type': 'ImageObject', url: SITE + '/og-how-to-read-music.png', width: 1200, height: 630 },
  estimatedCost: { '@type': 'MonetaryAmount', currency: 'GBP', value: '0' },
  isAccessibleForFree: true,
  inLanguage: 'en-GB',
  mainEntityOfPage: { '@id': SITE + '/how-to-read-music.html#webpage' },
  author: { '@id': SITE + '/#org' },
  publisher: { '@id': SITE + '/#org' },
  supply: [{ '@type': 'HowToSupply', name: 'A piano, digital keyboard, or the on-screen keyboard' }],
  tool: [{ '@type': 'HowToTool', name: 'Learn Piano Keys note trainer' }],
  step: [
    { '@type': 'HowToStep', name: 'Find middle C',
      text: 'Middle C sits on a short line of its own between the treble and bass staves. On the keyboard it is the white key immediately to the left of any group of two black keys, nearest the middle of the instrument.',
      url: SITE + '/how-to-read-music.html#stave' },
    { '@type': 'HowToStep', name: 'Learn the treble clef',
      text: 'The five lines are E, G, B, D and F from the bottom up. The four spaces are F, A, C and E, which spell FACE.',
      url: SITE + '/how-to-read-music.html#treble' },
    { '@type': 'HowToStep', name: 'Learn the bass clef',
      text: 'The five lines are G, B, D, F and A from the bottom up. The four spaces are A, C, E and G.',
      url: SITE + '/how-to-read-music.html#bass' },
    { '@type': 'HowToStep', name: 'Read above and below the stave',
      text: 'Ledger lines are short extra lines that continue the pattern for notes too high or too low to fit on the stave.',
      url: SITE + '/how-to-read-music.html#ledger' },
    { '@type': 'HowToStep', name: 'Learn how long each note lasts',
      text: 'The shape of a note gives its length. A hollow note with no stem lasts four beats, with a stem two, a filled note with a stem one, and each flag halves it again.',
      url: SITE + '/how-to-read-music.html#rhythm' },
    { '@type': 'HowToStep', name: 'Practise with the note trainer',
      text: 'A note appears on the stave and you play it on the keyboard. Ten minutes a day, treble clef first, then bass, then turn the note names off.',
      url: SITE + '/how-to-read-music.html#trainer' }
  ]
};

const LEARNING_SCHEMA = {
  '@type': 'LearningResource',
  '@id': SITE + '/how-to-read-music.html#lesson',
  name: 'How to read music notes on the piano',
  url: SITE + '/how-to-read-music.html',
  description: 'An interactive guide to reading the stave, with playable diagrams and a note trainer that waits for you to play the note you see.',
  learningResourceType: ['Interactive lesson', 'Practice tool'],
  educationalLevel: 'Beginner',
  educationalUse: 'Self study',
  teaches: [
    'The stave and the grand stave',
    'Finding middle C',
    'Treble clef lines and spaces',
    'Bass clef lines and spaces',
    'Ledger lines',
    'Sharps, flats and naturals',
    'Note lengths and time signatures'
  ],
  timeRequired: 'PT10M',
  isAccessibleForFree: true,
  inLanguage: 'en-GB',
  audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
  provider: { '@id': SITE + '/#org' },
  mainEntityOfPage: { '@id': SITE + '/how-to-read-music.html#webpage' }
};

const COURSE_SCHEMA = {
  '@type': 'Course', '@id': SITE + '/piano-lessons.html#course',
  name: 'Free Piano Lessons for Beginners',
  description: 'A five lesson beginner piano course: keyboard layout, finger numbers, steps and skips, rhythm, and reading the treble staff. Each lesson has a playable keyboard exercise and a ten question quiz.',
  url: SITE + '/piano-lessons.html',
  provider: { '@id': SITE + '/#org' },
  inLanguage: 'en-GB',
  isAccessibleForFree: true,
  educationalLevel: 'Beginner',
  teaches: LESSONS.map(L => L.navTitle),
  audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
  hasCourseInstance: {
    '@type': 'CourseInstance', courseMode: 'online',
    courseWorkload: 'PT20M',
    instructor: { '@id': SITE + '/#org' }
  },
  hasPart: LESSONS.map(L => ({
    '@type': 'LearningResource',
    '@id': SITE + '/' + L.slug + '.html#lesson',
    name: L.navTitle,
    url: SITE + '/' + L.slug + '.html',
    position: L.n,
    learningResourceType: 'Lesson',
    educationalLevel: 'Beginner',
    isAccessibleForFree: true,
    teaches: L.learn
  })),
  mainEntityOfPage: { '@id': SITE + '/piano-lessons.html#webpage' }
};

function lessonSchema(L) {
  return {
    '@type': 'LearningResource',
    '@id': SITE + '/' + L.slug + '.html#lesson',
    name: L.navTitle,
    url: SITE + '/' + L.slug + '.html',
    description: L.desc,
    learningResourceType: ['Lesson', 'Quiz'],
    educationalLevel: 'Beginner',
    teaches: L.learn,
    timeRequired: 'PT20M',
    inLanguage: 'en-GB',
    isAccessibleForFree: true,
    isPartOf: { '@id': SITE + '/piano-lessons.html#course' },
    provider: { '@id': SITE + '/#org' },
    audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
    mainEntityOfPage: { '@id': SITE + '/' + L.slug + '.html#webpage' }
  };
}

let count = 0;
PAGES.push.apply(PAGES, GENERATED);
PAGES.forEach(p => {
  const body = p.body || fs.readFileSync(path.join(ROOT, 'src', p.slug + '.html'), 'utf8');
  const extra = [];
  const faq = faqSchema(body, p.url);
  if (faq) extra.push(faq);
  if (p.slug === 'index') extra.push(APP_SCHEMA);
  if (p.slug === 'how-to-read-music') { extra.push(READ_SCHEMA); extra.push(LEARNING_SCHEMA); }
  if (p.slug === 'piano-lessons') extra.push(COURSE_SCHEMA);
  { const L = LESSONS.find(x => x.slug === p.slug); if (L) extra.push(lessonSchema(L)); }
  fs.writeFileSync(path.join(ROOT, p.slug + '.html'), shell(p, body, extra));
  count++;
});

/* sitemap from the same list, so it can never disagree with the pages */
const urls = PAGES.filter(p => !p.noindex)
  .map(p => `  <url><loc>${SITE}${p.url}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`)
  .join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

fs.writeFileSync(path.join(ROOT, INDEXNOW_KEY + '.txt'), INDEXNOW_KEY);

fs.writeFileSync(path.join(ROOT, 'robots.txt'),
`# Everything on this site is open to every crawler.
User-agent: *
Allow: /
Disallow: /api/
Disallow: /app.html

# Named explicitly so nothing here is ever mistaken for a block.
User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: Slurp
Allow: /
User-agent: DuckDuckBot
Allow: /
User-agent: YandexBot
Allow: /
User-agent: Baiduspider
Allow: /
User-agent: Yeti
Allow: /
User-agent: SeznamBot
Allow: /
User-agent: Applebot
Allow: /
User-agent: facebookexternalhit
Allow: /
User-agent: Twitterbot
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

fs.writeFileSync(path.join(ROOT, 'site.webmanifest'), JSON.stringify({
  name: BRAND, short_name: 'Piano Keys', start_url: '/', display: 'standalone',
  background_color: '#14100F', theme_color: '#14100F',
  icons: [
    { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
  ]
}, null, 2));

console.log(`built ${count} pages at asset version ${ASSET_V}`);
console.log(`sitemap, robots.txt, manifest and the IndexNow key file are regenerated with them`);
