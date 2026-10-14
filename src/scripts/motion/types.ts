import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText } from "gsap/SplitText";
import type { Flip } from "gsap/Flip";

// Everything a motion feature needs. Features register tweens and triggers inside the shared
// gsap.context, and push anything else that must be undone (DOM, classes, listeners) onto `cleanups`.
export interface Motion {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  SplitText: typeof SplitText;
  Flip?: typeof Flip;
  signal: AbortSignal;
  pointerFine: boolean;
  cleanups: Array<() => void>;
}

export const qs = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);
export const qsa = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

// Already on screen at load: leave it visible rather than hiding it just to animate it back in.
export const inView = (element: Element, ratio = 0.9) => element.getBoundingClientRect().top < innerHeight * ratio;
