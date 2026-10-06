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
    status: "preparing",
    statusLabel: "Preparing launch",
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
    paymentVerificationNote:
      "Request the current approved contribution details and verify the beneficiary before sending funds.",
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
      {
        name: "Rotary Club of Akright City",
        role: "Lead Rotary Partner",
      },
    ],
    /* Written confirmation of participation AND public acknowledgement required. */
    confirmedPartners: [],
    /* Cleared field notes, newest first: { date, location?, stage?, title, body, source?, image?, imageAlt? } */
    updates: [],
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
    dataLastReviewed: "2026-10-06",
  });
})();
