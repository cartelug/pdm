/* Pamodzi home — reconciled digital collections.
   Carries any ?ref= attribution into [data-pci-contribute] links and, when the payment service has a
   reconciled total, shows it in #digitalCollections. Unreconciled figures are never shown. */
(function () {
  "use strict";
  var script = document.currentScript.src;
  var root = script.replace(/js\/collection-progress\.js(?:\?.*)?$/, "");
  document.querySelectorAll("[data-pci-contribute]").forEach(function (link) {
    try {
      var ref = new URLSearchParams(location.search).get("ref") || sessionStorage.getItem("wfe_ref");
      if (ref) {
        var url = new URL(link.href);
        url.searchParams.set("ref", ref);
        link.href = url.href;
      }
    } catch (e) {
      /* attribution is optional */
    }
  });
  var panel = document.getElementById("digitalCollections");
  if (!panel) return;
  fetch(root + "api/payments/index.php?action=progress", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("Unavailable");
      return r.json();
    })
    .then(function (data) {
      if (!data.lastReconciledAt || !(data.received > 0)) return;
      document.getElementById("digitalReceived").textContent =
        "UGX " + new Intl.NumberFormat("en-UG").format(data.received);
      document.getElementById("digitalReconciled").textContent = new Date(data.lastReconciledAt).toLocaleDateString(
        "en-GB",
      );
      panel.hidden = false;
    })
    .catch(function () {
      /* Verified existing campaign records remain the source for other progress components. */
    });
})();
