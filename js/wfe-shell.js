/* ==========================================================================
   Walk for Education — campaign shell
   --------------------------------------------------------------------------
   Loaded (deferred) on every page under /walk-for-education/, before
   wfe-data.js, the live record (api/campaign.php) and wfe.js.

   Owns the behaviour every campaign page shares:
     1. Ambassador attribution (?ref=) carried into contribution links
     2. Step chooser on the campaign home: the visitor's country sets the currency and the price of a
        step (js/step-pricing.js; Uganda UGX 5,000, Kenya KSh 200 …), 5–20,000 steps
     3. Checkout availability and reconciled digital totals from the payment service
     4. Mobile menu
     5. Scroll reveals (started as the global preloader exits)
     6. Sticky contribution shortcut and scroll progress line
     7. Share button and enquiry-route links
   ========================================================================== */
(function () {
  "use strict";

  var SITE_ROOT = new URL("../", document.currentScript.src);
  var MIN_STEPS = 5;
  var MAX_STEPS = 20000;

  var byId = function (id) {
    return document.getElementById(id);
  };
  var all = function (selector) {
    return document.querySelectorAll(selector);
  };
  var formatUGX = function (amount) {
    return "UGX " + new Intl.NumberFormat("en-UG").format(amount);
  };
  // Without the shared pricing script the page behaves exactly as before: Uganda, UGX 5,000 per step.
  var pricing = window.StepPricing || null;
  var price = function () {
    return pricing ? pricing.current() : { code: "UG", currency: "UGX", step: 5000, label: "UGX" };
  };
  var formatMoney = function (amount) {
    return pricing ? pricing.format(amount, price().currency) : formatUGX(amount);
  };
  var stepsLabel = function (steps) {
    return steps + (steps === 1 ? " step" : " steps");
  };

  /* ---------- 1. Attribution ---------- */

  var params = new URLSearchParams(window.location.search);
  var ref = "";
  var stepInput = byId("campaignSteps");
  var contributeLink = byId("campaignContribute");

  try {
    ref = (params.get("ref") || sessionStorage.getItem("wfe_ref") || "")
      .trim()
      .slice(0, 40)
      .replace(/[^\w\- .']/g, "");
    if (ref) sessionStorage.setItem("wfe_ref", ref);

    if (stepInput) {
      var requested = params.get("steps") || sessionStorage.getItem("wfe_steps");
      var requestedSteps = Number(requested);
      if (requested && Number.isInteger(requestedSteps) && requestedSteps >= 1 && requestedSteps <= MAX_STEPS) {
        stepInput.value = Math.max(MIN_STEPS, requestedSteps);
      }
    }
  } catch (error) {
    /* Attribution and remembering a choice are optional. */
  }

  all("[data-pci-contribute]").forEach(function (link) {
    if (!ref) return;
    var url = new URL(link.href);
    url.searchParams.set("ref", ref);
    link.href = url.href;
  });

  /* ---------- 2. Step chooser ---------- */

  var checkoutOpen = null; // true / false once the payment service answers
  var pledgesOpen = null;
  var paymentCurrencies = ["UGX"]; // currencies the payment gateway can take; others are pledges

  function payableHere() {
    return checkoutOpen === true && paymentCurrencies.indexOf(price().currency) !== -1;
  }

  /* The explanatory line under the button depends on the service state and on the chosen currency. */
  var serviceState = null;
  function renderStatus() {
    var status = byId("campaignCheckoutStatus");
    if (!status || !serviceState) return;
    var label = price().label;
    if (serviceState.checkoutOpen && !payableHere())
      status.textContent =
        "Online payment in " +
        label +
        " is not open yet. Pledge your steps now: no money is collected and the team will send you payment details.";
    else if (serviceState.checkoutOpen)
      status.textContent = serviceState.sandbox
        ? "Test checkout only. Sandbox payments do not receive a contribution certificate."
        : "Secure payment through Pesapal. Your receipt and certificate unlock after verification.";
    else if (serviceState.pledgesOpen)
      status.textContent =
        "Online payments are being prepared. Pledge your steps now; no money is collected. Certificates follow verified payment.";
    else status.textContent = "The contribution service is being prepared. Contact the campaign team for assistance.";
  }

  function renderChooser() {
    if (!stepInput || !contributeLink) return;

    var steps = Number(stepInput.value);
    var valid = Number.isInteger(steps) && steps >= MIN_STEPS && steps <= MAX_STEPS;
    var error = byId("campaignValidation");
    var here = price();

    error.hidden = valid;
    error.textContent = valid
      ? ""
      : "Choose 5 to 20,000 whole steps. Minimum contribution: " + formatMoney(MIN_STEPS * here.step) + ".";
    stepInput.setAttribute("aria-invalid", String(!valid));

    if (!valid) {
      contributeLink.setAttribute("aria-disabled", "true");
      byId("campaignTotal").textContent = "—";
      byId("campaignStepSummary").textContent = "Choose valid steps";
      return;
    }

    contributeLink.removeAttribute("aria-disabled");
    byId("campaignTotal").textContent = formatMoney(steps * here.step);
    byId("campaignStepSummary").textContent = stepsLabel(steps);

    var verb = payableHere()
      ? "Contribute "
      : (checkoutOpen === false || checkoutOpen === true) && pledgesOpen
        ? "Pledge "
        : "Continue with ";
    byId("campaignAction").textContent = verb + stepsLabel(steps);

    all("[data-step-option]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.stepOption) === steps));
    });
    all("[data-step-adjust]").forEach(function (button) {
      button.disabled = Number(button.dataset.stepAdjust) < 0 ? steps === MIN_STEPS : steps === MAX_STEPS;
    });

    var next = new URL("contribute/", SITE_ROOT);
    next.searchParams.set("steps", steps);
    next.searchParams.set("country", here.code);
    if (ref) next.searchParams.set("ref", ref);
    contributeLink.href = next.href;

    try {
      sessionStorage.setItem("wfe_steps", String(steps));
    } catch (error) {
      /* optional */
    }
  }

  if (stepInput && contributeLink) {
    stepInput.addEventListener("input", renderChooser);

    all("[data-step-option]").forEach(function (button) {
      button.addEventListener("click", function () {
        stepInput.value = button.dataset.stepOption;
        renderChooser();
      });
    });

    all("[data-step-adjust]").forEach(function (button) {
      button.addEventListener("click", function () {
        var current = Number.isInteger(Number(stepInput.value)) ? Number(stepInput.value) : MIN_STEPS;
        stepInput.value = Math.max(MIN_STEPS, Math.min(MAX_STEPS, current + Number(button.dataset.stepAdjust)));
        renderChooser();
      });
    });

    var customButton = byId("campaignCustom");
    if (customButton) {
      customButton.addEventListener("click", function () {
        stepInput.focus();
        stepInput.select();
      });
    }

    contributeLink.addEventListener("click", function (event) {
      if (contributeLink.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
        stepInput.focus();
      }
    });

    renderChooser();
  }

  /* The first question: where is the visitor giving from? It sets the currency and the price of a step. */
  var countrySelect = byId("campaignCountry");
  if (pricing) {
    document.addEventListener("steppricing:change", function () {
      if (countrySelect) countrySelect.value = price().code;
      pricing.bind(document);
      renderChooser();
      renderStatus();
    });
    if (countrySelect) {
      countrySelect.addEventListener("change", function () {
        pricing.select(countrySelect.value);
      });
    }
    pricing.bind(document);
    pricing.ready.then(function () {
      if (countrySelect) pricing.fillSelect(countrySelect);
      pricing.bind(document);
      renderChooser();
      renderStatus();
    });
  }

  /* ---------- 3. Payment service: availability and reconciled totals ---------- */

  function getJSON(action) {
    return fetch(new URL("api/payments/index.php?action=" + action, SITE_ROOT), { cache: "no-store" }).then(
      function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      },
    );
  }

  function setBriefs(text) {
    all("[data-checkout-brief]").forEach(function (element) {
      element.textContent = text;
    });
  }

  getJSON("status")
    .then(function (data) {
      checkoutOpen = data.checkoutEnabled === true;
      pledgesOpen = data.pledgesEnabled === true;
      if (Array.isArray(data.paymentCurrencies) && data.paymentCurrencies.length)
        paymentCurrencies = data.paymentCurrencies;
      var sandbox = data.environment === "sandbox";

      setBriefs(
        checkoutOpen
          ? sandbox
            ? "Test checkout only · live payments are not open"
            : "Online checkout is open · payment handled by Pesapal"
          : pledgesOpen
            ? "Pledges are open · online payments are being prepared"
            : "Contribution assistance is available from the campaign team",
      );

      serviceState = { checkoutOpen: checkoutOpen, pledgesOpen: pledgesOpen, sandbox: sandbox };
      renderStatus();
      renderChooser();
    })
    .catch(function () {
      var status = byId("campaignCheckoutStatus");
      if (status) {
        status.textContent =
          "Payment availability is checked on the contribution page. Contact the campaign team if you need assistance.";
      }
      setBriefs("Payment availability is checked on the contribution page.");
    });

  var verifiedProgress = byId("wfeVerifiedProgress");
  if (verifiedProgress) {
    getJSON("progress")
      .then(function (data) {
        var reconciled = new Date(data.lastReconciledAt);
        if (
          typeof data.received !== "number" ||
          data.received <= 0 ||
          !data.lastReconciledAt ||
          isNaN(reconciled.getTime())
        )
          return;
        byId("wfeDigitalTotal").textContent = formatUGX(data.received);
        byId("wfeDigitalDate").textContent = "Reconciled " + reconciled.toLocaleDateString("en-GB");
        verifiedProgress.hidden = false;
        all("[data-digital-empty]").forEach(function (element) {
          element.hidden = true;
        });
      })
      .catch(function () {
        /* Unavailable totals remain unpublished. */
      });
  }

  /* ---------- 4. Mobile menu ---------- */

  var menu = byId("wfeMenu");
  var menuButton = byId("wfeMenuButton");

  function setMenu(open, returnFocus) {
    var wasOpen = menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.textContent = open ? "Close −" : "Menu +";
    if (!open && wasOpen && returnFocus) menuButton.focus();
  }

  if (menu && menuButton) {
    menuButton.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"), false);
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenu(false, false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false, true);
    });
    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) setMenu(false, false);
    });
  }

  /* ---------- 5. Scroll reveals ---------- */

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reveals = all(".wfe-reveal");

  function revealAll() {
    reveals.forEach(function (element) {
      element.classList.remove("waiting");
      element.classList.add("is-in");
    });
  }

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    document.body.classList.add("wfe-motion");
    reveals.forEach(function (element) {
      element.classList.add("waiting");
    });

    var startReveals = function () {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            entry.target.classList.remove("waiting");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.05 },
      );
      reveals.forEach(function (element) {
        observer.observe(element);
      });
    };

    // Sections already on screen play their entrance as the preloader exits.
    if (window.PamodziPreloader) window.PamodziPreloader.whenDone(startReveals);
    else startReveals();
    window.setTimeout(revealAll, 8000); // never leave content hidden
  }

  if (reducedMotion.addEventListener) {
    reducedMotion.addEventListener("change", function () {
      if (reducedMotion.matches) revealAll();
    });
  }

  /* ---------- 6. Sticky shortcut and scroll progress ---------- */

  var sticky = byId("wfeSticky");
  var scrollLine = byId("wfeScrollLine");
  var frameRequested = false;

  function inView(element) {
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  function onScroll() {
    frameRequested = false;
    var distance = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollLine) {
      scrollLine.style.transform = "scaleX(" + Math.max(0, Math.min(1, distance ? window.scrollY / distance : 0)) + ")";
    }
    if (!sticky) return;

    var finalCall = document.querySelector(".wfe-final");
    var typing = document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    var visible =
      window.scrollY > 450 &&
      !inView(byId("choose-steps")) &&
      !inView(document.querySelector(".wfe-enquiry-form")) &&
      (!finalCall || finalCall.getBoundingClientRect().top > window.innerHeight * 0.8) &&
      !typing;

    sticky.classList.toggle("is-visible", visible);
    sticky.inert = !visible;
    sticky.setAttribute("aria-hidden", String(!visible));
  }

  window.addEventListener(
    "scroll",
    function () {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(onScroll);
    },
    { passive: true },
  );
  window.addEventListener("resize", onScroll);
  document.addEventListener("focusin", onScroll);
  document.addEventListener("focusout", function () {
    window.requestAnimationFrame(onScroll);
  });
  onScroll();

  /* ---------- 7. Share and enquiry routes ---------- */

  var shareButton = byId("wfeShare");
  if (shareButton) {
    shareButton.addEventListener("click", function () {
      var url = new URL("walk-for-education/", SITE_ROOT);
      if (ref) url.searchParams.set("ref", ref);
      var feedback = byId("wfeShareFeedback");

      var shared = navigator.share
        ? navigator.share({
            title: "Walk for Education",
            text: "Every step builds a future. " + formatMoney(price().step) + " per sponsored step.",
            url: url.href,
          })
        : navigator.clipboard
          ? navigator.clipboard.writeText(url.href).then(function () {
              feedback.textContent = "Campaign link copied. Thank you for sharing the mission.";
            })
          : Promise.resolve().then(function () {
              feedback.textContent = url.href;
            });

      shared.catch(function (error) {
        if (error.name !== "AbortError") feedback.textContent = url.href;
      });
    });
  }

  all("[data-enquiry-route]").forEach(function (link) {
    link.addEventListener("click", function () {
      var select = document.querySelector('.wfe-enquiry-form [name="route"]');
      var route = link.dataset.enquiryRoute;
      if (
        select &&
        Array.prototype.some.call(select.options, function (option) {
          return option.value === route;
        })
      ) {
        select.value = route;
      }
    });
  });
})();
