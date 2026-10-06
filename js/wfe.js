/* Walk for Education — rendering, live campaign record, attribution and enquiry routing.
   Every component that shows money, dates, channels or field notes stays hidden until
   the matching field holds a verified value (bundled js/wfe-data.js, optionally
   overridden by the admin-published api/campaign.php record). */
(function () {
  "use strict";

  var LIVE_KEYS = [
    "status", "statusLabel", "campaignStartDate", "campaignEndDate", "routeStatus",
    "distanceCoveredKm", "routeStages", "contributionUnitLabel",
    "paymentChannels", "paymentVerificationNote", "receivedTotal", "pledgedTotal",
    "lastReconciledAt", "publicReportingState", "updates", "confirmedPartners"
  ];
  var ARRAY_KEYS = ["routeStages", "paymentChannels", "updates", "confirmedPartners"];
  var CAMPAIGN_URL = "https://pamodzici.com/walk-for-education/";

  var scriptSrc = (document.currentScript && document.currentScript.src) || "";
  var siteRoot = scriptSrc ? scriptSrc.replace(/js\/wfe\.js(\?.*)?$/, "") : "/";
  var campaign = Object.assign({}, window.WFE_CAMPAIGN || {}, sanitizeLive(window.WFE_LIVE));
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ref = captureRef();

  /* ---------- helpers ---------- */

  function sanitizeLive(live) {
    var clean = {};
    if (!live || typeof live !== "object" || Array.isArray(live)) return clean;
    LIVE_KEYS.forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(live, key)) return;
      var value = live[key];
      if (ARRAY_KEYS.indexOf(key) !== -1 && !Array.isArray(value)) return;
      clean[key] = value;
    });
    return clean;
  }

  function all(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function has(value) {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function formatNumber(value) {
    if (typeof value !== "number") return "Pending verification";
    return new Intl.NumberFormat("en-UG").format(value);
  }

  function formatUGX(value) {
    return "UGX " + formatNumber(value);
  }

  function formatTarget(value) {
    if (typeof value !== "number") return "Pending verification";
    if (value === 25000000000) return "UGX 25B";
    return formatUGX(value);
  }

  function parseDay(iso) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var date = new Date(iso + "T12:00:00Z");
    return isNaN(date.getTime()) ? null : date;
  }

  function formatDate(iso, short) {
    var date = typeof iso === "string" && iso.length > 10 ? new Date(iso) : parseDay(iso);
    if (!date || isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: short ? "short" : "long", year: "numeric" }).format(date);
  }

  function daysUntil(iso) {
    var date = parseDay(iso);
    if (!date) return null;
    var now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    return Math.round((date.getTime() - today) / 86400000);
  }

  function captureRef() {
    var value = null;
    try { value = new URLSearchParams(window.location.search).get("ref"); } catch (error) { value = null; }
    if (value) {
      value = value.trim().slice(0, 40).replace(/[^\w\- .']/g, "");
      try { window.sessionStorage.setItem("wfe_ref", value); } catch (error) { /* storage unavailable */ }
    } else {
      try { value = window.sessionStorage.getItem("wfe_ref"); } catch (error) { value = null; }
    }
    return value || null;
  }

  function campaignUrl() {
    return CAMPAIGN_URL + (ref ? "?ref=" + encodeURIComponent(ref) : "");
  }

  function whatsappUrl(text) {
    var base = (campaign.contact && campaign.contact.whatsappUrl) || "https://wa.me/256708735878";
    return base + "?text=" + encodeURIComponent(text);
  }

  function withRef(lines) {
    if (ref) lines.push("Referred by: " + ref);
    return lines.join("\n");
  }

  function track(name, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name, campaign_id: campaign.campaignId, ref: ref || undefined }, detail || {}));
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.classList.remove("show"); }, 2800);
  }

  function copyText(text, message) {
    function fallback() {
      var area = el("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); } catch (error) { /* nothing else to try */ }
      document.body.removeChild(area);
      showToast(message);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { showToast(message); }, fallback);
    } else {
      fallback();
    }
  }

  function confirmButton(button, label) {
    var original = button.getAttribute("data-label") || button.textContent;
    button.setAttribute("data-label", original);
    button.textContent = label;
    button.classList.add("is-done");
    window.setTimeout(function () {
      button.textContent = original;
      button.classList.remove("is-done");
    }, 2200);
  }

  function assetUrl(path) {
    if (typeof path !== "string" || !path) return "";
    if (/^https:\/\//.test(path)) return path;
    if (/^assets\/[\w\/\-.]+$/.test(path)) return siteRoot + path;
    return "";
  }

  function whenVisible(node, callback) {
    if (reduceQuery.matches || !("IntersectionObserver" in window)) { callback(); return; }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        callback();
      });
    }, { threshold: 0.35 });
    observer.observe(node);
  }

  /* ---------- fields & visibility ---------- */

  function fieldValue(key) {
    var channels = campaign.paymentChannels || [];
    switch (key) {
      case "name": return campaign.name;
      case "statusLabel": return campaign.statusLabel;
      case "distance": return formatNumber(campaign.distanceKm) + " km";
      case "distanceNumber": return formatNumber(campaign.distanceKm);
      case "target": return formatTarget(campaign.fiveYearTargetUgx);
      case "targetLong": return campaign.fiveYearTargetUgx === 25000000000 ? "UGX 25 billion" : formatUGX(campaign.fiveYearTargetUgx);
      case "currentStudents": return formatNumber(campaign.currentStudents);
      case "studentProjection": return formatNumber(campaign.projectedStudentsMin) + "–" + formatNumber(campaign.projectedStudentsMax);
      case "startLocation": return campaign.startLocation;
      case "endLocation": return campaign.endLocation;
      case "routeStatus": return campaign.routeStatus;
      case "paymentVerificationNote": return campaign.paymentVerificationNote;
      case "reportingState": return campaign.publicReportingState;
      case "reviewedDate": return campaign.dataLastReviewed ? formatDate(campaign.dataLastReviewed) : "Pending";
      case "whatsapp": return campaign.contact && campaign.contact.whatsappDisplay;
      case "email": return campaign.contact && campaign.contact.email;
      case "startDate": return has(campaign.campaignStartDate) ? formatDate(campaign.campaignStartDate) : "Pending confirmation";
      case "distanceCovered": return typeof campaign.distanceCoveredKm === "number" ? formatNumber(campaign.distanceCoveredKm) + " km" : "";
      case "unitValue":
        return typeof campaign.contributionUnitValue === "number"
          ? formatUGX(campaign.contributionUnitValue) + " per " + (campaign.contributionUnitLabel || "step")
          : "Pending campaign confirmation; no calculator is active.";
      case "unitShort":
        return typeof campaign.contributionUnitValue === "number"
          ? "1 " + (campaign.contributionUnitLabel || "step") + " = " + formatUGX(campaign.contributionUnitValue)
          : "";
      case "paymentChannelsSummary":
        return channels.length
          ? channels.map(function (c) { return c.provider + " · " + c.accountName; }).join("; ")
          : "Withheld until current beneficiary and account details are approved for publication.";
      case "receivedSummary":
        return typeof campaign.receivedTotal === "number"
          ? formatUGX(campaign.receivedTotal) + " received" + (campaign.lastReconciledAt ? " · reconciled " + formatDate(campaign.lastReconciledAt) : "")
          : campaign.publicReportingState;
      case "pledgedSummary":
        return typeof campaign.pledgedTotal === "number"
          ? formatUGX(campaign.pledgedTotal) + " pledged — shown separately, not counted as received"
          : "Shown separately once reporting begins.";
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
      var text = link.getAttribute("data-wfe-whatsapp-text") ||
        "Hello, I would like the current approved contribution details for the Walk for Education 2026.";
      link.href = whatsappUrl(withRef([text]));
      link.target = "_blank";
      link.rel = "noopener";
    });

    var paymentState = document.querySelector("[data-payment-state]");
    if (paymentState && has(campaign.paymentChannels)) {
      paymentState.textContent = "Current approved channels available";
      paymentState.classList.add("verified");
    }
  }

  function applyVisibility() {
    all("[data-wfe-show-if]").forEach(function (node) {
      node.hidden = !has(campaign[node.getAttribute("data-wfe-show-if")]);
    });
    all("[data-wfe-hide-if]").forEach(function (node) {
      node.hidden = has(campaign[node.getAttribute("data-wfe-hide-if")]);
    });
  }

  /* ---------- status & countdown ---------- */

  function renderCountdown() {
    var start = campaign.campaignStartDate;
    if (!has(start)) return;
    var toStart = daysUntil(start);
    var toEnd = has(campaign.campaignEndDate) ? daysUntil(campaign.campaignEndDate) : null;
    var text;
    if (toStart > 1) text = "Starts in " + toStart + " days · " + formatDate(start, true);
    else if (toStart === 1) text = "Starts tomorrow · " + formatDate(start, true);
    else if (toStart === 0) text = "First steps today";
    else if (toEnd !== null && toEnd < 0) text = "Walk completed · " + formatDate(campaign.campaignEndDate, true);
    else text = "On the road · day " + (1 - toStart);
    all("[data-wfe-countdown]").forEach(function (node) { node.textContent = text; });
  }

  /* ---------- odometer ---------- */

  function odometer(node, text) {
    node.textContent = "";
    node.appendChild(el("span", "sr-only", text));
    var visual = el("span", "odo");
    visual.setAttribute("aria-hidden", "true");
    text.split("").forEach(function (character, index) {
      if (/\d/.test(character)) {
        var column = el("span", "odo-col");
        var strip = el("span", "odo-strip");
        for (var digit = 0; digit <= 9; digit++) strip.appendChild(el("span", null, digit));
        strip.style.setProperty("--d", character);
        strip.style.setProperty("--i", index);
        column.appendChild(strip);
        visual.appendChild(column);
      } else {
        visual.appendChild(el("span", "odo-sep", character));
      }
    });
    node.appendChild(visual);
    whenVisible(node, function () { visual.classList.add("run"); });
  }

  /* ---------- progress ---------- */

  function renderProgress() {
    if (typeof campaign.receivedTotal !== "number") return;
    all("[data-wfe-progress]").forEach(function (host) {
      host.textContent = "";
      var figures = el("div", "progress-figs");

      function figure(label, text, note, animate) {
        var item = el("div", "progress-fig");
        item.appendChild(el("span", "lbl", label));
        var value = el("b");
        if (animate) odometer(value, text); else value.textContent = text;
        item.appendChild(value);
        if (note) item.appendChild(el("span", "note", note));
        figures.appendChild(item);
      }

      figure("Received · verified", formatUGX(campaign.receivedTotal), "Reconciled against the authorised account", true);
      if (typeof campaign.pledgedTotal === "number") {
        figure("Pledged · separate", formatUGX(campaign.pledgedTotal), "Promised, not yet received", true);
      }
      figure("Five-year goal", formatTarget(campaign.fiveYearTargetUgx), "Source proposal mobilisation goal", false);
      host.appendChild(figures);

      var target = campaign.fiveYearTargetUgx;
      if (typeof target === "number" && target > 0) {
        var share = Math.min(campaign.receivedTotal / target, 1);
        var percent = share * 100;
        var label = (percent > 0 && percent < 0.1 ? "<0.1" : percent.toFixed(percent < 10 ? 1 : 0)) + "% of the five-year goal received";
        var track = el("div", "progress-track");
        track.setAttribute("role", "img");
        track.setAttribute("aria-label", label);
        var fill = el("i");
        fill.style.setProperty("--p", Math.max(share, 0.004).toFixed(4));
        track.appendChild(fill);
        host.appendChild(track);
        host.appendChild(el("p", "progress-pct", label));
        whenVisible(track, function () { track.classList.add("run"); });
      }

      var note = campaign.lastReconciledAt ? "Last reconciled " + formatDate(campaign.lastReconciledAt) + ". " : "";
      host.appendChild(el("p", "progress-note", note + "Pledges are shown separately and never counted as received."));
    });
  }

  /* ---------- route ---------- */

  function renderRoute() {
    var covered = campaign.distanceCoveredKm;
    if (typeof covered === "number" && typeof campaign.distanceKm === "number" && campaign.distanceKm > 0) {
      var share = Math.min(covered / campaign.distanceKm, 1);
      all("[data-wfe-route-line]").forEach(function (line) {
        line.style.setProperty("--route-progress", share.toFixed(4));
        line.classList.add("has-progress");
        whenVisible(line, function () { line.classList.add("run"); });
      });
    }

    var stages = Array.isArray(campaign.routeStages) ? campaign.routeStages : [];
    if (!stages.length) return;
    var nextIndex = -1;
    stages.forEach(function (stage, index) { if (nextIndex === -1 && !stage.reached) nextIndex = index; });

    all("[data-wfe-stages]").forEach(function (host) {
      host.textContent = "";
      var list = el("ol", "stage-list");
      stages.forEach(function (stage, index) {
        var state = stage.reached ? "reached" : index === nextIndex ? "next" : "planned";
        var item = el("li", "stage " + state);
        item.appendChild(el("span", "stage-dot"));
        var text = el("div", "stage-text");
        text.appendChild(el("b", null, stage.name));
        var meta = [stage.country, typeof stage.km === "number" ? "km " + formatNumber(stage.km) : "", stage.date ? formatDate(stage.date, true) : ""]
          .filter(Boolean).join(" · ");
        if (meta) text.appendChild(el("span", null, meta));
        item.appendChild(text);
        item.appendChild(el("span", "stage-state", state === "reached" ? "Reached" : state === "next" ? "Next" : "Planned"));
        list.appendChild(item);
      });
      host.appendChild(list);
    });
  }

  /* ---------- payment channels & calculator ---------- */

  function renderPaymentChannels() {
    var channels = Array.isArray(campaign.paymentChannels) ? campaign.paymentChannels : [];
    if (!channels.length) return;
    all("[data-wfe-payment-channels]").forEach(function (host) {
      host.textContent = "";
      channels.forEach(function (channel) {
        var card = el("article", "channel-card");
        card.appendChild(el("span", "channel-type", channel.type === "bank" ? "Bank transfer" : "Mobile Money"));
        card.appendChild(el("h3", null, channel.provider));

        var row = el("div", "channel-number");
        row.appendChild(el("span", "num", channel.number));
        var copy = el("button", "channel-copy", "Copy");
        copy.type = "button";
        copy.setAttribute("aria-label", "Copy " + channel.provider + " number");
        copy.addEventListener("click", function () {
          copyText(String(channel.number).replace(/\s+/g, ""), "Number copied — confirm the registered name before sending");
          confirmButton(copy, "Copied ✓");
          track("payment_number_copied", { provider: channel.provider });
        });
        row.appendChild(copy);
        card.appendChild(row);

        var meta = el("dl", "channel-meta");
        [["Registered name", channel.accountName], ["Branch", channel.branch], ["Currency", channel.currency], ["Reference", channel.referenceHint]]
          .forEach(function (pair) {
            if (!pair[1]) return;
            meta.appendChild(el("dt", null, pair[0]));
            meta.appendChild(el("dd", null, pair[1]));
          });
        card.appendChild(meta);
        card.appendChild(el("p", "channel-check", "Before sending, confirm the registered name reads exactly “" + channel.accountName + "”, then keep your transaction reference."));
        host.appendChild(card);
      });
    });
  }

  function renderCalculator() {
    var unit = campaign.contributionUnitValue;
    if (typeof unit !== "number" || unit <= 0) return;
    var label = campaign.contributionUnitLabel || "step";
    var requested = 0;
    try { requested = parseInt(new URLSearchParams(window.location.search).get("steps"), 10) || 0; } catch (error) { requested = 0; }

    all("[data-wfe-calculator]").forEach(function (host, hostIndex) {
      host.textContent = "";
      var tiers = [10, 50, 100, 500];
      var amount = requested > 0 ? Math.min(requested, 20000) : 10;

      var group = el("div", "calc-tiers");
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Choose how many " + label + "s to sponsor");
      var buttons = tiers.map(function (count) {
        var button = el("button", "calc-tier");
        button.type = "button";
        button.appendChild(el("b", null, formatNumber(count)));
        button.appendChild(el("span", null, formatUGX(count * unit)));
        button.addEventListener("click", function () { set(count, true); input.value = ""; });
        group.appendChild(button);
        return { count: count, node: button };
      });
      host.appendChild(group);

      var fieldId = "calc-custom-" + hostIndex;
      var custom = el("div", "calc-custom");
      var customLabel = el("label", null, "Or enter your own number of " + label + "s");
      customLabel.setAttribute("for", fieldId);
      var input = el("input");
      input.id = fieldId;
      input.type = "number";
      input.min = "1";
      input.max = "20000";
      input.inputMode = "numeric";
      input.placeholder = "e.g. 250";
      input.addEventListener("input", function () {
        var value = parseInt(input.value, 10);
        if (value > 0) set(Math.min(value, 20000), false);
      });
      custom.appendChild(customLabel);
      custom.appendChild(input);
      host.appendChild(custom);

      var summary = el("div", "calc-summary");
      var total = el("output", "calc-total");
      total.setAttribute("aria-live", "polite");
      total.setAttribute("for", fieldId);
      var caption = el("span", "calc-caption");
      summary.appendChild(caption);
      summary.appendChild(total);
      host.appendChild(summary);

      var pledge = el("a", "btn btn-wfe calc-pledge", "Continue with these steps");
      pledge.addEventListener("click", function () { track("sponsor_steps_open", { units: amount, value: amount * unit }); });
      host.appendChild(pledge);
      host.appendChild(el("p", "calc-note", "Record a pledge now, or pay when checkout opens. A certificate unlocks after a verified successful live payment."));

      if (requested > 0 && tiers.indexOf(amount) === -1) input.value = String(amount);
      set(amount, false);

      function set(count, announce) {
        amount = count;
        buttons.forEach(function (item) {
          item.node.setAttribute("aria-pressed", item.count === count ? "true" : "false");
        });
        caption.textContent = formatNumber(count) + " " + label + (count === 1 ? "" : "s") + " × " + formatUGX(unit);
        total.textContent = formatUGX(count * unit);
        pledge.href = siteRoot + "contribute/?steps=" + count + (ref ? "&ref=" + encodeURIComponent(ref) : "");
        if (announce) track("sponsor_amount_selected", { units: count });
      }
    });
  }

  /* ---------- updates & partners ---------- */

  function sortedUpdates() {
    return (Array.isArray(campaign.updates) ? campaign.updates.slice() : []).sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
  }

  function buildUpdate(update, compact) {
    var article = el("article", compact ? "field-note compact" : "field-note");
    var meta = el("div", "field-meta");
    var time = el("time", null, formatDate(update.date));
    time.setAttribute("datetime", update.date);
    meta.appendChild(time);
    if (update.location) meta.appendChild(el("span", null, update.location));
    if (update.stage) meta.appendChild(el("span", null, update.stage));
    article.appendChild(meta);

    var body = el("div", "field-body");
    body.appendChild(el(compact ? "h3" : "h2", null, update.title));
    var src = assetUrl(update.image);
    if (src && !compact) {
      var figure = el("figure", "field-photo");
      var image = el("img");
      image.src = src;
      image.alt = update.imageAlt || "";
      image.loading = "lazy";
      image.decoding = "async";
      figure.appendChild(image);
      body.appendChild(figure);
    }
    String(update.body).split(/\n{2,}/).forEach(function (paragraph) {
      body.appendChild(el("p", null, paragraph));
    });
    if (update.source && !compact) body.appendChild(el("p", "field-source", "Source: " + update.source));
    article.appendChild(body);
    return article;
  }

  function renderUpdates() {
    var updates = sortedUpdates();
    if (!updates.length) return;
    all("[data-wfe-updates]").forEach(function (host) {
      host.textContent = "";
      updates.forEach(function (update) { host.appendChild(buildUpdate(update, false)); });
    });
    all("[data-wfe-latest-update]").forEach(function (host) {
      host.textContent = "";
      host.appendChild(buildUpdate(updates[0], true));
    });
  }

  function renderPartners() {
    var partners = Array.isArray(campaign.confirmedPartners) ? campaign.confirmedPartners : [];
    if (!partners.length) return;
    all("[data-wfe-partners]").forEach(function (host) {
      var cardClass = host.getAttribute("data-wfe-partners") || "partner-role";
      partners.forEach(function (partner) {
        var card = el("article", cardClass);
        card.appendChild(el("span", "role", partner.role));
        card.appendChild(el("h3", null, partner.name));
        host.appendChild(card);
      });
    });
  }

  function injectEventSchema() {
    if (!has(campaign.campaignStartDate) || !document.querySelector(".wfe-hero")) return;
    var event = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: campaign.name,
      description: campaign.shortDescription,
      startDate: campaign.campaignStartDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: [
        { "@type": "Place", name: "Nairobi", address: { "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" } },
        { "@type": "Place", name: "UCU–Kagando University College", address: { "@type": "PostalAddress", addressLocality: "Kagando, Kasese", addressCountry: "UG" } }
      ],
      organizer: { "@type": "NGO", name: "Pamodzi Community Initiative Uganda", url: "https://pamodzici.com/" },
      url: CAMPAIGN_URL
    };
    if (has(campaign.campaignEndDate)) event.endDate = campaign.campaignEndDate;
    var script = el("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(event);
    document.head.appendChild(script);
  }

  /* ---------- tabs ---------- */

  function prepareTabs() {
    var tabs = all("[data-audience-tab]");
    if (!tabs.length) return;
    var list = tabs[0].parentNode;
    var indicator = el("span", "audience-indicator");
    indicator.setAttribute("aria-hidden", "true");
    list.insertBefore(indicator, list.firstChild);
    list.classList.add("has-indicator");
    var current = null;

    function moveIndicator() {
      if (!current) return;
      indicator.style.width = current.offsetWidth + "px";
      indicator.style.height = current.offsetHeight + "px";
      indicator.style.transform = "translate3d(" + current.offsetLeft + "px," + current.offsetTop + "px,0)";
    }

    function activate(id, focus, fromUser) {
      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-audience-tab") === id;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.setAttribute("tabindex", active ? "0" : "-1");
        if (active) current = tab;
        if (active && focus) tab.focus();
      });
      all("[data-audience-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-audience-panel") !== id;
      });
      moveIndicator();
      if (fromUser && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search + "#" + id);
      }
      if (fromUser) track("audience_selected", { audience: id });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activate(tab.getAttribute("data-audience-tab"), false, true);
      });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        activate(tabs[next].getAttribute("data-audience-tab"), true, true);
      });
    });

    var requested = window.location.hash.replace("#", "");
    var valid = tabs.some(function (tab) { return tab.getAttribute("data-audience-tab") === requested; });
    activate(valid ? requested : tabs[0].getAttribute("data-audience-tab"), false, false);
    window.addEventListener("resize", moveIndicator, { passive: true });
    window.addEventListener("load", moveIndicator, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
    window.requestAnimationFrame(function () { list.classList.add("indicator-ready"); });
  }

  /* ---------- enquiries ---------- */

  function fieldError(input, message) {
    var id = input.id + "-error";
    var error = document.getElementById(id);
    if (!message) {
      input.removeAttribute("aria-invalid");
      if (error) error.hidden = true;
      return;
    }
    if (!error) {
      error = el("span", "field-error");
      error.id = id;
      input.parentNode.appendChild(error);
      var described = (input.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      if (described.indexOf(id) === -1) described.push(id);
      input.setAttribute("aria-describedby", described.join(" "));
    }
    error.textContent = message;
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
  }

  function validContact(value) {
    if (value.indexOf("@") !== -1) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    return value.replace(/\D/g, "").length >= 7;
  }

  function prepareEnquiries() {
    all(".wfe-enquiry-form").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var name = form.querySelector("[name='name']");
        var contact = form.querySelector("[name='contact']");
        var firstInvalid = null;

        if (!name.value.trim()) { fieldError(name, "Add your name so the team knows who to reply to."); firstInvalid = name; }
        else fieldError(name, "");

        if (!contact.value.trim()) { fieldError(contact, "Add an email address or phone number."); firstInvalid = firstInvalid || contact; }
        else if (!validContact(contact.value.trim())) { fieldError(contact, "That doesn't look like an email address or phone number yet."); firstInvalid = firstInvalid || contact; }
        else fieldError(contact, "");

        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }

        var route = form.querySelector("[name='route']");
        var organisation = form.querySelector("[name='organisation']");
        var message = form.querySelector("[name='message']");
        var priority = form.querySelector("[name='priority']");
        var routeLabel = route ? route.value : "Campaign enquiry";
        var subject = "Walk for Education enquiry — " + routeLabel;
        var lines = [
          "Name: " + name.value.trim(),
          "Contact: " + contact.value.trim(),
          organisation && organisation.value.trim() ? "Organisation / club: " + organisation.value.trim() : "",
          "Participation route: " + routeLabel,
          priority && priority.value ? "Education priority: " + priority.options[priority.selectedIndex].text : "",
          "",
          message && message.value.trim() ? message.value.trim() : "Please send me the current approved details."
        ].filter(function (line, index) { return line !== "" || index === 4; });
        var body = withRef(lines);

        window.location.href = "mailto:" + campaign.contact.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        showDone(form, subject, body);
        track("enquiry_prepared", { route: routeLabel });
      });

      all("input, textarea", form).forEach(function (input) {
        input.addEventListener("input", function () {
          if (input.getAttribute("aria-invalid") === "true") fieldError(input, "");
        });
      });
    });
  }

  function showDone(form, subject, body) {
    var panel = form.parentNode.querySelector(".enquiry-done");
    if (!panel) {
      panel = el("div", "enquiry-done");
      panel.setAttribute("role", "status");
      panel.setAttribute("tabindex", "-1");
      panel.appendChild(el("span", "done-mark", "✓"));
      var copyBlock = el("div");
      copyBlock.appendChild(el("h3", null, "Your message is ready."));
      copyBlock.appendChild(el("p", null, "Your email app should have opened with everything filled in. Nothing opened? Send the same message on WhatsApp, or copy it."));
      var actions = el("div", "done-actions");
      var wa = el("a", "btn btn-wfe", "Send on WhatsApp");
      wa.target = "_blank";
      wa.rel = "noopener";
      wa.addEventListener("click", function () { track("enquiry_whatsapp_fallback"); });
      var copy = el("button", "btn btn-wfe-line", "Copy message");
      copy.type = "button";
      actions.appendChild(wa);
      actions.appendChild(copy);
      copyBlock.appendChild(actions);
      panel.appendChild(copyBlock);
      form.parentNode.insertBefore(panel, form.nextSibling);
      copy.addEventListener("click", function () {
        copyText(panel.getAttribute("data-message") || "", "Message copied");
        confirmButton(copy, "Copied ✓");
      });
    }
    panel.setAttribute("data-message", subject + "\n\n" + body);
    panel.querySelector("a").href = whatsappUrl(subject + "\n\n" + body);
    panel.hidden = false;
    panel.focus({ preventScroll: false });
  }

  /* ---------- analytics & sharing ---------- */

  function prepareAnalytics() {
    all("[data-analytics]").forEach(function (item) {
      item.addEventListener("click", function () {
        track(item.getAttribute("data-analytics"), { label: (item.textContent || "").trim() });
      });
    });
  }

  function prepareShare() {
    var text = "Walk for Education 2026 — 1,100 km from Nairobi to Kagando. Every step builds a future.";

    all("[data-share-campaign]").forEach(function (button) {
      button.addEventListener("click", function () {
        var url = campaignUrl();
        if (navigator.share) {
          navigator.share({ title: "Walk for Education 2026", text: text, url: url }).catch(function () {});
        } else {
          copyText(url, "Campaign link copied");
        }
        track("campaign_share", { method: navigator.share ? "native" : "copy" });
      });
    });

    all("[data-share-whatsapp]").forEach(function (link) {
      link.href = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + campaignUrl());
      link.target = "_blank";
      link.rel = "noopener";
      link.addEventListener("click", function () { track("campaign_share", { method: "whatsapp" }); });
    });

    all("[data-copy-link]").forEach(function (button) {
      button.addEventListener("click", function () {
        copyText(campaignUrl(), "Campaign link copied");
        confirmButton(button, "Link copied ✓");
        track("campaign_share", { method: "copy" });
      });
    });
  }

  function ready() {
    renderCampaignFields();
    applyVisibility();
    renderCountdown();
    renderProgress();
    renderRoute();
    renderPaymentChannels();
    renderCalculator();
    renderUpdates();
    renderPartners();
    injectEventSchema();
    prepareTabs();
    prepareEnquiries();
    prepareAnalytics();
    prepareShare();
    if (ref) track("ambassador_visit");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
