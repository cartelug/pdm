# PHOTO SHOT LIST — FAITH IN MOTION

The site is complete and shippable right now with hand-drawn artwork in every image position. Each photograph you add replaces one illustration and makes the page measurably more persuasive. **Nothing breaks if a photo is missing or slow to arrive.**

---

## How to add a photo

1. Make a folder called `assets` next to `faith-in-motion.html`.
2. Put your photo in it, e.g. `assets/st-joseph-today.jpg`.
3. Open the campaign page (e.g. `walk.html` or `church.html`), find the **window.FIM_ASSETS** line near the bottom of each campaign page and fill in the filename:

```js
window.FIM_ASSETS = {
  walker : "assets/walker-on-road.jpg",
  church : "assets/st-joseph-today.jpg",
  road   : "",
  parish : "",
  build  : ""
};
```

That is the whole process. A filled-in slot shows the photo; an empty one keeps the illustration. Photos load lazily, and if a file is missing or fails, the artwork stays rather than leaving a broken image.

**Specs for every photo:** landscape orientation, at least 1600 px wide, saved as JPG under about 400 KB. Compress at [squoosh.app](https://squoosh.app) if a file is larger.

---

## The five shots, in order of value

### 1 · `church` — St Joseph Rwembyo as it stands today
**The single most important photograph on the site.** 4:3 landscape.

Shoot the whole building from the front corner so both the face and one side are visible — that reads as three-dimensional and honest, where a flat front-on shot reads like a poster. Best light is early morning or the hour before sunset; midday sun flattens everything and blows out the roof.

Do **not** tidy it up or shoot around the unfinished parts. The unfinished state *is* the argument. A viewer needs to see exactly what their money finishes.

### 2 · `walker` — the Walking Rotarian on the road
3:2 landscape. Taken from in front and slightly low, with road running out of frame behind him and the hills beyond. Mid-stride, not posed. Early morning haze is ideal.

If you have flag-off coverage or route photos already, one of those will almost certainly work.

### 3 · `build` — construction progress
16:9 landscape. Close enough to read the actual work — blockwork, roof timbers, whatever stage it is at. This is the proof-of-work image that answers "where does the money go", so favour clarity over beauty.

### 4 · `parish` — the community
16:9 landscape. People outside the church after Mass, or gathered at the site. Faces, not backs of heads. **Ask permission before photographing anyone**, and do not publish identifiable pictures of children.

### 5 · `road` — the road ahead
4:3 landscape. A stretch of the actual route with no one in it — murram, hills, distance. It carries the emotional weight of "how far is left".

---

## A note on stock photography

Do not use stock images of a different church or a generic African landscape. On a page asking for money to complete **this** building, a photograph of another one is a misrepresentation — and it breaks the campaign's own rule that nothing unverified goes public.

If a real photo is not available yet, leave the slot empty. The illustration is honest: it clearly reads as a drawing and claims nothing false. An empty slot costs you far less than a photo that turns out to be somewhere else.

## Permissions

Get the photographer's agreement to use each image before it goes on the site, and the subject's agreement for any recognisable person. Keep a short note of who took what — it costs nothing now and settles any question later.
