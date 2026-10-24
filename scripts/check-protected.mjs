import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(fs.readFileSync(path.join(root, "tests/protected-campaign/baseline.json"), "utf8"));
const failures = [];
for (const [file, expected] of Object.entries(baseline.files)) {
  const location = path.join(root, file);
  if (!fs.existsSync(location)) failures.push(file + " was removed");
  else if (crypto.createHash("sha256").update(fs.readFileSync(location)).digest("hex") !== expected)
    failures.push(file + " changed");
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  Object.keys(baseline.files).length +
    " protected campaign and legacy files match the recorded baseline; " +
    (baseline.presentationReviews?.length || 0) +
    " reviewed presentation exception(s); " +
    (baseline.functionalReviews?.length || 0) +
    " user-authorised functional exception(s).",
);
