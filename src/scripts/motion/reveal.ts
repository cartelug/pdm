import { type Motion, inView, qs, qsa } from "./types";

const HEADINGS = [
  ".pci-section-head h2",
  ".pci-split__aside h2",
  ".pci-statement",
  ".pci-quote",
  ".pci-band h2",
  ".pci-footer__invitation h2",
  ".pci-empty-state h3",
  ".pci-vm__panel p",
].join(",");

// Cards, rows and figures that carry a hairline. The line is drawn when the item arrives.
const RULES: Array<[selector: string, edge: "bottom" | "top"]> = [
  [".pci-row", "bottom"],
  [".pci-checks li", "bottom"],
  [".pci-fig", "bottom"],
  [".pci-column", "top"],
  [".pci-trust-points li", "top"],
];

export function reveal({ gsap, ScrollTrigger, SplitText, cleanups }: Motion) {
  // Headlines rise line by line out of a mask that leaves descenders and italic overhang alone.
  qsa(HEADINGS)
    .filter((heading) => !inView(heading))
    .forEach((heading) => {
      let played = false;
      SplitText.create(heading, {
        type: "lines",
        linesClass: "pci-split-line",
        // The text stays ordinary text for assistive technology; no aria-label is added to the element.
        aria: "none",
        autoSplit: true,
        onSplit(self) {
          self.lines.forEach((line) => {
            const mask = document.createElement("span");
            mask.className = "pci-split-mask";
            line.before(mask);
            mask.append(line);
          });
          if (played) return;
          const timeline = gsap.timeline({
            scrollTrigger: { trigger: heading, start: "top 88%", once: true, onEnter: () => (played = true) },
          });
          timeline.from(self.lines, { yPercent: 115, duration: 1.15, ease: "power4.out", stagger: 0.11 });
          // The italic accent arrives a beat later and slides into place, so the pairing reads as a pair.
          const accents = qsa("em", heading);
          if (accents.length)
            timeline.from(accents, { opacity: 0, x: -22, duration: 1.1, ease: "power3.out", stagger: 0.08 }, 0.28);
          return timeline;
        },
      });
    });

  // Blocks fade and lift. A block that holds a split headline only fades, so the two do not fight.
  qsa("[data-reveal]:not([data-project-status])")
    .filter((block) => !inView(block))
    .forEach((block) => {
      const lift = block.matches(HEADINGS) || block.querySelector(HEADINGS) ? 0 : 34;
      gsap.set(block, { opacity: 0, y: lift });
      ScrollTrigger.create({
        trigger: block,
        start: "top 90%",
        once: true,
        onEnter: () =>
          gsap.to(block, { opacity: 1, y: 0, duration: 0.95, ease: "power3.out", clearProps: "opacity,transform" }),
      });
    });

  qsa("[data-reveal-group]").forEach((group) => {
    const items = Array.from(group.children) as HTMLElement[];
    if (!items.length || inView(group, 0.8)) return;
    gsap.set(items, { opacity: 0, y: 44 });
    ScrollTrigger.create({
      trigger: group,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(items, {
          opacity: 1,
          y: 0,
          duration: 0.95,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "opacity,transform",
        }),
    });
  });

  // Photographs wipe open from the bottom edge while the picture inside settles from a slight zoom.
  qsa(".pci-project__media, .pci-duo__media, .pci-about__art")
    .filter((media) => !inView(media))
    .forEach((media) => {
      const radius = getComputedStyle(media).borderTopLeftRadius;
      const picture = qs("img", media);
      const timeline = gsap.timeline({ scrollTrigger: { trigger: media, start: "top 90%", once: true } });
      timeline.fromTo(
        media,
        { clipPath: `inset(100% 0 0 0 round ${radius})` },
        { clipPath: `inset(0% 0 0 0 round ${radius})`, duration: 1.4, ease: "power4.inOut", clearProps: "clipPath" },
      );
      if (picture)
        timeline.from(picture, { scale: 1.16, duration: 1.9, ease: "power3.out", clearProps: "transform" }, 0.05);
    });

  // Hairlines draw left to right.
  const ruled: Element[] = [];
  RULES.forEach(([selector, edge]) =>
    qsa(selector)
      .filter((item) => !inView(item, 1))
      .forEach((item, index) => {
        item.classList.add("pci-rule", "pci-rule--" + edge);
        ruled.push(item);
        ScrollTrigger.create({
          trigger: item,
          start: "top 92%",
          once: true,
          onEnter: () => {
            (item as HTMLElement).style.transitionDelay = (index % 4) * 0.08 + "s";
            item.classList.add("is-in");
          },
        });
      }),
  );
  cleanups.push(() =>
    ruled.forEach((item) => {
      item.classList.remove("pci-rule", "pci-rule--bottom", "pci-rule--top", "is-in");
      (item as HTMLElement).style.removeProperty("transition-delay");
    }),
  );

  // Pillar glyphs draw themselves.
  qsa(".pci-pillar-mark").forEach((mark) => {
    const paths = qsa("svg path", mark);
    if (!paths.length || inView(mark)) return;
    gsap.from(paths, {
      drawSVG: "0%",
      duration: 1.4,
      ease: "power2.inOut",
      stagger: 0.16,
      scrollTrigger: { trigger: mark, start: "top 88%", once: true },
    });
  });

  const note = qs(".pci-footer__invitation");
  if (note && !inView(note)) {
    gsap.from(qsa(".pci-footer__invitation .pci-actions > *"), {
      opacity: 0,
      y: 30,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: note, start: "top 70%", once: true },
    });
  }
}
