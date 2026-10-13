export async function initScrollMotion(): Promise<() => void> {
  const { default: gsap } = await import("gsap");
  let alive = true;
  let lenis: import("lenis").default | undefined;
  let ticker: ((time: number) => void) | undefined;
  const context = gsap.context(() => {
    gsap.from(".pci-hero__copy", { y: 20, duration: 0.8, ease: "power2.out", clearProps: "all" });
  });
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        context.add(() => {
          gsap.fromTo(entry.target, { y: 22 }, { y: 0, duration: 0.7, ease: "power2.out", clearProps: "transform" });
        });
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(".pci-section-heading,.pci-project,.pci-campaign-panel")
    .forEach((el) => observer.observe(el));
  const abort = new AbortController();
  const query = matchMedia("(min-width: 1161px) and (pointer: fine)");
  function stopLenis() {
    if (ticker) gsap.ticker.remove(ticker);
    lenis?.destroy();
    lenis = undefined;
    ticker = undefined;
  }
  async function prepareLenis() {
    stopLenis();
    if (!query.matches || !alive) return;
    const { default: Lenis } = await import("lenis");
    if (!alive || !query.matches) return;
    lenis = new Lenis({ autoRaf: false, duration: 0.9, anchors: true });
    ticker = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(ticker);
  }
  query.addEventListener("change", prepareLenis, { signal: abort.signal });
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
    abort.abort();
    stopLenis();
    observer.disconnect();
    context.revert();
  };
}
