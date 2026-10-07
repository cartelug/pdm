/* ==========================================================================
   css-hover — keep hover styles off touch screens
   --------------------------------------------------------------------------
   usage: node scripts/css-hover.mjs css/*.css          wrap unguarded :hover rules
          node scripts/css-hover.mjs --check css/*.css  fail if any are left

   On phones and tablets a tap triggers :hover and the style then sticks
   until the next tap elsewhere: lifted cards and highlighted buttons stay
   lifted. Every rule whose selector uses :hover is therefore wrapped, in
   place, in `@media (hover: hover)`. Wrapping does not change specificity or
   source order, so devices with a mouse see exactly what they saw before.
   Selector lists that mix hover and non-hover selectors (for example
   `a:hover, a:focus-visible`) are split so keyboard focus styles stay global.
   Rules already inside a hover, reduced-motion or print query are left alone.
   ========================================================================== */
import fs from "node:fs";
import postcss from "postcss";

const check = process.argv.includes("--check");
const files = process.argv.slice(2).filter((arg) => arg !== "--check");
const HOVER = /:hover\b/;
const GUARDED = /\bhover\s*:|prefers-reduced-motion|\bprint\b/;

function guarded(rule) {
  for (let node = rule.parent; node && node.type === "atrule"; node = node.parent) {
    if (/keyframes$/.test(node.name)) return true;
    if (node.name === "media" && GUARDED.test(node.params)) return true;
  }
  return false;
}

let unguarded = 0;
let wrapped = 0;

for (const file of files) {
  const root = postcss.parse(fs.readFileSync(file, "utf8"), { from: file });
  const targets = [];
  root.walkRules((rule) => {
    if (rule.selectors.some((selector) => HOVER.test(selector)) && !guarded(rule)) targets.push(rule);
  });
  unguarded += targets.length;
  if (check) {
    targets.forEach((rule) =>
      console.error(`${file}:${rule.source.start.line}  ${rule.selector.replace(/\s+/g, " ")}`),
    );
    continue;
  }
  for (const rule of targets) {
    const hoverSelectors = rule.selectors.filter((selector) => HOVER.test(selector));
    const otherSelectors = rule.selectors.filter((selector) => !HOVER.test(selector));
    const media = postcss.atRule({ name: "media", params: "(hover: hover)" });
    media.raws.before = rule.raws.before;
    if (otherSelectors.length) {
      // keep focus and other states global; the hover copy follows directly so order is unchanged
      const copy = rule.clone({ selectors: hoverSelectors });
      rule.selectors = otherSelectors;
      media.append(copy);
      rule.after(media);
    } else {
      rule.replaceWith(media);
      media.append(rule);
    }
    wrapped++;
  }
  fs.writeFileSync(file, root.toString());
}

if (check) {
  if (unguarded) {
    console.error(`\n${unguarded} :hover rule(s) are not inside @media (hover: hover). Run: npm run css:hover`);
    process.exit(1);
  }
  console.log("Every :hover rule is limited to devices that can hover.");
} else {
  console.log(`Wrapped ${wrapped} :hover rule(s) in @media (hover: hover).`);
}
