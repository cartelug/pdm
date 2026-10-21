# Architecture of pamodzici.com

This is the one place that says how the site is built, what is protected, how a change is proven safe, and which decisions have been taken. If another document disagrees with this one, this one wins and the other is wrong. Update it in the same pull request as the code it describes.

Last verified against the repository on 21 October 2026.

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
| `src/design/generated/tokens.css` | Generated from the tokens. Not linked by any page yet. |
| `css/`, `js/` | Stylesheets and scripts for the protected lane and Faith in Motion |
| `js/wfe-data.js` | The canonical Walk for Education campaign record (section 5) |
| `assets/` | Images, fonts, brand masters, price table (`assets/data/step-prices.json`) |
| `api/`, `admin/` | PHP services and consoles |
| `scripts/` | Build, export, asset hashing, price generation, protected-file check, token generation |
| `tests/` | Ledger and HTTP tests, browser tests, and the quality gates in `tests/quality/` |
| `docs/archive/` | Superseded plans, kept for history |

## 4. Protected files

Pledge, price, bounds, referral, session, ledger and payment behaviour must not change by accident. `tests/protected-campaign/baseline.json` records the SHA-256 of 130 files, and `npm run check:protected` fails if any of them changes or disappears.

A presentation-only change to a protected file is allowed through a reviewed exception: make the change, add an entry to `presentationReviews` in the baseline with the previous hash, the date and the reason, and update the file's hash. Do this only for changes to appearance, never to pledge, price, payment or register logic.

Two further checks look at what a protected page is allowed to *contain*, so a redesign cannot quietly drop a hook:

- **Hooks** (`npm run check:hooks`): every id, data attribute, form field with its bounds, form action, script source and inline script on the protected pages must still exist.
- **Fragments** (`npm run check:fragments`): eleven blocks (pledge chooser, official channel cards, certificate rules, pledge and enquiry forms, status notices) must stay byte-identical to the recorded text.

Both can be pointed at another build with `--root <dir>`, which is how a rebuilt page is proved equivalent. `--record` accepts the current markup as the new reference; it is a reviewed act, not a routine one.

## 5. Where a fact lives

A campaign fact has one home and everything else must agree with it. The home is `js/wfe-data.js`, plus `assets/data/step-prices.json` for per-country prices. A null date, total or stage means "not yet verified" and must never be replaced with a guess or shown on a page.

Today the same facts are also typed in browser scripts, in two PHP files and in page copy. `npm run check:facts` reads all of those places, lists how many mention each fact, and fails if any disagrees with the record. It reads files only and never edits them. The maximum of 20,000 steps is not in the campaign record yet; it lives in the price table and in code.

## 6. Design system

`src/design/tokens.json` holds colour for both brands (`pci`, `walk`), type scale, space, radius, layers, motion and the three breakpoints (640, 900 and 1200 px, min-width only). `npm run tokens` generates `src/design/generated/tokens.css`, where a brand is chosen with `data-brand="pci"` or `data-brand="walk"` and PCI is the default.

- `npm run check:tokens` fails if the generated file is out of date, or if a core brand colour is not already used by today's CSS (adopting the tokens must recolour nothing).
- `tests/quality/contrast.cjs` measures every declared text and graphic pair with the WCAG 2.2 formula, for both brands, and confirms that gold, cyan and sun still fail as text on light surfaces so they stay fills and decoration only.

Today's live typography is not yet one system:

| Page family | Fonts in use now |
| --- | --- |
| Institutional | Inter, Instrument Serif, Geist Mono |
| Walk home, Contribute form and payment result | Montserrat |
| Walk inner pages and the certificate check | Bricolage Grotesque, Manrope, Inter, Instrument Serif |
| Faith in Motion | Bricolage Grotesque, Manrope, JetBrains Mono, Instrument Serif |

All are self-hosted on the public pages. The decided target is Archivo for headings and figures and Lexend for text (decision D1); it is not applied to any page yet.

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
| Responsive | `npm run test:responsive` | Sideways scroll, clipped content, small targets, small text at 320 to 1536 px, landscape and 200% text | Report only for now; add `--strict` once its list is clean |

The browser gates need Chromium. If Playwright cannot find its own revision, set `PCI_TEST_CHROMIUM` to a Chromium binary.

The latest recorded results and the list of problems the responsive gate finds today are in [docs/quality/BASELINE-2026-10-21.md](docs/quality/BASELINE-2026-10-21.md).

## 8. Releases and previews

- `main` is deployed to the cPanel host by `.github/workflows/deploy-pdm.yml` after the validation and test steps pass. The upload leaves out tests, tooling and every `*.md` file.
- Every pull request also builds a static preview (`.github/workflows/preview.yml`) and uploads it as a downloadable artifact. The preview has no `api/` or `admin/`, so pledges cannot be saved and no payment is reachable.
- Server rules (compression, caching, security headers, redirects) are applied on the host, not committed to the repository, because a committed `.htaccess` would overwrite the host's. See [SERVER-CONFIG-PACK.md](SERVER-CONFIG-PACK.md).

## 9. Documents

| Document | Status |
| --- | --- |
| `ARCHITECTURE.md` (this file) | Current. The one description of the platform. |
| `README.md` | Current. Day-to-day publishing steps and the register workflow. |
| `V3-IMPLEMENTATION.md` | Current for the Astro lane: deployment contract, protected baseline, contact configuration, release gates. |
| `EDITORIAL-REDESIGN.md` | Records the live institutional look. Stays accurate until the design tokens replace it. |
| `PESAPAL-HANDOVER.md` | Current. Payment module configuration, testing and launch gates. |
| `SERVER-CONFIG-PACK.md` | Current. Server rules for the host administrator. |
| `WALK-FOR-EDUCATION-FINISH-PLAN.md` | Current. The facts and approvals only the campaign team can confirm. |
| `WFE-EXPERIENCE-HANDOVER.md`, `WFE-IMAGE-ASSETS.md`, `PCI-PLEDGE-V2-RELEASE.md` | Current records of campaign behaviour, image provenance and the country-first pledge release. |
| `docs/archive/` | Superseded plans. Do not follow them. |

## 10. Decisions

Decisions come from the platform plan of 21 October 2026. A decision is reversible unless it says otherwise. D17, D18 and D20 are hosting and operations decisions held with the host owner and are not listed in this public file.

| # | Decision | Why |
| --- | --- | --- |
| D1 | Fonts are Archivo for headings, menus, buttons, labels and figures, and Lexend for paragraphs, forms and small text. No italics. | The owner's choice |
| D2 | Archivo is a weight-only file, with no width axis. | A weight-only file cannot look stretched |
| D3 | Three breakpoints only: 640, 900 and 1200 px, min-width. | There are 37 distinct breakpoint widths in the stylesheets today |
| D4 | Faith in Motion becomes a frozen campaign archive, restyled only through `css/fim-v3.css`. | A finished campaign with a live register |
| D5 | Protected JavaScript and PHP are not edited by the redesign. | Money safety |
| D6 | Gold, cyan and sun are fills and decoration, never text on a light surface. | They fail contrast |
| D7 | One platform: Astro builds every public page, and the markup that carries pledge and payment hooks is included as frozen fragments. Migrate one page at a time with an equivalence proof, keeping the old version for rollback. | Best fit for safety, speed and upkeep on a static plus PHP host |
| D8 | No public URL changes without the product owner's approval. | Links live in WhatsApp groups for years |
| D9 | Retire the blocking splash screen on content pages. | It forces a delay on every first visit |
| D10 | Move the gallery and resources to their own page. | They are the heaviest part of the heaviest page |
| D11 | The campaign state (preparing, dated, walking, arrived, completed, archived) decides what the pages show. | Pages stay honest as the campaign moves |
| D12 | One campaign record, and a build check that fails on a conflicting fact. | Facts are typed in many places today |
| D13 | Regroup PCI navigation into five items. | Labels overlap today |
| D14 | Replace the 18 meta-refresh stubs with server 301 redirects, keeping the stubs as a fallback. | Faster and better for search |
| D15 | Cookieless analytics and real-user speed measurement. | Without it no one can tell what works |
| D16 | Every change gets a preview before it ships. | Review on a phone before anything merges |
| D19 | One `ARCHITECTURE.md`; older plans are archived. | The old documents disagreed |
| D21 | English now, with a structure ready for translation. | The language list is a PCI decision |
| D22 | No dark theme now; colour goes through tokens so one can be added. | Not a need today |
| D23 | Stop committing generated HTML once the migration is complete. | It duplicates what CI builds |
| D24 | Each release ends with a short documentation pack: what changed, gate results, speed numbers, what is unchanged on purpose, the rollback point. | Fits the approval routine |

## 11. What changes next

The order is set in the plan; this repository tracks it by the gates above. The visible work (self-hosted Archivo and Lexend, retiring the splash screen, one look across the Walk pages, the PCI restyle) starts only after the baseline in `docs/quality/` is recorded and the product owner approves a preview. Migrating the protected Walk and Contribute pages needs the owner's explicit authority and is done one page at a time under the protocol in section 4.
