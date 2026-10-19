/* Presentation-only interactions. Pricing, pledges, payments and certificates remain canonical. */
(function () {
  "use strict";
  if (!document.body.classList.contains("wfe-redesign")) return;
  var body = document.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobile = window.matchMedia("(max-width: 950px)");
  var toggle = document.getElementById("motionToggle");
  var paused = false;
  try {
    paused = sessionStorage.getItem("wfe_motion_paused") === "true";
  } catch (error) {
    /* Motion preferences work without storage. */
  }
  var saveData = Boolean(navigator.connection && navigator.connection.saveData);
  function applyMotion() {
    var off = paused || reduced.matches || saveData;
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
    if (off)
      document.querySelectorAll(".r-waiting").forEach(function (node) {
        node.classList.remove("r-waiting");
      });
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
  applyMotion();

  var reveals = document.querySelectorAll(".r-reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove("r-waiting");
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08 },
    );
    reveals.forEach(function (node) {
      if (!body.classList.contains("r-motion-paused")) node.classList.add("r-waiting");
      observer.observe(node);
    });
    window.setTimeout(function () {
      reveals.forEach(function (node) {
        node.classList.remove("r-waiting");
      });
    }, 6500);
  }

  // A small desktop-only depth shift; the page keeps native scrolling.
  var hero = document.querySelector(".r-hero");
  var art = document.querySelector(".r-hero-art img");
  var scheduled = false;
  function depth() {
    scheduled = false;
    if (mobile.matches || body.classList.contains("r-motion-paused")) {
      art.style.transform = "";
      return;
    }
    if (hero.getBoundingClientRect().bottom < 0) return;
    var shift = Math.min(26, Math.max(0, window.scrollY * 0.045));
    art.style.transform = "translate3d(0," + shift + "px,0) scale(1.035)";
  }
  if (art && hero)
    window.addEventListener(
      "scroll",
      function () {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(depth);
      },
      { passive: true },
    );

  // Enhance the existing shared menu without replacing its click or Escape handlers.
  var menu = document.getElementById("wfeMenu");
  var menuButton = document.getElementById("wfeMenuButton");
  var main = document.querySelector("main");
  var footer = document.querySelector("footer");
  var priorOverflow = "";
  var menuWasOpen = false;
  function syncMenu() {
    var open = mobile.matches && menu.classList.contains("is-open");
    menu.inert = mobile.matches && !open;
    if (open && !menuWasOpen) {
      priorOverflow = body.style.overflow;
      body.style.overflow = "hidden";
      menu.querySelector("a").focus({ preventScroll: true });
    }
    if (!open && menuWasOpen) {
      body.style.overflow = priorOverflow;
      if (menu.contains(document.activeElement)) menuButton.focus({ preventScroll: true });
    }
    body.classList.toggle("r-menu-open", open);
    main.inert = open;
    footer.inert = open;
    menuWasOpen = open;
  }
  if (menu && menuButton) {
    new MutationObserver(syncMenu).observe(menu, { attributes: true, attributeFilter: ["class"] });
    mobile.addEventListener("change", function () {
      if (!mobile.matches) {
        menu.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "Menu +";
      }
      syncMenu();
      if (art) art.style.transform = "";
    });
    document.addEventListener("keydown", function (event) {
      if (!menuWasOpen || event.key !== "Tab") return;
      var links = Array.from(menu.querySelectorAll("a[href]"));
      var first = links[0];
      var last = menuButton;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    syncMenu();
  }

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
  function makeCard(item) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "r-gallery-card";
    card.dataset.imageId = item.id;
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
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
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
    data.slice(before, limit).forEach(function (item) {
      grid.appendChild(makeCard(item));
    });
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
  function displayImage() {
    var data = collection();
    var item = data[current];
    if (!item) return;
    document.getElementById("viewerTitle").textContent = item.title;
    document.getElementById("viewerCategory").textContent = item.label;
    document.getElementById("viewerNote").textContent = item.note;
    document.getElementById("viewerPosition").textContent = current + 1 + " / " + data.length;
    image.alt = item.alt;
    image.width = item.width;
    image.height = item.height;
    image.src = item.src;
  }
  function moveImage(direction) {
    var length = collection().length;
    if (!length) return;
    current = (current + direction + length) % length;
    displayImage();
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
          displayImage();
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
    if ("IntersectionObserver" in window) {
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
})();
