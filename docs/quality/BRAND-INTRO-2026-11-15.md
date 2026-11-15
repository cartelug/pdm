# Brand intro on every institutional page (15 November 2026)

The owner asked for an animated preloader on every page that highlights what the page is, with the PCI logo
animated. It is built as a non-blocking brand intro (ARCHITECTURE.md decision D27).

## What a visitor sees

| Time (first page of a visit) | Event                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 s                          | Paper surface with a soft crimson and blue light. Nothing waits for the page to load.                                                                                |
| 0.05–0.85 s                  | The crimson thread draws a ring round the mark; a blue arc answers it; a small traveller runs once round the ring.                                                   |
| 0.15–0.85 s                  | The Pamodzi mark opens from its centre inside a circular window and settles.                                                                                         |
| 0.40–1.10 s                  | The page's navigation section (for example "Impact and trust") and its own title (for example "Our Impact") rise out of their masks; a thread draws under the title. |
| 1.25–1.95 s                  | The paper lifts upward with a crimson-to-blue curtain close behind it. The page's own entrance (hero, header, title) starts as it lifts.                             |

Later pages in the same visit play the same composition in about 1.2 s. Any key, click, scroll or touch skips
it at once, and the page's entrance starts immediately.

## Rules kept

- Never blocks: fixed length, `pointer-events: none`, hidden from assistive technology, CSS alone plays and ends it
  (it also ends if scripts fail).
- Not shown under reduced motion, on back/forward navigation, or in print.
- Brand rules: the approved runtime copy of the mark; only its container is clipped and scaled. The mark is never
  rotated, recoloured, filtered or traced. The same rule corrected two desktop effects (D002 header and D095
  footer), which had rotated the mark; they now open it from its centre.
- Copy: the intro uses the page's existing title and navigation section, so no new wording is introduced.
- Scope: the 13 Astro pages, every update article, the 404 and the design-system view. The Walk for Education,
  Contribute and Faith in Motion pages are protected and `scripts/pages.mjs` forbids a loading screen on them, so
  they are unchanged.

## Verification

- `npm run validate`; `tests/navigation/motion.cjs` (now asserts the intro names the page, never takes clicks,
  ends on its own, is short on the second page, skips on a key press and is absent under reduced motion);
  `tests/navigation/browser.cjs`; `tests/navigation/wfe-redesign.cjs`; `npm run test:browser` (185);
  `tests/operations/browser.cjs`; `tests/quality/responsive.cjs --strict`: pass.
- `tests/quality/a11y.cjs`: 0 axe WCAG 2.2 A/AA violations on 31 pages.
- `tests/quality/speed.cjs`: within budget, budgets unchanged. The first build delayed `/projects/` LCP to 3404 ms
  (ceiling 3300) because the title's fade waited behind the intro; under the intro the entrance now only slides,
  so the title is painted at once (1372 ms). Home: 1868 ms LCP, 271 KB.
- Headless Chromium only; real devices, Safari and Firefox not tested.
