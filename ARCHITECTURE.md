# Architecture of pamodzici.com

This is the one place that says how the site is built, what is protected, how a change is proven safe, and which decisions have been taken. If another document disagrees with this one, this one wins and the other is wrong. Update it in the same pull request as the code it describes.

Last verified against the repository on 24 October 2026.

**28 October image-only refresh:** The existing layout and all stylesheets are preserved. `assets/wfe-2026/refresh/scene-map.json` maps existing scene frames to ten reference-led artworks; the 36 school/campus gallery images remain alongside them. Public kit derivatives and requested copy remove Rotary branding. See `docs/quality/IMAGE-REFRESH-2026-10-28.md` for image provenance and narrow protected presentation reviews.


**27 October collections exports:** `/api/operations.php` now supplies a consistent, complete private report via `report-data` to the existing named-account console. `api/lib/operations-reports.php` reads the existing ledger inside a transaction, preserves manual/gateway eligibility and returns per-currency totals. `js/operations-reports.js` creates branded editable PDF forms and an XLSX snapshot locally using the vendored PDF-LIB/fontkit and embedded brand fonts and a self-contained OOXML ZIP writer. CSV remains unchanged. An administrator-only CSRF-protected `download-database` action streams a fresh consistent SQLite snapshot made by the existing private backup helper. Exports never write offline edits back. Supporter lists are not committed to this public repository. See `docs/COLLECTIONS-EXPORT-PLAN-2026-10-27.md`.

**Live operations release:** `docs/OPERATIONS-HANDOVER.md` supersedes the legacy console, shared-password, live-publication and financial-aggregation descriptions below. `/admin/operations/` and `/api/operations.php` reuse the private SQLite ledger with additive tables, named roles, verified-only per-currency totals, import preview, consent, owner versions and snapshot-based PNG exports. `/api/campaign.php` reads that approved projection; its shared-password write route is retired. This is an explicitly authorised functional release, not a presentation-only redesign. `functionalReviews` in the protected baseline records the exact changed files and hashes. Existing pledge, checkout, certificate, pricing and frozen-fragment contracts remain tested.

## 1. What the site is

| Part | URL | What it is | How it is built |
| --- | --- | --- | --- |
| Institutional site (PCI) | `/`, `/about/`, `/what-we-do/`, `/model/`, `/projects/`, `/impact/`, `/partnerships/`, `/governance/`, `/updates/`, `/contact/`, `/apartments/`, `/community/`, `/design-system/` | Who PCI is and what it does | Astro 5 and TypeScript in `src/`, exported as static files into the repository root |
| Walk for Education | `/walk-for-education/` and four inner pages | The 2026 pledge campaign | Hand-written HTML, CSS and JavaScript. **Protected.** |
| Contribute | `/contribute/` and four inner pages | Pledge form, payment result, privacy, terms, certificate check | Hand-written. **Protected.** |
| Faith in Motion | `/faith-in-motion/` and six pages (`/give/`, `/roll/`, `/church/`, `/take-part/`, `/walk/`, `/accountability/`) | The St Joseph Rwembyo walk (journey completed, fundraising continues) and its live register | Hand-written. **Protected.** |
| Services | `api/` | Campaign record, register, payment ledger (SQLite outside the document root), enquiry endpoint, certificate PDF | PHP 8.3. **Protected.** |
| Consoles | `admin/` | Maintenance consoles for the register and campaign | Hand-written. **Protected.** |

There are 49 public HTML files. Eighteen of them are root redirect stubs (`about.html` to `/about/` and so on) that exist so old shared links keep working.

## 2. Two build lanes

```
src/  ──astro build──►  build-v3/  ──scripts/export-v3.mjs──►  repository root (generated HTML is committed)
                                                                      │
hand-written protected pages, js/, css/, api/, admin/  ───────────────┤
                                                                      ▼
                      GitHub Actions: validate, then upload to the cPanel host (static files plus PHP)
```

- Edit `src/`, run `npm run build`, commit the generated pages. Never hand-edit generated institutional HTML.
- The protected lane is not built. Its files are edited only through a reviewed exception (section 4).
- Generated HTML is committed so an upload never needs Node on the server.

Commands: `npm ci`, `npm run build`, `npm run validate` (everything that must pass before a merge).

## 3. Where the pieces live

| Path | Holds |
| --- | --- |
| `src/pages`, `src/layouts`, `src/components`, `src/content`, `src/config` | Institutional pages, layout, content collections, navigation and site configuration |
| `src/styles`, `src/scripts` | Institutional CSS layers and small TypeScript for navigation and motion |
| `src/design/tokens.json` | The design tokens, one source for both brands (section 6) |
| `src/design/generated/` | `tokens.css` and `fonts.css`, generated from the tokens and imported by the Astro layout |
| `css/brand.css` | Generated from the tokens: the two fonts and the tokens for the hand-written pages |
| `css/one-look.css` | The shared layer loaded last on Walk, Contribute and Faith in Motion (section 6) |
| `src/lib/campaign.ts`, `src/lib/projects.ts` | Read the campaign record at build time and turn it into a lifecycle state (section 5) |
| `css/`, `js/` | Stylesheets and scripts for the protected lane and Faith in Motion |
| `js/wfe-data.js` | The canonical Walk for Education campaign record (section 5) |
| `assets/` | Images, fonts, brand masters, price table (`assets/data/step-prices.json`) |
| `api/`, `admin/` | PHP services and consoles |
| `scripts/` | Build, export, asset hashing, price generation, protected-file check, token generation, sitemap and share-card generation |
| `tests/` | Ledger and HTTP tests, browser tests, and the quality gates in `tests/quality/` |
| `docs/archive/` | Superseded plans, kept for history |

## 4. Protected files

Pledge, price, bounds, referral, session, ledger and payment behaviour must not change by accident. `tests/protected-campaign/baseline.json` records the SHA-256 of 130 files, and `npm run check:protected` fails if any of them changes or disappears. Every reviewed exception is listed there with its reason; the Release 1 entries (21 October 2026) cover head-only changes to the ten Walk and Contribute pages and the retirement of the loading screen in `js/preloader.js`.

A presentation-only change to a protected file is allowed through a reviewed exception: make the change, add an entry to `presentationReviews` in the baseline with the previous hash, the date and the reason, and update the file's hash. Do this only for changes to appearance, never to pledge, price, payment or register logic.

The 22 October menu repair is one such exception. `js/wfe-shell.js` is the sole owner of the campaign menu,
including fixed-body scroll locking, keyboard focus, prior inert-state restoration and page/resize cleanup.
`js/wfe-redesign.js` only highlights the current section and supplies decorative motion. The Walk header blur
lives on its `::before` surface in `css/one-look.css`; putting a filter on the header itself would make the
fixed menu resolve against the header rather than the viewport. The menu's `100dvh` sheet scrolls internally
on short screens. Menu and motion changes never change the chooser, country prices, pledge URLs or services.
See [the menu and motion audit](docs/quality/MENU-MOTION-2026-10-22.md) for reproduction and validation.

Two further checks look at what a protected page is allowed to *contain*, so a redesign cannot quietly drop a hook:

- **Hooks** (`npm run check:hooks`): every id, data attribute, form field with its bounds, form action, script source and inline script on the protected pages must still exist.
- **Fragments** (`npm run check:fragments`): eleven blocks (pledge chooser, official channel cards, certificate rules, pledge and enquiry forms, status notices) must stay byte-identical to the recorded text.

Both can be pointed at another build with `--root <dir>`, which is how a rebuilt page is proved equivalent. `--record` accepts the current markup as the new reference; it is a reviewed act, not a routine one.

## 5. Where a fact lives

A campaign fact has one home and everything else must agree with it. The home is `js/wfe-data.js`, plus `assets/data/step-prices.json` for per-country prices. A null date, total or stage means "not yet verified" and must never be replaced with a guess or shown on a page.

Today the same facts are also typed in browser scripts, in two PHP files and in page copy. `npm run check:facts` reads all of those places, lists how many mention each fact, and fails if any disagrees with the record. It reads files only and never edits them. The maximum of 20,000 steps is not in the campaign record yet; it lives in the price table and in code.

### Campaign state

The institutional pages follow the campaign through one small module, `src/lib/campaign.ts`. It reads the record at build time and returns a state: preparing, dated, walking, arrived, completed or archived. An explicit `status` set by the campaign team wins; otherwise the state follows from the start date and the verified distance covered, and a date that is null keeps the campaign in "preparing". The state decides the label ("Pledges open · walk dates to be confirmed", "Walk starts 12 December 2026", "Day 9 on the road", and so on), the call to action, whether the header chip shows, and the Walk project card's status. The home page, the header chip and the projects list all read it, so none of them can disagree with the campaign. `tests/pages/campaign-state.test.cjs` covers every state. The hand-written campaign pages keep their own record-driven behaviour in `js/wfe-shell.js`.

## 6. Design system

`src/design/tokens.json` holds colour for both brands (`pci`, `walk`), type scale, space, radius, layers, motion and the three breakpoints (640, 900 and 1200 px, min-width only). `npm run tokens` generates `src/design/generated/tokens.css`, where a brand is chosen with `data-brand="pci"` or `data-brand="walk"` and PCI is the default.

- `npm run check:tokens` fails if the generated file is out of date, or if a core brand colour is not already used by today's CSS (adopting the tokens must recolour nothing).
- `tests/quality/contrast.cjs` measures every declared text and graphic pair with the WCAG 2.2 formula, for both brands, and confirms that gold, cyan and sun still fail as text on light surfaces so they stay fills and decoration only.

### One type system on every page

MTN Brighter Sans Bold (headings, menus, buttons, labels, figures and anything set bold) and Sky Text (everything else) are used on all three page families, self-hosted as two single-weight files (28 KB together) with fallbacks tuned to Arial's metrics. Sky Text has one weight, so its 600 to 900 weights are declared as the MTN Bold file: bold words inside paragraphs stay on brand and never become a faked bold. Figures are set in MTN Brighter Sans, which has tabular digits. There are no italics anywhere and no third-party font host on a public page (the four admin consoles still load Google Fonts; they are protected files and not public). The family names older stylesheets still write (Archivo, Lexend, Manrope, Inter Variable, Bricolage Grotesque, DM Serif Display, Instrument Serif, JetBrains Mono, Geist Mono Variable, Montserrat) are `@font-face` aliases of the same two files, listed under `fonts.aliases` in `tokens.json`, so no other typeface can be downloaded. `tests/navigation/browser.cjs` fails if any page requests a third font file. The font licence requires a credit, which sits in every page footer; the provenance and licence note is in `assets/fonts/*-LICENSE.txt`.

| Page family | How it gets the system | Palette |
| --- | --- | --- |
| Institutional (Astro) | `src/design/generated/` imported by the layout; `--pci-*` variables point at the tokens | PCI: paper, ink, crimson |
| Walk for Education and Contribute | `css/brand.css` and `css/one-look.css`, loaded last (`data-brand="walk"`) | Walk: ivory, navy, gold, cyan |
| Faith in Motion | the same two files (`data-brand="pci"`) | PCI crimson |

`css/one-look.css` is a migration layer, not a design system. The protected stylesheets name their fonts directly and at high specificity, so it applies the roles with `!important` and points their font variables at the new fonts. Nested text inherits its heading, button or reading role; form controls explicitly use Sky Text. It also holds the narrow-screen and large-text fixes and the 13 px floor. A page that moves to the Astro build drops it. `scripts/pages.mjs` checks that every hand-written page declares its brand, loads the two files in order, preloads only the new fonts and carries no loading screen.

#### The type scale

One scale sets every size, line height and letter-spacing on every public page (tokens 1.2.0, `src/design/tokens.json`; `npm run tokens` writes `--fs-*`, `--lh-*` and `--ls-*`). The institutional layer reaches it through `--pci-fs-*`; the hand-written stylesheets name `--fs-*` directly. No stylesheet invents a size of its own.

| Step | 390 px | 1440 px | Cap | Used for |
| --- | --- | --- | --- | --- |
| `display` | 46 | 92 | 104 | Campaign and home hero titles, the closing band |
| `statement` | 36 | 62 | 72 | One long sentence set large (the manifesto, the closing line) |
| `h1` | 38 | 72 | 80 | The page title; always smaller than a campaign hero |
| `h2` | 30 | 48 | 54 | Section titles |
| `h3` | 22 | 30 | 32 | Card, row and step titles, large figures |
| `h4` | 19 | 22 | 22 | Small titles, bold lead-ins |
| `lead` | 18 | 21 | 22 | The opening paragraph |
| `body` | 16 | 17 | 17 | Running text; line length `--measure` (54ch, about 66 characters in Sky Text) |
| `small` | 15 | 15 | 15 | Secondary text in cards and notes; paragraphs never go below this |
| `ui` | 14 | 14 | 14 | Form labels, fine print, notes |
| `caption` | 13 | 13 | 13 | Capitals labels and captions; nothing on the site is smaller |

Rules the scale enforces: headings use leading 1.04 to 1.25 and tracking from -0.03em (display) to 0 (h4), never the paragraph's 1.65; headline accent words differ by colour, never by size; labels are one style (bold face, capitals, `--ls-label` 0.12em) and capitals are for short labels, not sentences; money and counts use the bold face with tabular figures; `text-wrap: balance` on headings and `pretty` on paragraphs. `ch` is measured in the reading face's wide "0", so `--measure` is 54ch, not 66ch. Two typefaces with one weight each means "weight" is only regular or bold; a stylesheet that declares 450, 560 or 620 is declaring one of the two.

`css/one-look.css` keeps only the cross-cutting roles: label and figure routing, balance, the legal-page title and measure, and a few rules for public pages that share `base.css` and `collections.css` with the staff console, which is deliberately left as it was. Measured at 1440 px, the pages used up to 29 distinct sizes each and 85 across the site; they now use at most 16 each and 27 across the site.

The institutional header is regrouped into five items (Our work, Impact and trust, Partner with us, Updates, About) with light dropdowns that open on focus as well as hover, close with Escape and stay plain links without JavaScript, a campaign chip, and a Contact button. The full header starts at 1200 px; below that the menu sheet shows the groups under small headings. `/design-system/` documents both brands from `tokens.json`, including every contrast ratio.

## 7. Quality gates

`npm run validate` runs the first group. The deploy job runs it too and uploads nothing if it fails. The browser group runs in CI (`.github/workflows/quality.yml`).

| Gate | Command | What it proves | Fails the build |
| --- | --- | --- | --- |
| Types, build, lint, formatting | `npm run validate` | Code compiles, generated pages are current, styles and scripts are clean | Yes |
| Protected files | `npm run check:protected` | No protected file changed except through a recorded review | Yes |
| Tokens and contrast | `npm run check:tokens` | Generated tokens are current; every contrast rule passes | Yes |
| Hooks | `npm run check:hooks` | No pledge, payment, form or register hook was lost | Yes |
| Fragments | `npm run check:fragments` | Frozen blocks are byte-identical | Yes |
| Facts | `npm run check:facts` | Every checked figure agrees with the campaign record | Yes |
| Links | `npm run check:links` | No broken link, anchor, redirect stub or sitemap entry; canonical URLs are right | Yes |
| Ledger and HTTP | `php tests/payments/ledger.php`, `python3 tests/payments/test_http.py`, `python3 tests/enquiry/test_http.py` | Pricing, pledge separation, verification, reconciliation, certificates, enquiry | Yes (CI) |
| Browser regression | `npm run test:browser`, `node tests/navigation/browser.cjs`, `node tests/navigation/motion.cjs`, `node tests/navigation/wfe-redesign.cjs` | Campaign and institutional flows, menu, motion | Yes (CI) |
| Accessibility | `node tests/quality/a11y.cjs` | Zero axe violations, WCAG 2.2 A and AA | Yes (CI) |
| Speed | `node tests/quality/speed.cjs` | Each page stays within `tests/quality/budget.json` on a throttled phone | Yes (CI) |
| Responsive | `node tests/quality/responsive.cjs --strict` | Every public page across 19 viewport/text settings from 320 to 2560 px, including landscape and 200% text. Sideways scroll, edge clipping and crowded targets under 24 px fail; small text, split heading words, narrow headings and clipped wrapped text are reported for review. | Yes (CI) |
| Sitemap | `npm run check:sitemap` | `sitemap.xml` is exactly what the indexable pages produce | Yes |
| Dependencies | `npm audit` | Reported, not enforced: the findings are build tooling and need a breaking Astro upgrade | No (report) |

The browser gates need Chromium. If Playwright cannot find its own revision, set `PCI_TEST_CHROMIUM` to a Chromium binary.

The baseline taken before the redesign is in [docs/quality/BASELINE-2026-10-21.md](docs/quality/BASELINE-2026-10-21.md); the results after Release 1 are in [docs/quality/RELEASE-1-2026-10-21.md](docs/quality/RELEASE-1-2026-10-21.md).

## 8. Releases and previews

- `main` is deployed to the cPanel host by `.github/workflows/deploy-pdm.yml` after the validation and test steps pass. The upload leaves out tests, tooling and every `*.md` file.
- Every pull request also builds a static preview (`.github/workflows/preview.yml`) and uploads it as a downloadable artifact. The preview has no `api/` or `admin/`, so pledges cannot be saved and no payment is reachable.
- `sitemap.xml` is generated (`npm run sitemap`) and checked on every validate. Share cards are generated by `node scripts/og-cards.cjs` from each page's headline, so a link shared on WhatsApp has its own card.
- Dependabot (`.github/dependabot.yml`) proposes tooling and action updates as pull requests.
- Server rules (compression, caching, security headers, redirects) are applied on the host, not committed to the repository, because a committed `.htaccess` would overwrite the host's. See [SERVER-CONFIG-PACK.md](SERVER-CONFIG-PACK.md).

## 9. Documents

| Document | Status |
| --- | --- |
| `ARCHITECTURE.md` (this file) | Current. The one description of the platform. |
| `README.md` | Current. Day-to-day publishing steps and the register workflow. |
| `V3-IMPLEMENTATION.md` | Current for the Astro lane: deployment contract, protected baseline, contact configuration, release gates. |
| `EDITORIAL-REDESIGN.md` | History of the editorial direction (arches, rings, paper and crimson). Its typography section (Inter, Instrument Serif, Geist Mono) was replaced by Archivo and Lexend in Release 1, and those by MTN Brighter Sans and Sky Text on 26 October 2026 (D25). |
| `docs/quality/` | The quality baseline (before) and the Release 1 pack (after). |
| `PESAPAL-HANDOVER.md` | Current. Payment module configuration, testing and launch gates. |
| `SERVER-CONFIG-PACK.md` | Current. Server rules for the host administrator. |
| `WALK-FOR-EDUCATION-FINISH-PLAN.md` | Current. The facts and approvals only the campaign team can confirm. |
| `WFE-EXPERIENCE-HANDOVER.md`, `WFE-IMAGE-ASSETS.md`, `PCI-PLEDGE-V2-RELEASE.md` | Current records of campaign behaviour, image provenance and the country-first pledge release. |
| `docs/archive/` | Superseded plans. Do not follow them. |

## 10. Decisions

Decisions come from the platform plan of 21 October 2026. A decision is reversible unless it says otherwise. D17, D18 and D20 are hosting and operations decisions held with the host owner and are not listed in this public file. The status column records where Release 1 stands.

| # | Decision | Why | Status after Release 1 |
| --- | --- | --- | --- |
| D1 | Fonts are one face for headings, menus, buttons, labels and figures, and one for paragraphs, forms and small text. No italics. | The owner's choice | **Applied** to every page except the admin consoles. The two faces were Archivo and Lexend until D25. |
| D2 | Fonts are weight-only files, with no width axis. | A weight-only file cannot look stretched | **Applied.** MTN Brighter Sans and Sky Text are single-weight files. |
| D3 | Three breakpoints only: 640, 900 and 1200 px, min-width. | There are 38 distinct breakpoint widths in the stylesheets today | **Partly.** Defined once in the tokens and used for the new header (1200 px). The existing stylesheets still use 35 other widths; the responsive gate passes at every tested width regardless. |
| D4 | Faith in Motion becomes a frozen campaign archive, restyled only through `css/fim-v3.css`. | A finished campaign with a live register | **Applied with one difference:** it is restyled through the shared `css/brand.css` and `css/one-look.css` (head change on its seven pages) as well, so all three families share one layer. Its register, scripts and ledger are untouched. |
| D5 | Protected JavaScript and PHP are not edited by the redesign. | Money safety | **Reviewed presentation exceptions:** `js/preloader.js` (decision D9) and the menu/sticky presentation blocks in `js/wfe-shell.js` (22 October repair). Attribution, country pricing, pledge and payment logic are unchanged. No PHP changed. |
| D6 | Gold, cyan and sun are fills and decoration, never text on a light surface. | They fail contrast | **Applied** and tested. |
| D7 | One platform: Astro builds every public page, and the markup that carries pledge and payment hooks is included as frozen fragments. Migrate one page at a time with an equivalence proof, keeping the old version for rollback. | Best fit for safety, speed and upkeep on a static plus PHP host | **Not started for the protected pages.** The equivalence tooling (hooks, fragments, facts) exists and was used to prove Release 1. Migrating the ten live pledge pages into Astro is the largest remaining item and should go one page at a time with a cutover window, as the plan says. |
| D8 | No public URL changes without the product owner's approval. | Links live in WhatsApp groups for years | **Respected.** No URL was added, renamed or removed. |
| D9 | Retire the blocking splash screen on content pages. | It forces a delay on every first visit | **Done** on every page. |
| D10 | Move the gallery and resources to their own page. | They are the heaviest part of the heaviest page | **Not done.** The Walk home already meets its budget (about 2.5 s, 341 KB) and its gallery images load lazily, while the move touches the protected gallery script on the live pledge page. Revisit when the page is migrated. |
| D11 | The campaign state (preparing, dated, walking, arrived, completed, archived) decides what the pages show. | Pages stay honest as the campaign moves | **Applied** to the institutional site (label, call to action, header chip, project card). The hand-written campaign pages keep their existing record-driven behaviour. |
| D12 | One campaign record, and a build check that fails on a conflicting fact. | Facts are typed in many places today | **Applied.** The facts gate reads the record against scripts, PHP, the price table and the pages; the home page's status wording now comes from the record. |
| D13 | Regroup PCI navigation into five items. | Labels overlap today | **Done.** |
| D14 | Replace the 18 meta-refresh stubs with server 301 redirects, keeping the stubs as a fallback. | Faster and better for search | **Prepared** for the host administrator in `SERVER-CONFIG-PACK.md`; applied on the host, not in the repository. |
| D15 | Cookieless analytics and real-user speed measurement. | Without it no one can tell what works | **Not started.** It needs the owner to choose a tool and create the account. The events are already named in the page scripts. |
| D16 | Every change gets a preview before it ships. | Review on a phone before anything merges | **Done** (artifact per pull request). |
| D19 | One `ARCHITECTURE.md`; older plans are archived. | The old documents disagreed | **Done.** |
| D21 | English now, with a structure ready for translation. | The language list is a PCI decision | **Unchanged.** |
| D22 | No dark theme now; colour goes through tokens so one can be added. | Not a need today | **Unchanged.** |
| D23 | Stop committing generated HTML once the migration is complete. | It duplicates what CI builds | **Not started**; it changes the deployment pipeline and waits for the migration. |
| D24 | Each release ends with a short documentation pack: what changed, gate results, speed numbers, what is unchanged on purpose, the rollback point. | Fits the approval routine | **Done:** [docs/quality/RELEASE-1-2026-10-21.md](docs/quality/RELEASE-1-2026-10-21.md). |
| D25 | The two house fonts are MTN Brighter Sans Bold (headings, labels, figures, bold) and Sky Text (reading), used on every public page and in the downloadable graphics. | The owner supplied both files on 26 October 2026 and asked for them to be used site-wide | **Applied** in tokens 1.1.0. One licence caveat is open: the download page labels both fonts CC BY 4.0, but their copyright belongs to Newlyn Works Limited and Sky, so the owner should confirm the terms with the rights holder. The credit is in every footer. To change fonts again, edit `fonts` in `tokens.json` and run `npm run tokens`. |
| D26 | One type scale (display, statement, h1 to h4, lead, body, small, ui, caption) with its own leading and tracking sets every size on every public page; interior titles are smaller than campaign heroes. | The owner asked for far more professional font sizes and usage on desktop and every view | **Applied** in tokens 1.2.0 on 28 October 2026. Reviewed presentation exceptions are recorded for `fim.css`, `wfe.css`, `wfe-launch.css`, `motion.css` and the pages that carry their cache-hash queries. `base.css` and `collections.css` are shared with the staff console and are unchanged. To change a size, edit `type` in `tokens.json` and run `npm run tokens`. |

## 11. What changes next

1. **Migrate the protected pages into Astro**, one at a time, lowest risk first: Walk Updates, Partners, Take Part, Accountability, then the Walk home, then Contribute. Each needs the equivalence proof (hooks, fragments, facts), the existing payment and browser suites, a preview on a phone and a cutover at a quiet hour with the previous release kept for rollback. When a page moves, it drops `css/one-look.css`.
2. **Gallery page and route page** (D10): move the gallery off the Walk home when the home is migrated; add the route page only when verified stages exist.
3. **Measurement** (D15) once a tool is chosen, and the host work (redirects, headers, caching, backups) with the host administrator.
4. **Reduce the remaining breakpoints** to the three in the tokens as each stylesheet is retired.
