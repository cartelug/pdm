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
import { profile } from "./policy";
import { reveal } from "./reveal";
import { route } from "./route";
import { scrub } from "./scrub";
import { spotlight } from "./spotlight";
import type { Motion } from "./types";

// Scene order follows the page: opening journey, campus, road, then the shared reveal vocabulary,
// the model, the closing and the interface details.
const FEATURES = [
  hero,
  spotlight,
  route,
  reveal,
  scrub,
  parallax,
  counters,
  cycle,
  flow,
  footer,
  filter,
  chrome,
  cursor,
];

const noop = () => {};

// Scroll-driven motion. Page content is complete without it: nothing here is needed to read the page,
// and every change it makes is undone by the function this returns. `cancel` may abort at any await:
// a setup that is cancelled reverts whatever it had already done and never touches the page again.
export async function initScrollMotion(cancel: AbortSignal): Promise<() => void> {
  if (cancel.aborted) return noop;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  const abort = new AbortController();
  const desktop = matchMedia("(min-width: 1161px) and (pointer: fine)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  // Triggers that existed before this owner started are not ours to kill.
  const foreign = new Set(ScrollTrigger.getAll());
  const owners: Array<{ context: gsap.Context; cleanups: Array<() => void> }> = [];
  let alive = true;
  let lenis: import("lenis").default | undefined;
  let ticker: ((time: number) => void) | undefined;
  let lenisGeneration = 0;
  let refreshTimer = 0;
  let menuLocked = false;
  let resize: ResizeObserver | undefined;

  const owned = () => ScrollTrigger.getAll().filter((trigger) => !foreign.has(trigger));
  function stopLenis() {
    if (ticker) gsap.ticker.remove(ticker);
    lenis?.destroy();
    lenis = undefined;
    ticker = undefined;
  }
  function teardown() {
    if (!alive) return;
    alive = false;
    lenisGeneration++;
    clearTimeout(refreshTimer);
    resize?.disconnect();
    abort.abort();
    stopLenis();
    gsap.ticker.lagSmoothing(500, 33);
    // Reverse order: later owners may wrap DOM that earlier owners created.
    for (const owner of owners.reverse()) {
      owner.cleanups.reverse().forEach((undo) => undo());
      owner.context.revert();
    }
    owners.length = 0;
    owned().forEach((trigger) => trigger.kill());
  }
  const cancelled = () => {
    if (!cancel.aborted && alive) return false;
    teardown();
    return true;
  };
  cancel.addEventListener("abort", teardown, { once: true });

  // Line breaks depend on the final fonts, so split text only once they are ready.
  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]);
  if (cancelled()) return noop;
  // The FLIP plugin is only needed on the page that has the filterable project grid.
  const Flip = document.querySelector("[data-project-grid]") ? (await import("gsap/Flip")).Flip : undefined;
  if (cancelled()) return noop;
  Flip && gsap.registerPlugin(Flip);

  const pointerFine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const currentProfile = profile();
  // Each feature sets up in its own task and its own context, so no single stretch of work blocks the main
  // thread for long, and a feature that fails is reverted on its own while the rest of the page carries on.
  for (const feature of FEATURES) {
    const context = gsap.context(() => {});
    const cleanups: Array<() => void> = [];
    owners.push({ context, cleanups });
    const motion: Motion = {
      gsap,
      ScrollTrigger,
      SplitText,
      Flip,
      signal: abort.signal,
      pointerFine,
      profile: currentProfile,
      cleanups,
      own: <T>(create: () => T): T => {
        let result: T | undefined;
        if (alive) context.add(() => void (result = create()));
        return result as T;
      },
    };
    try {
      context.add(() => feature(motion));
    } catch (error) {
      cleanups.reverse().forEach((undo) => undo());
      context.revert();
      cleanups.length = 0;
      console.error("Motion feature failed and was reverted:", feature.name, error);
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (cancelled()) return noop;
  }

  // Focus wins over any reveal still waiting to play: if keyboard focus (or a link from browser Find or a
  // hash) lands inside something a scene is holding back, show that ancestor immediately and stop its tween.
  document.addEventListener(
    "focusin",
    (event) => {
      const held: HTMLElement[] = [];
      for (let el = event.target as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
        const style = el.style;
        if (!style) continue;
        if ((style.opacity !== "" && Number(style.opacity) < 1) || style.clipPath) held.push(el);
      }
      if (!held.length) return;
      gsap.killTweensOf(held);
      gsap.set(held, { clearProps: "opacity,transform,clipPath" });
    },
    { signal: abort.signal },
  );

  // Layout can change after load (images, fonts, filters, text zoom): measure again, but only after a real
  // size change, never on every frame, and never while the menu holds the page still.
  const refresh = () => {
    if (menuLocked) return;
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => alive && !menuLocked && ScrollTrigger.refresh(), 180);
  };
  let lastWidth = document.body.clientWidth;
  let lastHeight = document.body.clientHeight;
  resize = new ResizeObserver(() => {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    if (Math.abs(width - lastWidth) < 1 && Math.abs(height - lastHeight) < 2) return;
    lastWidth = width;
    lastHeight = height;
    refresh();
  });
  resize.observe(document.body);
  window.addEventListener("load", refresh, { signal: abort.signal });
  window.addEventListener("pci:layout", refresh, { signal: abort.signal });

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

  // The menu owns scrolling while it is open: the body is fixed, so window.scrollY reads 0. Hold every scene
  // where it is instead of letting it interpret that as "back at the top", and resume once the menu has put
  // the reading position back.
  window.addEventListener(
    "pci:menu-state",
    ((event: CustomEvent) => {
      if (event.detail === "closed") {
        if (!menuLocked) return;
        menuLocked = false;
        lenis?.start();
        owned().forEach((trigger) => trigger.enable(false));
        ScrollTrigger.update();
      } else if (!menuLocked && (event.detail === "opening" || event.detail === "open")) {
        menuLocked = true;
        lenis?.stop();
        owned().forEach((trigger) => trigger.disable(false));
      }
    }) as EventListener,
    { signal: abort.signal },
  );
  await prepareLenis();
  if (cancelled()) return noop;
  return teardown;
}
