/* Learn Piano Keys - signup, account control and the soft gate.
   Loaded on every page so signing in works from anywhere.

   Tone rule: never show a bare countdown. A limit with no offer attached
   reads as a threat. Every prompt leads with the fact that signing up is
   free and unlocks everything. */

var LPKGate = (function () {
  var FREE_SESSIONS = 3;
  var API = '/api/collect.php';
  var onUnlockCb = null;

  function st() {
    var s = LPK.load();
    return { uses: s.appUses || 0, unlocked: !!s.unlocked, email: s.email || '', softened: !!s.gateSoftened };
  }
  function unlocked() { return st().unlocked; }
  function remaining() { return Math.max(0, FREE_SESSIONS - st().uses); }

  /* Counted once per practice session, when Play is actually pressed. */
  function countSession() {
    var s = LPK.load();
    if (s.unlocked) return;
    s.appUses = (s.appUses || 0) + 1;
    LPK.save(s);
  }

  function shouldBlock() {
    var s = st();
    return !s.unlocked && s.uses >= FREE_SESSIONS;
  }

  /* The first time the card appears it can be dismissed. After that it stays,
     because by then the person has had four full sessions for nothing. */
  function dismissible() { return !st().softened; }

  function open(mode, onUnlock) {
    var gate = document.getElementById('gate');
    if (!gate) return;
    onUnlockCb = onUnlock || null;

    var kicker = document.getElementById('gateKicker');
    var title = document.getElementById('gateTitle');
    var blurb = document.getElementById('gateBlurb');
    var alt = document.getElementById('gateAlt');
    var closeBtn = document.getElementById('gateClose');

    if (mode === 'signin') {
      kicker.textContent = 'Welcome back';
      title.textContent = 'Enter the email you signed up with';
      blurb.innerHTML = '<strong>There is no password and nothing to pay.</strong> Enter the same address you used before and this device unlocks straight away. If you have never signed up, this is also how you start.';
      alt.hidden = true;
      closeBtn.hidden = false;
    } else {
      kicker.textContent = 'Free, and it stays free';
      title.textContent = 'Unlock everything with an email';
      blurb.innerHTML = '<strong>Signing up is 100% free. Nothing is charged and no card details are ever requested.</strong> It keeps the practice room open on this device and lets us tell you when new pieces, lessons and tools are added.';
      alt.hidden = false;
      closeBtn.hidden = !dismissible();
    }

    gate.hidden = false;
    var input = document.getElementById('gateEmail');
    var msg = document.getElementById('gateMsg');
    var btn = document.getElementById('gateSubmit');
    var hp = document.getElementById('gateWebsite');
    msg.textContent = '';
    msg.className = 'gate-msg';
    var opened = Date.now();
    setTimeout(function () { if (input) input.focus(); }, 60);

    function fail(t) { msg.textContent = t; msg.className = 'gate-msg no'; }
    function ok(t) { msg.textContent = t; msg.className = 'gate-msg ok'; }

    function submit() {
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { fail('That does not look like an email address.'); return; }
      if (hp && hp.value) { fail('Something went wrong. Please try again.'); return; }
      if (Date.now() - opened < 2000) { fail('One moment, then try again.'); return; }

      btn.disabled = true;
      ok('Just a second\u2026');

      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          website: hp ? hp.value : '',
          elapsed: Date.now() - opened,
          token: btoa(String(opened)).slice(0, 24),
          source: mode === 'signin' ? 'sign-in' : 'practice-room'
        })
      }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (d) {
          btn.disabled = false;
          if (d && d.ok) {
            var s = LPK.load();
            s.unlocked = true; s.email = email;
            LPK.save(s);
            paintAccount();
            ok(d.known
              ? 'Welcome back. This device is unlocked.'
              : 'Unlocked. Check your inbox and click the link to confirm your address.');
            setTimeout(function () { closeGate(); if (onUnlockCb) onUnlockCb(); }, 1400);
          } else {
            fail((d && d.error) || 'That did not go through. Please try again in a moment.');
          }
        }).catch(function () {
          btn.disabled = false;
          fail('Could not reach the server. Check your connection and try again.');
        });
    }

    btn.onclick = submit;
    input.onkeydown = function (e) { if (e.key === 'Enter') submit(); };
    if (closeBtn) closeBtn.onclick = function () {
      var s = LPK.load(); s.gateSoftened = true; LPK.save(s);
      closeGate();
    };
  }

  function closeGate() {
    var gate = document.getElementById('gate');
    if (gate) gate.hidden = true;
  }

  /* ---------------- header account control ---------------- */
  function paintAccount() {
    var s = st();
    var signIn = document.getElementById('signInBtn');
    var acct = document.getElementById('acct');
    if (!signIn || !acct) return;
    if (s.unlocked && s.email) {
      signIn.hidden = true;
      acct.hidden = false;
      document.getElementById('acctInitial').textContent = s.email.charAt(0).toUpperCase();
      document.getElementById('acctEmail').textContent = s.email;
    } else {
      signIn.hidden = false;
      acct.hidden = true;
    }
  }

  function bindAccount() {
    var signIn = document.getElementById('signInBtn');
    if (signIn) signIn.addEventListener('click', function () { open('signin'); });

    var btn = document.getElementById('acctBtn');
    var menu = document.getElementById('acctMenu');
    if (btn && menu) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var showing = !menu.hidden;
        menu.hidden = showing;
        btn.setAttribute('aria-expanded', String(!showing));
      });
      document.addEventListener('click', function () {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    var out = document.getElementById('acctOut');
    if (out) out.addEventListener('click', function () {
      var s = LPK.load();
      delete s.unlocked; delete s.email;
      LPK.save(s);
      paintAccount();
      var h = document.getElementById('hint');
      if (h) {
        h.textContent = 'Signed out on this device. Your practice history is untouched.';
        h.classList.add('show');
        setTimeout(function () { h.classList.remove('show'); }, 2600);
      }
    });

    addEventListener('keydown', function (e) {
      var gate = document.getElementById('gate');
      if (e.key === 'Escape' && gate && !gate.hidden) {
        var c = document.getElementById('gateClose');
        if (c && !c.hidden) c.click();
      }
    });

    paintAccount();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindAccount);
  else bindAccount();

  return {
    unlocked: unlocked,
    shouldBlock: shouldBlock,
    countSession: countSession,
    remaining: remaining,
    open: open,
    close: closeGate,
    paintAccount: paintAccount
  };
})();
