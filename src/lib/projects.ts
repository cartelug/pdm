import { getCollection, type CollectionEntry } from "astro:content";
import { campaignView } from "./campaign";

export type ProjectEntry = CollectionEntry<"projects">;

// The Walk for Education card is drawn from the campaign record, so its status can never disagree with the
// campaign itself. Every other project is read as written.
export function withCampaign(project: ProjectEntry): ProjectEntry {
  if (project.id !== "walk-for-education") return project;
  const view = campaignView();
  return {
    ...project,
    data: {
      ...project.data,
      status: view.projectStatus as ProjectEntry["data"]["status"],
      walkStatus: view.state === "preparing" ? "Walk dates awaiting confirmation" : view.label,
      pledgeStatus: view.live ? "Pledges open" : "Pledges closed",
    },
  };
}

export async function getProjects(): Promise<ProjectEntry[]> {
  const records = await getCollection("projects", (record) => record.data.publication !== "draft");
  // The content loader gives no ordering guarantee (entries arrive as files finish reading), so sort explicitly:
  // the generated pages must be identical on every machine.
  const priority = ["walk-for-education", "faith-in-motion"];
  return records.map(withCampaign).sort((a, b) => {
    const rank = (id: string) => (priority.includes(id) ? priority.indexOf(id) : 2);
    return rank(a.id) - rank(b.id) || a.id.localeCompare(b.id);
  });
}
