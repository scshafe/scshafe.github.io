import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One Markdown file per project page (src/content/projects/<id>.md). A file
// whose name starts with "_" is ignored, and `draft: true` keeps a page out of
// the build.
const projects = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    // A few words above the title: what it is and what it is made of.
    kicker: z.string(),
    // One sentence: the card text on the home page and the meta description.
    summary: z.string().max(240),
    // Which line drawing heads the page (src/components/figures/).
    figure: z.enum(["leyline", "switchyard", "voice", "none"]).default("none"),
    // Lower comes first; featured projects lead the home page.
    order: z.number().int().default(100),
    featured: z.boolean().default(false),
    status: z.string(),
    started: z.coerce.string().optional(),
    updated: z.coerce.date(),
    // The spec rail: label/value pairs in display order. A value with an
    // `href` is a link.
    spec: z
      .array(z.object({ label: z.string(), value: z.string(), href: z.url().optional() }))
      .default([]),
    // A short screen recording (public/media/), shown in place of the drawing at the
    // top of the project page. The drawing still heads the project's card.
    demo: z
      .object({
        video: z.string().startsWith("/media/"),
        poster: z.string().startsWith("/media/"),
        width: z.number().int(),
        height: z.number().int(),
        caption: z.string(),
      })
      .optional(),
    draft: z.boolean().default(false),
  }),
});

// Notes, experiences and stories (src/content/writing/<id>.md).
const writing = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(240),
    date: z.coerce.date(),
    kind: z.enum(["note", "story", "essay"]).default("note"),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, writing };
