/* One approved public projection on homepage, project cards and the Walk pages. */
(function () {
  "use strict";
  const path = location.pathname;
  if (!(path === "/" || path === "/index.html" || /\/(projects|walk-for-education)\//.test(path))) return;
  const main = document.querySelector("main");
  if (!main) return;
  const panel = document.createElement("section");
  panel.className = "ops-live";
  panel.setAttribute("aria-label", "Verified Walk for Education update");
  const h = document.createElement("h2");
  h.textContent = "Walk for Education · live reporting";
  const body = document.createElement("div");
  body.textContent = "Checking approved campaign reporting…";
  panel.append(h, body);
  if (path === "/" || path === "/index.html") {
    const first = main.querySelector("section");
    first ? first.after(panel) : main.prepend(panel);
  } else main.append(panel);
  const el = (tag, text) => {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  };
  const money = (n, c) => c + " " + Number(n).toLocaleString("en-UG");
  let last = null,
    busy = false;
  function render(d) {
    body.replaceChildren();
    const w = d.walk;
    if (w) {
      const status = w.activity + " campaign · " + w.physical.replaceAll("-", " ") + " · " + w.km + " km confirmed";
      body.append(el("h3", w.town + " · " + w.date), el("p", status), el("p", w.story));
      if (w.photo) {
        const img = document.createElement("img");
        img.src = "/" + w.photo;
        img.alt = w.photoAlt;
        img.loading = "lazy";
        body.append(img);
      }
      document.querySelectorAll(".pci-campaign-chip__status").forEach((n) => {
        n.textContent = status;
      });
      document.querySelectorAll(".pci-live, .pci-duo__panel, .pci-project").forEach((card) => {
        if (!card.querySelector('a[href*="walk-for-education"]') && !card.matches('a[href*="walk-for-education"]'))
          return;
        const label = card.querySelector(".pci-project__state") || card.querySelector(".pci-live__status, .pci-status");
        if (label) label.textContent = status;
        const badge = card.querySelector("[data-ops-project-status]");
        if (badge) {
          badge.textContent = w.activity === "active" ? "Live campaign" : w.activity + " campaign";
          card.dataset.projectStatus = w.activity === "active" ? "Live campaign" : "Preparing launch";
        }
      });
    } else
      body.append(
        el(
          "p",
          "Campaign reporting is live. The next named-owner walking update awaits publication; no walking distance is inferred.",
        ),
      );
    for (const t of d.totals.currencies) {
      body.append(
        el("h3", money(t.received, t.currency) + " reconciled collections"),
        el(
          "p",
          money(t.pledged, t.currency) +
            " pledged · " +
            money(t.outstanding, t.currency) +
            " outstanding on pledges. Pledges are separate from received funds.",
        ),
      );
    }
    if (!d.totals.currencies.length)
      body.append(
        el(
          "p",
          "No itemised live receipts or pledges have been recorded in this reporting ledger. Historical registers still require finance review.",
        ),
      );
    body.append(
      el(
        "p",
        d.totals.confirmedSteps.toLocaleString("en-UG") +
          " confirmed sponsored steps. Sponsored steps are separate from walking kilometres.",
      ),
    );
    const m = d.totals.milestone;
    if (m)
      body.append(
        el(
          "p",
          m.label +
            " · " +
            money(m.amount, m.currency) +
            " approved milestone · " +
            money(m.remaining, m.currency) +
            " remaining towards this milestone.",
        ),
      );
    body.append(
      el(
        "p",
        "Five-year ambition: UGX 25 billion. " +
          (m
            ? "The approved operational milestone is shown separately."
            : "The operational milestone awaits approval."),
      ),
    );
    body.append(
      el(
        "p",
        "Finance-reconciled receipts only · last reconciliation: " +
          (d.totals.lastReconciledAt || "none recorded") +
          " · reporting cut-off: " +
          new Date(d.reportingCutoff).toLocaleString("en-GB", { timeZone: "Africa/Kampala" }) +
          " EAT",
      ),
    );
    if (d.supporters.length) {
      body.append(el("h3", "With thanks to our supporters"));
      const list = document.createElement("ul");
      d.supporters.forEach((s) =>
        list.append(el("li", s.name + (s.amount !== null ? " · " + money(s.amount, s.currency) : ""))),
      );
      body.append(list);
    }
  }
  async function update() {
    if (document.hidden || busy) return;
    busy = true;
    try {
      const r = await fetch("/api/operations.php?action=public", { cache: "no-store" });
      if (!r.ok) throw new Error("unavailable");
      const d = await r.json();
      if (!d.available) throw new Error("unavailable");
      render(d);
      last = d.reportingCutoff;
    } catch {
      document.querySelectorAll(".pci-campaign-chip__status").forEach((n) => {
        n.textContent = "Update temporarily unavailable";
      });
      // Remove recognition immediately on failure: its consent may have been withdrawn.
      body.replaceChildren(
        el(
          "p",
          "Verified campaign reporting is temporarily unavailable. " +
            (last
              ? "Last successful check: " + last + ". Refresh to check again."
              : "No zero balance or walking status is inferred. Please check again later."),
        ),
      );
    } finally {
      busy = false;
    }
  }
  update();
  setInterval(update, 60000);
  document.addEventListener("visibilitychange", update);
})();
