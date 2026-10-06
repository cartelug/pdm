# Walk for Education experience - 6 October 2026

The 6 October revision rebuilds all five campaign pages and refines the
contribution entry page around one cream, forest-green and PCI-red identity.
The first screen names the university and neighbouring school, shows the step
price and leads with the real campus photograph from the supplied proposal.
Partner roles and supplied logos are prominent and consistent across pages.

Participation opens the appropriate individual, Rotary or organisation panel.
Partnership links can preselect an education priority; prepared enquiry emails
include that priority and the chosen resource route. Enquiries are drafts, not
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

The final suite passed 51 ledger, 46 HTTP/API and 75 browser checks (172 total).
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
