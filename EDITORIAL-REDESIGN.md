# Pamodzi editorial redesign

A full visual redesign of the institutional site (home, About, What We Do, Model, Projects, Impact, Partnerships, Governance, Updates, Contact, Kasese Apartment Concept, Community-led Development, 404) and the Faith in Motion campaign pages. **Walk for Education and the contribution flow are untouched**; all 130 protected files still match their baseline.

## Direction

The site is organised around three ideas taken from the name and the work: *together*, *the doorway* and *the record*.

| Element | Decision |
| --- | --- |
| Display type | **Instrument Serif** (regular and italic), set large. Italic crimson carries the emphasis in each headline. |
| Reading and interface | **Hanken Grotesk** variable, 17px / 1.68. |
| Labels and figures | **Geist Mono** variable, uppercase and tracked, for eyebrows, statuses and numerals. |
| Colour | Warm paper `#FAF6F1`, bone `#F2EBE3`, burgundy ink `#1B0A0E`, night `#220A10`, brand crimson `#B71935`, with sun `#E6AD3E` and forest `#2F5D46` as small accents. Tokens live in `src/styles/tokens.css`. |
| Shape | Arches (the doorway; also the *Every door, one address* line on Projects), concentric rings (together), pill buttons, 20–34px radii. |
| Icons | Four bespoke one-weight programme icons (`PillarIcon.astro`) and the existing SVG arrow set. |
| Motion | Hero line reveal, grouped entrances, a nine-stage ICIADM cycle diagram that follows scroll, desktop smooth scrolling. All of it is optional: content is visible without JavaScript and with reduced motion. |

All three families are SIL OFL, self-hosted (npm for the Astro layer, `assets/fonts/` for the static campaign pages) with licences kept beside the files. Latin subsets only: about 100 KB for the three families, against roughly 270 KB for Fraunces with its optical-size axes. Two fonts are preloaded on every page.

## Imagery policy (unchanged)

No generated or stock image is presented as evidence of a project. The homepage hero is still labelled *Illustration*; the four programme sculptures are kept as programme art; the Kagando campus photograph keeps its "not a photograph of the school" caption; the campaign panels use each campaign's own supplied photography and artwork.

## Where things live

```
src/styles/   fonts, tokens, base, components, shell (header, menu, footer), home, pages
src/components/global/   SiteHeader, SiteFooter, PageHero, SectionHead, Rows, Cards, Checks, Steps, Notice, PillarIcon, Rings, Icon
src/components/home/     HomeHero, ProgrammePillars, ModelPreview (hero, pillars, cycle diagram)
src/pages/               one .astro file per page, copy authored inline
src/content/pages/       title, heading, description and publication metadata only
css/fim-v3.css           Faith in Motion presentation overrides
```

Cascade layers run `tokens, base, components, shell, home, pages, motion`, so a later layer can always override an earlier one without specificity fights.

### Content

Previously the page bodies were HTML strings inside the `pages` collection. They are now authored in the page templates so each page can have its own layout. The collection keeps the review metadata (`owner`, `source`, `publication`, `reviewedAt`) and `getPage()` refuses to build a draft record. Copy was carried over word for word; a text comparison of every old and new page found no missing public sentence apart from three intentional removals (the *Discover the possibilities* scroll hint on the home hero, the sr-only "Project overview" and "Programme overview" headings, and the self-referencing "Explore the full model" link on the model page). Straight apostrophes were converted to typographic ones. The stat figures on Impact (55, 50, 16) repeat numbers already published in that page's copy.

### Faith in Motion

Only `css/fim-v3.css` and the `<head>` of the seven campaign pages changed. The legacy family names (Bricolage Grotesque, DM Serif Display, Manrope, JetBrains Mono) are aliased to the new self-hosted files, so the shared foundation needs no edits, and the external Google Fonts requests are removed. The ledger scripts, financial IDs, calculators and the protected shared CSS are unchanged.

## Checks run

- `npm run validate`: Astro type check, build, ESLint, Stylelint, Prettier, hover guard (now also covering `src/styles`), price table, page structure, asset hashes, protected-file baseline and the navigation and content tests.
- `node tests/navigation/browser.cjs`: ten viewport widths from 320 to 1920, the dialog menu lifecycle, filters, enquiry fallback, no-JS navigation and an axe run on the homepage. The hero assertions now target the arch image.
- `npm run test:browser` (181 campaign checks), `php tests/payments/ledger.php` (81), `tests/payments/test_http.py` (54) and `tests/enquiry/test_http.py`.
- An axe sweep (WCAG 2.0–2.2 A and AA) of every institutional page at 1440 and 390 px with reduced motion: no violations.
- Horizontal-overflow checks at 320, 390 and 1440 px for every page including the seven campaign pages.

## Not verified here

No real-device testing (iOS Safari, Android Chrome), no Core Web Vitals measurement and no review of the pages on a slow connection. Review the staged pages at the widths listed in `V3-IMPLEMENTATION.md` before merging to `main`, which deploys.
