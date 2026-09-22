/* Walk for Education — shared rendering, interaction and enquiry routing. */
(function () {
  "use strict";

  var campaign = window.WFE_CAMPAIGN || {};

  function all(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function formatNumber(value) {
    if (typeof value !== "number") return "Pending verification";
    return new Intl.NumberFormat("en-UG").format(value);
  }

  function formatTarget(value) {
    if (typeof value !== "number") return "Pending verification";
    if (value === 25000000000) return "UGX 25B";
    return "UGX " + formatNumber(value);
  }

  function fieldValue(key) {
    switch (key) {
      case "name": return campaign.name;
      case "statusLabel": return campaign.statusLabel;
      case "distance": return formatNumber(campaign.distanceKm) + " km";
      case "distanceNumber": return formatNumber(campaign.distanceKm);
      case "target": return formatTarget(campaign.fiveYearTargetUgx);
      case "currentStudents": return formatNumber(campaign.currentStudents);
      case "studentProjection": return formatNumber(campaign.projectedStudentsMin) + "–" + formatNumber(campaign.projectedStudentsMax);
      case "startLocation": return campaign.startLocation;
      case "endLocation": return campaign.endLocation;
      case "routeStatus": return campaign.routeStatus;
      case "paymentVerificationNote": return campaign.paymentVerificationNote;
      case "reportingState": return campaign.publicReportingState;
      case "reviewedDate": return campaign.dataLastReviewed ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(campaign.dataLastReviewed + "T12:00:00Z")) : "Pending";
      case "whatsapp": return campaign.contact && campaign.contact.whatsappDisplay;
      case "email": return campaign.contact && campaign.contact.email;
      default: return "";
    }
  }

  function renderCampaignFields() {
    all("[data-campaign-field]").forEach(function (node) {
      var value = fieldValue(node.getAttribute("data-campaign-field"));
      if (value !== undefined && value !== null && value !== "") node.textContent = value;
    });

    all("[data-wfe-email]").forEach(function (link) {
      if (campaign.contact && campaign.contact.email) link.href = "mailto:" + campaign.contact.email;
    });

    all("[data-wfe-whatsapp]").forEach(function (link) {
      if (campaign.contact && campaign.contact.whatsappUrl) link.href = campaign.contact.whatsappUrl;
    });

    var paymentState = document.querySelector("[data-payment-state]");
    if (paymentState && campaign.paymentChannels && campaign.paymentChannels.length) {
      paymentState.textContent = "Current approved channels available";
      paymentState.classList.add("verified");
    }
  }

  function prepareTabs() {
    var tabs = all("[data-audience-tab]");
    if (!tabs.length) return;

    function activate(id, focus) {
      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-audience-tab") === id;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.setAttribute("tabindex", active ? "0" : "-1");
        if (active && focus) tab.focus();
      });
      all("[data-audience-panel]").forEach(function (panel) {
        var active = panel.getAttribute("data-audience-panel") === id;
        panel.hidden = !active;
      });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#" + id);
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activate(tab.getAttribute("data-audience-tab"), false);
      });
      tab.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        var direction = event.key === "ArrowRight" ? 1 : -1;
        var next = (index + direction + tabs.length) % tabs.length;
        activate(tabs[next].getAttribute("data-audience-tab"), true);
      });
    });

    var requested = window.location.hash.replace("#", "");
    var valid = tabs.some(function (tab) { return tab.getAttribute("data-audience-tab") === requested; });
    activate(valid ? requested : tabs[0].getAttribute("data-audience-tab"), false);
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  function prepareEnquiries() {
    all(".wfe-enquiry-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var name = form.querySelector("[name='name']");
        var contact = form.querySelector("[name='contact']");
        if (!name || !name.value.trim() || !contact || !contact.value.trim()) {
          showToast("Add your name and contact so the team can respond");
          (name && !name.value.trim() ? name : contact).focus();
          return;
        }
        var route = form.querySelector("[name='route']");
        var organisation = form.querySelector("[name='organisation']");
        var message = form.querySelector("[name='message']");
        var subject = "Walk for Education enquiry — " + (route ? route.value : "Campaign");
        var body = [
          "Name: " + name.value.trim(),
          "Contact: " + contact.value.trim(),
          organisation && organisation.value.trim() ? "Organisation / club: " + organisation.value.trim() : "",
          "Participation route: " + (route ? route.value : "Campaign enquiry"),
          "",
          message && message.value.trim() ? message.value.trim() : "Please send me the current approved details."
        ].filter(Boolean).join("\n");
        window.location.href = "mailto:" + campaign.contact.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        showToast("Opening your email app…");
        track("partnership_enquiry_open", { route: route ? route.value : "campaign" });
      });
    });
  }

  function track(name, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name, campaign_id: campaign.campaignId }, detail || {}));
  }

  function prepareAnalytics() {
    all("[data-analytics]").forEach(function (item) {
      item.addEventListener("click", function () {
        track(item.getAttribute("data-analytics"), { label: (item.textContent || "").trim() });
      });
    });
  }

  function prepareShare() {
    all("[data-share-campaign]").forEach(function (button) {
      button.addEventListener("click", function () {
        var url = "https://pamodzici.com/walk-for-education/";
        var text = "Walk for Education Campaign 2026 — Every Step Builds a Future.";
        if (navigator.share) {
          navigator.share({ title: text, text: text, url: url }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () { showToast("Campaign link copied"); });
        }
        track("campaign_share");
      });
    });
  }

  function ready() {
    renderCampaignFields();
    prepareTabs();
    prepareEnquiries();
    prepareAnalytics();
    prepareShare();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
