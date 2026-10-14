import { type Motion, inView, qsa } from "./types";

// The page already holds the real figure; it is replaced by a count-up only while in motion.
export function counters({ gsap, ScrollTrigger, cleanups }: Motion) {
  qsa("[data-count]").forEach((element) => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target) || inView(element)) return;
    const value = { n: 0 };
    element.textContent = "0";
    ScrollTrigger.create({
      trigger: element,
      start: "top 92%",
      once: true,
      onEnter: () =>
        gsap.to(value, {
          n: target,
          duration: 2,
          ease: "power3.out",
          onUpdate: () => (element.textContent = String(Math.round(value.n))),
          onComplete: () => (element.textContent = String(target)),
        }),
    });
    cleanups.push(() => (element.textContent = String(target)));
  });
}
