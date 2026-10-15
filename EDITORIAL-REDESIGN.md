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
| Motion | See *Motion* below. Entrances run in CSS from the first paint; scroll effects are an enhancement. Content is complete without JavaScript and under reduced motion. |

All three families are SIL OFL, self-hosted (npm for the Astro layer, `assets/fonts/` for the static campaign pages) with licences kept beside the files. Latin subsets only: about 100 KB for the three families, against roughly 270 KB for Fraunces with its optical-size axes. Two fonts are preloaded on every page.

## Home page (second pass)

The home page was redesigned again after the first release. The inner pages keep the arch and ring language; the home page is the cinematic entry to it.

| Section | Design |
| --- | --- |
| Hero | Full-bleed illustration (labelled as such) under a burgundy shade, a two-line headline set very large, and two glass cards that link straight to the live campaigns with their current status. A portrait crop is used on phones so the faces stay above the text. |
| Principle strip | A crimson band, a scroll-speed marquee when scripted. |
| Four pillars | Expanding panels on a wide screen with a mouse (one open, three folded, vertical titles); ordinary cards on touch devices and narrow screens. Keyboard focus opens a panel. |
| Who we are | A manifesto set at display size whose words come up as it is read, then *Convene, Mobilise, Sustain*. |
| Model | The nine-stage cycle, unchanged. |
| Projects | A snap-scrolling carousel with previous/next buttons and a progress line; plain horizontal scrolling without script. |
| Walking for Impact | Two full-bleed halves that lean toward the one under the pointer. |

All copy and status wording is unchanged.

## Motion

The rule: **nothing above the fold waits for a script, and nothing is needed to read the page.**

| Layer | What it does | Where |
| --- | --- | --- |
| CSS entrances | Home headline rises line by line out of a mask; the arch opens from its base, the sun rises behind it, the outline arch draws, the caption pops; inner-page heroes stagger breadcrumb, headline and lede while their arches open. Menu links stagger in. Pillar sculptures and the sun idle gently. | `src/styles/motion.css` |
| Cross-page transitions | Institutional pages cross-fade and lift into each other with the header held still (`@view-transition`). Campaign pages do not opt in, so links to and from Walk for Education stay ordinary page loads. Browsers without support navigate normally. | `motion.css` |
| Scroll progress | A thin crimson-to-sun bar, scroll-linked in CSS where supported and driven by script elsewhere. | `motion.css`, `chrome.ts` |
| Scripted scroll effects | Split-line headlines, block and group reveals, photographs wiping open, hairlines drawing left to right, pillar glyphs drawing themselves, count-up figures, parallax on the hero and photographs, rotating rings in the partnership band, the cycle diagram (ring draws, stages pop, a point travels the ring, the nearest stage is lit and pulses), the money trail lighting up step by step, review timelines drawing down, the footer wordmark filling with crimson, the principle strip becoming a marquee that speeds up with scroll. | `src/scripts/motion/` |
| Pointer | Hero layers drift with the pointer, buttons lean toward it, programme cards tilt in 3D. Fine pointers only. | `hero.ts`, `chrome.ts` |
| Reflow | Filtering projects reflows the grid with a FLIP transition and still ends in the right state if the script is missing. | `filter.ts` |

Guard rails:

- **Reduced motion:** every CSS animation sits inside `prefers-reduced-motion: no-preference` and the script does not start, so the plain page is shown. Switching the preference while a page is open undoes every scripted change.
- **No script:** nothing is hidden by CSS waiting for a script. Elements below the fold are hidden by script only once it is running, and anything already on screen is left alone. The count-up figures hold their real number in the markup.
- **Assistive technology:** split headlines keep their text as ordinary text (no `aria-label` is added), and the marquee copies are `aria-hidden`.
- **Transforms:** scripted parallax uses custom properties and the independent `translate`/`scale`/`rotate` properties, so it composes with hover rules, entrances and pointer movement rather than fighting them.
- **Cost:** the scroll-motion chunk is loaded after the page is interactive (about 54 KB gzipped, plus about 10 KB for the FLIP plugin on the projects page only, and Lenis on desktop). All six GSAP plugins used are bundled from the existing `gsap` dependency.

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
- `node tests/navigation/motion.cjs`: with motion on, nothing stays hidden after it is scrolled past on any institutional page at desktop and phone width; counters, money trail and timelines finish in the right state; the filter reflow ends correctly; the marquee and split text are built and are undone when reduced motion is switched on mid-page; reduced motion and no-JavaScript pages show everything immediately; no console errors.
- `node tests/navigation/browser.cjs`: ten viewport widths from 320 to 1920, the dialog menu lifecycle, filters, enquiry fallback, no-JS navigation and an axe run on the homepage. The hero assertions now target the arch image.
- `npm run test:browser` (181 campaign checks), `php tests/payments/ledger.php` (81), `tests/payments/test_http.py` (54) and `tests/enquiry/test_http.py`.
- An axe sweep (WCAG 2.0–2.2 A and AA) of every institutional page at 1440 and 390 px with reduced motion: no violations.
- Horizontal-overflow checks at 320, 390 and 1440 px for every page including the seven campaign pages.

## Not verified here

No real-device testing (iOS Safari, Android Chrome), no Core Web Vitals measurement and no review of the pages on a slow connection. Review the staged pages at the widths listed in `V3-IMPLEMENTATION.md` before merging to `main`, which deploys.
