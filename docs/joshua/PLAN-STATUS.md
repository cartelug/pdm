# Status of the six promises to Joshua — 26 October 2026

Checked against the code and the automated tests, not against the documentation. "Built" means it exists, is
deployed to the site's code and passes its tests. "Needs a person" means no code change can finish it.

| # | Promise | Built? | Evidence | What is still needed from a person |
| --- | --- | --- | --- | --- |
| 1 | Record money on the website; once verified, totals, outstanding balances, sponsored steps and campaign progress update automatically | **Built** | 74 backend checks and a full browser walkthrough pass. A reported payment starts pending and adds UGX 0; finance reconciliation with evidence adds exactly the received amount, once; a part-payment reduces the pledge's outstanding balance; a reversal removes the receipt and restores the balance; currencies are never added together; sponsored steps follow reconciled receipts | **Accounts must be activated on the host** (cPanel terminal, one command per person). **Import the Excel registers**: export to CSV, preview the mapping, import as pending, then finance reconciles each receipt against the bank or mobile-money record |
| 2 | Public live progress, with names and contributions of people who agree to be recognised | **Built** | Public figures come only from reconciled receipts; recognition is off by default; name and amount permissions are separate; withdrawing consent removes the name on the next refresh; private fields and references never appear publicly. The live report is on the Walk for Education page and the Projects page | Collect each supporter's permission. The homepage no longer shows the finance box (removed at your request); it shows a one-line confirmed walking status |
| 3 | Branded HD graphics: collections, milestones, sponsored steps, statistics, ready for WhatsApp, Facebook, Instagram | **Built** | Five templates (collections, weekly report, walk update, milestone and steps, supporter thanks) in three sizes (1080×1350, 1080×1920, 1080×1080). 15 real PNG downloads checked for exact size, fonts and brand artwork; a graphic locks a privacy-safe snapshot, so withdrawn consent is rechecked at export | A finance-approved milestone (amount, currency, evidence) before the milestone template can be exported. A watermarked sample is at `/assets/operations/samples/PCI-SAMPLE-collections-feed.png` |
| 4 | Individual access to PCI's social pages for Joshua, Shyaka and designated people | **Not a website task** | `docs/SOCIAL-OWNER-STEPS.md` gives the exact steps for Facebook, Instagram, TikTok and X | **The page owner must send the invitations** from each platform's own settings. Nothing in the website can grant them, and no role has been granted or verified |
| 5 | Training and handover so the team is independent | **Materials ready** | Joshua's start page is live; a one-page PDF, a WhatsApp message and a 15-minute call script are in `docs/joshua/`. Coordinator logins are tested to record, view, prepare walk updates, generate graphics and download reports, and **not** to reconcile, reverse, approve milestones or grant consent | Training counts as done only when Joshua has signed in on his own phone, downloaded a sample graphic and understood the finance handoff. That needs his login |
| 6 | Two days to implement and test | **The build is done; two items decide the date** | All code, tests and deployments for points 1, 2, 3 and 5 are complete | (a) account activation, (b) the contribution registers as CSV. Neither can be done by code. Realistically both can happen the same day they are provided |

## Order that keeps the public figures honest

1. Host administrator activates three logins: Joshua and Neeza (coordinator), the finance verifier (finance).
2. Finance exports each Excel register to CSV and previews the mapping; imports as pending.
3. Finance reconciles each receipt against real bank or mobile-money records.
4. Only then announce the live figures. Until step 3 has happened, the Walk page truthfully shows UGX 0 reconciled,
   because nothing has been verified yet.
5. Walk owner confirms the start date, current town and kilometres; finance approves the operational milestone.

## Facts still to confirm (the site shows them as unconfirmed rather than guessing)

- Walk start date, current location, cumulative kilometres.
- The shirt says 1,300 km and 1,650,000 steps; the route data says about 1,100 km.
- The proposed UGX 25 million operational milestone.
- Checkout is intentionally closed until approved.
