# Settings Architecture

This document describes the settings system used by the blog application.

## Overview

Settings are stored in a **split file structure** under `content/settings/`. This architecture allows for:
- Individual files for each navigation item (easier editing, cleaner diffs)
- Separate concerns (site config, navbar, footer, themes)
- Backward compatibility with legacy `settings.json` format

## Directory Structure

```
content/settings/
├── site.json                 # Site-level configuration
├── navbar/                   # Header navigation items
│   ├── {id}.json            # One file per navbar item
│   └── ...
├── footer/                   # Footer navigation items
│   ├── {id}.json            # One file per footer item
│   └── ...
└── themes/
    ├── config.json          # Theme preferences
    └── custom/              # Custom theme definitions
        ├── {id}.json
        └── ...
```

## Site Configuration

**File:** `content/settings/site.json`

```json
{
  "site_name": "My Blog",
  "default_home_view_id": 1000001
}
```

| Field | Type | Description |
|-------|------|-------------|
| `site_name` | string | Displayed in header and browser tab |
| `default_home_view_id` | number \| null | View ID to display at root path "/" |

### Home View Behavior

- The root path "/" is **reserved** and cannot be used as a view path directly
- Instead, "/" acts as an alias for the view specified by `default_home_view_id`
- Configure via **Settings → Views tab → Default Home View dropdown**
- If no home view is set, the first view (alphabetically by path) is used as fallback

## Navigation Items

Navigation items appear in the header (navbar) and footer of the site.

### Navbar Items

**Directory:** `content/settings/navbar/`

**File:** `{id}.json`

```json
{
  "id": 5000001,
  "label": "Home",
  "linkType": "view",
  "viewId": 1000001,
  "position": "left",
  "icon": null,
  "external": false,
  "order": 0
}
```

### Footer Items

**Directory:** `content/settings/footer/`

**File:** `{id}.json`

```json
{
  "id": 5000004,
  "label": "GitHub",
  "linkType": "url",
  "url": "https://github.com/username",
  "position": "left",
  "icon": "github",
  "external": true,
  "order": 0
}
```

### Navigation Item Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique identifier (auto-generated) |
| `label` | string | Display text |
| `linkType` | "url" \| "view" \| "theme" | Type of link |
| `url` | string | URL (when linkType is "url") |
| `viewId` | number | View ID to link to (when linkType is "view") |
| `position` | "left" \| "right" | Position in navbar |
| `icon` | string \| null | Icon identifier (e.g., "github", "rss") |
| `external` | boolean | Open in new tab (for URL links) |
| `order` | number | Sort order (0 = first) |

### Link Types

1. **`url`** - Links to an external or internal URL
   - Uses `url` field for the destination
   - Set `external: true` for external links (opens in new tab)

2. **`view`** - Links to an internal view
   - Uses `viewId` field to reference the view
   - URL is resolved from the view's path

3. **`theme`** - Theme toggle button
   - Renders as a theme switcher instead of a link

## Theme Configuration

### Theme Config

**File:** `content/settings/themes/config.json`

```json
{
  "active_theme_id": "midnight-blue",
  "color_scheme_preference": "system"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `active_theme_id` | string | ID of the active theme |
| `color_scheme_preference` | "system" \| "light" \| "dark" | Color scheme setting |

### Built-in Themes

- `midnight-blue` - Default dark theme
- `forest-green` - Nature-inspired theme
- `sunset-orange` - Warm theme
- `ocean-breeze` - Cool blue theme

### Custom Themes

**Directory:** `content/settings/themes/custom/`

**File:** `{id}.json`

```json
{
  "id": "my-custom-theme",
  "name": "My Custom Theme",
  "colors": {
    "light": {
      "background": "#ffffff",
      "foreground": "#1a1a1a",
      "link": "#0066cc"
    },
    "dark": {
      "background": "#1a1a1a",
      "foreground": "#ffffff",
      "link": "#66b3ff"
    }
  }
}
```

## Settings UI (Author Mode)

The Settings page (`/settings`) provides a UI for editing all settings:

### General Tab
- **Site Name**: Edit the site name displayed in header

### Views Tab
- **Views List**: Create, edit, delete, reorder views
- **Default Home View**: Dropdown to select which view displays at "/"
- Shows view IDs for debugging

### Navigation Tab
- **Header Navigation**: Add/edit/remove navbar items
- **Footer Navigation**: Add/edit/remove footer items
- Supports drag-and-drop reordering
- Shows item IDs for debugging

### Theme Tab
- **Active Theme**: Select from built-in or custom themes
- **Color Scheme**: System/Light/Dark preference
- **Theme Editor**: Create and edit custom themes

## API Endpoints

### Site Configuration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /site` | GET | Get site configuration |
| `PUT /site` | PUT | Update site configuration |
| `GET /site/home-view` | GET | Get current home view |
| `PUT /site/home-view` | PUT | Set home view |

### Navigation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /navigation` | GET | Get aggregated navigation config |
| `PUT /navigation` | PUT | Update full navigation config |
| `GET /navbar` | GET | List navbar items |
| `POST /navbar` | POST | Create navbar item |
| `PUT /navbar/{id}` | PUT | Update navbar item |
| `DELETE /navbar/{id}` | DELETE | Delete navbar item |
| `PUT /navbar/order` | PUT | Reorder navbar items |
| `GET /footer` | GET | List footer items |
| `POST /footer` | POST | Create footer item |
| `PUT /footer/{id}` | PUT | Update footer item |
| `DELETE /footer/{id}` | DELETE | Delete footer item |
| `PUT /footer/order` | PUT | Reorder footer items |

### Themes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /themes` | GET | Get theme configuration |
| `PUT /themes` | PUT | Update theme configuration |

## Migration from Legacy Format

The system supports automatic fallback to the legacy `content/settings.json` format:

1. New structure is checked first (`content/settings/site.json`)
2. If not found, legacy `content/settings.json` is read
3. Data is automatically converted to new format structure

### Migration Script

Run the migration script to convert from legacy to new format:

```bash
python backend/migrate_settings.py
```

This will:
1. Read `content/settings.json`
2. Create `content/settings/site.json`
3. Create individual files in `content/settings/navbar/`
4. Create individual files in `content/settings/footer/`
5. Create `content/settings/themes/config.json`
6. Backup the original `settings.json`

## ID Display (Author Mode)

In author mode, entity IDs are displayed for debugging:

- **Components**: Shows `id`, `node_id`, `ref_id` on hover
- **Views**: Shows `id` and `root_node_id`
- **Nav Items**: Shows `id`

IDs are displayed in subdued gray (`opacity-60`) to be visible but not distracting.
