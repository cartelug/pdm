import { type Motion, qsa } from "./types";

export function parallax({ gsap }: Motion) {
  // Photographs drift against their frames.
  qsa(".pci-project__media img, .pci-duo__media img").forEach((image) => {
    const frame = (image.closest(".pci-duo__panel") ?? image.parentElement) as HTMLElement;
    gsap.fromTo(
      image,
      { "--img-y": "-6%" },
      {
        "--img-y": "6%",
        ease: "none",
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });

  // The concentric rings of the partnership band slowly turn.
  qsa(".pci-band").forEach((band) => {
    gsap.fromTo(
      band.querySelector(".pci-band__rings"),
      { "--pr": "-35deg" },
      {
        "--pr": "55deg",
        ease: "none",
        scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}
