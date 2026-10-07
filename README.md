# Pamodzi for Development

Static pages with PHP campaign registers and collections services for **Pamodzi Community Initiative**, **Faith in Motion** and **Walk for Education**.

Live site: https://pamodzici.com/

## Pesapal preparation (4 October 2026)

The current deployment target is cPanel at https://pamodzici.com/ through the
GitHub Actions workflow. The existing static presentation and PHP campaign
registers remain intact. Payment preparation now includes `/contribute/`, a
private SQLite ledger outside the document root, and `/admin/collections/`.
Checkout is closed until Pesapal configuration and PCI approvals are complete.
See `PESAPAL-HANDOVER.md` for configuration, testing and the remaining launch gates.

## Site structure

The public pages have no framework or build step. Campaign updates use PHP; the
new payment module uses a private SQLite ledger on the cPanel server.

- Institutional pages: `index.html`, `about.html`, `what-we-do.html`, `model.html`, `impact.html`, `projects.html`, `partnerships.html`, `governance.html`, `contact.html`, and `updates.html`.
- Project pages: `apartments.html`, `community.html`, and the Faith in Motion campaign pages.
- Campaign data: `js/roll-data.js` drives the public progress, tallies, route attribution, and Roll of Honour.
- Updates data: `js/updates-data.js` drives the updates feed.
- Shared presentation: `css/base.css` supplies the site-wide tokens, header, navigation, buttons, grids, forms, footer and responsive rules. `css/pci.css`, `css/pdm.css` and `css/fim.css` contain only their page-family components.
- Shared behavior: `js/core.js` owns accessible mobile navigation, header state and page progress on the institutional and Faith in Motion pages. Page-family scripts contain only their own forms, feeds, campaign data and route instruments.
- Global preloader: `css/preloader.css` and `js/preloader.js` drive the branded loading screen on every public page (see **Front-end architecture** below).
- Shared motion: `css/motion.css` and `js/site-motion.js` provide the progressive hero sequence, grouped scroll reveals, image loading transitions, restrained background parallax, responsive navigation choreography and internal-page transitions.
- Maintenance console: `admin/index.html`.

Public contributor labels are published only when supplied or approved for publication. Private personal details are not added to the ledger; only the committee-supplied campaign payment details are public. A `promised` entry is displayed separately and does not count toward received-and-pledged totals or sponsored-road progress.

## Publish

The GitHub Actions workflow deploys website files from `main` to cPanel. It
excludes tests, documentation and configuration examples, preserving server-only
live registers and private payment data.

```bash
git push origin main
```

The `.nojekyll` file keeps the static source unchanged during publication. `sitemap.xml`, `robots.txt`, canonical links, and social-preview metadata are maintained in the repository root.

## Update the campaign register

1. Open `/pdm/admin/`.
2. On the **Pledges** tab, enter the console password once ("Unlock live publishing"). From then on, every add, edit, status change or removal publishes to the live site automatically within seconds via `api/roll.php` — no commit, no push, nothing to paste anywhere.
3. Add, edit, remove or reorder story cards in **Journey updates** — this part is unchanged: open **Publish**, copy the generated journey block, and replace `window.FIM_UPDATES` in `js/fim-content.js`.
4. Review names, amounts, statuses, consent, image paths and factual alternative text before publishing.

`js/roll-data.js` is now only a fallback: campaign pages try the live register first and only fall back to this bundled file if that request fails for any reason. Refresh it occasionally from the Publish tab's "Optional · Update the bundled backup file" card so the fallback doesn't drift too far from reality — it is not required for a contribution to go live.

The backup download still includes both the contribution register and journey collection, useful for an offline copy or to recover a session. The maintenance console is a browser-side tool, marked `noindex` and not linked from public pages. See `api/README.md` for how the live-publishing endpoint itself works and how to change its password.

## Walk for Education campaign

Pages live under `walk-for-education/` and share one stylesheet, `css/wfe.css`, and these scripts (in load order): `js/wfe-shell.js` (menu, step chooser, checkout availability, reveals, sticky shortcut, sharing), `js/wfe-data.js` (source facts), `api/campaign.php` (live record) and `js/wfe.js` (rendering and enquiries). The partnerships page adds `js/wfe-partners.js`. The contribution pages use `css/contribute.css` and `js/contributions.js`.

- **Source facts** (1,100 km, UGX 25B goal, student numbers, named roles) live in `js/wfe-data.js` and change only by code edit.
- **Verified live values** — dates, distance walked, route stages, step value, payment channels, reconciled totals, field notes and newly confirmed partners — are published from `/admin/wfe.html` (same password as the Faith in Motion console) through `api/campaign.php`. Nothing needs a commit.
- Every section that shows one of those values stays hidden until it holds a verified value, so the site can never display a guessed number.
- **Ambassador links:** any campaign link with `?ref=club-name` tags every enquiry, pledge message, share and analytics event from that visitor with the club or ambassador's name. `?steps=100` preselects an amount in the step calculator once a step value is published.
- Share preview image: `assets/og/walk-for-education.jpg` (1200×630).

## Step prices by country

The campaign asks for the visitor's country first; the country sets the currency and the price of a step (Uganda
UGX 5,000, Kenya KSh 200, every other country a rounded equivalent). One file, `assets/data/step-prices.json`, is read
by the pages (`js/step-pricing.js`) and by the payment API, and is generated by `scripts/step-prices.mjs`. To change a
price: edit that script, run `npm run prices`, commit (`npm run lint` fails if the file is stale). Which currencies can
actually be paid online is the separate `payment_currencies` setting; see `PESAPAL-HANDOVER.md`.

## Front-end architecture

There is still no build step: every page links its CSS and JS directly. A small set of dev tools keeps that source consistent.

| Page family | Stylesheets (in order) | Scripts (in order) |
| --- | --- | --- |
| Institutional (`/`, `/about/` …) | `preloader` · `base` · `pci` · `motion` | `preloader` · `core` · `pci` · `site-motion` |
| Projects (`/apartments/` …) | `preloader` · `base` · `pdm` · `motion` | `preloader` · `core` · `pdm` · `site-motion` |
| Faith in Motion | `preloader` · `base` · `fim` · `motion` | `preloader` · `roll-data` · `core` · `fim` · `site-motion` |
| Walk for Education | `preloader` · `wfe` | `preloader` · `wfe-shell` · `wfe-data` · `campaign.php` · `wfe` |
| Contributions | `preloader` · `base` · `collections` · `contribute` | `preloader` · `contributions` |

**Preloader.** Every public page opens `<body>` with the `.site-loader` markup and loads `css/preloader.css` plus `js/preloader.js` (synchronously) in `<head>`, before any other stylesheet. The script turns the screen on only when JavaScript runs, reveals the approved logo once it has decoded, and dismisses it after the page loads: at least 0.9 s on the first view of a session, on later pages only as long as they take to load, never longer than 2.8 s, and instantly with reduced motion. A CSS failsafe hides it after 6 s in any case. Scripts can wait for it with `window.PamodziPreloader.whenDone(fn)` or the `pamodzi:preloaded` event; the hero sequence and campaign scroll reveals start there. Campaign and contribution pages use `data-variant="wfe"`.

New public page? Copy the `<head>` preloader lines and the `.site-loader` block from a sibling page; `npm run check:pages` fails until both are present.

**Stylesheets** open with a contents list, use design tokens from `:root`, and keep each component's responsive rules directly after it (widest breakpoint first). Campaign class namespaces: `.wfe-*` shell, `.wfe2-*` shared sections, `.v3-*` campaign home, `.wfp-*` partnerships page. Media queries stay in `min-width`/`max-width` form for older iOS Safari. Hover styles live inside `@media (hover: hover)` so they never stick after a tap on a phone (`npm run css:hover` wraps new ones; the lint fails on any left outside); touch screens get `:active` feedback instead, and form fields stay at 16px on touch screens so iOS Safari does not zoom into them.

**Commands** (Node 22; run `npm install` once):

```bash
npm run lint          # ESLint, Stylelint, Prettier check, page structure, asset hashes
npm run format        # Prettier for css/, js/, scripts/ and tests/
npm run assets        # stamp every CSS/JS reference with ?v=<content hash>
npm run css:compact   # merge duplicate CSS rules where the cascade provably allows it
npm run css:hover     # move new :hover rules inside @media (hover: hover)
npm run test:browser  # Playwright journeys (needs PHP and Chromium; see tests/)
```

Run `npm run assets` after editing anything in `css/` or `js/`: references carry a hash of the file's contents, so browsers fetch a file again exactly when it changes. `js/roll-data.js` and `js/fim-content.js` are refreshed from the admin console and are excluded from formatting; a stale hash on those only warns. The **Front-end quality** workflow runs `npm run lint` on every pull request and push to `main`. Deployment excludes all tooling files.

## Motion and accessibility

Motion is progressively enhanced with compositor-friendly transforms and opacity. It is disabled when a visitor requests reduced motion. The mobile experience removes background travel and magnetic pointer effects, keeps touch targets unchanged and preserves the existing keyboard-accessible navigation.

## Contribution safety

The campaign pages publish the payment details supplied by the Construction Committee. Contributors are still directed to verify the beneficiary name before sending and retain their transaction reference for reconciliation. WhatsApp remains an enquiry and confirmation channel.

## Photography

The institutional homepage uses two purpose-built responsive hero assets:

- `assets/hero/pamodzi-family-hero-desktop.jpg` for wide screens and interior-page mastheads
- `assets/hero/pamodzi-family-hero-mobile.jpg` for the mobile-safe homepage crop

All content sections carry a deliberately softened photographic layer. Faith in Motion sections rotate through the supplied journey archive so the campaign remains grounded in the real walk.

Campaign pages include neutral illustrated fallbacks. The walker and road slots use the supplied Faith in Motion photography by default. Additional photographs can be assigned in each page’s `window.FIM_ASSETS` object:

```js
window.FIM_ASSETS = {
  walker: "assets/walker-on-road.jpg",
  church: "assets/st-joseph-today.jpg",
  road: "",
  parish: "",
  build: ""
};
```

If an assigned image is unavailable, the illustrated fallback remains visible.
