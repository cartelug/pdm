import { type Motion, qs } from "./types";

// The outlined wordmark fills with crimson as the footer arrives.
export function footer({ gsap }: Motion) {
  const wordmark = qs(".pci-footer__wordmark");
  if (!wordmark) return;
  gsap.fromTo(
    wordmark,
    { "--pci-fill": 0 },
    {
      "--pci-fill": 1,
      ease: "none",
      scrollTrigger: { trigger: wordmark, start: "top 98%", end: "bottom 98%", scrub: 0.6 },
    },
  );
}
