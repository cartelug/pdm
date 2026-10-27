/* Named-account console. No private record is written to browser storage. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let csrf = "",
    role = "",
    rows = [],
    version = 0,
    importRows = [],
    importBody = null,
    pledgeRecords = [],
    publishedPrices = [],
    priceEdited = false;
  const permissions = {
    admin: ["read", "record", "finance", "publish", "consent", "milestone", "graphic", "backup"],
    finance: ["read", "record", "finance", "consent", "milestone", "graphic"],
    coordinator: ["read", "record", "publish", "graphic"],
    recorder: ["read", "record", "graphic"],
    owner: ["publish", "graphic"],
    editor: ["publish", "graphic"],
    viewer: [],
  };
  const can = (cap) => (permissions[role] || []).includes(cap);
  const say = (text) => {
    $("message").textContent = text;
  };
  const money = (n, c) => c + " " + new Intl.NumberFormat("en-UG").format(n);
  const data = (form) => Object.fromEntries(new FormData(form));
  const node = (tag, text) => {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  };
  function today() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Kampala",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (type) => parts.find((p) => p.type === type).value;
    return get("year") + "-" + get("month") + "-" + get("day");
  }
  function entryDefaults() {
    const form = $("record-form").elements;
    if (!form.namedItem("date").value) form.namedItem("date").value = today();
    if (priceEdited) return;
    const linked = pledgeRecords.find((p) => (p.id || p.reference) === form.namedItem("pledgeId").value);
    if (linked) form.namedItem("currency").value = linked.currency;
    const currency = form.namedItem("currency").value;
    const price = publishedPrices.find((p) => p.currency === currency && p.priceStatus === "published");
    const unit = linked ? Number(linked.step_unit || 0) : Number(price?.step || 0);
    form.namedItem("stepUnit").value = unit;
    form.namedItem("country").value = linked ? linked.country || "" : price?.code || "";
    $("record-price-note").textContent =
      unit > 0
        ? (linked ? "Linked pledge price: " : "Current published price: ") +
          money(unit, currency) +
          " per sponsored step. Finance confirmation is still required."
        : "Step price is unconfirmed. No sponsored steps are inferred; finance can confirm the historical price under Optional details.";
  }
  async function api(action, body) {
    const r = await fetch("/api/operations.php?action=" + action, {
      method: body ? "POST" : "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: body ? JSON.stringify(body) : undefined,
    });
    const out = await r.json();
    if (!r.ok) throw new Error(out.error || "Service unavailable");
    return out;
  }
  window.PCIOperations = { api, say };
  const run = (fn) => async (event) => {
    event?.preventDefault();
    try {
      await fn(event);
    } catch (e) {
      say(e.message);
    }
  };
  function applyAccess() {
    document.querySelectorAll("[data-cap]").forEach((n) => {
      n.hidden = !can(n.dataset.cap);
    });
    $("login").hidden = true;
    $("workspace").hidden = false;
    $("logout").hidden = false;
    $("review-action").textContent = can("finance") ? "Review payments" : "View contributions";
  }
  function renderRecords() {
    const query = $("search").value.toLowerCase();
    $("record-list").replaceChildren();
    const visible = rows.filter((r) =>
      [r.name, r.id, r.transaction_ref, r.currency, r.status].join(" ").toLowerCase().includes(query),
    );
    for (const r of visible) {
      const article = node("article", "");
      article.className = "ops-record";
      article.append(
        node("h3", r.name + " · " + money(r.amount, r.currency)),
        node("p", r.kind + " · " + r.status + " · " + r.date + " · " + r.environment),
        node("p", r.id),
        node(
          "p",
          "Reference: " +
            (r.transaction_ref || "—") +
            " · Source: " +
            (r.source || "Direct entry") +
            (r.source_row ? " row " + r.source_row : ""),
        ),
      );
      if (r.pledge_id || r.gateway_pledge_id)
        article.append(node("p", "Related pledge: " + (r.pledge_id || r.gateway_pledge_id)));
      for (const [action, label, cap] of [
        ["reconcile", "Verify & reconcile", "finance"],
        ["reverse", "Reverse with reason", "finance"],
        ["consent", "Recognition / withdraw", "consent"],
      ]) {
        if (
          !can(cap) ||
          (action === "reconcile" && (r.kind !== "payment" || r.status !== "pending" || r.environment !== "live")) ||
          (action === "reverse" && r.status === "reversed")
        )
          continue;
        const b = node("button", label);
        b.type = "button";
        b.addEventListener("click", () => review(action, r));
        article.append(b);
      }
      $("record-list").append(article);
    }
    $("record-count").textContent =
      visible.length +
      " matching records. Gateway entries are reviewed in the separate gateway console; totals above include both ledgers.";
  }
  function review(action, record) {
    const dialog = $("review-dialog");
    $("review-title").textContent =
      action === "consent"
        ? "Recognition permissions"
        : action === "reconcile"
          ? "Finance verification & reconciliation"
          : "Reverse record";
    $("review-copy").textContent =
      record.name +
      " · " +
      money(record.amount, record.currency) +
      ". " +
      (action === "reconcile"
        ? "Confirm actual receipt and bank/mobile-money reconciliation. Provide the evidence and settlement reference."
        : "The original record and this decision remain in the audit history.");
    $("review-evidence").value = "";
    $("consent-fields").hidden = action !== "consent";
    $("consent-name").checked = false;
    $("consent-amount").checked = false;
    dialog.showModal();
    dialog.addEventListener(
      "close",
      run(async () => {
        if (dialog.returnValue !== "confirm") return;
        const evidence = $("review-evidence").value;
        await api(action, {
          id: record.id,
          evidence,
          reason: evidence,
          displayName: $("consent-name").checked,
          displayAmount: $("consent-amount").checked,
        });
        await refresh();
        say("Decision saved with audit history.");
      }),
      { once: true },
    );
  }
  async function refresh() {
    if (can("read")) {
      const d = await api("dashboard", {});
      rows = d.rows;
      pledgeRecords = [...d.rows.filter((r) => r.kind === "pledge" && r.status === "pledged"), ...d.gatewayPledges];
      $("totals").replaceChildren();
      for (const t of d.totals.currencies) {
        const card = node("article", "");
        card.append(
          node("h3", t.currency),
          node("p", "Reconciled: " + money(t.received, t.currency)),
          node("p", "Awaiting verification: " + money(t.pending, t.currency)),
          node("p", "Pledged: " + money(t.pledged, t.currency)),
          node("p", "Outstanding pledges: " + money(t.outstanding, t.currency)),
        );
        $("totals").append(card);
      }
      $("reconciliation").textContent =
        "Confirmed sponsored steps: " +
        d.totals.confirmedSteps +
        " · Last reconciliation: " +
        (d.totals.lastReconciledAt || "No reconciliation recorded");
      $("policy").textContent = d.totals.policy;
      $("milestone-status").textContent = d.totals.milestone
        ? d.totals.milestone.label + " · remaining " + money(d.totals.milestone.remaining, d.totals.milestone.currency)
        : "Operational milestone awaits approval. Five-year ambition: UGX 25 billion.";
      $("activity").replaceChildren(
        ...d.audit.map((a) => node("li", a.created_at + " · " + a.actor + " · " + a.event)),
      );
      $("pledges").replaceChildren(new Option("No related pledge", ""));
      rows
        .filter((r) => r.kind === "pledge" && r.status === "pledged")
        .forEach((r) =>
          $("pledges").add(new Option(r.name + " · " + money(r.amount, r.currency) + " · " + r.id, r.id)),
        );
      for (const r of d.gatewayPledges)
        $("pledges").add(new Option(r.name + " · " + money(r.amount, r.currency) + " · gateway pledge", r.reference));
      renderRecords();
      if (d.totalRecords > d.limit)
        say("Showing the latest " + d.limit + " records. Download the full report for all entries.");
    }
    const pub = await api("public");
    version = pub.version;
    if (can("publish")) {
      if (pub.walk)
        for (const [k, v] of Object.entries(pub.walk))
          if ($("walk-form").elements.namedItem(k)) $("walk-form").elements.namedItem(k).value = v;
      await history();
    }
  }
  async function history() {
    const d = await api("walk-history", {});
    $("walk-history").replaceChildren();
    d.versions.forEach((r) => {
      const wrap = node("p", "Version " + r.id + " · " + (r.published_at || "Draft") + " · " + r.actor + " ");
      const b = node("button", r.published_at ? "Revert to this version" : "Load draft");
      b.type = "button";
      b.addEventListener(
        "click",
        run(async () => {
          if (r.published_at) {
            await api("walk-revert", { id: r.id, baseVersion: version });
            await refresh();
            say("Previous story republished as a new audited version.");
          } else {
            for (const [k, v] of Object.entries(JSON.parse(r.payload))) $("walk-form").elements.namedItem(k).value = v;
            $("publish-walk").disabled = true;
            say("Draft loaded. Preview before publishing.");
          }
        }),
      );
      wrap.append(b);
      $("walk-history").append(wrap);
    });
  }
  $("login").addEventListener(
    "submit",
    run(async () => {
      const d = await api("login", data($("login")));
      csrf = d.csrf;
      role = d.role;
      $("login").reset();
      applyAccess();
      await refresh();
      say("Signed in as " + d.username + " · " + role);
    }),
  );
  $("logout").addEventListener(
    "click",
    run(async () => {
      await api("logout", {});
      location.reload();
    }),
  );
  for (const key of ["currency", "pledgeId"])
    $("record-form")
      .elements.namedItem(key)
      .addEventListener("change", () => {
        priceEdited = false;
        entryDefaults();
      });
  for (const key of ["country", "stepUnit"])
    $("record-form")
      .elements.namedItem(key)
      .addEventListener("input", () => {
        priceEdited = true;
        $("record-price-note").textContent =
          "Using a manually entered historical price/country. Finance must confirm the snapshot before any sponsored steps count.";
      });
  entryDefaults();
  $("walk-form").elements.namedItem("date").value = today();
  fetch("/assets/data/step-prices.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error("Price data unavailable");
      return r.json();
    })
    .then((d) => {
      publishedPrices = d.countries || [];
      entryDefaults();
    })
    .catch(() => {
      entryDefaults();
    });
  let requestId = crypto.randomUUID();
  $("record-form").addEventListener(
    "submit",
    run(async () => {
      const b = data($("record-form"));
      b.amount = Number(b.amount);
      b.stepUnit = Number(b.stepUnit);
      b.requestId = requestId;
      await api("record", b);
      requestId = crypto.randomUUID();
      $("record-form").reset();
      priceEdited = false;
      entryDefaults();
      await refresh();
      say("Recorded. Public collections are unchanged until finance reconciliation.");
    }),
  );
  $("search").addEventListener("input", renderRecords);
  $("report").addEventListener(
    "click",
    run(async () => {
      const r = await fetch("/api/operations.php?action=export", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: "{}",
      });
      if (!r.ok) throw new Error((await r.json()).error);
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "pci-contribution-report.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }),
  );
  for (const format of ["pdf", "xlsx", "json", "database"]) {
    $("report-" + format).addEventListener(
      "click",
      run(async () => {
        const response = await fetch(
          "/api/operations.php?action=" + (format === "database" ? "download-database" : "report-data"),
          {
            method: "POST",
            cache: "no-store",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
            body: "{}",
          },
        );
        if (!response.ok) throw new Error((await response.json()).error || "Download failed");
        const date = today();
        let blob;
        if (format === "database") blob = await response.blob();
        else {
          const report = await response.json();
          if (format === "pdf") {
            const base64Asset = async (url) => {
              const response = await fetch(url, { cache: "force-cache" });
              if (!response.ok) throw new Error("Report assets could not load. Please retry.");
              const bytes = new Uint8Array(await response.arrayBuffer());
              let binary = "";
              for (const byte of bytes) binary += String.fromCharCode(byte);
              return btoa(binary);
            };
            const logos = await Promise.all(
              [
                "/assets/brand/pamodzi/pamodzi-logo-320.png",
                "/assets/walk-for-education/walk-for-education-logo.png",
                "/assets/walk-for-education/south-rwenzori.png",
              ].map(async (src) => {
                return { data: await base64Asset(src) };
              }),
            );
            const fontData = await Promise.all(
              ["/assets/fonts/sky-text-regular-pdf.ttf", "/assets/fonts/mtn-brighter-sans-bold-pdf.ttf"].map(
                base64Asset,
              ),
            );
            blob = new Blob([await window.PCIReports.pdf(report, logos, { regular: fontData[0], bold: fontData[1] })], {
              type: "application/pdf",
            });
          } else if (format === "xlsx") blob = window.PCIReports.xlsx(report);
          else blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        }
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "PCI-Walk-Collections-" + date + "." + (format === "database" ? "sqlite" : format);
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        say("Downloaded a current private copy. Offline edits do not update the live register.");
      }),
    );
  }
  const walkData = () => {
    const b = data($("walk-form"));
    b.km = Number(b.km);
    b.baseVersion = version;
    return b;
  };
  $("walk-form").addEventListener("input", () => {
    $("publish-walk").disabled = true;
  });
  $("walk-form").addEventListener(
    "submit",
    run(async () => {
      const d = await api("walk-preview", walkData());
      const w = d.walk;
      $("walk-preview").replaceChildren(
        node("h3", w.town + " · " + w.date),
        node("p", w.activity + " · " + w.physical + " · " + w.km + " km"),
        node("p", w.story),
      );
      if (w.photo) {
        const img = document.createElement("img");
        img.src = "/" + w.photo;
        img.alt = w.photoAlt;
        img.style.maxWidth = "100%";
        $("walk-preview").append(img);
      }
      $("publish-walk").disabled = false;
    }),
  );
  $("upload-photo").addEventListener(
    "click",
    run(async () => {
      const file = $("walk-photo-upload").files[0];
      if (!file || file.size > 12000000 || !/^image\/(jpeg|png|webp)$/.test(file.type))
        throw new Error("Choose a JPG, PNG or WebP photo up to 12 MB");
      // Re-encode on the phone: bounded size and no original EXIF/GPS metadata.
      const src = URL.createObjectURL(file);
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
      } finally {
        URL.revokeObjectURL(src);
      }
      const canvas = document.createElement("canvas"),
        scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      let encoded = canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
      if (encoded.length > 790000) encoded = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
      if (encoded.length > 790000) throw new Error("This photo is still too large; choose a smaller crop");
      const uploaded = await api("photo-upload", { data: encoded, approved: $("walk-photo-approved").checked });
      $("walk-form").elements.namedItem("photo").value = uploaded.path;
      $("publish-walk").disabled = true;
      say("Approved photo uploaded. Add its description and preview the update before publishing.");
    }),
  );
  $("publish-walk").addEventListener(
    "click",
    run(async () => {
      await api("walk-publish", walkData());
      $("publish-walk").disabled = true;
      await refresh();
      say("Published. Connected pages update on their next refresh; open pages poll once a minute.");
    }),
  );
  $("save-draft").addEventListener(
    "click",
    run(async () => {
      await api("walk-save", walkData());
      await history();
      say("Draft saved privately.");
    }),
  );
  $("milestone-form").addEventListener(
    "submit",
    run(async () => {
      const b = data($("milestone-form"));
      b.amount = Number(b.amount);
      await api("milestone", b);
      await refresh();
      say("Approved milestone published separately from the five-year ambition.");
    }),
  );
  function parseCSV(text) {
    const result = [];
    let row = [],
      field = "",
      quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = !quoted;
      } else if (!quoted && (c === "," || c === "\n")) {
        row.push(field.replace(/\r$/, ""));
        field = "";
        if (c === "\n") {
          result.push(row);
          row = [];
        }
      } else field += c;
    }
    if (quoted) throw new Error("Unclosed CSV quotation");
    if (field || row.length) {
      row.push(field.replace(/\r$/, ""));
      result.push(row);
    }
    return result;
  }
  $("import-file").addEventListener(
    "change",
    run(async () => {
      const file = $("import-file").files[0];
      if (!file || file.size > 750000) throw new Error("Choose a CSV smaller than 750 KB");
      const parsed = parseCSV((await file.text()).replace(/^\uFEFF/, ""));
      const headers = parsed.shift();
      if (!headers || new Set(headers).size !== headers.length) throw new Error("CSV requires unique column headings");
      importRows = parsed.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
      $("column-map").replaceChildren();
      for (const key of [
        "name",
        "amount",
        "currency",
        "date",
        "channel",
        "transactionRef",
        "pledgeId",
        "country",
        "stepUnit",
        "kind",
      ]) {
        const label = node("label", key);
        const select = document.createElement("select");
        select.dataset.map = key;
        select.add(new Option("Not mapped", ""));
        headers.forEach((h) => select.add(new Option(h, h)));
        if (headers.includes(key)) select.value = key;
        label.append(select);
        $("column-map").append(label);
      }
      $("preview-import").disabled = false;
      $("commit-import").disabled = true;
      importBody = null;
    }),
  );
  const invalidate = () => {
    importBody = null;
    $("commit-import").disabled = true;
  };
  $("column-map").addEventListener("change", invalidate);
  $("import-source").addEventListener("input", invalidate);
  $("preview-import").addEventListener(
    "click",
    run(async () => {
      const mapping = {};
      document.querySelectorAll("[data-map]").forEach((s) => {
        mapping[s.dataset.map] = s.value;
      });
      importBody = { rows: importRows, mapping, source: $("import-source").value };
      const d = await api("import-preview", importBody);
      $("import-preview").textContent = d.preview
        .map(
          (r) =>
            "Row " +
            r.record.sourceRow +
            " · " +
            r.record.name +
            " · " +
            money(r.record.amount, r.record.currency) +
            " · " +
            (r.issues.join("; ") || r.review),
        )
        .join("\n");
      $("commit-import").disabled = !d.preview.length || d.preview.some((r) => r.issues.length);
    }),
  );
  $("commit-import").addEventListener(
    "click",
    run(async () => {
      if (!importBody) return;
      const d = await api("import-commit", importBody);
      $("commit-import").disabled = true;
      await refresh();
      say(d.ids.length + " imported as pending. Finance verification is still required.");
    }),
  );
  run(async () => {
    const s = await api("session");
    csrf = s.csrf;
    role = s.role;
    if (s.signedIn) {
      applyAccess();
      await refresh();
      say("Signed in as " + s.username + " · " + role);
    }
  })();
})();
