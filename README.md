# Learn Piano Keys - V3

Static site plus a small PHP lead collector. No build dependencies, no
frameworks, no paid APIs, no sampled audio.

## Build

    node tools/build.js      # regenerates every .html from src/ + sitemap + manifest
    node tools/tests.js      # 623 assertions across every page family

Never hand-edit the .html files at the repo root. They are generated.
Edit `src/*.html` for body content and `tools/build.js` for head, nav and footer.

## Releasing

1. Bump `ASSET_V` in `tools/build.js`.
2. `node tools/build.js && node tools/tests.js`
3. Commit and push. Hostinger pulls from GitHub as usual.
4. Hard refresh once, then check one page from each family.

The test harness fails the build if two pages ever end up on different asset
versions, which is the bug that silently shipped stale CSS on earlier projects.

## Server setup (once)

The lead collector needs a private folder OUTSIDE public_html:

    domains/learnpianokeys.com/lpk_private/

Copy `api/secrets.example.php` to `lpk_private/secrets.php` and fill in:

    admin_password   long random string, this is the login for /api/leads.php
    salt             long random string, used to hash IPs
    smtp_host        smtp.hostinger.com
    smtp_port        587
    smtp_user        info@learnpianokeys.com
    smtp_pass        that mailbox's password

`lpk_private/` must be writable by PHP so `leads.sqlite` can be created there.

If secrets.php is missing the site still works and the admin panel simply
refuses to open. It fails safe.

### Email deliverability is a hosting job, not a code job

Verification links land in spam unless all of this is done in hPanel and DNS:

- create the `info@learnpianokeys.com` mailbox and use its password above
- SPF record for Hostinger's mail servers
- DKIM enabled for the domain
- a DMARC record, `p=none` to begin with

Without authenticated SMTP the code falls back to PHP `mail()`, which mostly
gets filtered. Do not skip this step.

## Admin

    /api/leads.php     password-protected, shows VERIFIED and PENDING,
                       CSV export of verified addresses only, per-row delete

## The gate

Three practice-room sessions, then a signup card. The beginner walkthrough,
all four tools, and the practice tracker are never gated, because those are
the pages search traffic lands on. An address already on the list unlocks a
new device immediately.

## Files

    tools/build.js        page generator, single source of truth for head/nav/footer
    tools/tests.js        QA harness
    src/*.html            page bodies
    assets/engine.js      synth piano, sustain, mic pitch detection, keybed, store, theory
    assets/pieces.js      public-domain score data
    assets/app.js         practice room: transport, scoring, trouble spots, print
    assets/lesson.js      six-step first lesson
    assets/tools.js       chord finder, scale explorer, metronome, note quiz
    assets/tracker.js     practice timer and streak
    assets/gate.js        signup gate
    assets/share.js       Web Share helpers
    assets/site.js        nav, theme, content-page keyboards
    api/*.php            lead collector, double opt-in, admin

## Things worth remembering

- Web MIDI needs HTTPS. localhost is exempt.
- The microphone is monophonic by design and is labelled approximate in the UI.
- All progress lives in `localStorage` under `lpk.store.v1`. No account.
- Every piece is public domain and all audio is synthesised. Nothing sampled.
- No competitor is named anywhere on the site.
- AdSense units are deliberately not placed yet. `ads.txt` is in place for when
  there is enough content to justify them.
