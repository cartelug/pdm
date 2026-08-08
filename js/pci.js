/* Pamodzi Community Initiative — page-specific interactions.
   Shared brand, navigation, header, progress and motion live in core.js/site-motion.js. */
(function () {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  var toast = byId("toast");
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(function () { toast.classList.remove("show"); }, 2000);
  }

  var enquiryForm = byId("enquiryForm");
  function submitEnquiry(event) {
    if (event) event.preventDefault();

    var nameField = byId("iName");
    var contactField = byId("iContact");
    var name = nameField ? nameField.value.trim() : "";
    var contact = contactField ? contactField.value.trim() : "";

    if (!name || !contact) {
      showToast("Please add your name and how we can reach you");
      if (!name && nameField) nameField.focus();
      else if (contactField) contactField.focus();
      return;
    }

    var topic = byId("iTopic") ? byId("iTopic").value : "General";
    var type = byId("iType") ? byId("iType").value : "Enquiry";
    var message = byId("iMsg") ? byId("iMsg").value.trim() : "";
    var body = "Name: " + name
      + "\nContact: " + contact
      + "\nInterest: " + topic
      + "\nReason: " + type
      + "\n\n" + (message || "(no message)");

    window.location.href = "mailto:shyakaneeza@gmail.com?subject="
      + encodeURIComponent("Pamodzi enquiry — " + topic)
      + "&body=" + encodeURIComponent(body);
    showToast("Opening your email app…");
  }

  if (enquiryForm) enquiryForm.addEventListener("submit", submitEnquiry);
  else if (byId("send")) byId("send").addEventListener("click", submitEnquiry);
})();
