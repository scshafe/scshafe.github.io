# ID Naming Conventions

This document defines the mandatory naming conventions for all entity IDs throughout the codebase.

---

## Core Principle

**Every ID field must be prefixed with its entity type.**

This ensures:
1. Clear identification of what entity an ID refers to
2. Type safety in TypeScript via branded types
3. Self-documenting code and JSON files
4. Consistent naming across backend (Python) and frontend (TypeScript)

---

## ID Field Names

| Entity | Primary Key Field | Foreign Key Pattern | Type |
|--------|-------------------|---------------------|------|
| Node | `node_id` | `*_node_id` | `NodeId` |
| Reference | `ref_id` | `*_ref_id` | `RefId` |
| Component | `comp_id` | `*_comp_id` | `CompId` |
| Tag | `tag_id` | `*_tag_id` | `TagId` |
| Theme | `theme_id` | `*_theme_id` | `ThemeId` |
| NavBar | `nav_bar_id` | `*_nav_bar_id` | `NavBarId` |
| Footer | `footer_id` | `*_footer_id` | `FooterId` |
| BasicLink | `basic_link_id` | `*_basic_link_id` | `BasicLinkId` |

---

## Field Naming Examples

### Node Entity

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

### Reference Entity

```json
{
  "ref_id": 2345678901,
  "node_id": 1234567890,
  "comp_id": 3456789012,
  "overrides": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Component Entity (ViewContainer)

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

### Container Component (ListContainer)

```json
{
  "comp_id": 3456789013,
  "type": "ListContainer",
  "config": {
    "list_type": "View",
    "display_mode": "cards",
    "name": "Recent Posts",
    "child_node_id": 1234567893
  },
  "reference_count": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Tag Entity

```json
{
  "tag_id": 4567890123,
  "label": "nextjs",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### NavBar Entity

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

### Theme Entity

```json
{
  "theme_id": 7890123456,
  "name": "Midnight Blue",
  "color_scheme": "dark",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## Migration from Old Names

| Old Field Name | New Field Name |
|----------------|----------------|
| `id` | Entity-specific: `node_id`, `ref_id`, `comp_id`, etc. |
| `componentId` | `comp_id` |
| `referenceId` | `ref_id` |
| `parentNodeId` | `parent_node_id` |
| `previousNodeId` | `previous_node_id` |
| `nextNodeId` | `next_node_id` |
| `childNodeIds` | `child_node_id` (single ID, not array) |
| `rootNodeId` | Removed - use `child_node_id` in ViewContainer |
| `referenceCount` | `reference_count` |
| `browserTitle` | `browser_title` |
| `tagIds` | `tag_ids` |
| `listType` | `list_type` |
| `displayMode` | `display_mode` |
| `colorScheme` | `color_scheme` |
| `viewId` | `view_node_id` |
| `sectionId` | `section_node_id` |

---

## TypeScript Branded Types

Use branded types for compile-time type safety:

```typescript
// Branded type definitions
export type NodeId = number & { readonly __brand: 'NodeId' };
export type RefId = number & { readonly __brand: 'RefId' };
export type CompId = number & { readonly __brand: 'CompId' };
export type TagId = number & { readonly __brand: 'TagId' };
export type ThemeId = number & { readonly __brand: 'ThemeId' };
export type NavBarId = number & { readonly __brand: 'NavBarId' };
export type FooterId = number & { readonly __brand: 'FooterId' };
export type BasicLinkId = number & { readonly __brand: 'BasicLinkId' };

// Helper functions to cast raw numbers
export const asNodeId = (n: number): NodeId => n as NodeId;
export const asRefId = (n: number): RefId => n as RefId;
export const asCompId = (n: number): CompId => n as CompId;
export const asTagId = (n: number): TagId => n as TagId;
export const asThemeId = (n: number): ThemeId => n as ThemeId;
export const asNavBarId = (n: number): NavBarId => n as NavBarId;
export const asFooterId = (n: number): FooterId => n as FooterId;
export const asBasicLinkId = (n: number): BasicLinkId => n as BasicLinkId;
```

---

## Python Conventions

In Python, use snake_case consistently:

```python
@dataclass
class Node:
    node_id: int
    ref_id: int
    parent_node_id: Optional[int] = None
    previous_node_id: Optional[int] = None
    next_node_id: Optional[int] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
```

---

## API Request/Response Format

All API endpoints use snake_case for JSON field names:

```json
// POST /nodes
{
  "ref_id": 2345678901,
  "parent_node_id": 1234567890
}

// Response
{
  "node_id": 1234567891,
  "ref_id": 2345678901,
  "parent_node_id": 1234567890,
  "previous_node_id": null,
  "next_node_id": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## Storage Paths

Entity files are stored with their numeric ID as filename:

| Entity | Storage Path |
|--------|--------------|
| Node | `content/nodes/{node_id}.json` |
| Reference | `content/references/{ref_id}.json` |
| Component | `content/components/{Type}/{comp_id}.json` |
| Tag | `content/tags/{tag_id}.json` |
| NavBar | `content/settings/navbar/{nav_bar_id}.json` |
| Footer | `content/settings/footer/{footer_id}.json` |
| Theme | `content/settings/themes/custom/{theme_id}.json` |

---

## Checklist

When adding a new entity type:

- [ ] Define the primary key field with `{entity}_id` pattern
- [ ] Add TypeScript branded type
- [ ] Add helper cast function
- [ ] Add Python dataclass with snake_case fields
- [ ] Update this document
- [ ] Update `docs/ENTITY_UML_SCHEMA.md`
