# Pamodzi master mark — working web pack

This folder records the supplied Pamodzi logo as the intended master identity for Pamodzi for Development (previously labelled PCI in parts of the site). It is a red **P/O** construction with a black human figure integrated into the O: a clear expression of people acting together.

`v2/` is the new responsive vector family. It preserves that P/O/person idea while providing intentional large-format and small-format forms. Use it for all new frontend work; the PNG exports below remain a reference and fallback pack.

## Files

| File | Use |
| --- | --- |
| `pamodzi-logo-source.png` | Untouched supplied source. Preserve; do not optimise, crop or recolour. |
| `pamodzi-mark-primary.png` | Red-and-black mark for light backgrounds and editorial campaign material. |
| `pamodzi-mark-ink.png` | Single dark-ink mark for documents, press material and restrained light interfaces. |
| `pamodzi-mark-light.png` | Single white mark for deep colour, photography or video end frames. |
| `pamodzi-mark-red.png` | Single Pamodzi-red mark for one-colour applications only. |

## Selected vector family (`v2/`)

| File | Use |
| --- | --- |
| `pamodzi-lockup-primary.svg` | Default organisation logo on a light surface. |
| `pamodzi-lockup-light.svg` | Full logo on deep colour or video end frames. |
| `pamodzi-lockup-ink.svg` | Full single-colour logo for documents and restrained applications. |
| `pamodzi-lockup-red.svg` | Single-red application where one ink is required. |
| `pamodzi-symbol-primary.svg` | Deliberate compact P/O/person mark for mobile navigation and tight UI. |
| `pamodzi-symbol-light.svg` / `pamodzi-symbol-ink.svg` | Compact mark for dark and monochrome contexts. |
| `pamodzi-favicon.svg` | Browser tab and app-tile icon; deep ink field, red O, white human figure. |

The PNG exports have transparent backgrounds. The original is a 1273 × 965 raster image; it is sufficient for the current website but **not** a substitute for a vector master for print, signage, or large-format work. The v2 files are native SVG artwork and are the web master pending final visual approval.

## Visual system

- Primary red: `#BB2D22` (sampled from the supplied image)
- Primary ink: `#050606` (sampled from the supplied image)
- Light mark: `#FFFFFF`
- Pamodzi is the organisation name. Use **Pamodzi for Development** in running text and page titles; do not continue the separate PCI naming.

## Rules

1. Do not stretch, rotate, shadow, outline, or add a gradient to the mark.
2. Use the full primary mark only on light, quiet surfaces; it needs clear space equal to at least the height of the human figure around it.
3. Use the light version on dark surfaces. Do not place the primary mark over photography without a solid backing panel.
4. Do not derive a favicon, app icon, or compact navigation mark by cropping the raster. Use the v2 compact symbol and favicon.
5. The existing `../pci-mark.svg` is legacy artwork. Keep it only until the sitewide replacement pass is complete; do not use it in new work.

## Brand hierarchy

- **Pamodzi for Development:** organisation identity across the institutional site, browser metadata, and the global preloader.
- **Faith in Motion:** campaign identity. Retain its Rotary/campaign header; Pamodzi appears as the organising endorsement in the footer, legal/about context, and any sitewide transition.
- **Rotary:** partner mark; it is not replaced by Pamodzi.

## Rollout plan

1. Treat the v2 SVG family as the frontend master. If original agency artwork becomes available, archive it alongside this source rather than silently replacing this family.
2. Replace the legacy `pci-mark.svg` references across institutional headers, footers, structured data, favicons and social metadata in one audited pass.
4. Add an opening sequence that reveals the **actual vector paths**: red letterforms first, human figure last, then a short hold before content. It must complete in under 900 ms, be skipped under reduced motion, and never delay the main action.
5. Keep Faith in Motion's campaign hierarchy intact while adding the Pamodzi endorsement where it is credible rather than intrusive.
6. Validate light/dark contrast, 16–48 px small-mark legibility, print export, and mobile load performance before publishing.
