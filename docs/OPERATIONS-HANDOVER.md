# PCI live operations — 24 October 2026

This release adds campaign operations to the existing Astro/static + PHP 8.3/cPanel website. It does not replace hosting, enable checkout or merge Faith in Motion finances.

## Working routes

- `/admin/operations/`: named login, finance overview, contribution entry, verification/reversals, searchable records, register import preview, CSV export, owner/editor updates, history, milestone approval and HD PNG studio.
- `/admin/operations/guide.html`: phone-friendly staff guide with a one-page print layout and short walkthrough.
- `/api/operations.php?action=public`: explicit approved public projection, separate currency buckets, consent-aware supporters and independent walking state.
- `/api/campaign.php`: compatible Walk projection from that same source. The old shared-password POST now returns 410 and points to the named console.
- Homepage, `/projects/` and all Walk pages: approved live panel; open pages refresh each minute, and new page loads fetch without a rebuild.
- `/apartments/`: noindex fallback to current projects plus an Apache directory-level 301 rule. Historical content files remain in git as draft records. The root host configuration is untouched.

## Financial contract and scope

The existing private `collections.sqlite` remains outside the document root. Additive `ops_*` tables hold immutable manual entries, allocations, consent, update versions and financial snapshots. Existing contribution rows, payment gates, certificates and price snapshots remain intact.

Public received funds = itemised live manual receipts with finance reconciliation, plus successful finance-reconciled live gateway receipts. A matching gateway identity takes precedence, so its manual overlap is excluded even if it was previously reconciled. No old aggregate or spreadsheet “paid” label is added. Duplicate transaction keys ignore case and punctuation; request and original-source-row keys are unique. Conflicting source rows require an audited reversal and replacement; imports never silently rewrite them. Original source-row values are retained in private notes; map an optional payment/pledge type when the register contains both. Entire import batches commit or roll back together.

Amounts use integer **whole units** in the selected currency; decimal amounts are rejected, including for USD/GBP/EUR. No exchange conversion is applied to the new public projection. Existing gateway console summary tiles still label their historical UGX-at-step-value display; the new console and public reporting are canonical per-currency accounts. The gateway public progress endpoint now reports actual UGX only and gives separate public currency buckets.

Pledged totals, outstanding pledge balances and the remaining approved milestone are distinct. Manual partial receipts can link to either manual pledges or existing gateway pledges in the same currency. Unknown historic step prices default to zero (no invented sponsored steps). Confirmed manual steps use the stored country/unit snapshot, grouping partial receipts for the same pledge and price before counting fully funded steps; gateway step snapshots remain unchanged. A reversal excludes the receipt and restores outstanding balances without deleting history.

The canonical source calls UGX 25 billion the **five-year ambition**. UGX 25 million is proposed only; no operational milestone is published until finance/admin records its amount, currency, label and approval evidence. Public projection omits that evidence and account identity.

Gateway refund, status verification, reconciliation and certificates remain in `/admin/collections/`. New operational receipts do not issue Pesapal certificates. Reports contain manual and gateway rows and an `included_received` flag; summing every CSV row would include pledges, pending receipts and overlaps. Public recognition defaults to unpublished, separates name/amount consent, and records every change. Withdrawal disappears on the next poll/page refresh; previously downloaded or externally posted images require manual removal.

## Named access — host owner action required

The fast setup and standard coordinator/finance arrangement is documented in `QUICK-START-SETUP.md`. Joshua’s staff walkthrough is `/admin/operations/start.html`. Use `scripts/setup-operations-user.php` for a guided terminal setup with hidden password entry; the existing hash-only provisioner remains available.

No private host configuration or credentials were available in this session. **No account is claimed active and no password is committed.** Both new operations and existing gateway sign-in now require explicitly configured named accounts; the shared-password fallback has been removed. Provision accounts before staff use.

Existing `admin_users` in the private `config.php` is reused:

| Suggested identity, after verification | Role | Permissions |
| --- | --- | --- |
| Neeza | coordinator (standard daily setup) | Records, reports, Walk drafts/preview/publish/revert and graphics; no receipt approval |
| Joshua | coordinator (standard daily setup) | Records, reports, walking updates and graphics; finance approval remains separate |
| Named finance member | finance | Record, review, reconcile/reverse, reports, consent, milestone approval, graphics |
| Named collector | recorder | Record/import/reports; no receipt approval or editorial publishing |
| Shyaka Mbanda | owner | Walk publishing and graphics |
| Named communications member | editor | Walk publishing and graphics |
| Host administrator | admin | All console permissions |

On the host, preserve the existing private configuration. Add each verified person as `username => ['hash' => password_hash(...), 'role' => ...]`. Use a unique securely delivered password, never a shared social password. There is no preloaded user list.

`scripts/provision-operations-user.php` is a CLI-only helper (excluded from web deployment). It accepts a JSON object with `username`, `hash`, `role` over stdin, validates the hash/role, locks and backs up the private config, and atomically preserves all other configuration. Transfer this helper separately if using it on the host. Generate the password hash privately; do not put plaintext passwords or hashes in command arguments, logs, git or handover tickets. Changes to roles require a new sign-in in the operations console.

## Graphics and staff walkthrough

Choose a template, format and data source. `SAMPLE DATA` is a local demonstration object; it cannot enter the ledger. Approved live graphics use an immutable server snapshot with reporting cut-off and verification label. Export reloads that snapshot and rechecks current recognition consent. Fonts and all local brand images are decoded before Canvas PNG export. Templates: collections, weekly report, walk update, approved milestone/steps and supporter thanks. Sizes: 1080×1350, 1080×1920, 1080×1080. Story content sits within Y=310–1600 and X=65–1015. PCI, Walk and Diocese of South Rwenzori artwork is loaded from the existing approved asset set. The backpack is not used. A real watermarked demonstration is at `/assets/operations/samples/PCI-SAMPLE-collections-feed.png`. Long headlines fit dynamically; very long approved stories use a visible ellipsis and the campaign URL.

Walkthrough: sign in → record pending receipt → finance matches actual bank/MoMo receipt and settlement → reconcile → verify public received amount → owner previews/publishes walk state → create approved snapshot → download PNG/report → sign out. Full details are in the staff guide.

## Live dependencies and release verification

1. GitHub deployment requires the existing cPanel SSH secrets and all workflow gates. A successful source push alone does not prove upload or live operation.
2. Host owner must configure named users, writable private storage and the approved photo directory. No production data migration or synthetic upload is performed here.
3. Original contribution registers were not attached to this implementation request. Finance must export original XLSX registers to CSV, retain original row order/source name, preview mapping, resolve missing references/duplicates, import pending, and reconcile each receipt against approved evidence. Synthetic fixtures test the importer; no historical balances are invented.
4. Owner must confirm actual kilometres, dated location, activity state, physical state and approved photograph before publishing. Phone uploads are resized/re-encoded without original EXIF metadata; the public raster file is written only after an explicit approval checkbox. No current stage is inferred from chat history.
5. PCI must approve the operational milestone and establish valid supporter consent. No public names are seeded.
6. Social identities/access remain owner-controlled; no invitations or external messages are sent and no permissions are claimed active. See `SOCIAL-OWNER-STEPS.md`.

## Rollback that preserves finance data

Close writers/checkouts and take a private SQLite snapshot with the existing backup tool; copy the DB plus WAL/SHM under host procedures before touching data. Revert the website source commit or redeploy the previous tested code; do **not** restore/delete the live database, remove `ops_*` tables, overwrite private config, or copy synthetic fixtures into production. Old code will ignore additive tables. The previous shared-password publisher must remain disabled when rolling back presentation; do not reintroduce its unverified manual totals. Keep an export and audit trail of receipts after the release before any later migration. If a database restoration is exceptionally required, use the separately approved host recovery procedure and recheck post-snapshot transactions before reopening.
