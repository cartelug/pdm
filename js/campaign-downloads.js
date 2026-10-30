/* Load the PDF engine only when requested. Public downloads never fetch private reports. */
(function (root) {
  "use strict";
  let ready, assets;
  function script(src, present) {
    if (present()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const element = document.createElement("script");
      element.src = src;
      element.onload = () => (present() ? resolve() : reject(new Error("The report engine did not load.")));
      element.onerror = () => {
        element.remove();
        reject(new Error("The report engine could not load. Please retry."));
      };
      document.head.append(element);
    });
  }
  async function base64Asset(url) {
    const response = await fetch(url, { cache: "force-cache", credentials: "same-origin" });
    if (!response.ok) throw new Error("The approved report assets could not load. Please retry.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  function prepare() {
    if (!ready)
      ready = (async () => {
        await script("/admin/vendor/pdf-lib.min.js", () => !!root.PDFLib);
        await script("/admin/vendor/fontkit.umd.min.js", () => !!root.fontkit);
        await script("/js/campaign-report-pdf.js?v=789cbdc613", () => !!root.PCICampaignPDF);
        if (!assets)
          assets = Promise.all([
            Promise.all(
              [
                "/assets/brand/pamodzi/pamodzi-logo-320.png",
                "/assets/walk-for-education/walk-for-education-logo.png",
                "/assets/walk-for-education/south-rwenzori.png",
              ].map(base64Asset),
            ),
            base64Asset("/assets/fonts/sky-text-regular-pdf.ttf"),
            base64Asset("/assets/fonts/mtn-brighter-sans-bold-pdf.ttf"),
          ]).then(([logos, regular, bold]) => ({ logos, fonts: { regular, bold } }));
        return await assets;
      })().catch((error) => {
        ready = null;
        assets = null;
        throw error;
      });
    return ready;
  }
  function statusFor(button) {
    let status = button.nextElementSibling;
    if (!status?.hasAttribute("data-download-status")) {
      status = document.createElement("p");
      status.setAttribute("data-download-status", "");
      status.setAttribute("role", "status");
      button.after(status);
    }
    return status;
  }
  async function download(button, record) {
    if (button.disabled) return;
    const status = statusFor(button);
    button.disabled = true;
    status.textContent = "Preparing your branded PDF...";
    try {
      let report = record;
      if (!record) {
        const response = await fetch("/api/operations.php?action=public-report", {
          cache: "no-store",
          credentials: "omit",
        });
        if (!response.ok) throw new Error("Approved reporting is temporarily unavailable. Please retry.");
        report = await response.json();
        if (report.audience !== "public") throw new Error("The approved public report is unavailable.");
      }
      const loaded = await prepare();
      const bytes = await root.PCICampaignPDF[record ? "pledge" : "update"](report, loaded);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = record
        ? "PCI-Pledge-" + record.reference + ".pdf"
        : "PCI-Walk-Update-" + report.reportingCutoff.slice(0, 10) + ".pdf";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = record
        ? "Pledge confirmation downloaded. This is not a payment receipt."
        : "Public update downloaded. Reporting cut-off: " +
          new Date(report.reportingCutoff).toLocaleString("en-GB", { timeZone: "Africa/Kampala" }) +
          " EAT. The website has current figures.";
    } catch (error) {
      status.textContent = error.message || "The PDF could not be prepared. Please retry.";
    } finally {
      button.disabled = false;
    }
  }
  function bind(scope = document) {
    scope.querySelectorAll("[data-update-pdf]").forEach((button) => {
      if (button.dataset.downloadBound) return;
      button.dataset.downloadBound = "true";
      button.addEventListener("click", () => download(button));
    });
  }
  root.PCICampaignDownloads = { update: (button) => download(button), pledge: download, bind };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => bind(), { once: true });
  else bind();
})(globalThis);
