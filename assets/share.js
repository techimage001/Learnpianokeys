/* Learn Piano Keys - sharing helpers.
   Links only. Nothing on this site is downloadable: every arrangement,
   diagram and score stays inside the app, and the learner's place is kept
   for them instead. */

var LPKShare = (function () {
  function toast(msg) {
    var h = document.getElementById('hint');
    if (!h) return;
    h.textContent = msg;
    h.classList.add('show');
    clearTimeout(h._t);
    h._t = setTimeout(function () { h.classList.remove('show'); }, 2400);
  }

  async function shareLink(url, title, text) {
    if (navigator.share) {
      try { await navigator.share({ title: title, text: text, url: url }); return true; }
      catch (e) { if (e && e.name === 'AbortError') return false; }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied. Paste it wherever you like.');
      return true;
    } catch (e) {
      toast(url);
      return false;
    }
  }

  return { shareLink: shareLink, toast: toast };
})();
