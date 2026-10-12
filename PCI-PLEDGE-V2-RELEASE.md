# PCI country-first pledge update — 12 October 2026

## Scope

The existing Walk for Education campaign and contribution pages now share prominent Uganda, Kenya and
International choices, a searchable 199-country list, clear local unit prices, and persistent step selections.
The design retains PCI's campaign palette, typography, marks and approved imagery. The full country list is
available through a native disclosure, keeping the pledge controls prominent on small screens.

Saved pledges remain on the website with their server reference, an explicit WhatsApp action, a copyable message,
and a private record link. Clipboard failure leaves the message selected for manual copying. Session-storage
failure retains private pledge recovery through same-origin browser history state rather than URL tokens.
Verified Joshua contact routing is shared across campaign and contribution scripts.

## Data and approvals

- Uganda remains UGX 5,000 per step; Kenya remains KES 200. Every generated price is numerically unchanged.
- International prices are labelled indicative and remain pledge-only. No manual currency override was added.
- Payment configuration, database schema, stored pledges, reconciliation, receipts and certificate rules are unchanged.
- The unconfirmed +256 794 671 770 contact, unspecified Kenya line, new finance rates, analytics, dates, partner
  changes and field updates were omitted. PCI approval is still required before adding those facts/features.
- No real pledge, donation, WhatsApp message or payment was sent during QA.

## Baseline and workflow

Baseline `main`: `954ca90283f5781e8c9d6e64abc8fb9acd7ad3fc`.
Before editing, production campaign/contribution HTML, pricing data and the three relevant JavaScript files
matched that commit. Its cPanel deployment and front-end quality workflows had succeeded.
Implementation branch: `codex/pci-pledge-v2`.

The repository deploys `main` through `.github/workflows/deploy.yml` to cPanel. The workflow excludes tooling,
documentation, tests and server-only live registers; this release does not change deployment settings or secrets.
Node quality helpers and isolated PHP fixture cleanup also received Windows portability corrections so the
existing checks can run on this workstation.

## Verification

- Final isolated tests: **81 ledger checks, 54 HTTP checks and 187 browser checks passed**.
- `npm run lint` passed ESLint, Stylelint, Prettier, hover safeguards, generated-price consistency, 30 public-page
  checks and all asset content hashes. `git diff --check` passed.
- Verified UG/KE amounts, 199 countries, searchable selection, whole-step validation, server tampering rejection,
  duplicate-submit protection, URL/session precedence, refresh and Back, blocked storage/clipboard, private-record
  recovery, missing/delayed pricing files and scripts, reduced motion and keyboard behavior.
- Both pages fit widths 320–1920px; the requested phone/tablet/desktop sizes were included. Kenya controls and the
  KES unit rate are visible in the first contribution viewport at 375px. Mobile/desktop screenshots were reviewed.
- Certificate fixtures confirmed pending/pledged states stay locked and verified payment fixtures retain download
  behavior. Test fixtures used isolated data and made no real donations or WhatsApp sends.
- Local network sample: campaign 18 requests / 1,888,768 bytes before and 20 / 1,909,881 after; contribution form
  16 / 1,268,738 before and 18 / 1,299,220 after. The added shared controls/contact scripts cost approximately
  21 KB and 30 KB respectively. No failed local requests or overflow were observed; these are not production
  Lighthouse scores or guaranteed performance metrics.
- Physical iOS/Android devices, real screen-reader use, Lighthouse, recipient identity verification, real WhatsApp
  delivery and a real payment remain **not verified**. Existing approved facts and finance gates are preserved.

Production deployment evidence belongs to this branch's GitHub pull request and its associated cPanel workflow.
The owner handover records the deployed merge SHA, live smoke checks, exact URL and workflow result.

## Rollback

Revert the release merge commit on `main`, retain all subsequent unrelated commits, and let the existing cPanel
workflow finish. Never delete the private ledger or overwrite live server configuration during rollback.
Check the campaign and contribution pages and verify that finance data remains untouched.
