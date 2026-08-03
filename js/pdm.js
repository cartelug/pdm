/* Pamodzi project pages — page-specific content and forms.
   Shared brand, navigation, header, progress and motion live in core.js/site-motion.js. */
(function () {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
    });
  }

  var toast = byId("toast");
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(function () { toast.classList.remove("show"); }, 2100);
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

    var project = byId("iProject") ? byId("iProject").value : "General";
    var type = byId("iType") ? byId("iType").value : "Enquiry";
    var message = byId("iMsg") ? byId("iMsg").value.trim() : "";
    var body = "Name: " + name
      + "\nContact: " + contact
      + "\nProject: " + project
      + "\nReason: " + type
      + "\n\n" + (message || "(no message)");

    window.location.href = "mailto:shyakaneeza@gmail.com?subject="
      + encodeURIComponent("PCI Uganda enquiry — " + project)
      + "&body=" + encodeURIComponent(body);
    showToast("Opening your email app…");
  }

  if (enquiryForm) enquiryForm.addEventListener("submit", submitEnquiry);
  else if (byId("send")) byId("send").addEventListener("click", submitEnquiry);

  var updatesList = byId("updatesList");
  if (updatesList && window.PDM_UPDATES) {
    var labels = { done: "Published", mile: "Milestone", ahead: "Ahead" };
    updatesList.innerHTML = window.PDM_UPDATES.map(function (update) {
      var link = update[4]
        ? '<a class="more" href="' + escapeHtml(update[4]) + '">Open <span aria-hidden="true">→</span></a>'
        : "";
      var tone = update[1] === "mile" ? "gold" : update[1] === "ahead" ? "ahead" : "";
      return '<article class="tlx ' + tone + '">'
        + '<div class="d">' + escapeHtml(update[0])
        + '<span class="tag ' + escapeHtml(update[1]) + '">' + escapeHtml(labels[update[1]] || "") + "</span></div>"
        + "<h3>" + escapeHtml(update[2]) + "</h3>"
        + "<p>" + escapeHtml(update[3]) + "</p>"
        + link + "</article>";
    }).join("");
  }
})();
