# MASTER BUILD PROMPT — FAITH IN MOTION DIGITAL SYSTEM

> **How to use this.** Paste this entire file as the first message of a new Claude Cowork task (or Claude Code session) with agentic tools enabled. It briefs the agent completely, tells it what to ask you for once at the start, and then has it build and finish the whole system without further prompting. Everything from `## AGENT BRIEF` down is written **to the agent**, not to you.

---

## AGENT BRIEF

You are the delivery lead and full-stack builder for a live fundraising campaign. You have a complete brief below. **Do not ask clarifying questions about scope, design, or content — it is all specified here.** Ask only for the connectors and the four facts listed in STEP 0, then build everything to completion.

Work autonomously. Produce finished, deployable files — never drafts, outlines, or "here's how you would do it." When a decision is genuinely ambiguous, pick the option that best serves a donor on a phone in Uganda on a slow connection, note the choice in one line, and keep moving.

---

### THE SITUATION

A man is walking **345 km on foot from Kampala to Kasese**, arriving **Sunday 2 August 2026**, to fund the completion of **St Joseph Rwembyo Catholic Church** (Kiburara, Kisinga, Kasese District, Uganda). He is publicly known as **the Walking Rotarian**. The walk is 466,200 steps, and each step is sponsorable at **UGX 1,000**.

**The deadline is the walk itself.** The system exists to convert the attention of walk day into verified contributions. Anything not live by 2 August has largely missed its purpose. Prioritise ruthlessly against that date.

**Client:** Pamodzi for Development. **Signatory:** Sylvia. **Construction collections contact:** Sylvia Kaawe, Chair of the Construction Committee, Mobile Money **0772 495 733**.
**Builder:** Neeza Amani Shyaka, Founder — THE 97 / 97 Design, Akright City, Bwebajja, Wakiso, Uganda. shyakaneeza@gmail.com · +256 708 735 878.
**Engagement:** USD 1,000 fixed, three phases (40/30/30), 60-day delivery with 60 days of support.

**Church completion goal:** UGX 410,000,000.
**Campaign ledger at the latest repository reconciliation:** UGX 2,590,000 received (2,490 funded steps), UGX 2,350,000 pledged separately, and UGX 4,940,000 total committed across 32 received-or-pledged entries. One additional promise is excluded from funded progress.

---

### GOVERNANCE — TREAT AS ABSOLUTE

These are non-negotiable and must be visible in the product itself, not just in a document:

1. **THE 97 never receives or holds campaign donations.** All money goes directly to the church's or Pamodzi's formally authorised account.
2. **Only reconciled figures are published.** No live-looking total may be shown unless it has been confirmed by the designated finance verifier.
3. **No guaranteed fundraising outcomes** anywhere in any copy.
4. **Nothing sensitive goes public without approval** — money figures, beneficiary details, and named individuals pass through the content approver first.
5. **Anti-fraud notice on every giving surface**, naming the official payment channel so impersonators are easy to spot.

---

## STEP 0 — ASK FOR THESE, THEN STOP

Before building, ask the user for the items below **in a single message**, formatted as a checklist. Then wait.

**Connectors to enable** (say plainly what each unlocks, and that you can proceed without any of them using local files):

| Connector | What you'll do with it |
|---|---|
| **Google Drive** | Store the built site, brand assets, photos, and hand over a shared campaign folder |
| **Google Sheets** | Live contributions ledger — the finance verifier edits a sheet, the site reads reconciled totals |
| **Gmail** | Send the donor-thank-you sequence and the weekly reconciliation report to the committee |
| **Google Calendar** | Schedule the 60-day publishing rhythm and weekly reporting checkpoints |
| **Canva** | Produce the 24 campaign content assets against the brand system |
| **Notion** | Project workspace: delivery tracker, content calendar, approval log |

**Four facts you cannot invent — ask for them explicitly:**

1. **Confirmed goal figure.** The roll's step maths implies UGX 466.2M; the church states UGX 410M. Which is the published number? *(These must not disagree anywhere.)*
2. **Authorised beneficiary account.** The published giving channel — bank and/or Mobile Money, with account name. Is 0772 495 733 (Sylvia Kaawe) the official public channel, or is there a formal church account?
3. **Two named people** — one content approver, one finance verifier.
4. **Domain name** for the campaign site.

**Anything you may also use if offered:** logos (Rotary, church, Pamodzi, THE 97), photographs of the walk / church / construction, the approved construction budget or BoQ.

**If the user gives you nothing:** proceed anyway. Build with `[TO CONFIRM]` markers on exactly those four facts, keep every other part complete, and list the markers at handover. Never let a missing fact block the build.

---

## WHAT TO BUILD — SIX WORKSTREAMS

Build in this order. Each must be **finished and verified** before the next.

### 01 · Campaign site — `faith-in-motion.html`
Single self-contained HTML file, no build step, deployable to any static host.

- **Design system:** Rotary royal blue `#0F3D8C`, deep navy `#0B1E3E`, Rotary gold `#F4A81D`, murram clay `#B5462F`, warm paper `#FBF9F4`. Display face **Bricolage Grotesque**, body **Instrument Sans**. Do not use a cream-and-serif or dark-mode-neon look.
- **Signature element:** an SVG **road from Kampala to Rwembyo** where sponsored steps draw a gold line forward and move a walker marker along it. The unfunded road ahead is the emotional appeal — do not hide how far is left.
- **Sections:** hero with live counters → route → sponsor engine → the walk → the church → Roll of Honour → trust → share → footer.
- **Sponsor engine:** step tiers (20/50/100/500) plus a custom field; live UGX total; "carries him *X* metres" feedback; copy-the-MoMo-number button; one-tap WhatsApp pledge with a pre-filled message.
- **Deep links:** `?steps=100` preselects that amount and scrolls to the sponsor section; `?ref=name` tags the referrer into the pledge message.
- **Data:** all sponsors live in a single editable `ROLL` array. Every total, the road fill, and the honour list derive from it — never hard-code a total anywhere.
- **Quality floor:** mobile-first, works on a slow connection, visible keyboard focus, `prefers-reduced-motion` respected, semantic headings, meta description, Open Graph tags for WhatsApp previews.

### 02 · Collections console — `collections-console.html`
The operations tool for whoever manages the money. Three tabs:

- **Pledges** — add/edit/remove contributors, click a status to cycle paid → pledged → promised, live totals, search.
- **Links & QR** — generate per-tier sponsor links and QR codes from the live domain, plus optional ambassador `?ref=` tags, plus ready-to-send WhatsApp/letter message templates.
- **Publish** — emit the updated `ROLL` code block for pasting into the site, CSV export for the finance record, JSON backup/restore, and an auto-written weekly reconciliation report.

Steps auto-calculate from UGX amount. If a Google Sheet connector was provided, wire the ledger to it and treat the sheet as the source of truth; otherwise use the JSON backup/restore model.

### 03 · Giving made effortless — the link layer
The heart of the engagement. **A donor must be able to go from seeing a message to having paid in under two minutes, on a phone, without an app.**

- One short link per tier, ready to paste anywhere.
- QR codes at print resolution for banners, T-shirts, order-of-service sheets, and every walk-day photo caption.
- WhatsApp deep links with the pledge message pre-written.
- A single canonical short link for bios and posters.
- Every giving surface shows the official channel and an anti-fraud line.

### 04 · Social foundation — `social-kit/`
Profile and cover copy for Facebook, Instagram and YouTube; bio text with the canonical link; pinned-post copy; 12 caption templates covering the countdown, the route, milestones, thank-yous, and proof of work; a moderation and saved-reply guide; the posting rhythm from now through 60 days.

### 05 · Content system — `content-plan/`
A 60-day publishing calendar anchored on 2 August, plus specs for 24 assets (12 graphics, 8 vertical videos, 4 milestone/progress cards) — each with its purpose, copy, and call to action. If Canva is connected, produce the assets there; otherwise deliver production-ready specs and SVG/HTML templates that render on-brand.

### 06 · Pamodzi Gateway — `pamodzi-gateway.html`
The organisation's permanent front door: profile, project directory, three project profile pages (St Joseph's Church; the apartment opportunity; one open slot), and an inquiry form. The apartment module is an **expression of interest, never a public investment offer** — word it accordingly. New projects must slot in without a rebuild.

---

## HOW TO WRITE THE COPY

Write for a real person deciding whether to trust this with their money.

- Plain, warm, concrete. Short sentences. Sentence case.
- Specific over clever: "carries him 74 metres" beats "makes an impact."
- Active voice; a button says exactly what happens.
- Never guarantee outcomes. Never inflate. Never invent a figure, a name, a quote, or a testimonial — if you don't have it, mark it `[TO CONFIRM]`.
- The appeal is the distance still to go, not false urgency.

---

## VERIFY BEFORE YOU HAND OVER

Do this yourself and report results. Do not claim success without running the checks.

1. **Arithmetic** — every published total is computed from the source data, and paid + pledged = total. State the numbers.
2. **JavaScript** — syntax-check every file (`node --check`). Confirm every element the script references exists in the markup.
3. **Links** — every generated link resolves to the right deep-link state; every QR encodes the right URL.
4. **Consistency sweep** — one goal figure, one payment channel, one spelling of every name and place across all six workstreams. Report any contradiction you find instead of silently choosing.
5. **Mobile** — check at 360 px wide. Nothing overflows, tap targets are ≥44 px.
6. **Governance** — confirm items 1–5 of the governance rules are literally present in the shipped product.
7. **Screenshot** what you built if your environment allows, look at it, and fix what looks wrong.

---

## DELIVER

Write all files to the output directory and present them. Then give a handover of **at most one page**:

- What was built, and the verified numbers.
- The `[TO CONFIRM]` list — every fact still needed, and who must supply it.
- Deployment: exact steps to put the site on a domain (static host, no build step).
- How to update the roll each week, in four sentences a non-technical person can follow.
- The next three highest-leverage actions before 2 August, in order.

Do not narrate your process. Lead with what was built and what the checks returned.

---

## STANDING RULES

- Finish things. A half-built workstream is worth less than a smaller one completed.
- Never fabricate a number, name, quote, or endorsement.
- Prefer one self-contained file over a toolchain the client cannot maintain.
- The client is not a developer. Everything handed over must be editable by someone who is comfortable with a text editor and nothing more.
- If you find an error in this brief — including a contradiction in the figures — say so plainly and propose the fix rather than building on top of it.
