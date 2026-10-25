# Full website redesign guide

This guide defines the next design work from the shipped baseline. It is a continuation plan, not a claim that these future refinements have already been implemented.

## Creative direction

A confident education campaign with a human story: a real walker, a specific university destination, a community participating and a credible way to give. Aim for an editorial nonprofit website with deliberate photography, strong typography, generous useful space and simple decisions. Avoid a long sequence of identical cards or a decorative dashboard full of invented figures.

Within five seconds, a visitor should understand who is walking, why it matters, where the walk leads and the next useful action. The site must make this equally clear on a narrow phone.

## Brand system

Use the tokens already in `src/design/tokens.json` and the institutional aliases in `src/styles/tokens.css`.

| Role | PCI | Walk for Education |
| --- | --- | --- |
| Main paper | `#faf6f1` | `#fbf8f2` |
| Secondary light | `#f2ebe3` | `#f6f1e7` |
| Main ink / deep | `#1b0a0e` / `#220a10` | `#0e1f3a` |
| Primary accent | Crimson `#b71935` | Gold `#c9a04a` |
| Accessible accent ink | `#9b1630` | `#7a5814` |
| Light-surface link | `#9b1630` | `#0b6e8e` |

Keep the identities related through the same Archivo/Lexend system, spacing logic, controls and image treatment. Gold/cyan/sun remain fills or decoration on light backgrounds where their text contrast fails. Use tested dark text on gold buttons. Do not recolour all pages indiscriminately or bake brand text into background images.

## Page-by-page direction

| Page or family | Purpose | Recommended refinement | Preserve |
| --- | --- | --- | --- |
| Homepage `/` | Explain PCI and prioritise the live walk | One clear walking hero; concise purpose; one primary action and one secondary path; visible approved progress; strong campaign order | Institutional source, existing navigation and verified live panel |
| `/walk-for-education/` | Explain the journey and convert interest into support | Improve section rhythm and text measure; keep walking, bag, education and actual-building narrative connected; make choices clear without a crowded hero | Pledge chooser, direct payment cards, gallery, live projection, hooks and protected fragments |
| `/walk-for-education/take-part/` | Give concrete participation routes | Keep one strong action per participation route; tiny decorative background; simple partner/contact path | Existing forms and lightweight `backdrop-18-*` delivery |
| `/walk-for-education/partners/` | Establish credible partnership | Clear roles, restrained logos, real main-block reference and useful partnership CTA | Confirmed versus prospective distinctions; actual building figure |
| Walk updates | Show dated approved field updates | Strong date/location hierarchy, readable stories, obvious latest entry and honest empty states | No fabricated reporting, photos or kilometres |
| Walk accountability | Explain where information and funds come from | Clear distinction between ambition, approved milestone, received funds and reporting cut-off | Reconciliation rules, currencies, consent and source wording |
| `/contribute/` and results | Help a supporter act confidently | Refine type, spacing, errors and confirmation hierarchy around the existing flow | Country/price snapshots, bounds, referrals, sessions, forms, certificates and gateway rules |
| `/projects/` | Explain current priorities | Walk first, Faith in Motion second, then other verified work; concise status labels | Current project data and apartments fallback |
| About / model / what we do | Explain PCI's role | Short opening statement, useful headings, tighter copy measure, selected supporting imagery | Actual organisational facts and existing URLs |
| Impact / governance / partnerships | Build trust | Distinguish evidence from ambition, make documents easy to find, avoid decorative statistics | Verified claims, accountability language and contact paths |
| Updates / contact | Help people follow or reach PCI | Readable update list, clear contact methods, visible form errors and success state | Enquiry action and validation; actual approved handles |
| Faith in Motion family | Preserve its separate campaign record | Consistent typography, restrained archive framing and usable register | Separate finances, register, existing routes and protected behaviour |
| Staff operations | Make daily work obvious | Improve labels and grouping only after walking through the current console with staff | Named roles, recording/verification separation, imports, reports, consent and actual PNG export |

## Recommended Walk story sequence

1. The walker is already on the road: one clear hero message and useful action.
2. What the campaign supports: education, students and the actual main block.
3. How to participate: sponsor steps, contribute through approved channels or join the effort.
4. The person and the effort: Shyaka, official kit, walking details and a human pause.
5. The educational purpose: children learning, older students and the future the effort supports.
6. Verified live progress and dated updates: factual, independent of illustrations.
7. Credible partners and accountability.
8. Campaign art and resources, loaded lazily.
9. A simple closing action.

The current Walk page already tells much of this story. Reorder only after reviewing its IDs, anchors, script dependencies and frozen fragments. Do not remove useful content merely to make a shorter screenshot.

## Image transitions and gradients

Use the twenty accepted scenes as a connected visual narrative, not twenty equally dominant full-viewport backgrounds. Alternate a full scene, a quieter paper section, a detail image and a low-opacity decorative band. Carry a compatible dark or paper colour through adjacent sections so a fade feels continuous.

Keep masks and overlays in CSS. The existing `.kit-scene__media` uses vertical fade-in/fade-out masks, a text-side colour gradient and lower opacity on mobile. `css/official-kit.css` contains the handwritten treatments; homepage grading is in `src/styles/home.css`. Refine these sources rather than repainting image files with text or permanent fades.

Check readability against the brightest actual image region, not an average colour. Preserve faces, the bag message and the building silhouette. Darken the text side with a deliberate gradient; do not make the whole picture dull or add a hard rectangle around every paragraph.

## Phone layout rules

- Compose a true single-column story where space requires it. Use the separate portrait image at the existing 719/720 px art-direction boundary.
- Keep body reading near 16–18 px; controls must remain usable with 200% text and the keyboard open. Prefer 44 px touch targets while preserving the existing stricter gate's rules.
- Give text useful measure and breathing room. Avoid a heading squeezed into a tiny left column beside a portrait.
- Let headings wrap as words, without artificial line breaks for one screenshot. Do not fix text clipping with `overflow: hidden`.
- Keep primary actions discoverable without covering content. Safe-area padding and short landscape screens matter.
- Retain menu focus trapping, scroll restoration, Escape handling and the viewport-sized menu sheet. The Walk header's blur stays on its pseudo-element; a filter on the header itself can break fixed-menu geometry.
- Show the original kit/reference links and illustration labels without making them compete with the main message.

## Motion direction

Use short press/hover feedback, modest panel transitions and restrained entry reveals. Shared token timings are 120/180/240/420/640 ms for press, hover, UI, panel and reveal. Do not animate essential content into permanent invisibility, delay clicks or trap native scrolling. On reduced motion, content should be immediately visible and functional. No-JavaScript navigation and content should remain useful.

## Implementation order

First refine typography and shared spacing on the homepage and Walk hero. Prove phone, tablet, desktop and large-text layouts. Then apply page-level improvements in small groups. Finish the gallery/participation details, SEO/share previews and staff usability checks. Run the full release checks once the final changes are stable. Avoid a framework migration, backend rewrite or new font dependency in the same visual change unless separately required.

Measure the result by clarity, task completion, responsive layout, image selection, contrast and loading speed. “More animations” or “more complex” alone is not evidence that the redesign is better.
