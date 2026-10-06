/* Walk for Education — Partnerships page.
   Keeps the Builder level, partnership route and education priority cards in
   step with the enquiry form, reads ?builder= / ?priority= / ?route= links, and
   shows a removable summary of what the enquiry will include. Email drafting
   and validation stay in wfe.js. */
(function () {
  "use strict";

  var form = document.querySelector(".wfp-form");
  if (!form) return;

  var selects = {
    builder: form.querySelector("[name='builder']"),
    priority: form.querySelector("[name='priority']"),
    route: form.querySelector("[name='route']"),
  };
  var cards = {
    builder: Array.prototype.slice.call(document.querySelectorAll("[data-wfp-builder]")),
    priority: Array.prototype.slice.call(document.querySelectorAll("[data-wfp-priority]")),
    route: Array.prototype.slice.call(document.querySelectorAll("[data-wfp-route]")),
  };
  var labels = { route: "Route", priority: "Priority", builder: "Level" };
  var target = document.getElementById("request-pack");
  var selection = document.getElementById("wfpSelection");
  var chips = document.getElementById("wfpChips");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var routeChosen = false;

  function hasOption(select, value) {
    return (
      !!select &&
      Array.prototype.some.call(select.options, function (option) {
        return option.value === value;
      })
    );
  }

  function choose(kind, value) {
    var select = selects[kind];
    if (!hasOption(select, value)) return false;
    select.value = value;
    if (kind === "route") routeChosen = true;
    return true;
  }

  function cardValue(kind, card) {
    return card.getAttribute("data-wfp-" + kind);
  }

  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams(window.location.search);
    ["builder", "priority"].forEach(function (kind) {
      if (selects[kind] && selects[kind].value) params.set(kind, selects[kind].value);
      else params.delete(kind);
    });
    var query = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (query ? "?" + query : "") + window.location.hash);
  }

  function chip(kind) {
    var select = selects[kind];
    var item = document.createElement("li");
    var text = document.createElement("span");
    var label = document.createElement("small");
    label.textContent = labels[kind] + ":";
    text.appendChild(label);
    text.appendChild(document.createTextNode(" " + select.options[select.selectedIndex].text));
    item.appendChild(text);
    if (kind !== "route") {
      var remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute(
        "aria-label",
        "Remove " + labels[kind].toLowerCase() + " " + select.options[select.selectedIndex].text,
      );
      remove.addEventListener("click", function () {
        select.value = "";
        render();
        syncUrl();
        select.focus();
      });
      item.appendChild(remove);
    }
    return item;
  }

  function render() {
    Object.keys(cards).forEach(function (kind) {
      var current = selects[kind] ? selects[kind].value : "";
      cards[kind].forEach(function (card) {
        var active = (kind !== "route" || routeChosen) && current !== "" && cardValue(kind, card) === current;
        if (active) card.setAttribute("aria-current", "true");
        else card.removeAttribute("aria-current");
      });
    });

    if (!chips || !selection) return;
    chips.textContent = "";
    if (routeChosen) chips.appendChild(chip("route"));
    if (selects.priority && selects.priority.value) chips.appendChild(chip("priority"));
    if (selects.builder && selects.builder.value) chips.appendChild(chip("builder"));
    selection.hidden = !chips.children.length;
  }

  function goToForm() {
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    var first = form.querySelector("[name='name']");
    if (first && !first.value) first.focus({ preventScroll: true });
    if (window.history && window.history.replaceState && window.location.hash !== "#request-pack") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search + "#request-pack");
    }
  }

  Object.keys(cards).forEach(function (kind) {
    cards[kind].forEach(function (card) {
      card.addEventListener("click", function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button > 0) return;
        if (!choose(kind, cardValue(kind, card))) return;
        event.preventDefault();
        render();
        syncUrl();
        goToForm();
      });
    });
  });

  Object.keys(selects).forEach(function (kind) {
    if (!selects[kind]) return;
    selects[kind].addEventListener("change", function () {
      if (kind === "route") routeChosen = true;
      render();
      syncUrl();
    });
  });

  var params = new URLSearchParams(window.location.search);
  ["builder", "priority", "route"].forEach(function (kind) {
    var requested = params.get(kind);
    if (requested) choose(kind, requested);
  });
  render();
})();
