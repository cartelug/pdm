/* ==========================================================================
   Pamodzi — global preloader controller
   --------------------------------------------------------------------------
   Loaded synchronously in <head> on every public page, before first paint:

     <link rel="stylesheet" href="css/preloader.css">
     <script src="js/preloader.js"></script>

   It switches the static .site-loader markup on, reveals the logo once it has
   decoded, and dismisses the screen when the page has loaded — never sooner
   than a short brand moment and never later than a hard cap. Other scripts
   can wait for the exit:

     window.PamodziPreloader.whenDone(callback);
     document.addEventListener("pamodzi:preloaded", callback);
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var MIN_FIRST_VISIT_MS = 900; // the brand moment, once per session
  var MIN_REPEAT_VISIT_MS = 0; // later pages: only as long as they actually take to load
  var MAX_WAIT_MS = 2800;
  var EXIT_MS = 420;
  var SESSION_KEY = "pamodzi:preloader-seen";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var callbacks = [];
  var done = false;

  function now() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function seenThisSession() {
    try {
      var seen = window.sessionStorage.getItem(SESSION_KEY) === "1";
      window.sessionStorage.setItem(SESSION_KEY, "1");
      return seen;
    } catch (error) {
      return false;
    }
  }

  var minimumMs = reduced ? 0 : seenThisSession() ? MIN_REPEAT_VISIT_MS : MIN_FIRST_VISIT_MS;

  function finish() {
    if (done) return;
    done = true;
    root.classList.add("is-preloaded");

    var loader = document.querySelector(".site-loader");
    if (loader) {
      loader.classList.add("is-done");
      window.setTimeout(
        function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
          root.classList.remove("has-preloader");
        },
        reduced ? 0 : EXIT_MS + 60,
      );
    } else {
      root.classList.remove("has-preloader");
    }

    callbacks.splice(0).forEach(function (callback) {
      try {
        callback();
      } catch (error) {
        window.setTimeout(function () {
          throw error;
        });
      }
    });

    var event;
    try {
      event = new CustomEvent("pamodzi:preloaded");
    } catch (error) {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent("pamodzi:preloaded", false, false, null);
    }
    document.dispatchEvent(event);
  }

  function finishAfterMinimum() {
    window.setTimeout(finish, Math.max(0, minimumMs - now()));
  }

  function revealMark(loader) {
    var mark = loader.querySelector(".site-loader__mark");
    var image = mark && mark.querySelector("img");
    if (!image) return;

    function ready() {
      mark.classList.add("is-ready");
    }

    if (image.complete && image.naturalWidth) {
      ready();
    } else if (image.decode) {
      image.decode().then(ready, ready);
    } else {
      image.addEventListener("load", ready, { once: true });
      image.addEventListener("error", ready, { once: true });
    }
  }

  function start() {
    var loader = document.querySelector(".site-loader");
    if (!loader) {
      finish();
      return;
    }
    revealMark(loader);

    if (document.readyState === "complete") finishAfterMinimum();
    else window.addEventListener("load", finishAfterMinimum, { once: true });
  }

  window.PamodziPreloader = {
    isDone: function () {
      return done;
    },
    whenDone: function (callback) {
      if (done) callback();
      else callbacks.push(callback);
    },
  };

  root.classList.add("has-preloader");
  window.setTimeout(finish, MAX_WAIT_MS);

  // A page restored from the back/forward cache must never show the screen again.
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) finish();
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
