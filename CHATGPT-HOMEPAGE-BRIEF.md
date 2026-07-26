# The ChatGPT brief — 5+ homepage designs for PCI Uganda

**How to use this file**

1. Open ChatGPT. Start a **new chat**. Use the strongest model available (GPT‑5 Thinking or better).
2. **Upload two images first**, before you paste anything:
   - `pci-brand-sheet.png` — the whole brand system in one image
   - `pci-mark-1024-transparent.png` — the logo on transparency
3. Then copy **everything between the two `═══` lines** below and paste it as your first message.
4. It will reply with concepts only. Reply `GO 1`, then `GO 2`, and so on — one full design per message.
5. Save each result as `design-1.html`, `design-2.html` … and send them back here.

Everything below the line is the prompt. Do not edit it except where marked `‹optional›`.

---

═══════════════════════════════════════════════════════════════════════

You are a senior art director and front-end engineer. Your work sits in the top
0.1% — the tier that wins Awwwards Site of the Day and gets picked up by
Godly.website. You are being hired to design the homepage for a real
institution, and the bar is: **someone should screenshot this and post it.**

I have uploaded a brand reference sheet and the logo mark. Read them carefully —
the exact hex values, the typefaces and the logo geometry in those images are
binding.

## 1. The client

**Pamodzi Community Initiative — "PCI Uganda"**
Tagline: *Together for Development.* Established 2022. National focus: Uganda.

It is **not a charity and not an NGO begging for donations.** It is an
indigenous Ugandan **development institution** — a convener. The single most
important idea on the page:

> Most development money arrives from outside and leaves when the project ends.
> PCI works the other way round: it organises the resources a community already
> has — savings groups, cooperatives, professionals, businesses, diaspora, local
> government — into investments large enough to build something permanent.

Its positioning line is **"Not a donor. A convener."**
Its belief: *"Sustainable development is most effective when communities become
active investors in their own future."*

Audience, in priority order:
1. **Institutional partners** — government ministries, district local governments, development partners, banks, foundations. They must read *credible, governed, serious.*
2. **Private capital** — businesses, investors, diaspora. They must read *this is an investment vehicle, not a hat being passed.*
3. **Communities and members** — they must read *this belongs to us.*

Tone: institutional confidence. Editorial, not corporate. Warm, not soft.
Evidence, not adjectives. Never saccharine, never poverty imagery, never
white-saviour framing. Ugandans are the investors here, not the recipients.

## 2. The brand system — binding

**Colour** (from the uploaded sheet)

| Token | Hex | Use |
|---|---|---|
| Forest 900 | `#0C241D` | dark canvas, dark sections |
| Forest 700 | `#1A4A3C` | primary brand green |
| Forest 500 | `#2E6B57` | secondary green |
| Sage | `#7E9C8D` | muted text on dark |
| Gold | `#C08A2E` | accent — **CTA only** |
| Gold 2 | `#DCA948` | accent on dark |
| Clay | `#B5462F` | rare alert / fourth pillar |
| Cream | `#F4EEE1` | warm section fill |
| Paper | `#FDFAF3` | default page ground |

**Gold is a scalpel, not a paint roller.** Roughly one gold element per
viewport. If gold appears three times on one screen it has failed.

**Type** — load from Google Fonts:
- Display / all headings: **Fraunces** (variable — use `opsz` 96, `SOFT` 24, weight 600). Set headings **tight**: `line-height: 1.02`, `letter-spacing: -0.022em`, `text-wrap: balance`.
- Body / UI / nav: **Instrument Sans** (400 / 500 / 600)
- Figures, data, eyebrows: **JetBrains Mono** (400 / 700)

**Logo** — four arcs (forest, gold, forest-500, clay) rotating around a solid
centre dot. Four arcs = the four strategic pillars. The gaps read as openness;
the ring reads as collective action and reinvestment. Reproduce it as **inline
SVG** in your HTML — do not link to an image file, and do not redraw it into
something else. Here is the exact source, use it verbatim:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" role="img" aria-label="Pamodzi Community Initiative">
  <g stroke-linecap="round" fill="none">
    <path d="M32 6 A26 26 0 0 1 58 32" stroke="#1A4A3C" stroke-width="5"/>
    <path d="M58 32 A26 26 0 0 1 32 58" stroke="#C08A2E" stroke-width="5"/>
    <path d="M32 58 A26 26 0 0 1 6 32" stroke="#2E6B57" stroke-width="5"/>
    <path d="M6 32 A26 26 0 0 1 32 6" stroke="#B5462F" stroke-width="5"/>
  </g>
  <circle cx="32" cy="32" r="9" fill="#1A4A3C"/>
  <circle cx="32" cy="32" r="3.4" fill="#C08A2E"/>
</svg>
```
On dark backgrounds swap `#1A4A3C` → `#F4EEE1` and `#2E6B57` → `#A8BEB1`.

**That geometry is your design language.** Arcs, concentric rings, rotation,
a centre that holds, gaps that stay open. Whatever you build should feel like it
grew from that mark.

## 3. Real content — use this, never lorem ipsum

**Headline territory** (write your own, but this is the register):
"Communities that invest in their own future." · "Not a donor. A convener." ·
"Local capital, organised."

**Hero figures**
`UGX 2.19B` community and private capital mobilised (≈ USD 580,000) ·
`120+` members, entrepreneurs and investors · `4+` community and investment
platforms · `16` strategic investment partners · `600+` reached by community
medical outreach · founded `2022`

**The four pillars**
- **I · Education** — schools and classroom blocks, science and ICT laboratories, libraries, teachers' housing and sanitation, digital learning and teacher capacity. With the Ministry of Education and Sports.
- **II · Health** — Health Centre II/III/IV facilities, maternity wards, theatres and laboratories, staff accommodation, equipment and ambulances. With the Ministry of Health.
- **III · Climate and green development** — solar, mini-hydro and biogas, climate-smart agriculture, irrigation, afforestation, green infrastructure, waste management.
- **IV · Financial inclusion** — VSLAs, SACCOs and cooperatives, youth and women's enterprises, financial literacy, investment readiness, business incubation.

**The model — ICIADM** (Integrated Community Investment and Asset Development
Model). Nine steps, and the ninth feeds the first — draw it as a **cycle, not a
straight line**:
`01` Community mobilisation → `02` Partnership building → `03` Local resource
mobilisation → `04` Strategic investment → `05` Asset development →
`06` Sustainable service delivery → `07` Income generation → `08` Reinvestment →
`09` Community transformation

**Proof — real, delivered**
- **Pamodzi 4 Development (P4D)**, Kasese — 55 members, UGX 450M mobilised, internal lending for business, agriculture, education
- **Udada Women Entrepreneurs Network**, Wakiso — 50 women entrepreneurs, UGX 600M mobilised
- **TBS Meridian Realities LLP** — 16 investment partners, UGX 902M, two hotel suites and two condominium units
- **Community medical outreach**, Nyabirongo Health Centre III, Kasese — 600+ people reached, June 2023, convened with Rotary and the District Health Office

**The live campaign — Faith in Motion / Walking for Impact**
A 345 km walk, Kampala → Kasese, to complete St Joseph Catholic Church at
Rwembyo, Kisinga, Kasese District. Every step is assigned a value:
**466,200 steps at UGX 1,000 each.** With the Rotary Club of Akright City and
the Walking Rotarian. This is the emotional engine of the page — it must feel
alive and in progress, not archived.

**Partners to name**: Government ministries, district local governments,
development partners, financial institutions, Rotary Club of Akright City.

**Calls to action**: primary `Partner with us` · secondary `How our model works`
· campaign `Sponsor a step`

## 4. What you must deliver

**Five to seven homepage designs — genuinely different, not five skins of one
layout.** A recruiter should be able to tell them apart from across the room.

Each direction must differ on at least **four** of these axes:

- **Hero architecture** — full-bleed statement · split editorial · asymmetric type-led · horizontal scroll · oversized figure-first · the mark as the hero object
- **Ground** — light paper-first vs dark forest-first vs alternating bands
- **Grid** — classic centred · broken/offset editorial · Swiss column-ruled · magazine multi-column · single narrow spine
- **Type ratio** — restrained (heading 3–4× body) vs extreme (heading 8–10× body, near-poster)
- **Motion character** — near-still and architectural · reveal-on-scroll · scroll-driven scene · continuous ambient drift
- **How data appears** — quiet inline figures · giant numerals as the layout itself · a ticker/board · diagrammatic
- **How the pillars appear** — cards · numbered editorial list · tabbed/accordion · a rotating quadrant echoing the logo

Suggested starting territories — take them, combine them, or beat them:

1. **The Institutional Broadsheet** — Fraunces at poster scale on paper, hairline rules, column-ruled grid. Reads like the front page of a serious newspaper. Almost no motion; the confidence is in the typography.
2. **Forest Nightfall** — dark from the first pixel, cream type, a single gold thread. Cinematic, slow, expensive. The figures glow.
3. **The Ledger** — data is the design. `UGX 2.19B` set at 200px as an actual layout element. Monospace scaffolding, receipts-and-evidence energy. Argues with numbers.
4. **The Quadrant** — the logo's four arcs become the page's operating system. A rotating quadrant navigates the four pillars; the ICIADM nine steps run as a closed ring you can scrub.
5. **The Long Road** — the 345 km walk is the spine. A scroll-driven journey from Kampala to Kasese; sections arrive as places along it. Emotional, kinetic, campaign-first.
6. **Warm Editorial** — cream and paper, generous white space, big photographic voids with intentional illustration in them, magazine pacing. The most human of the six.

Every direction, regardless, must include:
sticky/considered header with the mark · hero with headline + lede + two CTAs +
key figures · the positioning block (*Not a donor. A convener.*) · the four
pillars · the ICIADM cycle · the impact figures · the Faith in Motion campaign
block · a partner-pathways CTA · a full footer.

## 5. Technical requirements — non-negotiable

- **One complete, standalone `.html` file per design.** Everything inline: CSS in a `<style>` block, JS in a `<script>` block. Opens by double-clicking. No build step, no framework, no React, no Tailwind CDN.
- **No external requests except Google Fonts.** No image files — express every visual with CSS, inline SVG, gradients and type. Where a photo would go, design an intentional SVG or CSS placeholder that looks deliberate, and mark it `<!-- PHOTO SLOT: … -->`.
- **Responsive, mobile-first, from 360px to 1920px.** Fluid type with `clamp()`. Nothing may scroll horizontally on a phone. A working mobile nav.
- **Accessible.** Semantic landmarks, one `<h1>`, real focus-visible states, 4.5:1 body contrast, `alt`/`aria-label` on meaningful SVG, `aria-hidden` on decorative SVG, and a `@media (prefers-reduced-motion: reduce)` block that genuinely disables motion.
- **Motion with taste.** Easing `cubic-bezier(.2,.8,.3,1)`, durations 180–700ms, stagger ~60ms. IntersectionObserver for reveals, never a library. Motion should feel like weight and intention, not decoration. If a direction is deliberately still, say so and commit.
- **60fps.** Animate `transform` and `opacity` only.
- Fill `<title>` and `<meta name="description">` properly. Include `<meta name="theme-color">`.
- Target ~600–1100 lines per file. Density is fine; padding is not.

## 6. How to work

**First message — concepts only, no code.** Give me a numbered list of your 5–7
directions. For each, in 4–6 lines: the name, the one-sentence idea, the hero
architecture, the ground, the motion character, and **the one thing that will
make someone screenshot it.** Then stop and wait.

**Then, on my `GO 1`, `GO 2` …** — deliver that one design as a single complete
HTML file in one code block. Nothing else in the message except a two-line note
on what makes it distinct. One design per message. Never abbreviate with
`/* ... rest of styles ... */` — the file must be complete and runnable.

## 7. The bar

Before you output any file, check it against these. If it fails one, redesign
before showing me.

- Would this survive a homepage-of-the-year gallery, or does it look like a template?
- Is there **one** unmistakable idea a person could describe in a sentence?
- Does the typography carry the page, rather than boxes and shadows carrying it?
- Is the whitespace **composed** — is there a deliberate rhythm of tight and open — or is everything evenly padded?
- Is gold used once per viewport, and is it on the thing that matters most?
- Does it read as a **development institution convening capital**, not a charity asking for money?
- Would a Ugandan reader see themselves as the investor in this page?
- Is there a moment of genuine craft — a transition, a diagram, a scale jump — that a competent developer would not have thought of?

**Avoid at all costs:** generic SaaS hero with a centred headline and two
buttons on a gradient · rounded-corner cards in a 3-across grid with drop
shadows · purple-blue gradients · stock-photo energy · emoji as icons ·
"Empowering communities worldwide" copy · Bootstrap spacing · anything that
would look identical with a different logo dropped in.

Start now with the concept list. No code yet.

═══════════════════════════════════════════════════════════════════════

---

## ‹optional› Follow-up prompts that raise the quality

Once it gives you a design, these get more out of it:

- `Push direction 3 twice as far. It is still too safe — make the numbers the architecture, not decoration.`
- `The hero is generic. Redesign only the hero, three alternatives, same file otherwise.`
- `Now cut 30% of the elements. What survives is the design.`
- `Show me this at 390px wide. Rewrite anything that breaks or feels cramped.`
- `Critique your own file against the bar in section 7, honestly, then fix what you flagged.`
- `Combine the hero of 2 with the pillar system of 4 and the pacing of 6.`

## What to send back here

Save each as `design-1.html`, `design-2.html` … and post them in this chat.
I will pick the strongest direction — or graft the best parts of several — and
build it into the real site against the live design system, so it works with
every other page and stays fast and accessible.
