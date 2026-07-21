/* IndexNow submitter for learnpianokeys.com
   Reads sitemap.xml from the repo and tells IndexNow (Bing, Yandex and
   partners) that every listed URL has changed. Run it after a real release:

     npm run indexnow

   Do not run it on days with no deploy; IndexNow throttles repeat pings of
   unchanged URLs (HTTP 429). Google ignores IndexNow by design; the sitemap
   in Search Console covers Google. */

const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'learnpianokeys.com';
const KEY = '60ccb4a970104b1b83b9eb9cc6826746';

const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

if (!urls.length) {
  console.error('No URLs found in sitemap.xml; nothing submitted.');
  process.exit(1);
}

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: urls
});

const req = https.request({
  hostname: 'api.indexnow.org',
  path: '/indexnow',
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }
}, res => {
  const okCodes = { 200: 'OK, all URLs submitted', 202: 'Accepted, key validation pending' };
  if (okCodes[res.statusCode]) {
    console.log(`IndexNow: ${res.statusCode} ${okCodes[res.statusCode]} (${urls.length} URLs).`);
  } else if (res.statusCode === 429) {
    console.error('IndexNow: 429 Too Many Requests. It has been pinged too recently; try again after the next real release.');
  } else if (res.statusCode === 403) {
    console.error(`IndexNow: 403 Forbidden. Check that https://${HOST}/${KEY}.txt is live and contains exactly the key.`);
  } else {
    console.error(`IndexNow: unexpected status ${res.statusCode}.`);
  }
});
req.on('error', e => console.error('IndexNow request failed: ' + e.message));
req.write(body);
req.end();
