# Walk for Education: current corrections and collections plan

The campaign is underway. The website must say so consistently, while leaving the current stage, dates and cumulative kilometres unconfirmed until an approved update is published.

## Current pledge list

Neeza supplied 78 entries on 27 October 2026: **3,563 steps at UGX 5,000, worth UGX 17,815,000**. All are pledges awaiting payment confirmation. This list is not a verified received balance. Preserve the three half-step entries and entry 44's 1.5 steps. Entry 8's supplied amount `300,00` is normalised to UGX 300,000 from 60 steps, with the source issue retained for review. Similar names are distinct rows, not automatic duplicates.

The private import CSV and editable working files are delivered separately. Do not commit supporter lists or private ledgers to this public repository. The list's record date is 27 October, not an asserted original pledge/payment date. Country and transaction references remain blank where not supplied.

## Daily workflow

1. Open `/admin/operations/` using an activated named account.
2. Use the stable source name `Neeza Walk for Education pledge list 2026-10-27`. Upload the supplied CSV, map columns with the matching field names, preview all 78 entries, and import the whole batch as `pledge`. Original row data is retained in private notes. Repeating the same source and row order flags duplicates for review.
3. Check the pledge control: 78 entries, 3,563 steps, UGX 17,815,000. Do not replace existing ledger records or add this to an earlier aggregate. If a person is already recorded under another source, resolve that candidate before importing it again.
4. When a payment is reported, add a separate payment linked to its pledge, with amount, currency, date, channel and transaction reference. Partial receipts remain separate records.
5. Finance matches bank/MoMo evidence, then reconciles the payment. Only that action changes received totals. Corrections use an audited reversal and replacement.
6. Save current work in the console, then download PDF, Excel, CSV or full report JSON. Every download fetches all saved records and a fresh consistent reporting cut-off; it does not export just the first 2,000 dashboard records.
7. Administrators can also download the full SQLite database. It is a consistent server snapshot, includes all ledger tables and audit history, and must be kept private. Website deployments preserve the private database and configuration.

## Download behaviour

- **PDF:** branded, paginated, editable AcroForm register, with a cut-off, per-currency pledged/received totals and eligibility labels. Offline edits do not change the database or recalculate the fixed summary. Regenerate after saving updates in the console.
- **Excel:** an editable `.xlsx` with Summary and full Register, typed amounts, frozen headers and filters. This is an as-of snapshot; edit the console and download again for authoritative totals.
- **CSV:** existing full manual/gateway report, suitable for transfers and analysis. Count only eligible live receipts and keep currencies separate.
- **JSON:** complete report rows and same-snapshot totals for data portability.
- **SQLite:** administrator-only download of the existing database through authenticated POST with CSRF protection. This is a backup, not a public download link or an automatic restore feature.

## Branding and corrections

Remove Rotary artwork from Walk for Education's share studio, PDF reports and campaign surfaces. Keep the three approved campaign identities: PCI, Walk for Education and Diocese of South Rwenzori. Existing official shirt/backpack photography stays intact. Rotary references describing the walker's title or a club participation route are not standalone Rotary logos. Faith in Motion is a separate campaign and its historical reports remain separate.

Fix the contradictory preparing-to-walk text and outdated shared-password instructions. Preserve pledge minimums, payment channels, checkout gates, certificate eligibility, consent and the separate public received projection.

## Host dependency

Source deployment does not grant access to private finance records. Named account activation and the one-time import need the existing host account. No records from this list are claimed imported or reconciled until the authenticated import succeeds. Public supporter recognition remains subject to recorded consent.
