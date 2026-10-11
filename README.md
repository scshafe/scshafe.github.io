# scshafe.github.io

The source of <https://scshafe.github.io>, Cole Shaffer's site: pages about his
projects (Leyline, Mailroom & Switchyard, Voice Lab) and, now and then, notes and
stories.

It is an [Astro](https://astro.build) site with no client-side JavaScript, built to
static HTML and published to GitHub Pages by `.github/workflows/pages.yml` on every
push to `main`. The design is described in [docs/DESIGN.md](docs/DESIGN.md).

## Run it

Node 24 (`.node-version`) and pnpm 10 (`packageManager`):

```sh
pnpm install
pnpm dev          # http://localhost:4321, reloads on save
pnpm build        # dist/
pnpm preview      # serve dist/
```

## Verify

```sh
pnpm run verify
```

That is `dev.toml [verify]`, run by CI on every push and by the Pages workflow
before it publishes: a frozen install, `astro check` (types and the content
schema), `astro build`, and `scripts/check-site.mjs` over the build (every internal
link resolves, every page has its metadata, nothing loads from another origin, and
no email address, tailnet or LAN address or home-directory path appears anywhere).

## Add a page

- **A project:** add `src/content/projects/<id>.md`. The front matter is checked
  against `src/content.config.ts`; copy an existing project's. `featured: true`
  puts it on the home page, `order` sorts it, `figure` picks a drawing (or `none`).
- **Writing:** copy `src/content/writing/_template.md` to
  `src/content/writing/<id>.md` and set `draft: false`. The Writing section and the
  RSS feed (`/rss.xml`) appear once something is published.

The URL is the file name: `src/content/projects/leyline.md` is `/projects/leyline/`.

## Licence

The code is MIT. The writing and drawings are © Cole Shaffer.
