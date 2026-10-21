import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const review = {
  owner: z.string(),
  source: z.string(),
  publication: z.enum(["existing-public", "draft", "approved"]),
  reviewedAt: z.string().nullable(),
};
export const collections = {
  pages: defineCollection({
    loader: glob({ pattern: "*.json", base: "./src/content/pages" }),
    schema: z.object({ title: z.string(), heading: z.string(), description: z.string(), ...review }),
  }),
  projects: defineCollection({
    loader: glob({ pattern: "*.json", base: "./src/content/projects" }),
    schema: z.object({
      title: z.string(),
      route: z.string(),
      status: z.enum(["Live campaign", "Under review", "Pipeline", "Programme area", "Preparing launch", "Completed"]),
      category: z.string(),
      location: z.string(),
      summary: z.string(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      imageNote: z.string().optional(),
      walkStatus: z.string().optional(),
      pledgeStatus: z.string().optional(),
      paymentStatus: z.string().optional(),
      ...review,
    }),
  }),
  updates: defineCollection({
    loader: glob({ pattern: "*.md", base: "./src/content/updates" }),
    schema: z.object({
      title: z.string(),
      date: z.string(),
      summary: z.string(),
      category: z.string(),
      project: z.string().optional(),
      ...review,
    }),
  }),
};
