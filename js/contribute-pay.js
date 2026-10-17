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
