# Walk for Education — campaign experience revision

6 October 2026. The latest revision follows the new campaign artwork and the user’s explicit five-step minimum. The objective is a clearer contribution journey across
the campaign overview, participation, partnerships, accountability, updates and
contribution form.

## Sources reread

The full eight-file campaign update pack, the five-page Agri Evolve sponsorship
proposal, both visual Rotary invitations and the condensed sponsorship artwork
were reread. The five-page PCI Payments, Collections and Social Launch Plan v3
was reviewed alongside the existing payment implementation. The three-page
PCI Website Adjustment Plan for Pesapal, dated 4 October, was also checked
against the final page, contribution and reporting flows.

The plan retains Pesapal as the launch gateway, organisation-owned settlement,
verified transactions and separate finance reconciliation. The existing private
ledger, certificates and Faith in Motion records are preserved.

## Decisions that shape the rebuild

1. Explain education before the walk. The first screen names both education
   beneficiaries and shows the symbolic step price. The Walking Rotarian portrait leads the story alongside the contribution selector. The campus image is enhanced from the supplied photograph with an original-photo link; existing generated artwork remains labelled illustration.
2. Give each supporter a useful route. Individuals choose steps. Rotary clubs
   open the club participation panel. Businesses discuss resources and capital
   priorities, with priority links prefilling the request.
3. Apply one design across all five campaign pages. Navy blue, warm gold, white and PCI red follow the new campaign artwork. The existing main-site PCI logo is used in every campaign header and footer. Shared navigation, typography, partner roles and coordinator contacts
   make the supporting pages part of the same experience.
4. Show the amount before asking for details. The calculator supports 5–20,000
   whole steps at UGX 5,000 each, displays 100 / 50 / 20 / 10 / 5 in descending order, suggests 50 steps, carries the selection into the form and
   remembers the valid selection within the browser session.
5. Explain payment availability early. Service status sets the hero notice,
   calculator action and accountability notice. A pledge collects no money.
   Sandbox checkout is explicitly labelled test-only.
6. Keep recognition clear. Receipts and personalised certificates unlock only
   after verified successful live payment. Public received figures require
   separate finance reconciliation. Digital step collections do not imply that
   all institutional sponsorship or in-kind value is included.
7. Make documents useful. Partnership requests go to the coordinator named in
   the supplied documents, with the chosen route and education priority in the
   prepared email. Private KYC and banking documents are not published.
8. Keep the page maintainable. The shared campaign record supplies facts,
   approved field notes and confirmed partner acknowledgements. The payment
   service supplies current availability and reconciled digital collections.
9. Design for phones first. Large controls, readable single-column forms,
   collapsible navigation, keyboard-operated participation tabs, reduced-motion
   support and contribution shortcuts that hide beside active forms.

## New artwork and easier contribution flow

- Source: `WhatsApp Image 2026-10-05 at 16.29.53.jpeg`, supplied with this revision.
- A transparent enhanced portrait of the Walking Rotarian and an enhanced campus image are provided as responsive WebP assets. Their origins are labelled; the original campus photo remains accessible.
- The selector is on the first screen. Higher contributions appear first, with a clearly stated five-step minimum. A custom amount is always available.
- Visitors arriving with selected steps see their amount and can proceed to contact details. “Change amount” reopens the amount controls.
- Both pledge and payment creation enforce at least five steps on the server. Existing records and certificate eligibility remain intact. Legacy one-step entry links show five steps and UGX 25,000 before submission.
- Builder + Steps partnerships reproduce the supplied levels: Platinum UGX 100M, Gold UGX 80M, Diamond UGX 60M, Silver UGX 40M and Bronze UGX 20M, plus steps to be agreed with the campaign team. The selected level appears in the reviewable enquiry draft. These are partnership discussions, not immediate payment promises.

## Facts and constraints

- Approximate journey: 1,100 km, Nairobi to UCU–Kagando, Kasese, Uganda.
- UGX 25 billion is the five-year mobilisation goal, not money received.
- The source proposal's 802 students and 4,000–5,000 five-year planning
  projection are labelled as such.
- PCI Uganda coordinates; Rotary Club of Akright City is the lead Rotary
  partner; Diocese of South Rwenzori is the institutional partner.
- Agri Evolve remains invited unless separately confirmed. Payment-channel
  brands are not campaign sponsors.
- The source invitations contain different date ranges. Detailed stages and
  dates remain unpublished until the campaign team confirms them.
- Public campaign contact follows the supplied proposal and invitations:
  Rtn. CP Joshua Ainabyona, pci.uganda@gmail.com, +256 772 150 281.

## Validation and launch

Completed: 56 ledger checks, 49 HTTP/API checks and 89 browser checks (194 total).
All five campaign pages and the contribution form were checked at phone,
tablet and desktop sizes, including 320, 390, 768 and 1440px. The checks
exercise calculator bounds, selected amounts, referral continuity, navigation,
tab keyboard controls, enquiry validation, approved-update rendering, pledge
recording and pending-to-success certificate download fixtures. No live
payment or enquiry message was sent.

Future edits should check all five pages and the contribution form at those sizes;
exercise calculator bounds, selected amounts, referral continuity, navigation,
tab keyboard controls, enquiry validation and approved-update rendering.
Retain payment regression checks for pledges, pending/successful results,
private certificate access, duplicate callbacks and refunds.

Publish through the existing GitHub-to-cPanel deployment and inspect the live
campaign and contribution routes. Payment activation still follows
PESAPAL-HANDOVER.md: merchant approval, securely supplied credentials, IPN,
approved policies and a finance-confirmed controlled live transaction and
settlement. This design revision does not claim those external steps are done.
