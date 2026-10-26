/* The four-pillar stage: one sculpture is large, the other three wait on a ring, and choosing one turns the ring.
   The markup is complete without this script: every pillar's text and link is on the page. This adds the choosing,
   the arrow keys and, on a phone, a swipeable row of cards that stays in step with the stage. */

const wide = "(min-width: 1000px)";

export function initPillars(root: HTMLElement): void {
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const panels = root.querySelector<HTMLElement>("[data-pillars-panels]");
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
  if (!tabs.length || !panels || tabs.length !== cards.length) return;

  const desktop = matchMedia(wide);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let index = 0;
  let spin = 0;
  let steering = 0;

  root.classList.add("is-live");

  function select(next: number, options: { focus?: boolean; scroll?: boolean } = {}): void {
    if (next === index && root.dataset.ready) {
      if (options.focus) tabs[next].focus();
      return;
    }
    // The shortest way round the ring, so each step is a quarter turn.
    const delta = ((((next - index) % 4) + 6) % 4) - 2;
    const step = delta === -2 ? 2 : delta;
    spin -= step * 90;
    root.style.setProperty("--spin", `${spin}deg`);
    root.style.setProperty("--dir", step >= 0 ? "1" : "-1");
    index = next;
    root.dataset.active = tabs[next].dataset.pillar ?? "";
    root.dataset.ready = "true";
    tabs.forEach((tab, i) => {
      const on = i === next;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    if (options.focus) tabs[next].focus();
    if (options.scroll && !desktop.matches) {
      clearTimeout(steering);
      steering = window.setTimeout(() => {
        steering = 0;
        sync();
      }, 1200);
      panels!.scrollTo({
        left: cards[next].offsetLeft - panels!.offsetLeft,
        behavior: reduce.matches ? "auto" : "smooth",
      });
    }
  }

  // Start with the ring turned so the first pillar sits at the front.
  root.style.setProperty("--spin", "0deg");
  select(0);

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, { scroll: true }));
    tab.addEventListener("keydown", (event) => {
      const keys: Record<string, number> = {
        ArrowRight: index + 1,
        ArrowDown: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select((keys[event.key] + tabs.length) % tabs.length, { focus: true, scroll: true });
    });
  });

  // On a phone the cards swipe sideways; keep the stage in step with whichever card is in view.
  const sync = () => {
    if (desktop.matches) return;
    const first = cards[0].offsetLeft;
    const nearest = cards.reduce(
      (best, card, i) =>
        Math.abs(card.offsetLeft - first - panels.scrollLeft) <
        Math.abs(cards[best].offsetLeft - first - panels.scrollLeft)
          ? i
          : best,
      0,
    );
    if (nearest !== index) select(nearest);
  };
  let frame = 0;
  panels.addEventListener(
    "scroll",
    () => {
      if (steering) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    },
    { passive: true },
  );
  // A tap scrolls the cards by itself; once that has settled, catch up with any swipe that happened meanwhile.
  panels.addEventListener("scrollend", () => {
    if (!steering) return;
    clearTimeout(steering);
    steering = 0;
    sync();
  });

  desktop.addEventListener("change", () => {
    panels.scrollLeft = 0;
    if (!desktop.matches) panels.scrollTo({ left: cards[index].offsetLeft - panels.offsetLeft });
  });
}
