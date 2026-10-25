# Font and typography redesign guide

The current approved public system is **Archivo + Lexend**, self-hosted. Redesign the hierarchy, wrapping, spacing and reading experience around those families first. This is not a request to reactivate older Inter, Instrument Serif or Geist Mono styling simply because their assets/packages are still present.

## Actual roles and files

| Role | Family | Declared range | Use |
| --- | --- | --- | --- |
| Heading / UI / figures | Archivo | 500–800, normal | Headings, menus, buttons, labels, money and counts |
| Reading / forms | Lexend | 400–600, normal | Paragraphs, forms, captions and helper text |

Public files are `assets/fonts/archivo-latin-wght-normal.woff2` and `assets/fonts/lexend-latin-wght-normal.woff2`. Their licences are included alongside them. The source font declarations use weight-only variable files; no width scaling or synthetic italics is needed. Current tokens explicitly set `italics: false`. The two active font files together cost approximately 74.6 KB before HTTP overhead.

Archivo supports tabular figures for aligned money and counts. Lexend does not supply that role in this implementation. Arrows use a system fallback rather than assuming the active font contains every symbol.

## There are two sizing layers

`src/design/tokens.json` defines the shared type scale. `src/styles/tokens.css` adds the institutional `--pci-fs-*` scale and page CSS can override the hero. Updating only one layer will not uniformly change every page.

| Shared role | Current token value |
| --- | --- |
| Display | `clamp(2.5rem, 1.6rem + 4.2vw, 5rem)` |
| H1 | `clamp(2.125rem, 1.5rem + 3vw, 3.75rem)` |
| H2 | `clamp(1.75rem, 1.35rem + 1.8vw, 2.75rem)` |
| H3 | `clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)` |
| Body | `clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)` |
| Small | `0.875rem` |
| Caption | `0.8125rem` |
| Reading measure | `60ch` |

The institutional H1 alias currently reaches `6.9rem`, and the homepage hero has its own container-responsive size up to `8rem`. Inspect the computed value and available copy width before changing an H1 token. Very large titles are a specific composition choice, not the default for every page.

## Recommended next refinement

These are proposed design targets, not a description of a new shipped implementation:

- Homepage/Walk hero: Archivo 650–750 with a comfortable word-based wrap; approximately 40–56 px on narrow phones where the copy permits, growing with the actual text container on desktop.
- Interior H1: Archivo 600–700, clearly smaller than the campaign hero; keep the title and opening explanation in the same visual unit.
- H2: Archivo 600–650; consistent section hierarchy with a readable line height around 1.05–1.15 where needed.
- Body: Lexend 400 at roughly 16–18 px with 1.55–1.7 line height and about 55–65 characters per line.
- Buttons: Archivo 600–700 with short sentence-case labels. Increase padding before increasing letter spacing.
- Inputs and helper text: Lexend; at least 16 px input text on phones, persistent labels, visible validation and enough line height for wrapping.
- Money and counters: Archivo with tabular figures. Keep the currency label, reporting date and source meaning close to the number; avoid huge unexplained totals.
- Labels/captions: keep at or above the existing 13 px floor. Avoid wide-tracked uppercase for long instructions.

Treat these as starting values to test against real copy. Do not hard-code them into every selector or shrink a difficult title until the page merely stops scrolling.

## Where to make the change

1. Edit font family/role and shared type decisions in `src/design/tokens.json`.
2. Run `npm run tokens`. This generates `src/design/generated/tokens.css`, `src/design/generated/fonts.css` and `css/brand.css`.
3. Refine institutional aliases in `src/styles/tokens.css` and relevant source styles in `base.css`, `home.css`, `components.css`, `shell.css` and `pages.css`.
4. Handwritten pages receive shared font roles through `css/brand.css` and `css/one-look.css`. The latter intentionally overrides high-specificity legacy font declarations. Keep it last in the page head. New official-kit CSS loads before it.
5. If a protected page's head, preload or markup changes, use the narrow review process and keep its script order and functional hooks.
6. Run `npm run build`; commit the generated institutional HTML and `_astro/` files alongside their authoring sources.

Do not directly edit generated font CSS or a compiled `_astro/pci-*.css` file. They will be overwritten. `InstitutionalLayout.astro` imports and preloads the two active font packages explicitly; a deliberate family replacement would need to update those imports and the handwritten preload paths as well.

## CSS role example

This illustrates the intended roles; adapt to the real source selectors instead of appending a competing global layer:

```css
.campaign-heading {
  font-family: var(--font-head);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.campaign-reading {
  font-family: var(--font-body);
  font-weight: 400;
  line-height: 1.65;
  max-width: 60ch;
}

.campaign-amount {
  font-family: var(--font-head);
  font-variant-numeric: tabular-nums;
}
```

Avoid `transform: scaleX(...)`, fixed heading heights, nonbreaking spaces across long phrases, and indiscriminate `word-break: break-all`. Use sensible container widths and CSS wrapping. Preserve the fallback metrics already generated for Arial so font arrival does not cause unnecessary text movement.

## Font-family replacement, if Neeza deliberately requests it

Preview a restrained alternative against the same real homepage, long heading, contribution form, currency figure and phone navigation. Check glyph coverage, weights, licence, total transfer size, fallback metrics and both authoring lanes. Record the new decision in `ARCHITECTURE.md`, update tokens/imports/preloads/assets and run all relevant checks. Do not propose a fashionable display face that makes forms, names or amounts harder to read.

## Verification

Inspect computed font families for an H1, paragraph, navigation item, button, form field, caption and money figure across the homepage, Walk, Contribute and Faith in Motion. Confirm only the intended two public families load and no third-party font host was added. Test 320, 390, 768, 1024, 1440 and 2560 px, short landscape, 200% text, no-JavaScript and reduced motion.

Run `npm run check:tokens`, `npm run validate`, the browser suites, axe, speed and the strict responsive sweep. Old admin consoles can have legacy font loading; do not confuse their protected implementation with the approved public typography contract.
