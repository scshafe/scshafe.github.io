# Project Overview

A Next.js static blog with a configurable Views system. Features **Author Mode** for local content editing via Flask/JSON and **Publish Mode** for generating static HTML for deployment.

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
│                            │  data.json   │                     │
│                            │ settings.json│                     │
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

## Directory Structure

```
├── app/                      # Next.js App Router pages
│   ├── [[...viewPath]]/      # Dynamic catch-all route for views
│   ├── components/           # React components
│   │   ├── views/            # View system components
│   │   │   ├── ViewRenderer.tsx
│   │   │   ├── ViewComponentRenderer.tsx
│   │   │   ├── AddComponentButton.tsx
│   │   │   └── [Component]ViewComponent.tsx
│   │   ├── posts/            # Blog post components
│   │   ├── settings/         # Settings page UI components
│   │   └── layout/           # Header, Footer
│   ├── posts/[slug]/         # Individual blog post pages
│   ├── category/[category]/  # Category listing pages
│   └── settings/             # Author-only settings page
├── backend/                  # Python Flask server
│   ├── server.py             # Main API server
│   ├── database.py           # JSON database module
│   ├── export_metadata.py    # Exports JSON to metadata.json for builds
│   └── reset_and_seed.py     # Reset data to seed state
├── content/
│   ├── data.json             # JSON database (source of truth)
│   ├── seed_data.json        # Template for resetting data
│   ├── settings.json         # Theme and navigation settings
│   ├── reseed_settings.json  # Template for resetting settings
│   ├── metadata.json         # Generated at build time only
│   └── posts/                # Markdown blog post files
├── example_data/             # Example data files for reference
│   ├── settings.json
│   ├── experiences.json
│   └── views/                # Example view configurations
├── lib/
│   ├── content/
│   │   ├── views.ts          # View system type definitions & Node interface
│   │   ├── views.server.ts   # Server-side view loading
│   │   ├── posts.ts          # Post loading utilities
│   │   └── types.ts          # Shared TypeScript types
│   └── store/                # Redux Toolkit store
│       ├── index.ts          # Store configuration
│       ├── hooks.ts          # Typed hooks
│       └── slices/           # Redux slices
│           ├── authorSlice.ts
│           ├── viewSlice.ts
│           └── settingsSlice.ts
├── public/                   # Static assets
│   ├── images/               # Image files
│   └── pdfs/                 # PDF files
└── out/                      # Static build output
```

## Data Flow

### Source of Truth

- **JSON database** (`content/data.json`) is the single source of truth for views, components, posts
- **Settings JSON** (`content/settings.json`) stores theme and navigation
- **Markdown files** (`content/posts/*.md`) store post content
- **metadata.json** is ONLY generated at build time, never read/written during development

### During Development (Author Mode)

1. Next.js fetches data from Flask API (`http://localhost:3001`)
2. Flask server reads/writes to JSON files
3. **metadata.json is completely bypassed**

### During Build (Publish Mode)

1. `npm run build` triggers prebuild script
2. Prebuild exports JSON → `metadata.json`
3. Next.js generates static HTML from `metadata.json`
4. Output goes to `/out` directory

## Node Architecture

All views and components implement the **Node** interface for tree-based organization:

```typescript
interface Node {
  id: string;              // Unique identifier
  parentId: string | null; // Parent node ID (null for root nodes)
  previousId: string | null; // Previous sibling for ordering (null if first)
}
```

### Key Concepts

- **Tree Structure**: Views contain components, List components contain child items
- **Linked-List Ordering**: `previousId` chains define sibling order
- **Polymorphism**: All entity types extend Node for consistent operations

### Node Operations (lib/content/views.ts)

```typescript
// Selectors
selectChildren(store, parentId)      // Get all children of a node
selectNextSibling(store, nodeId)     // Get next sibling
selectPreviousSibling(store, nodeId) // Get previous sibling
selectAncestors(store, nodeId)       // Get all ancestors
selectDescendants(store, nodeId)     // Get all descendants
selectFirstChild(store, parentId)    // Get first child (previousId === null)
selectLastChild(store, parentId)     // Get last child (no next sibling)

// Mutations
insertNodeAfter(store, newNode, afterNodeId, parentId)
removeNode(store, nodeId)
moveNode(store, nodeId, newParentId, afterNodeId)
```

### Redux Selectors (lib/store/slices/viewSlice.ts)

```typescript
selectComponentById(state, componentId)
selectComponentChildren(state, componentId)
selectComponentParent(state, componentId)
selectComponentsMap(state)
selectNextComponent(state, componentId)
selectPreviousComponent(state, componentId)
selectComponentsByType(state, type)
```

## Views System

The site uses a configurable **Views** system where each page is a "view" containing ordered components:

- **View**: A page with path, title, browser title, and list of components
- **Components**: Building blocks that render content

### Component Types

| Type | Description | Container |
|------|-------------|-----------|
| Title | Page title display | No |
| MarkdownEditor | Editable markdown content | No |
| Information | Info box with icon | No |
| Alert | Warning/info alert boxes | No |
| List | Container for child items | Yes |
| BlogPost | Single blog post card | No (List child) |
| Experience | Work experience card | No (List child) |
| View | Link to another view | No (List child) |
| Tag | Category/tag link | No (List child) |
| PDFViewer | Embedded PDF display | No |
| MultiMedia | Image/media display | No |

### List Component

The List component is a polymorphic container:

```typescript
interface ListComponent extends ViewComponentBase {
  type: 'List';
  config: {
    listType: 'BlogPost' | 'Experience' | 'View' | 'Tag';
    displayMode: 'list' | 'grid' | 'compact';
    name: string;
    showName: boolean;
    collapsible: boolean;
    defaultExpanded: boolean;
    showAddButton: boolean;
    maxItems?: number;
  };
  children: ViewComponent[]; // Child items of matching listType
}
```

Views are configured via Settings → Views tab. One view marked as `isHome: true` serves as the root `/` page.

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server only (read-only, no editing) |
| `npm run author` | Start both Next.js and Flask servers (full editing) |
| `npm run author:server` | Start Flask server only |
| `npm run build` | Build static site (exports metadata first) |
| `npm run preview` | Preview built static site locally |
| `npm run export:metadata` | Export data.json to metadata.json |
| `npm run data:reset` | Reset data.json and settings.json to seed state |
| `npm run data:reset-data` | Reset only data.json |
| `npm run data:reset-settings` | Reset only settings.json |
| `npm run data:reset-interactive` | Interactive reset with step-by-step options |
| `npm run lint` | Run ESLint |
| `npm run start` | Start Next.js production server |

## Workflows

### Starting Fresh

```bash
npm run data:reset
npm run author
```

This resets data from seed files:
- Views: Home, About, Blog, Resume
- Sample components and content
- Default navigation and theme

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

All changes persist immediately to JSON files.

### Publish Mode (Building for Production)

```bash
npm run build
npm run preview  # Optional: preview locally
```

Build process:
1. Exports JSON → `metadata.json`
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

## Data Structure (data.json)

| Section | Purpose |
|---------|---------|
| `views` | Page configurations keyed by ID |
| `components` | Components keyed by ID |
| `relationships` | Parent-child links for nesting |
| `posts` | Blog post metadata keyed by ID |
| `content` | Markdown content keyed by owner ID |
| `settings` | Key-value settings |

## State Management

Frontend uses Redux Toolkit with these slices:

- **authorSlice**: Author mode toggle, editing state
- **viewSlice**: Current view, components, CRUD operations
- **settingsSlice**: Theme, navigation configuration

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
