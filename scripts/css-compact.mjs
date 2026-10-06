/* ==========================================================================
   css-compact — merge duplicate rules without changing the cascade
   --------------------------------------------------------------------------
   usage: node scripts/css-compact.mjs css/file.css [...more files]

   A later rule B with exactly the same selector list and at-rule context as an
   earlier rule A is folded into A when no rule between them could change the
   result. Moving B's declarations up only reorders them against the rules in
   between, and order only decides the cascade between declarations of equal
   importance and equal specificity. So a rule K in between blocks the merge
   only when it sets an overlapping property, could match the same element
   (same tag / id / pseudo-element, or unknown), and has the same specificity
   as B. When moving B up is blocked, moving A down into B is tried instead
   (only A's properties that B does not restate travel). Run Prettier afterwards.
   ========================================================================== */
import fs from "node:fs";
import postcss from "postcss";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { calculate } = require("specificity");

const SHORTHANDS = {
  margin: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  "margin-block": ["margin-top", "margin-bottom"],
  "margin-inline": ["margin-left", "margin-right"],
  padding: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  "padding-block": ["padding-top", "padding-bottom"],
  "padding-inline": ["padding-left", "padding-right"],
  inset: ["top", "right", "bottom", "left"],
  border: [
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "border-color",
    "border-width",
    "border-style",
  ],
  "border-top": ["border-top-color", "border-top-width", "border-top-style"],
  "border-right": ["border-right-color", "border-right-width", "border-right-style"],
  "border-bottom": ["border-bottom-color", "border-bottom-width", "border-bottom-style"],
  "border-left": ["border-left-color", "border-left-width", "border-left-style"],
  "border-color": ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
  "border-width": ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"],
  "border-style": ["border-top-style", "border-right-style", "border-bottom-style", "border-left-style"],
  "border-radius": [
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
  ],
  font: ["font-style", "font-variant", "font-weight", "font-size", "line-height", "font-family"],
  background: [
    "background-color",
    "background-image",
    "background-position",
    "background-size",
    "background-repeat",
    "background-clip",
    "background-origin",
    "background-attachment",
  ],
  flex: ["flex-grow", "flex-shrink", "flex-basis"],
  "flex-flow": ["flex-direction", "flex-wrap"],
  gap: ["row-gap", "column-gap"],
  "place-items": ["align-items", "justify-items"],
  "place-content": ["align-content", "justify-content"],
  overflow: ["overflow-x", "overflow-y"],
  outline: ["outline-color", "outline-width", "outline-style"],
  transition: ["transition-property", "transition-duration", "transition-timing-function", "transition-delay"],
  animation: [
    "animation-name",
    "animation-duration",
    "animation-timing-function",
    "animation-delay",
    "animation-iteration-count",
    "animation-direction",
    "animation-fill-mode",
    "animation-play-state",
  ],
  "grid-template": ["grid-template-columns", "grid-template-rows", "grid-template-areas"],
  "grid-area": ["grid-row-start", "grid-column-start", "grid-row-end", "grid-column-end"],
  "grid-column": ["grid-column-start", "grid-column-end"],
  "grid-row": ["grid-row-start", "grid-row-end"],
  "text-decoration": [
    "text-decoration-line",
    "text-decoration-color",
    "text-decoration-style",
    "text-decoration-thickness",
  ],
  "list-style": ["list-style-type", "list-style-position", "list-style-image"],
};

function longhands(prop, out = new Set()) {
  out.add(prop);
  for (const part of SHORTHANDS[prop] || []) longhands(part, out);
  return out;
}

function propertiesOf(rule) {
  const set = new Set();
  rule.walkDecls((d) => longhands(d.prop.toLowerCase()).forEach((p) => set.add(p)));
  return set;
}

function subject(selector) {
  // last compound, splitting only outside brackets/parentheses
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (depth === 0 && /[\s>+~]/.test(ch)) start = i + 1;
  }
  return selector.slice(start);
}

function facts(selector) {
  const s = subject(selector.trim());
  return {
    tag: (s.match(/^[a-z][a-z0-9]*/i) || [""])[0].toLowerCase(),
    id: (s.match(/#[\w-]+/) || [""])[0],
    pseudoElement: (s.match(/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[\w-]+)/) || ["", ""])[1],
  };
}

function disjoint(a, b) {
  const x = facts(a);
  const y = facts(b);
  return x.pseudoElement !== y.pseudoElement || (x.tag && y.tag && x.tag !== y.tag) || (x.id && y.id && x.id !== y.id);
}

function specificity(selector) {
  try {
    const result = calculate(selector);
    const s = Array.isArray(result) ? result[0] : result;
    return `${s.A},${s.B},${s.C}`;
  } catch {
    return "?";
  }
}

const context = (node) => {
  const parts = [];
  for (let p = node.parent; p && p.type === "atrule"; p = p.parent) parts.unshift(`@${p.name} ${p.params}`);
  return parts.join(" && ");
};

// Would moving `props` (declared by `moving`) past rule `between` change which declaration wins?
function blocks(between, moving, props = propertiesOf(moving)) {
  const shared = [...propertiesOf(between)].some((p) => props.has(p));
  if (!shared) return false;
  return between.selectors.some((k) =>
    moving.selectors.some((b) => !disjoint(k, b) && (specificity(k) === specificity(b) || specificity(k) === "?")),
  );
}

let total = 0;
for (const file of process.argv.slice(2)) {
  const root = postcss.parse(fs.readFileSync(file, "utf8"), { from: file });
  const rules = [];
  root.walkRules((rule) => {
    if (!(rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name))) rules.push(rule);
  });
  let merged = 0;
  for (let i = 0; i < rules.length; i++) {
    const a = rules[i];
    if (!a.parent) continue;
    for (let j = i + 1; j < rules.length; j++) {
      const b = rules[j];
      if (!b.parent || context(b) !== context(a) || b.selector !== a.selector) continue;
      const between = rules.slice(i + 1, j).filter((k) => k.parent);
      if (!between.some((k) => blocks(k, b))) {
        // Move B up into A: B's declarations now precede the rules in between.
        b.walkDecls((d) => {
          a.walkDecls(d.prop, (old) => old.remove());
          a.append(d.clone());
        });
        b.remove();
        merged++;
        continue;
      }
      // Otherwise move A down into B: only A's properties that B does not restate travel.
      const bProps = propertiesOf(b);
      const travelling = new Set([...propertiesOf(a)].filter((p) => !bProps.has(p)));
      if (between.some((k) => blocks(k, a, travelling))) continue;
      const declarations = [];
      a.walkDecls((d) => {
        if (![...longhands(d.prop.toLowerCase())].some((p) => bProps.has(p))) declarations.push(d.clone());
      });
      b.prepend(...declarations);
      a.remove();
      merged++;
      break;
    }
  }
  root.walkAtRules((at) => {
    if (at.nodes && at.nodes.length === 0) at.remove();
  });
  fs.writeFileSync(file, root.toString());
  console.log(`${file}: merged ${merged} duplicate rule${merged === 1 ? "" : "s"}`);
  total += merged;
}
if (process.argv.length > 2) console.log(`total: ${total}`);
