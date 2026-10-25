/* Walk for Education — canonical campaign record.
   Keep all public campaign facts, statuses and contribution controls here.
   Null means "not yet verified for publication" and must never be replaced
   with a guessed value. */
(function () {
  "use strict";

  window.WFE_CAMPAIGN = Object.freeze({
    campaignId: "walk-for-education-2026",
    slug: "walk-for-education",
    name: "Walk for Education Campaign 2026",
    /* Neeza confirmed the walk is underway, 25 October 2026. Dates, town and km remain unverified. */
    status: "walking",
    statusLabel: "Walk underway · sponsor education",
    shortDescription: "An education mobilisation journey connecting Nairobi to UCU–Kagando University College.",
    startLocation: "Nairobi, Kenya",
    endLocation: "UCU–Kagando University College",
    distanceKm: 1100,
    fiveYearTargetUgx: 25000000000,
    currentStudents: 802,
    projectedStudentsMin: 4000,
    projectedStudentsMax: 5000,
    projectionLabel: "Five-year planning projection",
    campaignStartDate: null,
    campaignEndDate: null,
    routeStatus: "High-level endpoints confirmed in the campaign source; detailed stages pending approval.",
    /* Verified stages only: { name, country, km, date: "YYYY-MM-DD", reached: bool } */
    routeStages: [],
    distanceCoveredKm: null,
    contributionUnitValue: 5000,
    minimumContributionSteps: 5,
    suggestedContributionSteps: 50,
    contributionUnitLabel: "step",
    contributionUnitCurrency: "UGX",
    /* Authorised channels only: { type: "mobile-money"|"bank", provider, number, accountName, branch?, currency?, referenceHint? } */
    paymentChannels: [],
    /* Direct channels supplied by the campaign team. These do not activate website checkout. */
    approvedDirectChannels: [
      {
        type: "mobile-money",
        provider: "Kenya · M-PESA Paybill",
        number: "400200",
        accountName: "Parenting with Purpose",
        currency: "KES",
        referenceHint: "Account number 1104672 (both are required to pay)",
      },
      {
        type: "mobile-money",
        provider: "Uganda · MTN MoMo Merchant",
        number: "588461",
        accountName: "Support South Rwenzori Diocese Projects",
        currency: "UGX",
        referenceHint: "Confirm the name at payment",
      },
      {
        type: "bank",
        provider: "Equity Bank · UGX account",
        number: "1001201151098",
        accountName: "South Rwenzori Development Projects",
        currency: "UGX",
        referenceHint: "SWIFT / BIC EQBLUGKAXXX",
      },
      {
        type: "bank",
        provider: "Equity Bank · USD account",
        number: "1001201151100",
        accountName: "South Rwenzori Development Projects",
        currency: "USD",
        referenceHint: "SWIFT / BIC EQBLUGKAXXX",
      },
      {
        type: "bank",
        provider: "Equity Bank · EUR account",
        number: "1001201151102",
        accountName: "South Rwenzori Development Projects",
        currency: "EUR",
        referenceHint: "SWIFT / BIC EQBLUGKAXXX",
      },
    ],
    paymentVerificationNote:
      "Confirm account ownership and payment instructions with PCI campaign finance before paying. Campaign collections may be held by named partner organisations.",
    receivedTotal: null,
    pledgedTotal: null,
    lastReconciledAt: null,
    publicReportingState: "Reporting begins after the authorised reconciliation process is active.",
    coordinator: {
      name: "Pamodzi Community Initiative Uganda",
      role: "Lead Campaign Convener / Overall Coordinator",
    },
    partners: [
      {
        name: "Diocese of South Rwenzori",
        role: "Institutional Partner",
      },
    ],
    /* Written confirmation of participation AND public acknowledgement required. */
    confirmedPartners: [],
    /* Cleared field notes, newest first: { date, location?, stage?, title, body, source?, image?, imageAlt? } */
    updates: [],
    /* Mission briefings are editorial campaign content, not reports of completed walk stages. */
    campaignBriefings: [
      {
        date: "2026-10-11",
        stage: "Campaign briefing",
        title: "One mission, from the first classroom to university.",
        excerpt:
          "Support UCU–Kagando University College and Kagando Nursery & Primary School through a shared five-year education mission.",
        body: "Walk for Education brings people together around two linked priorities: UCU–Kagando University College and Kagando Nursery & Primary School. The campaign supports learning spaces, student accommodation, library and ICT facilities, staff and campus infrastructure, and university expansion.\n\nUGX 25 billion is the campaign's five-year mobilisation goal. It is a target, not a statement of funds received. The start date, final dates and detailed walking stages will be published after confirmation.",
        image: "assets/wfe-2026/official-kit/scene-19-desktop-master.webp",
        imageAlt: "Campaign illustration of fictional students learning near the actual UCU–Kagando main block",
        source: "Supplied campaign strategy and confirmed project decisions; artwork is illustrative.",
      },
      {
        date: "2026-10-11",
        stage: "Campaign briefing",
        title: "Five steps. Five friends. A wider circle.",
        excerpt:
          "Pledge five symbolic steps, invite five friends, and ask each friend to bring five more into the education movement.",
        body: "Start with five symbolic steps. In Uganda, five steps represent UGX 25,000; in Kenya, five steps represent KES 1,000. Invite five friends to the campaign, and encourage each of them to invite five more. Participation remains voluntary.\n\nThe website records pledges: an intention to support, with no money collected. After a pledge is successfully recorded, supporters are offered an optional invitation to the campaign WhatsApp group.",
        image: "assets/wfe-2026/official-kit/scene-11-desktop-master.webp",
        imageAlt: "Campaign illustration of Shyaka in his official black kit walking with fictional community members",
        source: "Campaign snowball invitation approach and confirmed pledge-first website decision.",
      },
      {
        date: "2026-10-11",
        stage: "Campaign briefing",
        title: "A pledge is a beginning. It is not a payment.",
        excerpt:
          "Record your steps online. Use only the official direct channels if you choose to contribute separately.",
        body: "Online pledges and money received are separate records. The website is currently for pledges and does not collect money online. International card checkout will open after payment service approval and verification. Until then, supporters may use the approved direct channels.\n\nThe approved direct channels are Kenya M-PESA Paybill 400200, account 1104672, with the recipient Parenting with Purpose; and Uganda MTN merchant 588461, with the recipient Support South Rwenzori Projects. Confirm the recipient before sending and keep the provider transaction reference. Direct contributions are not automatically verified by the website.",
        source: "Approved contribution details supplied by the campaign team; current website payment configuration.",
      },
    ],
    capitalPriorities: [
      "Student hostels",
      "Lecture rooms, library & ICT",
      "Faculty, staff & campus infrastructure",
      "Kagando Nursery & Primary School",
      "University expansion",
    ],
    contact: {
      email: "pci.uganda@gmail.com",
      whatsappDisplay: "+256 772 150 281",
      whatsappUrl: "https://wa.me/256772150281",
    },
    social: {
      tiktok: "https://www.tiktok.com/@pamodzici",
      x: "https://x.com/pamodzici",
      instagram: "https://www.instagram.com/pamodzici/",
    },
    dataLastReviewed: "2026-10-11",
  });
})();
