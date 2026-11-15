// One timing language for every institutional scene. "compact" is a phone or a coarse pointer, "full" a
// tablet or desktop with room to compose. Reduced motion never reaches this module: the motion bundle is not
// started at all, and the CSS shows every scene in its final state.
export type MotionProfile = "compact" | "full";

export interface MotionTokens {
  feedback: number;
  sectionArrival: number;
  headingStagger: number;
  groupStaggerCap: number;
  arrivalTravel: number;
  imageSettleScale: number;
  sceneDepth: number;
  filter: number;
}

// Seconds for GSAP, pixels for distance. Values follow the brief's compact/full table.
const TOKENS: Record<MotionProfile, MotionTokens> = {
  compact: {
    feedback: 0.16,
    sectionArrival: 0.52,
    headingStagger: 0.045,
    groupStaggerCap: 0.18,
    arrivalTravel: 16,
    imageSettleScale: 1.025,
    sceneDepth: 8,
    filter: 0.28,
  },
  full: {
    feedback: 0.18,
    sectionArrival: 0.74,
    headingStagger: 0.075,
    groupStaggerCap: 0.3,
    arrivalTravel: 28,
    imageSettleScale: 1.04,
    sceneDepth: 24,
    filter: 0.42,
  },
};

// Media conditions shared with gsap.matchMedia, so a scene is rebuilt when the profile changes.
export const COMPACT = "(max-width: 899px), (pointer: coarse)";
export const FULL = "(min-width: 900px) and (pointer: fine)";
// The desktop director (desktop.ts) runs only on a wide screen with a mouse or trackpad.
export const DESKTOP = "(min-width: 1100px) and (hover: hover) and (pointer: fine)";

export const profile = (): MotionProfile => (matchMedia(COMPACT).matches ? "compact" : "full");
export const tokens = (which: MotionProfile = profile()): MotionTokens => TOKENS[which];

// Spread a group's stagger so the whole group never takes longer than the cap.
export const stagger = (count: number, which: MotionProfile = profile()) => {
  const t = TOKENS[which];
  const each = which === "compact" ? 0.05 : 0.075;
  return count > 1 ? Math.min(each, t.groupStaggerCap / (count - 1)) : 0;
};

// Normalised local progress inside a sub-range of a scene: p in [a, b] maps to [0, 1].
export const span = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / Math.max(1e-6, b - a)));

// On a desktop the director takes over these groups' children and these blocks from reveal.ts, so each
// element keeps a single owner.
export const DESKTOP_GROUPS = ".pci-cards, .pci-stats, .pci-principles, .pci-vm";
export const DESKTOP_BLOCKS = ".pci-card, .pci-notice, .pci-empty-state";
