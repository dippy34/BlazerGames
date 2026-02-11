(function () {
  var platform = window.navigator && window.navigator.platform ? window.navigator.platform : "";
  var userAgent = window.navigator && window.navigator.userAgent ? window.navigator.userAgent : "";
  var isMac = /Mac|iPhone|iPad|iPod/.test(platform) || /Mac|iPhone|iPad|iPod/.test(userAgent);

  if (!isMac) {
    return;
  }

  window.addEventListener(
    "keydown",
    function (event) {
      if (!event || !event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (typeof event.key !== "string" || event.key.toLowerCase() !== "p") {
        return;
      }

      event.preventDefault();
      window.location.assign("https://www.ixl.com");
    },
    true
  );
})();
