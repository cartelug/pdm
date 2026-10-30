# Pledges and branded public updates — 29 October 2026

## Scope

Neeza authorised implementation of the pledge/WhatsApp/register/report plan on 29 October, with the explicit constraint to build on the current interface. Public desktop/mobile layouts, stylesheet files, navigation, section order, prices, payment channels and checkout gates are preserved.

Base commit: 384367e72a73305cf29db62d6cc36369c3cc8bce.

## Delivered behaviour

- Joshua's existing console has **Download latest campaign update PDF**. The public live panel offers the same aggregate-only document without sign-in.
- /walk-for-education/accountability/#collections opens the existing live panel. The existing campaign reporting link now says **See latest figures**.
- Public report totals and timestamps come from a consistent server read. The public response is an explicit field allowlist: no private rows, contact details, transaction evidence or supporter list.
- Existing inline collection fields use the canonical manual-plus-gateway projection. Their previous gateway-only fetch is retired, avoiding conflicting totals. Accountability copy describes the current pledge/external-contribution workflow within its original cards.
- Staff can search and page through website and manual records together. Original records are read, not duplicated. Eligible linked receipts determine part-paid/paid balances. Existing manual and gateway write permissions remain separate.
- A saved pledge offers its group invitation/copy fallback and a branded pledge-confirmation PDF. No message is sent automatically. A pledge does not unlock a paid receipt or certificate.
- Authorised publishers can update the campaign group invitation from a disclosure inside the existing walk section. The URL is restricted to the WhatsApp invitation host. The action is CSRF-protected and audited; it cannot edit payment channels or financial totals.
- PDF engines/fonts load only on demand. The public update and pledge confirmation use approved logos and the two embedded house fonts.

## Documents

The two files under assets/operations/samples, PCI-SAMPLE-campaign-update.pdf and PCI-SAMPLE-pledge-confirmation.pdf, contain only synthetic, clearly labelled sample data. Regenerate explicitly with node scripts/refresh-campaign-report-samples.mjs. Normal builds never regenerate reports or write ledger records.

Public PDFs are fixed snapshots. Editable private PDF and Excel exports remain available; offline edits never write back.

## Reviewed protected changes

- js/contributions.js: add private pledge document and optional copy/group handoff; preserve save, validation, request identity, prices, CSRF, private viewer tokens and certificate gates.
- js/campaign-contacts.js: bind the approved configurable group invitation without changing the coordinator identity.
- js/wfe-shell.js: preserve chooser/menu and availability gates; hand existing inline collections fields to the canonical public projection and clarify pledge-only availability text.
- contribute/index.html and contribute/payment/index.html: add report loader and pledge-download controls in existing confirmation panels. The result-page frozen fragment changes only by its added pledge-confirmation button. Existing status, receipt, certificate and viewer hooks are unchanged.
- Walk home/Accountability: reporting-link/copy updates within existing elements; related pages receive asset cache hashes only.

The two contribution pages' script inventories gain only campaign-downloads.js immediately before the existing contribution script. No old script, field or hook is removed. No form fragment, payment channel or certificate rule is changed.

## Verification

Local fixtures cover public/private boundaries, named roles, the unified register, linked partial balances, separate currency totals, duplicate protection, report source consistency, safe group settings and unchanged checkout state. Existing payment, account-setup and enquiry suites remain required.

Actual PDF files are generated and rendered for inspection. Tests check the house fonts/logos, page continuation, empty state, private/public distinction and links to the current figures.

The GitHub quality workflow runs browser acceptance for Joshua's public PDF, anonymous public downloads and pledge-confirmation downloads, plus the existing payment, image, motion, accessibility and responsive suites. Release requires those checks to pass.

## Operations and rollback

Production named-account activation, real imports and finance reconciliation remain host/PCI responsibilities. No production record or private configuration is changed by this release.

Rollback reverts source only. Preserve the live private SQLite ledger, private configuration and later transactions. The group setting uses the existing settings table and does not alter historical finance rows.
