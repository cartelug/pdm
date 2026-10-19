# Walk for Education — full redesign brief

## Master implementation prompt

Redesign the existing Walk for Education campaign overview at `/walk-for-education/` as a complete, exceptionally polished mobile-first editorial experience. Use the actual `cartelug/pdm` implementation, not a disconnected mockup. Keep root `index.html`, the institutional website, Faith in Motion and the existing contribution/payment services intact. The user's instruction of 19 October 2026 explicitly authorizes redesigning this campaign page; it supersedes the earlier institutional V3 presentation exclusion for this page only.

Use self-hosted Fraunces Variable for expressive display typography and Montserrat Variable for body copy, navigation and every control. Build a coherent palette of warm ivory, deep navy, bright cyan and restrained warm gold. Give each section its own composition while retaining a clear typographic hierarchy. Avoid interchangeable card grids, decorative clutter and text baked into images. Keep campaign facts, amounts and actions as live HTML.

Lead with “Every step builds a future.” Explain both beneficiaries immediately: UCU–Kagando University College and the neighbouring Kagando Nursery & Primary School. Use the reference-led Walking Rotarian hero, black bag and campus imagery as a unified visual story. Integrate all 20 generated campaign artworks and all 36 school/university-life images: place selected images in the narrative, then make the complete collection accessible through a filterable, progressively loaded gallery and keyboard-accessible image viewer. Keep the ten supporting SVG visual designs available as clearly labelled campaign resources. Reuse both full and 800w responsive WebP variants. Do not ship the PNG master archive to production or load the entire collection on first paint.

## Narrative and layout

1. Compact campaign header with PCI identity, campaign navigation and a clear pledge action.
2. A spacious hero that introduces the education mission, Shyaka Mbanda and the approximate Nairobi-to-Kagando journey. State that walk dates remain unconfirmed.
3. A prominent, country-led pledge chooser, with all existing IDs, hooks, prices, bounds, referral handling, session continuity and service-state rules retained.
4. Clearly attributed campaign coordination and institutional partnership roles.
5. An education story connecting first discoveries to university possibilities, using labelled illustrative imagery.
6. The five-year UGX 25 billion mobilisation ambition and its five source-supported priorities. A target must never look like money received.
7. A thoughtful Walking Rotarian/journey section with the two high-level endpoints, approximate 1,100 km distance and a conceptual route line. Do not invent confirmed stages or dates.
8. Five steps / five friends invitation, voluntary participation and an explicit pledge-only explanation.
9. Separate pathways for individuals, Rotary/community groups and institutional partners. Preserve source partnership levels and enquiry parameters.
10. A clear accountability section describing pledge → payment/report → finance verification → approved publication. Show received totals only when verified data exists; provide a useful explanatory state otherwise.
11. Approved campaign briefings and field updates from the existing canonical campaign record.
12. A complete image gallery and campaign resources, followed by the existing certificate eligibility explanation, direct-channel guidance, FAQs, closing pledge appeal and useful campaign footer.

## Mobile experience

- Design at 320, 360, 390, 430, 768, 1024 and 1440 pixels. No horizontal document overflow.
- Mobile hero copy precedes a deliberately framed portrait; faces, backpack and headlines must remain legible. Never shrink the desktop collage into an unreadable phone layout.
- Use 44px or larger primary controls, readable labels, 16px form inputs, comfortable line lengths and a single-column pledge flow.
- Keep the exact country/currency selector and 100 / 50 / 20 / 10 / 5 step choices, with 50 suggested and custom whole steps from 5 to 20,000.
- Preserve query strings, country, selected steps and ambassador referral values when continuing to `/contribute/`.
- A safe-area-aware bottom pledge shortcut appears after the hero and hides while the step chooser, a form, the closing appeal or an image viewer is active.
- The mobile menu must lock background scrolling, manage focus, support Escape, close after navigation, and return focus to its trigger when dismissed.
- Gallery filters wrap on phones; show a small first page, load more deliberately, support image previous/next controls and keyboard arrows, and return focus when the viewer closes.

## Motion

Use a coordinated hero entrance, staggered section reveals, a drawing journey line, restrained desktop image parallax, image hover treatments, responsive menu transitions, progress indication and polished gallery/viewer transitions. Use transform and opacity where practical. Do not hijack scrolling, invent totals or inflate meaningful figures. Content remains readable without JavaScript. Respect `prefers-reduced-motion`, reduced-data preferences and a visible motion toggle. Decorative motion must never delay a pledge action or hide content permanently.

## Original-plan invariants

- A pledge is a promise, not money received. A payment report is not confirmation.
- Country prices continue to come from the current pricing service. Uganda is UGX 5,000 per symbolic step with a five-step minimum. Preserve the other approved country rates as implemented.
- Keep payment availability service-driven. Do not switch on Pesapal or claim live checkout works before the existing production activation gates are fulfilled.
- Only authorised, reconciled live payments enter public received totals. Pending, test, duplicate, reversed and merely pledged amounts must not become received funds.
- Certificates remain available only under the existing verified-live-payment rules. A design preview does not imply eligibility.
- Keep existing pledge references, ledgers, private payment data, admin roles, recognition consent and campaign publishing workflows unchanged.
- Preserve approved direct channels from the canonical record and their exact recipient details; do not infer new sponsorship from a payment brand.
- Use “Rotary” as a generic participation route. Do not add an unconfirmed club or present historical logo artwork as a newly confirmed partner.
- Label generated campus-life scenes and campaign composites as illustrations. They depict fictional people and concepts; the building reference is UCU–Kagando, not documentary photography of the neighbouring primary school or completed construction.
- Existing source-proposal student figures retain their historical/planning qualifiers.

## Release and evidence

Keep the redesign scoped to this campaign overview and its new presentation assets. Run repository checks and meaningful campaign regression tests. Verify links, image availability, gallery coverage, keyboard interaction, focus, reduced motion, overflow and country/step calculations. Capture desktop and phone screenshots during implementation and after corrections. Record any environmental verification limit accurately. Update the protected-file baseline only for this explicitly authorised presentation change, retaining every other recorded hash. Commit and push the finished, verified state directly to `main` as requested, then inspect the existing cPanel deployment workflow and production page. Do not claim universal perfection or a successful deployment without evidence.


## Implementation verification / 19 October 2026

- All 20 campaign illustrations and 36 campus-life images are integrated, with 112 responsive WebP files and ten supporting SVG resources.
- The complete collection is available through filters and a progressively loaded modal gallery. Only nine gallery thumbnails appear initially.
- Self-hosted Fraunces and Montserrat render in the browser.
- Layout checks pass at 320, 360, 390, 430, 768, 1024 and 1440 pixels.
- 181 existing campaign browser checks, 25 redesign browser checks, 81 ledger checks and 54 payment HTTP checks passed locally. Institutional enquiry fixtures passed without sending external mail.
- The build, source checks, protected-file guard and 13 source/navigation tests passed. Only the explicitly authorised campaign overview presentation is updated in the protected baseline.
- The redesigned page passed the automated WCAG A/AA scan, including contrast and accessible control names. Menu focus, Escape handling, gallery arrow keys, focus return and reduced-motion preferences were exercised.
- Throttled phone lab test: median LCP 3,060 ms; initial transfer 336 KiB; blocking time 595 ms. All are within the repository's existing campaign ceilings. These are local lab measurements, not field performance guarantees.
- Production checkout activation, payment verification and finance publication retain their existing gates. No live payment, pledge submission, enquiry message or finance record was created during redesign testing.
