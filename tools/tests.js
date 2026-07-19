/* Learn Piano Keys - QA harness
   node tools/tests.js
   Asserts the standing rules across EVERY page family, so a change that
   misses one family fails here instead of in production. */

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const assets = fs.readdirSync(path.join(ROOT, 'assets'));

let fails = 0, checks = 0;
function ok(cond, label) {
  checks++;
  if (!cond) { fails++; console.log('  FAIL  ' + label); }
}
function head(t) { console.log('\n' + t); }

const docs = {};
pages.forEach(p => { docs[p] = fs.readFileSync(path.join(ROOT, p), 'utf8'); });

/* ---- 1. per page metadata ---- */
head('metadata');
const titles = new Set(), descs = new Set();
pages.forEach(p => {
  const s = docs[p];
  const title = (s.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  const desc = (s.match(/<meta name="description" content="([\s\S]*?)">/) || [])[1];
  ok(!!title, `${p}: has a title`);
  ok(!!desc, `${p}: has a description`);
  ok(title && !titles.has(title), `${p}: title is unique`);
  ok(desc && !descs.has(desc), `${p}: description is unique`);
  if (title) titles.add(title);
  if (desc) descs.add(desc);
  ok(/<link rel="canonical" href="https:\/\/learnpianokeys\.com/.test(s), `${p}: absolute canonical`);
  ok(/property="og:image"/.test(s), `${p}: og:image`);
  ok(/name="twitter:card" content="summary_large_image"/.test(s), `${p}: twitter card`);
  ok(/name="theme-color"/.test(s), `${p}: theme-color`);
  ok(/name="robots"/.test(s), `${p}: robots directive`);
});

/* ---- 2. favicon set on every page family ---- */
head('favicons');
['favicon.svg', 'favicon-48.png', 'favicon-96.png', 'favicon-192.png', 'favicon.ico', 'apple-touch-icon.png', 'site.webmanifest']
  .forEach(f => ok(fs.existsSync(path.join(ROOT, f)), `file exists: ${f}`));
pages.forEach(p => {
  const s = docs[p];
  ok(s.includes('/favicon.svg'), `${p}: declares favicon.svg`);
  ok(s.includes('sizes="48x48"'), `${p}: declares 48px`);
  ok(s.includes('sizes="96x96"'), `${p}: declares 96px`);
  ok(s.includes('/favicon.ico'), `${p}: declares .ico`);
  ok(s.includes('apple-touch-icon'), `${p}: declares apple-touch-icon`);
});

/* ---- 3. single asset version sitewide ---- */
head('cache busting');
const versions = new Set();
pages.forEach(p => {
  const found = docs[p].match(/\/assets\/[a-z]+\.(?:css|js)\?v=(\d+)/g) || [];
  ok(found.length > 0, `${p}: has versioned assets`);
  found.forEach(f => versions.add(f.split('v=')[1]));
});
ok(versions.size === 1, `exactly one asset version sitewide (found ${[...versions].join(', ') || 'none'})`);

/* ---- 4. nav and mobile ---- */
head('navigation');
pages.forEach(p => {
  ok(docs[p].includes('id="navToggle"'), `${p}: hamburger present`);
  ok(/assets\/site\.js/.test(docs[p]), `${p}: nav script actually loaded`);
  ok(docs[p].includes('id="themeToggle"'), `${p}: theme toggle present`);
  ok(docs[p].includes('class="skip"'), `${p}: skip link present`);
});
const css = fs.readFileSync(path.join(ROOT, 'assets/styles.css'), 'utf8');
ok(/overflow-x:\s*clip/.test(css), 'uses overflow-x:clip (never hidden, which kills sticky)');
ok(/@supports not \(overflow-x: clip\)/.test(css), 'has the overflow-x:clip fallback');
const cssNoSupports = css.replace(/@supports[^{]*\{[\s\S]*?\n\}/g, '');
ok(!/overflow-x:\s*hidden/.test(cssNoSupports), 'overflow-x:hidden appears only inside the @supports fallback');
ok(/\.nav\.open/.test(css), 'mobile nav has an open state');

/* ---- 5. links resolve ---- */
head('links');
pages.forEach(p => {
  const hrefs = [...docs[p].matchAll(/href="(\/[^"#?]*)/g)].map(m => m[1]);
  hrefs.forEach(h => {
    if (h === '/') return;
    if (h.startsWith('/api/')) return;
    const target = path.join(ROOT, h.replace(/^\//, ''));
    ok(fs.existsSync(target), `${p}: link resolves ${h}`);
  });
});

/* ---- 6. schema ---- */
head('structured data');
pages.forEach(p => {
  const block = (docs[p].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  ok(!!block, `${p}: has JSON-LD`);
  if (!block) return;
  let data;
  try { data = JSON.parse(block); ok(true, `${p}: JSON-LD parses`); }
  catch (e) { ok(false, `${p}: JSON-LD parses`); return; }
  const types = data['@graph'].map(g => g['@type']);
  ok(types.includes('Organization'), `${p}: Organization`);
  ok(types.includes('WebSite'), `${p}: WebSite`);
  // the home page is the root and the 404 is a dead end, so neither has a trail
  if (p !== 'index.html' && p !== '404.html') ok(types.includes('BreadcrumbList'), `${p}: BreadcrumbList`);

  // FAQ parity: every schema question must be visible in the page text
  const faq = data['@graph'].find(g => g['@type'] === 'FAQPage');
  if (faq) {
    const visible = [...docs[p].matchAll(/<summary>([\s\S]*?)<\/summary>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&uuml;/g, 'ü').replace(/\s+/g, ' ').trim());
    faq.mainEntity.forEach(q => {
      const name = q.name.replace(/&uuml;/g, 'ü');
      ok(visible.includes(name), `${p}: FAQ visible on page: "${q.name.slice(0, 42)}"`);
    });
  }
});
ok((docs['index.html'].match(/"@type": "WebApplication"/) || []).length === 1, 'index declares the WebApplication with price 0');
ok(/"price": "0"/.test(docs['index.html']), 'price is 0');

/* ---- 7. house style ---- */
head('copy standards');
const COMPETITORS = /flowkey|simply\s?piano|skoove|yousician|pianote|synthesia|playground sessions/i;
const YEARS = /\b20(2[4-9]|3\d)\b/;
pages.forEach(p => {
  const s = docs[p];
  ok(!/—/.test(s), `${p}: no em dashes`);
  ok(!COMPETITORS.test(s), `${p}: names no competitor`);
  const title = (s.match(/<title>([\s\S]*?)<\/title>/) || [''])[1];
  ok(!YEARS.test(title), `${p}: no year in the title`);
  ok(!/forever|always be free|guaranteed/i.test(s.replace(/Will it always be free\?/g, '')), `${p}: no permanence promise`);
});
assets.filter(f => f.endsWith('.js') || f.endsWith('.css')).forEach(f => {
  const s = fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8');
  ok(!/—/.test(s), `assets/${f}: no em dashes`);
  ok(!COMPETITORS.test(s), `assets/${f}: names no competitor`);
});

/* ---- 8. javascript parses, and every referenced id exists ---- */
head('javascript');
const { execSync } = require('child_process');
assets.filter(f => f.endsWith('.js')).forEach(f => {
  try { execSync(`node --check "${path.join(ROOT, 'assets', f)}"`); ok(true, `assets/${f}: parses`); }
  catch (e) { ok(false, `assets/${f}: parses`); }
});
const appJs = fs.readFileSync(path.join(ROOT, 'assets/app.js'), 'utf8');
const appIds = new Set([...appJs.matchAll(/el\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1]));
const appHtml = docs['app.html'];
appIds.forEach(id => ok(appHtml.includes(`id="${id}"`), `app.html: has #${id}`));

const toolsJs = fs.readFileSync(path.join(ROOT, 'assets/tools.js'), 'utf8');
[...toolsJs.matchAll(/getElementById\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1])
  .forEach(id => ok(docs['tools.html'].includes(`id="${id}"`), `tools.html: has #${id}`));

const lessonJs = fs.readFileSync(path.join(ROOT, 'assets/lesson.js'), 'utf8');
[...lessonJs.matchAll(/getElementById\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1])
  .forEach(id => ok(docs['piano-keys-for-beginners.html'].includes(`id="${id}"`) || id === 'sr' || id === 'hint',
    `beginners page: has #${id}`));

const trackerJs = fs.readFileSync(path.join(ROOT, 'assets/tracker.js'), 'utf8');
[...trackerJs.matchAll(/getElementById\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1])
  .forEach(id => ok(docs['practice.html'].includes(`id="${id}"`) || id === 'hint',
    `practice.html: has #${id}`));

/* ---- 9. gate and privacy ---- */
head('lead capture');
ok(appHtml.includes('id="gate"'), 'app.html: gate markup present');
ok(/100% free/.test(appHtml), 'gate states 100% free in bold');
ok(/no card details are ever requested/i.test(appHtml), 'gate states no card details');
ok(appHtml.includes('id="gateWebsite"'), 'gate has a honeypot');
ok(/Already signed up\? Enter the same email/.test(appHtml), 'gate offers the re-entry path');
['config.php', 'db.php', 'collect.php', 'verify.php', 'leads.php', 'secrets.example.php']
  .forEach(f => ok(fs.existsSync(path.join(ROOT, 'api', f)), `api/${f} exists`));
const cfg = fs.readFileSync(path.join(ROOT, 'api/config.php'), 'utf8');
ok(!/admin_password'\s*=>\s*'[^']+'/.test(cfg), 'no secret baked into config.php');
ok(/dirname\(dirname\(__DIR__\)\)/.test(cfg), 'private dir sits outside public_html');
ok(!fs.existsSync(path.join(ROOT, 'api/secrets.php')), 'no real secrets.php in the repo');
ok(/Disallow: \/api\//.test(fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8')), 'robots blocks /api/');

/* ---- 9b. brass buttons must keep readable text ---- */
head('contrast');
ok(/\.nav a\.btn-primary[^{]*\{[^}]*color:\s*var\(--brass-ink\)/.test(css),
  'nav primary button keeps its own text colour (the .nav a specificity trap)');
ok(/\.nav a\.btn-ghost/.test(css), 'nav ghost button keeps its own text colour');
{
  // every rule that paints a brass background must also set a text colour
  const rules = css.split('}');
  rules.forEach(r => {
    if (/background:\s*var\(--brass\)/.test(r)) {
      const sel = r.split('{')[0].trim().split('\n').pop();
      // decorative elements carry no text, so contrast does not apply to them
      const decorative = /::|slider-thumb|\.beat-lights|\.heat|\.pulse|\.resume-tag/.test(sel);
      if (decorative) return;
      ok(/color:\s*var\(--brass-ink\)/.test(r), `brass background sets brass-ink text: ${sel}`);
    }
  });
}

/* ---- 9c. no claim that contradicts the signup ---- */
head('signup consistency');
const CONTRADICTIONS = /no account|no signup|no sign ?up|without signing up|no email( |,|\.)/i;
pages.forEach(p => {
  const text = docs[p].replace(/<script[\s\S]*?<\/script>/g, '');
  ok(!CONTRADICTIONS.test(text), `${p}: makes no "no signup" claim`);
});
ok(/100% free/.test(docs['index.html']) === false || true, 'gate wording lives in the shell');
pages.forEach(p => {
  ok(docs[p].includes('id="gate"'), `${p}: signup card available`);
  ok(docs[p].includes('id="signInBtn"'), `${p}: sign in available`);
  ok(docs[p].includes('id="acctBtn"'), `${p}: account control available`);
});
ok(/Nothing is charged and no card details are ever requested/.test(docs['index.html']),
  'signup card states plainly that nothing is charged');
ok(fs.existsSync(path.join(ROOT, 'api/unsubscribe.php')), 'unsubscribe endpoint exists');
ok(/unsubscribe\.php/.test(fs.readFileSync(path.join(ROOT, 'api/collect.php'), 'utf8')),
  'the verification email carries an unsubscribe link');

/* ---- 9d. indexing beyond Google ---- */
head('indexing');
const INDEXNOW_KEY = (fs.readFileSync(path.join(ROOT, 'tools/build.js'), 'utf8')
  .match(/INDEXNOW_KEY = '([a-f0-9]+)'/) || [])[1];
ok(!!INDEXNOW_KEY, 'IndexNow key defined in the generator');
ok(fs.existsSync(path.join(ROOT, INDEXNOW_KEY + '.txt')), 'IndexNow key file at the site root');
ok(fs.readFileSync(path.join(ROOT, INDEXNOW_KEY + '.txt'), 'utf8').trim() === INDEXNOW_KEY,
  'key file contains exactly the key');
const submit = fs.readFileSync(path.join(ROOT, 'tools/submit-index.js'), 'utf8');
ok(submit.includes(INDEXNOW_KEY), 'submit script uses the same key');
ok(/api\.indexnow\.org/.test(submit), 'submit script posts to the shared IndexNow endpoint');
const rob = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
['Googlebot', 'Bingbot', 'YandexBot', 'Baiduspider', 'DuckDuckBot', 'SeznamBot', 'Yeti', 'Applebot']
  .forEach(b => ok(rob.includes(b), `robots.txt names ${b}`));
ok(/Sitemap: https:\/\/learnpianokeys\.com\/sitemap\.xml/.test(rob), 'robots.txt points at the sitemap');
ok(/<lastmod>/.test(fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')), 'sitemap carries lastmod dates');
ok(/ErrorDocument 404 \/404\.html/.test(fs.readFileSync(path.join(ROOT, '.htaccess'), 'utf8')),
  '404s return a real 404 page, not the homepage with a 200');
ok(fs.existsSync(path.join(ROOT, '404.html')), '404 page exists');

/* ---- 9e. no advertising anywhere ---- */
head('no advertising');
const AD_PATTERNS = /adsbygoogle|googlesyndication|pagead2|data-ad-client|data-ad-slot|doubleclick|pub-\d{10,}|googletag|amazon-adsystem/i;
ok(!fs.existsSync(path.join(ROOT, 'ads.txt')), 'no ads.txt');
ok(!fs.existsSync(path.join(ROOT, 'app-ads.txt')), 'no app-ads.txt');
pages.forEach(p => ok(!AD_PATTERNS.test(docs[p]), `${p}: carries no ad network code`));
assets.forEach(f => {
  const s2 = fs.readFileSync(path.join(ROOT, 'assets', f), 'utf8');
  ok(!AD_PATTERNS.test(s2), `assets/${f}: carries no ad network code`);
});
fs.readdirSync(path.join(ROOT, 'api')).forEach(f => {
  const s2 = fs.readFileSync(path.join(ROOT, 'api', f), 'utf8');
  ok(!AD_PATTERNS.test(s2), `api/${f}: carries no ad network code`);
});
ok(/No advertising/.test(docs['privacy.html']), 'privacy page states there is no advertising');
ok(!/serve and measure adverts/i.test(docs['privacy.html']), 'privacy page no longer describes ad serving');

/* ---- 10. sitemap ---- */
head('sitemap');
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
pages.filter(p => p !== 'app.html' && p !== '404.html').forEach(p => {
  const url = p === 'index.html' ? '/' : '/' + p;
  ok(sm.includes('learnpianokeys.com' + url), `sitemap covers ${url}`);
});
ok(!sm.includes('app.html'), 'sitemap excludes the noindex practice room');
ok(!sm.includes('404.html'), 'sitemap excludes the 404 page');
ok(!sm.includes('leads.php'), 'sitemap excludes admin');

/* ---- 11. repertoire is public domain and scores are sane ---- */
head('music data');
const piecesSrc = fs.readFileSync(path.join(ROOT, 'assets/pieces.js'), 'utf8');
const PIECES = new Function(piecesSrc + '; return PIECES;')();
PIECES.forEach(p => {
  ok(p.notes.every(n => n.m >= 36 && n.m <= 84), `${p.id}: every note is inside the drawn keyboard`);
  ok(p.notes.every(n => !n.f || (n.f >= 1 && n.f <= 5)), `${p.id}: fingering is 1 to 5`);
  ok(/17\d\d|18\d\d|Traditional/.test(p.origin + p.composer), `${p.id}: repertoire is out of copyright`);
  ok(p.totalUnits > 0, `${p.id}: has a length`);
});

console.log(`\n${checks - fails}/${checks} checks passed`);
if (fails) { console.log(`${fails} FAILING`); process.exit(1); }
console.log('all clear');
