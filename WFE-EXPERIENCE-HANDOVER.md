# Walk for Education experience - 6 October 2026

The latest 6 October revision uses navy blue, gold, white and PCI red, with the
main website’s existing PCI logo throughout the campaign. The user’s new
campaign poster supplies the Walking Rotarian portrait and Builder + Steps
partnership levels. The portrait and campus photo are enhanced for display and
served in responsive WebP sizes. The original campus photograph remains linked.

The campaign begins with the education purpose and a contribution selector.
Options appear in descending order: 100, 50, 20, 10 and 5 steps, plus custom.
The suggested amount is 50 steps / UGX 250,000. Minimum: 5 steps / UGX 25,000.
The campaign, checkout and server enforce the same bounds. Existing records and
paid certificate eligibility are preserved. Legacy one-step entry links display
the minimum amount before any submission.

The contribution form uses a compact selected-amount summary and opens directly
to details when steps have already been chosen. “Change amount” reopens the
controls. Closed online payment remains disabled and pledge mode is selected.

Participation opens the appropriate individual, Rotary or organisation panel.
Partnership links can preselect an education priority; prepared enquiry emails
include that priority, the chosen resource route and any selected Builder level. Enquiries are drafts, not
automatic messages or payment records. Coordinator contact follows the supplied
proposal and invitations: Rtn. CP Joshua Ainabyona, pci.uganda@gmail.com and
+256 772 150 281. The five-page PCI Payments, Collections and Social Launch
Plan v3 was also reread for the payment and reporting requirements.

All campaign pages now use the shared campaign record for facts, approved
updates and confirmed partner acknowledgements. The payment service supplies
checkout availability and reconciled digital totals. A valid step selection is
remembered in the browser session and carried into the contribution form.
The sticky shortcut hides beside active forms and becomes inert when hidden.

See WFE-REDESIGN-PLAN.md for the redesign decisions and source constraints.

The campaign page is rebuilt around choosing sponsored steps at UGX 5,000 each.
The same selection carries to the contribution form, with the server checking
that the submitted amount matches the whole step count. Checkout availability
comes from the payment service; when it is closed, the page offers a pledge.

The responsive design includes labelled campaign illustrations,
responsive WebP sizes, a real campus photograph, partner artwork, a step
calculator, education priorities, a certificate preview, partnership links,
accessible FAQs, campaign sharing and a persistent contribution shortcut.
Scroll reveals and entrance animations respect reduced-motion preferences.
No date countdown, unverified donation total or fabricated testimonial is used.

## Source assets and publication decisions

- The uploaded `Pamodzi_Walk_for_Education_Update_Plan(1).zip` contains the
  invitation and sponsorship materials used to confirm the campaign purpose,
  five-year UGX 25 billion target, approximately 1,100 km journey, current
  proposal figure of 802 students and projected 4,000–5,000 students.
- The uploaded Agri Evolve sponsorship proposal supplies the actual UCU-Kagando
  campus image, Rotary Club of Akright City artwork and diocesan crest.
- PCI is the campaign convenor, Rotary Club of Akright City the lead Rotary
  partner, and Diocese of South Rwenzori the institutional partner. The source
  proposal describes Agri Evolve as invited; it is not presented as confirmed.
- Banks and mobile-money operators appearing as payment channels in posters
  are not promoted as campaign sponsors.
- Generated images are visibly labelled as campaign illustrations. Their
  people and scenes are not presented as documentary campaign photographs.
- Source dates conflict, so detailed stages and dates await confirmation.
- The new poster supplies Builder + Steps levels: Platinum UGX 100M, Gold
  UGX 80M, Diamond UGX 60M, Silver UGX 40M and Bronze UGX 20M. Additional
  steps, terms and recognition are discussed with the campaign team.
- See WFE-IMAGE-ASSETS.md for source and enhancement prompts.

## Verified contribution certificates

The certificate is a downloadable landscape PDF with the supporter's name,
verified contribution amount, step count, issue date, private payment reference
and unique certificate number. Public verification shows no supporter identity.
Fonts use searchable WinAnsi text; characters outside that encoding are
transliterated. Long names are wrapped and fitted without discarding lines.

Certificate issuance requires a verified successful live payment with a tracking
ID, receipt and matching step-price snapshot. Repeated callbacks cannot issue a
second certificate. Refunded certificates become inactive. Downloading requires
the private viewer token and CSRF session, and failed verification is remembered
through the refresh throttle. Pending result pages poll automatically for five
minutes and stop on success. Automatic email delivery is not configured.

## Verification and remaining launch dependency

The final suite passed 56 ledger, 49 HTTP/API and 89 browser checks (194 total).
Local ledger and HTTP checks exercise exact step pricing, duplicate callbacks,
refunds, certificate eligibility, private download authorization, public
verification privacy and delayed-provider handling. Browser checks cover
320–1440px layouts, menu behavior, reduced motion, selected steps, pledge
submission and a mocked pending-to-success certificate download. The PDF is
reopened and visually checked. These fixtures send no payments to Pesapal.

The existing cPanel deployment and private ledger are retained. Approved Pesapal
credentials, live IPN registration and the existing launch gates are still
required before real online payments open. Follow `PESAPAL-HANDOVER.md` for those
steps and finance settlement checks.
