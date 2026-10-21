/* Facts gate: a campaign fact has one home and every other place must agree with it.
   The canonical record is js/wfe-data.js (and assets/data/step-prices.json for the price table). This gate reads the
   record, then checks every other place the same fact is typed: browser scripts, server constants, the project
   card and the words and figures printed on the pages. It reads files only; it never edits any of them.

     node tests/quality/facts.cjs            list every home of each fact and every disagreement
     node tests/quality/facts.cjs --report   same, but always exit 0 (used while the list is being cleaned up)

   A null date, total or stage in the record must never appear on a page. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { root, routes, fileFor } = require("./routes.cjs");

const report = process.argv.includes("--report");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const lineOf = (text, index) => text.slice(0, index).split("\n").length;
const number = (text) => Number(String(text).replace(/,/g, ""));

const sandbox = { window: {} };
vm.runInNewContext(read("js/wfe-data.js"), sandbox);
const record = sandbox.window.WFE_CAMPAIGN;
const prices = JSON.parse(read("assets/data/step-prices.json"));
const uganda = prices.countries.find((country) => country.code === "UG");
const kenya = prices.countries.find((country) => country.code === "KE");

const expected = {
  stepValueUgx: record.contributionUnitValue,
  minimumSteps: record.minimumContributionSteps,
  suggestedSteps: record.suggestedContributionSteps,
  maximumSteps: prices.maximumSteps,
  targetUgx: record.fiveYearTargetUgx,
  distanceKm: record.distanceKm,
};

const conflicts = [];
const notes = [];
const homes = {};
function seen(fact, where, value) {
  (homes[fact] ||= []).push({ where, value, ok: value === expected[fact] });
  if (value !== expected[fact]) conflicts.push(`${fact}: ${where} says ${value}, the record says ${expected[fact]}`);
}

// 1. The price table must agree with the record.
seen("stepValueUgx", "assets/data/step-prices.json (Uganda)", uganda.step);
seen("minimumSteps", "assets/data/step-prices.json", prices.minimumSteps);

// 2. Other homes of the same fact: browser scripts and server code. Each entry names the pattern to read.
const homesToRead = [
  ["js/step-pricing.js", "minimumSteps", /minimumSteps:\s*(\d+)/],
  ["js/step-pricing.js", "maximumSteps", /maximumSteps:\s*(\d+)/],
  ["js/step-pricing.js", "stepValueUgx", /code:\s*"UG",[^}]*?step:\s*(\d+)/],
  ["js/wfe-shell.js", "minimumSteps", /MIN_STEPS\s*=\s*(\d+)/],
  ["js/wfe-shell.js", "maximumSteps", /MAX_STEPS\s*=\s*(\d+)/],
  ["js/wfe.js", "maximumSteps", /input\.max\s*=\s*"(\d+)"/],
  ["js/contributions.js", "maximumSteps", /Number\(value\)\s*<=\s*(\d+)/],
  ["api/payments/index.php", "stepValueUgx", /'stepUnit'=>(\d+)/],
  ["api/payments/index.php", "minimumSteps", /'minimumSteps'=>(\d+)/],
  ["api/payments/index.php", "maximumSteps", /'maximumSteps'=>(\d+)/],
  ["api/payments/index.php", "targetUgx", /'target'=>(\d+)/],
  ["api/lib/payments.php", "stepValueUgx", /PCI_STEP_VALUE_UGX\s*=\s*(\d+)/],
  ["api/lib/payments.php", "minimumSteps", /\$steps<(\d+)\s*\|\|/],
  ["api/lib/payments.php", "maximumSteps", /\$steps>(\d+)\s*\|\|/],
];
for (const [file, fact, pattern] of homesToRead) {
  const match = read(file).match(pattern);
  if (!match) conflicts.push(`${fact}: could not read it in ${file}; update the pattern in tests/quality/facts.cjs`);
  else seen(fact, file, number(match[1]));
}

// 3. The project card must not contradict the record.
const card = JSON.parse(read("src/content/projects/walk-for-education.json"));
if (record.status === "preparing" && !/prepar/i.test(card.status)) {
  conflicts.push(`project card status "${card.status}" does not match the record status "${record.status}"`);
}
const awaiting = /await|confirm|pending/i.test(card.walkStatus);
if (record.campaignStartDate === null && !awaiting) {
  conflicts.push(`project card walkStatus "${card.walkStatus}" implies a date, but the record start date is null`);
}
if (record.campaignStartDate !== null && awaiting) {
  conflicts.push(`project card walkStatus "${card.walkStatus}" still awaits a date the record now has`);
}

// 4. Words inside the record itself.
for (const briefing of record.campaignBriefings) {
  for (const match of briefing.body.matchAll(/five steps represent (UGX|KES) ([\d,]+)/g)) {
    const unit = match[1] === "UGX" ? uganda : kenya;
    if (number(match[2]) !== 5 * unit.step) {
      conflicts.push(
        `record briefing says five steps are ${match[1]} ${match[2]}; the price table makes it ${5 * unit.step}`,
      );
    }
  }
}

// 5. Pages. Walk for Education pages are scanned for every figure; every public page for the target.
const allRoutes = routes();
const walkRoutes = allRoutes.filter((route) => /^\/(walk-for-education|contribute)\//.test(route));
const fmt = (value) => value.toLocaleString("en-US");
const unitUgx = expected.stepValueUgx;

function expectAmount(file, text, index, steps, shown, label) {
  const want = steps * unitUgx;
  if (number(shown) !== want) {
    conflicts.push(
      `${file}:${lineOf(text, index)} ${label} shows UGX ${shown} for ${steps} steps, expected UGX ${fmt(want)}`,
    );
  }
}

for (const route of walkRoutes) {
  const file = path.relative(root, fileFor(route));
  const text = fs.readFileSync(fileFor(route), "utf8");

  for (const m of text.matchAll(/data-sp-amount="(\d+)"[^>]*>([\d,]+)</g))
    expectAmount(file, text, m.index, number(m[1]), m[2], "step chip");
  for (const m of text.matchAll(/data-sp-steps="(\d+)"[^>]*>UGX\s*([\d,]+)</g))
    expectAmount(file, text, m.index, number(m[1]), m[2], "step price");
  for (const m of text.matchAll(/data-sp="min"[^>]*>UGX\s*([\d,]+)</g))
    expectAmount(file, text, m.index, expected.minimumSteps, m[1], "minimum pledge");
  for (const m of text.matchAll(/data-sp="unit"[^>]*>UGX\s*([\d,]+)</g)) {
    if (number(m[1]) !== unitUgx)
      conflicts.push(`${file}:${lineOf(text, m.index)} price per step shows UGX ${m[1]}, expected UGX ${fmt(unitUgx)}`);
  }
  for (const m of text.matchAll(/id="(campaignTotal|selectedStepsAmount|summaryAmount)"[^>]*>UGX\s*([\d,]+)</g)) {
    expectAmount(file, text, m.index, expected.suggestedSteps, m[2], `default ${m[1]}`);
  }
  for (const m of text.matchAll(/<input[^>]*id="(campaignSteps|[a-zA-Z]*[Ss]teps)"[^>]*>/g)) {
    const min = m[0].match(/\bmin="(\d+)"/);
    const max = m[0].match(/\bmax="(\d+)"/);
    if (min && number(min[1]) !== expected.minimumSteps)
      conflicts.push(`${file}:${lineOf(text, m.index)} #${m[1]} min is ${min[1]}, expected ${expected.minimumSteps}`);
    if (max && number(max[1]) !== expected.maximumSteps)
      conflicts.push(`${file}:${lineOf(text, m.index)} #${m[1]} max is ${max[1]}, expected ${expected.maximumSteps}`);
  }
  for (const m of text.matchAll(/(?:up to|maximum of)\s+([\d,]+)\s+steps/gi)) {
    if (number(m[1]) !== expected.maximumSteps)
      conflicts.push(
        `${file}:${lineOf(text, m.index)} states a maximum of ${m[1]} steps, expected ${fmt(expected.maximumSteps)}`,
      );
  }
  for (const m of text.matchAll(/([\d][\d,.]*)\s*(?:km\b|kilomet(?:re|er)s)/gi)) {
    seen("distanceKm", `${file}:${lineOf(text, m.index)}`, number(m[1]));
  }

  // A date the record does not have must not be implied.
  if (record.campaignStartDate === null) {
    const claim = text.match(
      /(?:walk|campaign)\s+(?:starts|begins|starting|will start|departs)[^<.]{0,40}\b(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2})/i,
    );
    if (claim)
      conflicts.push(
        `${file}:${lineOf(text, claim.index)} implies a start date ("${claim[0].trim()}") but the record start date is null`,
      );
    const structured = text.match(/"startDate"\s*:/);
    if (structured)
      conflicts.push(
        `${file}:${lineOf(text, structured.index)} publishes a structured startDate but the record start date is null`,
      );
  }
}

// The five-year target wherever it is printed on a public page.
for (const route of allRoutes) {
  const file = path.relative(root, fileFor(route));
  const text = fs.readFileSync(fileFor(route), "utf8");
  for (const m of text.matchAll(/UGX\s*([\d.,]+)\s*(billion|bn)\b/gi)) {
    seen("targetUgx", `${file}:${lineOf(text, m.index)}`, number(m[1]) * 1e9);
  }
}

// 6. Payment channels printed on pages must be exactly the approved ones.
const approved = record.approvedDirectChannels.map((channel) => channel.number);
const homeText = fs.readFileSync(fileFor("/walk-for-education/"), "utf8");
const channelSection = homeText.match(/id="official-channels"[\s\S]*?<\/section>/)[0];
for (const number of approved) {
  if (!channelSection.includes(number))
    conflicts.push(`channel ${number} is in the record but missing from the Walk page channel cards`);
}
for (const m of channelSection.matchAll(/<h3>[A-Za-z ]*?(\d{5,13})<\/h3>/g)) {
  if (!approved.includes(m[1]))
    conflicts.push(`Walk page channel card shows ${m[1]}, which is not an approved channel in the record`);
}
for (const route of allRoutes) {
  const file = path.relative(root, fileFor(route));
  const text = fs.readFileSync(fileFor(route), "utf8");
  for (const m of text.matchAll(/\b(?:Paybill|Merchant|Equity)\s+(\d{5,13})\b/g)) {
    if (!approved.includes(m[1]))
      conflicts.push(
        `${file}:${lineOf(text, m.index)} prints channel ${m[1]}, which is not an approved channel in the record`,
      );
  }
}

// 7. Claims that are derived and have no home in the record yet.
for (const route of walkRoutes) {
  const text = fs.readFileSync(fileFor(route), "utf8");
  for (const m of text.matchAll(/About\s+(?:<b>)?(\d{1,3}(?:,\d{3}){2,})/g)) {
    notes.push(
      `${path.relative(root, fileFor(route))}:${lineOf(text, m.index)} prints "${m[0]}", a derived figure with no home in the record`,
    );
  }
}
if (!("maximumContributionSteps" in record)) {
  notes.push("the maximum of 20,000 steps is not in the campaign record; it lives in step-prices.json and server code");
}

for (const [fact, entries] of Object.entries(homes)) {
  const files = new Set(entries.map((entry) => entry.where.replace(/:\d+$/, "")));
  console.log(`${fact} = ${fmt(expected[fact])}: ${entries.length} mention(s) in ${files.size} file(s)`);
}
for (const note of notes) console.log(`note: ${note}`);
if (conflicts.length) {
  for (const conflict of conflicts) console.log(`FAIL ${conflict}`);
  console.error(`${conflicts.length} fact(s) disagree with the campaign record.`);
  if (!report) process.exit(1);
} else {
  console.log("Every checked fact agrees with the campaign record.");
}
