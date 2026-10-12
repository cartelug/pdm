/* Contributions — step checkout and payment result.
   /contribute/:          contribution type (pledge / online), step amount, details form and
                          submission to api/payments (?action=create).
   /contribute/payment/:  receipt status, automatic re-checks while a payment is pending, and the
                          verified-payment certificate download. The server re-validates everything. */
(function () {
  "use strict";
  var script = document.currentScript.src;
  var root = script.replace(/js\/contributions\.js(?:\?.*)?$/, "");
  var api = root + "api/payments/index.php";
  var documentPath = location.pathname;
  window.addEventListener("popstate", function () {
    // A storage-free private link transfers state before reload. Back/Forward can reuse its document.
    // Reload the matching page when history changes the route while retaining the previous page's DOM.
    if (location.pathname !== documentPath) location.reload();
  });
  var csrf = "",
    settings = null,
    submitting = false;
  var requestId = newRequestId();
  var memory = Object.create(null),
    savedRecord = null;
  function read(key) {
    try {
      return window.sessionStorage.getItem(key) || memory[key] || null;
    } catch (error) {
      return memory[key] || null;
    }
  }
  function write(key, value) {
    memory[key] = value;
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }
  function validSteps(value) {
    return (
      String(value).trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= 5 && Number(value) <= 20000
    );
  }
  function rememberSteps(value) {
    if (!validSteps(value)) return;
    write("wfe_steps", String(Number(value)));
    if (!priceAvailable()) return;
    try {
      var url = new URL(location.href);
      url.searchParams.set("steps", String(Number(value)));
      url.searchParams.set("country", here().code);
      if (url.href !== location.href) window.history.replaceState(window.history.state, "", url.href);
    } catch (error) {
      /* URL/session persistence is optional; the current in-page selection remains authoritative. */
    }
  }
  function historyRecord() {
    return window.history.state && window.history.state.pciSavedPledge;
  }
  function keepRecord(record) {
    savedRecord = record;
    try {
      window.history.replaceState(
        Object.assign({}, window.history.state || {}, { pciSavedPledge: record }),
        "",
        location.href,
      );
    } catch (error) {
      // The saved reference and prepared message remain usable in this page if history is unavailable.
    }
  }
  function newRequestId() {
    return window.crypto && crypto.randomUUID
      ? crypto.randomUUID()
      : "PCI-" + Date.now() + "-" + Math.random().toString(36).slice(2) + "-request";
  }
  /* Country pricing is shared with the campaign preview. A missing script must not silently quote Uganda. */
  var pricing = window.StepPricing || null;
  if (!pricing) {
    document
      .querySelectorAll('[data-sp]:not([data-sp="policy"]), [data-sp-steps], [data-sp-amount]')
      .forEach(function (node) {
        node.textContent = "—";
      });
    document.querySelectorAll("[data-country-featured]").forEach(function (button) {
      button.disabled = true;
    });
    document.querySelectorAll("[data-pricing-status]").forEach(function (node) {
      node.hidden = false;
      node.textContent = "Country prices could not load. Reload to try again, or contact PCI for assistance.";
    });
    document.documentElement.classList.remove("pricing-pending");
  }
  function here() {
    return pricing ? pricing.current() : { code: "", currency: "", step: 0, label: "", ready: false, available: false };
  }
  function priceAvailable() {
    var now = here();
    return now.ready !== false && now.available !== false && Number.isInteger(now.step) && now.step > 0;
  }
  function money(v, currency) {
    var code = currency || here().currency;
    return pricing ? pricing.format(v, code) : code + " " + new Intl.NumberFormat("en-UG").format(v);
  }
  function pledgeMessage(row, name) {
    return (
      "Hello" +
      (name ? ", my name is " + name : "") +
      ".\nI pledge " +
      row.steps +
      " steps (" +
      money(row.amount, row.currency) +
      ") for Walk for Education.\nReference: " +
      row.reference +
      ".\n" +
      (row.country && row.country !== "UG" && row.country !== "KE"
        ? "This amount is indicative; please confirm my contribution amount.\n"
        : "") +
      "Please guide me on contributing."
    );
  }
  function pledgeWhatsapp(text) {
    if (window.PCICampaignContacts) return window.PCICampaignContacts.whatsappUrl(text);
    var contact = window.WFE_CAMPAIGN && window.WFE_CAMPAIGN.contact;
    return contact && contact.whatsappUrl ? contact.whatsappUrl + "?text=" + encodeURIComponent(text) : "";
  }
  function messageActions(panel, text, ids) {
    var area = document.getElementById(ids.text);
    if (!area) {
      var label = document.createElement("label");
      label.htmlFor = ids.text;
      label.textContent = "Your prepared pledge message";
      area = document.createElement("textarea");
      area.id = ids.text;
      area.readOnly = true;
      area.rows = 5;
      panel.appendChild(label);
      panel.appendChild(area);
    }
    area.value = text;
    var button = document.getElementById(ids.button);
    if (!button) {
      button = document.createElement("button");
      button.id = ids.button;
      button.type = "button";
      button.className = "btn btn-ghost";
      button.textContent = "Copy pledge message";
      panel.appendChild(button);
    }
    var status = document.getElementById(ids.status);
    if (!status) {
      status = document.createElement("p");
      status.id = ids.status;
      status.setAttribute("role", "status");
      panel.appendChild(status);
    }
    if (button.dataset.copyBound) return;
    button.dataset.copyBound = "true";
    button.addEventListener("click", async function () {
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(area.value);
        status.textContent = "Pledge message copied.";
      } catch (error) {
        area.focus();
        area.select();
        status.textContent =
          "Automatic copying is unavailable. Your message is selected; copy it using your device’s copy command.";
      }
    });
  }
  function savedPledge(row, name, token, preparedMessage) {
    var text = preparedMessage || pledgeMessage(row, name);
    write("pci-pledge-message-" + row.reference, text);
    var stored = token ? write("pci-view-" + row.reference, token) : !!read("pci-view-" + row.reference);
    keepRecord({ row: row, token: token || read("pci-view-" + row.reference) || "", message: text });
    var panel = document.getElementById("pledgeSavedPanel");
    document.getElementById("contributionForm").hidden = true;
    document.getElementById("checkoutNotice").hidden = true;
    document.getElementById("pledgeSavedSummary").textContent =
      row.steps +
      " steps · " +
      money(row.amount, row.currency) +
      (row.country && row.country !== "UG" && row.country !== "KE" ? " (indicative; PCI will confirm)" : "") +
      ". No payment taken.";
    document.getElementById("pledgeSavedReference").textContent = row.reference;
    document.getElementById("openPledgeWhatsapp").href = pledgeWhatsapp(text);
    var privateLink = document.getElementById("viewPledgeRecord");
    privateLink.href = root + "contribute/payment/?reference=" + encodeURIComponent(row.reference);
    privateLink.onclick = function (event) {
      if (stored) return;
      event.preventDefault();
      try {
        // Transfer the secret within same-origin history state, never the URL, when storage is denied.
        window.history.pushState({ pciSavedPledge: savedRecord }, "", privateLink.href);
        location.reload();
      } catch (error) {
        document.getElementById("pledgeCopyStatus").textContent =
          "Your pledge is saved. Keep this reference and contact PCI if the private record cannot open on this device.";
      }
    };
    messageActions(panel, text, {
      text: "pledgeSavedMessage",
      button: "copyPledgeMessage",
      status: "pledgeCopyStatus",
    });
    panel.hidden = false;
    document.getElementById("pledgeCopyStatus").textContent =
      "Your pledge reference is saved. Open WhatsApp when you’re ready, or copy the message below. No payment was taken.";
    panel.focus();
  }
  function pressKind(name) {
    document.querySelectorAll("[data-kind]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.kind === name));
    });
  }
  /* Online payment needs checkout to be open AND the gateway to take this country's currency. */
  function payable() {
    return (
      priceAvailable() &&
      here().approved !== false &&
      !!settings &&
      settings.checkoutEnabled &&
      (settings.paymentCurrencies || ["UGX"]).indexOf(here().currency) !== -1
    );
  }
  var forcedPledge = false;
  function applyAvailability() {
    if (!settings) return;
    var tab = document.querySelector('[data-kind="payment"]');
    var notice = document.getElementById("checkoutNotice");
    if (savedRecord) {
      notice.hidden = true;
      update();
      return;
    }
    document.getElementById("contributionKinds").hidden = !payable();
    document.getElementById("kindHint").hidden = !payable();
    var now = here();
    if (!payable()) {
      if (kind() === "payment") {
        forcedPledge = true;
        pressKind("pledge");
      }
      tab.disabled = true;
      tab.textContent = settings.checkoutEnabled
        ? "Online payment in " + now.label + " · soon"
        : "Online payment · soon";
      notice.hidden = false;
      notice.textContent = settings.checkoutEnabled
        ? "Online payment in " +
          now.label +
          " is not open yet. Save your pledge, then continue on WhatsApp. No payment is taken."
        : "Your pledge is saved first. Open WhatsApp when you’re ready to send your message. No payment is taken.";
    } else {
      tab.disabled = false;
      tab.textContent = "Pay for my steps";
      if (forcedPledge) {
        forcedPledge = false;
        pressKind("payment");
      }
      notice.hidden = settings.environment !== "sandbox";
      if (settings.environment === "sandbox")
        notice.textContent =
          "TEST CHECKOUT — this is the Pesapal sandbox. Test payments do not count toward campaign collections.";
    }
    update();
  }
  async function call(action, data) {
    var options =
      data === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
            body: JSON.stringify(data),
          };
    var response = await fetch(
      api + "?action=" + action,
      Object.assign({ credentials: "same-origin", cache: "no-store" }, options),
    );
    var result = await response.json();
    if (!response.ok) throw new Error(result.error || "Please try again later.");
    return result;
  }
  function message(text, error, focus) {
    var e = document.getElementById("feedback");
    if (e) {
      e.textContent = text;
      e.className = "collection-feedback " + (error ? "error" : "good");
      if (error && focus !== false) {
        e.setAttribute("tabindex", "-1");
        e.focus();
      }
    }
  }
  function kind() {
    var selectedKind = document.querySelector('[data-kind][aria-pressed="true"]');
    return selectedKind ? selectedKind.dataset.kind : "pledge";
  }
  function amount() {
    return Number(document.getElementById("amount").value);
  }
  function update() {
    var stepField = document.getElementById("stepCount");
    var unit = here().step,
      available = priceAvailable();
    var stepValue = Number(stepField.value),
      stepsValid = validSteps(stepField.value);
    stepField.setAttribute("aria-invalid", String(!stepsValid));
    stepField.setCustomValidity(stepsValid ? "" : "Choose 5 to 20,000 whole steps.");
    var stepError = document.getElementById("stepValidation");
    if (stepError) {
      stepError.hidden = stepsValid;
      stepError.textContent = stepsValid
        ? ""
        : "Choose 5 to 20,000 whole steps." + (available ? " The minimum is " + money(5 * unit) + "." : "");
      var described = (stepField.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      if (described.indexOf("stepValidation") === -1) described.push("stepValidation");
      stepField.setAttribute("aria-describedby", described.join(" "));
    }
    document.getElementById("amount").value = stepsValid && available ? stepValue * unit : 0;
    document.getElementById("summaryAmount").textContent = stepsValid && available ? money(amount()) : "—";
    if (document.getElementById("summarySteps"))
      document.getElementById("summarySteps").textContent = stepsValid ? stepValue + " steps" : "Choose your steps";
    var isPledge = kind() === "pledge";
    document.getElementById("summaryType").textContent = isPledge ? "Your intended pledge" : "Your contribution";
    document.getElementById("submitContribution").textContent = isPledge
      ? submitting
        ? "Saving your pledge…"
        : "Save my pledge"
      : "Continue to secure payment";
    document.getElementById("submitContribution").disabled =
      submitting ||
      !!savedRecord ||
      !stepsValid ||
      !available ||
      !settings ||
      !csrf ||
      (isPledge ? !settings.pledgesEnabled : !payable());
    document.getElementById("contributionForm").setAttribute("aria-busy", String(submitting));
    document.getElementById("contributionForm").inert = submitting;
    rememberSteps(stepField.value);
    document.getElementById("kindHint").textContent = isPledge
      ? "A pledge records your intention to support. No money is collected."
      : "You will choose a payment method inside Pesapal checkout.";
    document.querySelectorAll("[data-steps]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(Number(b.dataset.steps) === stepValue));
    });
    document.querySelectorAll("[data-checkout-adjust]").forEach(function (b) {
      b.disabled =
        submitting || (stepsValid && (Number(b.dataset.checkoutAdjust) < 0 ? stepValue <= 5 : stepValue >= 20000));
    });
    var custom = document.getElementById("checkoutCustom");
    if (custom) custom.setAttribute("aria-pressed", String([100, 50, 20, 10, 5].indexOf(stepValue) === -1));
    var selectedLabel = document.getElementById("selectedStepsLabel"),
      selectedAmount = document.getElementById("selectedStepsAmount");
    if (selectedLabel) selectedLabel.textContent = stepsValid ? stepValue + " sponsored steps" : "Choose your steps";
    if (selectedAmount) selectedAmount.textContent = stepsValid && available ? money(amount()) : "—";
    document.documentElement.classList.remove("pledge-pending");
  }
  async function initForm() {
    var form = document.getElementById("contributionForm");
    var steps = document.getElementById("stepCount"),
      query = new URLSearchParams(location.search),
      selected = query.has("steps") ? query.get("steps") : read("wfe_steps");
    if (steps && selected !== null) steps.value = validSteps(selected) ? String(Number(selected)) : selected;
    var choicePanel = document.getElementById("checkoutChoicePanel"),
      choiceToggle = document.getElementById("changeContribution");
    if (choicePanel && choiceToggle) {
      var preselected = selected !== null && validSteps(selected);
      choicePanel.hidden = preselected;
      choiceToggle.setAttribute("aria-expanded", String(!preselected));
      choiceToggle.textContent = preselected ? "Change steps" : "Done choosing";
      choiceToggle.addEventListener("click", function () {
        if (!choicePanel.hidden && !steps.checkValidity()) {
          steps.reportValidity();
          return;
        }
        choicePanel.hidden = !choicePanel.hidden;
        choiceToggle.setAttribute("aria-expanded", String(!choicePanel.hidden));
        choiceToggle.textContent = choicePanel.hidden ? "Change steps" : "Done choosing";
        if (!choicePanel.hidden) steps.focus();
      });
    }
    var custom = document.getElementById("checkoutCustom");
    if (custom)
      custom.addEventListener("click", function () {
        steps.focus();
        steps.select();
      });
    document.querySelectorAll("[data-checkout-adjust]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (submitting) return;
        steps.value = validSteps(steps.value)
          ? Math.max(5, Math.min(20000, Number(steps.value) + Number(b.dataset.checkoutAdjust)))
          : 5;
        requestId = newRequestId();
        update();
      });
    });
    document.querySelectorAll("[data-kind]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (submitting || b.disabled) return;
        document.querySelectorAll("[data-kind]").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        requestId = newRequestId();
        message("", false);
        update();
      });
    });
    document.querySelectorAll("[data-steps]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (submitting) return;
        if (steps) steps.value = Number(b.dataset.steps);
        if (!submitting) requestId = newRequestId();
        update();
      });
    });
    /* The first question: where are you giving from? Currency, step price and payment availability follow. */
    var countrySelect = document.getElementById("country");
    if (pricing) {
      pricing.bind(document);
      document.addEventListener("steppricing:change", function () {
        if (countrySelect) countrySelect.value = here().code;
        pricing.bind(document);
        if (!submitting) requestId = newRequestId();
        applyAvailability();
        update();
      });
      if (countrySelect)
        countrySelect.addEventListener("change", function () {
          pricing.select(countrySelect.value);
        });
      pricing.ready.then(function () {
        if (countrySelect) pricing.fillSelect(countrySelect);
        pricing.bind(document);
        applyAvailability();
        update();
      });
    }
    form.addEventListener("input", function () {
      if (!submitting) requestId = newRequestId();
      update();
    });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (submitting || savedRecord) return;
      if (!validSteps(steps.value)) {
        if (choicePanel) choicePanel.hidden = false;
        if (choiceToggle) choiceToggle.setAttribute("aria-expanded", "true");
        update();
        steps.focus();
        steps.reportValidity();
        return;
      }
      if (!form.reportValidity()) return;
      if (!priceAvailable() || !settings || !csrf || (kind() === "pledge" ? !settings.pledgesEnabled : !payable())) {
        message("Contribution pricing or the service is unavailable. Please retry or contact the campaign team.", true);
        return;
      }
      if (!Number.isInteger(amount()) || amount() !== Number(steps.value) * here().step) {
        message("Your amount does not match the selected steps. Choose your steps again.", true);
        return;
      }
      if (kind() !== "pledge" && !write("pci-storage-check", "1")) {
        message("Enable session storage to keep your private payment reference on this device.", true);
        return;
      }
      submitting = true;
      update();
      message(kind() === "pledge" ? "Saving your pledge…" : "Preparing your payment…", false);
      try {
        var referral = (query.get("ref") || read("wfe_ref") || "")
          .trim()
          .replace(/[^\w\- .']/g, "")
          .slice(0, 40);
        var supporterName = document.getElementById("supporterName").value.trim();
        var r = await call("create", {
          campaign: document.getElementById("campaign").value,
          kind: kind(),
          country: here().code,
          currency: here().currency,
          amount: amount(),
          steps: Number(steps.value),
          name: supporterName,
          email: document.getElementById("email").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          referral: referral.slice(0, 60),
          consent: document.getElementById("consent").checked,
          requestId: requestId,
        });
        write("pci-view-" + r.contribution.reference, r.token);
        if (r.contribution.kind === "pledge" && r.contribution.status === "pledged") {
          submitting = false;
          savedPledge(r.contribution, supporterName, r.token);
          update();
          return;
        }
        if (r.redirectUrl) {
          location.assign(r.redirectUrl);
          return;
        }
        location.assign(root + "contribute/payment/?reference=" + encodeURIComponent(r.contribution.reference));
      } catch (error) {
        submitting = false;
        update();
        message(error.message, true);
      }
    });
    update();
    var previous = historyRecord();
    if (
      previous &&
      previous.row &&
      previous.row.kind === "pledge" &&
      previous.row.status === "pledged" &&
      previous.token
    )
      savedPledge(previous.row, "", previous.token, previous.message);
    try {
      var results = await Promise.all([call("status"), call("session")]);
      settings = results[0];
      csrf = results[1].csrf;
      applyAvailability();
      if (!settings.pledgesEnabled)
        message("The contribution service is being prepared. Please contact the campaign team.", true, false);
    } catch (error) {
      message("The contribution service is unavailable. Please use the campaign contact below.", true, false);
    }
    update();
  }
  async function initReceipt() {
    var ref = new URLSearchParams(location.search).get("reference") || "",
      previous = historyRecord(),
      token =
        read("pci-view-" + ref) ||
        (previous && previous.row && previous.row.reference === ref ? previous.token : "") ||
        "";
    if (!ref || !token) {
      message(
        "Open the payment result on the device and browser used for your contribution. If you need help, contact PCI with your transaction reference.",
        true,
      );
      return;
    }
    var refresh = document.getElementById("refreshPayment");
    var pollTimer = null,
      pollUntil = Date.now() + 300000,
      lastState = "";
    function queueStatusCheck() {
      clearTimeout(pollTimer);
      if (lastState === "pending" && Date.now() < pollUntil)
        pollTimer = setTimeout(function () {
          if (document.hidden) queueStatusCheck();
          else load();
        }, 25000);
    }
    var certificatePanel = document.getElementById("certificatePanel"),
      certificateButton = document.getElementById("downloadCertificate"),
      certificateCode = "";
    if (certificateButton)
      certificateButton.addEventListener("click", async function () {
        certificateButton.disabled = true;
        var feedback = document.getElementById("certificateFeedback");
        feedback.textContent = "Preparing your certificate…";
        try {
          var response = await fetch(api + "?action=certificate", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
            body: JSON.stringify({ reference: ref, token: token }),
          });
          if (!response.ok) {
            var error = await response.json();
            throw new Error(error.error || "Please check payment status again.");
          }
          var blob = await response.blob();
          if (!response.headers.get("Content-Type").includes("application/pdf"))
            throw new Error("Certificate download unavailable");
          var url = URL.createObjectURL(blob),
            a = document.createElement("a");
          a.href = url;
          a.download = certificateCode + ".pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 60000);
          feedback.textContent = "Certificate downloaded. Thank you for your contribution.";
        } catch (e) {
          feedback.textContent = e.message;
        }
        certificateButton.disabled = false;
      });
    var messages = {
      pledged:
        "Your pledge is saved. Send the message on WhatsApp so the campaign team can guide you. No payment has been taken.",
      successful: "Your payment has been verified. Thank you for supporting the campaign.",
      pending:
        "Your payment is awaiting verification. This page checks automatically for five minutes. Please check its status before starting another payment.",
      failed: "The provider reports that this payment failed. Contact PCI if money was deducted.",
      cancelled: "Checkout was cancelled. Payment status will still be checked in case a payment completed.",
      refunded: "The provider reports that this payment was reversed. Contact PCI for assistance.",
      closed: "This pledge has been closed by the finance team.",
    };
    async function load() {
      if (refresh.disabled) return;
      clearTimeout(pollTimer);
      refresh.disabled = true;
      try {
        var r = await call("lookup", { reference: ref, token: token }),
          row = r.contribution;
        lastState = row.status;
        document.getElementById("receiptState").textContent = row.status;
        document.getElementById("receiptState").className = "receipt-state " + row.status;
        document.getElementById("receiptAmount").textContent = money(row.amount, row.currency);
        document.getElementById("receiptReference").textContent = row.reference;
        document.getElementById("receiptNumber").textContent = row.receipt || "Issued after verified payment";
        document.getElementById("receiptDate").textContent = new Date(row.created_at).toLocaleString("en-GB");
        document.getElementById("receiptReconciled").textContent = row.reconciled_at
          ? "Reconciled by PCI finance"
          : row.kind === "pledge"
            ? "Pledge only — not received funds"
            : "Separate finance reconciliation pending";
        document.getElementById("receiptEnvironment").textContent =
          row.environment === "sandbox" ? "TEST — excluded from collections" : "Live campaign record";
        if (document.getElementById("receiptSteps"))
          document.getElementById("receiptSteps").textContent =
            row.steps > 0
              ? row.steps + (row.steps === 1 ? " step" : " steps") + " × " + money(row.step_unit, row.currency)
              : "Not recorded as sponsored steps";
        if (certificatePanel) {
          certificateCode = row.certificate || "";
          certificatePanel.hidden = !(
            certificateCode &&
            row.status === "successful" &&
            row.environment === "live" &&
            !r.verificationDelayed
          );
          document.getElementById("certificateNumber").textContent = certificateCode;
        }
        var communityInvite = document.getElementById("pledgeCommunityInvite");
        if (communityInvite) communityInvite.hidden = !(row.kind === "pledge" && row.status === "pledged");
        var handoff = document.getElementById("pledgeWhatsappPanel");
        if (handoff) {
          handoff.hidden = !(row.kind === "pledge" && row.status === "pledged");
          if (!handoff.hidden) {
            var text =
              read("pci-pledge-message-" + row.reference) ||
              (previous && previous.row && previous.row.reference === row.reference ? previous.message : "") ||
              pledgeMessage(row, "");
            document.getElementById("sendPledgeWhatsapp").href = pledgeWhatsapp(text);
            document.getElementById("pledgeWhatsappMessage").textContent = text;
            messageActions(handoff, text, {
              text: "pledgeWhatsappCopyMessage",
              button: "copyPledgeWhatsappMessage",
              status: "pledgeWhatsappCopyStatus",
            });
          }
        }
        document.getElementById("receiptContent").hidden = false;
        document.getElementById("printReceipt").hidden = row.status !== "successful";
        document.getElementById("receiptHeading").textContent =
          row.kind === "pledge" ? "Your pledge is saved." : "Your contribution";
        refresh.textContent = row.kind === "pledge" ? "Refresh pledge record" : "Check payment status";
        message(
          (row.environment === "sandbox" && row.status === "successful"
            ? "Test payment verified. Sandbox payments do not receive a contribution certificate."
            : messages[row.status]) +
            (r.verificationDelayed ? " The latest provider check is delayed; this is the last verified status." : ""),
          row.status === "failed",
        );
      } catch (error) {
        message(error.message, true);
      }
      refresh.disabled = false;
      queueStatusCheck();
    }
    try {
      csrf = (await call("session")).csrf;
    } catch (error) {
      message("Unable to check payment status. Please contact PCI.", true);
      return;
    }
    refresh.addEventListener("click", load);
    document.getElementById("printReceipt").addEventListener("click", function () {
      window.print();
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && lastState === "pending" && Date.now() < pollUntil) load();
    });
    addEventListener("pagehide", function () {
      clearTimeout(pollTimer);
    });
    await load();
  }
  if (document.getElementById("contributionForm")) initForm();
  if (document.getElementById("receiptContent")) initReceipt();
})();
