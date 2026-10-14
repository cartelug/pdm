export async function initScrollMotion(): Promise<() => void> {
  const { default: gsap } = await import("gsap");
  const abort = new AbortController();
  const context = gsap.context(() => {});
  const desktop = matchMedia("(min-width: 1161px) and (pointer: fine)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let alive = true;
  let frame = 0;
  let lenis: import("lenis").default | undefined;
  let ticker: ((time: number) => void) | undefined;
  let lenisGeneration = 0;
  const floats = new Map<Element, ReturnType<typeof gsap.to>>();

  // Content stays readable before enhancement and after cleanup.
  if (window.scrollY < 80) {
    context.add(() => {
      const lines = document.querySelectorAll(".pci-hero__line > span");
      if (!lines.length) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".pci-hero__image img",
          { scale: 1.025, opacity: 0.8 },
          { scale: 1, opacity: 1, duration: 1.2, clearProps: "transform,opacity" },
          0,
        )
        .fromTo(lines, { yPercent: 108 }, { yPercent: 0, duration: 0.85, stagger: 0.09, clearProps: "transform" }, 0.08)
        .fromTo(
          "[data-hero-detail]",
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.065, clearProps: "transform,opacity" },
          0.35,
        );
    });
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        context.add(() => {
          const grouped = entry.target.hasAttribute("data-reveal-group");
          const targets = grouped ? Array.from(entry.target.children) : entry.target;
          gsap.fromTo(
            targets,
            { y: desktop.matches ? 30 : 18, opacity: 0.25 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              stagger: grouped ? 0.085 : 0,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
        });
        revealObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(
      ".pci-section-heading,.pci-project,.pci-campaign-panel,.pci-evidence,.pci-content .reveal,.pci-footer__invitation,[data-reveal-group]",
    )
    .forEach((element) => revealObserver.observe(element));

  const ambientObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const float = floats.get(entry.target);
      if (entry.isIntersecting && !document.hidden && desktop.matches) float?.play();
      else float?.pause();
    });
  });
  context.add(() => {
    document.querySelectorAll(".pci-connection-art").forEach((element) => {
      floats.set(
        element,
        gsap.to(element, {
          y: -8,
          rotation: 1.5,
          duration: 4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          paused: true,
        }),
      );
      ambientObserver.observe(element);
    });
  });

  const paths = Array.from(document.querySelectorAll<HTMLElement>("[data-model-path]"));
  const heroImage = document.querySelector<HTMLElement>(".pci-hero__image");
  const stageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-current", entry.isIntersecting));
    },
    { rootMargin: "-15% 0px -35% 0px", threshold: 0.1 },
  );
  document.querySelectorAll("[data-model-stage]").forEach((stage) => stageObserver.observe(stage));

  function paintScroll() {
    frame = 0;
    if (!alive || reduce.matches) return;
    paths.forEach((container) => {
      const rect = container.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight * 0.78 - rect.top) / Math.max(1, rect.height)));
      const path = container.querySelector<SVGPathElement>("[data-model-progress]");
      if (path) {
        path.style.strokeDasharray = "1";
        path.style.strokeDashoffset = String(1 - progress);
      }
    });
    if (heroImage && desktop.matches) {
      const rect = heroImage.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) {
        heroImage.style.transform = `translateY(${Math.min(window.scrollY * 0.035, 24)}px)`;
      }
    }
  }
  function requestPaint() {
    if (!frame) frame = requestAnimationFrame(paintScroll);
  }
  function updateFloats() {
    floats.forEach((float, element) => {
      const rect = element.getBoundingClientRect();
      if (!document.hidden && desktop.matches && rect.bottom > 0 && rect.top < innerHeight) float.play();
      else float.pause();
    });
  }
  window.addEventListener("scroll", requestPaint, { signal: abort.signal, passive: true });
  window.addEventListener("resize", requestPaint, { signal: abort.signal });
  document.addEventListener("visibilitychange", updateFloats, { signal: abort.signal });
  paintScroll();

  function stopLenis() {
    if (ticker) gsap.ticker.remove(ticker);
    lenis?.destroy();
    lenis = undefined;
    ticker = undefined;
    heroImage?.style.removeProperty("transform");
  }
  async function prepareLenis() {
    const generation = ++lenisGeneration;
    stopLenis();
    updateFloats();
    if (!desktop.matches || !alive || reduce.matches) return;
    const { default: Lenis } = await import("lenis");
    if (!alive || !desktop.matches || reduce.matches || generation !== lenisGeneration) return;
    lenis = new Lenis({ autoRaf: false, duration: 0.85, anchors: true });
    ticker = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(ticker);
  }
  desktop.addEventListener("change", prepareLenis, { signal: abort.signal });
  window.addEventListener(
    "pci:menu-state",
    ((event: CustomEvent) => {
      if (event.detail === "closed") lenis?.start();
      else lenis?.stop();
    }) as EventListener,
    { signal: abort.signal },
  );
  await prepareLenis();

  return () => {
    alive = false;
    lenisGeneration++;
    cancelAnimationFrame(frame);
    abort.abort();
    stopLenis();
    revealObserver.disconnect();
    ambientObserver.disconnect();
    stageObserver.disconnect();
    document.querySelectorAll(".is-current").forEach((element) => element.classList.remove("is-current"));
    paths.forEach((container) => container.querySelector("[data-model-progress]")?.removeAttribute("style"));
    context.revert();
  };
}
