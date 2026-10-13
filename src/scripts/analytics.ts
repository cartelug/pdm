type Engagement = "menu_open" | "navigation_selected" | "form_started" | "enquiry_accepted";
// Optional integration point. No network requests, visitor identifiers or form values are recorded.
export function recordEngagement(name: Engagement, route?: string) {
  const detail = { name, ...(route ? { route: route.replace(/index\.html$/, "") } : {}) };
  window.dispatchEvent(new CustomEvent("pci:engagement", { detail }));
}
