# Pamodzi Community Initiative — Website Build & Upgrade Plan (2026)

This consolidates the status of the four existing plan documents (`V2-ROADMAP.md`, `PCI-BUILD-PLAN.md`, `MOTION-AND-RESPONSIVE-PLAN.md`, `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md`), adds the newly-launched Walk for Education campaign into the roadmap, and sets the next 90 days of priority. It does not replace those documents — it says, in one place, where each of them actually stands today and what to do next across the whole site.

**Ground truth:** no framework, no build step, no database — static HTML/CSS/JS on GitHub Pages, as documented in `README.md`. Every recommendation below stays inside that constraint deliberately; the site is maintained day-to-day by a non-developer.

---

## 1. Where the site actually stands today (verified, not assumed)

| Area | Plan document | Status |
|---|---|---|
| Shared foundation (`js/core.js`, one mobile nav, one header state) | `V2-ROADMAP.md` Phase 1 | **Done.** Confirmed in code — `js/core.js` (234 lines) is live, referenced from every page including Walk for Education. |
| Faith in Motion publishing (`js/roll-data.js`, `admin/` Pledges + Journey updates) | `V2-ROADMAP.md` Phase 2 | **Done and live** — `api/roll.php` backs real-time publishing. |
| Institutional PCI pages (about, model, what-we-do, projects, partnerships) | `PCI-BUILD-PLAN.md` | **Built** — all listed pages exist with the specified structure. |
| Motion architecture — tokens, mobile nav, reveals, reduced motion | `MOTION-AND-RESPONSIVE-PLAN.md` Phases A–C | **Substantially done.** `css/motion.css` (338 lines) and `js/site-motion.js` (289 lines) exist and are shared site-wide, including by Walk for Education — this is newer work than that document's original audit (which still referenced the old `pdm.css`/`fim.css` split, since replaced by `base.css`/`pci.css`/`motion.css`). |
| Motion "signature moments" — odometers, FLIP, scrollytelling road, view transitions | `MOTION-AND-RESPONSIVE-PLAN.md` Phases D–F | **Not yet built.** No odometer digit-stacks, no `js/motion.js` runtime, no `animation-timeline: view()` usage found in the codebase. |
| Share layer — per-page OG images, canonical/OG head block | `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §3 | **Partially done.** Canonical URLs and OG tags exist on every page (confirmed in Walk for Education templates), but **every single page on the site — old and new — shares one generic `assets/og/share-card.jpg`.** The six-image plan from that document was never executed. |
| Discoverability — sitemap, robots | `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §5 | **Done.** `sitemap.xml` (24 URLs, including all five Walk for Education pages) and `robots.txt` both exist and are correctly configured (`admin/` disallowed). |
| Structured data (JSON-LD) | `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §4 | **Not started.** No `NGO`, `Event`, `FAQPage` or `BreadcrumbList` markup found anywhere. |
| Self-hosted fonts / critical CSS | `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §6 | **Not started.** Every page still loads three Google Font families from two third-party origins. |
| Measurement / analytics | `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §8 | **Not started.** `dataLayer.push` calls exist in both `js/fim.js`-family and `js/wfe.js`, but no analytics script is loaded anywhere, so none of it is captured yet. |
| Service worker / offline resilience | `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §7 | **Not started** — correctly deferred (that document explicitly recommends shipping this last). |
| **Walk for Education campaign** | *(new since the above documents were written)* | **v2 shipped — launch-ready.** Live publishing API + console, ready-when-verified components, ambassador `?ref=` attribution, WhatsApp fallbacks, dedicated share card, JSON-LD. Waiting only on four campaign facts — see `WALK-FOR-EDUCATION-FINISH-PLAN.md`. |

**Update after the Walk for Education v2 release:** the WFE share card, structured data, enquiry fallback, `?ref=` attribution and admin console items below are now **done for Walk for Education**; they remain open for Faith in Motion and the institutional pages, where the same patterns can now be copied directly.

**The one-line summary:** the site's *structure and craft foundation* are in good shape across both campaigns; the *layer that makes contributions actually happen and be measurable* — real form backends, per-page share images, analytics, structured data — is the largest open gap, and it is open on **both** Faith in Motion and Walk for Education, not just the new campaign.

---

## 2. Priorities for the next 90 days, ranked

Ranked by contribution impact per unit of effort, same lens `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` used originally.

### Now (weeks 1–3)
1. **Six-to-eight per-page OG images**, including a dedicated Walk for Education card — the single cheapest, highest-leverage fix left undone from the existing SEO plan. Every WhatsApp share of every campaign link currently looks identical and generic.
2. **Walk for Education Phase 0** (chase the four missing campaign facts — see the dedicated finish plan) — nothing else on that campaign can complete without this, and it is not a coding task.
3. **Real form backend for both campaigns' enquiry forms** — Faith in Motion's forms and all of Walk for Education's forms are `mailto:`-only today. A lightweight relay (the same pattern as `api/roll.php`, or a hosted form service) closes the biggest silent leak in the funnel: visitors with no configured mail client.

### Next (weeks 4–8)
4. **Analytics activation** — wire the existing `dataLayer` events on both campaigns to a privacy-first, cookieless analytics tool. Without this, nobody can tell which channel — Rotary networks, WhatsApp, QR codes, ambassador links — is actually producing engagement, on either campaign.
5. **`?ref=` attribution on Walk for Education**, matching Faith in Motion's existing pattern — required before any ambassador/ambassador-club marketing push (see the companion ideas document sent to Joshua).
6. **Admin console parity** — add a Walk for Education tab to `admin/index.html` so the campaign team can publish verified figures themselves, the same way they already do for Faith in Motion.
7. **Structured data** — `NGO`/`Organization` site-wide, `Event` on both walk pages once dates are confirmed, `FAQPage` on both accountability pages.

### Then (weeks 9–13)
8. **Self-host font subsets** — removes two third-party origins from the critical rendering path; the single biggest remaining speed win on a 3G Ugandan/Kenyan connection.
9. **Motion signature moments** — build the shared `js/motion.js` runtime (spring/FLIP/stagger/WAAPI, capped at 6KB) once there is live data on at least one campaign to justify animating it; apply odometer counters to Faith in Motion's live totals first, then to Walk for Education once Phase 0/1 land there.
10. **Content and editorial polish** — `V2-ROADMAP.md` Phases 3–4 (trust review, page-by-page editorial pass) are still queued for the institutional pages; fold Walk for Education's updates content into the same editorial cadence.

### Deliberately later
11. **Service worker / offline resilience** — after both campaigns have live, verified figures worth protecting from a dropped connection, not before.
12. **Trust, security & privacy hardening** and a documented non-developer release checklist — the two "suggested next sectors" already flagged at the end of `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md`, still open.

---

## 3. Structural upgrade ideas beyond the current plans

These are new, not drawn from the existing four documents — worth considering once the 90-day list above is clear:

- **Generalise the "one campaign data record" pattern.** Faith in Motion has `js/roll-data.js` + `api/roll.php`; Walk for Education has `js/wfe-data.js` with no backend yet. Rather than building a second bespoke backend, consider a small shared API (`api/campaigns.php` or similar) keyed by `campaignId`, so a third campaign in future doesn't require rebuilding this layer a third time.
- **One admin console, multiple campaign tabs**, rather than one console per campaign — `admin/index.html` already has the UI shell (tabs, quick-add console per `admin/quick.html`); extending its data model to be campaign-aware is cheaper than duplicating the console.
- **A lightweight CMS-lite layer for `updates/`** across both campaigns, so field notes and photos can be added from the same console instead of hand-edited data files — directly unblocks Walk for Education's empty updates page (P2 in the finish plan) and reduces Faith in Motion's maintenance burden too.
- **Image pipeline discipline** as real photography arrives for Walk for Education (the README's fallback pattern already anticipates this) — define one responsive-image convention (srcset + explicit width/height for CLS) now, before dozens of ad-hoc photo drops happen under time pressure.
- **A documented, non-developer release checklist** (already flagged as a future sector in the SEO plan) — worth writing now given two campaigns are live simultaneously and the risk of one commit breaking both by touching a shared file (`core.js`, `motion.css`) is real.

---

## 4. What stays out of scope, deliberately

- No framework, no bundler, no database — matches the constraint stated in `README.md` and every existing plan document; changing this would raise the maintenance bar past what the current non-technical maintainer can sustain.
- No paid advertising or ad-pixel integration in the codebase (see the companion marketing ideas document for the non-technical growth plan — advertising strategy, not ad-tech implementation).
- No publishing of any campaign figure — on either campaign — that has not been through the stated reconciliation process. This rule is repeated in every plan document in this repository for a reason and applies equally to Walk for Education.
