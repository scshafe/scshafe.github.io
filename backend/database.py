"""
JSON File-Based Database Module

Storage Architecture:
  - content/nodes/{node_id}.json: Tree structure nodes
  - content/references/{ref_id}.json: References with optional overrides
  - content/components/{Type}/{comp_id}.json: Component content and config
  - content/tags/{tag_id}.json: Tag entities
  - content/settings/site.json: Site configuration
  - content/settings/navbar/{nav_bar_id}.json: Navbar items
  - content/settings/footer/{footer_id}.json: Footer items
  - content/settings/themes/config.json: Theme configuration
  - content/settings/themes/custom/{theme_id}.json: Custom themes

Entity relationships:
  Node -> ref_id -> Reference -> comp_id -> Component
  Container components have child_node_id pointing to first child Node

Field naming convention (snake_case with prefixed IDs):
  - node_id, ref_id, comp_id, tag_id, theme_id, nav_bar_id, footer_id
  - parent_node_id, previous_node_id, next_node_id, child_node_id
  - reference_count, created_at, updated_at
"""

import json
import threading
import os
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any, Union
from contextlib import contextmanager

from entities import (
    generate_id,
    Node, Reference,
    Component, Container,
    ViewContainer, ListContainer, InlineContainer, StyleContainer,
    SectionUnit, PlainTextUnit, AlertUnit, MarkdownUnit, LinkUnit,
    ImageMedia, VideoMedia, PDFMedia,
    ExperienceComponent, TagListComponent,
    Tag, Theme, NavBar, Footer, SiteConfig,
    InternalLink,
    COMPONENT_TYPES as COMPONENT_TYPE_MAP,
    component_from_dict,
)

logger = logging.getLogger('database')


# ============ COMPONENT TYPES ============

COMPONENT_TYPES = [
    # Containers
    'ViewContainer', 'ListContainer', 'InlineContainer', 'StyleContainer',
    # Units
    'SectionUnit', 'PlainTextUnit', 'AlertUnit', 'MarkdownUnit', 'LinkUnit',
    # Media
    'ImageMedia', 'VideoMedia', 'PDFMedia',
    # Leaf
    'ExperienceComponent', 'TagListComponent',
]


# ============ FILE PATHS ============

CONTENT_DIR = Path(__file__).parent.parent / 'content'
NODES_DIR = CONTENT_DIR / 'nodes'
REFERENCES_DIR = CONTENT_DIR / 'references'
COMPONENTS_DIR = CONTENT_DIR / 'components'
TAGS_DIR = CONTENT_DIR / 'tags'

# Settings structure
SETTINGS_DIR = CONTENT_DIR / 'settings'
SITE_CONFIG_PATH = SETTINGS_DIR / 'site.json'
NAVBAR_DIR = SETTINGS_DIR / 'navbar'
FOOTER_DIR = SETTINGS_DIR / 'footer'
THEMES_DIR = SETTINGS_DIR / 'themes'
THEME_CONFIG_PATH = THEMES_DIR / 'config.json'
CUSTOM_THEMES_DIR = THEMES_DIR / 'custom'

# Legacy settings path (for migration)
LEGACY_SETTINGS_PATH = CONTENT_DIR / 'settings.json'

# Thread lock for file access
_file_lock = threading.Lock()


# ============ GENERIC FILE OPERATIONS ============

def _ensure_dirs():
    """Ensure all required directories exist."""
    logger.debug("Ensuring directories exist")
    NODES_DIR.mkdir(parents=True, exist_ok=True)
    REFERENCES_DIR.mkdir(parents=True, exist_ok=True)
    TAGS_DIR.mkdir(parents=True, exist_ok=True)
    for comp_type in COMPONENT_TYPES:
        (COMPONENTS_DIR / comp_type).mkdir(parents=True, exist_ok=True)
    # Settings directories
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    NAVBAR_DIR.mkdir(parents=True, exist_ok=True)
    FOOTER_DIR.mkdir(parents=True, exist_ok=True)
    THEMES_DIR.mkdir(parents=True, exist_ok=True)
    CUSTOM_THEMES_DIR.mkdir(parents=True, exist_ok=True)


def _content_dir_name(path: Path) -> str:
    """Get the content directory name for logging (e.g., 'nodes', 'components/ViewContainer')."""
    try:
        rel_path = path.relative_to(CONTENT_DIR)
        parts = rel_path.parts
        if len(parts) >= 2:
            # e.g., components/ViewContainer/123.json -> components/ViewContainer
            return '/'.join(parts[:-1])
        elif len(parts) == 1:
            return parts[0].replace('.json', '')
        return str(rel_path)
    except ValueError:
        return str(path)


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    """Load JSON from a file."""
    dir_name = _content_dir_name(path)
    with _file_lock:
        if path.exists():
            try:
                data = json.loads(path.read_text())
                logger.debug(f"[{dir_name}] LOAD {path.name}")
                return data
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"[{dir_name}] LOAD FAILED {path.name}: {e}")
        else:
            logger.debug(f"[{dir_name}] LOAD NOT FOUND {path.name}")
    return None


def _save_json(path: Path, data: Dict[str, Any]) -> None:
    """Save JSON to a file atomically."""
    dir_name = _content_dir_name(path)
    with _file_lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = path.with_suffix('.json.tmp')
        temp_path.write_text(json.dumps(data, indent=2))
        temp_path.rename(path)
        # Log key identifiers from the data
        id_info = []
        for key in ['node_id', 'ref_id', 'comp_id', 'tag_id', 'nav_bar_id', 'footer_id', 'theme_id']:
            if key in data:
                id_info.append(f"{key}={data[key]}")
        id_str = ', '.join(id_info) if id_info else ''
        logger.debug(f"[{dir_name}] SAVE {path.name} ({id_str})")


def _delete_file(path: Path) -> bool:
    """Delete a file if it exists."""
    dir_name = _content_dir_name(path)
    with _file_lock:
        if path.exists():
            path.unlink()
            logger.debug(f"[{dir_name}] DELETE {path.name}")
            return True
        else:
            logger.debug(f"[{dir_name}] DELETE NOT FOUND {path.name}")
    return False


def _list_json_files(directory: Path) -> List[Path]:
    """List all JSON files in a directory."""
    dir_name = _content_dir_name(directory / 'dummy.json')
    with _file_lock:
        if directory.exists():
            files = list(directory.glob('*.json'))
            logger.debug(f"[{dir_name}] LIST found {len(files)} files")
            return files
        else:
            logger.debug(f"[{dir_name}] LIST directory not found")
    return []


# ============ ATOMIC OPERATIONS ============

class AtomicTransaction:
    """Simple transaction tracking for rollback on failure."""

    def __init__(self):
        self.created_files: List[Path] = []
        self.modified_files: Dict[Path, Dict[str, Any]] = {}

    def track_create(self, path: Path):
        """Track a newly created file."""
        self.created_files.append(path)

    def track_modify(self, path: Path, original_data: Dict[str, Any]):
        """Track a modified file with its original data."""
        if path not in self.modified_files:
            self.modified_files[path] = original_data

    def rollback(self):
        """Rollback all changes."""
        logger.warning("Rolling back transaction")
        # Delete created files
        for path in self.created_files:
            _delete_file(path)
        # Restore modified files
        for path, data in self.modified_files.items():
            _save_json(path, data)

    def commit(self):
        """Commit transaction (no-op, changes already written)."""
        logger.debug("Transaction committed")


@contextmanager
def atomic_write():
    """Context manager for atomic multi-file writes."""
    transaction = AtomicTransaction()
    try:
        yield transaction
        transaction.commit()
    except Exception as e:
        logger.error(f"Transaction failed: {e}")
        transaction.rollback()
        raise


# ============ NODES ============

def _node_path(node_id: int) -> Path:
    return NODES_DIR / f"{node_id}.json"


def load_node(node_id: int) -> Optional[Node]:
    """Load a node by ID."""
    logger.debug(f"Loading node: node_id={node_id}")
    data = _load_json(_node_path(node_id))
    if data:
        return Node.from_dict(data)
    return None


def save_node(node: Union[Node, Dict[str, Any]]) -> int:
    """Save a node. Returns the node_id."""
    if isinstance(node, dict):
        # Convert dict to Node
        if 'node_id' not in node:
            node['node_id'] = generate_id()
        node = Node.from_dict(node)

    node.update_timestamp()
    data = node.to_dict()
    _save_json(_node_path(node.node_id), data)
    logger.debug(f"Saved node: node_id={node.node_id}")
    return node.node_id


def delete_node(node_id: int) -> bool:
    """Delete a node and its reference."""
    logger.debug(f"Deleting node: node_id={node_id}")
    node = load_node(node_id)
    if not node:
        return False

    # Delete the reference
    if node.ref_id:
        delete_reference(node.ref_id)

    return _delete_file(_node_path(node_id))


def _delete_node_tree(node_id: int) -> None:
    """Recursively delete a node and all its descendants via linked list."""
    logger.debug(f"Deleting node tree starting at: node_id={node_id}")
    node = load_node(node_id)
    if not node:
        return

    # Follow next sibling chain first
    if node.next_node_id:
        _delete_node_tree(node.next_node_id)

    # Get the reference to check for container with children
    ref = load_reference(node.ref_id) if node.ref_id else None
    if ref:
        comp = load_component_by_id(ref.comp_id)
        if comp and isinstance(comp, Container) and comp.child_node_id:
            _delete_node_tree(comp.child_node_id)

    # Delete this node
    delete_node(node_id)


def get_all_nodes() -> List[Node]:
    """Get all nodes."""
    logger.debug("Getting all nodes")
    nodes = []
    for path in _list_json_files(NODES_DIR):
        data = _load_json(path)
        if data:
            nodes.append(Node.from_dict(data))
    return nodes


def move_node(node_id: int, new_parent_id: Optional[int], after_node_id: Optional[int]) -> bool:
    """Move a node to a new position."""
    logger.debug(f"Moving node: node_id={node_id}, new_parent={new_parent_id}, after={after_node_id}")
    node = load_node(node_id)
    if not node:
        return False

    # Remove from old position
    old_prev = load_node(node.previous_node_id) if node.previous_node_id else None
    old_next = load_node(node.next_node_id) if node.next_node_id else None

    if old_prev:
        old_prev.next_node_id = node.next_node_id
        save_node(old_prev)
    if old_next:
        old_next.previous_node_id = node.previous_node_id
        save_node(old_next)

    # Insert at new position
    new_after = load_node(after_node_id) if after_node_id else None
    new_before = None
    if new_after and new_after.next_node_id:
        new_before = load_node(new_after.next_node_id)

    node.parent_node_id = new_parent_id
    node.previous_node_id = after_node_id
    node.next_node_id = new_before.node_id if new_before else None

    if new_after:
        new_after.next_node_id = node_id
        save_node(new_after)
    if new_before:
        new_before.previous_node_id = node_id
        save_node(new_before)

    save_node(node)
    return True


# ============ REFERENCES ============

def _reference_path(ref_id: int) -> Path:
    return REFERENCES_DIR / f"{ref_id}.json"


def load_reference(ref_id: int) -> Optional[Reference]:
    """Load a reference by ID."""
    logger.debug(f"Loading reference: ref_id={ref_id}")
    data = _load_json(_reference_path(ref_id))
    if data:
        return Reference.from_dict(data)
    return None


def save_reference(ref: Union[Reference, Dict[str, Any]]) -> int:
    """Save a reference. Returns the ref_id."""
    if isinstance(ref, dict):
        if 'ref_id' not in ref:
            ref['ref_id'] = generate_id()
        ref = Reference.from_dict(ref)

    ref.update_timestamp()
    data = ref.to_dict()
    _save_json(_reference_path(ref.ref_id), data)
    logger.debug(f"Saved reference: ref_id={ref.ref_id}")
    return ref.ref_id


def delete_reference(ref_id: int) -> bool:
    """Delete a reference and decrement the component's ref count."""
    logger.debug(f"Deleting reference: ref_id={ref_id}")
    ref = load_reference(ref_id)
    if ref:
        decrement_component_ref_count(ref.comp_id)
        return _delete_file(_reference_path(ref_id))
    return False


def get_all_references() -> List[Reference]:
    """Get all references."""
    logger.debug("Getting all references")
    references = []
    for path in _list_json_files(REFERENCES_DIR):
        data = _load_json(path)
        if data:
            references.append(Reference.from_dict(data))
    return references


def create_reference_to_component(comp_id: int, overrides: Optional[Dict] = None, node_id: int = 0) -> int:
    """Create a new reference to a component and increment ref count."""
    logger.debug(f"Creating reference to component: comp_id={comp_id}")
    increment_component_ref_count(comp_id)

    ref = Reference(
        ref_id=generate_id(),
        node_id=node_id,
        comp_id=comp_id,
        overrides=overrides,
    )
    return save_reference(ref)


# ============ COMPONENTS ============

def _component_path(comp_type: str, comp_id: int) -> Path:
    return COMPONENTS_DIR / comp_type / f"{comp_id}.json"


def load_component(comp_type: str, comp_id: int) -> Optional[Component]:
    """Load a component by type and ID."""
    logger.debug(f"Loading component: type={comp_type}, comp_id={comp_id}")
    data = _load_json(_component_path(comp_type, comp_id))
    if data:
        return component_from_dict(data)
    return None


def load_component_by_id(comp_id: int) -> Optional[Component]:
    """Load a component by ID, searching all types."""
    logger.debug(f"Loading component by ID: comp_id={comp_id}")
    for comp_type in COMPONENT_TYPES:
        comp = load_component(comp_type, comp_id)
        if comp:
            return comp
    return None


def save_component(comp: Union[Component, Dict[str, Any]]) -> int:
    """Save a component. Returns the comp_id."""
    if isinstance(comp, dict):
        if 'comp_id' not in comp:
            comp['comp_id'] = generate_id()
        comp = component_from_dict(comp)

    comp.update_timestamp()
    data = comp.to_dict()
    _save_json(_component_path(comp.type, comp.comp_id), data)
    logger.debug(f"Saved component: type={comp.type}, comp_id={comp.comp_id}")
    return comp.comp_id


def delete_component(comp_type: str, comp_id: int) -> bool:
    """Delete a component."""
    logger.debug(f"Deleting component: type={comp_type}, comp_id={comp_id}")
    return _delete_file(_component_path(comp_type, comp_id))


def get_all_components(comp_type: Optional[str] = None) -> List[Component]:
    """Get all components, optionally filtered by type."""
    logger.debug(f"Getting all components: type_filter={comp_type}")
    components = []
    types_to_check = [comp_type] if comp_type else COMPONENT_TYPES

    for t in types_to_check:
        type_dir = COMPONENTS_DIR / t
        for path in _list_json_files(type_dir):
            data = _load_json(path)
            if data:
                components.append(component_from_dict(data))

    return components


def increment_component_ref_count(comp_id: int) -> bool:
    """Increment a component's reference count."""
    logger.debug(f"Incrementing reference count: comp_id={comp_id}")
    comp = load_component_by_id(comp_id)
    if comp:
        comp.increment_reference_count()
        save_component(comp)
        return True
    return False


def decrement_component_ref_count(comp_id: int) -> bool:
    """Decrement a component's reference count."""
    logger.debug(f"Decrementing reference count: comp_id={comp_id}")
    comp = load_component_by_id(comp_id)
    if comp:
        comp.decrement_reference_count()
        save_component(comp)
        return True
    return False


# ============ TAGS ============

def _tag_path(tag_id: int) -> Path:
    return TAGS_DIR / f"{tag_id}.json"


def load_tag(tag_id: int) -> Optional[Tag]:
    """Load a tag by ID."""
    logger.debug(f"Loading tag: tag_id={tag_id}")
    data = _load_json(_tag_path(tag_id))
    if data:
        return Tag.from_dict(data)
    return None


def save_tag(tag: Union[Tag, Dict[str, Any]]) -> int:
    """Save a tag. Returns the tag_id."""
    if isinstance(tag, dict):
        if 'tag_id' not in tag:
            tag['tag_id'] = generate_id()
        tag = Tag.from_dict(tag)

    tag.update_timestamp()
    data = tag.to_dict()
    _save_json(_tag_path(tag.tag_id), data)
    logger.debug(f"Saved tag: tag_id={tag.tag_id}, label={tag.label}")
    return tag.tag_id


def delete_tag(tag_id: int) -> bool:
    """Delete a tag."""
    logger.debug(f"Deleting tag: tag_id={tag_id}")
    return _delete_file(_tag_path(tag_id))


def get_all_tags() -> List[Tag]:
    """Get all tags."""
    logger.debug("Getting all tags")
    tags = []
    for path in _list_json_files(TAGS_DIR):
        data = _load_json(path)
        if data:
            tags.append(Tag.from_dict(data))
    return tags


# ============ VIEWS (as ViewContainer Components) ============

def get_all_views() -> List[ViewContainer]:
    """Get all ViewContainer components (these are the 'views')."""
    logger.debug("Getting all views (ViewContainers)")
    return [c for c in get_all_components('ViewContainer') if isinstance(c, ViewContainer)]


def get_view_by_path(path: str) -> Optional[Dict[str, Any]]:
    """Get a resolved view by its URL path."""
    logger.debug(f"Getting view by path: {path}")

    # Handle root path
    if path == '/':
        return get_home_view()

    for view in get_all_views():
        if view.path == path:
            # Find the node that references this ViewContainer
            for ref in get_all_references():
                if ref.comp_id == view.comp_id:
                    node = load_node(ref.node_id) if ref.node_id else None
                    if node:
                        return resolve_node(node.node_id)
    return None


def get_home_view() -> Optional[Dict[str, Any]]:
    """Get the home view (resolved)."""
    logger.debug("Getting home view")
    site_config = load_site_config()
    if site_config.default_home_link and site_config.default_home_link.view_node_id:
        return resolve_node(site_config.default_home_link.view_node_id)

    # Fallback: return first ViewContainer
    views = get_all_views()
    if views:
        # Find the node for this view
        for ref in get_all_references():
            if ref.comp_id == views[0].comp_id:
                node = load_node(ref.node_id) if ref.node_id else None
                if node:
                    return resolve_node(node.node_id)
    return None


# ============ SITE CONFIG ============

def load_site_config() -> SiteConfig:
    """Load site configuration."""
    logger.debug("Loading site config")
    data = _load_json(SITE_CONFIG_PATH)
    if data:
        return SiteConfig.from_dict(data)
    return SiteConfig()


def save_site_config(config: SiteConfig) -> None:
    """Save site configuration."""
    logger.debug(f"Saving site config: site_name={config.site_name}")
    _save_json(SITE_CONFIG_PATH, config.to_dict())


# ============ NAVBAR ITEMS ============

def _navbar_item_path(nav_bar_id: int) -> Path:
    return NAVBAR_DIR / f"{nav_bar_id}.json"


def load_navbar_item(nav_bar_id: int) -> Optional[NavBar]:
    """Load a navbar item by ID."""
    logger.debug(f"Loading navbar item: nav_bar_id={nav_bar_id}")
    data = _load_json(_navbar_item_path(nav_bar_id))
    if data:
        return NavBar.from_dict(data)
    return None


def save_navbar_item(item: Union[NavBar, Dict[str, Any]]) -> int:
    """Save a navbar item. Returns the nav_bar_id."""
    if isinstance(item, dict):
        if 'nav_bar_id' not in item:
            item['nav_bar_id'] = generate_id()
        item = NavBar.from_dict(item)

    item.update_timestamp()
    data = item.to_dict()
    _save_json(_navbar_item_path(item.nav_bar_id), data)
    logger.debug(f"Saved navbar item: nav_bar_id={item.nav_bar_id}")
    return item.nav_bar_id


def delete_navbar_item(nav_bar_id: int) -> bool:
    """Delete a navbar item."""
    logger.debug(f"Deleting navbar item: nav_bar_id={nav_bar_id}")
    return _delete_file(_navbar_item_path(nav_bar_id))


def get_all_navbar_items() -> List[NavBar]:
    """Get all navbar items sorted by position and order."""
    logger.debug("Getting all navbar items")
    items = []
    for path in _list_json_files(NAVBAR_DIR):
        data = _load_json(path)
        if data:
            items.append(NavBar.from_dict(data))
    items.sort(key=lambda x: (0 if x.position == 'left' else 1, x.order))
    return items


# ============ FOOTER ITEMS ============

def _footer_item_path(footer_id: int) -> Path:
    return FOOTER_DIR / f"{footer_id}.json"


def load_footer_item(footer_id: int) -> Optional[Footer]:
    """Load a footer item by ID."""
    logger.debug(f"Loading footer item: footer_id={footer_id}")
    data = _load_json(_footer_item_path(footer_id))
    if data:
        return Footer.from_dict(data)
    return None


def save_footer_item(item: Union[Footer, Dict[str, Any]]) -> int:
    """Save a footer item. Returns the footer_id."""
    if isinstance(item, dict):
        if 'footer_id' not in item:
            item['footer_id'] = generate_id()
        item = Footer.from_dict(item)

    item.update_timestamp()
    data = item.to_dict()
    _save_json(_footer_item_path(item.footer_id), data)
    logger.debug(f"Saved footer item: footer_id={item.footer_id}")
    return item.footer_id


def delete_footer_item(footer_id: int) -> bool:
    """Delete a footer item."""
    logger.debug(f"Deleting footer item: footer_id={footer_id}")
    return _delete_file(_footer_item_path(footer_id))


def get_all_footer_items() -> List[Footer]:
    """Get all footer items sorted by order."""
    logger.debug("Getting all footer items")
    items = []
    for path in _list_json_files(FOOTER_DIR):
        data = _load_json(path)
        if data:
            items.append(Footer.from_dict(data))
    items.sort(key=lambda x: x.order)
    return items


# ============ THEMES ============

def load_theme_config() -> Dict[str, Any]:
    """Load theme configuration."""
    logger.debug("Loading theme config")
    data = _load_json(THEME_CONFIG_PATH)
    if data:
        return data
    return {
        'active_theme_id': None,
        'color_scheme_preference': 'system'
    }


def save_theme_config(config: Dict[str, Any]) -> None:
    """Save theme configuration."""
    logger.debug(f"Saving theme config")
    _save_json(THEME_CONFIG_PATH, config)


def _theme_path(theme_id: int) -> Path:
    return CUSTOM_THEMES_DIR / f"{theme_id}.json"


def load_theme(theme_id: int) -> Optional[Theme]:
    """Load a theme by ID."""
    logger.debug(f"Loading theme: theme_id={theme_id}")
    data = _load_json(_theme_path(theme_id))
    if data:
        return Theme.from_dict(data)
    return None


def save_theme(theme: Union[Theme, Dict[str, Any]]) -> int:
    """Save a theme. Returns the theme_id."""
    if isinstance(theme, dict):
        if 'theme_id' not in theme:
            theme['theme_id'] = generate_id()
        theme = Theme.from_dict(theme)

    theme.update_timestamp()
    data = theme.to_dict()
    _save_json(_theme_path(theme.theme_id), data)
    logger.debug(f"Saved theme: theme_id={theme.theme_id}, name={theme.name}")
    return theme.theme_id


def delete_theme(theme_id: int) -> bool:
    """Delete a theme."""
    logger.debug(f"Deleting theme: theme_id={theme_id}")
    return _delete_file(_theme_path(theme_id))


def get_all_themes() -> List[Theme]:
    """Get all custom themes."""
    logger.debug("Getting all themes")
    themes = []
    for path in _list_json_files(CUSTOM_THEMES_DIR):
        data = _load_json(path)
        if data:
            themes.append(Theme.from_dict(data))
    return themes


# ============ RESOLUTION ============

def resolve_node(node_id: int) -> Optional[Dict[str, Any]]:
    """Resolve a node to its final component config with merged overrides."""
    logger.debug(f"Resolving node: node_id={node_id}")
    node = load_node(node_id)
    if not node:
        logger.warning(f"Node not found: node_id={node_id}")
        return None

    ref = load_reference(node.ref_id)
    if not ref:
        logger.warning(f"Reference not found: ref_id={node.ref_id}")
        return None

    comp = load_component_by_id(ref.comp_id)
    if not comp:
        logger.warning(f"Component not found: comp_id={ref.comp_id}")
        return None

    # Merge config with overrides
    base_config = comp.get_config()
    final_config = ref.merge_config(base_config)

    # Resolve children for containers
    children = []
    if isinstance(comp, Container) and comp.child_node_id:
        child_id = comp.child_node_id
        while child_id:
            child_resolved = resolve_node(child_id)
            if child_resolved:
                children.append(child_resolved)
            child_node = load_node(child_id)
            child_id = child_node.next_node_id if child_node else None

    result = {
        'node_id': node.node_id,
        'ref_id': ref.ref_id,
        'comp_id': comp.comp_id,
        'type': comp.type,
        'config': final_config,
        'children': children,
    }

    logger.debug(f"Resolved node: node_id={node_id}, type={comp.type}, children={len(children)}")
    return result


def get_all_views_resolved() -> List[Dict[str, Any]]:
    """Get all ViewContainers resolved with their component trees.

    Returns flattened view objects with:
    - comp_id, path, name, title, etc. at top level
    - root_node_id pointing to the view's root node
    - components (resolved children)
    """
    logger.debug("[views] GET_ALL_RESOLVED start")
    resolved_views = []

    all_views = get_all_views()
    all_refs = get_all_references()
    logger.debug(f"[views] Found {len(all_views)} ViewContainers, {len(all_refs)} References")

    for view in all_views:
        logger.debug(f"[views] Processing ViewContainer comp_id={view.comp_id}")
        # Find the node that references this ViewContainer
        found_ref = False
        for ref in all_refs:
            if ref.comp_id == view.comp_id:
                found_ref = True
                logger.debug(f"[views] Found ref_id={ref.ref_id} -> comp_id={ref.comp_id}, node_id={ref.node_id}")
                node = load_node(ref.node_id) if ref.node_id else None
                if node:
                    logger.debug(f"[views] Found node_id={node.node_id}")
                    resolved = resolve_node(node.node_id)
                    if resolved:
                        # Flatten the structure for frontend compatibility
                        config = resolved.get('config', {})
                        flattened = {
                            'comp_id': resolved.get('comp_id'),
                            'root_node_id': resolved.get('node_id'),
                            'path': config.get('path', ''),
                            'name': config.get('name', ''),
                            'title': config.get('title', ''),
                            'browser_title': config.get('browser_title', ''),
                            'description': config.get('description', ''),
                            'is_home': False,  # Will be set by caller if needed
                            'components': resolved.get('children', []),
                        }
                        logger.debug(f"[views] Resolved view: comp_id={flattened['comp_id']}, root_node_id={flattened['root_node_id']}, path='{flattened['path']}'")
                        resolved_views.append(flattened)
                    else:
                        logger.warning(f"[views] Failed to resolve node_id={node.node_id}")
                else:
                    logger.warning(f"[views] Reference has no node: ref_id={ref.ref_id}")
                break
        if not found_ref:
            logger.warning(f"[views] No reference found for ViewContainer comp_id={view.comp_id}")

    logger.debug(f"[views] GET_ALL_RESOLVED complete: {len(resolved_views)} views")
    return resolved_views


# ============ COMPONENT USAGE ============

def get_component_usages(comp_id: int) -> List[Dict[str, Any]]:
    """Get all references and nodes that use a component."""
    logger.debug(f"Getting component usages: comp_id={comp_id}")
    usages = []

    for ref in get_all_references():
        if ref.comp_id == comp_id:
            node = load_node(ref.node_id) if ref.node_id else None
            if node:
                usages.append({
                    'ref_id': ref.ref_id,
                    'node_id': node.node_id,
                })

    return usages


# ============ INTEGRITY VALIDATION ============

def validate_integrity() -> List[str]:
    """Validate data integrity and return list of errors."""
    logger.debug("Validating data integrity")
    errors = []

    # Check nodes
    for node in get_all_nodes():
        if not load_reference(node.ref_id):
            errors.append(f"Node {node.node_id} has invalid ref_id {node.ref_id}")
        if node.parent_node_id and not load_node(node.parent_node_id):
            errors.append(f"Node {node.node_id} has invalid parent_node_id {node.parent_node_id}")
        if node.previous_node_id and not load_node(node.previous_node_id):
            errors.append(f"Node {node.node_id} has invalid previous_node_id {node.previous_node_id}")
        if node.next_node_id and not load_node(node.next_node_id):
            errors.append(f"Node {node.node_id} has invalid next_node_id {node.next_node_id}")

    # Check references
    for ref in get_all_references():
        if not load_component_by_id(ref.comp_id):
            errors.append(f"Reference {ref.ref_id} has invalid comp_id {ref.comp_id}")

    # Check reference counts
    actual_counts: Dict[int, int] = {}
    for ref in get_all_references():
        actual_counts[ref.comp_id] = actual_counts.get(ref.comp_id, 0) + 1

    for comp in get_all_components():
        expected = actual_counts.get(comp.comp_id, 0)
        actual = comp.reference_count
        if expected != actual:
            errors.append(f"Component {comp.type}/{comp.comp_id} has reference_count {actual}, expected {expected}")

    logger.debug(f"Integrity validation complete: {len(errors)} errors")
    return errors


# ============ NAVIGATION CONFIG (AGGREGATED) ============

def _transform_nav_item_to_frontend(item, item_type: str = 'navbar') -> Dict[str, Any]:
    """Transform backend NavBar/Footer format to frontend NavItem format.

    Backend stores: { nav_bar_id, position, order, internal_link: { label, view_node_id, url, icon } }
    Frontend expects: { id, label, linkType, viewId, url, position, icon, external }
    """
    internal_link = item.internal_link
    item_id = item.nav_bar_id if hasattr(item, 'nav_bar_id') else item.footer_id
    result = {
        'id': item_id,
        'position': item.position,
        'order': item.order,
        'label': '',
        'linkType': 'url',
        'url': '/',
        'icon': None,
        'external': False,
    }

    if internal_link:
        result['label'] = internal_link.label or ''
        result['icon'] = internal_link.icon

        # Determine link type based on stored data
        if hasattr(internal_link, 'view_node_id') and internal_link.view_node_id:
            result['linkType'] = 'view'
            result['viewId'] = internal_link.view_node_id
        elif hasattr(internal_link, 'url'):
            if internal_link.url == '__theme_toggle__':
                result['linkType'] = 'theme'
            else:
                result['linkType'] = 'url'
                result['url'] = internal_link.url or '/'

    logger.debug(f"[settings/{item_type}] TRANSFORM id={item_id} -> label='{result['label']}', linkType={result['linkType']}, viewId={result.get('viewId')}, url={result.get('url')}")
    return result


def get_navigation_config() -> Dict[str, Any]:
    """Get aggregated navigation configuration for frontend compatibility."""
    logger.debug("[settings] GET_NAV_CONFIG start")
    site_config = load_site_config()
    logger.debug(f"[settings/site] LOADED site_name='{site_config.site_name}'")

    navbar_items = get_all_navbar_items()
    logger.debug(f"[settings/navbar] LOADED {len(navbar_items)} items")

    footer_items = get_all_footer_items()
    logger.debug(f"[settings/footer] LOADED {len(footer_items)} items")

    header = [_transform_nav_item_to_frontend(item, 'navbar') for item in navbar_items]
    footer = [_transform_nav_item_to_frontend(item, 'footer') for item in footer_items]

    logger.debug(f"[settings] GET_NAV_CONFIG complete: header={len(header)}, footer={len(footer)}")

    return {
        'siteName': site_config.site_name,
        'header': header,
        'footer': footer,
    }


# ============ EXPORT TO METADATA JSON ============

def export_to_metadata_json() -> bool:
    """Export all data to metadata.json for Next.js static build."""
    logger.debug("Exporting to metadata.json")

    # Get theme config
    theme_config = load_theme_config()
    custom_themes = get_all_themes()
    themes = {
        'id': 'themes',
        'type': 'Themes',
        'activeThemeId': theme_config.get('active_theme_id'),
        'colorSchemePreference': theme_config.get('color_scheme_preference', 'system'),
        'customThemes': [t.to_dict() for t in custom_themes]
    }

    # Get navigation
    navigation = get_navigation_config()

    # Get resolved views
    views_list = get_all_views_resolved()

    # Get home view node_id from site config
    site_config = load_site_config()
    home_node_id = None
    if site_config.default_home_link:
        home_node_id = site_config.default_home_link.view_node_id

    # Fallback: use first view
    if not home_node_id and views_list:
        home_node_id = views_list[0].get('node_id')

    metadata = {
        'themes': themes,
        'navigation': navigation,
        'views': {
            'id': 'views',
            'type': 'Views',
            'default_home_node_id': home_node_id,
            'items': views_list
        }
    }

    metadata_path = CONTENT_DIR / 'metadata.json'
    _save_json(metadata_path, metadata)
    logger.debug("Export to metadata.json complete")
    return True


# ============ EXPERIENCES (Markdown Files) ============

import re
import yaml
from datetime import datetime

EXPERIENCES_DIR = CONTENT_DIR / 'experiences'


def _parse_frontmatter(content: str) -> tuple:
    """Parse YAML frontmatter from markdown content."""
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            try:
                metadata = yaml.safe_load(parts[1])
                body = parts[2].strip()
                return metadata or {}, body
            except yaml.YAMLError:
                pass
    return {}, content


def _render_frontmatter(metadata: dict, content: str) -> str:
    """Render metadata and content as frontmatter markdown."""
    yaml_str = yaml.dump(metadata, default_flow_style=False, allow_unicode=True)
    return f"---\n{yaml_str}---\n\n{content}"

def generate_experience_id() -> str:
    """Generate a unique experience ID."""
    return f"exp-{generate_id()}"


def get_all_experiences() -> List[Dict[str, Any]]:
    """Get all experiences from markdown files."""
    logger.debug("Getting all experiences")
    experiences = []
    EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)

    for path in EXPERIENCES_DIR.glob('*.md'):
        try:
            content = path.read_text()
            metadata, body = _parse_frontmatter(content)

            # Generate ID from filename if not present
            slug = path.stem.replace('-experience', '')
            exp_id = metadata.get('id', f"exp-{slug}")

            experiences.append({
                'id': exp_id,
                'title': metadata.get('title', slug),
                'company': metadata.get('company'),
                'startDate': metadata.get('startDate'),
                'endDate': metadata.get('endDate'),
                'image': metadata.get('image'),
                'backgroundColor': metadata.get('backgroundColor'),
                'textColor': metadata.get('textColor'),
                'accentColor': metadata.get('accentColor'),
                'sort_order': metadata.get('sort_order', 0),
            })
        except Exception as e:
            logger.error(f"Error reading experience {path}: {e}")

    # Sort by sort_order
    experiences.sort(key=lambda e: e.get('sort_order', 0))
    return experiences


def get_experience_by_id(exp_id: str) -> Optional[Dict[str, Any]]:
    """Get an experience by ID."""
    logger.debug(f"Getting experience by ID: {exp_id}")
    for exp in get_all_experiences():
        if exp['id'] == exp_id:
            # Get full content
            title = exp.get('title', '')
            slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
            file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
            if file_path.exists():
                _, body = _parse_frontmatter(file_path.read_text())
                exp['content'] = body
            return exp
    return None


def save_experience(exp_data: Dict[str, Any]) -> str:
    """Save an experience to markdown file."""
    logger.debug(f"Saving experience: {exp_data.get('id')}")
    EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)

    title = exp_data.get('title', 'untitled')
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    file_path = EXPERIENCES_DIR / f'{slug}-experience.md'

    # Load existing content
    existing_content = ''
    if file_path.exists():
        _, existing_content = _parse_frontmatter(file_path.read_text())

    # Build metadata
    metadata = {
        'id': exp_data.get('id') or generate_experience_id(),
        'title': title,
        'company': exp_data.get('company'),
        'startDate': exp_data.get('startDate'),
        'endDate': exp_data.get('endDate'),
        'sort_order': exp_data.get('sort_order', 0),
    }

    # Optional fields
    if exp_data.get('image'):
        metadata['image'] = exp_data['image']
    if exp_data.get('backgroundColor'):
        metadata['backgroundColor'] = exp_data['backgroundColor']
    if exp_data.get('textColor'):
        metadata['textColor'] = exp_data['textColor']
    if exp_data.get('accentColor'):
        metadata['accentColor'] = exp_data['accentColor']

    content = exp_data.get('content', existing_content)
    file_content = _render_frontmatter(metadata, content)
    file_path.write_text(file_content)

    return metadata['id']


def delete_experience(exp_id: str) -> bool:
    """Delete an experience."""
    logger.debug(f"Deleting experience: {exp_id}")
    exp = get_experience_by_id(exp_id)
    if not exp:
        return False

    title = exp.get('title', '')
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
    if file_path.exists():
        file_path.unlink()
        return True
    return False


def update_experience_order(order: List[str]) -> None:
    """Update the sort order of experiences."""
    logger.debug(f"Updating experience order: {order}")
    for idx, exp_id in enumerate(order):
        exp = get_experience_by_id(exp_id)
        if exp:
            exp['sort_order'] = idx
            save_experience(exp)


# ============ VIEW COMPATIBILITY FUNCTIONS ============

def load_view(comp_id: int) -> Optional[Dict[str, Any]]:
    """Load a view (ViewContainer) by comp_id.

    For backward compatibility with debug routes.
    Returns dict for JSON serialization.
    """
    logger.debug(f"load_view: {comp_id}")
    view = load_component('ViewContainer', comp_id)
    if view:
        return view.to_dict()
    return None


def save_view(view_data: Dict[str, Any]) -> int:
    """Save a view (ViewContainer component).

    For backward compatibility with metadata routes.
    """
    logger.debug(f"save_view: {view_data}")

    # Check if this is an existing view by comp_id
    comp_id = view_data.get('comp_id') or view_data.get('id')
    if comp_id:
        existing = load_component('ViewContainer', comp_id)
        if existing:
            # Update existing view
            existing.path = view_data.get('path', existing.path)
            existing.name = view_data.get('name', existing.name)
            existing.title = view_data.get('title', existing.title)
            existing.browser_title = view_data.get('browser_title', existing.browser_title)
            existing.description = view_data.get('description', existing.description)
            save_component(existing)
            return existing.comp_id

    # Create new ViewContainer
    from entities import ViewContainer
    view = ViewContainer(
        path=view_data.get('path', ''),
        name=view_data.get('name', ''),
        title=view_data.get('title', ''),
        browser_title=view_data.get('browser_title'),
        description=view_data.get('description'),
    )
    save_component(view)

    # Create reference and node
    ref_id = create_reference_to_component(view.comp_id)
    node_data = {
        'ref_id': ref_id,
        'parent_node_id': None,
    }
    node_id = save_node(node_data)

    # Update reference with node_id
    ref = load_reference(ref_id)
    if ref:
        ref.node_id = node_id
        save_reference(ref)

    return view.comp_id


def get_default_home_view_id() -> Optional[int]:
    """Get the default home view ID.

    For backward compatibility with metadata routes.
    """
    logger.debug("get_default_home_view_id")
    config = load_site_config()
    if config.default_home_link:
        return config.default_home_link.view_node_id
    return None


def set_default_home_view_id(node_id: Optional[int]) -> None:
    """Set the default home view ID.

    For backward compatibility with metadata routes.
    """
    logger.debug(f"set_default_home_view_id: {node_id}")
    config = load_site_config()

    if node_id:
        from entities import InternalLink
        node = load_node(node_id)
        ref = load_reference(node.ref_id) if node else None
        view = load_component_by_id(ref.comp_id) if ref else None

        config.default_home_link = InternalLink(
            label=view.name if view and hasattr(view, 'name') else 'Home',
            view_node_id=node_id,
        )
    else:
        config.default_home_link = None

    save_site_config(config)


# ============ GENERIC SETTINGS ============

GENERIC_SETTINGS_PATH = SETTINGS_DIR / 'generic.json'


def get_setting(key: str) -> Optional[str]:
    """Get a generic setting value."""
    logger.debug(f"Getting setting: {key}")
    data = _load_json(GENERIC_SETTINGS_PATH)
    if data:
        return data.get(key)
    return None


def set_setting(key: str, value: Any) -> None:
    """Set a generic setting value."""
    logger.debug(f"Setting setting: {key}={value}")
    data = _load_json(GENERIC_SETTINGS_PATH) or {}
    data[key] = value
    _save_json(GENERIC_SETTINGS_PATH, data)


def load_settings() -> Dict[str, Any]:
    """Load all settings (combined from multiple sources).

    For backward compatibility with debug routes.
    """
    logger.debug("load_settings")
    config = load_site_config()
    theme_config = load_theme_config()
    nav = get_navigation_config()
    generic = _load_json(GENERIC_SETTINGS_PATH) or {}

    return {
        'site': config.to_dict(),
        'themes': theme_config,
        'navigation': nav,
        'generic': generic,
    }


# ============ LEGACY FUNCTION ALIASES ============

# For backward compatibility with routes that reference old function names
def get_navigation_config_new():
    """Alias for get_navigation_config."""
    return get_navigation_config()


def save_navigation_config_new(data):
    """Save navigation config (called by navigation routes)."""
    logger.debug("Saving navigation config")
    # Update site name
    site_config = load_site_config()
    site_config.site_name = data.get('siteName', site_config.site_name)
    save_site_config(site_config)

    # Delete existing items and recreate
    for item in get_all_navbar_items():
        delete_navbar_item(item.nav_bar_id)
    for item in get_all_footer_items():
        delete_footer_item(item.footer_id)

    # Save new items
    for idx, item_data in enumerate(data.get('header', [])):
        item_data['order'] = idx
        save_navbar_item(item_data)
    for idx, item_data in enumerate(data.get('footer', [])):
        item_data['order'] = idx
        save_footer_item(item_data)

    return True


def load_theme_config_new():
    """Alias for load_theme_config."""
    return load_theme_config()


def save_theme_config_new(data):
    """Alias for save_theme_config."""
    save_theme_config(data)


def get_all_custom_themes():
    """Alias for get_all_themes."""
    return get_all_themes()


def save_custom_theme(data):
    """Alias for save_theme."""
    return save_theme(data)


def delete_custom_theme(theme_id):
    """Alias for delete_theme."""
    return delete_theme(theme_id)


# ============ INITIALIZATION ============

def init_database():
    """Initialize the data directories if they don't exist."""
    logger.debug("Initializing database")
    _ensure_dirs()
    # Also ensure experiences directory
    EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)


# Initialize on import
init_database()
