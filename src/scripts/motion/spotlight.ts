import { stagger, tokens } from "./policy";
import { type Motion, inView, qs, qsa } from "./types";

// Scene 2, purpose and campus (Beats 03 and 04). One composition, one owner:
//   - the cover plane retracts once and the campus picture settles from a slight overscan;
//   - the crimson edge on the frame draws down, and the thread under the facts runs towards the action;
//   - status, facts and action settle as one short group; the button's arrow nudges once.
// On a mouse, the frame (not the picture, not any link) tilts a couple of degrees toward the pointer.
// Facts and wording come from the page; nothing here changes a value or invents an update.
export function spotlight({ gsap, ScrollTrigger, signal, pointerFine, profile, own }: Motion) {
  const section = qs(".pci-spotlight");
  if (!section) return;
  const t = tokens(profile);
  const frame = qs(".pci-spotlight__frame", section);
  const picture = frame && qs("img", frame);
  const cover = frame && qs(".pci-spotlight__cover", frame);
  const edge = frame && qs(".pci-spotlight__edge", frame);
  const copy = qs(".pci-spotlight__copy", section);
  const thread = qs(".pci-spotlight__thread", section);
  const caption = qs("figcaption", section);

  // Beat 03: open the campus frame.
  if (frame && picture && cover && !inView(frame, 0.92)) {
    gsap.set(cover, { scaleY: 1 });
    edge && gsap.set(edge, { scaleY: 0 });
    gsap.set(picture, { scale: profile === "full" ? 1.06 : 1.035 });
    ScrollTrigger.create({
      trigger: frame,
      start: "top 88%",
      once: true,
      onEnter: () =>
        own(() => {
          const timeline = gsap.timeline({ defaults: { ease: "power4.out" } });
          timeline
            .to(cover, { scaleY: 0, duration: profile === "full" ? 0.78 : 0.6, clearProps: "transform" }, 0)
            .to(picture, { scale: 1, duration: profile === "full" ? 1.1 : 0.8, clearProps: "scale,transform" }, 0)
            .from(caption, { opacity: 0, y: 8, duration: 0.4, ease: "power3.out", clearProps: "all" }, 0.12);
          if (edge) timeline.to(edge, { scaleY: 1, duration: 0.7, ease: "power3.out", clearProps: "transform" }, 0.3);
          return timeline;
        }),
    });
  }

  // Beat 04: resolve the facts into participation. Two small groups, each triggered by its own element,
  // because on a phone the campus picture sits between them (the copy wrapper is display: contents there).
  if (copy) {
    const arrival = (items: HTMLElement[], anchor: HTMLElement | null, extra?: (tl: gsap.core.Timeline) => void) => {
      if (!items.length || !anchor || inView(anchor, 0.86)) return;
      gsap.set(items, { opacity: 0, y: t.arrivalTravel });
      ScrollTrigger.create({
        trigger: anchor,
        start: "top 86%",
        once: true,
        onEnter: () =>
          own(() => {
            const timeline = gsap.timeline({ defaults: { ease: "power3.out", duration: t.sectionArrival } });
            timeline.to(items, {
              opacity: 1,
              y: 0,
              stagger: stagger(items.length, profile),
              clearProps: "opacity,transform",
            });
            extra?.(timeline);
            return timeline;
          }),
      });
    };
    const eyebrow = qs(":scope > .pci-eyebrow", copy);
    arrival(qsa(":scope > .pci-eyebrow, :scope > .pci-lead, :scope > .pci-spotlight__status", copy), eyebrow);

    const factsBox = qs(".pci-spotlight__facts", copy);
    const facts = qsa(".pci-spotlight__facts > div, :scope > .pci-actions, :scope > .pci-spotlight__note", copy);
    const arrow = qs(":scope > .pci-actions .pci-button .pci-icon", copy);
    const threadHidden = Boolean(thread && factsBox && !inView(factsBox, 0.86));
    if (thread && threadHidden) gsap.set(thread, { scaleX: 0 });
    arrival(facts, factsBox, (timeline) => {
      // The thread runs toward the action; the arrow inside the button shifts once when it arrives.
      if (thread && threadHidden)
        timeline.to(thread, { scaleX: 1, duration: 0.7, ease: "power2.inOut", clearProps: "transform" }, 0.2);
      if (arrow)
        timeline.fromTo(
          arrow,
          { x: 0 },
          { x: 5, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", clearProps: "transform" },
          0.8,
        );
    });
  }

  // Shallow frame depth on a mouse: at most 2 degrees on X and 3 on Y, returning to rest within 300 ms.
  if (pointerFine && profile === "full" && frame) {
    gsap.set(frame, { transformPerspective: 1400 });
    const rx = gsap.quickTo(frame, "rotationX", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(frame, "rotationY", { duration: 0.5, ease: "power3.out" });
    frame.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        const box = frame.getBoundingClientRect();
        const nx = ((event.clientX - box.left) / box.width) * 2 - 1;
        const ny = ((event.clientY - box.top) / box.height) * 2 - 1;
        ry(Math.max(-1, Math.min(1, nx)) * 3);
        rx(Math.max(-1, Math.min(1, ny)) * -2);
      },
      { signal, passive: true },
    );
    const rest = () => {
      rx(0);
      ry(0);
    };
    frame.addEventListener("pointerleave", rest, { signal });
    window.addEventListener("blur", rest, { signal });
  }
}
