# Entity Structure Outline

Visual representation of the current data structure showing how Nodes, References, and Components are connected.

## ID Naming Convention

All IDs use prefixed field names. See `docs/ID_NAMING_CONVENTIONS.md` for complete rules.

| Entity | Primary Key | Example |
|--------|-------------|---------|
| Node | `node_id` | `1234567890` |
| Reference | `ref_id` | `2345678901` |
| Component | `comp_id` | `3456789012` |
| Tag | `tag_id` | `4567890123` |
| NavBar | `nav_bar_id` | `5678901234` |
| Footer | `footer_id` | `6789012345` |
| Theme | `theme_id` | `7890123456` |

---

## View: Home (ViewContainer)

```
NODE 1000001 ──► REF 2000001 ──► COMP 3000001 (ViewContainer)
│                                 └── config: { path: "/", title: "Welcome", child_node_id: 1000002 }
│                                 └── reference_count: 1
│
└── child_node_id: 1000002
    │
    ├── NODE 1000002 ──► REF 2000002 ──► COMP 3000002 (SectionUnit)
    │   │                                 └── config: { text: "Welcome", level: "h1" }
    │   │                                 └── reference_count: 3 (shared)
    │   └── next_node_id: 1000003
    │
    ├── NODE 1000003 ──► REF 2000003 ──► COMP 3000003 (MarkdownUnit)
    │   │                                 └── config: { content: "Welcome to my blog!..." }
    │   └── next_node_id: 1000004
    │
    └── NODE 1000004 ──► REF 2000004 ──► COMP 3000004 (ListContainer)
        │                                 └── config: { list_type: "View", name: "Recent Posts", child_node_id: 1000010 }
        │
        └── child_node_id: 1000010
            │
            ├── NODE 1000010 ──► REF 2000010 ──► COMP 3000008 (LinkUnit)
            │   │                                 └── config: { basic_link: { label: "Post 1", view_node_id: ... } }
            │   │                                 └── reference_count: 2 (shared)
            │   └── next_node_id: 1000011
            │
            └── NODE 1000011 ──► REF 2000011 ──► COMP 3000009 (LinkUnit)
                                                  └── config: { basic_link: { label: "Post 2", view_node_id: ... } }
                                                  └── reference_count: 2 (shared)
```

---

## View: Blog (ViewContainer)

```
NODE 1000100 ──► REF 2000100 ──► COMP 3000100 (ViewContainer)
│                                 └── config: { path: "/blog", title: "Blog", child_node_id: 1000101 }
│
└── child_node_id: 1000101
    │
    ├── NODE 1000101 ──► REF 2000101 ──► COMP 3000002 (SectionUnit) ◄── SHARED
    │   │                                 └── reference_count: 3 (used by Home, Blog, About)
    │   └── next_node_id: 1000102
    │
    └── NODE 1000102 ──► REF 2000102 ──► COMP 3000101 (ListContainer)
        │                                 └── config: { list_type: "View", name: "All Posts" }
        │
        └── child_node_id: 1000110
            │
            ├── NODE 1000110 ──► REF 2000110 ──► COMP 3000008 (LinkUnit) ◄── SHARED
            │   │                                 └── Same component as node 1000010
            │   └── next_node_id: 1000111
            │
            └── NODE 1000111 ──► REF 2000111 ──► COMP 3000009 (LinkUnit) ◄── SHARED
                                                  └── Same component as node 1000011
```

---

## View: About (ViewContainer)

```
NODE 1000200 ──► REF 2000200 ──► COMP 3000200 (ViewContainer)
│                                 └── config: { path: "/about", title: "About Me", child_node_id: 1000201 }
│
└── child_node_id: 1000201
    │
    ├── NODE 1000201 ──► REF 2000201 ──► COMP 3000002 (SectionUnit) ◄── SHARED
    │   │                                 └── reference_count: 3 (used by Home, Blog, About)
    │   └── next_node_id: 1000202
    │
    ├── NODE 1000202 ──► REF 2000202 ──► COMP 3000201 (MarkdownUnit)
    │   │                                 └── config: { content: "# About Me\n\nHi there!..." }
    │   └── next_node_id: 1000203
    │
    └── NODE 1000203 ──► REF 2000203 ──► COMP 3000202 (ListContainer)
        │                                 └── config: { list_type: "View", name: "Experience", child_node_id: 1000210 }
        │
        └── child_node_id: 1000210
            │
            └── NODE 1000210 ──► REF 2000210 ──► COMP 3000203 (ExperienceComponent)
                                                  └── config: { position: "Software Engineer", company: "Example Co" }
```

---

## Component Sharing

The architecture supports component reuse through the Reference layer:

```
Component 3000002 (SectionUnit)
├── reference_count: 3
│
├── REF 2000002 (in View: Home, Node: 1000002)
├── REF 2000101 (in View: Blog, Node: 1000101)
└── REF 2000201 (in View: About, Node: 1000201)

Component 3000008 (LinkUnit: "Post 1")
├── reference_count: 2
│
├── REF 2000010 (in View: Home's List, Node: 1000010)
└── REF 2000110 (in View: Blog's List, Node: 1000110)

Component 3000009 (LinkUnit: "Post 2")
├── reference_count: 2
│
├── REF 2000011 (in View: Home's List, Node: 1000011)
└── REF 2000111 (in View: Blog's List, Node: 1000111)
```

---

## Node Linked-List Structure

Nodes use a doubly-linked list for sibling ordering:

```
Home View (ViewContainer child_node_id: 1000002)
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ NODE 1000002 │───►│ NODE 1000003 │───►│ NODE 1000004 │
│ (SectionUnit)│◄───│ (MarkdownUnit│◄───│(ListContainer│
│ prev: null   │    │ prev: 1000002│    │ prev: 1000003│
│ next: 1000003│    │ next: 1000004│    │ next: null   │
│ parent: 1001 │    │ parent: 1001 │    │ parent: 1001 │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
                                     child_node_id: 1000010
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
             ┌──────────────┐                                   ┌──────────────┐
             │ NODE 1000010 │──────────────────────────────────►│ NODE 1000011 │
             │  (LinkUnit)  │◄──────────────────────────────────│  (LinkUnit)  │
             │ parent: 1004 │                                   │ parent: 1004 │
             │ prev: null   │                                   │ prev: 1000010│
             │ next: 1000011│                                   │ next: null   │
             └──────────────┘                                   └──────────────┘
```

---

## Entity Summary

| Entity Type | Storage Location |
|-------------|------------------|
| Nodes | `content/nodes/{node_id}.json` |
| References | `content/references/{ref_id}.json` |
| Components | `content/components/{Type}/{comp_id}.json` |
| Tags | `content/tags/{tag_id}.json` |

### Components by Type

| Type | Description | Container |
|------|-------------|-----------|
| ViewContainer | Page/view | Yes |
| ListContainer | List of items | Yes |
| InlineContainer | Inline wrapper | Yes |
| StyleContainer | Style wrapper | Yes |
| SectionUnit | Heading | No |
| PlainTextUnit | Plain text | No |
| AlertUnit | Alert box | No |
| MarkdownUnit | Markdown content | No |
| LinkUnit | Link | No |
| ImageMedia | Image | No |
| VideoMedia | Video | No |
| PDFMedia | PDF viewer | No |
| ExperienceComponent | Work experience | No |
| TagListComponent | Tag listing | No |

---

## Resolution Example

When fetching `/nodes/1000001/resolved`, the system:

1. **Load Node** → `{ node_id: 1000001, ref_id: 2000001, ... }`

2. **Load Reference** → `{ ref_id: 2000001, comp_id: 3000001, overrides: null, ... }`

3. **Load Component** → `{ comp_id: 3000001, type: "ViewContainer", config: { path: "/", ... } }`

4. **Merge config with overrides**:
   ```javascript
   final_config = { ...component.config, ...reference.overrides }
   ```

5. **For Container components**, get `child_node_id` and walk sibling chain:
   ```
   ViewContainer.config.child_node_id: 1000002
   → Node 1000002 → Node 1000003 → Node 1000004 (via next_node_id)
   ```

6. **Recursively resolve children** for each node:
   ```
   Node 1000002 → Ref 2000002 → Component 3000002 (SectionUnit)
   Node 1000003 → Ref 2000003 → Component 3000003 (MarkdownUnit)
   Node 1000004 → Ref 2000004 → Component 3000004 (ListContainer)
     → child_node_id: 1000010
       → Node 1000010 → Ref 2000010 → Component 3000008 (LinkUnit)
       → Node 1000011 → Ref 2000011 → Component 3000009 (LinkUnit)
   ```

7. **Return resolved view** with nested component tree.
