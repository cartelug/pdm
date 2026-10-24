# Operations release acceptance — 24 October 2026

All data-writing acceptance checks use isolated synthetic storage. No live transactions, real supporter records, social invitations or Pesapal requests were created.

| Check | Observed result |
| --- | --- |
| Astro types/build, ESLint, Stylelint, formatting, pricing, pages, asset hashes and canonical gates | `npm run validate` passed |
| Protected files and frozen fragments | All 130 protected files match the explicit reviewed baseline; original hooks/field constraints/fragments remain checked. Only the new public script was appended to each Walk hook inventory, preserving the original ordered prefix. |
| Existing payment ledger | 81 checks passed, including verification, price/currency snapshots, reconciliation, reversals, certificates and backup recovery |
| Existing payment HTTP | 54 checks passed |
| Enquiry HTTP | Passed session/CSRF, origin, validation, honeypot, routing, isolated acceptance and rate limits |
| New operations HTTP | 65 checks passed: pending UGX 500,000 adds 0, reconciliation adds exactly 500,000, request/transaction/import duplicates, partial receipts and reversals, gateway overlap, separate currencies, gateway-pledge allocation, combined partial-step funding, atomic batch rollback, named roles, private-field exclusion, consent withdrawal, drafts/versions/revert, immutable snapshots and closed checkout |
| New browser/exports | All 15 template/ratio combinations downloaded actual PNGs with exact 1080×1350 / 1080×1920 / 1080×1080 dimensions. Local fonts/logos decoded; long headline/name and large amount outputs inspected. Consent withdrawal rechecked at export. Approved photo upload and publication succeeded in an isolated fixture and the fixture image was removed. |
| Owner updates | Same dated story/distance appeared on homepage, projects and Walk without any build. Unavailable API showed an unavailable message, without a fabricated zero. |
| Existing campaign browser | 184 checks passed |
| Existing Walk redesign/menu browser | 41 checks passed, including repeated menu lifecycle, viewport geometry, focus, scroll locking, field contracts, typography and axe scan |
| Institutional navigation browser | Passed responsive routes, modal lifecycle, reduced motion, filtering and no-JS navigation |
| Motion browser | Passed entrance, scroll effects, filtering/reflow, reduced motion, phone width and no-JS |
| Accessibility | Axe reported zero WCAG 2.2 A/AA violations on 30 public pages at 1440 and 390 px |
| Responsive strict gate | 570 page/viewport measurements (30 pages × 19 configurations), including 320/390/768/1024/1440 px, landscape and 200% text; no responsive failures. Non-blocking legacy typography/breakpoint/image-dimension advisories remain in the report. |
| Speed budget | All 8 benchmark routes passed existing LCP, transfer and blocking budgets |
| Staff guide print QA | Two-column A4 print content measured about 801 px high within a single page; phone-readable HTML remains available |

The apartment-promotion assertions in V3/navigation/motion tests were updated to the explicitly requested retirement and Walk-first/Faith-second ordering. Motion filtering still verifies a real remaining Pipeline card and restores all four approved cards. No financial, protected-fragment, navigation or layout gate was removed or disabled. Financial functional changes are recorded separately in `functionalReviews`; presentation changes do not claim to authorise finance behaviour.

Source completion is distinct from production readiness. See `../OPERATIONS-HANDOVER.md` for private account provisioning, actual register import/reconciliation, owner approvals, social-owner steps, deployment verification and rollback that retains finance data. Source/fixture checks do not establish that a cPanel upload or production account setup has succeeded.
