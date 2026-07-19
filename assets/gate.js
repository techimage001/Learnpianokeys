/* Learn Piano Keys - signup gate.
   Counts practice-room sessions only. The beginner lesson and every tool
   stay open forever, because those are the pages people arrive on. */

var LPKGate = (function () {
  var FREE_SESSIONS = 3;
  var API = '/api/collect.php';

  function state() {
    var s = LPK.load();
    return { uses: s.appUses || 0, unlocked: !!s.unlocked, email: s.email || '' };
  }

  function unlocked() { return state().unlocked; }

  /* Called once when a practice session actually begins. */
  function countSession() {
    var s = LPK.load();
    if (s.unlocked) return false;
    s.appUses = (s.appUses || 0) + 1;
    LPK.save(s);
    return s.appUses > FREE_SESSIONS;
  }

  function shouldBlock() {
    var st = state();
    return !st.unlocked && st.uses >= FREE_SESSIONS;
  }

  function open(onUnlock) {
    var gate = document.getElementById('gate');
    if (!gate) return;
    gate.hidden = false;
    var input = document.getElementById('gateEmail');
    var msg = document.getElementById('gateMsg');
    var btn = document.getElementById('gateSubmit');
    var hp = document.getElementById('gateWebsite');
    var opened = Date.now();
    setTimeout(function () { input && input.focus(); }, 60);

    function fail(t) { msg.textContent = t; msg.className = 'gate-msg no'; }
    function ok(t) { msg.textContent = t; msg.className = 'gate-msg ok'; }

    function submit() {
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { fail('That does not look like an email address.'); return; }
      if (hp && hp.value) { fail('Something went wrong. Please try again.'); return; }
      if (Date.now() - opened < 2000) { fail('One moment, then try again.'); return; }

      btn.disabled = true;
      ok('Sending your confirmation link…');

      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          website: hp ? hp.value : '',
          elapsed: Date.now() - opened,
          token: btoa(String(opened)).slice(0, 24),
          source: 'practice-room'
        })
      }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (d) {
          btn.disabled = false;
          if (d && d.ok) {
            var s = LPK.load();
            s.unlocked = true; s.email = email;
            LPK.save(s);
            ok(d.known
              ? 'Welcome back. This device is unlocked.'
              : 'Check your inbox and click the link to confirm. The practice room is unlocked now.');
            setTimeout(function () { close(); if (onUnlock) onUnlock(); }, 1500);
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
  }

  function close() {
    var gate = document.getElementById('gate');
    if (gate) gate.hidden = true;
  }

  return {
    unlocked: unlocked,
    shouldBlock: shouldBlock,
    countSession: countSession,
    open: open,
    close: close,
    remaining: function () { return Math.max(0, FREE_SESSIONS - state().uses); }
  };
})();
