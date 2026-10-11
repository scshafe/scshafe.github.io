import { getCollection } from "astro:content";

export async function projects() {
  const all = await getCollection("projects", ({ data }) => !data.draft);
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function writing() {
  const all = await getCollection("writing", ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const fmt = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const fmtShort = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", timeZone: "UTC" });

export const longDate = (d: Date) => fmt.format(d);
export const shortDate = (d: Date) => fmtShort.format(d);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
