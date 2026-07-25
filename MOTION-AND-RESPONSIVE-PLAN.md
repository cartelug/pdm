# Motion, Animation & Responsiveness Plan

**Scope:** the whole site — Pamodzi org pages (`css/pdm.css` · `js/pdm.js`) and the Faith in Motion campaign (`css/fim.css` · `js/fim.js`).
**Constraint that decides every trade-off:** the primary user is **a donor on a mid-range Android phone in Uganda, on a slow connection, deciding whether to trust this with their money.** Motion must earn trust and show evidence. It must never delay the payment number, the CTA, or the ability to move around the site.

---

## 1. Context

The site already has a real motion system — scroll reveals, animated counters, a route that draws itself, a progress rail. It is not a blank slate and this plan is **not** a rebuild. The audit below found the fundamentals are largely right; what's missing is **consistency** (durations and easings invented per-rule), **a mobile navigation** (currently absent), and **a performance pass** on two patterns that will jank on low-end hardware.

This plan (a) records what exists, (b) names the gaps with file references, (c) defines a token system so future work stops inventing values, and (d) sequences the fixes.

---

## 2. Audit — what already exists

### 2.1 Motion in place

| Pattern | Where | Detail |
|---|---|---|
| Scroll reveals | `pdm.css:77`, `fim.css:131` + both JS | `.reveal` → `.in`; opacity 0→1, `translateY(26px)`→0, `.7s cubic-bezier(.2,.8,.3,1)`; IntersectionObserver `threshold .12`, `rootMargin 0 0 -40px`, **unobserved after firing** |
| Button feedback | `pdm.css:25`, `fim.css:47` | `transform .14s cubic-bezier(.2,.9,.3,1)` + background/shadow `.18s` |
| Header state | `pdm.css:34`, `fim.css:62` | `.solid` class past ~60% of hero; background/border `.3s` (+`backdrop-filter` on campaign) |
| Live pulse | `pdm.css:90-91` | `@keyframes pl` 2s infinite on the "walking now" dot |
| Scroll cue | `fim.css:107-108` | `@keyframes drop` 2.4s infinite |
| Toast | `pdm.css:175`, `fim.css:272` | translateY(24px)+opacity `.3s` |
| Metre bar | `fim.css:179` | `width .5s cubic-bezier(.2,.9,.3,1)` |
| Home progress bar | `js/pdm.js:20-25` | `width 1.5s cubic-bezier(.22,1,.36,1)`, 400ms delay |
| Journey rail | `fim.css:114`, `js/fim.js:174-181` | opacity `.4s`; fill height + bead position + km readout track scroll |
| Count-ups | `js/fim.js:26-33` | rAF, cubic ease-out `1-(1-p)³`, 900/1200/1500ms |
| Route draw | `js/fim.js:46-63` | `strokeDasharray`/`strokeDashoffset` + walker via `getPointAtLength`, 1700ms, IO `threshold .25`, fires once |
| Deep-link scroll | `js/fim.js:104` | `scrollIntoView` smooth, `auto` under reduced motion |

### 2.2 Responsiveness in place

- **Fluid type via `clamp()` throughout** — 17 declarations across both files (hero, section heads, big figures). Already the right approach.
- **Modern viewport units** — `min-height:100svh` (`fim.css:81`) / `96svh` (`pdm.css:52`), so mobile browser chrome doesn't clip the hero.
- **`aspect-ratio` image slots with an `@supports` fallback** (`fim.css:289-290`) — photos will land without layout shift.
- **Grid collapse rules** at each component (`.facts`, `.gov`, `.split`, `.dir`, `.trust`, `.gallery`, `.fgrid`, `.tallies`, `.frow`).
- **Ledger sheds its status column** ≤700px (`fim.css:230`).
- **Rail hidden** <1180px (`fim.css:126`).
- **`:focus-visible` rings** — 3px outline, 3px offset, in both systems (`pdm.css:18`, `fim.css:32`).
- **`prefers-reduced-motion` blanket rules** — `pdm.css:177`, `fim.css:295-296` kill animation/transition/scroll-behavior and force `.reveal` visible; both JS files also branch on a `REDUCE` flag.

**Verdict: the foundation is sound.** Reveals degrade safely, focus is visible, reduced motion is honoured, images are CLS-safe.

---

## 3. Gaps — ranked

### G1 · There is no mobile navigation *(highest impact)*
`pdm.css:49` and `fim.css:78` both do `.nav-links a:not(.btn){display:none}` at **≤900px**. On any phone, **every nav link disappears** and only the gold CTA survives. The sole way to move between pages is the footer at the bottom of a long scroll.

This is simultaneously a usability failure and a conversion failure: a donor who lands on `give.html` cannot reach `church.html` to see what they're funding without scrolling to the footer. **Fix is a real mobile menu** (§6.1).

### G2 · Breakpoints are ad-hoc
Nine distinct values across two files — `700, 720, 760, 820, 860, 880, 900, 940, 1180`. No shared scale, chosen per-component. Causes staggered, unpredictable reflow between 700–940px.

### G3 · Two animations drive layout, not the compositor
`#lbar` (`js/pdm.js:24`) and `.metrebar i` (`fim.css:179`) animate **`width`** — layout + paint on every frame. On a low-end Android this is the most likely source of visible jank. Should be `transform: scaleX()` with `transform-origin:left`.

### G4 · The scroll handler forces synchronous layout on every event
`js/fim.js:170-182` reads `hero.offsetHeight` **and** `document.documentElement.scrollHeight` inside `onScroll`, which fires on every scroll tick. Both are layout-forcing reads. With the rail updating simultaneously this is the second jank risk. Needs cached measurements + rAF throttling.

### G5 · No motion tokens
Durations (`.14s .15s .18s .2s .3s .4s .5s .7s 1.5s`) and **three** easing curves — `(.2,.8,.3,1)`, `(.2,.9,.3,1)`, `(.22,1,.36,1)` — are hardcoded in ~25 places and used interchangeably. Nothing enforces consistency on the next component built.

### G6 · Focus ring is suppressed on two inputs
`.customrow input{outline:none}` (`fim.css:172`) and `.inq input/select/textarea{outline:none}` (`pdm.css:154`) both have specificity `(0,0,1,1)`, which **beats** the global `:focus-visible` rule `(0,0,1,0)`. The campaign's custom-steps field — the one a donor types their amount into — has no focus ring at all. The Pamodzi form only shifts border colour.

### G7 · Toast duration is inconsistent
1700ms in `js/fim.js:141`, 2100ms in `js/pdm.js:7`.

### G8 · Reduced-motion preference is read once at load
Both files capture `matchMedia(...).matches` into `REDUCE` at parse time. Toggling the OS setting mid-session has no effect until reload.

### G9 · No short-landscape handling
`min-height:100svh` hero + `clamp(44px,8.4vw,104px)` headline on a phone rotated to ~360px tall leaves almost no room for the CTA row.

---

## 4. Principles

1. **Motion is evidence, not decoration.** The two long animations — the route drawing and the counters — are the emotional core because they represent *real money and real distance*. Everything else is under 300ms and unobtrusive.
2. **Legible at rest.** Every screen must be complete and readable with JS disabled or animation suppressed. Already true via the reveal fallbacks — keep it true.
3. **Never animate the ask.** The Mobile Money number, the copy button, the WhatsApp CTA and the payment instructions appear immediately, with no reveal delay and no motion.
4. **Compositor-only.** Animate `transform` and `opacity`. Nothing else, ever, in a loop.
5. **Budget.** Reveal ≤700ms; interaction feedback ≤200ms; only the two signature moments exceed 1s.

---

## 5. The motion token system

Add to `:root` in **both** CSS files (identical values, so the two systems stay in step):

```css
--dur-1: 120ms;   /* press / hover feedback        */
--dur-2: 180ms;   /* colour & state change         */
--dur-3: 300ms;   /* header, toast, overlay        */
--dur-4: 500ms;   /* progress bars                 */
--dur-5: 700ms;   /* scroll reveals                */
--dur-sig: 1600ms;/* signature evidence moments    */

--ease-out:  cubic-bezier(.2,.8,.3,1);   /* default; reveals, overlays */
--ease-snap: cubic-bezier(.2,.9,.3,1);   /* buttons, bars — crisper    */
--ease-emph: cubic-bezier(.22,1,.36,1);  /* long progress fills        */
```

Then migrate the ~25 hardcoded values onto tokens. **Retire the third easing where it duplicates** — `--ease-emph` is kept only for the long progress fill; everything else resolves to `--ease-out` or `--ease-snap`.

Mirror in JS as a single shared constant block so `countTo` durations and the road draw read from the same scale:

```js
var DUR = { sig: 1600, bar: 500, reveal: 700 };
```

---

## 6. Responsiveness plan

### 6.1 Mobile navigation *(G1 — build this first)*
- **Trigger:** a 44×44 hamburger button in the header, visible ≤900px, `aria-expanded`, `aria-controls`.
- **Panel:** full-screen overlay using the page's own dark surface (`--ink` / `--night`), links at ≥18px with ≥48px hit rows, the CTA repeated at the bottom.
- **Motion:** overlay `opacity` + panel `translateY(-8px)→0` over `--dur-3` `--ease-out`. Links stagger 30ms each — **suppressed** under reduced motion.
- **Behaviour:** Esc closes; focus moves to the panel on open and returns to the trigger on close; focus is trapped while open; body scroll locked; route change or link click closes it.
- **Progressive enhancement:** with JS off, the links must remain reachable — ship the panel markup as a plain in-flow list that the script upgrades, so nothing is lost.
- Applies to **both** headers (`pdm` and `fim`) — one pattern, two skins.

### 6.2 Breakpoint scale *(G2)*
Adopt four named tokens and document them at the top of both stylesheets:

| Token | Width | Meaning |
|---|---|---|
| `sm` | **640px** | single column; everything stacks |
| `md` | **768px` | two-up grids → one; forms stack |
| `lg` | **940px** | major splits collapse; nav → mobile menu |
| `xl` | **1180px** | side furniture (rail) appears |

Migrate opportunistically — **do not churn all 27 media queries in one commit.** Move each component's query to the nearest token when that component is next touched. Exception: raise the nav breakpoint decision to a single value (`lg`, 940px) at the same time as §6.1, so both systems switch together.

### 6.3 Fluid type & spacing
`clamp()` is already used well for type. Extend the same approach to **section padding**, which is currently fixed — `.blk` padding should scale so a 360px phone doesn't spend a third of the viewport on whitespace.

### 6.4 Touch targets
Audit every interactive element against **≥44×44px**: `.tier` buttons, `.copyb`, `.more` links, ledger toggle, footer links, breadcrumb links, and the new menu rows. Where a link is text-only, add padding rather than font size.

### 6.5 Short landscape *(G9)*
```css
@media (max-height:520px) and (orientation:landscape){
  .hero{min-height:auto; padding-block:72px;}
}
```
Confirm the CTA row and one line of lede remain visible on a rotated 360×640 device.

---

## 7. Performance budget

- **G3 — bars to transform.** Replace `width` transitions on `#lbar` and `.metrebar i` with `transform:scaleX()` + `transform-origin:left`. Wrap in a fixed-width track so the scale maps to percentage cleanly.
- **G4 — scroll handling.** Cache `hero.offsetHeight` and document height on `load` and `resize` (debounced); inside `onScroll` only read `pageYOffset` and write classes/styles, wrapped in `requestAnimationFrame` with a dirty flag. Applies to `js/fim.js` (rail + header) and `js/pdm.js` (header).
- **Route draw.** `getPointAtLength` runs once per frame for ~1.6s — acceptable, but precompute ~60 sample points into an array at start if profiling shows cost on low-end devices.
- **IntersectionObserver** — already unobserves after firing. Keep that discipline for every new reveal.
- **`will-change`** — apply only to the mobile-menu panel and the road fill, and only while animating. Never leave it on statically.
- **Fonts** — `display=swap` and `preconnect` are already in place on every page. Keep; do not add a fourth family or weight without removing one.
- **Images** — real photos must ship with explicit dimensions or stay inside the existing `aspect-ratio` slots; `loading="lazy"` + `decoding="async"` already set in `js/fim.js:157`.

---

## 8. Accessibility & reduced motion

- **Coverage matrix** — for every animation, define the reduced-motion end state: reveals → visible immediately; counters → final value printed; road → drawn to final position without traversal; bars → final width, no fill; menu → appears without transition; pulse/scroll-cue → **static** (the blanket `*{animation:none}` already handles these).
- **G8** — replace the one-shot `REDUCE` capture with a live query in both JS files:
  ```js
  var mq = matchMedia('(prefers-reduced-motion:reduce)');
  var REDUCE = mq.matches;
  mq.addEventListener('change', function(e){ REDUCE = e.matches; });
  ```
- **G6** — restore focus rings: remove `outline:none` from `.customrow input` and the `.inq` fields, or re-assert `:focus-visible{outline:3px solid …}` at matching-or-higher specificity. **The custom steps input is a donation entry field — it must show focus.**
- **No information conveyed by motion alone** — the road's progress must also be readable as text (it is: `#roadCount` / `#gapSteps`).
- **Live regions** — counters animating from 0 will be announced repeatedly by some screen readers. Mark the animated number containers `aria-hidden="true"` and expose a single static, accurate value to assistive tech, or set `aria-live="off"` on the counter and print the final figure in a visually-hidden span.
- **Keyboard pass** — full tab traverse of every page including the new menu; visible focus at every stop; no trap outside the intentional menu trap.

---

## 9. Delivery phases

| Phase | Work | Risk |
|---|---|---|
| **A — Tokens & correctness** | Add `--dur-*` / `--ease-*`; unify toast (`--dur-3`); live reduced-motion listener (G8); restore focus rings (G6) | Low · no visible change |
| **B — Mobile navigation** | §6.1 in both headers | Medium · highest user value |
| **C — Performance** | Bars → `transform` (G3); rAF-throttled, cached scroll handlers (G4) | Low · measurable win |
| **D — Responsive consolidation** | Nav breakpoint → `lg`; fluid section padding; touch-target audit; short-landscape rule (G9); migrate queries opportunistically (G2) | Low |
| **E — New-page motion** | Reveal/stagger for the PCI pillars grid and the ICIADM pathway from `PCI-BUILD-PLAN.md` — reuse `.reveal` + tokens, no new machinery | Low |

Each phase: commit to `claude/redesign-bit-write-plan-udf9ql`, screenshot at 360px and desktop, fix what looks wrong.

---

## 10. Verification

1. **Reduced motion** — toggle the OS setting (and mid-session, to prove G8): every page fully legible, no traversal, counters show final values, menu opens instantly.
2. **Keyboard only** — tab every page top to bottom; focus visible at every stop **including the custom steps input**; menu traps and releases correctly; Esc closes.
3. **Throttled device sim** — DevTools CPU 6× slowdown + Slow 4G: scroll the campaign home and `walk.html` end to end; no dropped-frame pile-up on the rail; route draw completes.
4. **Viewport matrix** — 320 / 360 / 390 / 768 / 1024 / 1440px, plus 640×360 landscape. Nothing overflows horizontally; no element under 44px of touch target.
5. **Layout-property check** — DevTools Performance: confirm no `width`/`height`/`top`/`left` animation remains in a running loop; only `transform`/`opacity` in the compositor.
6. **JS integrity** — `node --check js/fim.js js/pdm.js`; every `id` referenced still exists.
7. **Screenshot pass** — Chromium at 360px and 1200px across `index`, `faith-in-motion`, `give`, `walk`, `community`, `apartments`; review and fix.

---

## 11. Out of scope
- Any animation library or framework — this stays vanilla, no build step.
- Page-transition / view-transition effects between documents (multi-page static site; not worth the complexity before the walk).
- Replacing the hand-built SVG artwork or the two design systems.
- Scroll-linked parallax — rejected deliberately: it costs the most on exactly the devices the audience uses.
