/* FAITH IN MOTION — JOURNEY CONTENT
   This is the single editorial file for the homepage journey collection.

   To add an update:
   1. Copy a web-ready image into assets/faith-in-motion/.
   2. Add one object below.
   3. Keep alt text factual and describe what is visible.

   Do not invent a date, distance or location. Leave a field blank when it
   has not been confirmed. The first item is displayed as the lead story. */
var fimAssetBase = new URL("../assets/", document.currentScript && document.currentScript.src ? document.currentScript.src : window.location.href).href;
window.FIM_UPDATES = [
  {
    label: "Campaign milestone",
    title: "More than half the distance covered.",
    detail: "The journey continues toward Rwembyo, carrying the appeal to complete St Joseph Rwembyo Catholic Church.",
    meta: "345 km journey · Faith in Motion",
    image: fimAssetBase + "faith-in-motion/faith-in-motion-345km-poster.jpg",
    alt: "Faith in Motion campaign poster announcing that more than half of the 345 kilometre journey has been covered."
  },
  {
    label: "Kasese",
    title: "The road reaches Kasese.",
    detail: "A recorded milestone from the route, with the Walking Rotarian marking the Kasese stage of the journey.",
    meta: "Route record · Kasese",
    image: fimAssetBase + "faith-in-motion/kasese-milestone-345km.jpg",
    alt: "The Walking Rotarian smiling and raising his fist beneath a Kasese road sign."
  },
  {
    label: "Day 8",
    title: "Mpara to Biguli.",
    detail: "A 26.49 kilometre day recorded on the Faith in Motion trek.",
    meta: "26.49 km · Mpara–Biguli",
    image: fimAssetBase + "faith-in-motion/mpara-biguli-day-8.jpg",
    alt: "The Walking Rotarian resting outdoors beside an activity record showing 26.49 kilometres."
  },
  {
    label: "From the road",
    title: "Crossing the river country.",
    detail: "A 35.69 kilometre route record beside flowing water and green riverbank vegetation.",
    meta: "35.69 km · Journey record",
    image: fimAssetBase + "faith-in-motion/walking-rotarian-riverside-35km.jpg",
    alt: "The Walking Rotarian standing beside a river with an activity record showing 35.69 kilometres."
  },
  {
    label: "Journey portrait",
    title: "Faith carried through every landscape.",
    detail: "A self-portrait from a bridge above a rocky riverbed along the route.",
    meta: "On the road · Western Uganda",
    image: fimAssetBase + "faith-in-motion/walking-rotarian-river-crossing.jpg",
    alt: "The Walking Rotarian smiling on a bridge above a wide rocky riverbed."
  },
  {
    label: "Evening record",
    title: "Walking into sunset.",
    detail: "An evening frame from the continuing journey toward Rwembyo.",
    meta: "Journey record · Faith in Motion",
    image: fimAssetBase + "faith-in-motion/walking-rotarian-sunset-video-frame.jpg",
    alt: "Video frame of the Walking Rotarian smiling on a road at sunset."
  }
];
