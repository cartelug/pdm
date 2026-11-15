import { span } from "./policy";
import { type Motion, qs, qsa } from "./types";

// Scene 3, the road ahead (Beat 05). This module is the only owner of the route stroke.
//
// Local progress p runs from the stage entering the lower part of the screen to it reaching the upper part:
//   0    – 0.15  the faint complete track and both endpoints are already visible
//   0.15 – 0.75  the crimson line draws towards the destination and a small abstract dot travels with it
//   0.75         the destination ring gives one restrained emphasis (once per visit)
//   0.75 – 1     the complete illustration simply rests
// The dot shows reading progress through this illustration only. It is never the walker's position, it is
// hidden at both ends, and no intermediate place or arrival claim is drawn.
const SAMPLES = 120;

interface Art {
  svg: SVGSVGElement;
  line: SVGPathElement;
  marker: SVGCircleElement | null;
  points: Array<[number, number]>;
}

export function route({ ScrollTrigger, profile, cleanups }: Motion) {
  const stage = qs("[data-route]");
  const section = stage?.closest<HTMLElement>(".pci-route");
  if (!stage || !section) return;
  const arts: Art[] = qsa<SVGSVGElement>("[data-route-art]", stage).flatMap((svg) => {
    const line = svg.querySelector<SVGPathElement>("[data-route-line]");
    return line ? [{ svg, line, marker: svg.querySelector<SVGCircleElement>("[data-route-marker]"), points: [] }] : [];
  });
  if (!arts.length) return;

  // Geometry is measured when the layout is measured, never during scrolling. A hidden composition (the
  // other breakpoint's artwork) keeps an empty cache and is skipped until it becomes visible.
  const measure = () =>
    arts.forEach((art) => {
      art.points = [];
      if (!art.svg.getClientRects().length) return;
      const length = art.line.getTotalLength();
      for (let i = 0; i <= SAMPLES; i++) {
        const point = art.line.getPointAtLength((length * i) / SAMPLES);
        art.points.push([point.x, point.y]);
      }
    });

  let lastDraw = -1;
  let arrived = false;
  const paint = (p: number) => {
    const draw = span(p, 0.15, 0.75);
    if (draw !== lastDraw) {
      lastDraw = draw;
      const offset = (1 - draw).toFixed(4);
      const showMarker = draw > 0.002 && draw < 0.998;
      arts.forEach((art) => {
        art.line.style.strokeDashoffset = offset;
        if (!art.marker || !art.points.length) return;
        const [x, y] = art.points[Math.round(draw * SAMPLES)];
        art.marker.setAttribute("cx", x.toFixed(1));
        art.marker.setAttribute("cy", y.toFixed(1));
        art.marker.style.opacity = showMarker ? "1" : "0";
      });
    }
    if (!arrived && p >= 0.75) {
      arrived = true;
      section.classList.add("is-arrived");
    }
  };

  ScrollTrigger.create({
    trigger: stage,
    start: "top 85%",
    end: profile === "full" ? "bottom 40%" : "bottom 55%",
    onRefresh: (self) => {
      measure();
      lastDraw = -1;
      paint(self.progress);
    },
    onUpdate: (self) => paint(self.progress),
  });

  cleanups.push(() => {
    section.classList.remove("is-arrived");
    arts.forEach((art) => {
      art.line.style.removeProperty("stroke-dashoffset");
      if (!art.marker) return;
      art.marker.removeAttribute("style");
    });
  });
}
