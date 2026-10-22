/* ==========================================================================
   Walk for Education — motion and presentation
   --------------------------------------------------------------------------
   Presentation only. Pricing, pledges, payments and certificates stay with
   wfe-shell.js, step-pricing.js and contributions.js.

     1. Motion preference: device setting, data saving and the visible toggle
     2. Hero entrance (.w-go) and header state
     3. Scroll reveals for [data-reveal]
     4. Scroll scenes: hero depth, the backpack frames, the journey line,
        the learning chapters and background depth
     5. The five-friends circle and the pledge summary feedback
     6. Current section (the campaign shell owns the menu)
     7. Illustration gallery and accessible viewer

   Scrolling stays native: nothing here intercepts wheel or touch input.
   ========================================================================== */
(function () {
  "use strict";
  if (!document.body.classList.contains("wfe-redesign")) return;
  var root = document.documentElement;
  var body = document.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var wide = window.matchMedia("(min-width: 900px)");
  var toggle = document.getElementById("motionToggle");
  var paused = false;
  try {
    paused = sessionStorage.getItem("wfe_motion_paused") === "true";
  } catch (error) {
    /* Motion preferences work without storage. */
  }
  var saveData = Boolean(navigator.connection && navigator.connection.saveData);
  var hasObserver = "IntersectionObserver" in window;

  function motionOff() {
    return paused || reduced.matches || saveData;
  }

  /* ---------- 1. motion preference ---------- */

  function applyMotion() {
    var off = motionOff();
    body.classList.toggle("r-motion-paused", off);
    body.classList.toggle("r-motion-ready", !off);
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(off));
      toggle.setAttribute("aria-label", off ? "Resume decorative motion" : "Pause decorative motion");
      toggle.firstElementChild.textContent = off ? "▷" : "Ⅱ";
      toggle.lastElementChild.textContent = off ? "Resume motion" : "Pause motion";
      toggle.disabled = reduced.matches || saveData;
      toggle.title = reduced.matches
        ? "Reduced motion is enabled in your device settings"
        : saveData
          ? "Decorative motion is off while data saving is enabled"
          : off
            ? "Resume decorative motion"
            : "Pause decorative motion";
    }
    if (off) revealAll();
    setupScenes();
    requestFrame();
  }

  if (toggle)
    toggle.addEventListener("click", function () {
      paused = !paused;
      try {
        sessionStorage.setItem("wfe_motion_paused", String(paused));
      } catch (error) {
        /* Optional. */
      }
      applyMotion();
    });
  reduced.addEventListener("change", applyMotion);

  /* ---------- 3. scroll reveals ---------- */

  var pending = Array.from(document.querySelectorAll("[data-reveal]"));
  pending.forEach(function (node) {
    var kind = node.getAttribute("data-reveal");
    if (kind === "lines")
      node.querySelectorAll(".w-line").forEach(function (line, index) {
        line.style.setProperty("--i", index);
      });
    if (kind === "stagger")
      Array.from(node.children).forEach(function (child, index) {
        child.style.setProperty("--i", index);
      });
  });

  function reveal(node) {
    node.classList.add("is-in");
    var index = pending.indexOf(node);
    if (index > -1) pending.splice(index, 1);
    if (revealObserver) revealObserver.unobserve(node);
  }

  function revealAll() {
    pending.slice().forEach(reveal);
    root.classList.remove("w-reveal-ready");
    document.querySelectorAll(".w-five__visual").forEach(function (node) {
      node.classList.add("is-in");
    });
  }

  var revealObserver = null;
  if (hasObserver) {
    revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) reveal(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
  }

  function startReveals() {
    if (!revealObserver || motionOff()) {
      revealAll();
      return;
    }
    root.classList.add("w-reveal-ready");
    pending.forEach(function (node) {
      revealObserver.observe(node);
    });
  }

  // Anything scrolled past between frames (a fast fling, an anchor jump) is shown at once.
  function revealPassed() {
    if (!pending.length) return;
    var limit = window.innerHeight;
    pending.slice().forEach(function (node) {
      if (node.getBoundingClientRect().top < limit * 0.94) reveal(node);
    });
  }

  /* ---------- 4. scroll scenes ---------- */

  var header = document.querySelector("[data-header]");
  var heroArt = document.querySelector(".w-hero__portrait img");
  var bag = document.querySelector('[data-scene="bag"]');
  var frames = bag ? Array.from(bag.querySelectorAll("[data-frame]")) : [];
  var ticks = [];
  if (bag && frames.length) {
    var tickRow = document.createElement("div");
    tickRow.className = "w-bag__ticks";
    tickRow.setAttribute("aria-hidden", "true");
    frames.forEach(function () {
      var tick = document.createElement("i");
      tickRow.appendChild(tick);
      ticks.push(tick);
    });
    bag.querySelector(".w-bag__copy").appendChild(tickRow);
  }
  var route = document.querySelector("[data-route]");
  var routePath = route && route.querySelector(".w-route__draw");
  var routeWalker = route && route.querySelector(".w-route__walker");
  var routeLength = 0;
  try {
    routeLength = routePath ? routePath.getTotalLength() : 0;
  } catch (error) {
    routeLength = 0;
  }
  var depthNodes = Array.from(document.querySelectorAll("[data-depth], .w-ambition__bg img, .w-closing__bg img"));
  var hinge = document.querySelector(".w-learn__hinge img");
  var activeFrame = -1;

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  function setupScenes() {
    var on = !motionOff();
    var bagOn = on && window.innerHeight >= 640;
    if (bag) bag.classList.toggle("is-scrolly", bagOn);
    if (!bagOn) {
      frames.forEach(function (frame, index) {
        frame.classList.toggle("is-active", index === 0);
      });
      activeFrame = -1;
    }
    if (!on) {
      depthNodes.concat(heroArt ? [heroArt] : []).forEach(function (node) {
        node.style.removeProperty("--depth");
      });
      if (hinge) hinge.style.removeProperty("--hinge-scale");
      placeWalker(1);
    }
  }

  function placeWalker(progress) {
    if (!routePath) return;
    routePath.style.setProperty("--route", progress.toFixed(4));
    if (!routeWalker || !routeLength) return;
    var point = routePath.getPointAtLength(routeLength * progress);
    routeWalker.setAttribute("cx", point.x.toFixed(1));
    routeWalker.setAttribute("cy", point.y.toFixed(1));
  }

  function scenes() {
    // A fixed-body menu must not reset the hero, chapter or route scenes to scroll zero.
    if (body.classList.contains("r-menu-open")) return;
    var height = window.innerHeight;
    var on = !motionOff();

    if (heroArt && on && wide.matches && window.scrollY < height * 1.2)
      heroArt.style.setProperty("--depth", Math.min(24, window.scrollY * 0.05).toFixed(1) + "px");

    if (bag && on && bag.classList.contains("is-scrolly") && frames.length) {
      var rect = bag.getBoundingClientRect();
      var travel = Math.max(1, rect.height - height);
      var progress = clamp(-rect.top / travel);
      var index = Math.min(frames.length - 1, Math.floor(progress * frames.length));
      if (index !== activeFrame) {
        frames.forEach(function (frame, i) {
          frame.classList.toggle("is-active", i === index);
        });
        ticks.forEach(function (tick, i) {
          tick.classList.toggle("is-on", i <= index);
        });
        activeFrame = index;
      }
      var local = progress * frames.length - index;
      frames[index].style.setProperty("--bag-zoom", (1 + clamp(local) * 0.06).toFixed(4));
    }

    if (route && on) {
      var box = route.getBoundingClientRect();
      if (box.top < height && box.bottom > 0) placeWalker(clamp((height * 0.92 - box.top) / (height * 0.62)));
    }

    if (hinge && on) {
      var frame = hinge.getBoundingClientRect();
      if (frame.top < height && frame.bottom > 0)
        hinge.style.setProperty("--hinge-scale", (1.08 - clamp(1 - frame.top / height) * 0.08).toFixed(4));
    }

    if (on && wide.matches)
      depthNodes.forEach(function (node) {
        var area = node.getBoundingClientRect();
        if (area.bottom < -200 || area.top > height + 200) return;
        var amount = Number(node.getAttribute("data-depth")) || 24;
        var offset = (area.top + area.height / 2 - height / 2) / height;
        node.style.setProperty("--depth", (Math.max(-1, Math.min(1, offset)) * -amount).toFixed(1) + "px");
      });

    if (on)
      storyImages.forEach(function (node) {
        var area = node.parentElement.getBoundingClientRect();
        if (area.bottom < 0 || area.top > height) return;
        var travel = wide.matches ? 18 : 8;
        node.style.setProperty(
          "--story-y",
          ((clamp((height - area.top) / (height + area.height)) - 0.5) * travel).toFixed(1) + "px",
        );
      });

    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
    revealPassed();
  }

  var scheduled = false;
  function requestFrame() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      scenes();
    });
  }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", function () {
    setupScenes();
    requestFrame();
  });
  window.addEventListener("wfe:menu-state", requestFrame);

  /* Small, one-shot details complement the chapter scenes. No content is hidden while waiting.
     Native scrolling, native links and the original numbers remain the source of truth. */
  var storyImages = Array.from(
    document.querySelectorAll(".w-learn__fig img, .w-journey__road img, .w-builders__fig img"),
  );
  var detailObserver = hasObserver
    ? new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            if (!motionOff()) entry.target.classList.add("w-detail-in");
            detailObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.12 },
      )
    : null;
  function observeDetails(scope) {
    if (!detailObserver) return;
    scope
      .querySelectorAll(
        ".r-gallery-card, .w-resources__grid > a, .w-tiers tbody tr, .w-ledger-list > *, .w-faq__list details, .w-footer__top > *",
      )
      .forEach(function (node, index) {
        node.style.setProperty("--detail-order", index % 3);
        detailObserver.observe(node);
      });
  }
  observeDetails(document);

  // Pointer depth composes with the existing image transforms; touch keeps its native gestures.
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var heroMedia = document.querySelector(".w-hero__media");
  if (heroMedia) {
    heroMedia.addEventListener("pointermove", function (event) {
      if (!finePointer.matches || motionOff() || body.classList.contains("r-menu-open")) return;
      var box = heroMedia.getBoundingClientRect();
      heroMedia.style.setProperty(
        "--pointer-x",
        (((event.clientX - box.left) / box.width - 0.5) * 10).toFixed(1) + "px",
      );
      heroMedia.style.setProperty(
        "--pointer-y",
        (((event.clientY - box.top) / box.height - 0.5) * 8).toFixed(1) + "px",
      );
    });
    heroMedia.addEventListener("pointerleave", function () {
      heroMedia.style.removeProperty("--pointer-x");
      heroMedia.style.removeProperty("--pointer-y");
    });
  }

  // Learning chapters: the current place to learn lights its marker.
  if (hasObserver) {
    var chapterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-current", entry.isIntersecting);
        });
      },
      { rootMargin: "-35% 0px -45% 0px" },
    );
    document.querySelectorAll("[data-chapter]").forEach(function (chapter) {
      chapterObserver.observe(chapter);
    });
  }

  /* ---------- 5. the five-friends circle and pledge feedback ---------- */

  var dots = document.querySelector("[data-five-dots]");
  if (dots) {
    var ns = "http://www.w3.org/2000/svg";
    var shape = function (name, attrs) {
      var node = document.createElementNS(ns, name);
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, attrs[key]);
      });
      return node;
    };
    var lines = document.createElementNS(ns, "g");
    var circles = document.createElementNS(ns, "g");
    for (var friend = 0; friend < 5; friend++) {
      var angle = -Math.PI / 2 + (friend * 2 * Math.PI) / 5;
      var fx = 200 + Math.cos(angle) * 118;
      var fy = 200 + Math.sin(angle) * 118;
      var line = shape("line", { x1: 200, y1: 200, x2: fx.toFixed(1), y2: fy.toFixed(1), pathLength: 1 });
      line.style.setProperty("--d", friend * 90 + "ms");
      lines.appendChild(line);
      var dot = shape("circle", { cx: fx.toFixed(1), cy: fy.toFixed(1), r: 8, class: "is-ring1" });
      dot.style.setProperty("--d", 120 + friend * 90 + "ms");
      circles.appendChild(dot);
      for (var extra = 0; extra < 5; extra++) {
        var spread = angle + ((extra - 2) * Math.PI) / 15;
        var mx = 200 + Math.cos(spread) * 182;
        var my = 200 + Math.sin(spread) * 182;
        var link = shape("line", {
          x1: fx.toFixed(1),
          y1: fy.toFixed(1),
          x2: mx.toFixed(1),
          y2: my.toFixed(1),
          pathLength: 1,
        });
        link.style.setProperty("--d", 600 + friend * 110 + extra * 30 + "ms");
        lines.appendChild(link);
        var small = shape("circle", { cx: mx.toFixed(1), cy: my.toFixed(1), r: 4.5, class: "is-ring3" });
        small.style.setProperty("--d", 700 + friend * 110 + extra * 30 + "ms");
        circles.appendChild(small);
      }
    }
    dots.append(lines, circles);
    var visual = dots.closest(".w-five__visual");
    if (hasObserver && !motionOff()) {
      var fiveObserver = new IntersectionObserver(
        function (entries) {
          if (!entries[0].isIntersecting) return;
          visual.classList.add("is-in");
          fiveObserver.disconnect();
        },
        { threshold: 0.3 },
      );
      fiveObserver.observe(visual);
    } else visual.classList.add("is-in");
  }

  var total = document.getElementById("campaignTotal");
  var summary = total && total.closest(".w-summary");
  if (total && summary) {
    var lastTotal = total.textContent;
    new MutationObserver(function () {
      if (total.textContent === lastTotal) return;
      lastTotal = total.textContent;
      if (motionOff() || root.classList.contains("pledge-pending")) return;
      summary.classList.remove("is-bump");
      void summary.offsetWidth;
      summary.classList.add("is-bump");
    }).observe(total, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- 6. current section ---------- */

  var menu = document.getElementById("wfeMenu");
  if (menu) {
    // The section in view is marked in the navigation.
    if (hasObserver) {
      var navLinks = Array.from(menu.querySelectorAll('a[href^="#"]:not(.w-btn)'));
      var sectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            navLinks.forEach(function (link) {
              if (link.getAttribute("href") === "#" + entry.target.id) link.setAttribute("aria-current", "true");
              else link.removeAttribute("aria-current");
            });
          });
        },
        { rootMargin: "-45% 0px -50% 0px" },
      );
      navLinks.forEach(function (link) {
        var target = document.getElementById(link.getAttribute("href").slice(1));
        if (target) sectionObserver.observe(target);
      });
    }
  }

  /* ---------- 7. gallery and viewer ---------- */

  var grid = document.getElementById("campaignGallery");
  var more = document.getElementById("galleryLoadMore");
  var feedback = document.getElementById("galleryFeedback");
  var count = document.getElementById("galleryCount");
  var viewer = document.getElementById("imageViewer");
  var selectedFilter = "all";
  var limit = 9;
  var items = null;
  var request = null;
  var current = 0;
  var opener = null;
  var viewerOverflow = "";
  var image = document.getElementById("viewerImage");
  var swapTimer = 0;
  var filters = Array.from(document.querySelectorAll("[data-gallery-filter]"));

  function collection() {
    return (items || []).filter(function (item) {
      return selectedFilter === "all" || item.group === selectedFilter;
    });
  }
  function loadCollection() {
    if (items) return Promise.resolve(items);
    if (request) return request;
    var controller = new AbortController();
    var timer = window.setTimeout(function () {
      controller.abort();
    }, 8000);
    var url = new URL("../assets/wfe-2026/gallery.json", window.location.href);
    request = fetch(url.href, { signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error("The illustration collection could not be loaded.");
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length !== 56) throw new Error("The illustration collection is incomplete.");
        items = data;
        return items;
      })
      .finally(function () {
        window.clearTimeout(timer);
        request = null;
      });
    return request;
  }
  function showError() {
    feedback.textContent = "The full collection could not be loaded. Please try again.";
  }
  var sprite = function (name) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "w-i");
    var use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#" + name);
    svg.appendChild(use);
    return svg;
  };
  function makeCard(item, order) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "r-gallery-card";
    card.dataset.imageId = item.id;
    card.style.setProperty("--i", order);
    var frame = document.createElement("span");
    frame.className = "r-gallery-image";
    var img = document.createElement("img");
    img.src = item.thumb;
    img.alt = item.alt;
    img.width = item.width;
    img.height = item.height;
    img.loading = "lazy";
    img.decoding = "async";
    var arrow = document.createElement("span");
    arrow.className = "r-gallery-open";
    arrow.setAttribute("aria-hidden", "true");
    arrow.appendChild(sprite("i-out"));
    frame.append(img, arrow);
    var meta = document.createElement("span");
    meta.className = "r-gallery-meta";
    var label = document.createElement("small");
    label.textContent = item.label;
    var title = document.createElement("strong");
    title.textContent = item.title;
    meta.append(label, title);
    card.append(frame, meta);
    return card;
  }
  function renderGallery(append) {
    var data = collection();
    var before = append ? grid.children.length : 0;
    if (!append) grid.replaceChildren();
    data.slice(before, limit).forEach(function (item, index) {
      grid.appendChild(makeCard(item, index));
    });
    observeDetails(grid);
    count.textContent = "Showing " + Math.min(limit, data.length) + " of " + data.length + " illustrations";
    more.hidden = limit >= data.length;
    feedback.textContent = "";
    if (append) {
      feedback.textContent = count.textContent;
      var firstNew = grid.children[before];
      if (firstNew) firstNew.focus({ preventScroll: true });
    }
  }
  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      loadCollection()
        .then(function () {
          selectedFilter = button.dataset.galleryFilter;
          limit = 9;
          filters.forEach(function (filter) {
            filter.setAttribute("aria-pressed", String(filter === button));
          });
          renderGallery(false);
        })
        .catch(showError);
    });
  });
  if (more)
    more.addEventListener("click", function () {
      more.disabled = true;
      loadCollection()
        .then(function () {
          limit += 9;
          renderGallery(true);
        })
        .catch(showError)
        .finally(function () {
          more.disabled = false;
        });
    });
  function displayImage(direction) {
    var data = collection();
    var item = data[current];
    if (!item) return;
    document.getElementById("viewerTitle").textContent = item.title;
    document.getElementById("viewerCategory").textContent = item.label;
    document.getElementById("viewerNote").textContent = item.note;
    document.getElementById("viewerPosition").textContent = current + 1 + " / " + data.length;
    image.alt = item.alt;
    window.clearTimeout(swapTimer);
    var apply = function () {
      image.width = item.width;
      image.height = item.height;
      image.src = item.src;
      image.classList.remove("is-swapping");
    };
    if (!direction || motionOff() || !viewer.open) {
      apply();
      return;
    }
    image.style.setProperty("--swap", direction * -14 + "px");
    image.classList.add("is-swapping");
    swapTimer = window.setTimeout(apply, 170);
  }
  function moveImage(direction) {
    var length = collection().length;
    if (!length) return;
    current = (current + direction + length) % length;
    displayImage(direction);
  }
  if (grid && viewer) {
    grid.addEventListener("click", function (event) {
      var card = event.target.closest("[data-image-id]");
      if (!card) return;
      loadCollection()
        .then(function () {
          current = collection().findIndex(function (item) {
            return item.id === card.dataset.imageId;
          });
          if (current < 0) return;
          opener = card;
          displayImage(0);
          viewerOverflow = body.style.overflow;
          body.style.overflow = "hidden";
          body.classList.add("r-viewer-open");
          viewer.showModal();
          document.getElementById("viewerClose").focus();
        })
        .catch(showError);
    });
    document.getElementById("viewerClose").addEventListener("click", function () {
      viewer.close();
    });
    document.getElementById("viewerPrevious").addEventListener("click", function () {
      moveImage(-1);
    });
    document.getElementById("viewerNext").addEventListener("click", function () {
      moveImage(1);
    });
    viewer.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveImage(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveImage(-1);
      }
    });
    // Swipe between illustrations on touch screens.
    var touchX = null;
    viewer.addEventListener(
      "touchstart",
      function (event) {
        touchX = event.touches.length === 1 ? event.touches[0].clientX : null;
      },
      { passive: true },
    );
    viewer.addEventListener(
      "touchend",
      function (event) {
        if (touchX === null) return;
        var delta = event.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(delta) > 50) moveImage(delta < 0 ? 1 : -1);
      },
      { passive: true },
    );
    viewer.addEventListener("click", function (event) {
      if (event.target !== viewer) return;
      var rect = viewer.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        viewer.close();
    });
    viewer.addEventListener("close", function () {
      body.style.overflow = viewerOverflow;
      body.classList.remove("r-viewer-open");
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    });
    if (hasObserver) {
      var galleryObserver = new IntersectionObserver(
        function (entries) {
          if (
            !entries.some(function (entry) {
              return entry.isIntersecting;
            })
          )
            return;
          loadCollection().catch(function () {
            /* Static first-page images remain usable; clicks retry. */
          });
          galleryObserver.disconnect();
        },
        { rootMargin: "400px" },
      );
      galleryObserver.observe(grid);
    }
  }

  /* ---------- 2. start ---------- */

  applyMotion();
  startReveals();
  root.classList.add("w-go");
  scenes();
})();
