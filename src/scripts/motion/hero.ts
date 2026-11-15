import { tokens } from "./policy";
import { type Motion, qs, qsa } from "./types";

// Scene 1, the opening journey. The entrance itself is CSS (motion.css) so the headline and the action are
// readable on first paint without this bundle. This adds the scroll layer and, on a mouse, a little depth.
//
// Ownership: the <img> owns its entrance scale (CSS) and its scroll offset (--img-y, here); the media wrapper
// owns pointer depth; the copy owns only a small desktop drift. The actions and campaign cards never move with
// the pointer, so nothing that can be clicked slides away from the cursor.
export function hero({ gsap, signal, pointerFine, profile }: Motion) {
  const t = tokens(profile);
  const home = qs(".pci-hero");
  if (home) {
    const scrub = { ease: "none", scrollTrigger: { trigger: home, start: "top top", end: "bottom top", scrub: true } };
    // The photograph drifts down within its overscan as the hero leaves: about 24 px on a desktop, 8 on a phone.
    gsap.fromTo(".pci-hero__media img", { "--img-y": "0px" }, { "--img-y": `${t.sceneDepth}px`, ...scrub });
    // Reading copy stays on a stable plane on phones; on a desktop it lifts at most 20 px.
    if (profile === "full") gsap.fromTo(".pci-hero__copy", { "--copy-y": "0px" }, { "--copy-y": "-20px", ...scrub });

    const media = qs(".pci-hero__media");
    if (pointerFine && media) {
      const x = gsap.quickTo(media, "x", { duration: 0.9, ease: "power3.out" });
      const y = gsap.quickTo(media, "y", { duration: 0.9, ease: "power3.out" });
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        // Read only; the quickTo writes land on the next ticker frame.
        const box = home.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
        const ny = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
        x(nx * -8);
        y(ny * -5);
      };
      const rest = () => {
        x(0);
        y(0);
      };
      home.addEventListener("pointermove", move, { signal, passive: true });
      home.addEventListener("pointerleave", rest, { signal });
      window.addEventListener("blur", rest, { signal });
      document.addEventListener("visibilitychange", rest, { signal });
    }
  }

  // Inner pages: the arch artwork separates gently from the title as the hero leaves; the title barely moves.
  const page = qs(".pci-page-hero");
  if (page) {
    const range = { trigger: page, start: "top top", end: "bottom top", scrub: true };
    const depth = profile === "full" ? 14 : 6;
    qsa(".pci-page-hero__art span").forEach((span, index) => {
      gsap.fromTo(
        span,
        { "--art-y": "0px" },
        { "--art-y": `${-depth * (index + 1)}px`, ease: "none", scrollTrigger: range },
      );
    });
    if (profile === "full")
      gsap.fromTo(
        ".pci-page-hero__copy",
        { "--page-copy-y": "0px" },
        { "--page-copy-y": "-16px", ease: "none", scrollTrigger: range },
      );
  }
}
