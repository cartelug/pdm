# The ChatGPT brief — 5+ homepage designs for PCI Uganda

**How to use this file**

1. Open ChatGPT. Start a **new chat**. Use the strongest model available (GPT‑5 Thinking or better).
2. **Upload the PCI logo image first**, before you paste anything — the red `PC` + black figure mark.
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

I have uploaded the client's logo. Study it — it is the source of the visual
language and it is binding.

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

## 2. The logo — read it, then build from it

The uploaded mark is a **wordmark-and-figure lockup**:

- **`PC`** set in heavy geometric red letterforms. The `C` is a large, near-circular counter — an open ring.
- **The `I` is a human figure in black** — a round head, and two arms sweeping upward and outward in a wide crescent, body below. It reads as *a person standing with arms raised.* Celebration, agency, arrival.
- The figure's left arm **interlocks with the red `C`**, black crossing red. The letters are not sitting beside each other; they are joined.

**The design language this hands you** — use it, do not invent a different one:

| From the mark | What it gives the page |
|---|---|
| The raised-arms figure | **A person at the centre.** Uplift, agency. The human is the subject, never the recipient |
| The interlock of P, C and I | **Joining.** Overlap, layering, things that connect and hold |
| The wide crescent sweep of the arms | **Momentum.** Arcs, sweeps, curves that carry the eye |
| The open ring of the `C` | **A cycle that stays open.** Perfect for the nine-step model below |
| Red on black on white | **Severe contrast, used sparingly.** Confidence, not noise |

Do **not** redraw, restyle or "improve" the logo. In the header use
`<img src="pci-logo.png" alt="PCI Uganda — Pamodzi Community Initiative">`
(assume the file sits next to the HTML). You may echo its *geometry* — crescents,
the open ring, the standing figure, the interlock — anywhere else on the page.

## 3. The brand system — binding

**Colour**

| Token | Hex | Use |
|---|---|---|
| Red | `#D81E26` | the brand accent — **CTA and one hero moment only** |
| Red bright | `#F04149` | red on black, where `#D81E26` loses contrast |
| Black | `#0F0F0F` | dark canvas, dark sections |
| Ink | `#14110F` | body text on light |
| Stone | `#6B6560` | secondary / muted text on light |
| Stone light | `#9A938C` | muted text on black |
| Sand | `#F2EEEA` | warm section fill |
| Sand deep | `#EAE4DE` | second warm fill, rules and wells |
| Paper | `#FAF8F6` | default page ground — **warm off-white, never pure white** |
| Rule | `rgba(15,15,15,.12)` | hairlines |

**Red is a scalpel, not a paint roller.** Roughly **one red element per
viewport**, always on the single most important thing on that screen. If red
appears three times on one screen it has failed. The page's power comes from
black, off-white and space — red only points.

**The ground is warm.** `#FAF8F6`, not `#FFFFFF`. That single decision is what
separates this from every stark red-and-black template. Keep it warm.

**Type** — load from Google Fonts:
- Display / all headings: **Fraunces** (variable — `opsz` 96, `SOFT` 24, weight 600)
- Body / UI / nav: **Instrument Sans** (400 / 500 / 600)
- Figures, data, eyebrows: **JetBrains Mono** (400 / 700)

Set headings **tight**: `line-height: 1.02`, `letter-spacing: -0.022em`,
`text-wrap: balance`. Big type only earns its size when it is set tightly.

*One licence:* the client is mid-rebrand, so **one or two** of your directions
may propose a different display face if — and only if — you argue for it in one
sentence and it clearly beats Fraunces against this logo. The rest must use
Fraunces. Do not change the body or mono faces.

## 4. Real content — use this, never lorem ipsum

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
straight line.** The open `C` of the logo is your reference:
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

## 5. What you must deliver

**Five to seven homepage designs — genuinely different, not five skins of one
layout.** A recruiter should be able to tell them apart from across the room.

Each direction must differ on at least **four** of these axes:

- **Hero architecture** — full-bleed statement · split editorial · asymmetric type-led · horizontal scroll · oversized figure-first · the standing figure as the hero object
- **Ground** — light paper-first vs black-first vs alternating bands
- **Grid** — classic centred · broken/offset editorial · Swiss column-ruled · magazine multi-column · single narrow spine
- **Type ratio** — restrained (heading 3–4× body) vs extreme (heading 8–10× body, near-poster)
- **Motion character** — near-still and architectural · reveal-on-scroll · scroll-driven scene · continuous ambient drift
- **How data appears** — quiet inline figures · giant numerals as the layout itself · a ticker/board · diagrammatic
- **How the pillars appear** — cards · numbered editorial list · tabbed/accordion · four figures/arcs echoing the mark

Suggested starting territories — take them, combine them, or beat them:

1. **The Institutional Broadsheet** — Fraunces at poster scale on warm paper, hairline rules, column-ruled grid, a single red masthead line. The front page of a serious newspaper. Almost no motion; the confidence is in the typography.
2. **Blackout** — `#0F0F0F` from the first pixel, off-white type, one red thread running the length of the page. Cinematic, slow, expensive. The figures glow.
3. **The Ledger** — data is the design. `UGX 2.19B` set at 200px as an actual layout element. Monospace scaffolding, receipts-and-evidence energy. Argues with numbers.
4. **The Standing Figure** — the logo's raised-arms human, scaled enormous, becomes the hero. The sweep of the arms sets the geometry of every section below it. The most literal descendant of the mark, and potentially the most memorable.
5. **Constructivist** — red and black on off-white, hard diagonals, heavy rules, type on the angle. Poster energy, Rodchenko discipline. Dangerous and probably the boldest thing here — make it institutional, not decorative.
6. **The Long Road** — the 345 km walk is the spine. A scroll-driven journey from Kampala to Kasese; sections arrive as places along it. Emotional, kinetic, campaign-first.
7. **Warm Editorial** — sand and paper, generous white space, big photographic voids with intentional illustration in them, magazine pacing. The most human of the seven.

Every direction, regardless, must include:
sticky/considered header with the logo · hero with headline + lede + two CTAs +
key figures · the positioning block (*Not a donor. A convener.*) · the four
pillars · the ICIADM cycle · the impact figures · the Faith in Motion campaign
block · a partner-pathways CTA · a full footer.

## 6. Technical requirements — non-negotiable

- **One complete, standalone `.html` file per design.** Everything inline: CSS in a `<style>` block, JS in a `<script>` block. Opens by double-clicking. No build step, no framework, no React, no Tailwind CDN.
- **No external requests except Google Fonts, and no image files except `pci-logo.png`.** Express every other visual with CSS, inline SVG, gradients and type. Where a photo would go, design an intentional SVG or CSS placeholder that looks deliberate, and mark it `<!-- PHOTO SLOT: … -->`.
- **Responsive, mobile-first, from 360px to 1920px.** Fluid type with `clamp()`. Nothing may scroll horizontally on a phone. A working mobile nav.
- **Accessible.** Semantic landmarks, one `<h1>`, real focus-visible states, 4.5:1 body contrast, `alt`/`aria-label` on meaningful SVG, `aria-hidden` on decorative SVG, and a `@media (prefers-reduced-motion: reduce)` block that genuinely disables motion. Note `#D81E26` on `#FAF8F6` is about 4.6:1 — fine for text, but never set small grey-red text.
- **Motion with taste.** Easing `cubic-bezier(.2,.8,.3,1)`, durations 180–700ms, stagger ~60ms. IntersectionObserver for reveals, never a library. Motion should feel like weight and intention, not decoration. If a direction is deliberately still, say so and commit.
- **60fps.** Animate `transform` and `opacity` only.
- Fill `<title>` and `<meta name="description">` properly. Include `<meta name="theme-color">`.
- Target ~600–1100 lines per file. Density is fine; padding is not.

## 7. How to work

**First message — concepts only, no code.** Give me a numbered list of your 5–7
directions. For each, in 4–6 lines: the name, the one-sentence idea, the hero
architecture, the ground, the motion character, and **the one thing that will
make someone screenshot it.** Then stop and wait.

**Then, on my `GO 1`, `GO 2` …** — deliver that one design as a single complete
HTML file in one code block. Nothing else in the message except a two-line note
on what makes it distinct. One design per message. Never abbreviate with
`/* ... rest of styles ... */` — the file must be complete and runnable.

## 8. The bar

Before you output any file, check it against these. If it fails one, redesign
before showing me.

- Would this survive a homepage-of-the-year gallery, or does it look like a template?
- Is there **one** unmistakable idea a person could describe in a sentence?
- Does the typography carry the page, rather than boxes and shadows carrying it?
- Is the whitespace **composed** — a deliberate rhythm of tight and open — or is everything evenly padded?
- Is red used once per viewport, and is it on the thing that matters most?
- Is the ground warm off-white rather than pure white?
- Does the page descend from **this logo** — the standing figure, the interlock, the open ring — or would it look the same with any mark dropped in?
- Does it read as a **development institution convening capital**, not a charity asking for money?
- Would a Ugandan reader see themselves as the investor in this page?
- Is there a moment of genuine craft — a transition, a diagram, a scale jump — that a competent developer would not have thought of?

**Avoid at all costs:** generic SaaS hero with a centred headline and two
buttons on a gradient · rounded-corner cards in a 3-across grid with drop
shadows · purple-blue gradients · stock-photo energy · emoji as icons ·
"Empowering communities worldwide" copy · Bootstrap spacing · red used as a
background wash · anything that would look identical with a different logo
dropped in.

Start now with the concept list. No code yet.

═══════════════════════════════════════════════════════════════════════

---

## ‹optional› Follow-up prompts that raise the quality

Once it gives you a design, these get more out of it:

- `Push direction 3 twice as far. It is still too safe — make the numbers the architecture, not decoration.`
- `The hero is generic. Redesign only the hero, three alternatives, same file otherwise.`
- `You used red four times on the first screen. Cut it to one. Rebuild the hierarchy in black and space.`
- `Now cut 30% of the elements. What survives is the design.`
- `Show me this at 390px wide. Rewrite anything that breaks or feels cramped.`
- `Critique your own file against the bar in section 8, honestly, then fix what you flagged.`
- `Combine the hero of 2 with the pillar system of 4 and the pacing of 7.`

## What to send back here

Save each as `design-1.html`, `design-2.html` … and post them in this chat.
I will pick the strongest direction — or graft the best parts of several — and
build it into the real site against the live design system, so it works with
every other page and stays fast and accessible.
