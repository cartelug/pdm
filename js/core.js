/* Pamodzi core
   One shared foundation for brand loading, navigation, header state and page progress. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceQuery.matches;
  var header = document.getElementById("hdr");
  var burger = document.getElementById("burger");
  var mobileNav = document.getElementById("mnav");
  var lastFocus = null;
  var ticking = false;
  var heroThreshold = 180;
  var scrollRange = 1;

  window.PamodziCore = {
    version: "2.0.0",
    reducedMotion: function () { return reduced; }
  };

  function all(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function prepareBrand() {
    var icon = document.querySelector('link[rel~="icon"]');
    if (icon) {
      icon.setAttribute("href", "assets/brand/pamodzi/pamodzi-logo-transparent.png");
      icon.setAttribute("type", "image/png");
    }

    if (document.querySelector(".site-loader")) return;

    var loader = document.createElement("div");
    loader.className = "site-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.setAttribute("aria-label", "Loading PCI Uganda");
    loader.innerHTML = '<div class="inner"><img src="assets/brand/pamodzi/pamodzi-logo-transparent.png" alt=""><span>PCI Uganda</span></div>';
    document.body.insertBefore(loader, document.body.firstChild);

    var closed = false;
    function closeLoader() {
      if (closed) return;
      closed = true;
      loader.classList.add("done");
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, reduced ? 0 : 520);
    }

    if (document.readyState === "complete") {
      window.setTimeout(closeLoader, reduced ? 0 : 220);
    } else {
      window.addEventListener("load", function () {
        window.setTimeout(closeLoader, reduced ? 0 : 220);
      }, { once: true });
    }
    window.setTimeout(closeLoader, reduced ? 0 : 900);
  }

  function navFocusables() {
    return mobileNav ? all("a, button", mobileNav) : [];
  }

  function closeNav(options) {
    if (!mobileNav || !burger) return;
    mobileNav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    mobileNav.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-open");
    document.body.style.overflow = "";
    if (!options || options.restoreFocus !== false) {
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }
  }

  function openNav() {
    if (!mobileNav || !burger) return;
    lastFocus = document.activeElement;
    mobileNav.classList.add("open");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
    mobileNav.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-open");
    document.body.style.overflow = "hidden";
    var focusable = navFocusables();
    if (focusable.length) focusable[0].focus();
  }

  function prepareNavigation() {
    if (!burger || !mobileNav || burger.dataset.coreBound === "true") return;
    burger.dataset.coreBound = "true";
    mobileNav.setAttribute("aria-hidden", "true");

    burger.addEventListener("click", function () {
      if (mobileNav.classList.contains("open")) closeNav();
      else openNav();
    });

    mobileNav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeNav({ restoreFocus: false });
    });

    document.addEventListener("keydown", function (event) {
      if (!mobileNav.classList.contains("open")) return;
      if (event.key === "Escape") {
        closeNav();
        return;
      }
      if (event.key !== "Tab") return;

      var focusable = navFocusables();
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080 && mobileNav.classList.contains("open")) {
        closeNav({ restoreFocus: false });
      }
    }, { passive: true });
  }

  function ensureProgress() {
    var progress = document.querySelector(".scroll-progress");
    if (progress) return progress;
    progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);
    return progress;
  }

  var progress = null;

  function measurePage() {
    var hero = document.querySelector(".hero, .page-hero");
    heroThreshold = hero ? hero.offsetHeight * 0.56 : 180;
    scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  }

  function paintPage() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (header) header.classList.toggle("solid", y > heroThreshold);
    if (progress) {
      progress.style.transform = "scaleX(" + Math.min(Math.max(y / scrollRange, 0), 1) + ")";
    }
    ticking = false;
  }

  function requestPaint() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(paintPage);
  }

  function prepareScrollState() {
    progress = ensureProgress();
    measurePage();
    paintPage();
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", function () {
      measurePage();
      requestPaint();
    }, { passive: true });
    window.addEventListener("load", function () {
      measurePage();
      paintPage();
    }, { once: true });
  }

  function ready() {
    prepareBrand();
    prepareNavigation();
    prepareScrollState();
  }

  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", function (event) {
      reduced = event.matches;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();
