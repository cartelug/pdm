# Design prompt: "Our four pillars", Pamodzi Community Initiative

Use this as a complete brief for a designer or an AI design tool. It describes the section that is built on the
homepage today, so it can be recreated, extended or pushed further. Sections 9 and 10 give image prompts for
sharper artwork.

---

## 1. Your role and the bar

You are the design lead at a studio known for giving every client an identity nobody mistakes for anyone else's.
The client, Pamodzi Community Initiative (PCI), a community-led development organisation in Uganda, has already
rejected a row of four pastel cards with small pictures and an accordion. They called it "extremely not creative".
Design the "Our four pillars" section so a first-time visitor stops scrolling. It has to work as well on a
phone held in one hand as on a 27-inch monitor. Spend your boldness in one place: let one thing be memorable and
keep everything around it disciplined.

## 2. Subject, audience, job

- **Subject.** Pamodzi means "together". PCI convenes communities, partners and local resources around priorities
  the community defines. Its work is organised into four pillars: **Education**, **Health**, **Climate & Green
  Development** and **Financial Inclusion**.
- **Audience.** Donors, partners, Rotarians, diaspora supporters and community members, many on mid-range Android
  phones with slow connections.
- **The section's job.** In under ten seconds a visitor should understand that PCI works in four connected areas,
  see what each one covers, and tap through to the one they care about. Nothing in it may claim results,
  numbers or outcomes that are not already published elsewhere on the site.

## 3. The idea: four sculptures, one ring

Four sculptures of satin ribbon, one per pillar, are the heroes: an open book, a pearl held in petals, a leaf, and
a loop of ribbons. One is large and floats on a dark stage; the other three wait on a thin ring around it as small
round selectors. **Choosing a pillar turns the ring a quarter turn, brings that sculpture to the centre, and shifts
the whole stage into that pillar's colour.** Four things, one ring: the visual argument for "pamodzi".

That one orchestrated moment (sculpture swap, ring turn, colour glide, text change) is the memorable thing. No other
effect on the section is allowed to compete with it.

## 4. Content (use this copy, do not invent)

Section header (already on the page, keep it):

- Label: `01 / Our four pillars`
- Headline: **One community. Many possibilities.**
- Lead: *Education. Health. A greener future. Financial inclusion. Four areas of work, shaped by the people they
  serve.*

Each pillar has a name, a one-line summary, four areas of work and a link:

| Pillar | Summary | Areas of work | Link text |
| --- | --- | --- | --- |
| Education | Learning environments, school infrastructure, digital learning and teacher capacity. | Schools and classroom blocks · Science and ICT laboratories · Teachers' housing and sanitation · Digital learning and teacher capacity | See our education work |
| Health | Community-defined health priorities, facilities, equipment and professional partnerships. | Health Centre II, III and IV facilities · Theatres and diagnostic laboratories · Equipment and ambulances · Energy, water and digital health | See our health work |
| Climate & Green Development | Renewable energy, climate-smart agriculture, conservation and resilient local infrastructure. | Renewable energy · Climate-smart agriculture · Afforestation and restoration · Waste management and education | See our climate work |
| Financial Inclusion | Savings groups, cooperatives, financial literacy and community enterprise. | VSLAs, SACCOs and cooperatives · Youth and women's enterprises · Financial literacy and investment readiness · Responsible use of community resources | See our financial inclusion work |

Footnote, small: *Sculptures are artwork for our programme areas. Project records identify the work and its current
status.* Selector names (short): Education, Health, Climate, Inclusion.

Writing rules: plain verbs, sentence case, active voice, no slogans, no statistics, no "transforming lives".

## 5. Visual system

**Palette (named, harmonious, all checked for contrast):**

| Name | Hex | Use |
| --- | --- | --- |
| Stage black | `#0D0709` | Base of the stage, bottom of every gradient |
| Paper | `#FAF6F1` | The page around the stage |
| Education crimson | `#D91F3D` (deep `#3A0B17`) | Education glow and button |
| Health sky | `#2A9CC1` (deep `#0B2236`) | Health glow and button |
| Climate emerald | `#3FB37F` (deep `#0B2A1D`) | Climate glow and button |
| Inclusion amber | `#E6AD3E` (deep `#2F1F06`) | Inclusion glow and button |

The brand is PCI crimson and black with the Walk for Education blues, and the site already colour-codes these four
pillars (crimson, forest, sun) on its "What we do" page. The stage takes the active pillar's colour as a soft light
from above and a faint glow from the lower left, over a gradient from that pillar's deep tone to stage black.
Colours blend smoothly when the pillar changes; they never snap.

**Typography (two families, clearly different):**

- **Archivo**, display, weight 640, tight tracking (about -0.04em), tight leading (about 0.98), balanced wrapping.
  The pillar name is set very large and is part of the picture. Desktop: about 5.4% of the stage container's width,
  clamped between 2.4rem and 5.4rem, so "Climate & Green Development" always fits on two lines. Mobile: about 11%
  of the container width, clamped between 2.1rem and 3.2rem.
- **Lexend**, body, weight 400, 16 to 17px, line height about 1.55, measure under 42 characters on desktop.
- Selector labels: Archivo 600, 13px minimum, sentence case. **No tracked all-caps labels, no numbering.** The
  four pillars are not a sequence, so they are not numbered.

**Material and light.** One satin ribbon material across all four sculptures: soft specular highlights, a thin
lighter edge line, a faint ground shadow. The only thing that changes between pillars is hue, so they read as one
family. Lighting comes from above and slightly left, with a warm kicker on the edge.

**Shape language.** Round for the selectors (coins), soft large radii for the stage (44px desktop, 32px phone), a
leaf-shaped bullet (`border-radius: 0 80%`) for the areas of work. No hard rectangles, no hairline newspaper rules.

## 6. Desktop (1000px and up)

```
┌────────────────────────── dark stage, rounded 44px ──────────────────────────┐
│                                                           ◯ (coin: next)     │
│   Education                                  ╭───────────────────╮           │
│   Learning environments, school…            ╱    ring (dashed)     ╲         │
│   ─────────────────────────────           │      ┌───────────┐      │  ◯     │
│   ▸ Schools and classroom blocks          │      │ sculpture │      │ (coin) │
│   ▸ Science and ICT laboratories          │      │  floating │      │        │
│   ▸ Teachers' housing and sanitation       ╲     └───────────┘     ╱         │
│   ▸ Digital learning and teacher capacity    ╰─────── ◉ ──────────╯          │
│   [ See our education work  ↗ ]            (active coin, label: Education)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Two columns, text left (5 parts) and stage right (6 parts), vertically centred, generous padding (about 4.4vw).
- The stage is a square. The ring is a thin dashed circle at 82% of the stage width. Three coins sit on it; the
  **active pillar's coin always rests at the bottom**, larger, glowing in its own colour, with its name beneath. The
  centre holds the large sculpture (about 56% of stage width), a soft ground shadow beneath it, and a halo in the
  active colour behind it.
- Coins hold small versions of the sculptures. Other coins show their name on hover and keyboard focus.
- Only the active pillar's text is visible; the others are removed from view and from the accessibility tree.

## 7. Mobile (below 1000px), designed for one thumb

```
┌─────────────── dark card, rounded 32px ───────────────┐
│                                                        │
│                  ╭───────────────╮                     │
│                  │  sculpture    │   halo in colour    │
│                  │   floating    │                     │
│                  ╰───────────────╯                     │
│                   ground shadow                        │
│                                                        │
│   (◉)       (◯)       (◯)       (◯)                    │
│  Education  Health   Climate  Inclusion                │
│                                                        │
│ ┌────────────────────────────┐┌─────                   │
│ │ Education                  ││ Health                 │
│ │ Learning environments, …   ││ Comm…                  │
│ │ ──────────────────────     │└─────                   │
│ │ ▸ Schools and classroom…   │   ← next card peeks    │
│ │ ▸ Science and ICT labs…    │      in from the right │
│ │ [ See our education work ↗ ]                        │
│ └────────────────────────────┘                         │
└────────────────────────────────────────────────────────┘
```

- **One sculpture, large and centred**, about 64% of the card width, on a halo, so the section's identity survives
  at 390px. The ring is dropped on a phone; the selectors become a row.
- **Four coin selectors in a row** directly under the sculpture, each at least 44px tall, with a visible name below
  (13px minimum). The active coin is ringed in its colour and slightly larger. They sit in the thumb zone.
- **Swipeable cards** below, using native scroll snapping. Each card is a little narrower than the card it sits in,
  so **the next card peeks in** and tells people to swipe. Swiping moves the stage in step: the sculpture, the halo
  colour and the selected coin follow whichever card is in view. Tapping a coin scrolls to its card.
- No horizontal scrolling of the page. The cards scroll inside the stage and nothing else widens.
- Text stays left-aligned. Areas of work are one per line with room to wrap; the link is a full-height pill.
- Respect the safe areas, and never let a fixed bar cover the link.

## 8. Motion (one orchestrated moment, answering a person's action)

When a pillar is chosen (tap, click, arrow key, or swipe):

1. The **ring turns a quarter turn** the short way round, 0.9s, ease `cubic-bezier(0.2, 0.8, 0.2, 1)`.
2. The outgoing sculpture **rotates out about 9 degrees, slides 26px away from the direction of travel and fades**;
   the incoming one arrives from the other side, from 0.9 scale to 1, 0.85s, same ease. Direction follows the
   direction of travel.
3. The **stage colour glides** to the new pillar's colour over 0.8s (registered colour properties, so it blends
   instead of switching).
4. The **text swaps**: the old text fades over 0.45s, the new text rises 16px and fades in after a 0.16s delay.
5. Afterwards the active sculpture **floats gently** (about 7px up and down over 5.8s). That is the only motion
   that runs on its own.

Nothing else on the section animates. No entrance fades on every element, no hover effects on every card, no
autoplay. Reduced motion: no float, no rotation or slide; the sculpture and text cross-fade quickly and the ring
and colours change without easing.

## 9. Build constraints (so it survives the real world)

- **Semantics.** Tabs pattern: a `tablist` of four buttons, four `tabpanel`s, `aria-selected`, roving `tabindex`,
  Left/Right/Up/Down to move (wrapping), Home and End. Visible focus (3px white outline). Decorative sculptures are
  `aria-hidden`.
- **No JavaScript.** All four pillars' text and links are in the page and are readable stacked; the selectors only
  appear once the script runs. The script is about 2 KB and does nothing else.
- **Performance.** The four sculptures are small transparent AVIF files (about 8 to 12 KB each, WebP fallback),
  lazy-loaded. Motion uses transform and opacity only, plus the registered colour and angle properties. Layout must
  not shift. Choose sizes with container units so the stage scales with its own width, not the viewport.
- **Contrast.** Body text on the stage meets 4.5:1 on every pillar; each pillar's button text is chosen against its
  own colour (white on crimson, near-black on sky, emerald and amber).
- **Content integrity.** No numbers, outcomes or claims beyond the table in section 4.

## 10. Image prompts for sharper sculptures (the current files are 480px)

Use these to create transparent-background renders at 2000 x 2000 px or larger, then export small AVIF and WebP
files. Keep the same camera, light and material across all four so they read as a family.

**Shared style line (add to each):** *Photorealistic 3D render of a single sculpture made of glossy satin ribbon
with a thin lighter edge, soft studio lighting from above left, gentle specular highlights, subtle ground shadow,
isolated on a fully transparent background, centred, three-quarter view, no text, no logo, no hands, ultra-clean
edges.*

1. **Education, an open book.** *An open book whose pages are fanned layers of folded ribbon, deep crimson covers
   and warm cream pages, the spine at the centre, pages lifting slightly as if just opened.*
2. **Health, a pearl in petals.** *A luminous pearl cradled between two tall, curling ribbon petals that rise from a
   narrow stem, sky-blue satin, the pearl pale lilac-white with a soft inner glow.*
3. **Climate and green development, a leaf.** *A single large leaf formed from one sweeping ribbon, emerald green,
   a curled tip and a long trailing stem, a visible midrib and a light edge line.*
4. **Financial inclusion, interlocking loops.** *Three tall ribbon loops interlocked and rising, polished amber-gold
   satin with warm highlights, as if one ribbon were folded into a small skyline of shared steps.*

**Negative prompt:** *text, letters, watermark, people, faces, background, floor, coins, money symbols, stock
photo look, plastic toy look, over-saturated neon, harsh black outlines.*

## 11. What to avoid

- Four identical rounded cards with the same soft shadow.
- A tracked all-caps label above every heading, "01 / 02 / 03 / 04" markers on content that is not a sequence,
  and middle-dot meta strings.
- A single word of a headline set in a different colour or style.
- Fade-and-slide-up on every element, and hover transitions on everything.
- A near-black page with one acid accent, a cream page with a terracotta accent, and a newspaper layout with
  hairline rules. These are defaults, not choices.
- Stock photography of smiling hands. The sculptures carry the section.

## 12. Acceptance checklist

- [ ] At 1440px the stage fits one screen, the active coin rests at the bottom of the ring, and the name never wraps
      badly ("Climate & Green Development" on two lines).
- [ ] At 390px there is no horizontal page scroll; the next card visibly peeks; swiping changes the sculpture and the
      selected coin; every target is at least 44px.
- [ ] Arrow keys, Home and End work and wrap; focus is always visible.
- [ ] With JavaScript off, all four pillars read in order with working links.
- [ ] With reduced motion on, nothing floats or spins.
- [ ] Axe reports no WCAG 2.2 A or AA violations; the page-weight budget for the homepage still holds.
- [ ] Choosing a pillar feels like one smooth gesture, not four separate effects.

## Where it lives in the code

`src/components/home/ProgrammePillars.astro` (markup), `src/scripts/pillars.ts` (behaviour), the "Pillars" block in
`src/styles/home.css` (layout, colour, motion), `src/config/navigation.ts` (the copy), `assets/pillars/` (sculptures).
