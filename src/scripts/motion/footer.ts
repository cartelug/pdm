import { type Motion, inView, qs } from "./types";

// Scene 6, the closing invitation (Beat 12). The thread arrives as a rule above the invitation, the outlined
// wordmark fills once, and the main action's arrow shifts once inside the button. Then everything is still:
// the visitor at the bottom of the page reads contact and navigation without anything moving beside them.
// The invitation's heading and actions are revealed by reveal.ts; this owns only the rule, wordmark and arrow.
export function footer({ gsap, ScrollTrigger, own, profile }: Motion) {
  const invitation = qs(".pci-footer__invitation");
  const thread = qs(".pci-footer__thread");
  if (invitation && thread && !inView(invitation, 0.9)) {
    gsap.set(thread, { scaleX: 0 });
    ScrollTrigger.create({
      trigger: invitation,
      start: "top 85%",
      once: true,
      onEnter: () =>
        own(() => {
          const timeline = gsap.timeline();
          timeline.to(thread, {
            scaleX: 1,
            duration: profile === "full" ? 0.9 : 0.6,
            ease: "power2.inOut",
            clearProps: "transform",
          });
          const arrow = qs(".pci-actions .pci-button .pci-icon", invitation);
          if (arrow)
            timeline.fromTo(
              arrow,
              { x: 0 },
              { x: 5, duration: 0.18, yoyo: true, repeat: 1, clearProps: "transform" },
              0.95,
            );
          return timeline;
        }),
    });
  }

  const wordmark = qs(".pci-footer__wordmark");
  if (!wordmark) return;
  if (inView(wordmark, 1)) {
    gsap.set(wordmark, { "--pci-fill": 1 });
    return;
  }
  gsap.set(wordmark, { "--pci-fill": 0 });
  ScrollTrigger.create({
    trigger: wordmark,
    start: "top 98%",
    once: true,
    onEnter: () => own(() => gsap.to(wordmark, { "--pci-fill": 1, duration: 1.2, ease: "power2.inOut" })),
  });
}
