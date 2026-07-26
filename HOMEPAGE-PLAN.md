# Homepage plan — the most attractive version of pci.uganda

The brief for the redesign of `index.html`. Written to be true regardless of
which visual direction we end up choosing, so the ChatGPT explorations can be
judged against it rather than against taste alone.

---

## 1. The job the homepage has to do

A visitor lands with one of three questions. The page has to answer all three
without making anyone read the others.

| Visitor | Their question | What must land, and how fast |
|---|---|---|
| **Ministry / district / development partner** | *Is this organisation real and governed?* | Evidence and governance, above the fold or one scroll down |
| **Investor / business / diaspora** | *Is this an investment vehicle or a collection tin?* | The word **convener**, and UGX 2.19B already mobilised — inside 5 seconds |
| **Community member / supporter** | *Is this mine?* | Ugandans as investors, named places, the live campaign |

The single sentence the whole page exists to plant:

> **Most development money arrives from outside and leaves. PCI organises what
> the community already has into something permanent.**

If a visitor leaves able to say that back, the homepage worked.

---

## 2. What the current homepage gets right — keep it

The bones are genuinely good and should not be thrown away.

- **The positioning is already sharp.** *"Not a donor. A convener."* is the best line on the site. It is currently buried in section two — it should be nearer the top.
- **Real, reconciled figures.** UGX 2.19B, 120+, 16 partners, 600+ reached. Most organisations at this stage have nothing this concrete.
- **The typographic system.** Fraunces + Instrument Sans + JetBrains Mono is distinctive and correct. Do not restart it. *(The colour system beneath it has been rebranded — see §9.)*
- **Honest restraint.** No guaranteed outcomes, no inflated claims, targets labelled as targets. That credibility is an asset — the redesign must not sand it off in pursuit of drama.

## 3. What is holding it back — the actual diagnosis

1. **The hero decorates instead of arguing.** The concentric SVG is pleasant wallpaper. Nothing moves, nothing is proven, and the four stat tiles all have the same weight — so none of them lands. UGX 2.19B is the strongest fact the organisation owns and it is sitting in a row of four equal boxes.
2. **The best idea is the dullest element.** ICIADM is nine steps where the ninth feeds back into the first — a *cycle*. It currently renders as nine flat boxes in a row, which reads as a checklist and loses the entire point. This is the biggest single miss on the page.
3. **The logo's geometry is unused.** The real mark is `PC` in heavy red letterforms with the `I` formed by a black human figure, arms raised, its left arm interlocking with the open ring of the `C`. That hands the page three motifs — *a person at the centre*, *the interlock*, *the open ring* — and the page currently uses none of them.
4. **Zero human presence.** No faces, no places, no photographs — and the four pillars are four identical cards. The work is in Kasese and Wakiso and the page never lets you feel that.
5. **The live campaign does not feel live.** Faith in Motion is 345 km in progress with 466,200 sponsorable steps, presented as a paragraph. No progress, no motion, no urgency.
6. **No social proof surface.** Rotary, the ministries and the district governments are named in body copy on inner pages and never shown as an institutional trust row.
7. **No craft moment.** There is nothing anyone would screenshot.

## 4. The narrative spine

Nine movements. This is the order and the intent; the visual direction can
express each one very differently.

| # | Movement | Intent | Signature move |
|---|---|---|---|
| 1 | **Hero** | Plant the thesis and the proof in one screen | One dominant figure, not four equal ones. **UGX 2.19B** at display scale, everything else subordinate |
| 2 | **The turn** | *Not a donor. A convener.* | The contrast stated as a contrast — outside money leaves / local capital stays — held in a single visual comparison |
| 3 | **Four pillars** | What the work actually is | The four arcs of the mark become the four pillars. Hover/tap an arc, the pillar opens |
| 4 | **The model** | Why it compounds | **The ICIADM cycle as a closed ring.** Nine steps around a circle, step 09 feeding 01. Scrubbable |
| 5 | **Proof** | Evidence, not intentions | Named platforms with real numbers — P4D 55/UGX 450M, Udada 50/UGX 600M, TBS Meridian 16/UGX 902M, 600+ reached |
| 6 | **Trust** | Who stands with them | Ministries, district local governments, Rotary Club of Akright City, financial partners |
| 7 | **Faith in Motion** | The emotional engine | Live progress along the 345 km road. The only place on the page where urgency is allowed |
| 8 | **A way in** | Convert | Four routes: government · investor · business · community. Each a distinct door, not one generic button |
| 9 | **Footer** | Governance and closure | Reconciled-figures note, the honest tone that makes the rest believable |

**Pacing.** Movements 1–2 tight and fast. 3–4 slow and spacious — this is where
craft lives. 5–6 dense and factual. 7 warm and kinetic. 8 decisive. Even
padding throughout is the enemy; the rhythm of tight and open *is* the design.

## 5. The three signature moments

A homepage is remembered for one or two things. We are budgeting for three, and
they are all cheap to build because they are SVG and CSS.

1. **The ICIADM ring.** Nine steps on a circle, gold traveller moving 01 → 09 →
   01, driven by scroll position or hover. It makes the organisation's core
   idea *visible* — that value returns to where it came from. Nothing else on
   the site explains the model as well as this diagram would.
2. **The standing figure.** The logo's raised-arms human, scaled enormous, as a
   section-opening object — and the sweep of its arms setting the geometry of
   the four pillars beneath it. The mark stops being a sticker in the corner and
   becomes the page's argument: *the Ugandan investor, arms up, at the centre.*
3. **The road.** A 345 km line from Kampala to Kasese that fills as you scroll
   the campaign section, with the halfway marker and the step counter riding it.

Each must degrade gracefully: fully readable with JavaScript off, fully static
under `prefers-reduced-motion`, fully usable by keyboard.

## 6. Fixed constraints

- **Red once per viewport**, always on the most important action. This is the discipline that keeps the palette expensive. The page's power comes from black, warm off-white and space — red only points.
- **The ground stays warm.** `#FAF8F6`, never pure white. That single decision is what separates this from every stark red-and-black template.
- **Headings tight** — `line-height: 1.02`, `letter-spacing: -0.022em`, `text-wrap: balance`. Big type only earns its size when it is set tightly.
- **No new dependencies.** Static HTML/CSS/JS, no build step, no framework. It ships to GitHub Pages exactly as it stands.
- **Every figure stays reconciled.** No number appears on the homepage that is not already approved on `impact.html`. Targets stay labelled as targets.
- **Photo slots, not photo blockers.** Design intentional SVG in every photo position so the page is finished today, and swap in real photography later without a redesign. `PHOTO-SHOT-LIST.md` already specifies the shots.
- **Accessibility is not a phase.** Semantic landmarks, one `h1`, visible focus, 4.5:1 contrast, honest reduced-motion.
- **Budget:** ≤ 120KB critical path, LCP under 2.0s on 3G. Rural Ugandan mobile is the real test device, not a laptop.

## 7. How we choose the winning direction

Score each ChatGPT design out of 5 on each. Highest total wins; anything below
3 on *credibility* is disqualified regardless of total.

1. **Credibility** — does a ministry official take this seriously?
2. **The one idea** — can you describe what makes it distinct in a sentence?
3. **Typography carries it** — or is it boxes and shadows doing the work?
4. **Composed whitespace** — deliberate rhythm, or even padding everywhere?
5. **Ownership** — would a Ugandan reader see themselves as the investor?
6. **The screenshot** — is there a moment worth posting?

We are not obliged to ship one design whole. The likely outcome is a graft:
the strongest hero, the strongest pillar system and the strongest pacing,
rebuilt properly against `css/pci.css` so it stays consistent with the other
eleven pages.

## 8. Sequence from here

1. Run the ChatGPT brief → 5–7 directions. *(brief is ready: `CHATGPT-HOMEPAGE-BRIEF.md`)*
2. Score them against §7, pick the direction or the graft.
3. Build it into `index.html` against the existing design system — no parallel stylesheet.
4. Build the three signature moments properly, with reduced-motion and no-JS fallbacks.
5. Propagate whatever the homepage establishes to the other pages so the site stays one system.
6. Then finish the rest of the site: real photography, the two open figures in `README.md` (the UGX 410M vs 466.2M goal, and the payment channel), performance pass, SEO and share cards.

## 9. The rebrand — done, on the record

The site was originally built on forest green, cream and gold around an
invented four-arc mark. The real PCI logo is **red, black and white**, so the
institutional design system was migrated to match it.

**Scope.** `css/pci.css` and the nine pages that link it — `index`, `about`,
`what-we-do`, `model`, `impact`, `partnerships`, `governance`, `updates`,
`contact`. The Faith in Motion campaign (`css/fim.css`, navy and Rotary gold)
and the three legacy pages on `css/pdm.css` are **separate design systems and
were deliberately left alone** — the campaign is Rotary co-branded and its
palette is correct as it stands.

**The new tokens**

| Token | Value | Role |
|---|---|---|
| `--red` | `#D81E26` | the accent — CTA and one hero moment only |
| `--red-2` | `#F04149` | red on black, where `--red` loses contrast |
| `--red-deep` | `#A8161D` | rules and notices |
| `--ink-900` | `#0F0F0F` | black — darkest canvas |
| `--ink-800` | `#1C1A18` | second dark surface |
| `--ink-700` | `#2E2A26` | figures and links on light |
| `--stone-600` | `#5A544E` | eyebrows and small labels on light |
| `--stone-2` | `#B8B1AA` | body text on dark |
| `--stone-3` | `#8A837C` | low emphasis on dark |
| `--sand` | `#F2EEEA` | warm section fill · light text on dark |
| `--paper` | `#FAF8F6` | page ground — warm off-white |

Classes renamed with them: `btn-gold`→`btn-red`, `btn-cream`→`btn-sand`,
`on-cream`→`on-sand`, `on-forest`→`on-ink`.

**Red discipline enforced in the CSS itself.** Red was deliberately *removed*
from every element that repeats within a viewport — the pillar numerals, card
numerals, the nine ICIADM step numbers, definition-list markers, the four hero
statistics and the figure blocks on dark. Those went to stone or off-white. The
nine-step top-border ramp became tonal rather than four-colour. Red now survives
only on the CTA, the active nav underline, the pull-quote rule, the notice rule
and focus states. That is what keeps it a scalpel.

**Verified:** all nine pages measured at 390px, 768px and 1440px —
`scrollWidth == clientWidth`, no horizontal overflow. Every `var()` token
resolves. Contrast checked: body `--ink-60` on `--paper` ≈ 4.9:1,
`--stone-2` on `--ink-900` ≈ 9:1, `--red` on `--paper` ≈ 4.75:1, white on
`--red` ≈ 5.2:1.

**Still outstanding:** the real logo file. `assets/brand/pci-mark.svg` currently
holds a **placeholder** recoloured to red and stone so the site stays coherent —
it is not the approved mark and must be replaced. When the real artwork lands it
also needs a **knockout/light variant**, because the header and footer sit on
black and the logo's figure is black.

---

*Live site: https://cartelug.github.io/pdm/ · deployed from `main` via GitHub Pages.*
