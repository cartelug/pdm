# Pamodzi for Development

Static GitHub Pages site for **Pamodzi for Development** and the **Faith in Motion** campaign.

Live site: https://cartelug.github.io/pdm/

## Site structure

The site has no framework, build step, database, or server runtime.

- Institutional pages: `index.html`, `about.html`, `what-we-do.html`, `model.html`, `impact.html`, `projects.html`, `partnerships.html`, `governance.html`, `contact.html`, and `updates.html`.
- Project pages: `apartments.html`, `community.html`, and the Faith in Motion campaign pages.
- Campaign data: `js/roll-data.js` drives the public progress, tallies, route attribution, and Roll of Honour.
- Updates data: `js/updates-data.js` drives the updates feed.
- Shared presentation: `css/base.css` supplies the site-wide tokens, header, navigation, buttons, grids, forms, footer and responsive rules. `css/pci.css`, `css/pdm.css` and `css/fim.css` contain only their page-family components.
- Shared behavior: `js/core.js` is the single owner of the approved-brand loader, accessible mobile navigation, header state and page progress. Page-family scripts contain only their own forms, feeds, campaign data and route instruments.
- Shared motion: `css/motion.css` and `js/site-motion.js` provide the progressive hero sequence, grouped scroll reveals, image loading transitions, restrained background parallax, responsive navigation choreography and internal-page transitions.
- Maintenance console: `admin/index.html`.

Public contributor labels are published only when supplied or approved for publication. Private personal details are not added to the ledger; only the committee-supplied campaign payment details are public. A `promised` entry is displayed separately and does not count toward received-and-pledged totals or sponsored-road progress.

## Publish

GitHub Pages is configured to deploy the repository root from `main`.

```bash
git push origin main
```

The `.nojekyll` file keeps the static source unchanged during publication. `sitemap.xml`, `robots.txt`, canonical links, and social-preview metadata are maintained in the repository root.

## Update the campaign register

1. Open `/pdm/admin/`.
2. Add or edit entries in the **Pledges** tab.
3. Add, edit, remove or reorder story cards in **Journey updates**.
4. Open **Publish** and copy the generated sponsor and journey blocks.
5. Replace `window.ROLL_DATA` in `js/roll-data.js` and `window.FIM_UPDATES` in `js/fim-content.js`.
6. Review names, amounts, statuses, consent, image paths and factual alternative text before committing.

The backup download now includes both the contribution register and journey collection. The maintenance console is a browser-side tool. It is marked `noindex`, is not linked from public pages, and does not persist changes to GitHub by itself.

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
