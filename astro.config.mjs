// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// A user site: GitHub Pages serves it at the domain root.
export default defineConfig({
  site: "https://scshafe.github.io",
  trailingSlash: "ignore",
  build: { format: "directory" },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: "css-variables" },
  },
  devToolbar: { enabled: false },
});
