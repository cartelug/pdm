# Section dividers — plan

**Status:** proposed, awaiting a decision on scope.
**Specimen:** `styleguide/dividers.html` · **Candidate CSS:** `css/dividers.css`

---

## 1. What the site actually has

Before choosing anything, I measured every section boundary on all 19 pages —
the effective background on each side, taken from the rendered page rather than
from the source.

**83 boundaries. They are not the same problem.**

| Type | Count | What the reader sees |
|---|---:|---|
| **Flip** — near-black ↔ white | 50 | A hard tonal change. Already the strongest division available. |
| **Step** — white ↔ off-white `#F5F3F1` | 19 | A soft change. Reads as a division, gently. |
| **Flat** — identical surface both sides | **14** | **Nothing. The sections run together.** |

This is the finding that should drive the work: **60% of the boundaries need no
divider at all**, and only 14 have a real problem. A single divider applied
site-wide would be decoration on 69 boundaries and a fix on 14.

## 2. The principle

> **The boundary type chooses the treatment. Taste only chooses between
> candidates within a type.**

A divider exists to answer "did something change?". Where the surface has
already answered, drawing a line says it twice — which is what makes a site
look busy rather than considered. Where nothing has answered, the reader gets
no pacing at all, which is what makes long pages feel like one undifferentiated
scroll.

## 3. The rule set

| Boundary | Count | Treatment | Why |
|---|---:|---|---|
| Flip (dark ↔ paper) | 50 | **A — nothing** | The tone change is the divider. Protect the edge quality instead: no stray margin collapse, no half-pixel seam. |
| Step (white ↔ off-white) | 19 | **A — nothing**, `C` optional | Already legible. `C` only if a page feels loose in review. |
| **Flat, content → content** | **11** | **E — red seam** | The real fix. See §5. |
| **Flat, content → footer** | **3** | **B — full-bleed hairline** | The footer is not a content section; it wants a structural line, not a branded one. |
| One per long page, max | ~6 | **H — the arc** | The signature moment. See §6. |
| Project pages (`pdm.css`) | — | **F — crop ticks** instead of E | Matches the blueprint register those pages already speak. |

## 4. The candidates, by risk

Rendered at real scale in the specimen. Tiers describe **risk of ageing badly**,
not visual weight.

### Tier 1 — safe. Correct in five years.

- **A · Nothing.** The null option, and the right one 69 times out of 83. Listed
  first deliberately: a divider plan that cannot recommend "no divider" is a
  decoration plan.
- **B · Hairline, full bleed.** 1px `--line`, edge to edge. Divides the *page*.
- **C · Hairline, measure width.** The same rule stopped at the content column.
  Quieter; reads as a paragraph break rather than a page break.
- **D · Numbered index.** The rule carries a section number in Fraunces 300 —
  the `.secno` token that is **already defined in `pci.css` and never used**.
  Highest perceived quality per unit of risk on this list, and it gives the
  reader their position on pages with eight sections.

### Tier 2 — branded. Distinctive, still conservative.

- **E · Red seam.** ⭐ Hairline with a short brand-red tab at the measure's left
  edge. It is the exact geometry of `.eyebrow::before`, which the site already
  uses **36 times** — so it reads as native vocabulary, not as an addition.
- **F · Crop ticks.** Short verticals at the trim edges. Drawing-office
  register; right for the project pages, over-engineered for the institutional ones.
- **G · Seam drawn on scroll.** E, animated in on the existing `.reveal`
  observer. Costs nothing extra and adds pacing. Flattens to a static rule
  under `prefers-reduced-motion`.

### Tier 3 — signature. Highest payoff, needs discipline.

- **H · The arc.** A circle far wider than the viewport with only its crown
  showing, so what crosses the boundary is a long shallow sweep — the same
  gesture as the C in the mark, at 8% opacity on white and 20% on black. It is
  the only candidate here that could not belong to another organisation.
  **It is also the only one that looks cheap if it appears twice on a page.**
- **I · Inset step.** The incoming surface starts one column short down its
  left side, leaving a strip of the previous one showing. Architectural, but it
  needs a genuine surface change to exist — so it is useless on exactly the 14
  boundaries that have the problem. Included for completeness; I would not ship it.

## 5. Why E is the recommendation

The seam wins on the argument, not on looks:

1. **It is already the site's idiom.** `.eyebrow::before` is a 26px red dash
   before a label, 36 instances. E is that dash at structural scale. Nothing new
   is being introduced — an existing mark is being promoted.
2. **It carries the brand at the one moment the reader is between things.** The
   palette is red/black/white; the seam is the cheapest possible place to spend
   the red.
3. **It degrades to B.** If the red is ever wrong — a partner co-brand page, a
   print stylesheet — dropping one declaration leaves a correct hairline.

## 6. Where the arc goes

One per page, at the single boundary that matters most on that page. Proposed:

| Page | Boundary |
|---|---|
| `index.html` | into **Walking for Impact** — the live campaign block |
| `faith-in-motion.html` | into the **closer** |
| `impact.html` | into the final dark block |
| `model.html` | into the ICIADM pathway |
| `partnerships.html` | into the founding-partner block |
| `give.html` | into the sponsor instrument |

Everywhere else: no arc. The rule is a maximum, not a quota — if a page has no
moment worth marking, it does not get one.

## 7. Exact rollout

The 14 flat boundaries, measured. Index is the section's position on the page.

| Page | Section | Class |
|---|---|---|
| `faith-in-motion.html` | [1] `.trustline` | `dv-seam` |
| `faith-in-motion.html` | [3] `.blk` | `dv-seam` |
| `church.html` | [2] `.blk`, [3] `.blk` | `dv-seam` |
| `take-part.html` | [2] `.blk`, [3] `.blk` | `dv-seam` |
| `accountability.html` | [2] `.blk`, [3] `.blk`, [4] `.blk` | `dv-seam` |
| `give.html` | [1] `.blk` | `dv-seam` |
| `apartments.html` | [2] `.blk` | `dv-ticks` (project page) |
| `what-we-do.html` | [6] `footer` | `dv-hair` |
| `impact.html` | [4] `footer` | `dv-hair` |
| `contact.html` | [3] `footer` | `dv-hair` |

Plus six `dv-arc` placements from §6. **Total: 20 class attributes, no markup
restructuring, no new elements.**

## 8. Technical constraints these were built around

Two, both from the section scroller shipped in the last change:

1. **No extra DOM.** `js/section-scroll.js` measures section tops and heights to
   decide whether a section snaps, pages, or scrolls freely. A wrapper `<div>`
   around a divider would change those measurements and shift the scroll
   behaviour. Every candidate is a pseudo-element on the section that owns it —
   `.blk` is already `position:relative`, so nothing else has to change.
2. **Never draw above a section's top edge.** The scroller parks a section at
   `y - headerHeight`. Anything painted above that edge lands *under* the fixed
   header when the section is snapped. So a divider belongs to the top of the
   **incoming** section, inset by part of its own padding — `--dv-inset`.

A third, smaller one: `--dv-x` computes the measure's left edge arithmetically
rather than with `translateX(-50%)`. A percentage inside `translateX` resolves
against the pseudo-element's own width, not its container — which silently
centred the section number on the first attempt.

## 9. Cost

- **Bytes:** `css/dividers.css` is ~3.4 KB uncompressed, ~1.1 KB gzipped. No
  images, no SVG files, no JS.
- **Paint:** pseudo-elements on already-composited sections. The arc is one
  large border-radius element per page, clipped by `overflow:hidden`.
- **Accessibility:** decorative only, no DOM, nothing announced. `G` respects
  `prefers-reduced-motion`; `D`'s number is `content:attr()` on a pseudo-element,
  so it is not read out as content.

## 10. Rejected

| Option | Why not |
|---|---|
| Diagonal / angled splits | Fight a strict 12-column editorial grid — every angle is a second, competing axis — and date to a specific mid-2010s look. |
| Wave / blob SVG dividers | Consumer-app decoration. Wrong register for an institution that publishes reconciled figures. |
| Torn paper, brush, deckle edges | Texture implies craft-market or charity-appeal, and undercuts the convener positioning the copy works hard to establish. |
| Gradient fades between surfaces | Muddies the black-and-white discipline the logo sets, and puts text over an indeterminate tone — the exact problem the hero scrim had to fix. |
| Full-width image bands | Real bandwidth on Ugandan mobile data, spent on ornament. |

## 11. The decision

Three ways to take this:

- **Minimum** — the 14 flat boundaries only (E, B, F). Fixes the real problem,
  changes nothing else. ~20 minutes.
- **Recommended** — minimum, plus `G` (draw on scroll) and the six `dv-arc`
  placements. The pacing becomes deliberate rather than merely correct.
- **Full** — recommended, plus `D` numbered indexes on the four long
  institutional pages, which finally uses `.secno`.

Nothing in this plan has been applied to the live pages. `css/dividers.css` and
the specimen are additive and inert until classes are added.
