# Performance, SEO & Distribution Plan

**Scope:** all 14 pages + `admin/`. Static, no build step, GitHub Pages.
**Why this sector next:** the content is planned (`PCI-BUILD-PLAN.md`) and the craft is planned (`MOTION-AND-RESPONSIVE-PLAN.md`). Neither matters if the page **doesn't load on 3G**, **doesn't show a picture when shared to WhatsApp**, or **can't be found**. This is the layer that turns a good site into contributions before 2 August 2026.

---

## 1. Audit — verified state

Checked across all 14 HTML files:

| Signal | Status |
|---|---|
| `og:title` / `og:description` / `og:type` | ✅ present on every page |
| **`og:image`** | ❌ **absent on all 14 pages** |
| `rel="canonical"` | ❌ none |
| `twitter:card` | ❌ none |
| JSON-LD structured data | ❌ none |
| `sitemap.xml` / `robots.txt` | ❌ neither exists |
| Analytics / measurement | ❌ none |
| `404.html`, `.nojekyll` | ✅ both present |
| Artwork | ✅ inline SVG — zero image requests |
| Fonts | ⚠️ 3 Google families, render-blocking, 2 third-party origins |
| Deep links `?steps=` / `?ref=` | ✅ already built (`js/fim.js:95-106`) |
| QR generation | ✅ in `admin/index.html` |

**The headline finding:** the campaign's primary distribution channel is WhatsApp, and **every shared link currently renders as a bare grey text stub with no image.** For a fundraising campaign spread by sharing, this is the single most expensive defect on the site — and among the cheapest to fix.

---

## 2. Gaps — ranked by impact on contributions

| # | Gap | Cost of leaving it |
|---|---|---|
| **P1** | No `og:image` anywhere | Every WhatsApp/Facebook/Instagram share looks untrustworthy and unclickable |
| **P2** | No absolute canonical URL | OG requires absolute URLs; shares and SEO both degrade; duplicate-content risk across GH Pages + custom domain |
| **P3** | Render-blocking third-party fonts | 2 extra DNS+TLS round trips before text paints — the LCP cost lands hardest on 3G |
| **P4** | No structured data | Ineligible for rich results; an NGO + a dated public event is exactly what schema.org rewards |
| **P5** | No sitemap/robots | 14 pages discovered slowly; `admin/` is publicly crawlable |
| **P6** | No measurement | Cannot tell which tier link, QR or ambassador `?ref=` actually produces contributions — flying blind in the final weeks |
| **P7** | No offline/flaky-network resilience | A donor who loses signal mid-page loses the MoMo number |

---

## 3. Share & preview layer *(P1, P2 — do first)*

### 3.1 Per-page Open Graph images
Six 1200×630 PNGs in `assets/og/`, built from the existing brand (the connected **Canva** workspace is the fastest route; otherwise export from the site's own SVG artwork):

| Image | Used by | Content |
|---|---|---|
| `og-campaign.png` | `faith-in-motion.html` | Dawn road + "345 km on foot to finish a church" + goal |
| `og-give.png` | `give.html` | "One step = UGX 1,000" + MoMo channel |
| `og-church.png` | `church.html` | St Joseph's + completion goal |
| `og-walk.png` | `walk.html` | Route Kampala → Rwembyo |
| `og-roll.png` | `roll.html` | Roll of Honour |
| `og-pamodzi.png` | org pages | "One foundation, many doors" |

**Constraints that make previews actually render:** absolute `https://` URL, **under 300KB** (WhatsApp silently drops large images), 1200×630, no text within 60px of the edge (platform crops), and `og:image:width`/`height` declared so the preview reserves space.

### 3.2 Full head block — add to every page
```html
<link rel="canonical" href="https://DOMAIN/give.html">
<meta property="og:url" content="https://DOMAIN/give.html">
<meta property="og:image" content="https://DOMAIN/assets/og/og-give.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Sponsor a step — one step is UGX 1,000">
<meta property="og:site_name" content="Faith in Motion">
<meta property="og:locale" content="en_UG">
<meta name="twitter:card" content="summary_large_image">
```
**Dependency:** `DOMAIN` is blocked on the domain decision in `PCI-BUILD-PLAN.md` (D3 — `pamodzici.com` vs GitHub Pages). Use a single placeholder token so it's one find-and-replace at launch. **Do not ship relative OG image paths — crawlers will not resolve them.**

### 3.3 Share mechanics
- **Web Share API** with the existing WhatsApp link as fallback: `navigator.share({title,text,url})` gives native OS sharing on Android — one tap instead of three.
- Keep the pre-filled WhatsApp text (`js/fim.js:148`) and carry `?ref=` through shares so ambassador attribution survives.
- One **canonical short link** for bios, posters and the order of service.

---

## 4. Structured data *(P4)*

One JSON-LD block per page type — hand-written, no tooling:

- **`NGO`** (site-wide, in the footer include): legal name `[TO CONFIRM]`, logo, address, `sameAs` social profiles, contact point.
- **`WebSite`** + `BreadcrumbList` — the breadcrumb UI already exists (`.crumb`), so mark it up.
- **`Event`** on `walk.html` — the walk with `startDate`, `endDate: 2026-08-02`, `location` (Kampala → Kasese), `eventStatus`. A dated public event is the highest-value schema here.
- **`DonateAction`** / `Organization.potentialAction` on `give.html`, pointing at the official channel.
- **`FAQPage`** on `governance.html` — the anti-fraud and how-money-moves questions are already in FAQ form.

**Governance rule applies:** never encode an unverified figure in structured data. Goal and channel only once confirmed.

---

## 5. Discoverability *(P5)*

- **`sitemap.xml`** — all 14 public pages, hand-written (it changes rarely), `admin/` excluded.
- **`robots.txt`** — allow all public pages, `Disallow: /admin/`, point to the sitemap.
- **`<meta name="robots" content="noindex,nofollow">` on `admin/index.html`** — it's an unlinked operational tool that is nonetheless publicly served. Belt and braces with the robots disallow.
- **Titles/descriptions** — already good and unique per page; keep under 60/155 characters as PCI pages are added.
- **Internal linking** — the new PCI pages must be reachable from the homepage within one click (helps users and crawlers equally).

---

## 6. Performance & Core Web Vitals *(P3)*

**Targets on a mid-range Android over 3G:** LCP < 2.5s · CLS < 0.1 · INP < 200ms.

### 6.1 Fonts — the biggest single win
Currently: `fonts.googleapis.com` + `fonts.gstatic.com` = two extra DNS+TLS handshakes before any text renders, for 3 families.

**Recommendation: self-host subset `woff2` files in `assets/fonts/`.** No build step — they're just files. This removes two third-party origins from the critical path and is worth more on 3G than every other optimisation combined.
- Subset to Latin + the punctuation actually used.
- `font-display: swap` (already the behaviour).
- Declare `size-adjust` / `ascent-override` on the fallback `@font-face` so the swap doesn't shift layout (protects CLS).
- **Audit the weight count** — currently 3 families × several weights. Every weight is a separate file. Cut any not visibly used.

### 6.2 Critical path
- Inline the ~2KB of CSS needed for the header + hero; load the rest with `media="print" onload="this.media='all'"` (with a `<noscript>` fallback).
- `preload` the one or two fonts used in the hero headline.
- Keep artwork inline SVG — already correct, zero requests.

### 6.3 CLS
`aspect-ratio` slots already protect image positions (`fim.css:289`). Extend: any real photograph must ship with explicit `width`/`height` attributes, and the odometer counters (motion plan §5.2) must use `tabular-nums` so digits don't reflow.

### 6.4 INP
Covered by the motion plan (rAF-throttled scroll, compositor-only animation). Additionally: keep total JS small — `js/fim.js` is already lean; the new `js/motion.js` is capped at 6KB.

### 6.5 Hosting constraints — stated honestly
GitHub Pages **does not allow custom cache headers**. Text assets are gzip/brotli-compressed automatically, but fine-grained caching and long-lived immutable asset caching are unavailable. If that becomes a bottleneck, **Cloudflare Pages or Netlify** would serve the identical static folder with header control and a global edge closer to Uganda — a migration with no code change. Flagged as an option, not a requirement.

---

## 7. Resilience on bad networks *(P7)*

A donor on a Ugandan mobile connection can lose signal mid-transaction. A **small service worker** (~40 lines, cache-first shell / network-first data) means:
- The giving instructions and the Mobile Money number remain readable offline.
- Repeat visits load instantly.
- An "offline — showing last saved figures" notice prevents stale totals being mistaken for live ones.

**Risk, stated plainly:** a service worker can serve stale content, and the site is maintained by a non-technical person updating `js/roll-data.js` weekly. Mitigation: **never cache `roll-data.js` or `updates-data.js`** (always network-first), version the cache name, and document a one-line "bump the version" step in the README. If that discipline feels fragile, **skip the service worker** — everything else in this plan is lower-risk and higher-certainty. Recommend shipping it *after* 2 August, not before.

Also honour `Save-Data` / `prefers-reduced-data` (motion plan §8.7) to drop decorative work on metered connections.

---

## 8. Measurement *(P6)*

Without this, the final fortnight is guesswork — nobody can tell whether the QR on the T-shirts or the ambassador links actually produce money.

- **Privacy-first, cookieless analytics** (self-hosted or a lightweight hosted script). **No personally identifying data, ever** — no donor names, no amounts, no phone numbers.
- **Event taxonomy mapped to the donor funnel** the brief defines:
  `see → understand → verify → contribute → confirm → share`
  Concretely: `tier_selected` (with step count), `momo_number_copied`, `whatsapp_pledge_clicked`, `share_clicked`, `roll_expanded`, `qr_source` (from `?ref=`).
- **Attribution** — the `?ref=` parameter already exists; record it as a dimension so ambassadors, QR placements and posters can be compared.
- **`momo_number_copied` is the key proxy metric.** The site cannot observe the actual payment (it happens in a MoMo app), so copy-events + WhatsApp-pledge clicks are the closest measurable intent signal — reconcile them weekly against the finance verifier's real figures in `admin/`.
- **Governance:** analytics measures *behaviour*, never *money*. Published totals continue to come only from reconciled figures. State this in `governance.html` and add a one-line privacy note where forms are used.

---

## 9. Phases

| Phase | Work | Blocked by |
|---|---|---|
| **A · Share layer** | 6 OG images; canonical + OG/Twitter head block on all 14 pages; Web Share API | Domain decision (D3) |
| **B · Discoverability** | `sitemap.xml`, `robots.txt`, `noindex` on admin | — |
| **C · Structured data** | NGO, WebSite, Breadcrumb, Event, DonateAction, FAQ | Verified name/goal/channel |
| **D · Performance** | Self-host font subsets; audit weights; critical CSS; font-metric overrides | — |
| **E · Measurement** | Analytics + funnel events + `?ref=` attribution + privacy note | Client approval of a vendor |
| **F · Resilience** | Service worker + offline giving instructions | **After 2 August** |

**Sequencing note:** A and B are the highest return for the least work and should land before the walk. D is the biggest user-felt speed win. F deliberately waits until after the deadline.

---

## 10. Verification

1. **Share preview** — paste each key URL into WhatsApp, Facebook Sharing Debugger and X's validator: image renders, title/description correct, under 300KB.
2. **Structured data** — Google Rich Results Test + Schema Markup Validator on `walk.html`, `give.html`, `governance.html`: zero errors, no unverified figures present.
3. **Crawl** — `sitemap.xml` valid; `robots.txt` resolves; confirm `admin/` is disallowed **and** `noindex`.
4. **Field-realistic performance** — DevTools Slow 4G + 6× CPU: LCP < 2.5s, CLS < 0.1; confirm no third-party font origin remains in the waterfall after §6.1.
5. **Absolute URLs** — grep every `og:image` and `canonical` for `https://`; zero relative paths.
6. **Analytics** — trigger each funnel event manually and confirm it records; confirm **no PII** in any payload.
7. **Offline (Phase F only)** — airplane mode: giving instructions still readable; the stale-data notice appears; `roll-data.js` is never served from cache.
8. **Link integrity** — all 14 pages reachable within one click of home; no dead internal links.

---

## 11. Out of scope
- Paid advertising, ad pixels, or remarketing tags.
- Any analytics that stores personal data, donor identity, or contribution amounts.
- A CMS or build pipeline — the site stays hand-editable.
- Payment-provider (card/Pesapal) integration — a separate backend workstream.
- Publishing any figure not signed off by the finance verifier.

---

## 12. Suggested sector order after this one
1. **Trust, security & privacy hardening** — CSP headers, form spam protection, anti-fraud surface consistency, a privacy notice, dependency-free supply chain (already close to zero).
2. **Backend & data layer** — real form handling (the enquiry forms are `mailto:` only today), a contributions ledger with an API instead of a hand-edited JS file, authenticated `admin/`.
3. **QA & release engineering** — link checking, HTML validation, Lighthouse budgets, a preview environment, and a documented release checklist a non-developer can follow.
