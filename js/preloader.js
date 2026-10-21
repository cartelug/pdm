/* ==========================================================================
   Pamodzi — page-ready controller (the loading screen is retired)
   --------------------------------------------------------------------------
   Pages used to hold a full-screen logo for at least 0.9 s on a first visit. They now paint at once and
   their own entrance plays straight away. This file keeps the contract other scripts rely on:

     window.PamodziPreloader.whenDone(callback);      runs at once
     document.addEventListener("pamodzi:preloaded", callback);
     <html class="is-preloaded">                      set before the first paint

   Nothing waits, nothing is covered, and no `has-preloader` class is ever added, so the stylesheets
   that hide content while it is present never match.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var done = false;

  function finish() {
    if (done) return;
    done = true;
    root.classList.add("is-preloaded");

    var event;
    try {
      event = new CustomEvent("pamodzi:preloaded");
    } catch (error) {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent("pamodzi:preloaded", false, false, null);
    }
    document.dispatchEvent(event);
  }

  window.PamodziPreloader = {
    isDone: function () {
      return done;
    },
    whenDone: function (callback) {
      callback();
    },
  };

  finish();
})();
