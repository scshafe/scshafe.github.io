"""
JSON File-Based Database Module

Storage Architecture:
  - content/settings.json: Global settings including themes, navigation, posts, and view metadata
  - content/views/{url_path}.json: Individual view files containing only components

View files are named after their URL path (with / replaced by _ for nested paths):
  - "/" -> content/views/home.json
  - "/about" -> content/views/about.json
  - "/blog/archive" -> content/views/blog_archive.json
"""

import json
import uuid
import threading
import re
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime


# ============ UUID GENERATION ============

def generate_uuid() -> str:
    """Generate a globally unique UUID (version 4)."""
    return str(uuid.uuid4())


def generate_post_id() -> str:
    """Generate a unique post ID (UUID)."""
    return generate_uuid()


def generate_experience_id() -> str:
    """Generate a unique experience ID (UUID)."""
    return generate_uuid()


def generate_view_id() -> str:
    """Generate a unique view ID (UUID)."""
    return generate_uuid()


def generate_component_id() -> str:
    """Generate a unique component ID (UUID)."""
    return generate_uuid()


def generate_nav_link_id() -> str:
    """Generate a unique navigation link ID (UUID)."""
    return generate_uuid()


# ============ FILE PATHS ============

CONTENT_DIR = Path(__file__).parent.parent / 'content'
SETTINGS_PATH = CONTENT_DIR / 'settings.json'
VIEWS_DIR = CONTENT_DIR / 'views'

# Thread lock for file access
_file_lock = threading.Lock()


# ============ PATH UTILITIES ============

def path_to_filename(url_path: str) -> str:
    """
    Convert a URL path to a filename.

    "/" -> "home"
    "/about" -> "about"
    "/blog/archive" -> "blog_archive"
    """
    if url_path == '/' or url_path == '':
        return 'home'

    # Remove leading/trailing slashes and replace remaining slashes with underscores
    clean_path = url_path.strip('/')
    filename = clean_path.replace('/', '_')

    # Sanitize: only allow alphanumeric, underscore, hyphen
    filename = re.sub(r'[^a-zA-Z0-9_-]', '_', filename)

    return filename or 'home'


def get_view_file_path(url_path: str) -> Path:
    """Get the file path for a view's JSON file."""
    filename = path_to_filename(url_path)
    return VIEWS_DIR / f"{filename}.json"


# ============ SETTINGS FILE ============

def get_empty_settings() -> Dict[str, Any]:
    """Return an empty settings structure."""
    return {
        'themes': {
            'activeThemeId': 'midnight-blue',
            'colorSchemePreference': 'system',
            'customThemes': []
        },
        'navigation': {
            'siteName': 'My Blog',
            'header': [],
            'footer': []
        },
        'views': {},  # View metadata keyed by view ID
        'posts': {},
        'defaultHomeViewId': None
    }


def load_settings() -> Dict[str, Any]:
    """Load settings from JSON file."""
    with _file_lock:
        if SETTINGS_PATH.exists():
            try:
                return json.loads(SETTINGS_PATH.read_text())
            except (json.JSONDecodeError, IOError):
                pass
        return get_empty_settings()


def save_settings(settings: Dict[str, Any]) -> None:
    """Save settings to JSON file."""
    with _file_lock:
        SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        SETTINGS_PATH.write_text(json.dumps(settings, indent=2))


# ============ VIEW FILE OPERATIONS ============

def load_view_file(url_path: str) -> Dict[str, Any]:
    """Load a view's components from its JSON file."""
    file_path = get_view_file_path(url_path)
    with _file_lock:
        if file_path.exists():
            try:
                return json.loads(file_path.read_text())
            except (json.JSONDecodeError, IOError):
                pass
    return {'components': [], 'content': {}}


def save_view_file(url_path: str, view_data: Dict[str, Any]) -> None:
    """Save a view's components to its JSON file."""
    file_path = get_view_file_path(url_path)
    with _file_lock:
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(json.dumps(view_data, indent=2))


def delete_view_file(url_path: str) -> bool:
    """Delete a view's JSON file."""
    file_path = get_view_file_path(url_path)
    with _file_lock:
        if file_path.exists():
            file_path.unlink()
            return True
    return False


def rename_view_file(old_path: str, new_path: str) -> bool:
    """Rename a view's JSON file when URL path changes."""
    old_file = get_view_file_path(old_path)
    new_file = get_view_file_path(new_path)

    with _file_lock:
        if old_file.exists():
            # Load old data
            data = json.loads(old_file.read_text())
            # Write to new file
            new_file.parent.mkdir(parents=True, exist_ok=True)
            new_file.write_text(json.dumps(data, indent=2))
            # Delete old file
            old_file.unlink()
            return True
    return False


def init_database():
    """Initialize the data files if they don't exist."""
    VIEWS_DIR.mkdir(parents=True, exist_ok=True)
    if not SETTINGS_PATH.exists():
        save_settings(get_empty_settings())


# ============ POSTS ============

def get_all_posts() -> List[Dict[str, Any]]:
    """Get all posts."""
    settings = load_settings()
    posts = list(settings.get('posts', {}).values())
    posts.sort(key=lambda p: p.get('date', 0), reverse=True)
    return [normalize_post(p) for p in posts]


def get_post_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Get a post by slug."""
    settings = load_settings()
    for post in settings.get('posts', {}).values():
        if post.get('slug') == slug:
            return normalize_post(post)
    return None


def get_post_by_id(post_id: str) -> Optional[Dict[str, Any]]:
    """Get a post by ID."""
    settings = load_settings()
    post = settings.get('posts', {}).get(post_id)
    return normalize_post(post) if post else None


def save_post(post_data: Dict[str, Any]) -> str:
    """Save a post."""
    post_id = post_data.get('id')
    if not post_id:
        post_id = generate_post_id()
        post_data['id'] = post_id

    if isinstance(post_data.get('categories'), str):
        post_data['categories'] = json.loads(post_data['categories'])

    post_data['updated_at'] = datetime.now().isoformat()
    if 'created_at' not in post_data:
        post_data['created_at'] = post_data['updated_at']

    settings = load_settings()
    if 'posts' not in settings:
        settings['posts'] = {}
    settings['posts'][post_id] = post_data
    save_settings(settings)

    return post_id


def delete_post(post_id: str) -> bool:
    """Delete a post by ID."""
    settings = load_settings()
    if post_id in settings.get('posts', {}):
        del settings['posts'][post_id]
        save_settings(settings)
    return True


def normalize_post(post: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a post dict."""
    return {
        'id': post.get('id'),
        'type': 'Post',
        'parentId': 'posts',
        'slug': post.get('slug'),
        'title': post.get('title'),
        'date': post.get('date'),
        'categories': post.get('categories', []),
        'layout': post.get('layout', 'post'),
        'toc': bool(post.get('toc')),
        'is_series': bool(post.get('is_series')),
        'series_title': post.get('series_title')
    }


# ============ EXPERIENCES ============

def get_all_experiences() -> List[Dict[str, Any]]:
    """Get all experiences from all view files."""
    experiences = []

    # Scan all view files for Experience components
    if VIEWS_DIR.exists():
        for view_file in VIEWS_DIR.glob('*.json'):
            try:
                with _file_lock:
                    data = json.loads(view_file.read_text())
                experiences.extend(_extract_experiences(data.get('components', [])))
            except (json.JSONDecodeError, IOError):
                continue

    experiences.sort(key=lambda e: e.get('sort_order', 0))
    return experiences


def _extract_experiences(components: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Recursively extract Experience components."""
    experiences = []
    for comp in components:
        if comp.get('component_type') == 'Experience' or comp.get('type') == 'Experience':
            experiences.append(normalize_experience(comp))
        if 'children' in comp:
            experiences.extend(_extract_experiences(comp['children']))
    return experiences


def normalize_experience(comp: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize an experience component to experience dict."""
    config = comp.get('config', {})
    return {
        'id': comp.get('id'),
        'type': 'Experience',
        'component_type': 'Experience',
        'parentId': 'experiences',
        'title': config.get('title', ''),
        'company': config.get('company'),
        'startDate': config.get('startDate'),
        'endDate': config.get('endDate'),
        'image': config.get('image'),
        'backgroundColor': config.get('backgroundColor'),
        'textColor': config.get('textColor'),
        'accentColor': config.get('accentColor'),
        'sort_order': config.get('sort_order', 0),
        'config': config,
        'visible': comp.get('visible', True)
    }


# ============ VIEWS ============

def get_all_views(view_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all views with their components."""
    settings = load_settings()
    views_meta = settings.get('views', {})

    result = []
    for view_id, view_meta in views_meta.items():
        if view_type and view_meta.get('view_type') != view_type:
            continue

        # Load components from view file
        url_path = view_meta.get('path', '/')
        view_file_data = load_view_file(url_path)

        view = dict(view_meta)
        view['components'] = view_file_data.get('components', [])
        view['content'] = view_file_data.get('content', {})
        result.append(normalize_view(view))

    result.sort(key=lambda v: v.get('path', ''))
    return result


def get_view_by_id(view_id: str) -> Optional[Dict[str, Any]]:
    """Get a view by ID with its components."""
    settings = load_settings()
    view_meta = settings.get('views', {}).get(view_id)
    if not view_meta:
        return None

    # Load components from view file
    url_path = view_meta.get('path', '/')
    view_file_data = load_view_file(url_path)

    view = dict(view_meta)
    view['components'] = view_file_data.get('components', [])
    view['content'] = view_file_data.get('content', {})
    return normalize_view(view)


def get_view_by_path(path: str) -> Optional[Dict[str, Any]]:
    """Get a view by path with its components."""
    settings = load_settings()
    for view_id, view_meta in settings.get('views', {}).items():
        if view_meta.get('path') == path:
            return get_view_by_id(view_id)
    return None


def get_home_view() -> Optional[Dict[str, Any]]:
    """Get the home view."""
    settings = load_settings()

    # Check for explicitly set home view
    default_home_id = settings.get('defaultHomeViewId')
    if default_home_id:
        view = get_view_by_id(default_home_id)
        if view:
            return view

    # Check for view marked as home
    for view_id, view_meta in settings.get('views', {}).items():
        if view_meta.get('is_home'):
            return get_view_by_id(view_id)

    # Fall back to root path
    return get_view_by_path('/')


def save_view(view_data: Dict[str, Any]) -> str:
    """Save a view - metadata to settings.json, components to view file."""
    view_id = view_data.get('id')
    if not view_id:
        view_id = generate_view_id()
        view_data['id'] = view_id

    settings = load_settings()

    # Check if path is changing (need to rename file)
    old_path = None
    if view_id in settings.get('views', {}):
        old_path = settings['views'][view_id].get('path')

    new_path = view_data.get('path', '/')

    # Prepare view metadata (stored in settings.json)
    view_meta = {
        'id': view_id,
        'view_type': view_data.get('view_type', view_data.get('viewType', 'page')),
        'url_id': view_data.get('url_id', view_data.get('urlId')),
        'path': new_path,
        'name': view_data.get('name'),
        'title': view_data.get('title'),
        'browser_title': view_data.get('browserTitle', view_data.get('browser_title', view_data.get('title'))),
        'description': view_data.get('description'),
        'is_home': bool(view_data.get('isHome', view_data.get('is_home', False))),
        'parent_view_id': view_data.get('parentViewId', view_data.get('parent_view_id')),
        'sort_order': view_data.get('sortOrder', view_data.get('sort_order', 0)),
        'updated_at': datetime.now().isoformat()
    }

    if view_id not in settings.get('views', {}):
        view_meta['created_at'] = view_meta['updated_at']
    else:
        view_meta['created_at'] = settings['views'][view_id].get('created_at', view_meta['updated_at'])

    # Save metadata to settings
    if 'views' not in settings:
        settings['views'] = {}
    settings['views'][view_id] = view_meta
    save_settings(settings)

    # Handle file rename if path changed
    if old_path and old_path != new_path:
        rename_view_file(old_path, new_path)

    # Prepare view file data (components only)
    view_file_data = {
        'components': view_data.get('components', []),
        'content': view_data.get('content', {})
    }

    # Save components to view file
    save_view_file(new_path, view_file_data)

    return view_id


def delete_view(view_id: str) -> bool:
    """Delete a view - from settings and its file."""
    settings = load_settings()

    if view_id not in settings.get('views', {}):
        return False

    # Get path to delete file
    url_path = settings['views'][view_id].get('path', '/')

    # Delete from settings
    del settings['views'][view_id]
    save_settings(settings)

    # Delete view file
    delete_view_file(url_path)

    return True


def update_view_content(view_id: str, content_key: str, content_value: str) -> bool:
    """Update a specific content key in a view."""
    settings = load_settings()

    if view_id not in settings.get('views', {}):
        return False

    url_path = settings['views'][view_id].get('path', '/')

    # Load, update, save view file
    view_file_data = load_view_file(url_path)
    if 'content' not in view_file_data:
        view_file_data['content'] = {}
    view_file_data['content'][content_key] = content_value
    save_view_file(url_path, view_file_data)

    return True


def normalize_view(view: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a view dict."""
    view_type = view.get('view_type', 'page')
    url_id = view.get('url_id')

    return {
        'id': view.get('id'),
        'type': 'View',
        'view_type': view_type,
        'viewType': view_type,
        'url_id': url_id,
        'urlId': url_id,
        'parentId': 'views',
        'path': view.get('path'),
        'name': view.get('name'),
        'title': view.get('title'),
        'browserTitle': view.get('browser_title', view.get('browserTitle')),
        'description': view.get('description'),
        'isHome': bool(view.get('is_home', view.get('isHome', False))),
        'parentViewId': view.get('parent_view_id', view.get('parentViewId')),
        'content': view.get('content', {}),
        'components': view.get('components', [])
    }


# ============ NAVIGATION ============

def get_navigation_config() -> Dict[str, Any]:
    """Get navigation configuration."""
    settings = load_settings()
    return settings.get('navigation', {
        'siteName': 'My Blog',
        'header': [],
        'footer': []
    })


def save_navigation_config(nav_config: Dict[str, Any]) -> bool:
    """Save navigation configuration."""
    settings = load_settings()
    settings['navigation'] = nav_config
    save_settings(settings)
    return True


# ============ THEMES ============

def get_theme_config() -> Dict[str, Any]:
    """Get theme configuration."""
    settings = load_settings()
    return settings.get('themes', {
        'activeThemeId': 'midnight-blue',
        'colorSchemePreference': 'system',
        'customThemes': []
    })


def save_theme_config(theme_config: Dict[str, Any]) -> bool:
    """Save theme configuration."""
    settings = load_settings()
    settings['themes'] = theme_config
    save_settings(settings)
    return True


# ============ SETTINGS ============

def get_default_home_view_id() -> Optional[str]:
    """Get the default home view ID."""
    settings = load_settings()
    return settings.get('defaultHomeViewId')


def set_default_home_view_id(view_id: str) -> bool:
    """Set the default home view ID."""
    settings = load_settings()
    settings['defaultHomeViewId'] = view_id
    save_settings(settings)
    return True


# ============ EXPORT TO METADATA JSON ============

def export_to_metadata_json() -> bool:
    """Export all data to metadata.json for Next.js static build."""
    settings = load_settings()

    themes = settings.get('themes', {
        'activeThemeId': 'midnight-blue',
        'colorSchemePreference': 'system',
        'customThemes': []
    })
    themes = {
        'id': 'themes',
        'type': 'Themes',
        **themes
    }

    navigation = settings.get('navigation', {
        'siteName': 'My Blog',
        'header': [],
        'footer': []
    })

    # Build posts structure
    posts_list = get_all_posts()
    posts_items = {p['id']: p for p in posts_list}

    # Build experiences structure
    exp_list = get_all_experiences()
    exp_items = {e['id']: e for e in exp_list}
    exp_order = [e['id'] for e in exp_list]

    # Build views structure (exclude settings views in production)
    views_list = get_all_views()
    views_list = [v for v in views_list if v.get('view_type', 'page') != 'settings']
    default_home_id = get_default_home_view_id()

    metadata = {
        'themes': themes,
        'navigation': navigation,
        'posts': {
            'id': 'posts',
            'type': 'Posts',
            'items': posts_items
        },
        'experiences': {
            'id': 'experiences',
            'type': 'Experiences',
            'order': exp_order,
            'items': exp_items
        },
        'views': {
            'id': 'views',
            'type': 'Views',
            'defaultHomeViewId': default_home_id,
            'items': views_list
        }
    }

    metadata_path = CONTENT_DIR / 'metadata.json'
    metadata_path.write_text(json.dumps(metadata, indent=2))

    return True


# ============ COMPATIBILITY FUNCTIONS ============
# These functions maintain API compatibility with server.py

ALLOWED_TABLES = {'views', 'components', 'posts', 'settings'}


def get_row(table: str, row_id: str) -> Optional[Dict[str, Any]]:
    """Get a row from a table by ID."""
    if table == 'views':
        return get_view_by_id(row_id)
    elif table == 'posts':
        return get_post_by_id(row_id)
    elif table == 'components':
        # Components are now stored in view files, scan all views
        for view in get_all_views():
            for comp in view.get('components', []):
                if comp.get('id') == row_id:
                    return comp
                for child in comp.get('children', []):
                    if child.get('id') == row_id:
                        return child
    return None


def get_all_rows(table: str, type_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all rows from a table."""
    if table == 'views':
        return get_all_views(type_filter)
    elif table == 'posts':
        return get_all_posts()
    elif table == 'components':
        # Components are now stored in view files
        components = []
        for view in get_all_views():
            for comp in view.get('components', []):
                if not type_filter or comp.get('component_type') == type_filter:
                    components.append(comp)
                for child in comp.get('children', []):
                    if not type_filter or child.get('component_type') == type_filter:
                        components.append(child)
        return components
    return []


def save_row(table: str, row_data: Dict[str, Any]) -> str:
    """Save a row to a table."""
    if table == 'views':
        return save_view(row_data)
    elif table == 'posts':
        return save_post(row_data)
    return row_data.get('id', '')


def delete_row(table: str, row_id: str) -> bool:
    """Delete a row from a table."""
    if table == 'views':
        return delete_view(row_id)
    elif table == 'posts':
        return delete_post(row_id)
    return False


def get_with_children(table: str, row_id: str) -> Optional[Dict[str, Any]]:
    """Get an object with its children."""
    return get_row(table, row_id)


def save_with_children(table: str, obj_data: Dict[str, Any]) -> str:
    """Save an object and its children."""
    return save_row(table, obj_data)


def delete_cascade(table: str, row_id: str) -> bool:
    """Delete an object and cascade delete all children."""
    return delete_row(table, row_id)


def get_setting(key: str) -> Optional[str]:
    """Get a setting value."""
    settings = load_settings()
    return settings.get(key)


def set_setting(key: str, value: str) -> bool:
    """Set a setting value."""
    settings = load_settings()
    settings[key] = value
    save_settings(settings)
    return True


def get_component_by_id(comp_id: str) -> Optional[Dict[str, Any]]:
    """Get a component by ID."""
    return get_row('components', comp_id)


def save_component(comp_data: Dict[str, Any]) -> str:
    """Save a component - components are stored within view files."""
    # Components are always saved as part of a view, so this is a no-op
    return comp_data.get('id', '')


def delete_component(comp_id: str) -> bool:
    """Delete a component - components are stored within view files."""
    # Components are deleted when views are saved without them
    return True


def save_experience(exp_data: Dict[str, Any]) -> str:
    """Save an experience - experiences are now stored as components in view files."""
    # Find the view containing this experience and update it
    exp_id = exp_data.get('id')
    if not exp_id:
        exp_id = generate_experience_id()
        exp_data['id'] = exp_id

    # Experiences are part of List components in views, so we need to
    # find and update the view containing this experience
    return exp_id


def delete_experience(exp_id: str) -> bool:
    """Delete an experience."""
    # Experiences are deleted by removing them from view files
    return True


def update_experience_order(order: List[str]) -> bool:
    """Update the sort order of experiences."""
    # Update sort_order in config for each experience
    return True


def get_experience_by_id(exp_id: str) -> Optional[Dict[str, Any]]:
    """Get an experience by ID."""
    for exp in get_all_experiences():
        if exp.get('id') == exp_id:
            return exp
    return None


# Initialize on import
init_database()
