# Images, references and art direction

Twenty scenes are already generated and integrated. Each has its own separately generated desktop landscape and phone portrait composition: forty distinct accepted sources. Use them rather than generating the same campaign again without a reason.

## Source references

| Reference | Included path under the repository root |
| --- | --- |
| Original uploaded backpack | `assets/wfe-2026/references/official-backpack.png` |
| Original uploaded shirt | `assets/wfe-2026/references/official-shirt.png` |
| Real walker portrait | `assets/walk-for-education/walking-rotarian-photo.jpg` |
| Actual main university block | `assets/walk-for-education/kagando-campus.webp` |
| Transparent accepted bag treatment | `assets/wfe-2026/official-kit/bag-cutout-master.webp` |
| Twenty detailed generation briefs | `docs/official-kit-prompts.json` |
| Original comprehensive visual plan | `docs/PCI-OFFICIAL-KIT-VISUAL-PLAN.md` |
| Twenty-pair contact sheet | `docs/quality/OFFICIAL-KIT-CONTACT-SHEET.jpg` |

The bag and shirt PNGs are the actual uploaded originals. Their SHA-256 values are checked by the existing image tests. The original copies were also saved in the PCI Drive folder: https://drive.google.com/drive/folders/1HTyyxhZTvzPcZr2kzCvNl_1t3uyYW2PF . Access depends on the owner's Drive permissions.

## Scene map

| ID | Story purpose | Suggested visual role |
| --- | --- | --- |
| 01 | The walk is happening | Homepage hero |
| 02 | One walker, a specific destination | Walk hero / featured campaign |
| 03 | The person behind the walk | Meet the walker |
| 04 | The actual bag carries the message | Official kit / campaign message |
| 05 | Carrying it for real | Bag in use |
| 06 | Every step has effort | Walking detail / journey |
| 07 | The reason to keep walking | Learning and purpose |
| 08 | The signature main block | Destination / actual-building reference |
| 09 | Joy in learning | Education story |
| 10 | From early learning to higher education | Education pathway |
| 11 | A community chooses to participate | Join-in story |
| 12 | Persistence, with a human pause | Human effort / bag detail |
| 13 | The journey continues | Road / journey band |
| 14 | Walking alongside the next generation | Intergenerational hinge |
| 15 | The destination comes into view | Partners page |
| 16 | An imagined arrival worth working towards | Clearly labelled imagined arrival |
| 17 | A welcome shared by the community | Clearly labelled imagined welcome |
| 18 | Everyone can carry a part | Participation |
| 19 | The future this effort supports | Future / partner band |
| 20 | Keep the walk moving | Closing action |

Exact output dimensions, file sizes, source hashes and `imaginedArrival` flags are in `assets/wfe-2026/official-kit/manifest.json`. Do not invent a common native resolution for all sources. The accepted WebP masters retain each source's native dimensions; the original generator PNG files outside Git are not bundled.

## Visual continuity rules

Preserve Shyaka's face from the actual portrait, natural head/body proportions, the black official shirt and the supplied backpack form. Do not enlarge his head to emphasise identity. The main university block, its blue/cream treatment and brick stair tower are the architectural signature; do not substitute a generic university or present the university block as a nearby primary-school classroom.

Keep Ugandan/Kenyan people and context credible without a poverty stereotype. Children should look happy and engaged; generated supporting people are illustrative. No generated image proves an actual event, donation, school activity or completed walk. Scenes 16 and 17 must remain explicitly labelled as imagined arrival/welcome.

Printed shirt copy includes a 1,300 km / 1,650,000-step campaign message. The canonical route-planning source currently has an approximate 1,100 km value. These differ. Do not silently pick one as verified travelled distance. Keep the original artwork unchanged and seek an approved campaign fact correction if needed. Never calculate live walking progress from printed kit text.

## Responsive delivery

The naming pattern is:

```text
scene-NN-desktop-master.webp
scene-NN-desktop-800.avif / .webp
scene-NN-desktop-1440.avif / .webp
scene-NN-mobile-master.webp
scene-NN-mobile-480.avif / .webp
scene-NN-mobile-800.avif / .webp
```

Use `ScenePicture.astro` for institutional pages. It selects phone sources at max-width 719 px, then desktop AVIF with WebP fallback, actual width/height metadata, lazy loading by default and eager/high priority for a true hero. Handwritten campaign markup follows the same source-selection pattern. Match image preloads to media conditions so a phone does not download both hero orientations.

The participation hero uses separately optimised `backdrop-18-mobile.*` and `backdrop-18-desktop.*`; its phone AVIF is about 15.7 KB. Keep this tiny decorative version on the page while retaining the full-quality scene for the gallery. Do not replace it with a master file just because the master looks sharper at 100% zoom.

The gallery keeps 36 older school/campus illustrations plus twenty new campaign-art records. The new records have `mobileSrc`; the viewer switches sources with screen size and clears the mobile source when returning to older records. Preserve those behaviours and the keyboard/focus model in `js/wfe-redesign.js`.

## If new images are genuinely needed

Use the master prompt and matching scene brief in `docs/official-kit-prompts.json`, attach the original kit/face/building references, and generate each orientation as its own composition. One landscape crop is not a new phone composition. Leave text space intentionally and render final copy as HTML, not as raster text. Review anatomy, face, kit, architecture, children, frame edges and both crops before accepting.

`scripts/official-kit-images.mjs` needs a separate accepted-source mapping JSON with keys such as `01-desktop`, `01-mobile` and optional `bag-cutout`, pointing to actual files. The old temporary mapping and raw PNG paths are not available in a clean clone. Do not run this script as part of routine build or fabricate the original source hashes from a recompressed master. Existing delivery assets build and serve without rerunning it.

`scripts/integrate-official-kit.cjs` is a narrow one-time/idempotent integration utility, not a substitute for understanding current markup. `scripts/wfe-story-images.mjs --official-only` refreshes the legacy story derivatives from accepted kit masters. Review output and manifest changes before committing any regeneration.
