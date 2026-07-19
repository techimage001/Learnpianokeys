/* Learn Piano Keys - page generator
   node tools/build.js
   Emits every page at the repo root from src/*.html bodies, so head, nav,
   footer, favicons and asset versions can never drift between page families. */

const fs = require('fs');
const path = require('path');

const ASSET_V = '3';
const SITE = 'https://learnpianokeys.com';
const BRAND = 'Learn Piano Keys';
const ROOT = path.join(__dirname, '..');

const PAGES = [
  {
    slug: 'index',
    url: '/',
    title: 'Learn Piano Keys · Free piano lessons, tools and practice room',
    desc: 'Learn the piano keys from scratch, then practise real pieces with wait mode, looping, hand separation, fingering and a grand staff. Works with a MIDI keyboard, a microphone or your computer keys.',
    scripts: ['engine', 'site', 'tracker'],
    crumbs: []
  },
  {
    slug: 'piano-keys-for-beginners',
    url: '/piano-keys-for-beginners.html',
    title: 'Piano Keys for Beginners · Your first five minutes at the keyboard',
    desc: 'Never touched a piano? Six short steps, one octave, no jargon. Find middle C, name the white keys, put five fingers down and play your first real tune in about five minutes.',
    scripts: ['engine', 'site', 'lesson'],
    crumbs: [['Lessons', '/#paths'], ['Piano keys for beginners', '/piano-keys-for-beginners.html']]
  },
  {
    slug: 'tools',
    url: '/tools.html',
    title: 'Free Piano Tools · Chord finder, scale explorer, metronome and note quiz',
    desc: 'Four practice tools that run entirely in your browser. Find any chord, see any scale on the keyboard, keep time with a tap-tempo metronome and test how fast you can name a key.',
    scripts: ['engine', 'site', 'tools'],
    crumbs: [['Tools', '/tools.html']]
  },
  {
    slug: 'practice',
    url: '/practice.html',
    title: 'Practice Tracker · Time your sessions and build a streak',
    desc: 'A practice timer and streak tracker that keeps everything in your own browser. No account, no email, no upload.',
    scripts: ['engine', 'site', 'tracker'],
    crumbs: [['Practice tracker', '/practice.html']]
  },
  {
    slug: 'app',
    url: '/app.html',
    title: 'Practice room · Learn Piano Keys',
    desc: 'Practise real pieces with wait mode, section looping, hand separation, tempo, transpose, count-in, sustain pedal and a grand staff.',
    scripts: ['pieces', 'engine', 'site', 'share', 'gate', 'app'],
    crumbs: [['Practice room', '/app.html']],
    noindex: true,
    wide: true
  },
  { slug: 'privacy', url: '/privacy.html', title: 'Privacy · Learn Piano Keys',
    desc: 'What Learn Piano Keys does and does not collect. Your playing never leaves your device.',
    scripts: ['site'], crumbs: [['Privacy', '/privacy.html']], narrow: true },
  { slug: 'terms', url: '/terms.html', title: 'Terms of use · Learn Piano Keys',
    desc: 'Terms of use for Learn Piano Keys, a free browser piano practice tool.',
    scripts: ['site'], crumbs: [['Terms', '/terms.html']], narrow: true },
  { slug: 'contact', url: '/contact.html', title: 'Contact · Learn Piano Keys',
    desc: 'Contact Learn Piano Keys about a bug, a piece you would like added, or anything else.',
    scripts: ['site'], crumbs: [['Contact', '/contact.html']], narrow: true }
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

function nav(active) {
  const items = [
    ['Start here', '/piano-keys-for-beginners.html', 'piano-keys-for-beginners'],
    ['Pieces', '/#pieces', 'index'],
    ['Tools', '/tools.html', 'tools'],
    ['Practice', '/practice.html', 'practice'],
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
  return { '@type': 'BreadcrumbList', itemListElement: list };
}

function siteSchema() {
  return [
    { '@type': 'Organization', '@id': SITE + '/#org', name: BRAND, url: SITE + '/',
      logo: SITE + '/favicon-512.png', email: 'info@learnpianokeys.com' },
    { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: BRAND,
      publisher: { '@id': SITE + '/#org' }, inLanguage: 'en-GB' }
  ];
}

function shell(p, body, extraSchema) {
  const graph = siteSchema();
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
  <meta property="og:image" content="${SITE}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_GB">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${p.title}">
  <meta name="twitter:description" content="${p.desc}">
  <meta name="twitter:image" content="${SITE}/og-image.png">
${FAVICONS}
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
      <a class="btn btn-primary btn-sm" href="/app.html">Practice room</a>
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
        <a href="/#basics">Piano keys explained</a>
      </div>
      <div>
        <h2>Play</h2>
        <a href="/app.html?piece=twinkle">Twinkle, Twinkle</a>
        <a href="/app.html?piece=ode-to-joy">Ode to Joy</a>
        <a href="/app.html?piece=fur-elise">F&uuml;r Elise</a>
      </div>
      <div>
        <h2>Tools</h2>
        <a href="/tools.html#chords">Chord finder</a>
        <a href="/tools.html#scales">Scale explorer</a>
        <a href="/tools.html#metronome">Metronome</a>
        <a href="/practice.html">Practice tracker</a>
      </div>
      <div>
        <h2>Site</h2>
        <a href="/contact.html">Contact</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
      </div>
    </div>
    <p class="foot-legal">
      ${BRAND} · info@learnpianokeys.com<br>
      Every piece on this site is in the public domain and all sound is synthesised in your browser. No recordings are used.
    </p>
  </div>
</footer>

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
    'MIDI keyboard input', 'Sustain pedal', 'Microphone input', 'Printable sheet music'
  ],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' }
};

let count = 0;
PAGES.forEach(p => {
  const body = fs.readFileSync(path.join(ROOT, 'src', p.slug + '.html'), 'utf8');
  const extra = [];
  const faq = faqSchema(body, p.url);
  if (faq) extra.push(faq);
  if (p.slug === 'index') extra.push(APP_SCHEMA);
  fs.writeFileSync(path.join(ROOT, p.slug + '.html'), shell(p, body, extra));
  count++;
});

/* sitemap from the same list, so it can never disagree with the pages */
const urls = PAGES.filter(p => !p.noindex)
  .map(p => `  <url><loc>${SITE}${p.url}</loc><priority>${p.url === '/' ? '1.0' : '0.7'}</priority></url>`)
  .join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

fs.writeFileSync(path.join(ROOT, 'site.webmanifest'), JSON.stringify({
  name: BRAND, short_name: 'Piano Keys', start_url: '/', display: 'standalone',
  background_color: '#14100F', theme_color: '#14100F',
  icons: [
    { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
  ]
}, null, 2));

console.log(`built ${count} pages at asset version ${ASSET_V}`);
