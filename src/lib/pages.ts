import { getEntry } from "astro:content";

// Page copy is authored in the .astro templates; the collection holds the title, heading, description and
// publication metadata. A draft record never builds into a public document.
export async function getPage(id: string) {
  const entry = await getEntry("pages", id);
  if (!entry) throw new Error("Missing page record: " + id);
  if (entry.data.publication === "draft") throw new Error("Draft page records must not be published: " + id);
  return entry.data;
}
