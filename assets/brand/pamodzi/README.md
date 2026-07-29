# Pamodzi master mark — working web pack

This folder records the supplied Pamodzi logo as the approved master identity for Pamodzi for Development (previously labelled PCI in parts of the site).

## Current approval

`pamodzi-logo-source.png` is the approved master identity and must remain untouched. `pamodzi-logo-transparent.png` is the approved runtime presentation copy: it preserves the supplied red/black artwork exactly and removes only the light raster canvas for transparent placement.

Its SHA-256 fingerprint is:

`8CC5BD1FDB1A2B1F19DF4506AC7871CD289E387C617FA15D59421C3D902EA24B`

## Files

| File | Use |
| --- | --- |
| `pamodzi-logo-source.png` | Untouched supplied master. Preserve exactly. |
| `pamodzi-logo-transparent.png` | Approved transparent runtime presentation copy; use across the website. |
| `pamodzi-mark-primary.png` | Archived derivative. Do not use. |
| `pamodzi-mark-ink.png` | Archived derivative. Do not use. |
| `pamodzi-mark-light.png` | Archived derivative. Do not use. |
| `pamodzi-mark-red.png` | Archived derivative. Do not use. |

All files inside `v2/` are archived derivatives. They are not approved for runtime use.

The approved source is a 1273 × 965 raster image. The runtime copy retains that aspect ratio and artwork.

## Rules

1. Do not stretch, rotate, crop, recolour, filter, trace, shadow, outline, optimise or add a gradient to the mark.
2. Preserve its aspect ratio and place it on a quiet surface.
3. Use the transparent runtime copy on both light and dark surfaces; do not create a new light or recoloured version.
4. Use the transparent runtime copy for browser icons and compact placements.
5. The existing `../pci-mark.svg` is legacy artwork and must not be used at runtime.

## Brand hierarchy

- **Pamodzi for Development:** organisation identity across the institutional site, browser metadata, and the global preloader.
- **Faith in Motion:** campaign identity presented within the Pamodzi site and supported by its own campaign title.
- **Rotary:** partner identity can appear when separately supplied and approved; it is not a replacement for Pamodzi.

## Rollout plan

1. Use `pamodzi-logo-transparent.png` across navigation, footers, preloaders, browser icons and structured data.
2. Verify the stored master against the fingerprint above before every brand rollout.
3. Animate only the containing element; never alter the pixels of the logo.
4. Validate aspect ratio, mobile legibility and loading performance before publishing.
