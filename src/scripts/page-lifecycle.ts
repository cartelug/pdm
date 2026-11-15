import { initGlobalNavigation } from "./navigation";
import { recordEngagement } from "./analytics";
import { initPillars } from "./pillars";
import { initProjectFilter } from "./project-filter";
import { COMPACT, DESKTOP } from "./motion/policy";

let cleanup: (() => void) | null = null;
function boot() {
  cleanup?.();
  if (!document.body.hasAttribute("data-pci-v3")) return;
  const controller = new AbortController();
  const destroyNavigation = initGlobalNavigation();
  let destroyMotion: (() => void) | undefined;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let alive = true;
  let generation = 0;
  // Data saver, a genuinely 2G connection or a very small device: keep the page light and skip the scripted
  // scroll effects. The CSS entrances and every piece of content are unaffected.
  // Chrome's effectiveType reports "3g" whenever measured round trips are long (common on good East African
  // connections), so "3g" alone no longer switches motion off: it hid every scroll effect on ordinary desktops.
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lite = Boolean(
    connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "") || (memory !== undefined && memory < 2),
  );
  document.documentElement.toggleAttribute("data-lite", lite);
  // Each start gets its own abort signal: a newer start, a reduced-motion change or leaving the page cancels
  // any setup still waiting on fonts or imports, and that setup then reverts itself instead of finishing.
  let pending: AbortController | undefined;
  const idle = window.setTimeout(async () => {
    if (lite) return;
    const start = async () => {
      const ticket = ++generation;
      pending?.abort();
      destroyMotion?.();
      destroyMotion = undefined;
      if (!alive || reduce.matches) return;
      const attempt = (pending = new AbortController());
      try {
        const { initScrollMotion } = await import("./motion");
        if (attempt.signal.aborted || !alive || ticket !== generation || reduce.matches) return;
        const destroy = await initScrollMotion(attempt.signal);
        if (alive && ticket === generation && !attempt.signal.aborted) destroyMotion = destroy;
        else destroy();
      } catch (error) {
        // The page is already complete; an optional motion module that fails to load leaves it as it is.
        console.warn("Scroll motion unavailable:", error);
      }
    };
    if (!alive) return;
    reduce.addEventListener("change", start, { signal: controller.signal });
    // Phone and desktop compositions use different distances and scene choices: rebuild on a real change of
    // profile (rotation, a resized window, a pointer change), never on browser-chrome height changes.
    matchMedia(COMPACT).addEventListener("change", start, { signal: controller.signal });
    matchMedia(DESKTOP).addEventListener("change", start, { signal: controller.signal });
    await start();
  }, 100);

  // The brand intro (BrandIntro.astro) never blocks: the first key, click, scroll or touch skips it, and the
  // page's own entrance (which waits on --pci-intro) starts at once.
  const root = document.documentElement;
  const intro = document.querySelector(".pci-intro");
  if (intro && !root.classList.contains("pci-intro-off")) {
    const skip = () => {
      if (getComputedStyle(intro).visibility !== "hidden") root.classList.add("pci-intro-skip");
      stopSkip.abort();
    };
    const stopSkip = new AbortController();
    controller.signal.addEventListener("abort", () => stopSkip.abort(), { once: true });
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"])
      window.addEventListener(type, skip, { signal: stopSkip.signal, passive: true, capture: true });
    // After it has played there is nothing left to skip.
    intro.addEventListener(
      "animationend",
      (event) => {
        if ((event as AnimationEvent).animationName === "pci-intro-done") stopSkip.abort();
      },
      { signal: stopSkip.signal },
    );
  }

  // Functional controllers: these work with or without the motion bundle and are disposed with the page.
  initProjectFilter(controller.signal);
  const destroyPillars = Array.from(document.querySelectorAll<HTMLElement>("[data-pillars]")).map(initPillars);

  document.addEventListener(
    "click",
    (event) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
      if (link?.origin === location.origin) recordEngagement("navigation_selected", link.pathname);
    },
    { signal: controller.signal },
  );
  window.addEventListener(
    "pci:menu-state",
    ((event: CustomEvent) => {
      if (event.detail === "opening") recordEngagement("menu_open");
    }) as EventListener,
    { signal: controller.signal },
  );

  // Project carousel: native scrolling with snap, plus buttons and a progress line when scripted.
  document.querySelectorAll<HTMLElement>("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector<HTMLElement>("[data-carousel-track]");
    const prev = carousel.querySelector<HTMLButtonElement>("[data-carousel-prev]");
    const next = carousel.querySelector<HTMLButtonElement>("[data-carousel-next]");
    const progress = carousel.querySelector<HTMLElement>("[data-carousel-progress]");
    if (!track) return;
    prev && (prev.hidden = false);
    next && (next.hidden = false);
    const paint = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= max - 4;
      progress?.style.setProperty(
        "--p",
        String(Math.min(1, (track.scrollLeft + track.clientWidth) / track.scrollWidth)),
      );
    };
    const step = (direction: number) => {
      // One card plus the gap the stylesheet actually uses, measured rather than assumed.
      const card = track.querySelector<HTMLElement>("[data-project-status]");
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const distance = (card?.offsetWidth ?? track.clientWidth * 0.8) + gap;
      track.scrollBy({ left: direction * distance, behavior: reduce.matches ? "auto" : "smooth" });
    };
    prev?.addEventListener("click", () => step(-1), { signal: controller.signal });
    next?.addEventListener("click", () => step(1), { signal: controller.signal });
    track.addEventListener("scroll", paint, { passive: true, signal: controller.signal });
    window.addEventListener("resize", paint, { signal: controller.signal });
    paint();
  });
  // Hovering or focusing a stage lights its place on the cycle diagram as well.
  const stages = Array.from(document.querySelectorAll<HTMLElement>("[data-model-stage]"));
  const light = (index: string | null) =>
    document
      .querySelectorAll("[data-cycle-node]")
      .forEach((node) => node.classList.toggle("is-focus", node.getAttribute("data-cycle-node") === index));
  stages.forEach((stage) => {
    const index = stage.getAttribute("data-model-stage");
    for (const [type, value] of [
      ["focus", index],
      ["blur", null],
      ["pointerenter", index],
      ["pointerleave", null],
    ] as const)
      stage.addEventListener(type, () => light(value), { signal: controller.signal });
  });
  cleanup = () => {
    alive = false;
    generation++;
    clearTimeout(idle);
    pending?.abort();
    destroyMotion?.();
    destroyPillars.forEach((destroy) => destroy());
    destroyNavigation();
    controller.abort();
    cleanup = null;
  };
}
boot();
window.addEventListener("pagehide", () => cleanup?.());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) boot();
});
