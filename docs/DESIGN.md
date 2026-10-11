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
| `--paper` | `#f7f8f8` | `#101214` | page |
| `--paper-raised` | `#fdfdfd` | `#16191c` | figure panels |
| `--ink` | `#15171a` | `#e5e8eb` | text |
| `--ink-2` | `#545a62` | `#a1a8b0` | secondary text |
| `--ink-3` | `#868d96` | `#6f7781` | labels, drawing structure |
| `--rule` | `#dde1e5` | `#262a2f` | hairlines |
| `--accent` | `#1f4f94` | `#84aee8` | the one live element; link hover |

The palette is cool paper and a cyanotype blue, the colour of a blueprint, because
the drawings are diagrams. A first pass used warm cream with a terracotta accent and
was dropped: with a book serif it is the stock look of generated sites.

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

`public/og.png` (1200 x 630) is the home sentence beside the three drawings, drawn
with the site's own CSS and figures by `scripts/og-card.astro`. The steps to
re-render it are at the top of that file.
