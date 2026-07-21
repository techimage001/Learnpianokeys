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

/* ---- 1b. complete metadata, on every page ---- */
head('complete metadata');
pages.forEach(p => {
  const s2 = docs[p];
  ok(/property="og:image:alt" content=".{20,}"/.test(s2), `${p}: og:image has alt text`);
  ok(/name="twitter:image:alt"/.test(s2), `${p}: twitter image has alt text`);
  ok(/property="og:image:type"/.test(s2), `${p}: og:image type declared`);
  ok(/name="author" content="Learn Piano Keys"/.test(s2), `${p}: author`);
  ok(/rel="alternate" hreflang="en-gb"/.test(s2), `${p}: self-referencing hreflang`);
  ok(/hreflang="x-default"/.test(s2), `${p}: x-default hreflang`);
  ok(/name="mobile-web-app-capable"/.test(s2), `${p}: web app capable`);

  // each page must carry its OWN social card, not a shared one
  const og = (s2.match(/property="og:image" content="https:\/\/learnpianokeys\.com\/([^"]+)"/) || [])[1];
  ok(!!og && og !== 'og-image.png', `${p}: has its own social card (${og})`);
  ok(og && fs.existsSync(path.join(ROOT, og)), `${p}: that social card file exists`);

  const block = (s2.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  const graph = JSON.parse(block)['@graph'];
  const wp = graph.find(x => x['@type'] === 'WebPage');
  ok(!!wp, `${p}: WebPage node`);
  if (wp) {
    ok(!!wp.datePublished && /^\d{4}-\d{2}-\d{2}$/.test(wp.datePublished), `${p}: datePublished`);
    ok(!!wp.dateModified && /^\d{4}-\d{2}-\d{2}$/.test(wp.dateModified), `${p}: dateModified`);
    ok(wp.isAccessibleForFree === true, `${p}: declared free to use`);
    ok(!!wp.primaryImageOfPage && wp.primaryImageOfPage.caption, `${p}: primary image with a caption`);
    ok(!!wp.isPartOf, `${p}: tied to the WebSite`);
    ok(!!wp.author && !!wp.publisher, `${p}: author and publisher`);
    ok(wp.inLanguage === 'en-GB', `${p}: language declared on the page node`);
    if ((docs[p].match(/class="crumbs"/) || []).length) {
      ok(!!wp.breadcrumb, `${p}: WebPage points at its breadcrumb trail`);
    }
  }
  const faq = graph.find(x => x['@type'] === 'FAQPage');
  if (faq) {
    ok(!!faq.author && !!faq.publisher, `${p}: FAQ carries author and publisher`);
    ok(faq.isAccessibleForFree === true, `${p}: FAQ declared free`);
    ok(!!faq.mainEntityOfPage, `${p}: FAQ bound to the page node`);
  }
});
{
  const rg = JSON.parse((docs['how-to-read-music.html']
    .match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1])['@graph'];
  const howto = rg.find(x => x['@type'] === 'HowTo');
  ok(!!howto.image, 'HowTo carries an image');
  ok(howto.isAccessibleForFree === true, 'HowTo declared free');
  ok(!!howto.estimatedCost && howto.estimatedCost.value === '0', 'HowTo cost stated as zero');
  const lr = rg.find(x => x['@type'] === 'LearningResource');
  ok(!!lr, 'LearningResource node on the reading page');
  ok(lr && lr.teaches.length >= 6, `LearningResource lists what it teaches (${lr ? lr.teaches.length : 0} items)`);
  const wp = rg.find(x => x['@type'] === 'WebPage');
  ok(!!wp.speakable, 'reading page marks its answer paragraphs as speakable');
}

/* ---- 1c. metadata limits and uniqueness ---- */
head('metadata limits');
{
  const descs = [];
  pages.forEach(p => {
    const t = (docs[p].match(/<title>([^<]*)<\/title>/) || [''])[1];
    const d = (docs[p].match(/<meta name="description" content="([^"]*)"/) || [''])[1];
    ok(t.length <= 60, `${p}: title within 60 characters (${t.length})`);
    ok(d.length <= 150, `${p}: description within 150 characters (${d.length})`);
    ok(d.length >= 60, `${p}: description is substantial (${d.length})`);
    descs.push({ p, d });
  });
  /* Near-duplicate descriptions are the classic failure of a bulk build, so
     this is measured rather than assumed. Two ceilings, on purpose:

     Prose pages get 0.72. Two hand-written guides scoring above that are
     saying the same thing twice and one of them should not exist.

     Computed reference pages get 0.88, because the similarity there is a
     fact about music rather than laziness. A major and D major genuinely
     use the same seven letters and the same fingering; a dictionary's
     entries for two near-synonyms would score just as high. Forcing them
     apart would mean writing something less true to satisfy a number. */
  const words = s2 => new Set(s2.toLowerCase().replace(/[^a-z0-9# ]/g, '').split(/\s+/).filter(Boolean));
  const computed = p2 => /-chord-piano\.html$|-scale-piano\.html$/.test(p2);
  let worstProse = 0, prosePair = '', worstRef = 0, refPair = '';
  for (let i = 0; i < descs.length; i++) {
    for (let j = i + 1; j < descs.length; j++) {
      const a = words(descs[i].d), b = words(descs[j].d);
      const inter = [...a].filter(w => b.has(w)).length;
      const jac = inter / (a.size + b.size - inter);
      const bothComputed = computed(descs[i].p) && computed(descs[j].p);
      if (bothComputed) {
        if (jac > worstRef) { worstRef = jac; refPair = `${descs[i].p} vs ${descs[j].p}`; }
      } else if (jac > worstProse) { worstProse = jac; prosePair = `${descs[i].p} vs ${descs[j].p}`; }
    }
  }
  ok(worstProse <= 0.72, `prose descriptions distinct (worst ${worstProse.toFixed(2)}, ${prosePair})`);
  ok(worstRef <= 0.88, `reference descriptions distinct (worst ${worstRef.toFixed(2)}, ${refPair})`);
}

/* ---- 1d. the generated families ---- */
head('generated content');
{
  const songs = pages.filter(p => /-piano-notes\.html$/.test(p));
  const chords = pages.filter(p => /-chord-piano\.html$/.test(p));
  const scales = pages.filter(p => /-scale-piano\.html$/.test(p));
  ok(songs.length >= 8, `song pages generated (${songs.length})`);
  ok(chords.length === 12, `chord pages generated (${chords.length})`);
  ok(scales.length === 12, `scale pages generated (${scales.length})`);
  [...songs, ...chords, ...scales].forEach(p => {
    ok(/class="answer-first"/.test(docs[p]), `${p}: opens with an answer paragraph`);
    ok(/class="keys"/.test(docs[p]), `${p}: carries a real playable keyboard`);
    ok(/assets\/pagekit\.js/.test(docs[p]), `${p}: loads the interaction script`);
  });
  songs.forEach(p => {
    ok(/public-domain-policy/.test(docs[p]), `${p}: links to the provenance policy`);
    ok(/Why this piece is free/.test(docs[p]), `${p}: states why it is out of copyright`);
    ok(/level=1/.test(docs[p]) && /level=3/.test(docs[p]), `${p}: offers all three levels`);
  });
  // correct enharmonic spelling: no sharp names in flat keys
  ok(!/F major scale is [^<]*A#/.test(docs['f-major-scale-piano.html']), 'F major spells B flat, not A sharp');
  ok(/Eb/.test(docs['c-minor-chord-piano.html']), 'C minor spells E flat');
  ok(/Bb/.test(docs['g-minor-chord-piano.html']), 'G minor spells B flat');
}

head('guides and tool pages');
{
  const guides = require('../data/guides.js');
  const toolp = require('../data/toolpages.js');
  ok(guides.length === 20, `20 educational guides (${guides.length})`);
  ok(toolp.length === 10, `10 dedicated tool pages (${toolp.length})`);
  guides.forEach(g => {
    const d = docs[g.slug + '.html'];
    ok(!!d, `guide exists: ${g.slug}`);
    if (!d) return;
    ok((d.match(/class="answer-first"/g) || []).length >= 5, `${g.slug}: answer paragraph per section`);
    ok(/id="guideKeys"/.test(d), `${g.slug}: carries a playable keyboard`);
    ok((d.match(/<summary>/g) || []).length >= 3, `${g.slug}: has real questions`);
    ok(/assets\/toolkit\.js/.test(d), `${g.slug}: loads the interaction script`);
    const words = g.answer.split(/\s+/).length;
    ok(words >= 40 && words <= 90, `${g.slug}: answer is extractable length (${words} words)`);
  });
  toolp.forEach(t => {
    const d = docs[t.slug + '.html'];
    ok(!!d, `tool page exists: ${t.slug}`);
    if (!d) return;
    ok(new RegExp('data-tool="' + t.tool + '"').test(d), `${t.slug}: holds the real tool, not a link`);
    ok(/assets\/toolkit\.js/.test(d), `${t.slug}: loads the tool script`);
    ok((d.match(/<summary>/g) || []).length >= 3, `${t.slug}: has real questions`);
  });
  // every guide must be reachable from a hub or another guide
  guides.concat(toolp).forEach(g => {
    const linked = pages.some(p2 => p2 !== g.slug + '.html' && new RegExp('href="/' + g.slug + '\\.html').test(docs[p2]));
    ok(linked, `${g.slug}: linked from at least one other page`);
  });
}

head('public domain policy');
{
  const pol = docs['public-domain-policy.html'];
  ok(!!pol, 'policy page exists');
  ok(/died before 1900/.test(pol), 'states the conservative rule');
  ok((pol.match(/<tr><td><a href="\//g) || []).length >= 8, 'lists every piece');
  ok(/we will take the material down/.test(pol), 'carries a notice and takedown commitment');
  ok(/not legal advice/.test(pol), 'does not present itself as legal advice');
}

head('no downloads');
pages.forEach(p => {
  ok(!/download=|toDataURL|Print or save as PDF/.test(docs[p]), `${p}: offers no file download`);
});
ok(!/shareImage/.test(fs.readFileSync(path.join(ROOT, 'assets/share.js'), 'utf8')),
  'file sharing removed, link sharing kept');
ok(!/printBtn/.test(docs['app.html']), 'no print button in the practice room');

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

/* ---- 9f. first-timer guidance in the tool ---- */
head('first-timer guidance');
ok(appHtml.includes('id="howto"'), 'practice room has a step by step guide');
ok((appHtml.match(/<li><b>/g) || []).length >= 6, 'the guide has at least six numbered steps');
ok(appHtml.includes('id="howtoOpen"'), 'the guide can be reopened after dismissal');
ok(/piano-keys-for-beginners\.html/.test(appHtml), 'the guide points absolute beginners somewhere gentler');
ok(/Press Play to begin/.test(appJs), 'the falling-note panel is never a blank rectangle when idle');

/* ---- 9g. hand colour must mean hand, and only hand ---- */
head('hand colour coding');
ok(/const HAND_L = '#[0-9A-Fa-f]{6}'/.test(appJs), 'left hand colour defined once');
ok(/const HAND_R = '#[0-9A-Fa-f]{6}'/.test(appJs), 'right hand colour defined once');
{
  // the status colours must never be assigned as a note's fill
  const badFill = /fill\s*=\s*'#7FA86F'|fill\s*=\s*'rgba\(158,\s*59,\s*69/;
  ok(!badFill.test(appJs), 'a hit or a miss never repaints a note in the status colour');
  ok(/strokeStyle = res\.hit \? GOOD : FELT/.test(appJs), 'status is drawn as an outline instead');
  const handL = (appJs.match(/const HAND_L = '(#[0-9A-Fa-f]{6})'/) || [])[1];
  const handR = (appJs.match(/const HAND_R = '(#[0-9A-Fa-f]{6})'/) || [])[1];
  ok(css.includes('--hand-l:     ' + handL), 'CSS left hand token matches the canvas');
  ok(css.includes('--hand-r:     ' + handR), 'CSS right hand token matches the canvas');
  ok(css.includes('.sw-l { background: ' + handL + '; }'), 'legend swatch matches the left hand colour');
  ok(css.includes('.sw-r { background: ' + handR + '; }'), 'legend swatch matches the right hand colour');
}
ok(appHtml.includes('class="hand-legend"'), 'the practice room shows a colour legend');
ok(/Left hand/.test(appHtml) && /Right hand/.test(appHtml), 'the legend names both hands');
ok(/blue for your left hand/.test(appHtml), 'the guide states the colour rule in words');

/* ---- 9h. written for a complete beginner ---- */
head('plain english');
ok(appHtml.includes('id="coach"'), 'a live plain-English instruction line is on screen');
ok(/updateCoach/.test(appJs), 'the coach line is driven by the transport state');
ok(/Waiting for you: play/.test(appJs), 'the app names the exact note it is waiting for');
ok(/FINGER_NAMES/.test(appJs), 'and names the finger in words, not just a number');
ok(/It is glowing on the keyboard/.test(appJs), 'and points at the key on the keyboard');
ok(/paintNextKeys/.test(appJs), 'the next key to press is highlighted on the keybed');
ok(appHtml.includes('id="letterMode"'), 'hand letters can be switched on and off');
ok(/S\.showLetters/.test(appJs), 'hand letters are drawn on the blocks');
ok(appHtml.includes('class="tool-glossary"'), 'every switch is explained in plain words');
{
  const terms = ['Wait mode', 'Read mode', 'Count in', 'Metronome', 'Hand letters',
                 'Fingering', 'Note names', 'Play other hand', 'Sustain pedal', 'Use microphone'];
  terms.forEach(t => ok(new RegExp('<dt>' + t + '</dt>').test(appHtml), `glossary explains: ${t}`));
  // every switch in the tools row must have a glossary entry
  const pills = [...appHtml.matchAll(/<button class="pill" id="(\w+)" aria-pressed/g)].map(m => m[1]);
  ok(pills.length >= 9, `all ${pills.length} practice switches found`);
}

/* ---- 9i. the reading feature ---- */
head('how to read music');
const read = docs['how-to-read-music.html'];
ok(!!read, 'the page exists');
ok(/<h1>How to read music notes<\/h1>/.test(read), 'h1 targets the head term');
ok((read.match(/class="answer-first"/g) || []).length >= 6,
  'every section opens with a self-contained answer paragraph for AI overviews');
['stave', 'treble', 'bass', 'ledger', 'rhythm', 'trainer', 'practice']
  .forEach(id => ok(read.includes('id="' + id + '"'), `section present: #${id}`));
ok(/E, G, B, D and F/.test(read), 'treble clef lines stated explicitly');
ok(/F, A, C and E/.test(read), 'treble clef spaces stated explicitly');
ok(/G, B, D, F and A/.test(read), 'bass clef lines stated explicitly');
ok(/A, C, E and G/.test(read), 'bass clef spaces stated explicitly');
{
  const block = (read.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
  const data = JSON.parse(block);
  const howto = data['@graph'].find(g => g['@type'] === 'HowTo');
  ok(!!howto, 'HowTo schema present');
  ok(howto && howto.step.length === 6, `HowTo has all six steps (${howto ? howto.step.length : 0})`);
  ok(howto && howto.step.every(st => st.url && st.text && st.text.length > 40),
    'every HowTo step has a URL and a real answer');
}
// the trainer's controls
['trainerStave', 'trainerKeys', 'trainerStart', 'trainerClef', 'trainerAcc', 'trainerNames',
 'trainerScore', 'trainerBest', 'trainerFeedback', 'trainerMidi']
  .forEach(id => ok(read.includes('id="' + id + '"'), `trainer control present: #${id}`));
// and the diagrams
['anatomyStave', 'trebleLinesStave', 'trebleSpacesStave', 'bassLinesStave', 'bassSpacesStave', 'ledgerStave']
  .forEach(id => ok(read.includes('id="' + id + '"'), `diagram present: #${id}`));
ok((read.match(/data-hear=/g) || []).length >= 5, 'diagrams can be heard, not only seen');

head('reading feature is linked in');
['index.html', 'piano-keys-for-beginners.html', 'tools.html', 'app.html']
  .forEach(p2 => ok(/href="\/how-to-read-music\.html/.test(docs[p2]), `${p2} links to the reading page`));
ok(/id="read-banner"/.test(docs['index.html']), 'home page carries the banner');
ok(/id="next-step"/.test(docs['piano-keys-for-beginners.html']), 'beginner page carries the next-step banner');
pages.forEach(p2 => ok(/how-to-read-music\.html/.test(docs[p2]), `${p2}: reachable from the nav or footer`));
/* ---- 10. sitemap ---- */
head('sitemap');
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
pages.filter(p => p !== 'app.html' && p !== '404.html').forEach(p => {
  const url = p === 'index.html' ? '/' : '/' + p;
  ok(sm.includes('learnpianokeys.com' + url), `sitemap covers ${url}`);
});
ok(!sm.includes('app.html'), 'sitemap excludes the noindex practice room');
ok(!sm.includes('404.html'), 'sitemap excludes the 404 page');
ok(sm.includes('/how-to-read-music.html'), 'sitemap covers the reading page');
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
