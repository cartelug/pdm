import { type Motion, inView, qs, qsa } from "./types";

/* The desktop director. Runs only on a wide screen with a mouse or trackpad (policy.ts DESKTOP), never on a
   phone, tablet or under reduced motion. Each effect carries an ID (D001...) that matches the plan in
   docs/quality/DESKTOP-MOTION-PLAN-2026-11-15.md.

   Rules every effect follows:
   - Arrivals are one-shot. Content already on screen (or above a restored reading position) is left alone.
   - Every arrival ends by clearing exactly the properties it set, so the page settles to its stylesheet.
   - This module only animates elements and properties no other owner animates. Where another module owns
     an element's transform or opacity, the director works on a child, a wrapper or a different property.
   - Pointer effects move decorative layers only (images, rings, light), never a link's hit area, and
     return to rest when the pointer leaves, the window blurs or the tab is hidden.
   - Scroll-linked effects map position directly (no lag) and stay within each image's overscan. */

type Targets = string | Element | Element[] | null | undefined;
interface Arrival {
  from: gsap.TweenVars;
  to?: gsap.TweenVars;
  trigger?: Element | null;
  start?: string;
  stagger?: number;
  duration?: number;
  ease?: string;
  delay?: number;
}

// The resting value for every property an arrival may start from.
const NEUTRAL: Record<string, number> = {
  opacity: 1,
  autoAlpha: 1,
  x: 0,
  y: 0,
  xPercent: 0,
  yPercent: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  rotationX: 0,
  rotationY: 0,
};
const TRANSFORM = new Set([
  "x",
  "y",
  "xPercent",
  "yPercent",
  "scale",
  "scaleX",
  "scaleY",
  "rotation",
  "rotationX",
  "rotationY",
  "transformPerspective",
  "transformOrigin",
  "svgOrigin",
]);

export function desktop(motion: Motion) {
  if (!motion.desktop) return;
  const { gsap, ScrollTrigger, own, signal, cleanups } = motion;
  // Load-time choreography waits for the brand intro to lift (intro.css sets --pci-intro; it is 0s when skipped).
  const introWait = () => {
    const intro = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pci-intro")) || 0;
    return Math.max(0, intro - performance.now() / 1000);
  };

  const list = (targets: Targets, root: ParentNode = document): Element[] =>
    !targets
      ? []
      : typeof targets === "string"
        ? qsa(targets, root)
        : Array.isArray(targets)
          ? targets.filter(Boolean)
          : [targets];

  // One-shot arrival: hide to `from`, then on entering resolve to the neutral state and clear what was set.
  const arrive = (targets: Targets, options: Arrival) => {
    const items = list(targets);
    const trigger = options.trigger ?? items[0];
    if (!items.length || !trigger || inView(trigger, 0.94)) return;
    const to: gsap.TweenVars = {};
    const clear = new Set<string>(["transition"]);
    for (const key of Object.keys(options.from)) {
      if (key in NEUTRAL) to[key] = NEUTRAL[key];
      if (TRANSFORM.has(key)) clear.add("transform");
      else if (key === "autoAlpha") clear.add("opacity").add("visibility");
      else if (key !== "transformPerspective") clear.add(key);
    }
    // A CSS transition on the same property would smooth every frame of the tween: suspend it in flight.
    gsap.set(items, { ...options.from, transition: "none" });
    ScrollTrigger.create({
      trigger,
      start: options.start ?? "top 86%",
      once: true,
      onEnter: () =>
        own(() =>
          gsap.to(items, {
            ...to,
            ...options.to,
            duration: options.duration ?? 0.8,
            ease: options.ease ?? "power3.out",
            stagger: options.stagger ?? 0,
            delay: options.delay ?? 0,
            clearProps: [...clear].join(","),
          }),
        ),
    });
  };

  // Scroll-linked, directly mapped to the element's pass through the screen.
  const drift = (
    target: Element | null,
    from: gsap.TweenVars,
    to: gsap.TweenVars,
    trigger?: Element | null,
    range = { start: "top bottom", end: "bottom top" },
  ) => {
    if (!target) return;
    gsap.fromTo(target, from, {
      ...to,
      ease: "none",
      scrollTrigger: { trigger: trigger ?? target, ...range, scrub: true },
    });
  };

  // Pointer depth for a decorative layer inside a host: follows the mouse, rests on leave/blur/hidden.
  const follow = (
    host: Element | null,
    layers: Array<{ target: Element | null; x?: number; y?: number; rx?: number; ry?: number }>,
  ) => {
    if (!host) return;
    const movers = layers
      .filter((layer) => layer.target)
      .map((layer) => {
        const t = layer.target!;
        if (layer.rx || layer.ry) gsap.set(t, { transformPerspective: 1100 });
        return {
          layer,
          x: layer.x ? gsap.quickTo(t, "x", { duration: 0.8, ease: "power3.out" }) : null,
          y: layer.y ? gsap.quickTo(t, "y", { duration: 0.8, ease: "power3.out" }) : null,
          rx: layer.rx ? gsap.quickTo(t, "rotationX", { duration: 0.6, ease: "power3.out" }) : null,
          ry: layer.ry ? gsap.quickTo(t, "rotationY", { duration: 0.6, ease: "power3.out" }) : null,
        };
      });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = (host as HTMLElement).getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
      for (const m of movers) {
        m.x?.(nx * (m.layer.x ?? 0));
        m.y?.(ny * (m.layer.y ?? 0));
        m.rx?.(-ny * (m.layer.rx ?? 0));
        m.ry?.(nx * (m.layer.ry ?? 0));
      }
    };
    const rest = () =>
      movers.forEach((m) => {
        m.x?.(0);
        m.y?.(0);
        m.rx?.(0);
        m.ry?.(0);
      });
    host.addEventListener("pointermove", move as EventListener, { signal, passive: true });
    host.addEventListener("pointerleave", rest, { signal });
    window.addEventListener("blur", rest, { signal });
    document.addEventListener("visibilitychange", rest, { signal });
  };

  // An arrow disc that turns into place, for buttons and links that arrive with their section.
  const spinIcons = (scope: Element | null, selector = ".pci-button .pci-icon") => {
    if (!scope) return;
    arrive(qsa(selector, scope), {
      from: { rotation: -120, scale: 0.6 },
      trigger: scope,
      start: "top 84%",
      duration: 0.7,
      ease: "back.out(1.6)",
      stagger: 0.06,
      delay: 0.25,
    });
  };

  /* ---------------------------------------------------------------- Shell (on load) */
  const header = qs(".pci-header");
  if (header && window.scrollY < 40) {
    own(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" }, delay: introWait() });
      const brand = qs(".pci-brand", header);
      const mark = qs(".pci-brand__mark", header);
      const navItems = qsa(".pci-desktop-nav .pci-nav-item, .pci-desktop-nav > ul > li", header);
      const chip = qs(".pci-campaign-chip", header);
      const cta = qs(".pci-header__cta", header);
      // D001 brand slides in from the left edge
      if (brand) timeline.from(brand, { x: -24, opacity: 0, duration: 0.6, clearProps: "transform,opacity" }, 0);
      // D002 logo mark opens from its centre (brand rule: only the container moves; never rotated)
      if (mark)
        timeline.from(
          mark,
          {
            clipPath: "circle(0% at 50% 50%)",
            scale: 0.8,
            duration: 0.8,
            ease: "power3.out",
            clearProps: "transform,clipPath",
          },
          0.05,
        );
      // D003 navigation items drop in one after another
      if (navItems.length)
        timeline.from(
          navItems,
          { y: -14, opacity: 0, duration: 0.5, stagger: 0.05, clearProps: "transform,opacity" },
          0.12,
        );
      // D004 campaign chip slides in from the right
      if (chip) timeline.from(chip, { x: 24, opacity: 0, duration: 0.6, clearProps: "transform,opacity" }, 0.3);
      // D005 chip status dot gives one beat
      const dot = chip && qs(".pci-campaign-chip__status", chip);
      if (dot) timeline.from(dot, { opacity: 0, duration: 0.4, clearProps: "opacity" }, 0.55);
      // D006 contact button rises, its arrow disc turns in
      if (cta) timeline.from(cta, { y: -12, opacity: 0, duration: 0.5, clearProps: "transform,opacity" }, 0.36);
      const ctaIcon = cta && qs(".pci-icon", cta);
      if (ctaIcon)
        timeline.from(ctaIcon, { rotation: -140, duration: 0.7, ease: "back.out(1.6)", clearProps: "transform" }, 0.5);
      return timeline;
    });
  }

  /* ---------------------------------------------------------------- Home: opening journey */
  const hero = qs(".pci-hero");
  if (hero) {
    // D007 a soft crimson light follows the pointer across the photograph (decorative layer under the copy)
    const glow = qs(".pci-hero__glow", hero);
    if (glow) {
      const gx = gsap.quickTo(glow, "x", { duration: 1.1, ease: "power3.out" });
      const gy = gsap.quickTo(glow, "y", { duration: 1.1, ease: "power3.out" });
      gsap.set(glow, { opacity: 0 });
      hero.addEventListener(
        "pointermove",
        (event) => {
          if (event.pointerType !== "mouse") return;
          const box = hero.getBoundingClientRect();
          gx(event.clientX - box.left);
          gy(event.clientY - box.top);
          gsap.to(glow, { opacity: 1, duration: 0.5, overwrite: "auto" });
        },
        { signal, passive: true },
      );
      hero.addEventListener("pointerleave", () => gsap.to(glow, { opacity: 0, duration: 0.6, overwrite: "auto" }), {
        signal,
      });
    }
    // D008 the photograph gently pushes in as the hero leaves (picture layer; the img owns its own offset)
    drift(qs(".pci-hero__media picture", hero), { scale: 1 }, { scale: 1.07 }, hero, {
      start: "top top",
      end: "bottom top",
    });
    // D009 the campaign cards lift away faster than the page as the hero leaves (moving their aside, so each
    // card keeps its own hover lift)
    drift(qs(".pci-hero__live", hero), { y: 0 }, { y: -48 }, hero, { start: "top top", end: "bottom top" });
    // D010 the accent underline thickens as the reader moves on
    drift(qs(".pci-hero__line em", hero), { backgroundSize: "100% 0.07em" }, { backgroundSize: "100% 0.13em" }, hero, {
      start: "top top",
      end: "bottom top",
    });
    // D011 campaign card arrow discs turn into place after the cards arrive
    own(() =>
      gsap.from(qsa(".pci-live__go", hero), {
        x: 0,
        y: 0,
        yPercent: -50,
        rotation: -135,
        scale: 0.6,
        duration: 0.8,
        ease: "back.out(1.7)",
        stagger: 0.1,
        delay: 0.75 + introWait(),
        clearProps: "transform",
      }),
    );
    // D012 hero action discs turn in with the actions
    own(() =>
      gsap.from(qsa(".pci-actions .pci-button .pci-icon", hero), {
        rotation: -120,
        duration: 0.7,
        ease: "back.out(1.6)",
        stagger: 0.08,
        delay: 0.42 + introWait(),
        clearProps: "transform",
      }),
    );
    // D013 the scroll cue fades away as soon as reading starts
    drift(qs(".pci-hero__cue", hero), { opacity: 1 }, { opacity: 0 }, hero, { start: "top top", end: "15% top" });
    // D014 the caption slides off with the image
    drift(qs(".pci-hero__caption", hero), { y: 0 }, { y: 24 }, hero, { start: "top top", end: "bottom top" });
  }

  // D015 the principle numbers flip up as the strip appears
  const strip = qs(".pci-strip");
  if (strip)
    own(() =>
      gsap.from(qsa("li span", strip), {
        rotationX: -90,
        opacity: 0,
        transformPerspective: 400,
        duration: 0.6,
        stagger: 0.04,
        delay: 0.7 + introWait(),
        ease: "back.out(1.5)",
        clearProps: "transform,opacity",
      }),
    );

  /* ---------------------------------------------------------------- Section language, every page */
  qsa(".pci-section-head, .pci-route__head, .pci-split__aside").forEach((head) => {
    // D016 section eyebrows slide in from the left with the heading
    arrive(qs(".pci-eyebrow", head), { from: { x: -28, opacity: 0 }, trigger: head, duration: 0.7 });
    // D017 lead paragraphs follow the heading a beat later
    arrive(qs(".pci-lead", head), { from: { y: 26, opacity: 0 }, trigger: head, duration: 0.85, delay: 0.18 });
  });
  // D018 section text links draw in from the left (clip; focus clears it at once)
  qsa("main .pci-section .pci-text-link, main .pci-route .pci-text-link").forEach((link) =>
    arrive(link, {
      from: { clipPath: "inset(0 100% 0 0)" },
      to: { clipPath: "inset(0 0% 0 0)" },
      duration: 0.9,
      ease: "power2.inOut",
      delay: 0.2,
    }),
  );
  // D019 section buttons: their arrow discs turn into place
  qsa("main .pci-section:not(.pci-spotlight) .pci-actions").forEach((actions) => spinIcons(actions));

  /* ---------------------------------------------------------------- Campus */
  const spot = qs(".pci-spotlight");
  if (spot) {
    // D020 the campus picture drifts inside its window (picture layer, overscanned in CSS)
    drift(
      qs(".pci-spotlight__frame picture", spot),
      { yPercent: -3, scale: 1.08 },
      { yPercent: 3, scale: 1.08 },
      qs(".pci-spotlight__frame", spot),
    );
    // D021 the background light moves against the scroll
    drift(qs(".pci-spotlight__glow", spot), { y: -60 }, { y: 80 }, spot);
    // D022 the caption rule draws under the figure
    arrive(qs("figcaption", spot), { from: { x: -20 }, duration: 0.9 });
  }

  /* ---------------------------------------------------------------- Route */
  const road = qs(".pci-route");
  if (road) {
    const stage = qs(".pci-route__stage", road);
    // D023 the route drawing settles from slightly smaller (the stage itself fades in via reveal.ts)
    arrive(qs(".pci-route__svg--wide", road), {
      from: { scale: 0.94, transformOrigin: "50% 100%" },
      trigger: stage,
      duration: 1.1,
    });
    // D024 / D025 start and destination labels arrive from their own sides
    const labels = qsa(".pci-route__labels > div", road);
    arrive(labels[0], { from: { x: -40, opacity: 0 }, trigger: stage, start: "top 70%", duration: 0.8 });
    arrive(labels[1], { from: { x: 40, opacity: 0 }, trigger: stage, start: "top 70%", duration: 0.8, delay: 0.12 });
    // D026 / D027 both route pins pop into place
    const pins = qsa(".pci-route__svg--wide .pci-route__pin", road);
    pins.forEach((pin, index) => {
      const circle = pin.querySelector("circle");
      arrive(pin, {
        from: { scale: 0, svgOrigin: `${circle?.getAttribute("cx")} ${circle?.getAttribute("cy")}` },
        trigger: stage,
        start: "top 78%",
        duration: 0.7,
        ease: "back.out(2)",
        delay: index * 0.15,
      });
    });
    // D028 the faint track flows towards the destination while the section is read
    const track = qs<SVGPathElement>(".pci-route__svg--wide .pci-route__track", road);
    if (track) {
      gsap.fromTo(
        track,
        { strokeDashoffset: 0 },
        {
          strokeDashoffset: -0.12,
          ease: "none",
          scrollTrigger: { trigger: road, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
      cleanups.push(() => track.style.removeProperty("stroke-dashoffset"));
    }
    // D029 the background light drifts
    drift(qs(".pci-route__glow", road), { y: 60 }, { y: -80 }, road);
    // D030 the explanatory note settles last
    arrive(qs(".pci-route__note", road), { from: { y: 16, opacity: 0 }, duration: 0.7 });
  }

  /* ---------------------------------------------------------------- Programme stage */
  const pillars = qs(".pci-pillars");
  if (pillars) {
    const stage = qs(".pci-pillars__stage", pillars);
    // D031 the stage card rises and settles from a slightly smaller size
    arrive(pillars, { from: { y: 50, scale: 0.97, transformOrigin: "50% 0%" }, duration: 1.1, start: "top 90%" });
    // D032 the halo light swells in
    arrive(qs(".pci-pillars__halo", pillars), {
      // The halo, ring and floor are centred with CSS translate; GSAP owns their transform while they move,
      // so the same centring travels in the tween.
      from: { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 0.5, opacity: 0 },
      to: { xPercent: -50, yPercent: -50 },
      trigger: pillars,
      duration: 1.4,
      delay: 0.1,
    });
    // D033 the orbit ring turns into place
    arrive(qs(".pci-pillars__ring", pillars), {
      from: { x: 0, y: 0, xPercent: -50, yPercent: -50, rotation: -60, opacity: 0 },
      to: { xPercent: -50, yPercent: -50 },
      trigger: pillars,
      duration: 1.3,
      ease: "power2.out",
      delay: 0.15,
    });
    // D034 the four coins pop onto the ring in order
    arrive(qsa(".pci-pillar__coin", pillars), {
      from: { scale: 0, opacity: 0 },
      trigger: pillars,
      duration: 0.7,
      ease: "back.out(1.8)",
      stagger: 0.1,
      delay: 0.45,
    });
    // D035 the coin labels follow
    arrive(qsa(".pci-pillar__label", pillars), {
      from: { y: 8 },
      trigger: pillars,
      duration: 0.5,
      stagger: 0.08,
      delay: 0.7,
    });
    // D036 the sculpture rises from its floor
    arrive(qsa(".pci-pillars__sculpture img", pillars), {
      from: { y: 70, opacity: 0 },
      trigger: pillars,
      duration: 1.2,
      delay: 0.25,
    });
    // D037 the floor shadow spreads beneath it
    arrive(qs(".pci-pillars__floor", pillars), {
      from: { x: 0, y: 0, xPercent: -50, scaleX: 0.2, opacity: 0 },
      to: { xPercent: -50 },
      trigger: pillars,
      duration: 1.1,
      delay: 0.35,
    });
    // D038 - D041 the chosen pillar's title, summary, list and link arrive in sequence
    const panel = qs('[role="tabpanel"][data-pillar="' + (pillars.dataset.active || "education") + '"]', pillars);
    if (panel) {
      arrive(qs("h3", panel), { from: { y: 30, opacity: 0 }, trigger: pillars, duration: 0.8, delay: 0.2 });
      arrive(qs(".pci-pillars__summary", panel), {
        from: { y: 22, opacity: 0 },
        trigger: pillars,
        duration: 0.8,
        delay: 0.32,
      });
      arrive(qsa(".pci-pillars__covers li", panel), {
        from: { x: -24, opacity: 0 },
        trigger: pillars,
        duration: 0.6,
        stagger: 0.07,
        delay: 0.42,
      });
      arrive(qs(".pci-pillars__go", panel), {
        from: { y: 14, opacity: 0 },
        trigger: pillars,
        duration: 0.6,
        delay: 0.7,
      });
    }
    // D042 the sculpture tilts toward the pointer (decorative art layer; tabs and links stay still)
    follow(stage, [{ target: qs(".pci-pillars__art", pillars), rx: 5, ry: 8 }]);
    // D043 the art note settles under the stage
    arrive(qs(".pci-art-note"), { from: { y: 14, opacity: 0 }, duration: 0.6 });
  }

  /* ---------------------------------------------------------------- Who we are */
  const manifesto = qs(".pci-manifesto");
  if (manifesto) {
    // D044 the three commitments slide in one after another
    arrive(qsa(".pci-trio li", manifesto), { from: { x: -36, opacity: 0 }, duration: 0.7, stagger: 0.1 });
    // D045 the portrait turns slightly into place
    arrive(qs(".pci-about__art", manifesto), { from: { rotation: -6, scale: 0.92 }, duration: 1.3 });
    // D046 the supporting paragraphs follow
    arrive(qsa(".pci-manifesto__aside > p", manifesto), {
      from: { y: 22, opacity: 0 },
      duration: 0.7,
      stagger: 0.1,
      delay: 0.2,
    });
  }

  /* ---------------------------------------------------------------- Projects */
  const carousel = qs("[data-carousel]");
  if (carousel) {
    const track = qs("[data-carousel-track]", carousel);
    const visible = qsa(".pci-project", carousel).filter((card) => {
      const box = card.getBoundingClientRect();
      return track && box.left < track.getBoundingClientRect().right;
    });
    // D047 the visible project cards glide in from the right, in order
    arrive(visible, { from: { x: 90, opacity: 0 }, trigger: carousel, duration: 1, stagger: 0.1 });
    // D048 status chips pop onto the cards
    arrive(qsa(".pci-project__state", carousel), {
      from: { scale: 0.6, opacity: 0 },
      trigger: carousel,
      duration: 0.6,
      ease: "back.out(1.8)",
      stagger: 0.08,
      delay: 0.5,
    });
    // D049 the progress line draws
    arrive(qs(".pci-carousel__progress", carousel), {
      from: { scaleX: 0, transformOrigin: "0 50%" },
      trigger: carousel,
      duration: 1.1,
      ease: "power2.inOut",
      delay: 0.3,
    });
    // D050 the arrow buttons pop in
    arrive(qsa(".pci-carousel__button", carousel), {
      from: { scale: 0.5, opacity: 0 },
      trigger: carousel,
      duration: 0.6,
      ease: "back.out(1.8)",
      stagger: 0.08,
      delay: 0.5,
    });
  }
  // D051 project pictures tilt a few degrees toward the pointer (picture window only, not the link)
  qsa(".pci-project__media").forEach((media) =>
    follow(media.closest(".pci-project"), [{ target: media, rx: 3, ry: 4 }]),
  );
  // D052 the project grid cards (projects page) rise in a short wave
  const grid = qs("[data-project-grid]");
  if (grid) arrive(qsa("[data-project-status]", grid), { from: { y: 60, opacity: 0 }, duration: 0.9, stagger: 0.08 });
  // D053 the filter pills slide in
  arrive(qsa(".pci-filter-bar button"), { from: { y: 14, opacity: 0 }, duration: 0.5, stagger: 0.05 });

  /* ---------------------------------------------------------------- Work in practice */
  const practice = qs(".pci-practice");
  if (practice) {
    // D054 the backdrop picture drifts behind the section (overscanned in CSS)
    drift(
      qs(".pci-practice__backdrop picture", practice),
      { yPercent: -5, scale: 1.12 },
      { yPercent: 5, scale: 1.12 },
      practice,
    );
    // D055 the illustration caption slides in
    arrive(qs(".pci-practice__caption", practice), { from: { x: -24, opacity: 0 }, duration: 0.8 });
  }

  /* ---------------------------------------------------------------- Two campaigns */
  const duo = qs(".pci-duo");
  if (duo) {
    const panels = qsa(".pci-duo__panel", duo);
    // D056 / D057 the two campaign panels arrive from opposite sides
    panels.forEach((panel, index) =>
      arrive(panel, { from: { x: index ? 70 : -70, opacity: 0 }, trigger: duo, duration: 1.1, delay: index * 0.12 }),
    );
    // D058 each panel's status, title, text and link follow in sequence
    panels.forEach((panel) =>
      arrive(qsa(".pci-duo__body > *", panel), {
        from: { y: 24, opacity: 0 },
        trigger: duo,
        duration: 0.7,
        stagger: 0.07,
        delay: 0.45,
      }),
    );
    // D059 the panel photograph leans toward the pointer
    panels.forEach((panel) => follow(panel, [{ target: qs(".pci-duo__media", panel), x: 14, y: 10 }]));
  }

  /* ---------------------------------------------------------------- Partnership band */
  const band = qs(".pci-band");
  if (band) {
    // D060 the backdrop illustration drifts (overscanned in CSS)
    drift(qs(".pci-band__backdrop picture", band), { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1.12 }, band);
    // D061 the six rings draw themselves from the inside out
    const circles = qsa<SVGCircleElement>(".pci-band__rings circle", band).reverse();
    if (circles.length && !inView(band, 0.94))
      gsap.from(circles, {
        drawSVG: "0%",
        duration: 1.6,
        ease: "power2.inOut",
        stagger: 0.12,
        scrollTrigger: { trigger: band, start: "top 80%", once: true },
      });
    // D062 the rings lean toward the pointer
    follow(band, [{ target: qs(".pci-band__rings", band), x: 26, y: 18 }]);
    // D063 the partnership tags pop in
    arrive(qsa(".pci-tags span", band), {
      from: { scale: 0.7, opacity: 0 },
      duration: 0.55,
      ease: "back.out(1.8)",
      stagger: 0.05,
      delay: 0.2,
    });
    // D064 the caption slides in
    arrive(qs(".pci-band__caption", band), { from: { x: 24, opacity: 0 }, duration: 0.8 });
  }

  /* ---------------------------------------------------------------- Model */
  qsa("[data-model-path]").forEach((model) => {
    // D065 the nine stages slide in from the right in a short wave
    arrive(qsa(".pci-model li", model), { from: { x: 50, opacity: 0 }, duration: 0.7, stagger: 0.05 });
    // D066 each stage's arrow turns into place
    arrive(qsa(".pci-model__arrow", model), {
      from: { rotation: -90, opacity: 0 },
      trigger: qs(".pci-model", model),
      duration: 0.6,
      stagger: 0.05,
      delay: 0.3,
    });
    // D067 the model note settles last
    arrive(qs(".pci-model__note", model), { from: { y: 18, opacity: 0 }, duration: 0.7 });
  });

  /* ---------------------------------------------------------------- Cards, rows and figures (every page) */
  qsa(".pci-cards").forEach((cards) => {
    // D068 cards fold up into place in a short wave
    arrive(qsa(":scope > .pci-card", cards), {
      from: { y: 50, rotationX: 14, opacity: 0, transformPerspective: 900, transformOrigin: "50% 100%" },
      duration: 0.9,
      stagger: 0.07,
    });
    // D069 card labels slide in after their card
    arrive(qsa(".pci-card__label", cards), {
      from: { x: -16, opacity: 0 },
      trigger: cards,
      duration: 0.6,
      stagger: 0.07,
      delay: 0.25,
    });
    // D070 card arrow discs turn in
    arrive(qsa(".pci-card--link .pci-icon", cards), {
      from: { rotation: -120, scale: 0.5 },
      trigger: cards,
      duration: 0.7,
      ease: "back.out(1.7)",
      stagger: 0.07,
      delay: 0.35,
    });
  });
  qsa(".pci-rows").forEach((rows) =>
    qsa(".pci-row", rows).forEach((row) => {
      // D071 row numbers slide in from the margin
      arrive(qs(".pci-row__no", row), { from: { x: -30, opacity: 0 }, trigger: row, duration: 0.7 });
      // D072 row text rises in after the number
      arrive(qs(".pci-row__text", row), { from: { y: 24, opacity: 0 }, trigger: row, duration: 0.8, delay: 0.1 });
      // D073 row tags pop in
      arrive(qsa(".pci-tags span", row), {
        from: { scale: 0.75, opacity: 0 },
        trigger: row,
        duration: 0.5,
        ease: "back.out(1.8)",
        stagger: 0.04,
        delay: 0.3,
      });
    }),
  );
  // D074 check marks pop and turn into place
  qsa(".pci-checks").forEach((checks) =>
    arrive(qsa(".pci-checks__mark", checks), {
      from: { scale: 0, rotation: -90 },
      duration: 0.6,
      ease: "back.out(2)",
      stagger: 0.06,
    }),
  );
  // D075 figures rise as a group
  qsa(".pci-figs").forEach((figs) =>
    arrive(qsa(".pci-fig", figs), { from: { y: 40, opacity: 0 }, duration: 0.8, stagger: 0.08 }),
  );
  // D076 the large figure numbers lift out of their line
  qsa(".pci-figs").forEach((figs) =>
    arrive(qsa(".pci-fig b", figs), {
      from: { yPercent: 60 },
      trigger: figs,
      duration: 0.9,
      stagger: 0.08,
      delay: 0.1,
    }),
  );
  // D077 statistic cards flip up (their counts are counters.ts)
  qsa(".pci-stats").forEach((stats) =>
    arrive(qsa(".pci-stat", stats), {
      from: { y: 46, rotationX: 18, transformPerspective: 900, opacity: 0 },
      duration: 0.9,
      stagger: 0.1,
    }),
  );
  // D078 vision and mission panels arrive from opposite sides
  qsa(".pci-vm__panel").forEach((panel, index) =>
    arrive(panel, { from: { x: index % 2 ? 50 : -50, opacity: 0 }, duration: 1 }),
  );
  // D079 timeline entries slide in along the line
  qsa(".pci-timeline").forEach((timeline) =>
    qsa(".pci-timeline__item", timeline).forEach((item) =>
      arrive(item, { from: { x: 40, opacity: 0 }, duration: 0.8 }),
    ),
  );
  // D080 timeline dates lift in ahead of their entries
  qsa(".pci-timeline__when").forEach((when) => arrive(when, { from: { y: 12, opacity: 0 }, duration: 0.6 }));
  // D081 notices open from their leading edge
  qsa(".pci-notice").forEach((notice) =>
    arrive(notice, {
      from: { clipPath: "inset(0 100% 0 0 round 16px)" },
      to: { clipPath: "inset(0 0% 0 0 round 16px)" },
      duration: 1,
      ease: "power3.inOut",
    }),
  );
  // D082 tags outside rows and the band pop in
  qsa(".pci-tags").forEach((tags) => {
    if (tags.closest(".pci-row, .pci-band")) return;
    arrive(qsa(":scope > *", tags), {
      from: { scale: 0.75, opacity: 0 },
      trigger: tags,
      duration: 0.5,
      ease: "back.out(1.8)",
      stagger: 0.04,
    });
  });
  // D083 programme icons (what we do) turn into place
  qsa(".pci-pillar-icon").forEach((icon) =>
    arrive(icon, { from: { rotation: -45, scale: 0.6, opacity: 0 }, duration: 0.9, ease: "back.out(1.6)" }),
  );
  // D084 sub-navigation links slide in
  qsa(".pci-subnav").forEach((nav) =>
    arrive(qsa("a", nav), { from: { y: 12, opacity: 0 }, duration: 0.5, stagger: 0.04 }),
  );
  // D085 contact options rise one after another
  qsa(".pci-contact-options").forEach((options) =>
    arrive(qsa(":scope > *", options), { from: { y: 30, opacity: 0 }, duration: 0.7, stagger: 0.08 }),
  );
  // D086 apartment facts and principles arrive as small groups
  qsa(".pci-facts, .pci-principles").forEach((group) =>
    arrive(qsa(":scope > *", group), { from: { y: 30, opacity: 0 }, duration: 0.7, stagger: 0.07 }),
  );
  // D087 split-layout paragraphs follow their heading
  qsa(".pci-split__main").forEach((main) => {
    if (main.closest(".pci-band")) return;
    arrive(qsa(":scope > p:not(.pci-statement)", main), {
      from: { y: 22, opacity: 0 },
      duration: 0.75,
      stagger: 0.08,
      delay: 0.1,
    });
  });
  // D088 the update article's details settle under its title
  qsa(".pci-detail-meta").forEach((meta) =>
    arrive(qsa(":scope > *", meta), { from: { y: 12, opacity: 0 }, duration: 0.6, stagger: 0.05 }),
  );
  // D089 an empty state's message rises gently
  qsa(".pci-empty-state").forEach((empty) => arrive(empty, { from: { y: 24, opacity: 0 }, duration: 0.7 }));

  /* ---------------------------------------------------------------- Inner page openings */
  const pageHero = qs(".pci-page-hero");
  if (pageHero) {
    // The arches keep their own scroll separation (CSS translate); pointer depth moves their container.
    const art = qs(".pci-page-hero__art", pageHero);
    // D090 / D091 the arch artwork slides and turns a few degrees toward the pointer
    follow(pageHero, [{ target: art, x: 18, y: 12, rx: 3, ry: 5 }]);
    // D092 the breadcrumb trail settles with a short one-off nudge
    own(() =>
      gsap.from(qsa(".pci-breadcrumb li, .pci-breadcrumb > a, .pci-breadcrumb > span", pageHero), {
        x: -10,
        duration: 0.6,
        stagger: 0.05,
        delay: 0.1 + introWait(),
        ease: "power3.out",
        clearProps: "transform",
      }),
    );
  }

  /* ---------------------------------------------------------------- Footer */
  const footerEl = qs(".pci-footer");
  if (footerEl) {
    const grid = qs(".pci-footer__grid", footerEl);
    // D093 the footer columns rise in a wave
    arrive(qsa(":scope > div, :scope > nav", grid ?? footerEl), {
      from: { y: 36, opacity: 0 },
      trigger: grid,
      duration: 0.8,
      stagger: 0.08,
    });
    // D094 each column's links slide in from the left
    qsa(".pci-footer nav", footerEl).forEach((nav, index) =>
      arrive(qsa("a", nav), {
        from: { x: -14, opacity: 0 },
        trigger: grid,
        duration: 0.5,
        stagger: 0.035,
        delay: 0.25 + index * 0.06,
      }),
    );
    // D095 the logo opens from its centre (brand rule: never rotated)
    arrive(qs(".pci-brand__mark", footerEl), {
      from: { clipPath: "circle(0% at 50% 50%)", scale: 0.8 },
      to: { clipPath: "circle(75% at 50% 50%)" },
      trigger: grid,
      duration: 0.9,
      ease: "power3.out",
    });
    // D096 social links pop in
    arrive(qsa(".pci-footer__socials a", footerEl), {
      from: { scale: 0.7, opacity: 0 },
      duration: 0.5,
      ease: "back.out(1.8)",
      stagger: 0.05,
    });
    // D097 the wordmark rises from below its own baseline (its fill is footer.ts)
    arrive(qs(".pci-footer__wordmark", footerEl), {
      from: { yPercent: 45 },
      duration: 1.3,
      ease: "power4.out",
      start: "top 100%",
    });
    // D098 the closing text link's arrow turns into place (the buttons stay visible and still)
    spinIcons(qs(".pci-footer__invitation", footerEl), ".pci-text-link .pci-icon");
    // D099 the bottom line settles
    arrive(qs(".pci-footer__bottom", footerEl), { from: { y: 10, opacity: 0 }, duration: 0.6, start: "top 100%" });
  }

  /* ---------------------------------------------------------------- Light that follows the pointer */
  // D100 cards, figures, statistics and facts carry a soft light under the pointer (CSS reads --mx / --my)
  const LIT = ".pci-card, .pci-stat, .pci-spotlight__facts > div, .pci-column, .pci-contact-options > *, .pci-steps li";
  let lit: HTMLElement | null = null;
  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;
      const card = (event.target as Element | null)?.closest<HTMLElement>(LIT) ?? null;
      if (lit && lit !== card) lit.classList.remove("is-lit-pointer");
      lit = card;
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - box.left}px`);
      card.style.setProperty("--my", `${event.clientY - box.top}px`);
      card.classList.add("is-lit-pointer");
    },
    { signal, passive: true },
  );
  cleanups.push(() =>
    qsa(".is-lit-pointer, [style*='--mx']").forEach((card) => {
      card.classList.remove("is-lit-pointer");
      card.style.removeProperty("--mx");
      card.style.removeProperty("--my");
    }),
  );
}
