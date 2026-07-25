# Motion, Animation & Responsiveness Plan — Signature Tier

**Scope:** whole site — Pamodzi org (`css/pdm.css` · `js/pdm.js`) and Faith in Motion (`css/fim.css` · `js/fim.js`).
**Ambition:** award-tier craft that still loads fast on a mid-range Android in Uganda on 3G. Every technique below is **vanilla, no-build, progressively enhanced** — nothing here adds a framework or a bundler.
**The line that governs every trade-off:** motion must make the campaign *more* believable and *faster* to act on. The moment an effect delays the payment number or the CTA, it is cut.

---

## 1. Audit — what exists today

**Already right** (do not rebuild): `.reveal` IntersectionObserver reveals that unobserve after firing (`pdm.css:77`, `fim.css:131`); `:focus-visible` 3px rings (`pdm.css:18`, `fim.css:32`); `min-height:100svh` heroes; `aspect-ratio` slots with `@supports` fallback (`fim.css:289-290`); `prefers-reduced-motion` blanket rules (`pdm.css:177`, `fim.css:295`) plus JS `REDUCE` branches; `clamp()` fluid type in 17 places; `text-wrap:balance` on headings; rAF count-ups (`js/fim.js:26-33`); route draw via `strokeDashoffset` + `getPointAtLength` (`js/fim.js:46-63`).

**Existing motion inventory:** buttons `transform .14s`; header `.solid` at ~60% hero; `@keyframes pl` live-dot pulse; `@keyframes drop` scroll cue; toast translateY+opacity; `.metrebar i` width `.5s`; `#lbar` width `1.5s`; rail fill/bead/km tracking scroll.

---

## 2. Gaps — ranked

| # | Gap | Evidence |
|---|---|---|
| **G1** | **No mobile navigation.** All nav links `display:none` ≤900px; only the CTA survives. Footer is the sole route between pages on a phone. | `pdm.css:49`, `fim.css:78` |
| **G2** | **Nine ad-hoc breakpoints** (700/720/760/820/860/880/900/940/1180), no shared scale. | 27 media queries |
| **G3** | **Two animations drive layout** — `width` on `#lbar` and `.metrebar i` = layout+paint every frame. | `js/pdm.js:24`, `fim.css:179` |
| **G4** | **Scroll handler forces synchronous layout** — reads `offsetHeight` + `scrollHeight` every tick while the rail updates. | `js/fim.js:170-182` |
| **G5** | **No motion tokens** — ~25 hardcoded durations, 3 easings used interchangeably. | both CSS files |
| **G6** | **Focus ring suppressed on the donation input.** `.customrow input{outline:none}` specificity `(0,0,1,1)` beats `:focus-visible` `(0,0,1,0)`. | `fim.css:172`, `pdm.css:154` |
| **G7** | Toast duration inconsistent — 1700ms vs 2100ms. | `js/fim.js:141`, `js/pdm.js:7` |
| **G8** | Reduced-motion read once at load; OS toggle mid-session does nothing. | both JS |
| **G9** | No short-landscape rule; `100svh` hero + `clamp(…,104px)` headline crowds out the CTA at 640×360. | `fim.css:81` |

---

## 3. Principles

1. **Motion is evidence.** The road and the counters represent real distance and real money — they earn long durations. Everything else is under 300ms.
2. **Never animate the ask.** Payment number, copy button, WhatsApp CTA: instant, always, no reveal delay.
3. **Legible at rest.** Every screen complete with JS off or motion suppressed.
4. **Compositor-only in loops.** `transform` and `opacity`. Nothing else, ever.
5. **Enhancement, not dependency.** Every advanced API below sits behind `@supports` / feature detection and degrades to the current behaviour.
6. **Earned, not applied.** No effect exists because it's fashionable. Each one below encodes a specific idea about the campaign.

---

## 4. Motion architecture

### 4.1 Choreography tokens
Beyond duration/easing — stagger, travel distance and overshoot become tokens too, so choreography is consistent rather than reinvented.

```css
:root{
  /* duration */
  --dur-1:120ms; --dur-2:180ms; --dur-3:300ms;
  --dur-4:500ms; --dur-5:700ms; --dur-sig:1600ms;
  /* easing */
  --ease-out:cubic-bezier(.2,.8,.3,1);      /* default */
  --ease-snap:cubic-bezier(.2,.9,.3,1);     /* interactive feedback */
  --ease-emph:cubic-bezier(.22,1,.36,1);    /* long progress fills */
  --ease-exit:cubic-bezier(.4,0,1,1);       /* things leaving */
  /* choreography */
  --stagger:60ms; --stagger-tight:30ms;
  --travel:26px; --travel-sm:12px;
}
```

### 4.2 A tiny motion runtime — `js/motion.js` (~130 lines, shared by both systems)
One new file. No dependencies. Exposes four primitives:

- **`spring(from,to,opts)`** — a critically-damped spring solver (~15 lines) driving a rAF loop. Used for interactive feedback where bezier feels mechanical: tier selection, magnetic CTAs, bead settle.
- **`flip(elements, mutate)`** — First-Last-Invert-Play. Measure, apply the DOM change, invert with `transform`, play. Powers the tier indicator and the ledger expand without animating layout properties.
- **`stagger(nodes, fn, step)`** — index-based delay, capped (`min(i*step, 300ms)`) so long lists never crawl.
- **`animate(el, keyframes, opts)`** — thin WAAPI wrapper that returns the `Animation` object, so effects are **cancellable and reversible** (today's `setTimeout` chains are neither) and auto-no-ops under reduced motion.

Everything in §5–§7 is built from these four.

---

## 5. Signature moments — the set pieces

### 5.1 The road *(the campaign's centrepiece)* — `faith-in-motion.html`, `walk.html`
Today: a gold line draws and a dot slides. Elevate to a **journey**:

- **Tangent-aware walker.** Sample `getPointAtLength(L*f ± ε)` to derive the path tangent; rotate the walker to match, so he leans into climbs and levels on descent. Precompute ~64 sample points at start (array lookup per frame, not repeated SVG queries — resolves the cost concern in G4's neighbourhood).
- **Gait.** A 2–3px sinusoidal bob at ~2.2Hz layered on the tangent transform. Reads as walking, not sliding. Amplitude → 0 under reduced motion.
- **Milestone pins plant themselves.** As the gold line passes each town/km marker, the pin scales `0→1` with a spring settle and its label fades in. This turns an abstract percentage into places on a map.
- **Footprints.** Every ~40px of progress, drop a small low-opacity print behind the walker that fades over 2s. Capped at 12 live nodes; pooled, never unbounded.
- **The road ahead breathes.** The unfunded dashed remainder drifts its `stroke-dashoffset` very slowly (8s loop, 2px amplitude) — the distance left feels alive rather than inert. This is the emotional appeal the brief asks for: *don't hide how far is left.*
- **Sky ties to progress.** The existing dawn gradient shifts one stop warmer as the fill advances — the walk moves the sun. Pure `stop-color` interpolation on the existing `<linearGradient>`; costs nothing.

**Reduced motion:** line drawn to final position, walker placed and rotated, pins planted, no gait, no footprints, no breathing, no sky shift.

### 5.2 Odometer counters — hero stats, tallies, readouts
Replace the flat count-up with a **per-digit odometer**: each digit column is a `<span>` stack translated on `transform: translateY(-n em)`, digits staggered `--stagger-tight` right-to-left so the number "settles" like a mechanical counter, with a slight spring overshoot on the final digit. Requires `font-variant-numeric: tabular-nums` (JetBrains Mono is already monospaced) so width never jitters mid-roll.

**Accessibility:** the animated stack is `aria-hidden="true"`; a visually-hidden span carries the final value for assistive tech. Under reduced motion the final number prints instantly.

### 5.3 The sponsor instrument — `give.html`
The highest-intent surface on the site. It should feel like an instrument, not a form.

- **Magnetic selection indicator.** A single pill slides between tiers via **FLIP + spring** rather than four independent background transitions — one continuous object, not four blinks.
- **Amount cross-roll.** `#outAmt` uses the odometer (§5.2). The "carries him X metres" figure re-rolls in sync, so the *meaning* updates with the money.
- **Metre bar as `scaleX`.** Fixes G3 and lets the fill overshoot ~2% then settle — a physical, confident motion.
- **Copy-number success.** The button morphs label → checkmark with a spring pop, toast confirms. On touch devices, an optional single 10ms `navigator.vibrate` (feature-detected, never on desktop, never under reduced motion).
- **Custom input focus.** Restores G6's ring **and** adds a subtle border-glow transition — focus becomes obvious *and* attractive.

### 5.4 Roll of Honour — `roll.html`, campaign home
- Rows reveal with a capped stagger on first paint.
- **Expand/collapse via FLIP**, so "Show all sponsors" animates height without animating `height`.
- When the roll grows, the newest rows get a one-shot **highlight sweep** (a translucent gradient crossing the row over 900ms) — new support is visibly *new*.

---

## 6. Scroll choreography

### 6.1 Native scroll-driven animations, IO fallback
Where supported, hand scroll-linked work to the compositor — off the main thread entirely:

```css
@supports (animation-timeline: view()){
  .reveal{
    animation: reveal-in linear both;
    animation-timeline: view();
    animation-range: entry 10% cover 32%;
  }
}
```
The existing IntersectionObserver path remains the fallback. Same for the journey rail fill (`scroll()` timeline) and the header's `.solid` state — all three currently run JS on every scroll tick (G4). This is the single biggest smoothness win available.

### 6.2 Scrollytelling spine — `walk.html`
Bind the route to scroll progress: as the reader moves down the page, the walker advances along the SVG and the route-log entries activate in step. Sticky figure + `view()` timeline, with a static figure and plain list as the no-support/reduced-motion fallback.

### 6.3 Section rhythm
Headings, lede and content stagger in as a *group* (`--stagger`), not as independent elements firing at random thresholds — the current per-element reveal reads as noise on content-dense pages.

---

## 7. Cross-page View Transitions *(the biggest perceived-quality jump)*
A 14-page static site can have app-grade navigation with **two lines of CSS**:

```css
@view-transition{ navigation: auto; }
```
Then assign `view-transition-name` to elements that persist across pages — the header brand mark, the page hero, the campaign progress figures. Navigating `faith-in-motion.html → give.html` morphs the shared elements instead of flashing white. Chrome/Edge support it; every other browser gets today's instant navigation. **Zero framework, zero build, no risk.**

Pair with `@media (prefers-reduced-motion: reduce){ @view-transition{ navigation: none; } }`.

---

## 8. Peak responsiveness

Breakpoints are the *floor*, not the strategy. The target is layout that adapts without being told.

### 8.1 Container queries — components that don't care where they live
```css
.dir, .board, .gov, .trust{ container-type: inline-size; }
@container (max-width: 34rem){ .pcard{ /* stacked variant */ } }
```
Project cards, profile cards, fact grids and ledger rows respond to **their own width**, so the same component works in a sidebar, a full-bleed grid or a narrow modal — and future PCI pages inherit correct behaviour for free.

### 8.2 Intrinsic grids — media queries that never need writing
```css
.dir{ grid-template-columns: repeat(auto-fit, minmax(min(100%, 17.5rem), 1fr)); }
```
Replaces several of the nine ad-hoc breakpoints (G2) with a rule that is correct at *every* width.

### 8.3 A real fluid scale
Generate type and space from two anchors (360px → 1440px) as a modular scale of `clamp()` custom properties (`--step--1 … --step-5`, `--space-2xs … --space-3xl`) rather than per-component `clamp()`. Section padding becomes fluid — today it's fixed, so a 360px phone spends a third of the viewport on whitespace.

### 8.4 The breakpoint scale that remains
| Token | Width | Role |
|---|---|---|
| `sm` | 640px | full stack |
| `md` | 768px | forms/two-ups collapse |
| `lg` | **940px** | major splits collapse · **nav → mobile menu** |
| `xl` | 1180px | side furniture (rail) |

Migrate opportunistically; **do not churn 27 queries in one commit.** Exception: unify the nav breakpoint across both systems in one go with §8.6.

### 8.5 Modern layout primitives
- **`:has()`** for state-driven layout (`.panel:has(.tier.on)`), removing JS class bookkeeping.
- **Logical properties** (`padding-block`, `margin-inline`) throughout new work — future-proof and RTL-ready.
- **`text-wrap: pretty`** on body copy (`balance` already on headings).
- **`content-visibility: auto`** + `contain-intrinsic-size` on long offscreen sections (ledger, gallery) — large paint/layout saving on low-end devices.
- **Container query units** (`cqi`) for component-internal type.

### 8.6 Mobile navigation *(G1 — ship first)*
44×44 trigger with `aria-expanded`/`aria-controls`; full-screen panel on the page's own dark surface; links ≥18px in ≥48px rows; CTA repeated at the bottom. Panel enters `opacity` + `translateY(-8px)` over `--dur-3`; links stagger `--stagger-tight`. Esc closes, focus moves in and returns to the trigger, focus trapped while open, body scroll locked. **Ships as in-flow markup the script upgrades** — with JS off, the links are simply visible. One pattern, two skins.

### 8.7 Responding to context, not just width
- `@media (hover: hover) and (pointer: fine)` gates every hover and magnetic effect — touch devices never inherit desktop-only motion.
- `@media (prefers-reduced-data: reduce)` / `navigator.connection.saveData` → suppress decorative loops (footprints, breathing road, sky shift) and defer non-critical work. **Directly serves the Uganda-on-3G case.**
- `prefers-contrast` and `prefers-reduced-transparency` respected on overlays and the mobile menu.
- Short landscape: `@media (max-height:520px) and (orientation:landscape){ .hero{min-height:auto; padding-block:72px;} }` (G9).

---

## 9. Performance budget

- **G3** — bars to `transform: scaleX()` + `transform-origin:left` inside a fixed-width track.
- **G4** — where §6.1 isn't supported: cache `offsetHeight`/document height on load+resize (debounced); inside `onScroll` read only `pageYOffset`, write inside rAF with a dirty flag.
- **Road** — precompute 64 path samples once (§5.1); no per-frame `getPointAtLength`.
- **Pooling** — footprints and sweep nodes are recycled from a fixed pool; nothing unbounded.
- **`will-change`** — applied only while animating (menu panel, road fill), removed on finish. Never static.
- **Frame budget** — no effect may exceed **4ms/frame** on a 6×-throttled CPU. Anything that does is cut, not optimised twice.
- **Fonts** — `display=swap` + `preconnect` already in place; no fourth family or weight without removing one.
- **Total added JS ≤ 6KB** un-gzipped for `js/motion.js`. If it exceeds that, features get cut.

---

## 10. Accessibility

- **Reduced-motion matrix** — every effect has a defined end state: reveals visible; counters printed; road drawn and walker placed; pins planted; bars filled; menu instant; all loops static; view transitions off.
- **G8** — live preference:
  ```js
  var mq = matchMedia('(prefers-reduced-motion:reduce)');
  var REDUCE = mq.matches;
  mq.addEventListener('change', e => { REDUCE = e.matches; });
  ```
- **G6** — restore focus rings on `.customrow input` and `.inq` fields at matching-or-higher specificity. **The donation-amount field must show focus.**
- **Counters** — animated digit stacks `aria-hidden="true"`; a visually-hidden span carries the accurate final value. No `aria-live` on a rolling number.
- **No meaning in motion alone** — road progress stays readable as text (`#roadCount`, `#gapSteps`).
- **Keyboard** — full traverse every page; visible focus at every stop; the menu is the only intentional trap and it releases correctly.

---

## 11. Phases

| Phase | Work | Risk |
|---|---|---|
| **A · Correctness** | Tokens (§4.1); live reduced-motion (G8); focus rings (G6); toast unify (G7) | Low · no visual change |
| **B · Mobile nav** | §8.6 in both headers | Medium · highest user value |
| **C · Performance** | Bars→`transform` (G3); rAF/cached scroll (G4); `content-visibility` | Low · measurable |
| **D · Motion runtime** | `js/motion.js` — spring, FLIP, stagger, WAAPI (§4.2) | Medium |
| **E · Signature moments** | Road journey (§5.1); odometers (§5.2); sponsor instrument (§5.3); roll (§5.4) | Medium · the craft tier |
| **F · Scroll & transitions** | Native scroll timelines (§6.1); walk scrollytelling (§6.2); view transitions (§7) | Low · all behind `@supports` |
| **G · Peak responsive** | Container queries; intrinsic grids; fluid scale; `:has()`; context media (§8) | Low · incremental |

---

## 12. Verification

1. **Reduced motion** — toggle mid-session (proves G8): every page legible, all loops static, counters final, view transitions off.
2. **Keyboard only** — every page; focus visible at every stop **including the donation input**; menu traps and releases.
3. **Throttled** — DevTools CPU 6× + Slow 4G: scroll campaign home and `walk.html` end to end; no frame pile-up; **no effect over 4ms/frame** in the Performance panel.
4. **Layout-property sweep** — confirm no `width`/`height`/`top`/`left` animates in any running loop.
5. **Viewport matrix** — 320/360/390/768/1024/1440 + 640×360 landscape; no horizontal overflow; no touch target under 44px.
6. **Feature-off pass** — Firefox/Safari (no view transitions, no scroll timelines): everything still works, nothing looks broken or half-applied.
7. **Save-Data on** — decorative loops suppressed, page still complete.
8. **`node --check js/*.js`**; every referenced `id` exists.
9. **Screenshot pass** — Chromium 360px + 1200px across `index`, `faith-in-motion`, `give`, `walk`, `community`, `apartments`.

---

## 13. Out of scope
- Any animation library, framework or build step — stays vanilla.
- Scroll-jacking, and parallax on scroll — deliberately rejected: highest cost on exactly the devices this audience uses.
- Replacing the hand-built SVG artwork or either design system.
- 3D/WebGL. The campaign's credibility comes from evidence, not spectacle.
