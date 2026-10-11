import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "../site";
import { writing } from "../lib";

export async function GET(context: APIContext) {
  const posts = await writing();
  return rss({
    title: `${SITE.name}: writing`,
    description: "Notes from building things, and the occasional story.",
    site: context.site ?? SITE.url,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: p.data.date,
      link: `/writing/${p.id}/`,
    })),
  });
}
