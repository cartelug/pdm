import { setFilterTransition } from "../project-filter";
import { tokens } from "./policy";
import { type Motion, qsa } from "./types";

// Filtering the project grid reflows the cards with a FLIP transition instead of cutting. The filter itself
// (hiding, counting, announcing) lives in project-filter.ts and works without this. This only wraps it:
// measure, let the filter apply, then animate from the measurement. A second choice made mid-flight
// measures the cards where they currently are and becomes the target straight away.
export function filter({ gsap, Flip, profile, cleanups }: Motion) {
  if (!Flip || !document.querySelector("[data-project-grid]")) return;
  const duration = tokens(profile).filter;
  let active: gsap.core.Timeline | undefined;

  setFilterTransition((apply, grid) => {
    const cards = qsa("[data-project-status]", grid);
    const state = Flip.getState(cards);
    // Finish the previous reflow so no card keeps its temporary absolute position or opacity.
    active?.progress(1).kill();
    // A card still arriving (desktop director) hands its transform to the reflow.
    gsap.killTweensOf(cards);
    gsap.set(cards, { clearProps: "opacity,transform,scale,pointerEvents" });
    apply();
    active = Flip.from(state, {
      duration,
      ease: "power2.inOut",
      absolute: true,
      scale: true,
      nested: true,
      onEnter: (entering) =>
        gsap.fromTo(
          entering,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: duration * 0.8, delay: duration * 0.3, clearProps: "opacity,transform" },
        ),
      // A card on its way out stops taking clicks at once.
      onLeave: (leaving) =>
        gsap.to(leaving, {
          opacity: 0,
          scale: 0.96,
          pointerEvents: "none",
          duration: duration * 0.5,
          clearProps: "opacity,scale,transform,pointerEvents",
        }),
      onComplete: () => {
        gsap.set(cards, { clearProps: "opacity,transform,scale,pointerEvents" });
        window.dispatchEvent(new Event("pci:layout"));
      },
    });
  });

  cleanups.push(() => {
    setFilterTransition(null);
    active?.progress(1).kill();
  });
}
