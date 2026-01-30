# scshafe's Blog

A static blog built with Next.js and a configurable Views system. Features an author mode for content editing and exports to static HTML for deployment.

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
│                            │ settings.json│                     │
│                            │ views/*.json │                     │
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
│   JSON files ──export──► metadata.json ──build──► Static HTML   │
│                                                                  │
│   Served:                                                        │
│   ┌──────────────┐                                              │
│   │ Static HTML  │  ◄── /out directory                          │
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

### Starting Fresh

Reset data and start authoring:

```bash
npm run data:reset
npm run author
```

## Project Structure

```
.
├── app/                    # Next.js App Router pages
│   ├── [[...viewPath]]/    # Dynamic catch-all for views
│   ├── posts/[slug]/       # Blog post pages
│   ├── tag/[tag]/          # Tag filter pages
│   └── settings/           # Author mode settings
├── components/             # React components
│   ├── views/              # View system components
│   ├── ui/                 # Shared UI (Header, Footer, ThemeProvider)
│   ├── posts/              # Blog post components
│   ├── settings/           # Settings UI components
│   └── author/             # Author mode components
├── backend/                # Python Flask server
│   ├── server.py           # Main API server
│   ├── database.py         # JSON database module
│   ├── export_metadata.py  # Exports JSON to metadata.json
│   └── reset_and_seed.py   # Reset data to default state
├── content/                # Content storage
│   ├── settings.json       # Theme and navigation settings
│   ├── metadata.json       # Generated at build time only
│   ├── views/              # View JSON files
│   ├── experiences/        # Experience markdown files
│   └── posts/              # Markdown post files
├── example_data/           # Example data files for reference
├── lib/                    # Shared utilities
│   ├── content/            # Content loading functions
│   ├── store/              # Redux store and slices
│   └── utils/              # Utility functions
├── scripts/                # Build scripts
├── public/                 # Static assets
│   ├── images/             # Image files
│   └── pdfs/               # PDF files
├── site.config.ts          # Site configuration
└── out/                    # Static build output
```

## Data Flow

### Source of Truth

- **Settings JSON** (`content/settings.json`) stores theme and navigation
- **View JSON files** (`content/views/*.json`) store view configurations
- **Markdown files** (`content/posts/*.md`) store post content
- **metadata.json** is ONLY generated at build time, never read/written during development

### During Development

1. Next.js fetches data from Flask API (`http://localhost:3001`)
2. Flask server reads/writes to JSON files
3. **metadata.json is completely bypassed**

### During Build

1. `npm run build` triggers prebuild script
2. Prebuild exports JSON → `metadata.json`
3. Next.js generates static HTML from `metadata.json`
4. Output goes to configured output directory

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server only (read-only) |
| `npm run author` | Start both Next.js and Flask servers |
| `npm run author:server` | Start Flask server only |
| `npm run build` | Build static site (exports metadata first) |
| `npm run preview` | Preview built site locally |
| `npm run export:metadata` | Export JSON to metadata.json |
| `npm run data:reset` | Reset data to default state |
| `npm run data:reset-data` | Reset only view data |
| `npm run data:reset-settings` | Reset only settings |
| `npm run data:reset-interactive` | Interactive reset with options |
| `npm run lint` | Run ESLint |

## Building for Production

```bash
# Build the static site
npm run build

# Preview locally
npm run preview
```

The build process:
1. Exports metadata from JSON files
2. Generates RSS feed
3. Builds static HTML to output directory
4. Copies public directory to output

## Deployment

### GitHub Pages

The site is configured for static export. After building:

1. The output directory contains the full static site
2. All static assets are self-contained

Deploy by pushing to GitHub and enabling Pages on the repository.

## Views System

The site uses a configurable "Views" system instead of hardcoded pages:

- **Views** define pages with paths, titles, and components
- **Components** are building blocks for content
- Configure views in Settings → Views tab
- One view marked as `isHome: true` serves as the root `/` page

### Node Architecture

All views and components implement the **Node** interface for tree-based organization:

```typescript
type NodeId = number;  // Random integer < 2^32

interface Node {
  id: NodeId;              // Unique identifier
  parentId: NodeId | null; // Parent node ID
  previousId: NodeId | null; // Previous sibling for ordering
}
```

This enables:
- Tree traversal (children, siblings, ancestors, descendants)
- Linked-list ordering via `previousId` chains
- Consistent CRUD operations across all entities

### Available Components

| Component | Description |
|-----------|-------------|
| Title | Page title display |
| MarkdownEditor | Editable markdown content |
| Information | Info box with icon |
| Alert | Warning/info alert boxes |
| List | Container for child items (BlogPost, Experience, View, Tag) |
| BlogPost | Single blog post card (used inside List) |
| Experience | Work experience card (used inside List) |
| View | Link to another view (used inside List) |
| Tag | Category/tag link (used inside List) |
| PDFViewer | Embedded PDF display |
| MultiMedia | Image/media display |

### List Component Types

The List component is a polymorphic container that can hold different item types:

- `listType: "BlogPost"` - Contains BlogPost items
- `listType: "Experience"` - Contains Experience items
- `listType: "View"` - Contains View link items
- `listType: "Tag"` - Contains Tag items

## Reserved Paths

These paths are reserved and cannot be used for views:
- `/settings` - Settings page
- `/posts/[slug]` - Individual blog posts
- `/tag/[tag]` - Tag filter pages
- `/feed.xml` - RSS feed

## State Management

Frontend uses Redux Toolkit with these slices:
- **authorSlice**: Author mode toggle, editing state
- **viewSlice**: Current view, components, CRUD operations
- **themeSlice**: Active theme, color scheme preference
- **navigationSlice**: Site name, header/footer nav items

## Development Notes

- The Flask server is only needed for editing content
- Static builds work without Python installed
- All content changes persist to JSON immediately
- Components support inline editing in author mode
