/* Learn Piano Keys - tell the search engines a page changed.
   node tools/submit-index.js            submit every URL in the sitemap
   node tools/submit-index.js /tools.html /practice.html   submit just those

   IndexNow is a single shared endpoint. Submit once and Bing, Yandex,
   Seznam, Naver and Yep are all notified.

   Google does NOT take part in IndexNow. Google discovers changes through
   the sitemap and Search Console, and there is no honest way to push to it
   from a script. Use URL Inspection then Request Indexing for anything
   urgent. The old sitemap ping endpoints at google.com/ping and bing.com/ping
   were both retired, so anything claiming to use them is doing nothing. */

const fs = require('fs');
const path = require('path');

const KEY = '79e2624f7b502947f1147e5f7b9c8dd2';
const HOST = 'learnpianokeys.com';
const SITE = 'https://' + HOST;
const ROOT = path.join(__dirname, '..');

function sitemapUrls() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map(m => m[1].trim());
}

async function main() {
  const args = process.argv.slice(2);
  const urlList = args.length
    ? args.map(a => (a.startsWith('http') ? a : SITE + (a.startsWith('/') ? a : '/' + a)))
    : sitemapUrls();

  // the key file must be reachable, or every engine rejects the submission
  const keyFile = path.join(ROOT, KEY + '.txt');
  if (!fs.existsSync(keyFile)) {
    console.error(`Missing ${KEY}.txt at the repo root. Run node tools/build.js first.`);
    process.exit(1);
  }

  console.log(`Submitting ${urlList.length} URL(s) to IndexNow`);
  urlList.forEach(u => console.log('  ' + u));

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList: urlList
  };

  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body)
    });
    if (res.status === 200 || res.status === 202) {
      console.log(`\nAccepted (${res.status}). Bing, Yandex, Seznam, Naver and Yep have been told.`);
    } else if (res.status === 403) {
      console.log('\n403: the key file could not be verified. Check that ' +
        `${SITE}/${KEY}.txt is live and returns exactly the key.`);
    } else if (res.status === 422) {
      console.log('\n422: a URL did not belong to this host, or the key does not match.');
    } else if (res.status === 429) {
      console.log('\n429: too many submissions. Wait, then try again.');
    } else {
      console.log(`\nUnexpected status ${res.status}.`);
    }
  } catch (e) {
    console.error('\nCould not reach the IndexNow endpoint:', e.message);
    process.exit(1);
  }

  console.log('\nGoogle is not part of IndexNow. For Google, the sitemap does the work,');
  console.log('and Search Console URL Inspection handles anything urgent.');
}

main();
