# Desktop motion plan (15 November 2026)

A desktop-only choreography layer on top of the six homepage scenes. It runs on a wide screen with a mouse or
trackpad (`(min-width: 1100px) and (hover: hover) and (pointer: fine)`) and never on phones, tablets, touch
laptops in touch mode, data-saver/lite mode or reduced motion. Phones keep the earlier treatment; a separate
mobile plan comes next.

Code: `src/scripts/motion/desktop.ts` (D001–D100) and the desktop block at the end of `src/styles/motion.css`
(D007, D100–D114). Every ID below appears in the code beside its effect.

## Rules every effect follows

- **One-shot arrivals.** Content already on screen, or above a restored reading position, is never hidden to replay.
- **One owner per element.** The director animates elements no other module animates. Where `reveal.ts` owned a
  group (`.pci-cards`, `.pci-stats`, `.pci-principles`, `.pci-vm`) or block (cards, notices, empty states), it
  steps aside on desktop and the director takes over.
- **Settles to the stylesheet.** Each arrival clears exactly the properties it set. GSAP replaces CSS
  `translate/rotate/scale` while it owns a transform, so centred layers (halo, ring, floor, rings, arrow discs)
  carry their centring inside the tween and picture overscan is part of each drift.
- **Pointer effects move decorative layers only** (images, art, rings, light). Links, buttons and tabs never
  move under the pointer, and every layer returns to rest on leave, blur or a hidden tab.
- **Scroll effects map position directly** and stay inside each image's overscan.
- **Focus wins.** Focusing anything inside a held arrival shows it at once (`index.ts`).

## The 114 desktop effects

| ID   | Where                               | Effect                                                       | Kind         |
| ---- | ----------------------------------- | ------------------------------------------------------------ | ------------ |
| D001 | Header                              | Brand slides in from the left                                | Load         |
| D002 | Header                              | Logo mark turns into place                                   | Load         |
| D003 | Header                              | Navigation items drop in one after another                   | Load         |
| D004 | Header                              | Campaign chip slides in from the right                       | Load         |
| D005 | Header                              | Chip status dot fades in last                                | Load         |
| D006 | Header                              | Contact button rises; its arrow disc turns in                | Load         |
| D007 | Hero                                | Soft crimson light follows the pointer across the photograph | Pointer      |
| D008 | Hero                                | Photograph pushes in gently as the hero leaves               | Scroll       |
| D009 | Hero                                | Campaign cards lift away faster than the page                | Scroll       |
| D010 | Hero                                | Accent underline thickens as the reader moves on             | Scroll       |
| D011 | Hero                                | Campaign card arrow discs turn into place                    | Load         |
| D012 | Hero                                | Action arrow discs turn in with the actions                  | Load         |
| D013 | Hero                                | Scroll cue fades as soon as reading starts                   | Scroll       |
| D014 | Hero                                | Caption slides off with the image                            | Scroll       |
| D015 | Principle strip                     | Numbers flip up                                              | Load         |
| D016 | Every section                       | Eyebrow slides in from the left                              | Arrival      |
| D017 | Every section                       | Lead paragraph follows the heading                           | Arrival      |
| D018 | Every section                       | Text links draw in from the left                             | Arrival      |
| D019 | Every section                       | Button arrow discs turn into place                           | Arrival      |
| D020 | Campus                              | Picture drifts inside its window                             | Scroll       |
| D021 | Campus                              | Background light moves against the scroll                    | Scroll       |
| D022 | Campus                              | Caption slides under the figure                              | Arrival      |
| D023 | Route                               | Drawing settles from slightly smaller                        | Arrival      |
| D024 | Route                               | Start label arrives from the left                            | Arrival      |
| D025 | Route                               | Destination label arrives from the right                     | Arrival      |
| D026 | Route                               | Start pin pops into place                                    | Arrival      |
| D027 | Route                               | Destination pin pops into place                              | Arrival      |
| D028 | Route                               | Faint track flows toward the destination                     | Scroll       |
| D029 | Route                               | Background light drifts                                      | Scroll       |
| D030 | Route                               | Explanatory note settles last                                | Arrival      |
| D031 | Pillars                             | Stage card rises and settles                                 | Arrival      |
| D032 | Pillars                             | Halo light swells in                                         | Arrival      |
| D033 | Pillars                             | Orbit ring turns into place                                  | Arrival      |
| D034 | Pillars                             | Four coins pop onto the ring in order                        | Arrival      |
| D035 | Pillars                             | Coin labels follow                                           | Arrival      |
| D036 | Pillars                             | Sculpture rises from its floor                               | Arrival      |
| D037 | Pillars                             | Floor shadow spreads beneath it                              | Arrival      |
| D038 | Pillars                             | Chosen pillar title                                          | Arrival      |
| D039 | Pillars                             | Chosen pillar summary                                        | Arrival      |
| D040 | Pillars                             | Chosen pillar list, point by point                           | Arrival      |
| D041 | Pillars                             | Chosen pillar link                                           | Arrival      |
| D042 | Pillars                             | Sculpture tilts toward the pointer                           | Pointer      |
| D043 | Pillars                             | Art note settles                                             | Arrival      |
| D044 | Who we are                          | Three commitments slide in in turn                           | Arrival      |
| D045 | Who we are                          | Portrait turns slightly into place                           | Arrival      |
| D046 | Who we are                          | Supporting paragraphs follow                                 | Arrival      |
| D047 | Projects                            | Visible cards glide in from the right                        | Arrival      |
| D048 | Projects                            | Status chips pop onto the cards                              | Arrival      |
| D049 | Projects                            | Progress line draws                                          | Arrival      |
| D050 | Projects                            | Arrow buttons pop in                                         | Arrival      |
| D051 | Projects                            | Card pictures tilt toward the pointer                        | Pointer      |
| D052 | Projects page                       | Grid cards rise in a short wave                              | Arrival      |
| D053 | Projects page                       | Filter pills slide in                                        | Arrival      |
| D054 | Work in practice                    | Backdrop drifts behind the section                           | Scroll       |
| D055 | Work in practice                    | Illustration caption slides in                               | Arrival      |
| D056 | Two campaigns                       | Education panel arrives from the left                        | Arrival      |
| D057 | Two campaigns                       | Faith in Motion panel arrives from the right                 | Arrival      |
| D058 | Two campaigns                       | Status, title, text and link follow                          | Arrival      |
| D059 | Two campaigns                       | Panel photograph leans toward the pointer                    | Pointer      |
| D060 | Partnerships                        | Backdrop drifts                                              | Scroll       |
| D061 | Partnerships                        | Six rings draw from the inside out                           | Arrival      |
| D062 | Partnerships                        | Rings lean toward the pointer                                | Pointer      |
| D063 | Partnerships                        | Tags pop in                                                  | Arrival      |
| D064 | Partnerships                        | Caption slides in                                            | Arrival      |
| D065 | Model                               | Nine stages slide in in a short wave                         | Arrival      |
| D066 | Model                               | Stage arrows turn into place                                 | Arrival      |
| D067 | Model                               | Note settles last                                            | Arrival      |
| D068 | Cards (all pages)                   | Cards fold up into place in a wave                           | Arrival      |
| D069 | Cards                               | Labels slide in after their card                             | Arrival      |
| D070 | Cards                               | Arrow discs turn in                                          | Arrival      |
| D071 | Rows                                | Numbers slide in from the margin                             | Arrival      |
| D072 | Rows                                | Text rises after the number                                  | Arrival      |
| D073 | Rows                                | Tags pop in                                                  | Arrival      |
| D074 | Checks                              | Marks pop and turn into place                                | Arrival      |
| D075 | Figures                             | Figures rise as a group                                      | Arrival      |
| D076 | Figures                             | Large numbers lift out of their line                         | Arrival      |
| D077 | Statistics                          | Cards flip up (counts stay exact; counters.ts)               | Arrival      |
| D078 | Vision / mission                    | Panels arrive from opposite sides                            | Arrival      |
| D079 | Timeline                            | Entries slide in along the line                              | Arrival      |
| D080 | Timeline                            | Dates lift in ahead of entries                               | Arrival      |
| D081 | Notices                             | Open from their leading edge                                 | Arrival      |
| D082 | Tags                                | Pop in (outside rows and the band)                           | Arrival      |
| D083 | What we do                          | Programme icons turn into place                              | Arrival      |
| D084 | Sub-navigation                      | Links slide in                                               | Arrival      |
| D085 | Contact                             | Contact options rise in turn (the form is untouched)         | Arrival      |
| D086 | Apartments                          | Facts and principles arrive as small groups                  | Arrival      |
| D087 | Split layouts                       | Paragraphs follow their heading                              | Arrival      |
| D088 | Update article                      | Details settle under the title                               | Arrival      |
| D089 | Updates                             | Empty state rises gently                                     | Arrival      |
| D090 | Inner page hero                     | Arch artwork slides toward the pointer                       | Pointer      |
| D091 | Inner page hero                     | Arch artwork turns a few degrees with it                     | Pointer      |
| D092 | Inner page hero                     | Breadcrumb settles with a short nudge                        | Load         |
| D093 | Footer                              | Columns rise in a wave                                       | Arrival      |
| D094 | Footer                              | Each column's links slide in                                 | Arrival      |
| D095 | Footer                              | Logo turns into place                                        | Arrival      |
| D096 | Footer                              | Social links pop in                                          | Arrival      |
| D097 | Footer                              | Wordmark rises from below its baseline                       | Arrival      |
| D098 | Footer                              | "Get in touch" arrow turns in (buttons stay still)           | Arrival      |
| D099 | Footer                              | Bottom line settles                                          | Arrival      |
| D100 | Cards, stats, facts, columns, steps | Soft light under the pointer                                 | Pointer      |
| D101 | Header                              | Dropdown links cascade in (hover or keyboard)                | Hover        |
| D102 | Buttons                             | Light sweep crosses the button                               | Hover        |
| D103 | Text links                          | Heavier underline sweeps across                              | Hover        |
| D104 | Rows                                | Row warms; number takes the accent                           | Hover        |
| D105 | Tags                                | Lift                                                         | Hover        |
| D106 | Footer socials                      | Icon turns                                                   | Hover        |
| D107 | Carousel                            | Arrows nudge in their own direction                          | Hover        |
| D108 | Cards                               | Label steps toward the arrow                                 | Hover        |
| D109 | Model                               | Stage number grows                                           | Hover        |
| D110 | Checks                              | Mark turns                                                   | Hover        |
| D111 | Pillars                             | Link arrow disc slides forward                               | Hover        |
| D112 | Pillars                             | On every new choice the list cascades in                     | Selection    |
| D113 | Governance                          | Each step number pops as it lights                           | Scroll state |
| D114 | Model                               | Current node swells while it is read                         | Scroll state |

These come on top of the six homepage scenes and shared behaviours from the earlier release (masked headings,
image windows, route drawing, orbit, model ring, closing thread, filter FLIP and more), which also run on desktop.

## Scroll tones (added 15 November, D115–D129)

The owner reported that a PC showed no scroll animation at all. The cause was `page-lifecycle.ts` treating
Chrome's `effectiveType: "3g"` as a slow connection: Chrome reports "3g" whenever round trips are long, which is
usual on good connections in Uganda, so desktops were put in lite mode and every scripted scroll effect was
skipped. Lite mode now needs Data Saver, a 2G connection or under 2 GB of device memory.

On top of that, fifteen continuous scroll "tones" now run on desktop as CSS scroll-driven animations
(`animation-timeline: view()`) on the individual `translate`, `scale` and `rotate` properties. They run on the
compositor without script and compose with the GSAP arrivals, which own `transform`. Chrome, Edge and Safari 26
support them; other browsers keep the static layout plus every scripted effect above. Sections that used
`overflow: hidden` (campus, route, practice, projects) now use `overflow: clip`, because a hidden-overflow
section is its own scroll container and froze the tones inside it.

| ID   | Where                                                          | Tone                                                                |
| ---- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| D115 | Section headings                                               | Rise a little faster than the page (nearer plane)                   |
| D116 | Lead paragraphs                                                | Counter-drift, separating heading and text in depth                 |
| D117 | Card grids                                                     | Second column scrolls fastest                                       |
| D118 | Card grids                                                     | Third column scrolls at half speed                                  |
| D119 | Statistics, practice columns, governance steps, footer columns | Alternate items stagger                                             |
| D120 | Model stages, rows, timeline, trust points, checks             | Wheel: ease in from the margin, align at the reading line, ease out |
| D121 | About portrait                                                 | Zooms through: smallest at entry, fullest at centre                 |
| D122 | Campus window                                                  | Swings a couple of degrees across its pass                          |
| D123 | Route drawing                                                  | Tilts like a turning road                                           |
| D124 | Campaign panels and programme stage                            | Grow to full size as they arrive                                    |
| D125 | Footer wordmark                                                | Glides left as the page ends                                        |
| D126 | Published figures                                              | Grow to full size at the reading line (values unchanged)            |
| D127 | Partnership invitation                                         | Floats up against its backdrop                                      |
| D128 | Section eyebrow dots                                           | Swell once as the section crosses the middle                        |
| D129 | Section heads                                                  | A crimson-to-blue rule sweeps under the heading                     |

Total desktop effects: 129, plus the six homepage scenes and shared behaviours.

## Verification

- The director is its own 14.8 KB chunk (`desktop.*.js`), fetched only when the desktop query matches; phones never load it.
- `npm run validate`, `tests/navigation/motion.cjs` (now also asserting the director is active and centred at 1440 px and absent on a phone), `tests/navigation/browser.cjs`, `tests/navigation/wfe-redesign.cjs` (45), `npm run test:browser` (185), `tests/operations/browser.cjs`: pass.
- `tests/quality/a11y.cjs`: 0 axe WCAG 2.2 A/AA violations on 31 pages at 1440 and 390 px.
- `tests/quality/responsive.cjs --strict`: no failures.
- `tests/quality/speed.cjs`: within budget; budgets unchanged. Home on the throttled phone: LCP 1828 ms, 256 KB, 267 ms blocking. Before splitting the director out of the shared bundle the home page exceeded its 400 ms blocking ceiling (426 ms); splitting fixed it.
- A scroll-through of 12 desktop routes leaves nothing hidden (only the abstract route marker and model dot rest at opacity 0 by design) and no console errors.
- Not tested: real hardware, Firefox, Safari/WebKit; headless Chromium only.
