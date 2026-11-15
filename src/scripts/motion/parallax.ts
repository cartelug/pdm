import { type Motion, qsa } from "./types";

// Bounded image depth. Each photograph drifts inside its frame by less than its own overscan, so no edge is
// ever exposed: for a centred image scaled by s, the safe travel either way is (s - 1) / 2 of its height
// (project cards: 1.08 → 4 %, campaign panels: 1.1 → 5 %). Phones use half the travel.
export function parallax({ gsap, profile }: Motion) {
  const share = profile === "full" ? 0.75 : 0.4;
  qsa(".pci-project__media img, .pci-duo__media img").forEach((image) => {
    const frame = (image.closest(".pci-duo__panel") ?? image.parentElement) as HTMLElement;
    // Overscan from the stylesheet's own base scale; never more travel than the image can cover.
    const base = parseFloat(getComputedStyle(image).getPropertyValue("--img-base")) || 1;
    const travel = Math.max(0, ((base - 1) / 2) * 100 * share).toFixed(2);
    gsap.fromTo(
      image,
      { "--img-y": `-${travel}%` },
      {
        "--img-y": `${travel}%`,
        ease: "none",
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });

  // The partnership rings turn a few degrees while the band is on screen, then rest.
  qsa(".pci-band").forEach((band) => {
    const rings = band.querySelector(".pci-band__rings");
    if (!rings) return;
    gsap.fromTo(
      rings,
      // Rotation goes through GSAP's own transform (not the CSS rotate variable), so the desktop pointer depth
      // can share the element without one cancelling the other.
      // The rings are centred with CSS translate, which GSAP replaces while it owns the transform.
      { x: 0, y: 0, xPercent: -50, yPercent: -50, rotation: -8 },
      {
        xPercent: -50,
        yPercent: -50,
        rotation: 8,
        ease: "none",
        scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}
