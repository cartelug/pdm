/* Pamodzi motion direction
   Shared, progressive-enhancement choreography for every public page. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var reduced = reduceQuery.matches;
  var activeSections = [];
  var ticking = false;
  var lastY = window.pageYOffset || 0;
  var lastDirectionChange = lastY;
  var header = document.getElementById("hdr");
  var hero = document.querySelector(".hero, .page-hero");
  var heroMedia = document.querySelector(".hero-media img, .sky");

  window.PamodziMotion = true;
  root.classList.add("motion-enabled");

  function all(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function setRevealVocabulary() {
    var reveals = all(".reveal");
    var vocabulary = ["rise", "rise", "left", "right", "scale"];

    reveals.forEach(function (element, index) {
      if (!element.getAttribute("data-motion")) {
        var mode = vocabulary[index % vocabulary.length];
        if (element.matches(".c-side, .split > :last-child")) mode = "right";
        if (element.matches(".c-main, .split > :first-child")) mode = "left";
        if (element.matches(".pillars, .cards, .figs, .pathway, .tl, .journey-grid, .board")) mode = "rise";
        element.setAttribute("data-motion", mode);
      }
      element.style.setProperty("--reveal-delay", Math.min((index % 4) * 55, 165) + "ms");
    });

    var groups = all(".pillars, .cards, .figs, .pathway, .tl, .journey-grid, .trustline .in, .hero-meta");
    groups.forEach(function (group) {
      group.classList.add("motion-group");
      Array.prototype.forEach.call(group.children, function (child, index) {
        child.classList.add("motion-item");
        child.style.setProperty("--item-index", index);
      });
    });

    if (reduced || !("IntersectionObserver" in window)) {
      reveals.forEach(function (element) { element.classList.add("in"); });
      groups.forEach(function (group) { group.classList.add("motion-in"); });
      return;
    }

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.11, rootMargin: "0px 0px -7% 0px" });

    reveals.forEach(function (element) { revealObserver.observe(element); });

    var groupObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("motion-in");
        groupObserver.unobserve(entry.target);
      });
    }, { threshold: 0.09, rootMargin: "0px 0px -5% 0px" });

    groups.forEach(function (group) { groupObserver.observe(group); });
  }

  function prepareSurfaceLight() {
    if (!finePointer.matches || reduced) return;

    var surfaces = all(".pillar, .card, .fig, .prof, .tlx, .tier, .journey-card, .tcard, .gc, .panel");
    surfaces.forEach(function (surface) {
      if (surface.querySelector(":scope > .motion-glow")) return;
      surface.classList.add("motion-surface");
      var glow = document.createElement("span");
      glow.className = "motion-glow";
      glow.setAttribute("aria-hidden", "true");
      surface.insertBefore(glow, surface.firstChild);

      surface.addEventListener("pointermove", function (event) {
        var rect = surface.getBoundingClientRect();
        surface.style.setProperty("--pointer-x", ((event.clientX - rect.left) / rect.width * 100).toFixed(1) + "%");
        surface.style.setProperty("--pointer-y", ((event.clientY - rect.top) / rect.height * 100).toFixed(1) + "%");
      });
    });
  }

  function prepareMagneticActions() {
    if (!finePointer.matches || reduced) return;

    var magnets = all(".nav .btn, .hero .cta-row .btn, .page-hero .cta-row .btn").slice(0, 4);
    magnets.forEach(function (button) {
      button.classList.add("is-magnetic");

      button.addEventListener("pointermove", function (event) {
        var rect = button.getBoundingClientRect();
        var x = clamp((event.clientX - rect.left - rect.width / 2) * 0.12, -6, 6);
        var y = clamp((event.clientY - rect.top - rect.height / 2) * 0.16, -5, 5);
        button.style.setProperty("--magnetic-x", x.toFixed(2) + "px");
        button.style.setProperty("--magnetic-y", y.toFixed(2) + "px");
      });

      button.addEventListener("pointerleave", function () {
        button.style.setProperty("--magnetic-x", "0px");
        button.style.setProperty("--magnetic-y", "0px");
      });
    });
  }

  function prepareImageMotion() {
    function prepare(image) {
      if (image.classList.contains("motion-image-bound")) return;
      image.classList.add("motion-image-bound");
      function loaded() { image.classList.add("motion-image-ready"); }
      if (image.complete) loaded();
      else image.addEventListener("load", loaded, { once: true });
    }

    all(".journey-photo img, [data-slot] img, .hero-media img").forEach(prepare);

    if ("MutationObserver" in window) {
      var imageObserver = new MutationObserver(function (records) {
        records.forEach(function (record) {
          Array.prototype.forEach.call(record.addedNodes, function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches(".journey-photo img, [data-slot] img, .hero-media img")) prepare(node);
            if (node.querySelectorAll) all(".journey-photo img, [data-slot] img, .hero-media img", node).forEach(prepare);
          });
        });
      });
      imageObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  function trackVisibleSections() {
    var sections = all(".blk");
    if (reduced || !("IntersectionObserver" in window)) {
      activeSections = sections;
      return;
    }

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var index = activeSections.indexOf(entry.target);
        if (entry.isIntersecting && index === -1) activeSections.push(entry.target);
        if (!entry.isIntersecting && index !== -1) activeSections.splice(index, 1);
      });
    }, { rootMargin: "25% 0px 25% 0px" });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  function updateMotion() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var delta = y - lastY;
    var viewport = Math.max(window.innerHeight, 1);
    var mobile = window.innerWidth <= 780;

    if (!reduced) {
      if (hero && heroMedia) {
        var heroHeight = Math.max(hero.offsetHeight, 1);
        var heroProgress = clamp(y / heroHeight, 0, 1);
        hero.style.setProperty("--hero-copy-y", (heroProgress * (mobile ? 10 : 28)).toFixed(2) + "px");
        hero.style.setProperty("--hero-media-y", (heroProgress * (mobile ? 8 : 32)).toFixed(2) + "px");
        hero.style.setProperty("--hero-media-scale", (1.035 + heroProgress * 0.025).toFixed(4));
      }

      activeSections.forEach(function (section) {
        var rect = section.getBoundingClientRect();
        var centerDelta = (rect.top + rect.height / 2 - viewport / 2) / viewport;
        var shift = clamp(centerDelta * (mobile ? -8 : -18), mobile ? -8 : -18, mobile ? 8 : 18);
        section.style.setProperty("--section-shift", shift.toFixed(2) + "px");
      });

      if (header && !document.querySelector(".mnav.open")) {
        if ((delta > 2 && y > 360) || (y > lastDirectionChange + 90 && y > 360)) {
          header.classList.add("is-hidden");
        } else if (delta < -2 || y < 140) {
          header.classList.remove("is-hidden");
        }
      }
    }

    if ((delta > 0 && lastY <= y) || (delta < 0 && lastY >= y)) {
      if (Math.abs(y - lastDirectionChange) > 90) lastDirectionChange = y;
    } else {
      lastDirectionChange = y;
    }

    lastY = y;
    ticking = false;
  }

  function requestMotionFrame() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateMotion);
  }

  function preparePageTransitions() {
    var wipe = document.createElement("div");
    wipe.className = "page-wipe";
    wipe.setAttribute("aria-hidden", "true");
    document.body.appendChild(wipe);

    window.addEventListener("pageshow", function () {
      document.body.classList.remove("is-leaving");
      if (header) header.classList.remove("is-hidden");
    });

    document.addEventListener("click", function (event) {
      if (reduced || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download") || link.hasAttribute("data-no-transition")) return;

      var raw = link.getAttribute("href");
      if (!raw || raw.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(raw)) return;

      var target;
      try { target = new URL(link.href, window.location.href); } catch (error) { return; }
      if (target.origin !== window.location.origin) return;
      if (target.pathname === window.location.pathname && target.search === window.location.search && target.hash) return;

      event.preventDefault();
      document.body.classList.add("is-leaving");
      window.setTimeout(function () { window.location.href = target.href; }, 340);
    });
  }

  function addPressFeedback() {
    document.addEventListener("pointerdown", function (event) {
      var target = event.target.closest(".btn, .burger, .tier, .mnav a");
      if (target) target.classList.add("is-pressed");
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (type) {
      document.addEventListener(type, function () {
        all(".is-pressed").forEach(function (target) { target.classList.remove("is-pressed"); });
      });
    });
  }

  function ready() {
    setRevealVocabulary();
    prepareSurfaceLight();
    prepareMagneticActions();
    prepareImageMotion();
    trackVisibleSections();
    preparePageTransitions();
    addPressFeedback();

    window.addEventListener("scroll", requestMotionFrame, { passive: true });
    window.addEventListener("resize", requestMotionFrame, { passive: true });
    reduceQuery.addEventListener && reduceQuery.addEventListener("change", function (event) {
      reduced = event.matches;
      if (reduced && header) header.classList.remove("is-hidden");
    });

    requestMotionFrame();

    function startOpeningSequence() {
      var delay = document.querySelector(".site-loader") ? 320 : 70;
      window.setTimeout(function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () { root.classList.add("motion-ready"); });
        });
      }, delay);
    }

    if (document.readyState === "complete") startOpeningSequence();
    else window.addEventListener("load", startOpeningSequence, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
