# PCI image refresh — 28 October 2026

Neeza explicitly limited the release to images and the previously requested removal of Rotary branding. The experimental layout was reverted before this release. Base: `99348eae7442890ba8086e14d9cc6eb4aa651a83`.

## Scope

Ten accepted photographic-style campaign artworks replace the older Shyaka imagery in the existing homepage, Walk story, partners, participation and contribution image frames. The existing primary-school scenes and 36 school/student/campus illustrations remain. The gallery contains those 36 plus ten new images, rather than twenty superseded campaign scenes. Its grid, controls, viewer, keyboard handling and filters remain the same.

There are no stylesheet changes. Every changed HTML page was compared with the base using JSDOM: element order, IDs, classes, inline styles, roles and external script order are identical. The existing desktop and mobile navigation, page sections, animation, pledge chooser and payment flow remain in place. At 390 px, a browser comparison measured identical hero (281.25 × 421.875), inset (150.90625 × 79.203125), portrait (267.53125 × 433.875) and backpack-stage (375 × 844) containers, with no horizontal overflow.

`assets/wfe-2026/refresh/manifest.json` records actual source dimensions/hashes, delivery dimensions/bytes and provenance. `scene-map.json` maps existing scene hooks to the new assets. `ScenePicture.astro` preserves its markup and responsive breakpoints; the homepage selects the separate accepted walking portrait on phones. The Walk hero uses that portrait at both sizes to keep the full face inside its existing arch. The other slots use the accepted artwork within the existing crops. Three landscape gallery companions preserve complete head/body framing inside the existing 16:10 tiles; they have their own source hashes and actual thumbnail dimensions. The full-size portrait masters remain the identity references. The old forty-image manifest remains an archive, not a claim of forty newly generated images.

The bag and shirt have separate public derivatives with the Rotary word, cog and club wording removed by the built-in image-editing tool. Original kit uploads remain byte-identical. Public image links use the cleaned derivatives. Public copy removes Rotary titles/club references; the existing internal `rotary` participation anchor and selectors remain for link and hook compatibility. No financial records or API files are changed.

## Reviewed contracts

All form fields, names, required attributes, bounds, form actions, external scripts/order and price/payment/referral logic were preserved. The reviewed hook changes are the nine image IDs for the static gallery preview, the community participation label and its corresponding JSON-LD description. Frozen fragment changes are limited to:

- Pledge chooser: remove the five-character `Rtn. ` title from the help contact.
- Participation enquiry: change the visible option from `Rotary club participation` to `Community participation`.
- Payment result main: replace its decorative image URLs, alt text and dimension metadata.

The corresponding hook/fragment records and protected presentation exceptions were updated after reviewing these differences. No contribution/payment contract was disabled or relaxed.

## Image rules

Authentic original photographs take priority over generated reference sheets. Preserve Shyaka's slim build, actual face, beard and locs; no numerical height or weight is inferred. Portrait and body guides are creative references, not independent photographic evidence. Keep texture and natural lighting; do not invent facial detail through enlargement. Generated people, campus activities and events remain labelled campaign artwork and never become verified progress or impact. Preserve the distinction between the real university block and the neighbouring primary school.

Routine builds use committed exports. `scripts/refresh-images.mjs` runs only with an explicit accepted-source mapping. It resizes without enlargement, exports AVIF/WebP, keeps a small decorative participation image and updates share imagery; it never requires a private API key or source-generation service in production.

## Validation

The existing validation, backend, browser, accessibility, speed and responsive gates remain mandatory. Local build/type/menu/image/contract checks are run before opening the release PR; PHP/browser acceptance runs in the existing GitHub quality workflow before merging to main. Deployment and hosted verification are observed after merge. No local fixture is sent to the live ledger.
