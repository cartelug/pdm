import { type Motion, qsa } from "./types";

// Sequences that read as a path: the money trail lights up step by step and a timeline draws itself.
export function flow({ gsap, ScrollTrigger, profile, own, cleanups }: Motion) {
  qsa(".pci-steps").forEach((steps) => {
    const items = qsa("li", steps);
    steps.classList.add("is-live");
    ScrollTrigger.create({
      trigger: steps,
      start: "top 78%",
      once: true,
      // Owned, so leaving the page or turning motion off cancels any step still waiting to light.
      onEnter: () =>
        own(() =>
          items.forEach((item, index) =>
            gsap.delayedCall(0.12 + index * (profile === "full" ? 0.12 : 0.08), () => item.classList.add("is-lit")),
          ),
        ),
    });
    cleanups.push(() => {
      steps.classList.remove("is-live");
      items.forEach((item) => item.classList.remove("is-lit"));
    });
  });

  qsa(".pci-timeline").forEach((timeline) => {
    const items = qsa(".pci-timeline__item", timeline);
    timeline.classList.add("is-live");
    timeline.style.setProperty("--pci-line", "0");
    ScrollTrigger.create({
      trigger: timeline,
      start: "top 72%",
      end: "bottom 58%",
      scrub: 0.4,
      onUpdate: (self) => {
        timeline.style.setProperty("--pci-line", String(self.progress));
        const reached = self.progress * timeline.offsetHeight;
        items.forEach((item) => item.classList.toggle("is-reached", item.offsetTop <= reached));
      },
    });
    cleanups.push(() => {
      timeline.classList.remove("is-live");
      timeline.style.removeProperty("--pci-line");
      items.forEach((item) => item.classList.remove("is-reached"));
    });
  });
}
