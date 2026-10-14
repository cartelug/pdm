import { type Motion, qs, qsa } from "./types";

// Filtering the project grid reflows the cards with a FLIP transition instead of cutting. The
// filter itself (hiding, counting, announcing) stays in page-lifecycle.ts and works without this.
export function filter({ gsap, Flip, signal }: Motion) {
  const grid = qs("[data-project-grid]");
  if (!grid || !Flip) return;
  qsa("[data-project-filter]").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        const cards = qsa("[data-project-status]", grid);
        const state = Flip.getState(cards);
        // The filter handler runs synchronously in this same click; measure the result after it.
        queueMicrotask(() =>
          Flip.from(state, {
            duration: 0.85,
            ease: "power3.inOut",
            absolute: true,
            scale: true,
            nested: true,
            onEnter: (entering) =>
              gsap.fromTo(
                entering,
                { opacity: 0, y: 40 },
                { opacity: 1, y: 0, duration: 0.7, delay: 0.25, clearProps: "opacity,transform" },
              ),
            onLeave: (leaving) => gsap.to(leaving, { opacity: 0, scale: 0.92, duration: 0.4 }),
          }),
        );
      },
      { signal },
    ),
  );
}
