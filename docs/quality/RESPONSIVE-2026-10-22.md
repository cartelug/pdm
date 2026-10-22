# Normal-zoom layout audit — 22 October 2026

Six parallel source audits covered the institutional shell, homepage, interior pages, shared typography/components,
campaign pages and responsive gate. Browser inspection at normal zoom then checked the reported risks and exposed
two additional issues that the old viewport matrix did not cover.

## Causes and repairs

| Area | Observed cause | Result |
| --- | --- | --- |
| Phone page headings | The 49.6px minimum split `development.` into `developme` / `nt.` at 320px. | Fluid heading minima keep the word whole; the measured About heading is 40px and two lines. |
| Desktop header | Brand subtitle, status and CTA icon all returned at 1360px, making the header 126px high and dropping Contact onto a second row. | Expanded details wait until 1440px; the measured 1360px header is 80px high. |
| Phone header/menu/footer | Compact branding stopped at 419px; menu indices and two tiny footer columns consumed text space. | Compact treatment lasts through 639px, menu labels use the remaining width, and phone footer groups take a full row. |
| Tablet homepage | Hero and card headings used viewport units inside narrow columns; the accordion started before its copy fitted. | Local container sizes govern display type, tablet grids use regular pairs, and the accordion starts at 1200px. |
| Short landscape heroes | Blank image spacing or a tall portrait pushed headings below the initial viewport. | Short screens reduce empty homepage spacing and place the Walk heading/actions before its portrait. |
| Interior content | Decorative arches crossed tablet paragraphs; values cards enlarged long names; empty section descriptions still reserved half the heading row. | Arches start at 1200px, value titles retain the normal scale, and headings without descriptions use the full row. |
| Governance/forms | Phone steps had roughly 100px text columns, and form fields split by viewport rather than available width. | Steps stack on phones; form rows fit columns to their own width; contact keeps a full-width form until 1200px. |
| Campaign type | Every nested span explicitly received Lexend, overriding the Archivo role of its heading or button. | Descendants inherit their selected role; inputs, selects and textareas explicitly retain Lexend. |
| Walk pledge instructions | Decorative bag art and step counters consumed most of the instruction column. | Narrow intro containers give instructions the full width and omit the redundant decorative bag. |
| Contribution hero | An 80px decorative portrait reserved 96px beside a 320px phone heading. | Small-phone headings use their full 288px shell and two natural lines. |
| Backpack scene | A fixed viewport-height stage could clip images and captions on short screens. | Below 640px height, all three frames use normal document flow; resizing restores the scene. |
| Wide Faith hero | A fixed 680px box included a gutter that grew with the viewport, eventually consuming its text space. | The outer width grows with that gutter; the measured heading keeps 436px at both 1920px and 2560px. |

## Regression coverage

The responsive gate now covers every public page at 19 viewport/text settings: 320, 360, 390, 414, 430, 768, 900,
1024, 1180, 1200, 1280, 1360, 1440, 1536, 1920 and 2560px; 667×375 landscape; and 200% text at 390 and 1280px.
Thirty public pages produce 570 measurements. Fonts finish loading before measurements, and the browser context
uses normal CSS scaling. The report records each viewport and whether text enlargement was enabled.

Sideways scrolling, page-edge clipping and crowded targets below 24px retain their existing strict failures.
Additional review notes identify split heading words, headings squeezed into five or more short lines, and
wrapped text clipped in width or height. Heroes outside `main`, including Faith in Motion and Give, are included.
Deliberate editorial breaks and enlarged-text wrapping are reviewed separately from normal-zoom defects.

The Walk browser suite also checks nested headline font inheritance, short-landscape caption flow and scene
restoration after resizing. Existing menu, pledge, payment, motion and accessibility regressions remain in place.
CI saves the full responsive JSON as the `responsive-layout-report` artifact for 14 days.

## Protected content

The ten protected Walk/Contribute HTML changes contain only refreshed CSS/JavaScript cache versions. Each is
recorded as a presentation review with its previous hash. Frozen forms, campaign facts, hooks, prices, payment
services, register logic and destinations are unchanged.
