import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

/* The institutional pages describe the Walk for Education campaign from one place: the campaign record in
   js/wfe-data.js, which the campaign pages and the admin console already read. This module reads it at build time
   and turns it into a lifecycle state, so a label, a call to action or a project status can never disagree with
   the campaign. A date, total or stage that is null in the record is never shown. */

export type CampaignState = "preparing" | "dated" | "walking" | "arrived" | "completed" | "archived";

export interface CampaignRecord {
  name: string;
  slug: string;
  status: string;
  statusLabel: string;
  distanceKm: number;
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  distanceCoveredKm: number | null;
}

const STATES: CampaignState[] = ["preparing", "dated", "walking", "arrived", "completed", "archived"];

export function loadCampaignRecord(root: string = process.cwd()): CampaignRecord {
  const source = fs.readFileSync(path.join(root, "js/wfe-data.js"), "utf8");
  const sandbox: { window: { WFE_CAMPAIGN?: CampaignRecord } } = { window: {} };
  vm.runInNewContext(source, sandbox);
  if (!sandbox.window.WFE_CAMPAIGN) throw new Error("js/wfe-data.js did not define WFE_CAMPAIGN");
  return sandbox.window.WFE_CAMPAIGN;
}

function dayStart(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(value + "T00:00:00Z");
}

// An explicit status set by the campaign team wins. Otherwise the state follows from the dates and the
// verified distance covered, and an unset date keeps the campaign in "preparing".
export function campaignState(record: CampaignRecord, today: Date = new Date()): CampaignState {
  const explicit = STATES.find((state) => state === record.status);
  if (explicit && explicit !== "preparing") return explicit;
  if (record.distanceCoveredKm !== null && record.distanceCoveredKm >= record.distanceKm) return "arrived";
  const start = dayStart(record.campaignStartDate);
  if (!start) return "preparing";
  return today.getTime() >= start.getTime() ? "walking" : "dated";
}

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export interface CampaignView {
  state: CampaignState;
  // The short line shown beside the campaign name.
  label: string;
  // What the primary link should say on a page that points to the campaign.
  action: string;
  // Whether the campaign is still asking for anything (false once archived).
  live: boolean;
  // The wording for the project card status.
  projectStatus: string;
}

export function campaignView(record: CampaignRecord = loadCampaignRecord(), today: Date = new Date()): CampaignView {
  const state = campaignState(record, today);
  const start = dayStart(record.campaignStartDate);
  switch (state) {
    case "dated":
      return {
        state,
        label: `Walk starts ${longDate.format(start as Date)}`,
        action: "Choose my steps",
        live: true,
        projectStatus: "Live campaign",
      };
    case "walking": {
      const day = Math.floor((today.getTime() - (start as Date).getTime()) / 86400000) + 1;
      return {
        state,
        label: `Day ${day} on the road`,
        action: "Choose my steps",
        live: true,
        projectStatus: "Live campaign",
      };
    }
    case "arrived":
      return {
        state,
        label: "The walk is complete. Pledges stay open.",
        action: "Pledge",
        live: true,
        projectStatus: "Live campaign",
      };
    case "completed":
      return { state, label: "Thank you", action: "Read the report", live: true, projectStatus: "Completed" };
    case "archived":
      return {
        state,
        label: "Campaign archive",
        action: "See the current campaign",
        live: false,
        projectStatus: "Completed",
      };
    default:
      return {
        state,
        label: record.statusLabel,
        action: "Choose my steps",
        live: true,
        projectStatus: "Preparing launch",
      };
  }
}
