(function () {
  try {
    var params = new URLSearchParams(window.location.search);
    var redirect = params.get('redirect');
    if (!redirect) return;
    history.replaceState(null, '', decodeURIComponent(redirect));
  } catch (_) {
  }
})();
