# scshafe's Blog

A static blog built with Next.js and a configurable Views system. Features an author mode for content editing and exports to static HTML for deployment.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Development                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐         ┌──────────────┐                     │
│   │   Next.js    │◄───────►│ Flask Server │                     │
│   │  (port 3000) │  API    │ (port 3001)  │                     │
│   └──────────────┘         └──────┬───────┘                     │
│         │                         │                              │
│         │ reads                   │ reads/writes                 │
│         ▼                         ▼                              │
│   ┌──────────────┐         ┌──────────────┐                     │
│   │metadata.json │◄────────│   blog.db    │                     │
│   │  (generated) │  export │   (SQLite)   │                     │
│   └──────────────┘         └──────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Production                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐                                              │
│   │ Static HTML  │  ◄── Served from /out directory              │
│   │    /out/     │                                              │
│   └──────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+
- Python 3.8+
- pip packages: `flask`, `flask-cors`, `requests`

Install Python dependencies:

```bash
pip install flask flask-cors requests
```

## Quick Start

### Development (View Only)

View the site without editing capabilities:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Development (Author Mode)

Edit content with the author mode server:

```bash
npm run author
```

This starts:
- Next.js dev server on port 3000
- Flask author server on port 3001

Navigate to [http://localhost:3000/settings](http://localhost:3000/settings) to edit content.

## Project Structure

```
.
├── app/                    # Next.js App Router pages
│   ├── [[...viewPath]]/    # Dynamic catch-all for views
│   ├── posts/[slug]/       # Blog post pages
│   ├── category/[category]/# Category filter pages
│   └── settings/           # Author mode settings
├── backend/                # Python Flask server
│   ├── server.py           # Main API server
│   ├── database.py         # SQLite database module
│   ├── migrate_to_sqlite.py# One-time migration script
│   └── export_metadata.py  # Exports DB to JSON for builds
├── components/             # React components
│   ├── views/              # View system components
│   ├── layout/             # Header, Footer
│   ├── posts/              # Blog post components
│   └── settings/           # Settings UI components
├── content/                # Content storage
│   ├── blog.db             # SQLite database (source of truth)
│   ├── metadata.json       # Generated from DB at build time
│   ├── posts/              # Markdown post files
│   └── experiences/        # Experience markdown files
├── lib/                    # Shared utilities
│   └── content/            # Content loading functions
├── public/                 # Static assets
│   ├── images/             # Image files
│   └── pdfs/               # PDF files
└── out/                    # Static build output
```

## Data Flow

### Source of Truth

- **SQLite database** (`content/blog.db`) is the source of truth for all metadata
- **Markdown files** (`content/posts/*.md`, `content/experiences/*.md`) store content
- **metadata.json** is only generated at build time (not used during development)

### During Development

1. Flask server reads/writes to SQLite database
2. Next.js fetches data from Flask API (`http://localhost:3001`)
3. **metadata.json is NOT read or written** during development

### During Build

1. `npm run build` triggers prebuild script
2. Prebuild exports SQLite → `metadata.json`
3. Next.js generates static HTML from `metadata.json`
4. Output goes to `/out` directory

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server only |
| `npm run author` | Start both Next.js and Flask servers |
| `npm run author:server` | Start Flask server only |
| `npm run build` | Build static site (exports metadata first) |
| `npm run preview` | Preview built site locally |
| `npm run export:metadata` | Export SQLite to metadata.json |
| `npm run migrate` | Migrate metadata.json to SQLite (one-time) |

## Building for Production

```bash
# Build the static site
npm run build

# Preview locally
npm run preview
```

The build process:
1. Exports metadata from SQLite to JSON
2. Generates RSS feed
3. Builds static HTML to `/out`
4. Copies `index.html` to root for GitHub Pages

## Deployment

### GitHub Pages

The site is configured for static export. After building:

1. The `/out` directory contains the full static site
2. `index.html` in root redirects to the built site

Deploy by pushing to GitHub and enabling Pages on the repository.

### Served Files Structure

For any static hosting, serve:

```
/
├── index.html              # Root redirect/entry
└── out/                    # All static assets
    ├── index.html
    ├── blog/
    ├── experience/
    ├── posts/
    ├── category/
    ├── settings/
    ├── feed.xml
    ├── _next/              # Next.js assets
    └── images/             # Static images
```

Or serve the contents of `/out` directly as the root.

## Database Schema

The SQLite database contains these tables:

| Table | Purpose |
|-------|---------|
| `themes` | Theme configuration |
| `navigation` | Site name and nav config |
| `nav_links` | Header and footer links |
| `posts` | Blog post metadata |
| `experiences` | Work experience entries |
| `views` | Page configurations |
| `view_components` | Components within views |
| `settings` | Key-value settings |

## Views System

The site uses a configurable "Views" system instead of hardcoded pages:

- **Views** define pages with paths, titles, and components
- **Components** are building blocks (Title, MarkdownEditor, BlogPostsList, etc.)
- Configure views in Settings → Views tab

### Available Components

- Title - Page title display
- MarkdownEditor - Editable markdown content
- BlogPostsList - List of blog posts
- ExperienceList - Work experience cards
- PDFViewer - Embedded PDF display
- Alert - Info/warning boxes
- And more...

## Migrating Existing Data

If you have an existing `metadata.json` and need to populate the SQLite database:

```bash
npm run migrate
```

This reads `metadata.json` and creates `content/blog.db`.

## Development Notes

- The Flask server is only needed for editing content
- Static builds work without Python installed
- All content changes persist to SQLite immediately
- The JSON export happens automatically on save and at build time
