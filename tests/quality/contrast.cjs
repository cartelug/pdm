/* Contrast gate: reads the colour pairs declared in src/design/tokens.json and measures each one with the
   WCAG 2.2 formula, for both brands. Pure arithmetic, no browser. Alpha tokens are blended over the background.
   Also confirms the roles that decision D6 keeps as fills only (gold, cyan, sun) still fail as text on light
   surfaces, so a change that makes them pass is noticed on purpose.
   usage: node tests/quality/contrast.cjs [--verbose] */
const fs = require("fs");
const path = require("path");

const tokens = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../src/design/tokens.json"), "utf8"));
const verbose = process.argv.includes("--verbose");

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const linear = (value) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Resolves a token to opaque channels over the given background (alpha tokens are blended).
function resolve(brand, name, over) {
  const definition = tokens.brands[brand];
  if (definition.colour[name]) return channels(definition.colour[name]);
  if (name === "on-deep-muted") {
    const fg = channels(definition.colour["on-deep"]);
    const a = definition.alpha["on-deep-muted"] / 100;
    return fg.map((c, i) => Math.round(c * a + over[i] * (1 - a)));
  }
  throw new Error(`${brand} has no colour called ${name}`);
}

let failures = 0;
const rows = [];
for (const brand of Object.keys(tokens.brands)) {
  for (const pair of tokens.contrast.pairs) {
    const bg = resolve(brand, pair.bg);
    const fg = resolve(brand, pair.fg, bg);
    const value = ratio(fg, bg);
    const ok = value >= pair.min;
    if (!ok) failures++;
    rows.push({ brand, text: `${pair.fg} on ${pair.bg}`, min: pair.min, value, ok, kind: pair.kind });
  }
  for (const pair of tokens.contrast.fillOnly[brand] || []) {
    const value = ratio(resolve(brand, pair.fg), resolve(brand, pair.bg));
    const ok = value < 4.5;
    if (!ok) failures++;
    rows.push({
      brand,
      text: `${pair.fg} on ${pair.bg} (fill only, must fail as text)`,
      min: "< 4.5",
      value,
      ok,
      kind: "fill",
    });
  }
}

for (const row of rows) {
  if (verbose || !row.ok) {
    console.log(
      `${row.ok ? "ok  " : "FAIL"} ${row.brand.padEnd(5)} ${row.text.padEnd(52)} ${row.value.toFixed(2).padStart(6)} (needs ${row.min})`,
    );
  }
}
if (failures) {
  console.error(`${failures} contrast rule(s) failed.`);
  process.exit(1);
}
console.log(
  `All ${rows.length} contrast rules pass for ${Object.keys(tokens.brands).join(" and ")} (tokens v${tokens.version}).`,
);
