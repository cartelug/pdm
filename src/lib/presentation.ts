// Trusted, authored content only: replace typographic UI glyphs with a consistent vector control.
export function presentationIcons(html: string): string {
  const icon = (path: string) =>
    `<svg class="pci-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="${path}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return html.replaceAll("↗", icon("M6 18 18 6M6 6h12v12")).replaceAll("→", icon("M4 12h15m-6-6 6 6-6 6"));
}
