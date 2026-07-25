# Faith in Motion · Pamodzi for Development

The digital home for **Pamodzi for Development** and its live campaign, **Faith in Motion** — a 345 km walk from Kampala to Kasese to complete St Joseph Rwembyo Catholic Church.

There is no build step, no framework and no server. Every page is a single self-contained HTML file that opens in any browser.

---

## What's in here

**Pamodzi for Development** (the organisation)

| Page | What it is |
|---|---|
| `index.html` | Homepage — live campaign, project directory |
| `projects.html` | Status board — every project, plus how a project opens |
| `apartments.html` | Kasese Apartment Project — profile + expression of interest |
| `community.html` | Community works — the next project, and how to propose one |
| `about.html` | About — who we are, the method, the people |
| `governance.html` | Governance — the rules, how the money moves, anti-fraud |
| `updates.html` | Updates feed — milestones and reconciled figures |
| `contact.html` | Contact — channels + routed enquiry form |

**Faith in Motion** (the live campaign)

| Page | What it is |
|---|---|
| `faith-in-motion.html` | Campaign home — dawn hero, the road so far, roll preview |
| `walk.html` | The walk — route log, halfway milestone, progress, gallery |
| `church.html` | The church — the goal, the stages, giving directly |
| `give.html` | Sponsor a step — the full giving instrument |
| `roll.html` | Roll of Honour — every contribution, in full |

**Shared machinery**

| File | What it is |
|---|---|
| `js/roll-data.js` | **Drives every campaign page** — the sponsor roll |
| `js/updates-data.js` | Drives the Pamodzi updates feed — add entries here |
| `js/fim.js` · `js/pdm.js` · `js/pci.js` | Shared page scripts (each feature self-activates per page) |
| `js/section-scroll.js` · `css/section-scroll.css` | Custom section scroll — one gesture, one move, on desktop and touch |
| `css/fim.css` · `css/pci.css` · `css/pdm.css` | The three design systems, all on the PCI palette |
| `admin/index.html` | Collections console — pledges, links, QR, weekly report |
| `assets/brand/` | Logos · `assets/` is where campaign photos go |
| `BRAND.md` | **Logo and colour reference — read before touching either** |
| `404.html` | On-brand not-found page |

---

## Publishing it on GitHub Pages

1. Push this folder to a GitHub repository (see the commands below).
2. In the repository, open **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Set the branch to **main** and the folder to **/ (root)**. Save.
5. Wait about a minute, then reload. GitHub shows the live address at the top of that page.

Your site will be at:

```
https://cartelug.github.io/faith-in-motion-site/
```

(If the repository is later renamed — e.g. to `pamodzi` — this address changes to
match the new name. GitHub keeps redirects from the old one.)

### Pushing from a terminal

```bash
git remote add origin https://github.com/cartelug/faith-in-motion-site.git
git branch -M main
git push -u origin main
```

### If you prefer not to use a terminal

Create a new empty repository on GitHub, then use **Add file → Upload files** and drag everything in this folder — including the `admin` and `assets` folders — into the browser. Commit, then follow steps 2–5 above.

---

## Using your own domain

1. Create a file named `CNAME` in the root of the repository whose only line is your domain, e.g. `faithinmotion.org`.
2. At your domain registrar, add these DNS records:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `<your-username>.github.io` |

3. Back in **Settings → Pages**, enter the domain and tick **Enforce HTTPS** once the certificate has been issued. It can take up to an hour.

---

## Updating the Roll of Honour each week

1. Open `/admin/` on the published site.
2. Add or edit contributions on the **Pledges** tab. Amounts are in UGX and steps calculate themselves.
3. Go to the **Publish** tab and press **Copy the code block**.
4. Open `js/roll-data.js`, replace its `window.ROLL_DATA = [ … ];` block with what you copied, and commit.

That single file drives **every page** — home, the walk, the roll, the road progress. Nothing else needs touching.

While you're on the Publish tab, use **Download CSV** for the finance record and **Copy the report** for the weekly note to the construction committee.

---

## Adding photographs

The site ships with drawn artwork in every image position and looks complete without a single photo. To add real ones, put the file in `assets/` and name it in the `window.FIM_ASSETS` block near the bottom of each campaign page (they can differ per page, or be kept identical):

```js
window.FIM_ASSETS = {
  walker : "assets/walker-on-road.jpg",
  church : "assets/st-joseph-today.jpg",
  road   : "",
  parish : "",
  build  : ""
};
```

A named slot shows the photo; an empty one keeps the illustration. If a file is missing or fails to load, the artwork stays rather than leaving a broken image. Full guidance is in `PHOTO-SHOT-LIST.md`.

---

## A note on `/admin/`

The console holds no passwords and no private data — the contributor list it manages is the same one already published on the campaign site. But it is a working tool rather than a public page, so it is not linked from anywhere. Share the address only with whoever maintains the roll.

If you would rather it were not published at all, delete the `admin` folder before pushing and run the console from your own computer by opening the file directly.

---

## Before this goes public

Two figures still need confirming, and they must agree everywhere they appear:

- **The goal.** The step arithmetic implies UGX 466.2M (466,200 steps × UGX 1,000); the church states UGX 410M. The site currently shows UGX 410M.
- **The payment channel.** The site publishes Mobile Money **0772 495 733**, Sylvia Kaawe, Chair of the Construction Committee. Confirm this is the official channel, or replace it with the formal church account.

---

## Governance

- Contributions go directly to the church's authorised construction account. The campaign team never receives or holds a donation.
- Only reconciled figures approved by the designated finance verifier are published.
- No fundraising outcome is guaranteed anywhere on this site.

---

Built by **THE 97 · 97 Design** — Akright City, Bwebajja, Wakiso, Uganda.
