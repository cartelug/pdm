> **Archived on 21 October 2026.** Kept for history only: Sora/Manrope presentation refresh, replaced by the editorial redesign (EDITORIAL-REDESIGN.md) before it shipped further. For how the platform works today, read [ARCHITECTURE.md](../../ARCHITECTURE.md).

# Pamodzi crimson presentation refresh

The homepage now introduces PCI's four programme areas through an illustrative, blended photographic hero, then continues into a warm-paper pillar section. The separate mobile composition avoids cropping the desktop scene around its headline. Hero headings and actions remain HTML, with independent CSS gradients maintaining the transition across viewport sizes.

## Design and implementation

- Sora and Manrope variable fonts are self-hosted; their distribution licenses are retained with the assets.
- The approved `pamodzi-logo-transparent.png` is unchanged. Removing the container background corrects the pale rectangle without recolouring or rebuilding the mark.
- Four individually generated transparent programme illustrations use distinct book, protective care, leaf and connected ascending structures. A fifth connection sculpture accompanies the institutional statement.
- Institutional arrows, menu and close controls use consistent SVG paths. Existing punctuation, currency characters and functional text remain text; there are no emoji decorations.
- Hero image/text choreography, grouped programme entrances, project reveals, an animated model progress rail and a restrained connection-art movement extend the existing GSAP foundation.
- Motion is scoped to institutional pages, pauses off-screen where appropriate, cleans up during lifecycle changes and respects reduced motion. Mobile uses native scrolling.
- Faith in Motion's existing presentation-only stylesheet shares the typography and crimson colours. Its script, data and financial hooks are unchanged.

The image-generation outputs illustrate programme themes. They are not documentary photographs of completed PCI work. Existing project statuses, real campaign photography, attribution captions, model summaries and verified content remain in place.

## Architecture

Authoring is in `src/components/home/HomeHero.astro`, `ProgrammePillars.astro`, the existing institutional components and `src/styles/crimson.css`. `src/lib/presentation.ts` replaces typographic arrows in trusted authored content. `src/scripts/motion.ts` owns the new page-scoped movement and cleanup.

Use `npm run build` to export the institutional documents into the existing root and route directories. The original GitHub Actions deployment continues serving static files alongside the PHP services on cPanel. No new hosting service or payment integration is introduced.

## Verification and release

Run `npm run validate` for types, the static build, source/style checks, routes, fragments, asset references, protected files and navigation/content tests. 129 protected campaign files remain byte-identical to the original baseline. The sole reviewed exception removes two emoji decorations from `admin/quick.html`; button status attributes and runtime logic remain unchanged. Its old and new fingerprints are recorded in the protected-file baseline.

The existing CI additionally runs isolated PHP ledger/HTTP fixtures and real-browser journeys. Institutional browser checks cover ten viewport widths, navigation lifecycle, reduced motion, no-JS navigation, accessibility, project filtering and enquiry fallback. The refresh adds rendered checks for the transparent logo container, selected responsive hero sources and all four loaded pillar images.

The implementation environment has no PHP runtime or supported local browser-preview capability. Those checks are therefore executed in the repository's CI before the main update. Performance goals are not reported as measured Core Web Vitals.

The user explicitly authorised implementation and a subsequent push to `main`. Review the final diff and CI result, then update `main` without force. The existing main-push deployment performs validation again before upload. Preserve all server-only campaign and payment data during deployment or rollback.
