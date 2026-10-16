# Pamodzi editorial redesign

A full visual redesign of the institutional site (home, About, What We Do, Model, Projects, Impact, Partnerships, Governance, Updates, Contact, Kasese Apartment Concept, Community-led Development, 404), the Faith in Motion campaign pages, and — at the owner's request — the Walk for Education pages and the contribution flow. The campaign pages were reskinned in presentation only: of the 130 protected files, only the `<head>` of the ten campaign documents changed, and those changes are recorded as reviewed exceptions in `tests/protected-campaign/baseline.json`. Every script, form, ID, pricing, pledge and payment hook is unchanged.

## Direction

The site is organised around three ideas taken from the name and the work: *together*, *the doorway* and *the record*.

| Element | Decision |
| --- | --- |
| Display type | **Inter** variable with its display optical sizes (weight and `opsz` axes), 600–700, set large with tight tracking (−0.024 to −0.045em) and line-heights near 1. Optical sizing is automatic, so the same file draws tight display cuts for headlines and open text cuts for body copy. |
| Editorial accent | **Instrument Serif** italic, 400, at 1.08em, in crimson (blush on dark; blue on paper and gold on navy in Walk for Education). It carries the emphasis in each headline (`h1 em`, `h2 em`, `h3 em`, `.pci-statement em`), the pull quote and the menu note. |
| Reading and interface | **Inter** (the same file), 17px / 1.68. |
| Labels and figures | **Geist Mono** variable, uppercase and tracked, for eyebrows, statuses and numerals. |
| Colour | Warm paper `#FAF6F1`, bone `#F2EBE3`, burgundy ink `#1B0A0E`, night `#220A10`, brand crimson `#B71935`, with sun `#E6AD3E` and forest `#2F5D46` as small accents. Tokens live in `src/styles/tokens.css`. |
| Shape | Arches (the doorway; also the *Every door, one address* line on Projects), concentric rings (together), pill buttons, 20–34px radii. |
| Icons | Four bespoke one-weight programme icons (`PillarIcon.astro`) and the existing SVG arrow set. |
| Motion | See *Motion* below. Entrances run in CSS from the first paint; scroll effects are an enhancement. Content is complete without JavaScript and under reduced motion. |

**Why this pairing.** Six candidate pairings were rendered on the live home, Model and About pages and compared side by side: the earlier Bricolage Grotesque + Newsreader + Inter Tight, Bricolage at a narrower width, Inter Display + Instrument Serif, Instrument Sans + Instrument Serif, Fraunces + Inter Tight, and Onest + Newsreader. Inter Display with an Instrument Serif italic accent read cleanest at every size, kept long statements legible and gave the crispest contrast between grotesque and serif.

All three families are SIL OFL, self-hosted (npm for the Astro layer, `assets/fonts/` for the static campaign pages) with licences kept beside the files. Latin subsets only: about 118 KB in total (Inter 73 KB, Instrument Serif italic 22 KB, Geist Mono 23 KB), down from about 210 KB. Inter and the italic accent are preloaded; the mono face loads on demand. The footer wordmark and the 404 numeral are solid low-opacity fills rather than outlined text, because variable fonts keep overlapping contours that show up under `-webkit-text-stroke`.

The Faith in Motion pages alias their legacy family names in `css/fim-v3.css`: "Bricolage Grotesque" and "Manrope" map to Inter, "JetBrains Mono" to Geist Mono, and "Instrument Serif" supplies the hero accent.

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
| Pointer | Hero layers drift with the pointer, buttons lean toward it, programme cards tilt in 3D, and a crimson disc follows the pointer over project cards and the campaign panels, naming the action (*View*, *Explore*). Fine pointers only; the disc is `aria-hidden` and never takes pointer events. | `hero.ts`, `chrome.ts`, `cursor.ts` |
| Accents and photographs | In split headlines the italic accent arrives a beat after its line and slides into place. Project, campaign and manifesto photographs wipe open from the bottom edge while the picture settles from a slight zoom. | `reveal.ts` |
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

### Walk for Education and contributions

`css/wfe-editorial.css` is loaded after `wfe.css`, `wfe-launch.css` and `pledge-selector.css` on the five Walk for Education pages and the five contribution pages. Their `<head>` loses the Google Fonts preconnects and stylesheet and gains self-hosted font preloads and the new stylesheet; nothing in `<body>` changed. The campaign keeps its academic identity — navy ink on warm paper, gold highlights on navy, Pamodzi crimson for the primary action — in the same type system as the rest of the site.

| Area | Design |
| --- | --- |
| Hero | Navy with gold and blue light, concentric rings, the campaign mark on a paper tile, the headline in Inter with a gold Instrument Serif accent, and the step chooser as a white 28px card with pill controls and a crimson pledge action. |
| Sections | Mono eyebrows with a dot, 2.5–4.6rem headings with blue accents on paper, 24px surfaces, hairline cards that lift on hover, gold mobilisation card with rings, a navy journey with the distance figure and route line, Builder levels, people and paths. |
| Fixed flaws | The direct-contribution channels were unstyled (bare Copy buttons and definition lists); they are now cards with a mono number pill and a copy button. The footer social links no longer stack one per line. The five-step headline no longer runs "five.Our" together on phones. The "4,000–5,000" figure no longer overflows at 768px. |
| Subpages | Bone page heroes with a faint ring, pill tabs on Take part, navy contact cards, 14px-radius form fields with a visible focus ring, the accountability record as a white card with mono labels, the updates feed with large headings, and the partnerships page in the same system. |
| Contribution pages | Paper background, Inter headings, mono kickers, 28px cards, a navy aside, a crimson pill submit button and the night footer. |
| Motion | CSS only: the hero settles in once the preloader has gone (`html.is-preloaded`); sections rise on the existing `.wfe-reveal` hooks with a softer curve and staggered cards; photographs ease in with scroll where scroll-driven animation is supported. Nothing is hidden without JavaScript, and nothing moves under reduced motion. |
| Legibility floor | Labels that the shared stylesheets set at 7–10px are raised to 10.5–11px, and standalone links get a taller hit area without moving the layout. The same floor is applied to the Faith in Motion pages in `css/fim-v3.css`. |

### Faith in Motion

Only `css/fim-v3.css` and the `<head>` of the seven campaign pages changed. The legacy family names (Bricolage Grotesque, Manrope, JetBrains Mono) are aliased to the new self-hosted files, so the shared foundation needs no edits, and the external Google Fonts requests are removed. The ledger scripts, financial IDs, calculators and the protected shared CSS are unchanged.

## Checks run

- `npm run validate`: Astro type check, build, ESLint, Stylelint, Prettier, hover guard (now also covering `src/styles`), price table, page structure, asset hashes, protected-file baseline and the navigation and content tests.
- `node tests/navigation/motion.cjs`: with motion on, nothing stays hidden after it is scrolled past on any institutional page at desktop and phone width; counters, money trail and timelines finish in the right state; the filter reflow ends correctly; the marquee and split text are built and are undone when reduced motion is switched on mid-page; reduced motion and no-JavaScript pages show everything immediately; no console errors.
- `node tests/navigation/browser.cjs`: ten viewport widths from 320 to 1920, the dialog menu lifecycle, filters, enquiry fallback, no-JS navigation and an axe run on the homepage. The hero assertions now target the arch image.
- `npm run test:browser` (181 campaign checks), `php tests/payments/ledger.php` (81), `tests/payments/test_http.py` (54) and `tests/enquiry/test_http.py`.
- An axe sweep (WCAG 2.0–2.2 A and AA) of every page — institutional, Faith in Motion, Walk for Education and contribution — at 1440 and 390 px, with reduced motion and with motion on: no violations.
- Horizontal-overflow checks at 320, 390, 768, 1024 and 1440 px for every page, and a scripted audit for broken images, script errors, text below 10px and tap targets below 32px.

## Not verified here

No real-device testing (iOS Safari, Android Chrome), no Core Web Vitals measurement and no review of the pages on a slow connection. Review the staged pages at the widths listed in `V3-IMPLEMENTATION.md` before merging to `main`, which deploys.
