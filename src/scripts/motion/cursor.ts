import { type Motion, qsa } from "./types";

const TARGETS = ".pci-project, .pci-duo__panel, .pci-card--link, [data-cursor]";

// On a mouse, a small crimson disc follows the pointer over cards and photographs and names the action.
// It is decoration only: the links themselves are unchanged and it never takes pointer events.
export function cursor({ gsap, signal, pointerFine, cleanups }: Motion) {
  if (!pointerFine || !qsa(TARGETS).length) return;
  const disc = document.createElement("div");
  disc.className = "pci-cursor";
  disc.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  disc.append(label);
  document.body.append(disc);

  const x = gsap.quickTo(disc, "x", { duration: 0.45, ease: "power3.out" });
  const y = gsap.quickTo(disc, "y", { duration: 0.45, ease: "power3.out" });
  let placed = false;
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!placed) {
        gsap.set(disc, { x: event.clientX, y: event.clientY });
        placed = true;
      }
      x(event.clientX);
      y(event.clientY);
      const target = (event.target as Element | null)?.closest<HTMLElement>(TARGETS);
      // Buttons and form controls keep the ordinary pointer.
      const control = (event.target as Element | null)?.closest("button, input, select, textarea, .pci-button");
      const show = Boolean(target) && !control;
      if (show) label.textContent = target!.dataset.cursor || "View";
      disc.classList.toggle("is-active", show);
    },
    { signal, passive: true },
  );
  document.addEventListener("pointerleave", () => disc.classList.remove("is-active"), { signal });
  cleanups.push(() => disc.remove());
}
