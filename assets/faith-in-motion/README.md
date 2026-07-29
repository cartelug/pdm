# Faith in Motion campaign assets

These are the supplied original campaign images for the Faith in Motion pages. They are intentionally kept as source JPEGs and named by subject rather than by upload ID.

| File | Recommended placement | Notes |
| --- | --- | --- |
| `walking-rotarian-river-crossing.jpg` | Journey gallery / story panel | Clear documentary image of the walker at a river crossing. |
| `kasese-milestone-345km.jpg` | Route milestone | Kasese sign and 345 km journey overlay. |
| `walking-rotarian-riverside-35km.jpg` | Journey gallery | Riverside image with 35.69 km activity overlay. |
| `faith-in-motion-345km-poster.jpg` | Campaign proof / share-card section | Published Faith in Motion artwork; do not use as the main logo. |
| `walking-rotarian-sunset-video-frame.jpg` | Optional atmospheric supporting image | Video screenshot; use only as a small supporting frame. |
| `mpara-biguli-day-8.jpg` | Day 8 route update | Mpara–Biguli progress image and journey overlay. |

## Brand inventory

Reusable brand files currently available to the site remain in `../brand/`:

- `rotary.png` — Rotary mark
- `pamodzi/pamodzi-logo-transparent.png` — approved transparent Pamodzi for Development runtime logo
- `the97-white.png` — builder mark

There is not yet a standalone Walking Rotarian logo source file. The mark visible in the supplied poster is embedded in the poster artwork and should not be cropped for a preloader or navigation identity. Add the original SVG, PNG, or vector export here once supplied.

## Publishing a journey update

The Faith in Motion homepage collection is controlled by `../../js/fim-content.js`.

1. Add the new image to this folder with a descriptive lowercase filename.
2. Add one content object to the top of `window.FIM_UPDATES`.
3. Include only confirmed locations, dates and distances.
4. Write factual alternative text describing what is visible.
5. Keep the newest entry first; it becomes the lead story.
