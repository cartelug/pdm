import { recordEngagement } from "./analytics";
const form = document.querySelector<HTMLFormElement>("[data-enquiry]");
if (form) {
  const status = form.querySelector<HTMLElement>("[data-enquiry-status]")!;
  const fallback = form.querySelector<HTMLAnchorElement>("[data-enquiry-fallback]")!;
  const started = form.querySelector<HTMLInputElement>("[data-form-started]")!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  started.value = String(Date.now());
  let config: { available: boolean; csrf?: string } | undefined;
  const endpoint = form.action;
  const boot = fetch(endpoint, { credentials: "same-origin", headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : { available: false }))
    .then((value) => {
      config = value;
    })
    .catch(() => {
      config = { available: false };
    });
  function emailDraft() {
    const data = new FormData(form!);
    const body = [
      "Name: " + data.get("name"),
      "Email: " + data.get("email"),
      "Organisation: " + data.get("organisation"),
      "Phone: " + data.get("phone"),
      "Interest: " + data.get("topic"),
      "",
      "" + data.get("message"),
    ].join("\n");
    fallback.href =
      "mailto:shyakaneeza@gmail.com?subject=" +
      encodeURIComponent("Pamodzi enquiry — " + data.get("topic")) +
      "&body=" +
      encodeURIComponent(body);
  }
  form.addEventListener("input", emailDraft);
  form.addEventListener("input", () => recordEngagement("form_started"), { once: true });
  const requested = new URLSearchParams(location.search).get("interest");
  const topic = form.querySelector<HTMLSelectElement>('[name="topic"]');
  if (topic && requested && Array.from(topic.options).some((o) => o.value === requested)) topic.value = requested;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    button.disabled = true;
    button.textContent = "Sending…";
    status.textContent = "Checking enquiry delivery…";
    emailDraft();
    try {
      await boot;
      if (!config?.available) {
        status.textContent =
          "Direct form delivery is currently unavailable. Your message is ready in the email draft link below; review and send it in your email app.";
        fallback.focus();
        return;
      }
      const data = new FormData(form);
      data.set("csrf", config.csrf || "");
      const response = await fetch(endpoint, {
        method: "POST",
        body: data,
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "The message could not be sent.");
      status.textContent = "Your enquiry was accepted for email delivery. Thank you for getting in touch.";
      recordEngagement("enquiry_accepted");
      form.reset();
      started.value = String(Date.now());
      fallback.href = "mailto:shyakaneeza@gmail.com";
    } catch (error) {
      status.textContent =
        (error instanceof Error ? error.message : "The message could not be sent.") +
        " Your details are still here. Please try again or use the email draft link below.";
    } finally {
      button.disabled = false;
      button.textContent = "Send Enquiry →";
    }
  });
}
