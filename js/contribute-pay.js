/* ==========================================================================
   Pamodzi — contribution page: "How to pay"
   --------------------------------------------------------------------------
   Progressive enhancement for the static payment methods in #pay. Without
   JavaScript every method is visible. With it, the method for the supporter's
   country comes first, the others sit behind one button, each number gets a
   copy button, and the pledge amount is repeated above the details.
   Reads the country from the pricing script and the amount from the summary;
   it never changes either, and records no values.
   ========================================================================== */
(function () {
  "use strict";

  var host = document.querySelector("[data-pay-methods]");
  if (!host) return;

  var methods = Array.prototype.slice.call(host.querySelectorAll("[data-pay-for]"));
  var toggle = document.querySelector("[data-pay-toggle]");
  var amountBox = document.querySelector("[data-pay-amount]");
  var summary = document.getElementById("summaryAmount");
  var region = "UG";
  var showAll = false;

  function regionFor(code) {
    return code === "UG" || code === "KE" ? code : "INT";
  }

  function render() {
    methods.forEach(function (method) {
      method.hidden = !showAll && method.getAttribute("data-pay-for") !== region;
    });
    if (toggle) {
      toggle.hidden = false;
      toggle.setAttribute("aria-expanded", showAll ? "true" : "false");
      toggle.textContent = showAll ? "Show only my country" : "Show all ways to pay";
    }
  }

  function pressedCountry() {
    var pressed = document.querySelector("[data-country-featured][aria-pressed='true']");
    return pressed ? pressed.getAttribute("data-country-featured") : "UG";
  }

  function setRegion(code) {
    var next = regionFor(code || "UG");
    if (next === region && methods.length) return render();
    region = next;
    render();
  }

  function syncAmount() {
    if (!amountBox || !summary) return;
    var text = (summary.textContent || "").trim();
    var ready = text && text !== "—";
    amountBox.hidden = !ready;
    var strong = amountBox.querySelector("strong");
    if (strong) strong.textContent = ready ? text : "";
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).then(
        function () {
          return true;
        },
        function () {
          return false;
        },
      );
    }
    return new Promise(function (resolve) {
      var area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok;
      try {
        ok = document.execCommand("copy");
      } catch (error) {
        ok = false;
      }
      document.body.removeChild(area);
      resolve(ok);
    });
  }

  function addCopyButtons() {
    host.querySelectorAll("dd[data-copy]").forEach(function (cell) {
      var label = cell.parentNode.querySelector("dt");
      var button = document.createElement("button");
      button.type = "button";
      button.className = "pay-copy";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy " + (label ? label.textContent : "number"));
      button.addEventListener("click", function () {
        copyText(cell.getAttribute("data-copy")).then(function (copied) {
          button.textContent = copied ? "Copied ✓" : "Select and copy";
          window.setTimeout(function () {
            button.textContent = "Copy";
          }, 2200);
          if (copied) {
            window.dispatchEvent(new CustomEvent("pci:engagement", { detail: { name: "payment_number_copied" } }));
          }
        });
      });
      cell.appendChild(button);
    });
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      showAll = !showAll;
      render();
    });
  }

  document.addEventListener("steppricing:change", function (event) {
    setRegion(event && event.detail && event.detail.code);
  });

  if (summary && window.MutationObserver) {
    new MutationObserver(syncAmount).observe(summary, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  addCopyButtons();
  setRegion(pressedCountry());
  syncAmount();
})();

/* ==========================================================================
   Contribution page — hero quick picks, journey progress and the sticky bar
   Everything here only clicks, scrolls or reads what the pledge form already
   shows. No value leaves the page.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var form = document.getElementById("contributionForm");
  if (!form) return;

  function scrollTo(target) {
    if (target && target.scrollIntoView)
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  document.querySelectorAll("[data-hero-steps]").forEach(function (button) {
    button.addEventListener("click", function () {
      var preset = document.querySelector(
        '.amount-options [data-steps="' + button.getAttribute("data-hero-steps") + '"]',
      );
      if (preset) preset.click();
      scrollTo(document.getElementById("give"));
    });
  });

  var steps = document.querySelectorAll(".collection-progress-steps li");
  var saved = document.getElementById("pledgeSavedPanel");
  function syncJourney() {
    var done = saved && !saved.hidden;
    steps.forEach(function (item, index) {
      item.classList.toggle("is-done", done ? index < 2 : index < 1);
    });
  }
  if (saved && window.MutationObserver) {
    new MutationObserver(syncJourney).observe(saved, { attributes: true, attributeFilter: ["hidden"] });
  }
  syncJourney();

  var bar = document.querySelector("[data-sticky]");
  var amount = document.getElementById("summaryAmount");
  var count = document.getElementById("summarySteps");
  var hero = document.querySelector(".cx-hero");
  var card = document.querySelector(".pledge-form-card");
  if (!bar || !hero || !card || !("IntersectionObserver" in window)) return;

  var heroSeen = true;
  var cardSeen = false;
  var footerSeen = false;
  var footer = document.querySelector("footer");
  function paintBar() {
    var show = !heroSeen && !cardSeen && !footerSeen && !(saved && !saved.hidden);
    bar.hidden = false;
    bar.classList.toggle("is-visible", show);
  }
  function syncBarText() {
    var value = amount ? (amount.textContent || "").trim() : "";
    var target = bar.querySelector("[data-sticky-amount]");
    var label = bar.querySelector("[data-sticky-steps]");
    if (target) target.textContent = value || "—";
    if (label) label.textContent = count ? (count.textContent || "").trim() : "";
  }
  new IntersectionObserver(function (entries) {
    heroSeen = entries[0].isIntersecting;
    paintBar();
  }).observe(hero);
  new IntersectionObserver(
    function (entries) {
      cardSeen = entries[0].isIntersecting;
      paintBar();
    },
    { threshold: 0.12 },
  ).observe(card);
  // Step aside at the footer so its links stay reachable.
  if (footer) {
    new IntersectionObserver(function (entries) {
      footerSeen = entries[0].isIntersecting;
      paintBar();
    }).observe(footer);
  }
  [amount, count].forEach(function (node) {
    if (node && window.MutationObserver) {
      new MutationObserver(syncBarText).observe(node, { childList: true, characterData: true, subtree: true });
    }
  });
  syncBarText();
})();

/* ==========================================================================
   Contribution journey — presentation and next steps
   Shared by the pledge form and the pledge record. Motion follows the device
   setting; the five-friend invitation only builds a share link from the page
   address and never reads or sends the supporter's details.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector("[data-header]");

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Scroll reveals, as on the campaign page.
  var pending = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  pending.forEach(function (node) {
    var kind = node.getAttribute("data-reveal");
    var parts = kind === "lines" ? node.querySelectorAll(".w-line") : kind === "stagger" ? node.children : [];
    Array.prototype.forEach.call(parts, function (part, index) {
      part.style.setProperty("--i", index);
    });
  });
  if (!reduced && "IntersectionObserver" in window && pending.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    root.classList.add("w-reveal-ready");
    pending.forEach(function (node) {
      observer.observe(node);
    });
    // A masked figure is fully clipped before it reveals, so the observer can miss it: check positions on scroll too.
    var queued = false;
    var revealPassed = function () {
      queued = false;
      pending = pending.filter(function (node) {
        if (node.classList.contains("is-in")) return false;
        if (node.getBoundingClientRect().top > window.innerHeight * 0.92) return true;
        node.classList.add("is-in");
        observer.unobserve(node);
        return false;
      });
      if (!pending.length) window.removeEventListener("scroll", onRevealScroll);
    };
    var onRevealScroll = function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(revealPassed);
    };
    window.addEventListener("scroll", onRevealScroll, { passive: true });
  } else {
    pending.forEach(function (node) {
      node.classList.add("is-in");
    });
  }
  root.classList.add("w-go");

  // A preselected amount opens straight on the form, so the intro stays short.
  try {
    if (new URLSearchParams(window.location.search).get("steps")) root.classList.add("has-preset");
  } catch (error) {
    /* Optional. */
  }

  // The total gives a small sign each time it changes.
  var total = document.getElementById("summaryAmount");
  var box = total && total.closest(".w-total");
  if (box && window.MutationObserver) {
    var last = total.textContent;
    new MutationObserver(function () {
      if (total.textContent === last) return;
      last = total.textContent;
      if (reduced || root.classList.contains("pledge-pending")) return;
      box.classList.remove("is-bump");
      void box.offsetWidth;
      box.classList.add("is-bump");
    }).observe(total, { childList: true, characterData: true, subtree: true });
  }

  // Invite five friends: the campaign link, carrying the ambassador referral this visit arrived with.
  var invite = document.querySelector("[data-invite-five]");
  if (invite) {
    var script = document.querySelector('script[src*="contribute-pay.js"]');
    var campaign = new URL("../walk-for-education/", script ? script.src : location.href);
    try {
      var ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) campaign.searchParams.set("ref", ref);
    } catch (error) {
      /* Optional. */
    }
    var text =
      "I have pledged steps for Walk for Education 2026, supporting UCU–Kagando University College and Kagando Nursery & Primary School. " +
      "Five steps is a good start. Join me: " +
      campaign.href;
    invite.href = "https://wa.me/?text=" + encodeURIComponent(text);
  }

  // A saved pledge opens at its top, so the WhatsApp step is the first thing in view.
  var savedPanel = document.getElementById("pledgeSavedPanel");
  if (savedPanel && window.MutationObserver) {
    new MutationObserver(function () {
      if (savedPanel.hidden) return;
      window.requestAnimationFrame(function () {
        savedPanel.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      });
    }).observe(savedPanel, { attributes: true, attributeFilter: ["hidden"] });
  }

  // On the pledge record, the payment reminder appears with the other next steps.
  var reminder = document.querySelector("[data-pay-reminder]");
  var community = document.getElementById("pledgeCommunityInvite");
  if (reminder && community && window.MutationObserver) {
    var sync = function () {
      reminder.hidden = community.hidden;
    };
    new MutationObserver(sync).observe(community, { attributes: true, attributeFilter: ["hidden"] });
    sync();
  }
})();
