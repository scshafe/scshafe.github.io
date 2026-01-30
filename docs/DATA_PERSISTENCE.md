# Data Persistence Architecture

This document outlines where each categorical piece of data is persisted, how it is reset, transferred through the server, and handled by the frontend.

---

## Overview

The application uses a **JSON-based persistence model**:
- **Nodes** (`content/nodes/{node_id}.json`) - Tree structure positions
- **References** (`content/references/{ref_id}.json`) - Component indirection with overrides
- **Components** (`content/components/{Type}/{comp_id}.json`) - Content and configuration
- **Tags** (`content/tags/{tag_id}.json`) - Content categorization
- **Settings** (`content/settings/`) - Site config, navigation, themes
- **Posts** (`content/posts/*.md`) - Blog post markdown files
- **Metadata JSON** (`content/metadata.json`) - Build-time export only, not used during development

---

## Data Categories

### 1. Nodes

**Purpose**: Tree structure positions linking to references

**Persistence Location**: `content/nodes/{node_id}.json` files

**Structure**:
```json
{
  "node_id": 1234567890,
  "ref_id": 2345678901,
  "parent_node_id": null,
  "previous_node_id": null,
  "next_node_id": 1234567891,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Key Concepts**:
- `node_id` - Primary key, random 32-bit unsigned integer
- `ref_id` - Points to the Reference for this node
- `parent_node_id` - Parent node (null for root nodes)
- `previous_node_id` / `next_node_id` - Doubly-linked list for sibling ordering

**Server Transfer**:
- `GET /nodes` → Returns all nodes
- `GET /nodes/{node_id}` → Get single node
- `POST /nodes` → Create node
- `PUT /nodes/{node_id}` → Update node
- `DELETE /nodes/{node_id}` → Delete node (cascades to reference)
- `PUT /nodes/{node_id}/move` → Reposition node in tree

---

### 2. References

**Purpose**: Indirection layer between nodes and components, enabling sharing and overrides

**Persistence Location**: `content/references/{ref_id}.json` files

**Structure**:
```json
{
  "ref_id": 2345678901,
  "node_id": 1234567890,
  "comp_id": 3456789012,
  "overrides": {
    "title": "Custom title for this location"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Key Concepts**:
- `ref_id` - Primary key
- `node_id` - Back-reference to owning node (1:1 relationship)
- `comp_id` - Points to the Component
- `overrides` - Location-specific config that merges with component config

**Server Transfer**:
- `GET /references` → Returns all references
- `GET /references/{ref_id}` → Get single reference
- `POST /references` → Create reference
- `PUT /references/{ref_id}` → Update reference (typically overrides)
- `DELETE /references/{ref_id}` → Delete reference

---

### 3. Components

**Purpose**: Reusable content and configuration

**Persistence Location**: `content/components/{Type}/{comp_id}.json` files

**Structure** (example: ViewContainer):
```json
{
  "comp_id": 3456789012,
  "type": "ViewContainer",
  "config": {
    "path": "/about",
    "name": "about",
    "title": "About",
    "browser_title": "About | My Site",
    "description": null,
    "tag_ids": [4567890123],
    "child_node_id": 1234567892
  },
  "reference_count": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Component Types**:

| Type | Directory | Description |
|------|-----------|-------------|
| ViewContainer | `components/ViewContainer/` | Page/view with path and metadata |
| ListContainer | `components/ListContainer/` | Container for list items |
| InlineContainer | `components/InlineContainer/` | Inline content wrapper |
| StyleContainer | `components/StyleContainer/` | Styling wrapper |
| SectionUnit | `components/SectionUnit/` | Section heading |
| PlainTextUnit | `components/PlainTextUnit/` | Plain text content |
| AlertUnit | `components/AlertUnit/` | Alert boxes |
| MarkdownUnit | `components/MarkdownUnit/` | Markdown content |
| LinkUnit | `components/LinkUnit/` | Link display |
| ImageMedia | `components/ImageMedia/` | Image display |
| VideoMedia | `components/VideoMedia/` | Video display |
| PDFMedia | `components/PDFMedia/` | PDF display |
| ExperienceComponent | `components/ExperienceComponent/` | Work experience |
| TagListComponent | `components/TagListComponent/` | Tag listing |

**Server Transfer**:
- `GET /components` → Returns all components
- `GET /components/{type}` → Components by type
- `GET /components/{type}/{comp_id}` → Get single component
- `POST /components/{type}` → Create component
- `PUT /components/{type}/{comp_id}` → Update component
- `DELETE /components/{type}/{comp_id}` → Delete component
- `GET /components/{type}/{comp_id}/usages` → Find all references using this component

---

### 4. Tags

**Purpose**: Content categorization for views

**Persistence Location**: `content/tags/{tag_id}.json` files

**Structure**:
```json
{
  "tag_id": 4567890123,
  "label": "nextjs",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Server Transfer**:
- `GET /tags` → Returns all tags
- `GET /tags/{tag_id}` → Get single tag
- `POST /tags` → Create tag
- `PUT /tags/{tag_id}` → Update tag
- `DELETE /tags/{tag_id}` → Delete tag

---

### 5. Views (as ViewContainer Components)

**Purpose**: Page configurations with path, title, and component hierarchy

Views are represented as ViewContainer components. A "view" is:
- A **Node** (the root node for this view)
- Which has a **Reference**
- Which points to a **ViewContainer** component

**Structure** (ViewContainer config):
```json
{
  "path": "/about",
  "name": "about",
  "title": "About",
  "browser_title": "About | My Site",
  "description": "About page description",
  "tag_ids": [4567890123, 4567890124],
  "child_node_id": 1234567892
}
```

**Frontend Handling**:
- `lib/content/components.ts` → TypeScript type definitions
- `app/[[...viewPath]]/page.tsx` → Dynamic routing resolves views by path
- `components/settings/ViewsTab.tsx` → Settings UI for managing views

---

### 6. Navigation

**Purpose**: Site name, header links, footer links

**Persistence Location**:
- `content/settings/site.json` - Site name, default home
- `content/settings/navbar/{nav_bar_id}.json` - Header nav items
- `content/settings/footer/{footer_id}.json` - Footer nav items

**Site Config Structure**:
```json
{
  "site_name": "My Blog",
  "default_home_link": {
    "basic_link_id": 6789012345,
    "label": "Home",
    "icon": null,
    "view_node_id": 1234567890,
    "section_node_id": null
  }
}
```

**NavBar Item Structure**:
```json
{
  "nav_bar_id": 5678901234,
  "position": "left",
  "order": 0,
  "internal_link": {
    "basic_link_id": 6789012345,
    "label": "Home",
    "icon": null,
    "view_node_id": 1234567890,
    "section_node_id": null
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Server Transfer**:
- `GET /navigation` → Returns aggregated navigation config
- `PUT /navigation` → Updates navigation config
- `GET /navbar` → Returns all navbar items
- `POST /navbar` → Create navbar item
- `PUT /navbar/{nav_bar_id}` → Update navbar item
- `DELETE /navbar/{nav_bar_id}` → Delete navbar item
- (Same pattern for `/footer`)

---

### 7. Themes

**Purpose**: Color schemes and visual styling

**Persistence Location**:
- `content/settings/themes/config.json` - Active theme, color scheme preference
- `content/settings/themes/custom/{theme_id}.json` - Custom theme definitions

**Config Structure**:
```json
{
  "active_theme_id": 7890123456,
  "color_scheme_preference": "system"
}
```

**Theme Structure**:
```json
{
  "theme_id": 7890123456,
  "name": "Midnight Blue",
  "color_scheme": "dark",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Server Transfer**:
- `GET /themes` → Returns theme configuration
- `PUT /themes` → Updates theme configuration
- `GET /themes/{theme_id}` → Get single theme
- `POST /themes` → Create custom theme
- `PUT /themes/{theme_id}` → Update theme
- `DELETE /themes/{theme_id}` → Delete theme

---

### 8. Posts

**Purpose**: Blog post metadata and content

**Persistence Location**: `content/posts/{slug}-post.md` files with frontmatter

**Structure**:
```markdown
---
title: Getting Started with Next.js
date: 2024-01-15
categories:
  - nextjs
  - react
layout: post
toc: true
is_series: false
---

Post content here...
```

**Server Transfer**:
- `GET /posts` → Returns all posts with resolved content
- `POST /post` → Creates post
- `PUT /post/{slug}` → Updates post
- `DELETE /post/{slug}` → Deletes post file

---

## Entity Relationships

```
Node ──1:1──► Reference ──*:1──► Component
  │                                  │
  │                                  └── Container extends Component
  │                                        └── child_node_id ──► Node (first child)
  │
  └── parent_node_id ──► Node (parent)
  └── previous_node_id ──► Node (previous sibling)
  └── next_node_id ──► Node (next sibling)
```

---

## Data Flow Diagrams

### Author Mode (Development)

```
Frontend (Next.js)    ←── API ──→    Backend (Flask)    ←──→    JSON/MD Files
    localhost:3000                       localhost:3001           content/

  ViewPageClient                         /nodes                  nodes/*.json
  SettingsPage                          /references             references/*.json
  Header/Footer                         /components             components/{Type}/*.json
                                        /tags                   tags/*.json
                                        /navigation             settings/navbar/*.json
                                        /themes                 settings/themes/
                                        /posts                  posts/*.md
```

### Publish Mode (Build)

```
JSON/MD Files  ──export──→    metadata.json    ──build──→    Static HTML
 nodes/*.json                                                    /out
 references/*.json           (intermediate)
 components/{Type}/*.json
 tags/*.json
 settings/
 posts/*.md
```

---

## Reset Behavior

| Command | Effect |
|---------|--------|
| `npm run data:reset` | Resets all data (entities, settings, sample content) |
| `npm run data:reset-data` | Only resets entity data (nodes, references, components) |
| `npm run data:reset-settings` | Only resets settings (site, navigation, themes) |
| `npm run data:reset-interactive` | Interactive reset with options |

---

## File Summary

| File/Directory | Purpose |
|----------------|---------|
| `content/nodes/*.json` | Node entities (tree structure) |
| `content/references/*.json` | Reference entities (indirection layer) |
| `content/components/{Type}/*.json` | Component entities (content/config) |
| `content/tags/*.json` | Tag entities |
| `content/settings/site.json` | Site configuration |
| `content/settings/navbar/*.json` | NavBar entities |
| `content/settings/footer/*.json` | Footer entities |
| `content/settings/themes/config.json` | Theme configuration |
| `content/settings/themes/custom/*.json` | Custom theme definitions |
| `content/posts/*.md` | Post markdown content |
| `content/metadata.json` | Build-time export only |
| `backend/reset_and_seed.py` | Reset script (creates default data) |
| `backend/server.py` | Flask API server |
| `backend/database.py` | JSON database CRUD functions |
| `backend/entities/` | Python entity classes |
| `backend/export_metadata.py` | Exports JSON to metadata.json for builds |
