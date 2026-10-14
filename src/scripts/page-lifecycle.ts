import { initGlobalNavigation } from "./navigation";
import { recordEngagement } from "./analytics";

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
  const idle = window.setTimeout(async () => {
    const { initScrollMotion } = await import("./motion");
    const start = async () => {
      const ticket = ++generation;
      destroyMotion?.();
      destroyMotion = undefined;
      if (!alive || reduce.matches) return;
      const destroy = await initScrollMotion();
      if (alive && ticket === generation) destroyMotion = destroy;
      else destroy();
    };
    if (!alive) return;
    reduce.addEventListener("change", start, { signal: controller.signal });
    await start();
  }, 100);

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

  document.querySelectorAll<HTMLButtonElement>("[data-project-filter]").forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const value = button.dataset.projectFilter!;
        document
          .querySelectorAll("[data-project-filter]")
          .forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
        let count = 0;
        document.querySelectorAll<HTMLElement>("[data-project-status]").forEach((card) => {
          card.hidden = value !== "all" && card.dataset.projectStatus !== value;
          if (!card.hidden) count++;
        });
        const status = document.querySelector("[data-filter-count]");
        if (status) status.textContent = `${count} ${count === 1 ? "project" : "projects"} shown`;
      },
      { signal: controller.signal },
    );
  });
  document.querySelectorAll<HTMLElement>("[data-model-stage]").forEach((stage) => {
    stage.addEventListener(
      "focus",
      () => {
        document.querySelectorAll("[data-model-stage]").forEach((el) => el.classList.toggle("is-active", el === stage));
      },
      { signal: controller.signal },
    );
  });
  cleanup = () => {
    alive = false;
    generation++;
    clearTimeout(idle);
    destroyMotion?.();
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
