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

  // Content stays readable before enhancement and after cleanup.
  if (window.scrollY < 80) {
    context.add(() => {
      const lines = document.querySelectorAll(".pci-hero__line > span");
      if (!lines.length) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          ".pci-hero__arch img",
          { scale: 1.08, opacity: 0.7 },
          { scale: 1, opacity: 1, duration: 1.4, clearProps: "transform,opacity" },
          0,
        )
        .fromTo(
          ".pci-hero__sun",
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.1, clearProps: "transform,opacity" },
          0.2,
        )
        .fromTo(lines, { yPercent: 108 }, { yPercent: 0, duration: 0.9, stagger: 0.09, clearProps: "transform" }, 0.08)
        .fromTo(
          "[data-hero-detail],.pci-hero__caption",
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
            { y: desktop.matches ? 36 : 20, opacity: 0.2 },
            {
              y: 0,
              opacity: 1,
              duration: 0.85,
              stagger: grouped ? 0.09 : 0,
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
    .querySelectorAll("[data-reveal],[data-reveal-group],.pci-footer__invitation")
    .forEach((element) => revealObserver.observe(element));

  const models = Array.from(document.querySelectorAll<HTMLElement>("[data-model-path]"));
  const heroArch = document.querySelector<HTMLElement>(".pci-hero__arch");

  // One stage is "current": the one closest to a reading line a little above the middle of the screen.
  function paintScroll() {
    frame = 0;
    if (!alive || reduce.matches) return;
    models.forEach((container) => {
      const list = container.querySelector<HTMLElement>("[data-model]");
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight * 0.62 - rect.top) / Math.max(1, rect.height)));
      const path = container.querySelector<SVGElement>("[data-model-progress]");
      if (path) {
        path.style.strokeDasharray = "1";
        path.style.strokeDashoffset = String(1 - progress);
      }
      let current: Element | undefined;
      if (rect.top < innerHeight && rect.bottom > 0) {
        const line = innerHeight * 0.46;
        let best = Infinity;
        list.querySelectorAll<HTMLElement>("[data-model-stage]").forEach((stage) => {
          const box = stage.getBoundingClientRect();
          const distance = Math.abs(box.top + box.height / 2 - line);
          if (distance < best) {
            best = distance;
            current = stage;
          }
        });
      }
      const index = current?.getAttribute("data-model-stage");
      container
        .querySelectorAll("[data-model-stage]")
        .forEach((stage) => stage.classList.toggle("is-current", stage === current));
      container
        .querySelectorAll("[data-cycle-node]")
        .forEach((node) => node.classList.toggle("is-current", node.getAttribute("data-cycle-node") === index));
    });
    if (heroArch && desktop.matches) {
      const rect = heroArch.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) {
        heroArch.style.transform = `translateY(${Math.min(window.scrollY * 0.05, 36)}px)`;
      }
    }
  }
  function requestPaint() {
    if (!frame) frame = requestAnimationFrame(paintScroll);
  }
  window.addEventListener("scroll", requestPaint, { signal: abort.signal, passive: true });
  window.addEventListener("resize", requestPaint, { signal: abort.signal });
  paintScroll();

  function stopLenis() {
    if (ticker) gsap.ticker.remove(ticker);
    lenis?.destroy();
    lenis = undefined;
    ticker = undefined;
    heroArch?.style.removeProperty("transform");
  }
  async function prepareLenis() {
    const generation = ++lenisGeneration;
    stopLenis();
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
    document.querySelectorAll(".is-current").forEach((element) => element.classList.remove("is-current"));
    models.forEach((container) => container.querySelector("[data-model-progress]")?.removeAttribute("style"));
    context.revert();
  };
}
