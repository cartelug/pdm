import { type Motion, qs, qsa } from "./types";

export function chrome({ gsap, ScrollTrigger, signal, pointerFine, cleanups }: Motion) {
  // Browsers without scroll-linked CSS animations get the progress bar from the script.
  if (!CSS.supports("animation-timeline: scroll()")) {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => document.documentElement.style.setProperty("--pci-progress", String(self.progress)),
    });
    cleanups.push(() => document.documentElement.style.removeProperty("--pci-progress"));
  }

  // The principle strip becomes a marquee that speeds up with the scroll.
  const strip = qs(".pci-strip");
  const list = strip && qs("ul", strip);
  if (strip && list) {
    const track = document.createElement("div");
    track.className = "pci-strip__track";
    list.replaceWith(track);
    track.append(list);
    const copies = [1, 2, 3].map(() => {
      const copy = list.cloneNode(true) as HTMLElement;
      copy.setAttribute("aria-hidden", "true");
      track.append(copy);
      return copy;
    });
    strip.classList.add("is-marquee");
    const drift = gsap.to(track, { xPercent: -25, ease: "none", duration: 36, repeat: -1 });
    ScrollTrigger.create({
      trigger: strip,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? drift.resume() : drift.pause()),
    });
    ScrollTrigger.create({
      onUpdate: (self) => {
        drift.timeScale(1 + Math.min(Math.abs(self.getVelocity()) / 320, 7));
        gsap.to(drift, { timeScale: 1, duration: 1.1, ease: "power2.out", overwrite: true, delay: 0.08 });
      },
    });
    cleanups.push(() => {
      copies.forEach((copy) => copy.remove());
      track.replaceWith(list);
      strip.classList.remove("is-marquee");
    });
  }

  if (!pointerFine) return;

  // Buttons lean toward the pointer.
  qsa(".pci-button, .pci-header__cta").forEach((button) => {
    const x = gsap.quickTo(button, "x", { duration: 0.7, ease: "elastic.out(1, 0.55)" });
    const y = gsap.quickTo(button, "y", { duration: 0.7, ease: "elastic.out(1, 0.55)" });
    button.addEventListener(
      "pointermove",
      (event) => {
        const box = button.getBoundingClientRect();
        x((event.clientX - (box.left + box.width / 2)) * 0.26);
        y((event.clientY - (box.top + box.height / 2)) * 0.34);
      },
      { signal },
    );
    button.addEventListener(
      "pointerleave",
      () => {
        x(0);
        y(0);
      },
      { signal },
    );
  });
}
