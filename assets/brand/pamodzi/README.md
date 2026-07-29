# Pamodzi master mark — working web pack

This folder records the supplied Pamodzi logo as the approved master identity for Pamodzi for Development (previously labelled PCI in parts of the site).

## Current approval

`pamodzi-logo-source.png` is the only approved runtime logo. It must be used unchanged: do not redraw, trace, crop, recolour, optimise, filter or substitute it.

Its SHA-256 fingerprint is:

`8CC5BD1FDB1A2B1F19DF4506AC7871CD289E387C617FA15D59421C3D902EA24B`

## Files

| File | Use |
| --- | --- |
| `pamodzi-logo-source.png` | Untouched supplied source and only approved runtime logo. Preserve exactly. |
| `pamodzi-mark-primary.png` | Archived derivative. Do not use. |
| `pamodzi-mark-ink.png` | Archived derivative. Do not use. |
| `pamodzi-mark-light.png` | Archived derivative. Do not use. |
| `pamodzi-mark-red.png` | Archived derivative. Do not use. |

All files inside `v2/` are archived derivatives. They are not approved for runtime use.

The approved source is a 1273 × 965 raster image. Use it as supplied even when another file format would normally be preferred.

## Rules

1. Do not stretch, rotate, crop, recolour, filter, trace, shadow, outline, optimise or add a gradient to the mark.
2. Preserve its aspect ratio and place it on a quiet surface.
3. On dark surfaces, retain the logo’s own white background rather than making a new light version.
4. Use the master PNG itself for browser icons and compact placements. Do not create a substitute.
5. The existing `../pci-mark.svg` is legacy artwork and must not be used at runtime.

## Brand hierarchy

- **Pamodzi for Development:** organisation identity across the institutional site, browser metadata, and the global preloader.
- **Faith in Motion:** campaign identity presented within the Pamodzi site and supported by its own campaign title.
- **Rotary:** partner identity can appear when separately supplied and approved; it is not a replacement for Pamodzi.

## Rollout plan

1. Use only `pamodzi-logo-source.png` across navigation, footers, preloaders, browser icons and structured data.
2. Verify the stored file against the fingerprint above before every brand rollout.
3. Animate only the containing element; never alter the pixels of the logo.
4. Validate aspect ratio, mobile legibility and loading performance before publishing.
