# Architecture Refactor Plan: Nodes, References, and Components

> **Status: SUPERSEDED**
>
> This document has been superseded by a comprehensive refactoring plan that includes:
> - New component type names (Title → SectionUnit, etc.)
> - Prefixed ID field names (id → node_id, ref_id, comp_id)
> - Python entity classes
> - Tag entity support
> - Views as ViewContainer components
>
> See the following updated documentation:
> - `docs/ENTITY_UML_SCHEMA.md` - Complete UML class diagram
> - `docs/ID_NAMING_CONVENTIONS.md` - ID field naming rules
> - `docs/DATA_PERSISTENCE.md` - Data flow and storage
> - `docs/ENTITY_STRUCTURE_OUTLINE.md` - Visual entity relationships
>
> ---
>
> **Previous Status: IMPLEMENTED** (Backend Complete)
>
> The backend architecture was implemented with:
> - ✅ New directory structure (views, components/*, references, nodes)
> - ✅ Entity CRUD in database.py
> - ✅ API endpoints for all entities
> - ✅ Example data seed files
> - ✅ Reset and seed script
> - ✅ Integrity validation
> - ✅ TypeScript types updated
> - ✅ Resolution algorithm (backend)
> - ✅ Metadata export for builds

## Overview

This document outlines a major architectural change to separate **structure** (nodes) from **content** (components) with an intermediate **reference** layer enabling component sharing and overrides.

---

## Goals

1. **Component Reuse**: Same component can appear in multiple locations
2. **Automatic Sharing**: All components are implicitly shareable via references
3. **Local Overrides**: Any property can be overridden at a specific location
4. **Reference Counting**: Track usage for cleanup and impact analysis
5. **File-per-Entity**: Each view, component, reference, and node stored in its own JSON file

---

## New Directory Structure

```
content/
├── views/
│   ├── {id}.json           # View metadata (path, title, etc.)
│   └── ...
├── components/
│   ├── Title/
│   │   ├── {id}.json       # Title component config
│   │   └── ...
│   ├── MarkdownEditor/
│   │   ├── {id}.json
│   │   └── ...
│   ├── List/
│   │   └── ...
│   ├── BlogPost/
│   │   └── ...
│   ├── Experience/
│   │   └── ...
│   ├── Information/
│   │   └── ...
│   ├── Alert/
│   │   └── ...
│   ├── MultiMedia/
│   │   └── ...
│   ├── PDFViewer/
│   │   └── ...
│   ├── TagList/
│   │   └── ...
│   └── ViewLink/
│       └── ...
├── references/
│   ├── {id}.json           # Reference with componentId + overrides
│   └── ...
├── nodes/
│   ├── {id}.json           # Node with referenceId + children
│   └── ...
├── settings.json           # Global settings (themes, navigation)
└── metadata.json           # Build-time export (unchanged)
```

---

## Entity Definitions

### 1. View

Views define pages with routing information. Each view has exactly one root node.

```typescript
// content/views/{id}.json
interface View {
  id: NodeId;

  // Routing
  path: string;              // URL path (e.g., "/about")
  isHome?: boolean;          // If true, also serves "/"

  // Display
  name: string;              // Internal name
  title: string;             // Page heading
  browserTitle: string;      // <title> tag
  description?: string;      // Meta description

  // Structure
  rootNodeId: NodeId;        // Entry point to node tree

  // Metadata
  referenceCount: number;    // How many nodes/references point here
  createdAt: string;
  updatedAt: string;
}
```

### 2. Component

Components hold content and configuration. They are type-specific and reusable.

```typescript
// content/components/{Type}/{id}.json
interface Component {
  id: NodeId;
  type: ComponentType;
  config: ComponentConfig;   // Type-specific configuration

  // Metadata
  referenceCount: number;    // How many references point to this
  createdAt: string;
  updatedAt: string;
}

// Example: Title component
// content/components/Title/123456789.json
{
  "id": 123456789,
  "type": "Title",
  "config": {
    "showTitle": true,
    "level": "h1"
  },
  "referenceCount": 3,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

// Example: MarkdownEditor component
// content/components/MarkdownEditor/987654321.json
{
  "id": 987654321,
  "type": "MarkdownEditor",
  "config": {
    "content": "# Welcome\n\nThis is shared content that appears on multiple pages.",
    "placeholder": "Enter markdown..."
  },
  "referenceCount": 2,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 3. Reference

References point to components and can override any config property.

```typescript
// content/references/{id}.json
interface Reference {
  id: NodeId;
  componentId: NodeId;       // Points to a Component
  componentType: ComponentType; // Denormalized for quick access

  // Overrides (partial config that takes precedence)
  overrides?: Partial<ComponentConfig>;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Example: Reference with override
// content/references/111222333.json
{
  "id": 111222333,
  "componentId": 987654321,
  "componentType": "MarkdownEditor",
  "overrides": {
    "placeholder": "Custom placeholder for this location"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

// Example: Reference without override (uses component as-is)
// content/references/444555666.json
{
  "id": 444555666,
  "componentId": 123456789,
  "componentType": "Title",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 4. Node

Nodes define the tree structure. They reference either a Reference (for components) or a View (for view links).

```typescript
// content/nodes/{id}.json
interface Node {
  id: NodeId;

  // What this node points to
  referenceId: NodeId;       // Points to a Reference
  referenceType: ComponentType; // Denormalized from reference

  // Tree structure (doubly-linked list within parent)
  parentNodeId: NodeId | null;  // Parent node (null for root)
  previousNodeId: NodeId | null; // Previous sibling
  nextNodeId: NodeId | null;     // Next sibling

  // Children (ordered list of child node IDs)
  childNodeIds: NodeId[];    // For container types (List)

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Example: Root node for a view
// content/nodes/777888999.json
{
  "id": 777888999,
  "referenceId": 111222333,
  "referenceType": "Title",
  "parentNodeId": null,
  "previousNodeId": null,
  "nextNodeId": 888999000,
  "childNodeIds": [],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         View                                     │
│  id: 100                                                        │
│  path: "/about"                                                 │
│  rootNodeId: 200 ─────────────────────────────┐                 │
│  referenceCount: 1                            │                 │
└───────────────────────────────────────────────│─────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Node (root)                              │
│  id: 200                                                        │
│  referenceId: 300 ────────────────────────────┐                 │
│  parentNodeId: null                           │                 │
│  nextNodeId: 201 ─────────────────┐           │                 │
│  childNodeIds: []                 │           │                 │
└───────────────────────────────────│───────────│─────────────────┘
                                    │           │
                                    ▼           ▼
┌───────────────────────────────────────────────────────────────┐
│                         Node (sibling)  │     Reference        │
│  id: 201                                │  id: 300             │
│  referenceId: 301 ──────────────────────│──componentId: 400 ───┼───┐
│  parentNodeId: null                     │  overrides: null     │   │
│  previousNodeId: 200                    │                      │   │
│  nextNodeId: 202                        └──────────────────────┘   │
│  childNodeIds: [203, 204]                                          │
└──────────────────────────────────────────────────────────────────┘ │
                                                                     │
                    ┌────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Component                                  │
│  id: 400                                                        │
│  type: "Title"                                                  │
│  config: { showTitle: true, level: "h1" }                       │
│  referenceCount: 2  (used by 2 references)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Resolution Algorithm

When rendering a view:

```typescript
async function renderView(viewId: NodeId): Promise<RenderedView> {
  // 1. Load view
  const view = await loadView(viewId);

  // 2. Load node tree starting from rootNodeId
  const rootNode = await loadNode(view.rootNodeId);
  const nodeTree = await buildNodeTree(rootNode);

  // 3. Resolve each node to its final component config
  const resolvedComponents = await resolveNodes(nodeTree);

  return { view, components: resolvedComponents };
}

async function resolveNode(node: Node): Promise<ResolvedComponent> {
  // 1. Load the reference
  const reference = await loadReference(node.referenceId);

  // 2. Load the component
  const component = await loadComponent(reference.componentId);

  // 3. Merge: component.config + reference.overrides
  const finalConfig = {
    ...component.config,
    ...reference.overrides,
  };

  // 4. Recursively resolve children
  const children = await Promise.all(
    node.childNodeIds.map(childId => resolveNode(await loadNode(childId)))
  );

  return {
    nodeId: node.id,
    componentId: component.id,
    referenceId: reference.id,
    type: component.type,
    config: finalConfig,
    children,
  };
}
```

---

## Reference Counting

Reference counts enable:
1. **Orphan detection**: Components/references with count 0 can be cleaned up
2. **Impact analysis**: Show "Used in N places" before editing
3. **Safe deletion**: Warn if deleting a shared component

### Increment/Decrement Rules

| Action | Increment | Decrement |
|--------|-----------|-----------|
| Create reference to component | component.refCount++ | - |
| Delete reference | - | component.refCount-- |
| Create node with reference | reference (implicit, no count) | - |
| View.rootNodeId set | node chain → references → components | - |
| View deleted | - | Cascade: nodes → refs → components |

### Maintaining Counts

```typescript
// When creating a reference
async function createReference(componentId: NodeId, overrides?: object): Promise<Reference> {
  const component = await loadComponent(componentId);
  component.referenceCount++;
  await saveComponent(component);

  const reference = {
    id: generateId(),
    componentId,
    componentType: component.type,
    overrides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveReference(reference);
  return reference;
}

// When deleting a reference
async function deleteReference(referenceId: NodeId): Promise<void> {
  const reference = await loadReference(referenceId);
  const component = await loadComponent(reference.componentId);
  component.referenceCount--;
  await saveComponent(component);
  await removeReference(referenceId);
}
```

---

## Example Data (Fresh Database)

The `example_data/` directory provides seed data for a fresh installation:

### Directory Structure
```
example_data/
├── views/
│   ├── 1000000001.json     # Home view
│   ├── 1000000002.json     # About view
│   └── 1000000003.json     # Blog view
├── components/
│   ├── Title/
│   │   ├── 2000000001.json
│   │   └── 2000000002.json
│   ├── MarkdownEditor/
│   │   ├── 2000000010.json # Shared "About Me" content
│   │   └── 2000000011.json
│   ├── List/
│   │   └── 2000000020.json
│   └── BlogPost/
│       ├── 2000000030.json
│       └── 2000000031.json
├── references/
│   ├── 3000000001.json
│   ├── 3000000002.json     # References same component as 3000000005
│   ├── 3000000003.json
│   ├── 3000000004.json
│   └── 3000000005.json     # References same component as 3000000002 (shared!)
├── nodes/
│   ├── 4000000001.json     # Home root node
│   ├── 4000000002.json
│   ├── 4000000003.json
│   ├── 4000000010.json     # About root node
│   ├── 4000000011.json
│   └── 4000000020.json     # Blog root node
└── settings.json           # Themes and navigation
```

### Example: Shared Component

The "About Me" MarkdownEditor component is shared between Home and About pages:

```json
// example_data/components/MarkdownEditor/2000000010.json
{
  "id": 2000000010,
  "type": "MarkdownEditor",
  "config": {
    "content": "# About Me\n\nI'm a software developer passionate about building great products.",
    "placeholder": "Write about yourself..."
  },
  "referenceCount": 2,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

// example_data/references/3000000002.json (used on Home page)
{
  "id": 3000000002,
  "componentId": 2000000010,
  "componentType": "MarkdownEditor",
  "overrides": {
    "placeholder": "Brief intro for home page"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

// example_data/references/3000000005.json (used on About page, no override)
{
  "id": 3000000005,
  "componentId": 2000000010,
  "componentType": "MarkdownEditor",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Example: Home View

```json
// example_data/views/1000000001.json
{
  "id": 1000000001,
  "path": "/",
  "isHome": true,
  "name": "Home",
  "title": "Welcome",
  "browserTitle": "Home | My Blog",
  "description": "Welcome to my personal blog",
  "rootNodeId": 4000000001,
  "referenceCount": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

// example_data/nodes/4000000001.json (Title node)
{
  "id": 4000000001,
  "referenceId": 3000000001,
  "referenceType": "Title",
  "parentNodeId": null,
  "previousNodeId": null,
  "nextNodeId": 4000000002,
  "childNodeIds": [],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

// example_data/nodes/4000000002.json (About Me markdown node)
{
  "id": 4000000002,
  "referenceId": 3000000002,
  "referenceType": "MarkdownEditor",
  "parentNodeId": null,
  "previousNodeId": 4000000001,
  "nextNodeId": 4000000003,
  "childNodeIds": [],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}

// example_data/nodes/4000000003.json (Recent posts list node)
{
  "id": 4000000003,
  "referenceId": 3000000003,
  "referenceType": "List",
  "parentNodeId": null,
  "previousNodeId": 4000000002,
  "nextNodeId": null,
  "childNodeIds": [4000000004, 4000000005],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Reset Script

```python
# backend/reset_and_seed.py

import os
import shutil
import json

CONTENT_DIR = 'content'
EXAMPLE_DATA_DIR = 'example_data'

ENTITY_DIRS = ['views', 'components', 'references', 'nodes']
COMPONENT_TYPES = [
    'Title', 'MarkdownEditor', 'Information', 'Alert',
    'MultiMedia', 'List', 'Experience', 'BlogPost',
    'PDFViewer', 'TagList', 'ViewLink'
]

def reset_database():
    """Reset the database to example data state."""

    # 1. Clear existing entity directories
    for entity_dir in ENTITY_DIRS:
        dir_path = os.path.join(CONTENT_DIR, entity_dir)
        if os.path.exists(dir_path):
            shutil.rmtree(dir_path)

    # 2. Create fresh directory structure
    os.makedirs(os.path.join(CONTENT_DIR, 'views'), exist_ok=True)
    os.makedirs(os.path.join(CONTENT_DIR, 'references'), exist_ok=True)
    os.makedirs(os.path.join(CONTENT_DIR, 'nodes'), exist_ok=True)

    for comp_type in COMPONENT_TYPES:
        os.makedirs(os.path.join(CONTENT_DIR, 'components', comp_type), exist_ok=True)

    # 3. Copy example data
    for entity_dir in ENTITY_DIRS:
        src_dir = os.path.join(EXAMPLE_DATA_DIR, entity_dir)
        dst_dir = os.path.join(CONTENT_DIR, entity_dir)

        if os.path.exists(src_dir):
            if entity_dir == 'components':
                # Handle nested component type directories
                for comp_type in os.listdir(src_dir):
                    src_type_dir = os.path.join(src_dir, comp_type)
                    dst_type_dir = os.path.join(dst_dir, comp_type)
                    if os.path.isdir(src_type_dir):
                        os.makedirs(dst_type_dir, exist_ok=True)
                        for filename in os.listdir(src_type_dir):
                            shutil.copy2(
                                os.path.join(src_type_dir, filename),
                                os.path.join(dst_type_dir, filename)
                            )
            else:
                for filename in os.listdir(src_dir):
                    if filename.endswith('.json'):
                        shutil.copy2(
                            os.path.join(src_dir, filename),
                            os.path.join(dst_dir, filename)
                        )

    # 4. Copy settings.json
    settings_src = os.path.join(EXAMPLE_DATA_DIR, 'settings.json')
    settings_dst = os.path.join(CONTENT_DIR, 'settings.json')
    if os.path.exists(settings_src):
        shutil.copy2(settings_src, settings_dst)

    print("Database reset to example data state.")

if __name__ == '__main__':
    reset_database()
```

---

## API Endpoints

### Views
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/views` | List all views |
| GET | `/views/{id}` | Get view metadata |
| POST | `/views` | Create view |
| PUT | `/views/{id}` | Update view metadata |
| DELETE | `/views/{id}` | Delete view (cascades) |

### Components
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/components` | List all components |
| GET | `/components/{type}` | List components by type |
| GET | `/components/{type}/{id}` | Get component |
| POST | `/components/{type}` | Create component |
| PUT | `/components/{type}/{id}` | Update component |
| DELETE | `/components/{type}/{id}` | Delete component |

### References
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/references` | List all references |
| GET | `/references/{id}` | Get reference |
| POST | `/references` | Create reference |
| PUT | `/references/{id}` | Update reference (overrides) |
| DELETE | `/references/{id}` | Delete reference |

### Nodes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nodes/{id}` | Get node |
| POST | `/nodes` | Create node |
| PUT | `/nodes/{id}` | Update node |
| DELETE | `/nodes/{id}` | Delete node |
| PUT | `/nodes/{id}/move` | Move node (reorder/reparent) |

### Resolution (Convenience)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/views/{id}/resolved` | Get view with fully resolved component tree |
| GET | `/components/{type}/{id}/usages` | Get all references/nodes using this component |

---

## Frontend Component Editor Changes

### Current Behavior
- Edit component inline
- Changes only affect this location

### New Behavior

When editing, user sees:

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Editing: Welcome Message                                │
│                                                             │
│  ⓘ This component is used in 3 places                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ○ Edit source (affects all 3 locations)             │   │
│  │ ● Edit override (only this location)               │   │
│  │ ○ Detach (create independent copy)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Content:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ # Welcome                                           │   │
│  │                                                     │   │
│  │ This is my blog.                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Overridden in this location:                              │
│  ☑ placeholder: "Custom placeholder"                        │
│                                                             │
│                              [Cancel]  [Save]              │
└─────────────────────────────────────────────────────────────┘
```

### Actions

1. **Edit Source**: Opens component editor, saves to component file
2. **Edit Override**: Opens override editor, saves to reference file
3. **Detach**: Creates new component copy, updates reference to point to it

---

## Data Integrity Constraints

1. **View.rootNodeId** must point to existing node
2. **Node.referenceId** must point to existing reference
3. **Node.parentNodeId** must point to existing node or be null
4. **Node.previousNodeId/nextNodeId** must form valid linked list
5. **Node.childNodeIds** must all point to existing nodes
6. **Reference.componentId** must point to existing component
7. **Component.referenceCount** must equal actual reference count
8. **View.referenceCount** must equal actual usage count

### Validation Script

```python
def validate_integrity():
    errors = []

    # Check all views
    for view in load_all_views():
        if view['rootNodeId'] and not node_exists(view['rootNodeId']):
            errors.append(f"View {view['id']} has invalid rootNodeId")

    # Check all nodes
    for node in load_all_nodes():
        if not reference_exists(node['referenceId']):
            errors.append(f"Node {node['id']} has invalid referenceId")
        if node['parentNodeId'] and not node_exists(node['parentNodeId']):
            errors.append(f"Node {node['id']} has invalid parentNodeId")
        # ... more checks

    # Verify reference counts
    actual_counts = count_references_per_component()
    for component in load_all_components():
        if component['referenceCount'] != actual_counts.get(component['id'], 0):
            errors.append(f"Component {component['id']} has incorrect referenceCount")

    return errors
```

---

## File I/O

### Atomic Writes
Each entity write should be atomic to prevent corruption:

```python
def save_entity(directory, id, data):
    filepath = f"{directory}/{id}.json"
    temp_filepath = f"{filepath}.tmp"

    # Write to temp file
    with open(temp_filepath, 'w') as f:
        json.dump(data, f, indent=2)

    # Atomic rename
    os.rename(temp_filepath, filepath)
```

### Batch Operations
For operations affecting multiple entities (e.g., move node):

```python
def move_node(node_id, new_parent_id, after_node_id):
    with file_lock:
        # Load all affected entities
        node = load_node(node_id)
        old_prev = load_node(node['previousNodeId']) if node['previousNodeId'] else None
        old_next = load_node(node['nextNodeId']) if node['nextNodeId'] else None
        new_after = load_node(after_node_id) if after_node_id else None
        new_before = load_node(new_after['nextNodeId']) if new_after and new_after['nextNodeId'] else None

        # Update all links
        if old_prev:
            old_prev['nextNodeId'] = node['nextNodeId']
        if old_next:
            old_next['previousNodeId'] = node['previousNodeId']

        node['parentNodeId'] = new_parent_id
        node['previousNodeId'] = after_node_id
        node['nextNodeId'] = new_before['id'] if new_before else None

        if new_after:
            new_after['nextNodeId'] = node_id
        if new_before:
            new_before['previousNodeId'] = node_id

        # Save all in batch
        if old_prev: save_node(old_prev)
        if old_next: save_node(old_next)
        if new_after: save_node(new_after)
        if new_before: save_node(new_before)
        save_node(node)
```

---

## Implementation Order

### Sprint 1: Backend Foundation
- [ ] Create new directory structure
- [ ] Implement entity CRUD in database.py
- [ ] Add API endpoints
- [ ] Create example_data seed files
- [ ] Update reset_and_seed.py
- [ ] Add integrity validation

### Sprint 2: Frontend Types & Loading
- [ ] Update TypeScript types in lib/content/
- [ ] Implement resolution algorithm in views.server.ts
- [ ] Update Redux store structure
- [ ] Create entity loading hooks

### Sprint 3: View Rendering
- [ ] Update ViewRenderer to use resolved components
- [ ] Update ViewComponentRenderer
- [ ] Test with seed data

### Sprint 4: Editing & Overrides
- [ ] Update component editors for override support
- [ ] Add "Edit Source" / "Edit Override" / "Detach" UI
- [ ] Implement reference count display
- [ ] Add usage tracking UI

### Sprint 5: Polish
- [ ] Error handling improvements
- [ ] Build/export updates for metadata.json
- [ ] Documentation updates

---

## Open Questions

1. **Should nodes have their own type, or always inherit from reference?**
   - Current plan: Nodes get type from reference (denormalized)
   - Alternative: Nodes are type-agnostic

2. **How to handle component type changes?**
   - Current plan: Don't allow (create new component instead)
   - Alternative: Allow with automatic reference updates

3. **Should View be a component type?**
   - Current plan: View is separate from components
   - Alternative: View as special component, enabling view-in-view

4. **Export format for metadata.json?**
   - Current plan: Resolve all references at build time → flat structure
   - Alternative: Keep references in metadata for client-side resolution

---

## Appendix: TypeScript Type Definitions

```typescript
// lib/content/types.ts (new)

export type NodeId = number;

export type ComponentType =
  | 'Title'
  | 'MarkdownEditor'
  | 'Information'
  | 'Alert'
  | 'MultiMedia'
  | 'List'
  | 'Experience'
  | 'BlogPost'
  | 'PDFViewer'
  | 'TagList'
  | 'ViewLink';

// Base entity with common metadata
interface EntityBase {
  id: NodeId;
  createdAt: string;
  updatedAt: string;
}

// View - represents a page
export interface View extends EntityBase {
  path: string;
  isHome?: boolean;
  name: string;
  title: string;
  browserTitle: string;
  description?: string;
  rootNodeId: NodeId | null;
  referenceCount: number;
}

// Component - holds content/config
export interface Component<T extends ComponentType = ComponentType> extends EntityBase {
  type: T;
  config: ComponentConfigMap[T];
  referenceCount: number;
}

// Reference - points to component with optional overrides
export interface Reference extends EntityBase {
  componentId: NodeId;
  componentType: ComponentType;
  overrides?: Partial<ComponentConfig>;
}

// Node - structural element in tree
export interface Node extends EntityBase {
  referenceId: NodeId;
  referenceType: ComponentType;
  parentNodeId: NodeId | null;
  previousNodeId: NodeId | null;
  nextNodeId: NodeId | null;
  childNodeIds: NodeId[];
}

// Resolved component for rendering
export interface ResolvedComponent {
  nodeId: NodeId;
  referenceId: NodeId;
  componentId: NodeId;
  type: ComponentType;
  config: ComponentConfig;
  children: ResolvedComponent[];
}

// Config types per component
export interface ComponentConfigMap {
  Title: { showTitle: boolean; level?: 'h1' | 'h2' | 'h3' };
  MarkdownEditor: { content: string; placeholder?: string };
  Information: { content: string; style?: 'default' | 'callout' | 'card' };
  Alert: { content: string; variant: 'info' | 'warning' | 'error' | 'success' };
  MultiMedia: { mediaType: 'image' | 'video' | 'embed'; src: string; alt?: string; caption?: string };
  List: { listType: ComponentType; displayMode: 'list' | 'grid' | 'cards'; name?: string; showName?: boolean };
  Experience: { title: string; company?: string; startDate?: string; endDate?: string };
  BlogPost: { postSlug: string; showExcerpt?: boolean; showDate?: boolean; showTags?: boolean };
  PDFViewer: { title: string; src: string; height?: string; displayTitle?: boolean };
  TagList: { sourceType: 'posts' | 'custom'; customTags?: string[]; linkToFilter?: boolean };
  ViewLink: { targetViewId: NodeId | null; displayStyle: 'link' | 'card' | 'button' };
}

export type ComponentConfig = ComponentConfigMap[ComponentType];
```
