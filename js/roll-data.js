/* FAITH IN MOTION — ROLL OF HONOUR
   This one file drives every page: totals, the road, the ledger, step attribution.

   Format per row:
     ["Public label", amountUGX, steps, "paid|pledged|promised", "public note", "YYYY-MM-DD"]

   The 6th field (date received/pledged) is OPTIONAL and may be omitted.
   When present the Roll of Honour shows recency ("sponsored 2 days ago").
   Never invent a date — leave it out if it is not known.
   Public labels are anonymised; identifying names and notes stay off the site. */
window.ROLL_DATA = [
    ["Supporter 01",100000,100,"paid",""],
    ["Supporter 02",1000000,1000,"paid",""],
    ["Supporter 03",1000000,1000,"pledged",""],
    ["Supporter 04",100000,100,"pledged",""],
    ["Supporter 05",100000,100,"paid",""],
    ["Supporter 06",20000,20,"paid",""],
    ["Supporter 07",50000,50,"paid",""],
    ["Supporter 08",50000,50,"paid","Includes an in-kind item"],
    ["Supporter 09",100000,100,"promised","Not included in public progress"],
    ["Supporter 10",20000,20,"paid",""],
    ["Supporter 11",50000,50,"pledged",""],
    ["Supporter 12",50000,50,"paid",""],
    ["Supporter 13",50000,50,"paid",""],
    ["Supporter 14",50000,50,"paid",""],
    ["Supporter 15",100000,100,"paid",""],
    ["Supporter 16",100000,100,"paid",""],
    ["Supporter 17",100000,100,"pledged",""],
    ["Supporter 18",50000,50,"pledged",""],
    ["Supporter 19",100000,100,"pledged",""],
    ["Supporter 20",100000,100,"pledged",""],
    ["Supporter 21",100000,100,"pledged",""],
    ["Supporter 22",100000,100,"pledged",""],
    ["Supporter 23",100000,100,"pledged",""],
    ["Supporter 24",50000,50,"paid",""],
    ["Supporter 25",50000,50,"paid",""],
    ["Supporter 26",200000,100,"paid","Includes non-step support"],
    ["Supporter 27",500000,500,"pledged",""],
    ["Supporter 28",100000,100,"paid",""],
    ["Supporter 29",100000,100,"paid",""],
    ["Supporter 30",200000,200,"paid",""],
    ["Supporter 31",100000,100,"paid",""],
    ["Supporter 32",100000,100,"paid",""],
    ["Supporter 33",50000,50,"pledged",""]
  ];

/* ── ROUTE WAYPOINTS ───────────────────────────────────────────────
   Used to describe where a sponsor's steps sit on the road.
   [kilometre from flag-off, place name]

   THESE DISTANCES ARE APPROXIMATE and should be confirmed against the
   actual route log. They only affect the wording of a segment's
   location ("near Mityana"), never any published total. */
window.ROUTE_WAYPOINTS = [
  [0,   "Akright City, Bwebajja"],
  [12,  "Kampala"],
  [77,  "Mityana"],
  [150, "Mubende"],
  [200, "Kyegegwa"],
  [240, "Kyenjojo"],
  [294, "Fort Portal"],
  [345, "Rwembyo, Kisinga"]
];

/* ── WALK-DAY LIVE MODE ────────────────────────────────────────────
   Pre-built for 2 August 2026. Flip `active` to true on the day and the
   live band appears across the campaign pages. Update `km` and `note`
   as often as you like — nothing else needs touching.

   active : false = hidden entirely, true = live band shows
   km     : kilometres completed so far, of 345
   note   : one short line, e.g. "Climbing toward Fort Portal"
   updated: time the figure was last confirmed, e.g. "10:40" */
window.WALK_LIVE = {
  active : false,
  km     : 0,
  note   : "",
  updated: ""
};
