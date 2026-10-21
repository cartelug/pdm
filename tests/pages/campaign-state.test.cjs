const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");

// Compile src/lib/campaign.ts the way the Astro build sees it, so the state machine is tested as shipped.
function load() {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, "src/lib/campaign.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", output)(module, module.exports, require);
  return module.exports;
}

const { campaignState, campaignView, loadCampaignRecord } = load();
const base = {
  name: "Walk for Education",
  slug: "walk-for-education",
  status: "preparing",
  statusLabel: "Pledges open · walk dates to be confirmed",
  distanceKm: 1100,
  campaignStartDate: null,
  campaignEndDate: null,
  distanceCoveredKm: null,
};
const day = (value) => new Date(value + "T12:00:00Z");

test("the live record is read and is in the preparing state with no start date", () => {
  const record = loadCampaignRecord(root);
  assert.equal(record.slug, "walk-for-education");
  assert.equal(record.campaignStartDate, null);
  assert.equal(campaignState(record, day("2026-10-21")), "preparing");
});

test("preparing shows the record's own label and never invents a date", () => {
  const view = campaignView(base, day("2026-10-21"));
  assert.equal(view.state, "preparing");
  assert.equal(view.label, base.statusLabel);
  assert.equal(view.action, "Choose my steps");
  assert.equal(view.projectStatus, "Preparing launch");
  assert.doesNotMatch(view.label, /\b20\d\d\b/);
});

test("a confirmed future start date moves to dated and names the date", () => {
  const record = { ...base, campaignStartDate: "2026-12-12" };
  const view = campaignView(record, day("2026-10-21"));
  assert.equal(view.state, "dated");
  assert.equal(view.label, "Walk starts 12 December 2026");
});

test("from the start date it is walking and counts the day on the road", () => {
  const record = { ...base, campaignStartDate: "2026-12-12" };
  assert.equal(campaignView(record, day("2026-12-12")).label, "Day 1 on the road");
  assert.equal(campaignView(record, day("2026-12-20")).label, "Day 9 on the road");
  assert.equal(campaignView(record, day("2026-12-20")).projectStatus, "Live campaign");
});

test("verified distance covering the route means arrived, and pledges stay open", () => {
  const record = { ...base, campaignStartDate: "2026-12-12", distanceCoveredKm: 1100 };
  const view = campaignView(record, day("2027-01-30"));
  assert.equal(view.state, "arrived");
  assert.equal(view.label, "The walk is complete. Pledges stay open.");
  assert.equal(view.action, "Pledge");
  assert.equal(view.live, true);
});

test("an explicit status from the campaign team wins over the dates", () => {
  const completed = campaignView({ ...base, status: "completed", campaignStartDate: "2026-12-12" }, day("2026-12-13"));
  assert.equal(completed.state, "completed");
  assert.equal(completed.action, "Read the report");
  assert.equal(completed.projectStatus, "Completed");
  const archived = campaignView({ ...base, status: "archived" }, day("2030-01-01"));
  assert.equal(archived.state, "archived");
  assert.equal(archived.live, false);
  assert.equal(archived.action, "See the current campaign");
});

test("a malformed or missing date is treated as not yet confirmed", () => {
  assert.equal(campaignState({ ...base, campaignStartDate: "12/12/2026" }, day("2026-12-13")), "preparing");
  assert.equal(campaignState({ ...base, campaignStartDate: "" }, day("2026-12-13")), "preparing");
});
