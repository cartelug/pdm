/* FAITH IN MOTION — ROLL OF HONOUR
   This one file drives every page: totals, the road, the ledger, step attribution.

   Format per row:
     ["Name", amountUGX, steps, "paid|pledged|promised", "note", "YYYY-MM-DD"]

   The 6th field (date received/pledged) is OPTIONAL and may be omitted.
   When present the Roll of Honour shows recency ("sponsored 2 days ago").
   Never invent a date — leave it out if it is not known. */
window.ROLL_DATA = [
    ["Modest R",100000,100,"paid",""],
    ["Joshua & Sylvia",1000000,1000,"paid",""],
    ["MD Rtn Nuwabine J",1000000,1000,"pledged",""],
    ["Dr Monica Etima",100000,100,"pledged",""],
    ["Mr Garakumbe",100000,100,"paid","more to be added"],
    ["Mugabe Charles",20000,20,"paid",""],
    ["Dr Habomugisha",50000,50,"paid",""],
    ["Rtn Smart",50000,50,"paid","+ Piano"],
    ["Dr MD Kanyesigye",100000,100,"promised","to add more"],
    ["Ms Fortunate",20000,20,"paid",""],
    ["Mubatsi J",50000,50,"pledged",""],
    ["Rtn Dr Rusoke",50000,50,"paid",""],
    ["Eng Rtn Darius",50000,50,"paid",""],
    ["Rtn HCP Paul",50000,50,"paid",""],
    ["Rtn Edith",100000,100,"paid",""],
    ["PAG Muhumuza",100000,100,"paid",""],
    ["Rtn Harriet",100000,100,"pledged",""],
    ["Rtn Simon Kagwa",50000,50,"pledged",""],
    ["Rtn Prof Kwesiga",100000,100,"pledged",""],
    ["Rtn Dr Kerchan",100000,100,"pledged",""],
    ["Rtn Budget",100000,100,"pledged",""],
    ["Rtn Justus",100000,100,"pledged",""],
    ["IP Anne",100000,100,"pledged",""],
    ["Jimmy Baluku Odyek",50000,50,"paid",""],
    ["Bwambale Michael",50000,50,"paid",""],
    ["President Anne Nsubuga",200000,100,"paid","+ 100k water for the road"],
    ["Joshua & Rosette Kainja",500000,500,"pledged",""],
    ["Maria Claire",100000,100,"paid",""],
    ["Lady Florence Kesiime Mugisha",100000,100,"paid",""],
    ["Lady Olivia Hasahya",200000,200,"paid",""],
    ["Caroline Alice Laker Onekalit",100000,100,"paid",""],
    ["Rtn Isaac Katewanga",100000,100,"paid",""],
    ["Rtn Allan Kiwumulo",50000,50,"pledged",""]
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
