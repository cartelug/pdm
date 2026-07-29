# Pamodzi for Development

Static GitHub Pages site for **Pamodzi for Development** and the **Faith in Motion** campaign.

Live site: https://cartelug.github.io/pdm/

## Site structure

The site has no framework, build step, database, or server runtime.

- Institutional pages: `index.html`, `about.html`, `what-we-do.html`, `model.html`, `impact.html`, `projects.html`, `partnerships.html`, `governance.html`, `contact.html`, and `updates.html`.
- Project pages: `apartments.html`, `community.html`, and the Faith in Motion campaign pages.
- Campaign data: `js/roll-data.js` drives the public progress, tallies, route attribution, and Roll of Honour.
- Updates data: `js/updates-data.js` drives the updates feed.
- Shared presentation: `css/`, `js/`, and `assets/`.
- Maintenance console: `admin/index.html`.

Public contributor labels are published only when supplied or approved for publication; private contact and payment details never appear. A `promised` entry is displayed separately and does not count toward received-and-pledged totals or sponsored-road progress.

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

The public site does not publish a payment account. Contributors are directed to request the current approved transfer instructions and beneficiary name, verify both with the Construction Committee, and only then send funds. WhatsApp is presented as an enquiry channel, not a payment channel.

## Photography

Campaign pages include illustrated fallbacks. Optional photographs can be added to `assets/` and assigned in each page’s `window.FIM_ASSETS` object:

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
