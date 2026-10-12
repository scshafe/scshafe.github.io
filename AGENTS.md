# scshafe.github.io agent contract

Cole Shaffer's public site, <https://scshafe.github.io>: pages about his projects,
and occasional notes and stories. An [Astro](https://astro.build) static site built
to plain HTML and served by GitHub Pages. It is a scshafe-dev `service` project
(`dev.toml`, id `scshafe-github-io`) with `[deploy] lane = "none"`: no fleet host
runs it; `.github/workflows/pages.yml` publishes it.

Read `README.md` for how to run it and `docs/DESIGN.md` before changing how it
looks.

## Layout

- `src/content/projects/<id>.md`: one page per project. The front matter schema is
  `src/content.config.ts` (title, kicker, summary, figure, order, featured, status,
  updated, spec rail). `featured: true` puts a project on the home page.
- `src/content/writing/<id>.md`: notes and stories (`_template.md` shows the front
  matter; files starting with `_` and `draft: true` are not built). Writing appears in
  the navigation and on the home page once one post is published.
- `src/components/figures/`: the line drawings that head each project (SVG written
  by hand in Astro components, coloured by the CSS tokens so dark mode follows).
- `src/styles/global.css`: every token (colour, type, spacing) lives here.
- `scripts/check-site.mjs`: the post-build check (links, metadata, no other origins,
  no private details).
- `public/media/`: screen recordings shown at the top of a project page (the `demo`
  front matter). H.264 MP4 with a WebP poster, a few hundred KB.
- `public/og.png`: the link-preview image (1200 x 630), rendered from the site's own
  type and drawings by `scripts/og-card.astro` (the steps are in that file).

## Rules

- **The site is public and so is the repository.** Pages describe private projects
  (mailroom, voice-lab) at the level their owner chose; never add an email address,
  a host name, a tailnet or LAN address, a path from a machine, a token, a recording,
  or a detail from a private repository the owner has not published here. The check
  script refuses the mechanical ones; the rest is on you. A screen recording or
  screenshot shows far more than the page around it: blur every window's contents
  and the menu bar, and look at every frame at full size before it goes in.
- **Say only what is true.** Every claim about a project comes from that project's
  own README, docs or release notes. Status lines say where it actually stands
  (mailroom is deployed but not live; voice-lab is in progress).
- Writing is the owner's voice. Don't invent experiences or stories for him; draft
  only what he asks for, and leave it `draft: true` for him to publish.
- No client-side JavaScript unless a page cannot work without it, no third-party
  requests (fonts are self-hosted from `@fontsource-variable`), no analytics.
- Commits use the repository-local noreply identity (`git config user.email` is
  `17693438+scshafe@users.noreply.github.com`); never the account email.

## Publishing

A push to `main` runs `pages.yml`: it verifies, builds `dist/` and deploys it to
GitHub Pages. The live site changes a minute or two after a merge; watch it with
`gh run watch` on the Pages run. Merging is publishing, so it needs the owner's
go-ahead.

This repository is public, so CI runs on pull requests: wait for it to pass. Merge
locally as the noreply identity (`git merge --no-ff` with the subject
`Merge #<N>: <title>`, then push `main`), never with `gh pr merge`, which would put
the account email into public history. That replaces step 3 of the managed section
below, which is the template's private-repository default.

<!-- scshafe-dev:begin landing -->
## Verify and landing

Managed by scshafe-dev: `dev adopt` and `dev update` refresh this section from `dev.toml`; change `dev.toml`, not these lines.

Before finishing, both of these must pass:

```sh
pnpm run verify
dev check .
```

How a change lands:

1. Work on a branch and open a PR.
2. Run the two commands above. If the repository is private, GitHub Actions does not run for it: verify locally and say in the PR what you ran. If it is public, wait for CI to be green.
3. Merge the PR with a merge commit, one change at a time: `gh pr merge <N> --merge --subject "Merge #<N>: <title>"`. Never squash or rebase (both are off on the repository), and pass `--subject`: `gh pr merge` does not make the `Merge #N: <title>` subject by itself.
<!-- scshafe-dev:end landing -->
