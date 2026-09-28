# Walk for Education 2026 — Finish Plan

**Scope:** `walk-for-education/` (campaign, take-part, partners, accountability, updates), `css/wfe.css`, `js/wfe.js`, `js/wfe-data.js`.
**Status today:** a complete, on-brand, five-page campaign shell in the site's **"preparing launch"** state. The structure, copy discipline and trust framing are done. What's missing is everything that turns it from a well-built brochure into a campaign that can actually take contributions and report progress — by design, since `js/wfe-data.js` correctly refuses to publish anything unverified.

---

## 1. What's already built (verified in code)

- Five pages sharing one subnav (`Campaign · Take part · Partners · Accountability · Updates`), one campaign data record (`js/wfe-data.js`), one render/interaction script (`js/wfe.js`).
- A single source of truth pattern copied correctly from Faith in Motion: every number on every page reads from `window.WFE_CAMPAIGN` via `[data-campaign-field]`, so nothing can drift between pages.
- Three clear participation routes (individual, Rotary club, organisation) with an accessible tabbed UI (`role="tablist"`, arrow-key navigation, deep-linkable via `#individual` / `#rotary` / `#organisation`).
- Governance-correct copy throughout: pledged vs received is explicit, no step price is shown, no account number is published, every "sponsor" is labelled by *confirmed* role only. This mirrors the Faith in Motion governance rules and should not be loosened casually.
- Enquiry forms (`.wfe-enquiry-form`) that build a pre-filled `mailto:` — functional today, but see §2 (P1).
- Share button using `navigator.share` with a clipboard fallback; `data-analytics` attributes already wired to a `dataLayer.push` — the *hooks* for measurement exist, there is just nothing listening yet (see §2, P4).
- Reuses the shared motion/nav system (`css/motion.css`, `js/site-motion.js`, `js/core.js`) — mobile nav, header state, and scroll reveals all work on these pages for free.
- Responsive down to 360px with three breakpoint tiers already in `wfe.css`; reduced-motion respected on the two transitioning components it defines.

**Do not rebuild any of the above.** The finish work is additive.

---

## 2. Gaps, ranked by what blocks the campaign from actually launching

| # | Gap | Evidence | Why it matters |
|---|---|---|---|
| **P0** | **No backend for the enquiry forms or the ledger.** Forms only open the visitor's email client (`js/wfe.js:133`); there is no equivalent of `api/roll.php` for Walk for Education, and no admin console tab for it (`admin/index.html` only manages Faith in Motion's Pledges/Journey updates — confirmed no WFE reference anywhere in `admin/` or `api/`). | `js/wfe.js`, `admin/`, `api/` | A donor on iOS/desktop with no mail client configured hits a dead end. There is also no way for staff to publish a verified received/pledged total without editing `js/wfe-data.js` by hand and pushing a commit — Sylvia/the campaign team cannot do this themselves the way they can for Faith in Motion. |
| **P1** | **Four campaign facts are still null**: `campaignStartDate`, `campaignEndDate`, `contributionUnitValue`, `paymentChannels`. | `js/wfe-data.js:23-28` | Correct to withhold until verified — but they are the actual blockers to a public launch, not a code task. Flag explicitly so they get chased, not lost. |
| **P2** | **Updates page is intentionally empty** — no field notes, no photos, no host acknowledgements. | `walk-for-education/updates/index.html` | An empty updates page after "launch" reads as abandoned within two weeks. Needs a minimum of one dated entry before the campaign is promoted anywhere. |
| **P3** | **Generic share card.** Every page on the whole site — including all five WFE pages — points at the same `assets/og/share-card.jpg`. | `grep og:image` returns one file across every HTML page | The single highest-leverage fix for a campaign spread by WhatsApp/social (see `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §3, written before WFE existed — WFE needs its own version of that fix). |
| **P4** | **Analytics hooks fire into a void.** `data-analytics` attributes exist and push to `dataLayer`, but no analytics script is loaded on any WFE page. | `js/wfe.js:140-151` | Cannot tell which route (`sponsor_steps_open`, `rotary_participation_open`, `partnership_enquiry_open`) is actually working until this is wired to something. |
| **P5** | **No `?ref=` / ambassador attribution**, unlike Faith in Motion's deep-link pattern (`?steps=`, `?ref=`). | `js/wfe.js` has no query-param handling | Rotary clubs and individual ambassadors have no way to be credited for the traffic/support they generate — this is the single biggest lever in the marketing plan (see the companion ideas document) and it currently has no technical hook. |
| **P6** | **No structured data** (`Organization`, `Event` for the walk once dates exist, `FAQPage` on accountability). | absent site-wide | Lower priority than P0–P3, but cheap once dates are confirmed. |
| **P7** | **Journey visual is static.** The `journey-poster` SVG (`walk-for-education/index.html:90-96`) is a fixed illustration — no live progress, no scroll behaviour, unlike the "road" signature moment specified for Faith in Motion in `MOTION-AND-RESPONSIVE-PLAN.md` §5.1. | `css/wfe.css` `.journey-poster` block | Reasonable *for now* — there's no verified distance-covered data to visualise yet. Becomes the top motion priority the moment the walk actually starts. |
| **P8** | **`updates/` and `partners/` pages have no page-specific OG copy** beyond the shared generic image (see P3) — otherwise fine. | — | Bundle into the P3 fix; not separate work. |

---

## 3. Finish plan — phased

### Phase 0 — Facts, not code (do this first; blocks everything else)
Chase the four `null` fields in `js/wfe-data.js` (P1) with the campaign team:
1. Confirmed start date, and whether an end/arrival date can be published yet.
2. Whether a per-step or per-contribution unit value will be published (Faith in Motion uses UGX 1,000/step — decide if Walk for Education uses the same model or a different one).
3. The authorised payment channel(s) — bank and/or Mobile Money, beneficiary name, exactly as `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` and `MASTER-BUILD-PROMPT.md` required for Faith in Motion.
4. One content approver and one finance verifier named for Walk for Education specifically (they may be the same people as Faith in Motion, but say so explicitly rather than assuming).

Nothing below should invent these values. Leave `[TO CONFIRM]` markers if a phase is reached before an answer arrives.

### Phase 1 — Make the forms and the ledger real (P0)
- Point `.wfe-enquiry-form` submissions at the same lightweight backend pattern as `api/roll.php` (or a simple form-relay service) so an enquiry is captured even when the visitor has no mail client — keep the current `mailto:` behaviour as a fallback, not a replacement.
- Add a **Walk for Education** tab to `admin/index.html` mirroring the existing Pledges tab: add/edit/remove contributions, cycle pledged → received, publish a generated `WFE_CAMPAIGN` block the same way Faith in Motion generates its `ROLL` block. This is what lets Sylvia's team update the campaign without a developer or a commit.
- Until this ships, document the manual process (edit `js/wfe-data.js`, commit, push) in the README the same way Faith in Motion's update process is documented today.

### Phase 2 — Share & discovery layer, WFE-specific (P3, P6)
- Produce a dedicated `og-walk-for-education.png` (1200×630, <300KB, no text within 60px of the edge) distinct from Faith in Motion's card — same constraints as `PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §3.1, applied to this campaign's five pages.
- Add per-page `og:image`, `og:image:width/height`, `twitter:card` already-present pattern is fine — just point the image at the new file.
- Add `Organization`/`NGO` JSON-LD once, reused site-wide; add an `Event` block to `walk-for-education/index.html` the moment Phase 0 supplies real dates.
- Add a `FAQPage` block to `walk-for-education/accountability/index.html` — the pledge/received/in-kind definitions are already written in FAQ-compatible form.

### Phase 3 — Attribution & measurement (P4, P5)
- Add `?ref=` handling to `js/wfe.js` (mirrors `js/fim.js` pattern already proven on Faith in Motion): capture on load, carry it into the `mailto:` body and into any future form backend, surface it as a `dataLayer` dimension.
- Load the same privacy-first, cookieless analytics approach already scoped for the rest of the site (`PERFORMANCE-SEO-DISTRIBUTION-PLAN.md` §8) and confirm the existing `data-analytics` events actually record: `sponsor_steps_open`, `rotary_participation_open`, `partnership_enquiry_open`, `payment_details_viewed`, `accountability_open`, `campaign_share`.
- Track `momo_number_copied` equivalent the moment Phase 0 supplies a payment channel to copy.

### Phase 4 — Content (P2)
- Publish at least one verified update before any public promotion begins — even a short "campaign preparation" note with a real date and source satisfies the page's own stated standard ("nothing published just to look busy").
- Add real photography once available, following the same fallback pattern documented in the README's Photography section (illustrated fallback if an image slot is empty).

### Phase 5 — Motion polish, once there is something real to animate (P7)
Deliberately sequenced last — animating a placeholder number is worse than a static one. Once Phase 0/1 land:
- Give the fact-band figures (`.wfe-fact b`) the odometer treatment already specified in `MOTION-AND-RESPONSIVE-PLAN.md` §5.2 (per-digit roll, `tabular-nums`, `aria-hidden` animated stack + visually-hidden accurate value) — but only once a real received/pledged total exists. Do not animate `null`.
- Give the audience tabs (`.audience-tab`) a FLIP-based sliding indicator instead of the current instant background swap — small, cheap, and matches the "magnetic selection indicator" pattern already speced for `give.html`.
- Once route stages are confirmed (Phase 0), convert `.route-strip` from a static two-point illustration into the scrollytelling spine described in §6.2 of the motion plan — sticky figure, `animation-timeline: view()` where supported, static fallback otherwise.
- Add `view-transition-name` to the WFE subnav brand mark and page hero so navigating between the five WFE pages morphs rather than flashes (two lines of CSS, §7 of the motion plan, already proven safe for the rest of the site).

---

## 4. CSS/JS/animation suggestions specific to these five pages

These extend the site's existing motion architecture (`css/motion.css`'s tokens, `js/site-motion.js`'s reveal/header logic) rather than introducing anything new:

- **Reuse the choreography tokens** (`--dur-*`, `--ease-*`, `--stagger`) from `MOTION-AND-RESPONSIVE-PLAN.md` §4.1 for any new WFE-specific transition instead of hand-rolling new duration values in `wfe.css` — keeps the whole site's motion feeling like one system.
- **`.priority-card` and `.way-card` hover lift** (`wfe.css:108-110`, `134-135`) is `transform`/`box-shadow` only — already compositor-safe, correct as-is.
- **Container queries for `.priority-grid` and `.route-panel`**: today these collapse on fixed page breakpoints (`@media(max-width:1080px)` in `wfe.css`). Switching to `container-type: inline-size` on the parent `.wrap` lets these components report correctly if they're ever reused in a narrower context (e.g. embedded in a partner's page or a future sidebar widget) without new media queries.
- **`content-visibility: auto` on `.wfe-section`** blocks below the fold (priorities, journey, take-part) — five long sections per page is exactly the case this helps on a low-end Android.
- **`:has()` for the audience tabs**: `.audience-tabs:has([aria-selected="true"][data-audience-tab="rotary"])` could drive the aside-card copy or accent colour per tab without extra JS class bookkeeping, if that's ever wanted.
- **`prefers-reduced-data`**: the poster's animated grid overlay (`.journey-poster:after`) and any future road animation should suppress under `saveData`/`prefers-reduced-data`, per the motion plan's §8.7 — directly relevant since this campaign's audience overlaps with Faith in Motion's 3G-Uganda case.
- **Keep the road/route visual static until Phase 0/5** — this is a deliberate sequencing call, not a missed opportunity: an animated route with no real progress data is a worse trust signal than a plain map graphic, given this site's own governance standard of never implying more certainty than is verified.

---

## 5. Verification before calling this "launched"

Mirror the standard already used for the rest of the site (`V2-ROADMAP.md` release standard, `MASTER-BUILD-PROMPT.md` §Verify):
1. Every field in `js/wfe-data.js` that is publicly displayed is either a real verified value or clearly labelled pending — no invented dates, prices or totals.
2. `node --check js/wfe.js js/wfe-data.js` and a manual pass confirming every `[data-campaign-field]`/`[data-audience-tab]`/`[data-analytics]` target actually exists in each of the five pages.
3. Mobile check at 360px on all five pages; keyboard-only pass through the audience tabs and both enquiry forms.
4. Share preview test (WhatsApp + Facebook Sharing Debugger) once Phase 2's OG image ships.
5. Confirm the admin console's new Walk for Education tab (Phase 1) produces the same `WFE_CAMPAIGN` shape `js/wfe.js` expects — a mismatch here silently breaks every page at once, since all five read one record.

---

## 6. Out of scope for this plan
- Inventing any date, payment channel, or step value ahead of Phase 0 confirmation — this is the one rule that must never be worked around for the sake of "finishing" faster.
- Rebuilding Faith in Motion's more mature systems — this plan only brings Walk for Education up to the same standard, using the same patterns, not a new architecture.
- Paid advertising or ad-pixel integration (see the companion marketing ideas document for the non-technical growth plan).
