type MenuState = "closed" | "opening" | "open" | "closing" | "navigating";

export function initGlobalNavigation(): () => void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-menu]");
  const trigger = document.querySelector<HTMLButtonElement>("[data-menu-open]");
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!dialog || !trigger || !header || typeof dialog.showModal !== "function") return () => {};
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let state: MenuState = "closed";
  let timer = 0;
  let frame = 0;
  let scrollY = 0;
  let previousFocus: HTMLElement | null = null;
  let bodyStyle = "";
  let htmlStyle = "";
  let locked = false;
  const inertState = new Map<HTMLElement, boolean>();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function setState(next: MenuState) {
    state = next;
    dialog!.dataset.state = next;
    window.dispatchEvent(new CustomEvent("pci:menu-state", { detail: next }));
  }
  function stopPending() {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  }
  function unlock() {
    if (!locked) return;
    document.body.style.cssText = bodyStyle;
    document.documentElement.style.cssText = htmlStyle;
    inertState.forEach((wasInert, element) => {
      element.inert = wasInert;
    });
    inertState.clear();
    window.scrollTo({ top: scrollY, behavior: "instant" });
    locked = false;
  }
  function finishClose(restoreFocus: boolean) {
    unlock();
    if (dialog!.open) dialog!.close();
    trigger!.setAttribute("aria-expanded", "false");
    trigger!.setAttribute("aria-label", "Open navigation");
    setState("closed");
    if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  }
  function close(restoreFocus = true, immediate = false, navigating = false) {
    if (state === "closed") return;
    stopPending();
    setState(navigating ? "navigating" : "closing");
    if (immediate || reduced.matches) finishClose(restoreFocus);
    else timer = window.setTimeout(() => finishClose(restoreFocus), 220);
  }
  function open() {
    stopPending();
    if (dialog!.open) {
      setState("open");
      return;
    }
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger;
    scrollY = window.scrollY;
    bodyStyle = document.body.style.cssText;
    htmlStyle = document.documentElement.style.cssText;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbar}px`;
    Array.from(document.body.children).forEach((child) => {
      if (child !== dialog && child instanceof HTMLElement && child.tagName !== "SCRIPT") {
        inertState.set(child, child.inert);
        child.inert = true;
      }
    });
    locked = true;
    setState("opening");
    dialog!.showModal();
    trigger!.setAttribute("aria-expanded", "true");
    trigger!.setAttribute("aria-label", "Close navigation");
    dialog!.querySelector<HTMLButtonElement>("[data-menu-close]")?.focus();
    frame = requestAnimationFrame(() => {
      if (state !== "opening") return;
      setState("open");
    });
  }
  trigger.hidden = false;
  document.querySelector<HTMLElement>("[data-nav-fallback]")?.setAttribute("hidden", "");
  trigger.addEventListener("click", () => (state === "closed" || state === "closing" ? open() : close()), options);
  dialog.querySelector("[data-menu-close]")?.addEventListener("click", () => close(), options);
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      close();
    },
    options,
  );
  dialog.addEventListener(
    "close",
    () => {
      if (locked) finishClose(false);
    },
    options,
  );
  dialog.addEventListener(
    "click",
    (event) => {
      if ((event.target as Element).closest("a[href]")) close(false, true, true);
      else if (event.target === dialog) close();
    },
    options,
  );
  dialog.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Tab") return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")).filter(
        (el) => el.getClientRects().length,
      );
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    },
    options,
  );
  function paintHeader() {
    header!.classList.toggle("is-scrolled", window.scrollY > 32);
  }
  paintHeader();
  window.addEventListener("scroll", paintHeader, { ...options, passive: true });
  window.addEventListener(
    "resize",
    () => {
      if (innerWidth >= 1100) close(false, true);
    },
    options,
  );
  window.addEventListener("popstate", () => close(false, true), options);
  return () => {
    stopPending();
    finishClose(false);
    controller.abort();
  };
}
