# Data Persistence Architecture

This document outlines where each categorical piece of data is persisted, how it is seeded, reset, transferred through the server, and handled by the frontend.

---

## Overview

The application uses a **JSON-based persistence model**:
- **Data JSON** (`content/data.json`) - Primary data store for views, components, posts, relationships, and content
- **Settings JSON** (`content/settings.json`) - Theme and navigation settings
- **Markdown Files** (`content/posts/*.md`) - Blog post content files
- **Metadata JSON** (`content/metadata.json`) - Build-time export only, not used during development

---

## Data Categories

### 1. Views

**Purpose**: Page configurations with path, title, and component hierarchy

**Persistence Location**: `data.json` → `views` object

**Structure**:
```json
{
  "views": {
    "view_home": {
      "id": "view_home",
      "view_type": "page",
      "url_id": null,
      "path": "/",
      "name": "Home",
      "title": "Welcome",
      "browser_title": "Home | My Blog",
      "description": "Welcome to my personal blog",
      "is_home": true,
      "parent_view_id": null,
      "sort_order": 0
    }
  }
}
```

**Seeding**: `content/seed_data.json` → `views` object

**Reset**: `npm run data:reset` copies `seed_data.json` → `data.json`

**Server Transfer**:
- `GET /views` → Returns all views with resolved components
- `PUT /views/{id}` → Creates/updates a view
- `DELETE /views/{id}` → Deletes view and cascades to children

**Frontend Handling**:
- `lib/content/views.server.ts` → `getViewsConfig()` fetches views
- `app/[[...viewPath]]/page.tsx` → Dynamic routing resolves views by path
- `app/components/settings/ViewsTab.tsx` → Settings UI for managing views

---

### 2. Components

**Purpose**: Reusable UI building blocks within views (Title, List, MarkdownEditor, etc.)

**Persistence Location**: `data.json` → `components` object

**Structure**:
```json
{
  "components": {
    "comp_home_title": {
      "id": "comp_home_title",
      "component_type": "Title",
      "config": {"showTitle": true, "level": "h1"},
      "visible": true
    }
  }
}
```

**Seeding**: `content/seed_data.json` → `components` object

**Reset**: Same as views - `npm run data:reset`

**Server Transfer**:
- Components are returned nested within views via `GET /views/{id}`
- `PUT /components/{id}` → Creates/updates a component
- `DELETE /components/{id}` → Deletes component

**Frontend Handling**:
- `lib/content/views.ts` → TypeScript type definitions for all component types
- `app/components/views/ViewComponentRenderer.tsx` → Routes component types to renderers
- `app/components/views/*.tsx` → Individual component implementations

---

### 3. Relationships (Parent-Child Hierarchy)

**Purpose**: Links views to components and components to child components

**Persistence Location**: `data.json` → `relationships` object

**Structure**:
```json
{
  "relationships": {
    "rel_home_1": {
      "id": "rel_home_1",
      "parent_id": "view_home",
      "child_id": "comp_home_title",
      "sort_order": 0
    }
  }
}
```

**Seeding**: `content/seed_data.json` → `relationships` object

**Reset**: Same as views - `npm run data:reset`

**Server Transfer**:
- Relationships are resolved when fetching views (components are nested)
- Updates to component order update `sort_order` in relationships

**Frontend Handling**:
- Relationships are transparent to frontend - views arrive with nested `components[]` array
- `app/components/views/ViewRenderer.tsx` → Renders components in order

---

### 4. Content (Markdown)

**Purpose**: Rich text content for views (e.g., home intro, about bio)

**Persistence Location**: `data.json` → `content` object

**Structure**:
```json
{
  "content": {
    "view_home": {
      "home_intro": "# Welcome to My Blog\n\nThis is my personal space..."
    }
  }
}
```

**Seeding**: `content/seed_data.json` → `content` object

**Reset**: Same as views - `npm run data:reset`

**Server Transfer**:
- `PUT /views/{id}/content` → Updates view content by key
- Content is included in view responses as `content: { [key]: markdown }`

**Frontend Handling**:
- `app/components/views/MarkdownViewComponent.tsx` → Renders and edits markdown
- Content is accessed via `view.content?.[contentKey]`

---

### 5. Posts

**Purpose**: Blog post metadata and categorization

**Persistence Location**:
- Metadata: `data.json` → `posts` object
- Content: `content/posts/{slug}-post.md` files

**Structure**:
```json
{
  "posts": {
    "post_getting_started": {
      "id": "post_getting_started",
      "slug": "getting-started-with-nextjs",
      "title": "Getting Started with Next.js",
      "date": 1705276800000,
      "categories": ["nextjs", "react", "tutorial"],
      "layout": "post",
      "toc": true,
      "is_series": false,
      "series_title": null
    }
  }
}
```

**Seeding**: `content/seed_data.json` → `posts` object

**Reset**: `npm run data:reset` (note: markdown files are NOT deleted)

**Server Transfer**:
- `GET /posts` → Returns all posts with resolved content
- `PUT /posts/{id}` → Creates/updates post metadata
- `DELETE /posts/{id}` → Deletes post (metadata only)

**Frontend Handling**:
- `lib/content/posts.ts` → `getAllPosts()` fetches posts
- `app/posts/[slug]/page.tsx` → Individual post pages
- `app/components/views/BlogPostsListViewComponent.tsx` → Post listing

---

### 6. Themes

**Purpose**: Color schemes and visual styling

**Persistence Location**: `content/settings.json` → `themes` object

**Structure**:
```json
{
  "themes": {
    "activeThemeId": "midnight-blue",
    "colorSchemePreference": "system",
    "customThemes": []
  }
}
```

**Seeding**: `content/reseed_settings.json` → copied to `settings.json`

**Reset**: `npm run data:reset` copies `reseed_settings.json` → `settings.json`

**Server Transfer**:
- `GET /themes` → Returns theme configuration
- `PUT /themes` → Updates theme configuration
- Changes written directly to `settings.json`

**Frontend Handling**:
- `lib/content/themes.server.ts` → `getThemeConfig()` reads themes
- `app/components/theme/ThemeProvider.tsx` → Applies theme CSS variables
- `app/components/settings/ThemeTab.tsx` → Theme selector UI

---

### 7. Navigation

**Purpose**: Site name, header links, footer links

**Persistence Location**: `content/settings.json` → `navigation` object

**Structure**:
```json
{
  "navigation": {
    "siteName": "My Blog",
    "header": [
      {
        "id": "nav_header_1",
        "label": "Home",
        "linkType": "view",
        "viewId": "view_home",
        "url": null,
        "position": "left",
        "icon": null,
        "external": false
      }
    ],
    "footer": [...]
  }
}
```

**Seeding**: `content/reseed_settings.json` → copied to `settings.json`

**Reset**: `npm run data:reset` copies `reseed_settings.json` → `settings.json`

**Server Transfer**:
- `GET /navigation` → Returns navigation configuration
- `PUT /navigation` → Updates navigation configuration
- Changes written directly to `settings.json`

**Frontend Handling**:
- `lib/content/navigation.ts` → TypeScript types for NavItem
- `app/layout.tsx` → Passes nav config to Header/Footer
- `app/components/layout/Header.tsx` → Renders nav items, resolves view paths
- `app/components/layout/Footer.tsx` → Same for footer
- `app/components/settings/NavigationTab.tsx` → Nav editor UI

---

## Data Flow Diagrams

### Author Mode (Development)

```
Frontend (Next.js)    ←── API ──→    Backend (Flask)    ←──→    JSON Files
    localhost:3000                       localhost:3001           content/

  ViewPageClient                         /views                   data.json
  SettingsPage                          /posts                   settings.json
  Header/Footer                         /navigation
                                        /themes
```

### Publish Mode (Build)

```
JSON Files     ──export──→    metadata.json    ──build──→    Static HTML
 data.json                                                      /out
 settings.json               (intermediate)
```

---

## Reset Behavior

| Command | Effect |
|---------|--------|
| `npm run data:reset` | Resets both `data.json` and `settings.json` from seed files |
| `npm run data:reset-data` | Only resets `data.json` from `seed_data.json` |
| `npm run data:reset-settings` | Only resets `settings.json` from `reseed_settings.json` |

---

## File Summary

| File | Purpose |
|------|---------|
| `content/data.json` | JSON database (source of truth for views, components, posts) |
| `content/seed_data.json` | Template for resetting data.json |
| `content/settings.json` | Theme + navigation settings |
| `content/reseed_settings.json` | Template for resetting settings |
| `content/metadata.json` | Build-time export only |
| `content/posts/*.md` | Post markdown content |
| `backend/reset_and_seed.py` | Reset script |
| `backend/server.py` | Flask API server |
| `backend/database.py` | JSON database CRUD functions |
| `backend/export_metadata.py` | Exports data.json to metadata.json for builds |
