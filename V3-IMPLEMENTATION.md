# PamodziCI V3 implementation and release review

## Deployment contract

The real homepage remains **`index.html` in the repository root**. It contains complete static content, links and metadata; it is not a redirect or a JavaScript app mount.

Astro 5 and TypeScript are an authoring layer, not a replacement PHP runtime. `npm run build` generates 13 institutional/review documents and exports them to root `index.html` and the existing page directories. `_astro/` holds generated styles, scripts and self-hosted Latin variable fonts. cPanel serves these files alongside the unchanged campaign APIs.

`npm ci && npm run validate` checks types, builds, exports, lints, checks page structure and asset hashes, verifies protected bytes and runs navigation/content tests. Generated HTML is committed so an upload does not depend on a server-side Node process. Edit `src/`, then rebuild; do not hand-edit generated institutional HTML.

## Implemented scope

| Area | Implementation |
| --- | --- |
| Design system | Africa63-derived ink/paper/bone/gold palette, semantic tokens, Fraunces and Montserrat variable fonts, responsive layout and a noindex `/design-system/` review page. |
| Homepage | Cinematic responsive hero, orientation strip, institutional statement, programme rows, nine-stage model, asymmetric projects, work in practice, separate campaigns, partnership invitation, updates fallback, governance reminder and closing/footer invitation. |
| Navigation | One configuration powers desktop navigation, full-screen mobile navigation and footer links. Native modal dialog, focus management, inert background, scroll restoration, Escape, rapid state changes, internal menu scrolling and lifecycle cleanup. Static details navigation works without JavaScript or dialog support. |
| Institutional routes | About, What We Do, Model, Projects, Impact, Partnerships, Governance, Updates, Contact, Apartments and Community pages use the new shell. Existing narrative, objectives, values and governance text is retained in content collections. |
| Project discovery | Shared project records and status/category metadata, genuine concept/programme variants, accessible status filters, appropriate supplied imagery and labelled campus context. No stock image is presented as evidence of a project. |
| Model | All nine stages and readable stage summaries remain in static HTML. Keyboard focus and normal anchors highlight the pathway; JavaScript is optional. No scroll-jacking. |
| Publishing | Pages, projects and updates have validated collection schemas and source/publication metadata. Existing public copy is marked `existing-public`; no fabricated review date or content owner approval is claimed. Draft updates do not render. Approved articles have a reusable route template and appear in shared feeds. |
| Contact | Isolated PHP endpoint with fixed server routing, validation, CSRF/session protection, honeypot and anonymous rate limiting. The UI retains entered details on failure and supplies an email draft. |
| Faith in Motion | Separate `css/fim-v3.css` adds variable typography, editorial surfaces, simpler controls and responsive refinements across its seven existing pages. Financial IDs, scripts, source register and calculations remain unchanged. |
| Motion | Page-scoped effects; GSAP and desktop Lenis load after core navigation. Cleanup covers effects, ticker, observers, listeners and bfcache re-entry. Core content is visible before motion and with reduced motion. |
| Measurement | Optional `pci:engagement` event hook exposes only event names and internal route paths. No analytics service, visitor identifier, private form content or contributor data is added. |
| Release workflow | Existing cPanel workflow excludes authoring/tooling files, validates the root entrypoint and protected campaign files, and runs service and browser regression suites before upload. |

## Protected baseline

Baseline commit: `15e13113ca838bfec2b193d6a52f6cedca7f61bb`.

`tests/protected-campaign/baseline.json` fingerprints 130 existing files: Walk for Education and contribution documents, campaign assets, PHP services, admin consoles, legacy styles/scripts, step pricing, brand masters and financial data sources. `npm run check:protected` fails on any changed or removed file.

The new institutional shell never imports the campaign shell. Navigation to campaigns uses ordinary document links. There is no global ClientRouter or transition interception that can inject the new shell into a protected page. Existing root-level `.html` compatibility files are retained.

## Contact configuration

Direct form delivery remains disabled by default. Configure all three environment values on cPanel only after the destination and sending mailbox are verified:

```
PCI_ENQUIRY_ENABLED=1
PCI_ENQUIRY_TO=<approved recipient mailbox>
PCI_ENQUIRY_FROM=<authorised sender mailbox on the hosting account>
```

No user input selects the recipient. PHP `mail()` acceptance is described as acceptance for email delivery, not proof that the recipient received it. Test an actual message, reply routing and provider spam handling on staging before enabling production. A delivery failure keeps the email-draft pathway available. No enquiry content is stored in a public file or campaign ledger.

## Validation evidence and remaining gates

The unchanged baseline passed its original lint, formatting, pricing, page and cache-hash checks before implementation.

Local checks include Astro type/build checks, lint/format checks, local destination/fragment/ID checks, no-JS content checks, nine navigation/content tests, and byte-level protected-file comparison. Local results: **81 ledger checks, 54 payment HTTP checks and the new enquiry validation/delivery fixture passed**, with no live payments or external emails. The original PHP fixture suites exercise payment pricing, pledge separation, provider verification, reconciliation, certificate eligibility, reversals and privacy against isolated storage. The enquiry fixture uses a local sendmail stub and never sends to an external mailbox.

Real-browser suites are configured in CI, including the existing campaign suite and institutional viewport/menu checks. The current managed environment does not expose the required browser-control capability, so no local rendered screenshots, real-device review, axe results or Core Web Vitals are claimed. DOM tests do not replace native Safari/Chrome testing.

Before production approval:

1. Require successful CI service, campaign browser and institutional browser checks.
2. Review staged rendered pages at 320, 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px; test iOS Safari and Android Chrome, large text, landscape and reduced motion.
3. Confirm approved imagery, project lifecycle states, historical impact claims, campaign summaries and contact destinations. Stage summaries are explanations of the model, not reported outcomes.
4. Verify form mailbox delivery if enabling it. Preserve fallback until that gate passes.
5. Measure accessibility, LCP/INP/CLS and slow-connection behavior. Performance targets remain goals, not measured results.
6. Keep Walk for Education journeys unchanged, including currency/country, steps, pledges, payment availability, result transitions and certificates.

## Rollback

Keep the baseline commit and a backup of the current cPanel files before deployment. The workflow uploads files without deleting server-only campaign registers or private SQLite storage. Restore the previous known deployment or revert the V3 merge if needed; private payment/contribution records must never be replaced with repository fixtures.

Production deployment is triggered by `main`. The implementation branch and draft pull request are review artifacts. Do not merge until the staging gates and the user's final production approval are complete.
