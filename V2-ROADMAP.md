# Pamodzi V2 completion roadmap

This is the working release plan for completing the Pamodzi for Development website without changing the approved logo or weakening the verified Faith in Motion register.

## Release standard

- The approved Pamodzi source and transparent logo files remain unchanged.
- Every public page has one shared loader, mobile navigation controller, header state, progress indicator and motion system.
- Every page works at 375 px, tablet, desktop and short landscape sizes without horizontal overflow.
- Keyboard navigation, visible focus, 44 px touch targets and reduced motion remain supported.
- Faith in Motion received, pledged and promised amounts stay visibly separate.
- Only verified received steps count toward the funded-road progress.
- Every public figure is derived from `js/roll-data.js`; journey cards are derived from `js/fim-content.js`.
- No broken images, links, browser errors or duplicated shared controls.

## Phase 1 — shared foundation

Status: complete

- Added `js/core.js` as the single owner of the approved-brand loader, accessible mobile navigation, solid-header state and scroll progress.
- Removed those duplicated responsibilities from `js/pci.js`, `js/pdm.js` and `js/fim.js`.
- Kept page-family files focused on their actual content and campaign functions.
- Removed duplicate loader/progress styling from `css/fim.css`.

## Phase 2 — Faith in Motion publishing

Status: complete

- Kept the contribution register in one source file: `js/roll-data.js`.
- Kept the journey collection in one editorial file: `js/fim-content.js`.
- Extended `/admin/` with a Journey updates workspace.
- Added add, edit, remove and reorder controls for journey stories.
- Added generated publish-ready journey code.
- Included contribution and journey data in one downloadable backup.

## Phase 3 — content and trust review

Status: next

- Confirm official organisation address, registration details and public contacts.
- Confirm committee-approved payment wording and beneficiary verification language.
- Add any available construction photographs, receipts, milestones and dated progress evidence.
- Review every contributor label and status after each reconciliation.
- Add the next supplied journey photographs as newest-first updates.

## Phase 4 — page-by-page editorial polish

Status: queued

- Tighten the About, Model, Impact and Partnerships stories.
- Make the Projects page the clearest route into each project.
- Strengthen Faith in Motion’s church, walk, accountability and participation flow.
- Remove repeated language and make every primary action specific.
- Add accurate page descriptions and social previews for major campaign pages.

## Phase 5 — final release

Status: queued

- Re-run all-page link, asset, console and overflow checks.
- Test desktop, small mobile, tablet, landscape and reduced-motion experiences.
- Verify contributor totals independently from the public render.
- Check performance, accessibility, metadata and sharing cards.
- Push one reviewed release and verify the deployed GitHub Pages files.

## Updating Faith in Motion

1. Open `/pdm/admin/`.
2. Update contributions under **Pledges**.
3. Update story cards under **Journey updates**.
4. Download a backup.
5. Copy both generated blocks under **Publish**.
6. Replace the matching blocks in `js/roll-data.js` and `js/fim-content.js`.
7. Review the public pages before publishing.

