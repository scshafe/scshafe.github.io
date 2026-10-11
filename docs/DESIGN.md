# Design

Accepted direction for the 2026-10 rebuild. The brief: clean, compelling, but
understated; a place to publish pages about projects, and occasionally experiences
or stories.

## Directions considered

1. **Data sheet.** A Swiss grid, a grotesque, hairline rules, every project page as a
   spec sheet. Precise, but cold for stories.
2. **Field notebook.** A warm serif, a narrow column, marginalia. Good for stories,
   too soft for a window manager.
3. **Monochrome editorial.** Very large type, black and white. Striking, and loud
   rather than understated.

The site takes 1 and 2 together: **a notebook that carries a data sheet.** The text
is a book serif in a comfortable column; the facts (status, platform, stack, source)
sit beside it in a small monospace rail, like a spec sheet's margin. One accent
colour, used sparingly, marks what is "live" in each drawing.

## The idea: lines

Each featured project is headed by a line drawing of its own idea, drawn as 1 px
hairlines (`vector-effect: non-scaling-stroke`), with one element in the accent:

- **Leyline**: a display tiled with one shared gap; the focused window outlined.
- **Mailroom & Switchyard**: the sieve as a switchyard ladder, one track in, a
  siding per bucket, the main line running on to a person; one unit's path lit.
- **Voice Lab**: three sung phrases, pitch on a five-line staff over a hairline
  waveform. Generated from a seeded sequence, so it is the same on every build.

The drawings are diagrams, not decoration: each one says what the project does
before the text does. They are SVG in Astro components and use the colour tokens,
so they follow dark mode.

## System

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | `#f6f4ef` | `#151513` | page |
| `--paper-raised` | `#fbfaf7` | `#1b1b18` | figure panels |
| `--ink` | `#1c1b19` | `#e9e6df` | text |
| `--ink-2` | `#5f5b53` | `#a8a399` | secondary text |
| `--ink-3` | `#8f8a80` | `#7a766d` | labels, drawing structure |
| `--rule` | `#dcd7cc` | `#2e2c28` | hairlines |
| `--accent` | `#b5441b` | `#e57b52` | the one live element; link hover |

- **Type:** Newsreader (variable, optical sizes) for everything you read; JetBrains
  Mono for small labels, the spec rail, code and keys. Headings are regular weight,
  never bold: size and space carry the hierarchy. Both are self-hosted.
- **Measure:** 38 rem for prose, 68 rem for the page.
- **Motion:** none beyond 120–160 ms colour transitions on hover, and those switch
  off under `prefers-reduced-motion`.
- **No JavaScript** on any page. No analytics, no third-party requests.

## Pages

- `/`: one sentence about the work, then the featured projects as plates (drawing
  and text side by side; stacked on a phone), then recent writing once there is any.
- `/projects/`: every project as a card.
- `/projects/<id>/`: kicker, title, summary, the drawing, then the spec rail beside
  the text (above it on a phone), and a link to the next project.
- `/writing/` and `/writing/<id>/`: dated notes and stories, with an RSS feed.

## The link-preview image

`public/og.png` (1200 x 630) is the home sentence beside the three drawings. It was
rendered from a temporary Astro page that composed `Figure` components with the site
CSS, screenshotted with Playwright at 1200 x 630, then removed. Re-render it the same
way if the sentence or the drawings change.
