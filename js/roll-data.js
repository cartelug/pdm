/* FAITH IN MOTION — ROLL OF HONOUR (fallback copy)
   Contributions added through the admin console (/admin/, Pledges tab) now
   publish live via api/roll.php and appear on every campaign page within
   seconds — no edit to this file is needed for that. This file is the
   fallback shown only if a page can't reach that live endpoint, and the
   seed api/data/roll-seed.json bootstraps the live register the first time
   it runs. Update it occasionally from the admin console's Publish tab so
   the fallback doesn't drift too far from reality, but it is optional.

   Format per row:
     ["Public label", amountUGX, steps, "paid|pledged|promised", "public note", "YYYY-MM-DD"]

   The 6th field (date received/pledged) is OPTIONAL and may be omitted.
   When present the Roll of Honour shows recency ("sponsored 2 days ago").
   Never invent a date — leave it out if it is not known.
   Public labels below are the contributor labels supplied for publication by
   the campaign team. Do not add phone numbers or private payment details. */
window.ROLL_DATA = [
    ["Modest R",100000,100,"paid",""],
    ["Joshua n Sylvia",1000000,1000,"paid",""],
    ["MD Rtn Nuwabine Josephat",1000000,1000,"paid",""],
    ["Dr. Monica Etima",100000,100,"pledged",""],
    ["Mr Garakumbe",100000,100,"paid",""],
    ["Mugabe Charles",20000,20,"paid",""],
    ["Dr Habomugisha",50000,50,"paid",""],
    ["Rtn Smart",50000,50,"paid","Includes piano support"],
    ["Dr MD Kanyesigye",100000,100,"promised","Promised to add"],
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
    ["Jimmy Baluku Odyek",50000,50,"paid",""],
    ["Bwambale Michael",50000,50,"paid",""],
    ["President Anne Nsubuga",200000,100,"paid","Includes UGX 100,000 for Shyaka water on the road"],
    ["Joshua and Rosette Kainja",500000,500,"pledged",""],
    ["Maria Claire",100000,100,"paid",""],
    ["Lady Florence Kesiime Mugisha",100000,100,"paid",""],
    ["Lady Olivia Hasahya",200000,200,"paid",""],
    ["Caroline Alice Laker Onekalit",100000,100,"paid",""],
    ["Rtn Isaac Katewanga",100000,100,"paid",""],
    ["Rtn Allan Kiwumulo",50000,50,"pledged",""],
    ["Frederixk Kalwanyi",10000,10,"paid","Thanksgiving"],
    ["Shyaka fan",100000,100,"paid",""],
    ["Rtn Suzan Kiwumulo",100000,100,"paid",""],
    ["President Anne",50000,50,"paid","For Shyaka"],
    ["Alele Ronald",50000,50,"paid",""],
    ["Shyaka Namilyango Old Boys 1990-96",510000,510,"paid",""],
    ["Lawrence Sentongo Shyaka NGO BUS",50000,50,"paid",""],
    ["Rotarian Betty Foni Shyaka fan",150000,150,"paid",""],
    ["Rtn Olive Kigenyi",100000,100,"paid",""],
    ["Rtn Tayebwa Geoffrey",100000,100,"paid",""],
    ["Nelson Katusabe",40000,40,"paid",""],
    ["Rev Mercy Kabugho",10000,10,"paid",""],
    ["Ntege Christopher Shyaka NGO BUS",80000,80,"paid",""],
    ["Mrs Susan Asasira Ntobotobo Karuhanga",100000,100,"paid",""],
    ["Uncle John Matte",50000,50,"paid",""],
    ["Bro Dan Baguma",100000,100,"pledged",""],
    ["Olivia Biira",30000,30,"paid",""],
    ["Shyaka fan",40000,40,"paid",""],
    ["Besnus Baghenda",10000,10,"paid",""],
    ["Mark Turyahumura",20000,20,"paid",""],
    ["Matiya Mugisa",50000,50,"pledged",""],
    ["Rtn Dr Kerchan Patrick",100000,100,"paid",""],
    ["Rtn IP Scovia Biira",100000,100,"paid",""],
    ["Musungu George",25000,25,"paid",""],
    ["Sis Daphine",5000,5,"paid",""],
    ["Dr Musondolya",25000,25,"paid",""],
    ["President Scovia",100000,100,"paid",""],
    ["Stephen Muhindo",10000,10,"paid",""],
    ["Emmanuel Rutebuka",25000,25,"paid",""],
    ["John Bwambale",20000,20,"paid",""],
    ["Geoffrey Muhindo and Doctor",210000,210,"paid",""],
    ["Robert and Verina Kadolo",50000,50,"paid","Paid directly to the church treasury"],
    ["Musawo Marion Mbambu and friends",160000,160,"paid",""],
    ["Kasenya Thembo and Anna",100000,100,"pledged",""],
    ["Stella Bakeera",50000,50,"paid",""],
    ["St Padri Pio Catechist Franciska",100000,100,"paid",""],
    ["Jaja Wilfred Kule",10000,10,"paid",""],
    ["Bil Josephine Onekalit",100000,100,"paid",""],
    ["Isabella at Juba and Nairobi",149000,149,"paid",""]
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
