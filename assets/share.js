/* Learn Piano Keys - sharing helpers.
   Honest about the platform limits rather than papering over them:
   a picture and a link are separate actions because messaging apps
   drop the caption when a file is attached. */

var LPKShare = (function () {
  function toast(msg) {
    var h = document.getElementById('hint');
    if (!h) return;
    h.textContent = msg;
    h.classList.add('show');
    clearTimeout(h._t);
    h._t = setTimeout(function () { h.classList.remove('show'); }, 2400);
  }

  function dataUrlToFile(dataUrl, name) {
    var parts = dataUrl.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new File([arr], name, { type: mime });
  }

  async function shareImage(dataUrl, filename, title, text) {
    var file;
    try { file = dataUrlToFile(dataUrl, filename); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: title, text: text });
        return true;
      } catch (e) {
        if (e && e.name === 'AbortError') return false;
      }
    }
    var a = document.createElement('a');
    a.href = dataUrl; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    toast('Your browser cannot share files, so it has been downloaded instead.');
    return false;
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

  return { shareImage: shareImage, shareLink: shareLink, toast: toast };
})();
