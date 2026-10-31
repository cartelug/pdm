/* Approved public PCI campaign contacts. Update only after PCI confirms ownership.
   No regional/backup contact is published until its identity and number are approved. */
(function () {
  "use strict";

  var primary = Object.freeze({
    name: "Joshua Ainabyona",
    role: "Campaign coordination",
    phone: "+256772150281",
    whatsappNumber: "256772150281",
    whatsappDisplay: "+256 772 150 281",
    whatsappUrl: "https://wa.me/256772150281",
    email: "pci.uganda@gmail.com",
  });

  function whatsappUrl(text) {
    return primary.whatsappUrl + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function refreshGroup(scope) {
    var links = scope.querySelectorAll("[data-campaign-group], #joinCampaignGroup");
    if (!links.length) return;
    fetch("/api/operations.php?action=community", { cache: "no-store", credentials: "omit" })
      .then(function (response) {
        if (!response.ok) throw new Error("Group settings unavailable");
        return response.json();
      })
      .then(function (data) {
        if (!/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]{12,64}(?:\?mode=gi_t)?$/.test(data.groupUrl)) return;
        links.forEach(function (link) {
          link.href = data.groupUrl;
        });
      })
      .catch(function () {
        // Existing approved static links and the private team contact remain available.
      });
  }

  function bind(scope) {
    var host = scope || document;
    host.querySelectorAll("[data-campaign-contact]").forEach(function (node) {
      var kind = node.getAttribute("data-campaign-contact");
      if (kind === "whatsapp") node.href = whatsappUrl(node.getAttribute("data-contact-message") || "");
      else if (kind === "phone") node.href = "tel:" + primary.phone;
      else if (kind === "email") node.href = "mailto:" + primary.email;
      else if (kind === "name") node.textContent = primary.name;
      else if (kind === "number") node.textContent = primary.whatsappDisplay;
    });
    // Keep existing static public links consistent without altering prepared messages or group invites.
    host.querySelectorAll("a[href]").forEach(function (link) {
      var href = link.getAttribute("href");
      if (/^https:\/\/wa\.me\/256772150281(?:\?|$)/.test(href)) {
        link.href = primary.whatsappUrl + (href.indexOf("?") === -1 ? "" : href.slice(href.indexOf("?")));
      }
    });
    refreshGroup(host);
  }

  window.PCICampaignContacts = Object.freeze({ primary: primary, whatsappUrl: whatsappUrl, bind: bind });
  if (document.readyState === "loading")
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        bind(document);
      },
      { once: true },
    );
  else bind(document);
})();
