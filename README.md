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
2. Add or edit entries in the Pledges tab.
3. Open the Publish tab and copy the generated data block.
4. Replace `window.ROLL_DATA` in `js/roll-data.js`.
5. Review the public labels, amounts, step counts, statuses, and consent before committing.

The maintenance console is a browser-side tool. It is marked `noindex`, is not linked from public pages, and does not persist changes to GitHub by itself.

## Contribution safety

The campaign pages publish the payment details supplied by the Construction Committee. Contributors are still directed to verify the beneficiary name before sending and retain their transaction reference for reconciliation. WhatsApp remains an enquiry and confirmation channel.

## Photography

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
