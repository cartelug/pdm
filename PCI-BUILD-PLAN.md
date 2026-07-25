# PCI Uganda — Full Completion Build Plan

**Source:** Notion — *"PCI Uganda — Website Development, Digital Strategy & Faith in Motion Command Center"* (Master Update, 24 July 2026).
**Target repo:** `cartelug/faith-in-motion-site` (static, no-build HTML/CSS/JS; deploys to GitHub Pages).
**Design system:** reuse the existing Pamodzi system — `css/pdm.css` + `js/pdm.js`. *(Superseded: the palette is now PCI red `#BC2C21` / near-black / white — see `BRAND.md`.)* Fonts: Bricolage Grotesque / Instrument Sans / JetBrains Mono.

---

## 1. Context — what we're building and why

The Notion doc repositions the organisation from a project-gateway ("Pamodzi for Development") into a **national indigenous development institution** with a strategic identity: a vision/mission/values, **four strategic pillars**, a signature **delivery model (ICIADM)**, a **partnership ecosystem**, and a track record of **impact milestones**. The current site already implements the *gateway* layer (org pages + the Faith in Motion campaign). This plan completes the site so it presents the **full institution** — while keeping Faith in Motion intact as the flagship live campaign under the umbrella.

The build turns the doc's recommended 9-section structure into pages that reuse the components already in `pdm.css`, so no re-theme or framework is introduced.

---

## 2. Decisions & blockers to resolve first (do not build over these)

These come straight from the doc and gate a public launch. Build with a single swappable token for each so they can be corrected in one place.

| # | Decision | Doc status | Plan default (until confirmed) |
|---|---|---|---|
| D1 | **Legal/public name** — "Pamodzi Community Initiative (Uganda) / PCI Uganda" vs "Pamodzi for Development / P4D" | Explicitly *unconfirmed*; doc recommends *Pamodzi Community Initiative Uganda · PCI Uganda · "Together for Development"* | Keep visible brand as **Pamodzi for Development** in copy, introduce **PCI Uganda** as the institutional name in a `[NAME TO CONFIRM]` token. One find-replace at confirmation. |
| D2 | **All impact figures** (UGX ~2.19bn mobilised; 450M/600M/902M/1.24bn ventures; 600+ outreach beneficiaries; 55+ members; 120+ participants) | Doc: *"must be verified and approved before being published as final public claims."* Site governance: *only reconciled figures are published.* | **Publish the qualitative story; mark every figure `[TO CONFIRM]`** and keep it out of headline stats until the finance verifier signs off. |
| D3 | **Domain** — `pamodzici.com` (new) vs current GitHub Pages URL | Preferred `pamodzici.com`; old `pamodzici.org` access lost | Build domain-agnostic (relative paths already used); add a `CNAME` only once the domain is purchased. |
| D4 | **Palette** — doc names "forest green, cream, restrained gold"; built site was navy/teal/gold | Resolved | **Superseded.** The palette is now taken from the PCI logo itself: red `#BC2C21`, near-black, white, applied across all three stylesheets. See `BRAND.md`. |
| D5 | **Member-directory / questionnaire system** (private CRM for 55+ members) | Doc lists it as a digital requirement | **Out of scope for the public static site** — flag as a separate future module (needs a backend). Public site stays static. |

---

## 3. Target information architecture

Map the doc's recommended structure onto the repo. **Bold = new page**; *italic = rework existing*; plain = keep.

| Doc section | Site page | Action |
|---|---|---|
| Home | `index.html` | *Rework* — pillars, model teaser, featured projects, impact strip (`[TO CONFIRM]`), partnership CTA |
| About PCI | `about.html` | *Rework* — identity, vision, mission, values, objectives, leadership & governance, registration `[TO CONFIRM]` |
| Our Development Model | **`model.html`** | New — ICIADM pathway + principles |
| What We Do | **`what-we-do.html`** | New — the four pillars, each with programme areas |
| Projects & Impact | `projects.html` | *Rework* — completed / ongoing / pipeline directory + impact (`[TO CONFIRM]`) |
| — project profiles | `apartments.html`, `community.html`, + **new profiles** | Keep apartments; generalise `community.html`; add profiles as content is verified |
| Partnerships | **`partnerships.html`** | New — one pathway per partner audience |
| News & Stories | `updates.html` | *Rework* — data-driven feed (Walking for Impact, medical camps, milestones) |
| Partner With Us | `contact.html` (routing form already exists) | *Extend* — add partner/investor/CSR routing options |
| Contact | `contact.html` | Keep |
| Governance / anti-fraud | `governance.html` | Keep — it already delivers the accountability the doc demands |
| **Faith in Motion campaign** | `faith-in-motion.html`, `walk.html`, `church.html`, `give.html`, `roll.html` | Keep intact — flagship campaign, linked as a featured project |
| Collections console | `admin/index.html` | Keep |

**Navigation (org site):** `Home · About · What we do · Projects & impact · Partnerships · News` + **Get in touch** button. "Our development model" is linked prominently from Home and About/What-we-do rather than crowding the top nav.

---

## 4. Page-by-page build spec

All pages: reuse `css/pdm.css` + `js/pdm.js`, the shared header/footer, `.page-hero`, `.blk`, `.wrap`, `.reveal`, `.spec`, `.sec`, `.sec-sub`. Prefer existing components — `.gov`/`.gc` (card triads), `.facts`/`.f` (stat cells), `.dlist` (criteria lists), `.tl`/`.tlx` (timelines), `.prof` (profile cards), `.board` (status table). Add **one** new component only where noted (pillar card, model pathway).

### 4.1 `index.html` — Home (rework)
- **Hero** — keep "One foundation. Many doors." *or* elevate to the institutional line: "*[NAME TO CONFIRM] mobilises communities, partnerships and investment to build lasting solutions across Uganda.*" Keep the live Faith in Motion band below.
- **Four pillars strip** — new `.pillars` grid (4 cards): Education · Health · Climate & green development · Financial inclusion. One line each, linking to `what-we-do.html#<pillar>`.
- **Development model teaser** — one row summarising the ICIADM pathway → link to `model.html`.
- **Impact strip** — `.facts` row with the consolidated numbers **rendered as `[TO CONFIRM]` placeholders** (e.g. "UGX —" / "communities reached —") until verified. Never hardcode the doc's raw figures.
- **Featured projects** — keep the directory cards (Faith in Motion live; apartments; +1) but reframe under "Projects & impact."
- **Partnership CTA** — "Government, donor, business, investor or community — there's a way in" → `partnerships.html`.

### 4.2 `about.html` — About (rework)
Sections, all qualitative (safe) content from the doc:
- **Who we are** — umbrella organisation bringing **55+ members `[TO CONFIRM]`** together for mutual support, resource mobilisation and community development.
- **Vision & Mission** — two `.prof` cards. Adapt the doc's vision/mission into the site's plain voice (no guaranteed outcomes).
- **Core values** — `.facts`/`.gov` row: Integrity · Excellence · Accountability · Collaboration, one-line gloss each.
- **Strategic priorities** — the four connected priorities from the P4D profile (Economic empowerment · Improved livelihoods · Improved education · Support for women & girls) as a `.gov` 2×2.
- **What we've done** — member support (housing, school fees, medical, welfare) via `.dlist`; community leadership (church-construction → St Joseph's/Faith in Motion; a school-development project) — **no figures**.
- **Leadership & governance** — keep the people cards; add **registration number / legal status `[TO CONFIRM]`**.
- Keep "The method" (gateway) section — it now reads as *how* the institution delivers.

### 4.3 `model.html` — Our Development Model (new)
- Hero + intro to **ICIADM** (Integrated Community Investment and Asset Development Model).
- **Pathway visual** — the 9-step flow: *Community mobilisation → Partnership building → Local resource mobilisation → Strategic investment → Asset development → Sustainable service delivery → Income generation → Reinvestment → Community transformation.* Build as a horizontal/wrapping chip flow **or** a styled `.tl` timeline (reuse) — new `.pathway` component only if the chip flow needs it.
- **Key principles** — `.dlist` of the doc's 10 principles (community ownership, domestic resource mobilisation, partnerships, professional governance, sustainable assets, inclusive growth, innovation, climate-responsive investment, responsible reinvestment, long-term resilience).

### 4.4 `what-we-do.html` — Four pillars (new)
One section per pillar, each: intro sentence + `.dlist` of programme areas (verbatim-adaptable from the doc).
- **Education** — schools/classrooms, ICT & science labs, libraries, teachers' accommodation, sanitation, equipment, digital learning, capacity building.
- **Health** — HC II/III/IV, hospitals/maternity, theatres & labs, staff housing, equipment & ambulances, renewable energy, WASH, digital health.
- **Climate & green development** — solar/mini-hydro/biogas, climate-smart agriculture, irrigation, afforestation, green infrastructure, waste management, environmental education.
- **Financial inclusion & community enterprise** — VSLAs/SACCOs/cooperatives, youth & women enterprises, financial literacy, investment readiness, incubation, digital finance, community-owned assets.
- Note: frame pillars as **programme areas / intent**, not delivered claims, unless a specific project is verified.

### 4.5 `projects.html` — Projects & Impact (rework)
- **Status board** (`.board`) with three states: **Completed · Ongoing · Pipeline**.
- Project rows drawn from the doc, each labelled with an honest status and figures held as `[TO CONFIRM]`:
  - Faith in Motion / St Joseph Rwembyo (live) → links to campaign.
  - Kasese Apartment Project (pipeline / EOI) → `apartments.html`.
  - Community works (in preparation) → `community.html`.
  - Medical outreach — Kasese (past) `[TO CONFIRM: 600+ beneficiaries, 10 Jun 2023, partners]`.
  - Pamodzi 4 Development — Kasese; Udada Women Entrepreneurs; TBS Meridian; Business Legends Group → **only if the client approves them as public**; otherwise omit or mark clearly as member/investment platforms, not donation projects (see D2 + doc §11 "communication separation").
- **Impact summary** — consolidated stats as `[TO CONFIRM]` placeholders.
- Reusable project-profile template (the `.prof` pattern already in `apartments.html`/`community.html`) so new verified projects slot in without a rebuild.

### 4.6 `partnerships.html` — Partnerships (new)
- Intro: how the institution works with partners.
- **Audience pathways** (`.gov` cards, each with a clear next action → `contact.html` with the right routing): Government & districts · Development partners & donors · Financial institutions & impact investors · Foundations · Private sector / CSR · Professional associations · Civil society & faith-based · Academic & research · Community groups, SACCOs & cooperatives · Rotary/Lions/alumni networks.
- Reinforce **§11 communication separation**: donations ≠ sponsorships ≠ membership ≠ commercial investment ≠ grants — each with correct legal description.

### 4.7 `updates.html` — News & Stories (rework)
- Keep the data-driven feed (`js/updates-data.js`); extend the schema if needed for categories: Walk updates · Medical camps · Community enterprise · Milestones · Partner announcements.
- Seed with **verified** entries only; hold unverified milestones.

### 4.8 `contact.html` — Contact / Partner With Us (extend)
- Keep the routed mailto enquiry form. Extend the "Which project / reason" selects to include partner, investor/CSR, government, media, community-proposal routing.
- Show the **one official public contact** `[TO CONFIRM]` (doc: Sylvia's personal number must **not** be the public campaign contact).
- Keep the anti-fraud / official-channel line.

### 4.9 `governance.html` — keep
Already delivers accountability, follow-the-money, anti-fraud. Add a line tying it to the doc's "only reconciled figures published" and "THE 97 never holds donations."

---

## 5. New components to add to `pdm.css` (minimal)
Only two, styled to the existing tokens; everything else reuses current classes:
1. `.pillars` / `.pillar` — 4-up responsive card grid for the strategic pillars (collapses to 1 col on mobile).
2. `.pathway` — the ICIADM step-flow (numbered chips with connectors). If time-boxed, reuse `.tl` instead and skip this.

No JS changes required beyond the existing self-activating features; `js/pdm.js` already handles reveals, toast, and the enquiry mailto.

---

## 6. Content rules (from doc §12 + site governance)
- Convert the 19-page strategic document into **concise web copy** — short sentences, sentence case, one idea per block; remove repetition; simplify jargon.
- **Separate achievements from plans** — programme areas are intent, not delivered results, unless verified.
- **Never** publish an unverified figure, partner name, date, or investment claim — use `[TO CONFIRM]`.
- **No guaranteed outcomes.** No projected returns on the apartment/investment modules (doc §7 + §11).
- Standardise the organisation name to the single confirmed token (D1).

---

## 7. Inputs required from the client before launch (doc §13 + §"Information required")
Governance / identity: exact registered name, registration number & legal status, official address, leadership names + bios + photos, board/governance info, approved logo files & brand colours, official slogan.
Projects & impact: current/pipeline projects & status, exact locations, dates, beneficiary numbers, budgets/approved summaries, supporting evidence, approved partner names & logos.
Media: photographs (each with name, date, location, description, orgs involved, permission to publish).
Contact & conversion: confirmed public phone, confirmed Mobile Money/bank details where public contributions are accepted, official social links, main contact person, partnership-enquiry recipient.
**Every impact statistic and financial figure needs written finance-verifier approval before it goes public.**

---

## 8. Delivery phases (sequenced, each verified before the next)

- **Phase A — Foundation & IA.** Add the two `pdm.css` components; set up nav; create empty `model.html`, `what-we-do.html`, `partnerships.html` from the shared header/footer template; introduce the `[NAME TO CONFIRM]` and `[TO CONFIRM]` tokens.
- **Phase B — About + What We Do + Model.** Build the qualitative institutional content (vision, mission, values, priorities, pillars, ICIADM). No figures. This is the bulk of "completing the PDM identity."
- **Phase C — Projects & Impact + Partnerships + News.** Rework `projects.html` into the 3-state board; build `partnerships.html`; extend `updates.html`. All figures as `[TO CONFIRM]`.
- **Phase D — Home rework + Contact routing + Governance tie-in + verification sweep.** Wire the homepage pillars/model/impact/partnership CTAs; extend contact routing; final consistency + governance pass.

Each phase: commit to `claude/redesign-bit-write-plan-udf9ql`, screenshot key pages at 360px & desktop, fix visual issues.

---

## 9. Verification (acceptance checks)
1. **`node --check js/pdm.js js/fim.js`** pass; every `id`/`data-*` referenced by JS exists after edits.
2. **No unverified figures live:** `grep` for `450,000,000`, `600,000,000`, `902`, `2.19`, `1,240,800,000`, `2,000` km, `55 members`, `600` beneficiaries → each is either absent or inside a `[TO CONFIRM]` marker. Produce the list of every `[TO CONFIRM]` at handover.
3. **Name consistency:** one brand token throughout; `grep` shows no stray mix of "PCI Uganda" / "Pamodzi Community Initiative" / "Pamodzi for Development" outside the agreed usage.
4. **Nav & links:** every new page reachable; no dead links; footer updated.
5. **Governance present:** funds-go-direct, reconciled-figures-only, THE 97-never-holds, anti-fraud channel, communication-separation — all literally on the shipped pages.
6. **Mobile:** 360px, nothing overflows, tap targets ≥44px; `prefers-reduced-motion` respected (existing behaviour).
7. **Serve locally** (`python3 -m http.server`), screenshot Home / About / What we do / Model / Projects / Partnerships; review and fix.

---

## 10. Explicitly out of scope (this build)
- Private member directory / questionnaire CRM (needs a backend — D5).
- Live payment-provider (Pesapal/card) integration, donor logins, recurring giving — future modules.
- Real photographs (client supplies; SVG placeholders stay).
- Purchasing/DNS for `pamodzici.com` (client action; add `CNAME` after).
- Any figure, partner, or investment claim not yet verified.
