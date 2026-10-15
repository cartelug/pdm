import { type Motion, qsa } from "./types";

// A statement that is read as you scroll: each word comes up from a pale tone as the line passes
// through the middle of the screen. The words keep their full colour in the markup.
export function scrub({ gsap, SplitText }: Motion) {
  qsa("[data-scrub-words]").forEach((text) => {
    SplitText.create(text, {
      type: "words",
      wordsClass: "pci-scrub-word",
      aria: "none",
      autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(
          self.words,
          { opacity: 0.5 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: text, start: "top 78%", end: "bottom 48%", scrub: 0.4 },
          },
        );
      },
    });
  });
}
