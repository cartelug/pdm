import { type Motion, qs, qsa } from "./types";

// The entrance itself is CSS (motion.css). This adds the scroll and pointer layers on top.
export function hero({ gsap, signal, pointerFine }: Motion) {
  const home = qs(".pci-hero");
  if (home) {
    const scrub = { ease: "none", scrollTrigger: { trigger: home, start: "top top", end: "bottom top", scrub: true } };
    gsap.to(".pci-hero__figure", { "--fig-y": "64px", ...scrub });
    gsap.to(".pci-hero__sun", { "--sun-y": "-90px", ...scrub });
    gsap.to(".pci-hero__copy", { "--copy-y": "-36px", ...scrub });
    gsap.to(".pci-hero__arch img", { "--img-y": "7%", ...scrub });

    if (pointerFine) {
      const layers = [
        { element: qs(".pci-hero__sun"), dx: 30, dy: 24 },
        { element: qs(".pci-hero__frame"), dx: -18, dy: -12 },
        { element: qs(".pci-hero__arch"), dx: 10, dy: 8 },
        { element: qs(".pci-hero__caption"), dx: -26, dy: -16 },
      ].flatMap(({ element, dx, dy }) =>
        element
          ? [
              {
                dx,
                dy,
                x: gsap.quickTo(element, "x", { duration: 1.3, ease: "power3.out" }),
                y: gsap.quickTo(element, "y", { duration: 1.3, ease: "power3.out" }),
              },
            ]
          : [],
      );
      const move = (event: PointerEvent) => {
        const box = home.getBoundingClientRect();
        const nx = ((event.clientX - box.left) / box.width) * 2 - 1;
        const ny = ((event.clientY - box.top) / box.height) * 2 - 1;
        layers.forEach((layer) => {
          layer.x(nx * layer.dx);
          layer.y(ny * layer.dy);
        });
      };
      const rest = () =>
        layers.forEach((layer) => {
          layer.x(0);
          layer.y(0);
        });
      home.addEventListener("pointermove", move, { signal });
      home.addEventListener("pointerleave", rest, { signal });
    }
  }

  const page = qs(".pci-page-hero");
  if (page) {
    qsa(".pci-page-hero__art span").forEach((span, index) => {
      gsap.to(span, {
        "--art-y": -28 * (index + 1) + "px",
        ease: "none",
        scrollTrigger: { trigger: page, start: "top top", end: "bottom top", scrub: true },
      });
    });
    gsap.to(".pci-page-hero__copy", {
      "--page-copy-y": "-40px",
      ease: "none",
      scrollTrigger: { trigger: page, start: "top top", end: "bottom top", scrub: true },
    });
  }
}
