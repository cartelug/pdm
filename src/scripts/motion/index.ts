import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { chrome } from "./chrome";
import { counters } from "./counters";
import { cursor } from "./cursor";
import { cycle } from "./cycle";
import { flow } from "./flow";
import { filter } from "./filter";
import { footer } from "./footer";
import { hero } from "./hero";
import { parallax } from "./parallax";
import { reveal } from "./reveal";
import { scrub } from "./scrub";
import type { Motion } from "./types";

// Scroll-driven motion. Page content is complete without it: nothing here is needed to read the page,
// and every change it makes is undone by the function this returns.
export async function initScrollMotion(): Promise<() => void> {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  const abort = new AbortController();
  const desktop = matchMedia("(min-width: 1161px) and (pointer: fine)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const cleanups: Array<() => void> = [];
  let alive = true;
  let lenis: import("lenis").default | undefined;
  let ticker: ((time: number) => void) | undefined;
  let lenisGeneration = 0;
  let refreshTimer = 0;

  // Line breaks depend on the final fonts, so split text only once they are ready.
  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
  // The FLIP plugin is only needed on the page that has the filterable project grid.
  const Flip = document.querySelector("[data-project-grid]") ? (await import("gsap/Flip")).Flip : undefined;
  Flip && gsap.registerPlugin(Flip);
  if (!alive) return () => {};

  const motion: Motion = {
    gsap,
    ScrollTrigger,
    SplitText,
    Flip,
    signal: abort.signal,
    pointerFine: matchMedia("(hover: hover) and (pointer: fine)").matches,
    cleanups,
  };
  const context = gsap.context(() => {
    for (const feature of [hero, reveal, scrub, parallax, counters, cycle, flow, footer, filter, chrome, cursor])
      feature(motion);
  });

  // Layout can change after load (images, filters, text zoom): measure again, but not on every frame.
  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => alive && ScrollTrigger.refresh(), 180);
  };
  const resize = new ResizeObserver(refresh);
  resize.observe(document.body);
  window.addEventListener("load", refresh, { signal: abort.signal });
  window.addEventListener("pci:layout", refresh, { signal: abort.signal });

  function stopLenis() {
    if (ticker) gsap.ticker.remove(ticker);
    lenis?.destroy();
    lenis = undefined;
    ticker = undefined;
  }
  async function prepareLenis() {
    const generation = ++lenisGeneration;
    stopLenis();
    if (!desktop.matches || !alive || reduce.matches) return;
    const { default: Lenis } = await import("lenis");
    if (!alive || !desktop.matches || reduce.matches || generation !== lenisGeneration) return;
    lenis = new Lenis({ autoRaf: false, duration: 0.9, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    ticker = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);
  }
  desktop.addEventListener("change", prepareLenis, { signal: abort.signal });
  window.addEventListener(
    "pci:menu-state",
    ((event: CustomEvent) => {
      if (event.detail === "closed") lenis?.start();
      else lenis?.stop();
    }) as EventListener,
    { signal: abort.signal },
  );
  await prepareLenis();

  return () => {
    alive = false;
    lenisGeneration++;
    clearTimeout(refreshTimer);
    resize.disconnect();
    abort.abort();
    stopLenis();
    gsap.ticker.lagSmoothing(500, 33);
    cleanups.forEach((undo) => undo());
    context.revert();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    document
      .querySelectorAll(".is-current,.is-focus")
      .forEach((element) => element.classList.remove("is-current", "is-focus"));
    document.querySelectorAll<SVGElement>("[data-model-progress]").forEach((ring) => ring.removeAttribute("style"));
    document.querySelectorAll<SVGElement>("[data-model-dot]").forEach((dot) => dot.removeAttribute("style"));
  };
}
