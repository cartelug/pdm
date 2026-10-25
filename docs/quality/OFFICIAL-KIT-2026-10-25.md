# Official Walk kit and campaign visual release — 25 October 2026

Base: `1c82eb3ff6ab6f6ce807abb8658d8d86a020f6eb`, the current GitHub Pages/cPanel version selected by Neeza. User approved the complete image/website plan and requested one final push to `main` after verification.

## Result

- Twenty distinct reference-led scenes, each with an independently generated landscape and portrait composition: forty accepted images, plus a transparent cutout of the actual supplied bag.
- Original bag and shirt uploads retained unchanged in `assets/wfe-2026/references/`, with their byte hashes checked. Original copies were saved in PCI on Drive before implementation.
- Native-resolution compressed masters and responsive AVIF/WebP variants in `assets/wfe-2026/official-kit/`; the manifest records source hashes, actual dimensions, outputs and illustration provenance. No native-resolution claim is made for an upscale.
- All twenty scenes are integrated across the homepage, Walk page, partners and participation page. The existing site structure, Archivo/Lexend typography, navigation and campaign priority are preserved.
- Actual main-block architecture is the signature reference. New kit replaces generic bag treatments in the hero, product image, bag frames, gallery and historical editorial briefing artwork. Older story derivatives now rebuild from the accepted kit sources.
- Gallery retains its 36 existing campus/school illustrations, with twenty new campaign-art records, individually matched mobile companions and clear imagined-arrival notes. Dialog keyboard/focus behaviour remains intact.
- Hero copy and the canonical source now say the walk is underway, as confirmed by Neeza. A missing start date produces no invented day count, town, kilometres or funds. Existing verification, recognition, payment and staff workflows are preserved.

## Reviewed protected changes

Only nine recorded protected files change: the campaign share image, canonical `wfe-data.js`, the Walk home, four other Walk pages and two contribution pages. The latter changes include cache hashes; no protected API file changes. All eleven frozen contribution/payment fragments remain byte-identical. Existing script order is retained.

The sole inline script hash update is the reviewed JSON-LD description changing “planned walk” to “ongoing walk”. The state machine now handles an explicit walking state without a known start date safely.

The protected record retains the old hashes and authorisation in narrow review entries rather than replacing the original baseline or disabling a gate.

## Image review

Generated each composition separately with the built-in image tool. Inspected face, proportions, clothing, bag form, architecture, supporting people, framing and text space. Corrected the mobile walking-detail anatomy, completed the welcome scene's shirt artwork and removed an unsupported building from the closing scene. Arrival/welcome remains illustrative, not field reporting. Kept printed kit estimates separate from verified progress.

The forty native sources are distinct. The original PNG references remain accessible alongside illustrative treatments. The transparent cutout retains a real alpha range of 0–255. Phone/desktop delivery variants resize without enlargement.

## Verification record

The release uses the existing validation and browser gates plus `tests/pages/official-kit.test.cjs`: forty distinct compositions, decoded delivery files, truthful dimensions/provenance, source-reference checksums and actual integration of all twenty scenes. Gallery browser coverage checks portrait selection, wide selection after resize and clearing the portrait when returning to the school collection.

Observed local results:

- `npm run validate` passed, including the build, type/lint checks, new asset tests, protected records and all eleven frozen fragments.
- Operations HTTP: 74 checks passed. Operations browser tests passed including the fifteen actual PNG export variants, snapshot/consent handling, coordinator workflow and no browser errors.
- Walk browser: 45 checks passed, including gallery source switching, enlarged text, reduced motion, keyboard/focus behaviour and pricing/pledge continuity. Existing payment/contribution browser suite passed (181 PASS assertions). Institutional browser suite passed.
- Axe: zero WCAG 2.2 A/AA violations on thirty public pages at 390 and 1440 px.
- Strict responsive sweep: no failures across the thirty-page, nineteen-configuration suite, including landscape and 200% text. Existing nonblocking typography/breakpoint/image-size diagnostics remain visible in its report.
- Motion regression passed: entrance, scroll effects, filter reflow, reduced motion, phone width and no-JavaScript behaviour.
- Throttled phone speed budgets passed on all eight tested routes. Homepage: 1,804 ms LCP / 267 KB; Walk home: 3,344 ms / 314 KB. The participation page's initially heavy decorative layer was reduced to a 15,654-byte mobile AVIF and retested at 2,480 ms / 320 KB, below its unchanged 2,900 ms / 360 KB ceiling. Full-quality gallery companions remain available.

The first speed run passed the other seven routes; the corrected participation route was then measured again with the same three-run median method. Budget ceilings were not relaxed.

The original planning document and all twenty scene prompts are retained in `docs/PCI-OFFICIAL-KIT-VISUAL-PLAN.md` and `docs/official-kit-prompts.json`. Its planning-time pending status is superseded by this implementation report.

Production publishing is observed through the existing cPanel deployment job for the final commit. Live confirmation is reported after the job completes; pushing alone is not treated as successful deployment. No private ledger, live configuration or staff credential is copied from local tests to production.
