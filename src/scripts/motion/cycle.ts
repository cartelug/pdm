import { type Motion, inView, qs, qsa } from "./types";

// Scene 5, the community model (Beat 08). The ring draws itself once, the nodes arrive in a compact sequence,
// then the ring becomes a companion to reading: a point travels round as the list is read, and the stage
// nearest the reading line lights its node. When the reader reaches the last stage the cycle closes once on
// the first node, and then everything is still.
//
// Stage positions are cached whenever the layout is measured; scrolling only compares numbers and writes a
// class when the current stage actually changes. Hover/focus emphasis (page-lifecycle.ts, `is-focus`) is a
// separate state and is never overwritten here.
export function cycle({ gsap, ScrollTrigger, profile, cleanups }: Motion) {
  qsa("[data-model-path]").forEach((container) => {
    const list = qs("[data-model]", container);
    const diagram = qs(".pci-cycle", container);
    const stick = qs(".pci-cycle__stick", container);
    const ring = qs<SVGCircleElement>("[data-model-progress]", container);
    const dot = qs<SVGCircleElement>("[data-model-dot]", container);
    if (!list || !diagram || !ring) return;
    const nodes = qsa<SVGGElement>("[data-cycle-node]", container);
    const stages = qsa("[data-model-stage]", list);
    const cx = Number(ring.getAttribute("cx"));
    const cy = Number(ring.getAttribute("cy"));
    const radius = Number(ring.getAttribute("r"));

    if (!inView(diagram)) {
      const compact = profile === "compact";
      const timeline = gsap.timeline({ scrollTrigger: { trigger: diagram, start: "top 82%", once: true } });
      timeline
        .from(
          qs(".pci-cycle__track", container),
          { drawSVG: "0%", duration: compact ? 1 : 1.3, ease: "power2.inOut" },
          0,
        )
        .from(
          nodes,
          {
            scale: 0.4,
            opacity: 0,
            duration: 0.45,
            ease: "power3.out",
            // Nine nodes in well under a second, following the ring as it draws.
            stagger: compact ? 0.06 : 0.09,
            svgOrigin: (index: number) => {
              const circle = nodes[index].querySelector("circle:last-of-type");
              return `${circle?.getAttribute("cx")} ${circle?.getAttribute("cy")}`;
            },
          },
          0.15,
        )
        .from(
          qsa(".pci-cycle__title, .pci-cycle__sub", container),
          { opacity: 0, y: 10, duration: 0.5, stagger: 0.1, ease: "power3.out" },
          0.6,
        );
    }

    // A companion diagram stays beside the list only when it fits below the header with breathing room.
    // Measured from its natural size, which sticking does not change, so the decision cannot oscillate.
    const fit = () => {
      if (!stick) return;
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pci-header")) || 80;
      container.classList.toggle("is-unfit", stick.offsetHeight > innerHeight - header - 80);
    };

    let thresholds: number[] = [];
    let listTop = 0;
    let listBottom = 0;
    const measure = () => {
      fit();
      const scroll = window.scrollY;
      const box = list.getBoundingClientRect();
      listTop = box.top + scroll;
      listBottom = box.bottom + scroll;
      thresholds = stages.map((stage) => {
        const rect = stage.getBoundingClientRect();
        return rect.top + scroll + rect.height / 2;
      });
    };

    let current = -1;
    let closed = false;
    const setCurrent = (index: number) => {
      if (index === current) return;
      current = index;
      const id = index >= 0 ? stages[index].getAttribute("data-model-stage") : null;
      stages.forEach((stage, i) => stage.classList.toggle("is-current", i === index));
      nodes.forEach((node) => node.classList.toggle("is-current", node.getAttribute("data-cycle-node") === id));
    };
    const paint = (progress: number) => {
      ring.style.strokeDasharray = "1";
      ring.style.strokeDashoffset = String(1 - progress);
      if (dot) {
        const angle = ((-90 + progress * 360) * Math.PI) / 180;
        dot.setAttribute("cx", (cx + radius * Math.cos(angle)).toFixed(2));
        dot.setAttribute("cy", (cy + radius * Math.sin(angle)).toFixed(2));
        dot.style.opacity = progress > 0.005 && progress < 0.995 ? "1" : "0";
      }
      const scroll = window.scrollY;
      if (scroll + innerHeight <= listTop || scroll >= listBottom) return setCurrent(-1);
      const line = scroll + innerHeight * 0.46;
      let best = 0;
      thresholds.forEach((y, i) => {
        if (Math.abs(y - line) < Math.abs(thresholds[best] - line)) best = i;
      });
      setCurrent(best);
      if (!closed && progress >= 0.985) {
        closed = true;
        container.classList.add("is-closed");
      }
    };

    ScrollTrigger.create({
      trigger: list,
      start: "top 62%",
      end: "bottom 62%",
      onUpdate: (self) => paint(self.progress),
      onRefresh: (self) => {
        measure();
        paint(self.progress);
      },
    });

    cleanups.push(() => {
      setCurrent(-1);
      container.classList.remove("is-closed", "is-unfit");
      ring.removeAttribute("style");
      dot?.removeAttribute("style");
    });
  });
}
