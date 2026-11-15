import { type Motion, qs } from "./types";

// Page chrome: the reading-progress line and the principle strip.
//
// The strip was an endless marquee that sped up with scroll velocity, creating a new tween on every scroll
// update. It is now driven only by the reader: the repeated list slides by one copy as the strip passes
// through the screen, and stops when scrolling stops. Nothing moves on its own, so there is nothing to pause.
// Buttons no longer lean toward the pointer; their arrows give the feedback (components.css).
export function chrome({ gsap, ScrollTrigger, profile, cleanups }: Motion) {
  // Browsers without scroll-linked CSS animations get the progress line from the script. It is decorative
  // and hidden from assistive technology.
  if (!CSS.supports("animation-timeline: scroll()")) {
    let last = -1;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const value = Math.round(self.progress * 1000) / 1000;
        if (value === last) return;
        last = value;
        document.documentElement.style.setProperty("--pci-progress", String(value));
      },
    });
    cleanups.push(() => document.documentElement.style.removeProperty("--pci-progress"));
  }

  const strip = qs(".pci-strip");
  const list = strip && qs("ul", strip);
  if (!strip || !list) return;
  const track = document.createElement("div");
  track.className = "pci-strip__track";
  list.replaceWith(track);
  track.append(list);
  // Copies are presentation only: assistive technology reads the first list once.
  const copies = [1, 2, 3].map(() => {
    const copy = list.cloneNode(true) as HTMLElement;
    copy.setAttribute("aria-hidden", "true");
    copy.inert = true;
    track.append(copy);
    return copy;
  });
  strip.classList.add("is-marquee");
  gsap.fromTo(
    track,
    { xPercent: 0 },
    {
      xPercent: profile === "full" ? -12 : -18,
      ease: "none",
      scrollTrigger: {
        trigger: strip,
        start: "top bottom",
        end: "bottom top",
        scrub: profile === "full" ? 0.3 : true,
      },
    },
  );
  cleanups.push(() => {
    copies.forEach((copy) => copy.remove());
    track.replaceWith(list);
    strip.classList.remove("is-marquee");
  });
}
