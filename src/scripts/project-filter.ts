// The project filter is one transaction: measure the old layout (if a visual owner wants it), apply the
// functional state (pressed button, hidden cards, count), then animate from the measured state, then ask for
// one layout refresh. The functional part works without any motion module; motion only wraps it.

export type FilterTransition = (apply: () => void, grid: HTMLElement) => void;

let transition: FilterTransition | null = null;

// The motion module registers its transition here and passes null on teardown.
export function setFilterTransition(next: FilterTransition | null): void {
  transition = next;
}

export function initProjectFilter(signal: AbortSignal): void {
  const grid = document.querySelector<HTMLElement>("[data-project-grid]");
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-project-filter]"));
  if (!buttons.length) return;
  const status = document.querySelector("[data-filter-count]");

  function apply(value: string, pressed: HTMLButtonElement) {
    buttons.forEach((el) => el.setAttribute("aria-pressed", String(el === pressed)));
    grid?.classList.toggle("is-filtered", value !== "all");
    let count = 0;
    document.querySelectorAll<HTMLElement>("[data-project-status]").forEach((card) => {
      card.hidden = value !== "all" && card.dataset.projectStatus !== value;
      if (!card.hidden) count++;
    });
    if (status) status.textContent = `${count} ${count === 1 ? "project" : "projects"} shown`;
  }

  buttons.forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        const value = button.dataset.projectFilter!;
        const run = () => apply(value, button);
        if (transition && grid) transition(run, grid);
        else run();
        window.dispatchEvent(new Event("pci:layout"));
      },
      { signal },
    ),
  );
}
