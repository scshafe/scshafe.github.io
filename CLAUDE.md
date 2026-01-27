# Project Overview

A Next.js static blog with a configurable Views system. Features **Author Mode** for local content editing via Flask/SQLite and **Publish Mode** for generating static HTML for deployment.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Author Mode (Development)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐         ┌──────────────┐                     │
│   │   Next.js    │◄───────►│ Flask Server │                     │
│   │  (port 3000) │  API    │ (port 3001)  │                     │
│   └──────────────┘         └──────┬───────┘                     │
│                                   │                              │
│                                   │ reads/writes                 │
│                                   ▼                              │
│                            ┌──────────────┐                     │
│                            │   blog.db    │                     │
│                            │   (SQLite)   │                     │
│                            └──────────────┘                     │
│                                                                  │
│   metadata.json is NOT used during development                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Publish Mode (Production)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Build Process:                                                 │
│   SQLite ──export──► metadata.json ──build──► Static HTML       │
│                                                                  │
│   Served:                                                        │
│   ┌──────────────┐                                              │
│   │ Static HTML  │  ◄── /out directory                          │
│   └──────────────┘                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
├── app/                      # Next.js App Router pages
│   ├── [[...viewPath]]/      # Dynamic catch-all route for views
│   ├── posts/[slug]/         # Individual blog post pages
│   ├── category/[category]/  # Category listing pages
│   └── settings/             # Author-only settings page
├── backend/                  # Python Flask server
│   ├── server.py             # Main API server
│   ├── database.py           # SQLite database module
│   ├── export_metadata.py    # Exports DB to JSON for builds
│   ├── reset_database.py     # Clears DB for fresh start
│   └── migrate_to_sqlite.py  # One-time migration from JSON
├── components/
│   ├── views/                # View system components
│   │   ├── ViewRenderer.tsx
│   │   ├── ViewComponentRenderer.tsx
│   │   ├── AddComponentButton.tsx
│   │   └── components/       # Individual view component types
│   ├── posts/                # Blog post components
│   ├── settings/             # Settings page UI components
│   ├── layout/               # Header, Footer
│   └── pages/                # Page-level components
├── content/
│   ├── blog.db               # SQLite database (source of truth)
│   ├── metadata.json         # Generated at build time only
│   ├── posts/                # Markdown blog post files
│   └── experiences/          # Experience markdown files
├── lib/
│   └── content/
│       ├── views.ts          # View system type definitions
│       ├── views.server.ts   # Server-side view loading
│       ├── posts.ts          # Post loading utilities
│       └── types.ts          # Shared TypeScript types
├── public/                   # Static assets
│   ├── images/               # Image files
│   └── pdfs/                 # PDF files
└── out/                      # Static build output
```

## Data Flow

### Source of Truth

- **SQLite database** (`content/blog.db`) is the single source of truth
- **Markdown files** (`content/posts/*.md`, `content/experiences/*.md`) store content
- **metadata.json** is ONLY generated at build time, never read/written during development

### During Development (Author Mode)

1. Next.js fetches data from Flask API (`http://localhost:3001`)
2. Flask server reads/writes to SQLite database
3. **metadata.json is completely bypassed**

### During Build (Publish Mode)

1. `npm run build` triggers prebuild script
2. Prebuild exports SQLite → `metadata.json`
3. Next.js generates static HTML from `metadata.json`
4. Output goes to `/out` directory

## Views System

The site uses a configurable **Views** system where each page is a "view" containing ordered components:

- **View**: A page with path, title, browser title, and list of components
- **Components**: Title, Information, Alert, MarkdownEditor, BlogPostsList, ExperienceList, TagList, View (links), MultiMedia, PDFViewer

Views are configured via Settings → Views tab. One view marked as `isHome: true` serves as the root `/` page.

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server only (read-only, no editing) |
| `npm run author` | Start both Next.js and Flask servers (full editing) |
| `npm run author:server` | Start Flask server only |
| `npm run build` | Build static site (exports metadata first) |
| `npm run preview` | Preview built static site locally |
| `npm run export:metadata` | Export SQLite to metadata.json |
| `npm run migrate` | Migrate metadata.json to SQLite (one-time) |
| `npm run db:reset` | Reset database to clean state |
| `npm run lint` | Run ESLint |
| `npm run start` | Start Next.js production server |

## Workflows

### Starting Fresh

```bash
npm run db:reset
npm run author
```

This clears the database and starts with:
- No views or navigation links
- Site name set to current timestamp (e.g., "Jan 27 14:30")
- Home button defaults to "Home" linking to "/"

### Author Mode (Development)

```bash
npm run author
```

Starts both servers:
- Next.js dev server on http://localhost:3000
- Flask author server on http://localhost:3001

Edit content at:
- **Settings Page** (`/settings`): Configure views, navigation, themes
- **Views Tab**: Create/edit/delete views, add components, reorder
- **Navigation Tab**: Edit site name, header and footer links
- **Theme Tab**: Switch themes and color schemes

All changes persist immediately to SQLite.

### Publish Mode (Building for Production)

```bash
npm run build
npm run preview  # Optional: preview locally
```

Build process:
1. Exports SQLite → `metadata.json`
2. Generates RSS feed (`public/feed.xml`)
3. Builds static HTML to `/out`
4. Copies `out/index.html` to root for GitHub Pages

### Deployment

Push to GitHub with Pages enabled. Serve:

```
/
├── index.html              # Root entry
└── out/                    # All static assets
    ├── index.html
    ├── posts/
    ├── category/
    ├── settings/
    ├── feed.xml
    ├── _next/
    └── images/
```

Or serve `/out` contents directly as root.

## API Endpoints (Flask Backend)

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/metadata` | GET, PUT | Full metadata |
| `/views` | GET, PUT | Views configuration |
| `/views/<id>` | PUT, DELETE | Individual view CRUD |
| `/views/<id>/content` | PUT | View content updates |
| `/posts` | GET | Posts listing |
| `/tags` | GET | All unique tags |
| `/experiences` | GET | Experiences listing |
| `/experiences/order` | PUT | Reorder experiences |
| `/navigation` | GET, PUT | Navigation config |
| `/themes` | GET, PUT | Themes config |
| `/content` | GET, PUT | Content by type/slug |
| `/fetch-image` | POST | Fetch image from URL |
| `/save-image` | POST | Save image to public |
| `/upload-pdf` | POST | Upload PDF file |
| `/health` | GET | Health check |

## Database Schema

| Table | Purpose |
|-------|---------|
| `themes` | Theme configuration |
| `navigation` | Site name and nav config |
| `nav_links` | Header and footer links |
| `posts` | Blog post metadata |
| `experiences` | Work experience entries |
| `views` | Page configurations |
| `view_components` | Components within views |
| `view_content` | Markdown content for views |
| `settings` | Key-value settings |

## Key Configuration

- `.env.development`: Sets `NEXT_PUBLIC_BUILD_MODE=author`
- `.env.production`: Sets `NEXT_PUBLIC_BUILD_MODE=publish`
- `next.config.ts`: Static export configuration with `output: 'export'`

## Reserved Paths

These paths are reserved and cannot be used for views:
- `/settings` - Settings page
- `/posts/[slug]` - Individual blog posts
- `/category/[category]` - Category filter pages
- `/feed.xml` - RSS feed

## Prerequisites

- Node.js 18+
- Python 3.8+
- pip packages: `flask`, `flask-cors`, `requests`

```bash
pip install flask flask-cors requests
npm install
```
