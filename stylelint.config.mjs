/** Stylelint: correctness and consistency for css/. Formatting is Prettier's job. */
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // BEM (block__element--modifier) plus a few legacy Faith in Motion names that scripts depend on.
    "selector-class-pattern": [
      "^(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?|liveBand|liveIn|roadSVG)$",
      { message: "Use kebab-case or BEM class names" },
    ],
    // IDs are script hooks and use camelCase (e.g. #wfeShareFeedback).
    "selector-id-pattern": "^[a-z][a-zA-Z0-9-]*$",
    "keyframes-name-pattern": "^[a-z][a-zA-Z0-9-]*$",
    // Type-scale steps below the base size are written --t--1, --t--2.
    "custom-property-pattern": "^[a-z][a-z0-9]*(?:-{1,2}[a-z0-9]+)*$",
    // Range syntax `(width <= 760px)` needs Safari 16.4+; many visitors use older iPhones.
    "media-feature-range-notation": "prefix",
    // Still required by Safari for these properties.
    "property-no-vendor-prefix": [true, { ignoreProperties: ["-webkit-backdrop-filter", "-webkit-text-size-adjust", "-moz-appearance"] }],
    // Keywords are lower-case, but font family names keep their conventional capitals (Arial, Georgia).
    "value-keyword-case": ["lower", { ignoreProperties: ["font-family", "font", "/^--/"] }],
    // Component-grouped files intentionally revisit selectors at later breakpoints; cascade
    // order is verified by the regression tooling instead.
    "no-descending-specificity": null,
  },
};
