# Walk for Education 2026 — Finish Plan (v2)

**Status, 28 September 2026:** the campaign platform is **built and launch-ready**. What remains is not engineering — it is four facts only the campaign team can confirm, plus the content and outreach that follow them. The site is designed so each confirmed fact switches on its part of the campaign the moment it is published, with no developer, no commit and no redeploy.

---

## 1. Shipped in v2

| Area | What now exists | Where |
|---|---|---|
| **Live publishing** | Admin-published campaign record, same password and pattern as Faith in Motion's register. Strict field allow-list; source facts (distance, goal, students) cannot be overridden. | `api/campaign.php`, `admin/wfe.html` |
| **Campaign console** | One screen for status, dates, route stages, distance walked, step value, payment channels, reconciled totals, field notes and confirmed partners. Governance tick-boxes block publishing figures, channels, notes or partners until the right person has confirmed them. Backup/import JSON. | `admin/wfe.html` |
| **Ready-when-verified components** | Each stays hidden until its field has a verified value: countdown / day-on-the-road chip; verified progress (received vs pledged, odometer figures, share of goal, last-reconciled date); walker marker along the route line; confirmed stage list; step calculator with WhatsApp pledge; authorised payment-channel cards with copy-number; field-notes feed and "latest from the road" teaser; extra confirmed-partner cards. | `js/wfe.js`, `css/wfe.css`, all five pages |
| **Ambassador attribution** | `?ref=` captured once, kept for the visit, and carried into enquiry emails, WhatsApp messages, shared links and every analytics event. `?steps=` preselects a calculator amount. | `js/wfe.js` |
| **Enquiry forms** | Inline, accessible validation (`aria-invalid`, described errors). After submit, a confirmation panel offers **Send on WhatsApp** and **Copy message** — closing the dead end for visitors with no mail app. | `js/wfe.js` |
| **Sharing** | Dedicated 1200×630 share card (59 KB) on all five pages with full Open Graph + Twitter tags; WhatsApp share and copy-link buttons; native share sheet on phones. | `assets/og/walk-for-education.jpg` |
| **Search** | JSON-LD on every page (NGO, WebPage, BreadcrumbList), FAQPage on Accountability (built only from existing copy), and an `Event` block injected automatically once a start date is published. | page `<head>`s, `js/wfe.js` |
| **Motion** | Hero route draws itself; sliding audience-tab indicator; odometer roll on verified figures; progress bar and route fill via `transform` only; live-status pulse. All off under reduced motion; decorative loops off under reduced data. | `css/wfe.css` |
| **Site-wide fix** | Under reduced motion, every button's shine gradient used to freeze mid-button. Fixed in the shared stylesheet. | `css/motion.css` |

**Verified before shipping:** JS and PHP syntax; API accepts valid records and rejects wrong passwords, unknown fields and unsafe image URLs, and escapes `</script>`; all five pages in Chromium at 1280px and 390px, empty and fully populated — zero console errors, zero horizontal overflow; tabs by keyboard; form validation and WhatsApp fallback; `?ref=` persistence across pages; Event schema only when dated.

---

## 2. Remaining — the launch gate

### Gate A · Four facts (campaign team — blocks public promotion)
1. **Start date** (and arrival date, if publishable) → switches on the countdown and the Event listing in search.
2. **Contribution unit value** (e.g. per step) → switches on the step calculator and WhatsApp pledges.
3. **Authorised payment channel(s)** with the exact registered name, confirmed in writing by the signatory → switches on the copy-number cards.
4. **Named content approver and finance verifier** for this campaign → required before any figure or field note is published.

### Gate B · First content (within a week of Gate A)
- One dated, sourced field note, so Updates is never empty when promotion starts.
- Photos for `assets/walk-for-education/` with permissions, added to the site like any other asset.

### Gate C · Measurement (choose once)
- Pick a privacy-first, cookieless analytics tool. The events already fire into `dataLayer`: `ambassador_visit`, `audience_selected`, `sponsor_amount_selected`, `pledge_whatsapp_opened`, `payment_number_copied`, `enquiry_prepared`, `enquiry_whatsapp_fallback`, `campaign_share`, plus the existing CTA events — all tagged with `ref`. Loading the tool is a one-line change per page.

---

## 3. Operating it

1. Open `/admin/wfe.html`, enter the console password once.
2. Change only what has been verified; tick the matching confirmation.
3. Read section 8 ("What will be public"), then **Publish live**. Every page updates within seconds.
4. Download a backup after each publish.

Weekly rhythm: reconcile → update received/pledged + last-reconciled date → publish one field note → move the distance-walked marker → check which `?ref=` links produced enquiries.

---

## 4. Deliberately not done
- No figure, date, channel or partner was invented to fill a section — every one of them waits for Gate A.
- No third-party analytics or ad pixels were loaded without an approved vendor.
- No framework or build step — the site stays hand-editable, as required by `README.md`.
