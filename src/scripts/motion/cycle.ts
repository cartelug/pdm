import { type Motion, inView, qs, qsa } from "./types";

// The nine-stage cycle: the ring draws itself, the stages pop in, a point travels the ring as the
// list is read, and the stage nearest the reading line is the one that is lit.
export function cycle({ gsap, ScrollTrigger }: Motion) {
  qsa("[data-model-path]").forEach((container) => {
    const list = qs("[data-model]", container);
    const diagram = qs(".pci-cycle", container);
    const ring = qs<SVGCircleElement>("[data-model-progress]", container);
    const dot = qs<SVGCircleElement>("[data-model-dot]", container);
    if (!list || !diagram || !ring) return;
    const nodes = qsa<SVGGElement>("[data-cycle-node]", container);
    const stages = qsa("[data-model-stage]", list);
    const cx = Number(ring.getAttribute("cx"));
    const cy = Number(ring.getAttribute("cy"));
    const radius = Number(ring.getAttribute("r"));

    if (!inView(diagram)) {
      const timeline = gsap.timeline({ scrollTrigger: { trigger: diagram, start: "top 82%", once: true } });
      timeline
        .from(qs(".pci-cycle__track", container), { drawSVG: "0%", duration: 1.8, ease: "power2.inOut" }, 0)
        .from(
          nodes,
          {
            scale: 0,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(2.2)",
            stagger: 0.12,
            svgOrigin: (index: number) => {
              const circle = nodes[index].querySelector("circle:last-of-type");
              return `${circle?.getAttribute("cx")} ${circle?.getAttribute("cy")}`;
            },
          },
          0.2,
        )
        .from(
          qsa(".pci-cycle__title, .pci-cycle__sub", container),
          { opacity: 0, y: 14, duration: 1, stagger: 0.15 },
          0.9,
        );
    }

    const paint = (progress: number) => {
      ring.style.strokeDasharray = "1";
      ring.style.strokeDashoffset = String(1 - progress);
      if (dot) {
        const angle = ((-90 + progress * 360) * Math.PI) / 180;
        dot.setAttribute("cx", (cx + radius * Math.cos(angle)).toFixed(2));
        dot.setAttribute("cy", (cy + radius * Math.sin(angle)).toFixed(2));
        dot.style.opacity = progress > 0.005 && progress < 0.995 ? "1" : "0";
      }
      const rect = list.getBoundingClientRect();
      let current: Element | undefined;
      if (rect.top < innerHeight && rect.bottom > 0) {
        const line = innerHeight * 0.46;
        let best = Infinity;
        stages.forEach((stage) => {
          const box = stage.getBoundingClientRect();
          const distance = Math.abs(box.top + box.height / 2 - line);
          if (distance < best) {
            best = distance;
            current = stage;
          }
        });
      }
      const index = current?.getAttribute("data-model-stage");
      stages.forEach((stage) => stage.classList.toggle("is-current", stage === current));
      nodes.forEach((node) => node.classList.toggle("is-current", node.getAttribute("data-cycle-node") === index));
    };

    ScrollTrigger.create({
      trigger: list,
      start: "top 62%",
      end: "bottom 62%",
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => paint(self.progress),
    });
  });
}
