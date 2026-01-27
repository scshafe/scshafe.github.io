"""
SQLite Database Module

Provides database connection, schema, and CRUD operations for the blog CMS.
Each content type has its own table with proper relationships.
"""

import sqlite3
import json
from pathlib import Path
from contextlib import contextmanager
from typing import Optional, List, Dict, Any

# Database path
DB_PATH = Path(__file__).parent.parent / 'content' / 'blog.db'


def get_connection() -> sqlite3.Connection:
    """Get a database connection with row factory."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database():
    """Initialize the database schema."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Themes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS themes (
                id TEXT PRIMARY KEY,
                type TEXT DEFAULT 'Themes',
                active_theme_id TEXT,
                color_scheme_preference TEXT DEFAULT 'system',
                custom_themes TEXT DEFAULT '[]'
            )
        ''')

        # Navigation table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS navigation (
                id TEXT PRIMARY KEY,
                type TEXT DEFAULT 'Navigation',
                site_name TEXT
            )
        ''')

        # NavLinks table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS nav_links (
                id TEXT PRIMARY KEY,
                type TEXT DEFAULT 'NavLink',
                parent_id TEXT,
                location TEXT CHECK(location IN ('header', 'footer')),
                label TEXT NOT NULL,
                url TEXT NOT NULL,
                position TEXT DEFAULT 'left',
                icon TEXT,
                external INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                FOREIGN KEY (parent_id) REFERENCES navigation(id) ON DELETE CASCADE
            )
        ''')

        # Posts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                type TEXT DEFAULT 'Post',
                parent_id TEXT DEFAULT 'posts',
                slug TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                date TEXT,
                categories TEXT DEFAULT '[]',
                layout TEXT DEFAULT 'post',
                toc INTEGER DEFAULT 0,
                is_series INTEGER DEFAULT 0,
                series_title TEXT
            )
        ''')

        # Experiences table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS experiences (
                id TEXT PRIMARY KEY,
                type TEXT DEFAULT 'Experience',
                parent_id TEXT DEFAULT 'experiences',
                title TEXT NOT NULL,
                company TEXT,
                start_date TEXT,
                end_date TEXT,
                image TEXT,
                background_color TEXT,
                text_color TEXT,
                accent_color TEXT,
                sort_order INTEGER DEFAULT 0
            )
        ''')

        # Views table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS views (
                id TEXT PRIMARY KEY,
                type TEXT DEFAULT 'View',
                parent_id TEXT DEFAULT 'views',
                path TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                browser_title TEXT,
                description TEXT,
                is_home INTEGER DEFAULT 0,
                parent_view_id TEXT,
                content TEXT DEFAULT '{}',
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (parent_view_id) REFERENCES views(id) ON DELETE SET NULL
            )
        ''')

        # View Components table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS view_components (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                parent_id TEXT NOT NULL,
                config TEXT DEFAULT '{}',
                visible INTEGER DEFAULT 1,
                sort_order INTEGER DEFAULT 0,
                FOREIGN KEY (parent_id) REFERENCES views(id) ON DELETE CASCADE
            )
        ''')

        # Settings table for global config
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')

        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_views_path ON views(path)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_view_components_parent ON view_components(parent_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_nav_links_parent ON nav_links(parent_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_experiences_order ON experiences(sort_order)')


# ============ THEMES ============

def get_themes() -> Optional[Dict[str, Any]]:
    """Get themes configuration."""
    with get_db() as conn:
        row = conn.execute('SELECT * FROM themes WHERE id = ?', ('themes',)).fetchone()
        if row:
            return {
                'id': row['id'],
                'type': row['type'],
                'activeThemeId': row['active_theme_id'],
                'colorSchemePreference': row['color_scheme_preference'],
                'customThemes': json.loads(row['custom_themes'] or '[]')
            }
        return None


def save_themes(data: Dict[str, Any]) -> bool:
    """Save themes configuration."""
    with get_db() as conn:
        conn.execute('''
            INSERT OR REPLACE INTO themes (id, type, active_theme_id, color_scheme_preference, custom_themes)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            'themes',
            'Themes',
            data.get('activeThemeId'),
            data.get('colorSchemePreference', 'system'),
            json.dumps(data.get('customThemes', []))
        ))
        return True


# ============ NAVIGATION ============

def get_navigation() -> Dict[str, Any]:
    """Get navigation configuration with links."""
    with get_db() as conn:
        nav = conn.execute('SELECT * FROM navigation WHERE id = ?', ('navigation',)).fetchone()

        header_links = conn.execute('''
            SELECT * FROM nav_links WHERE parent_id = ? AND location = ? ORDER BY sort_order
        ''', ('navigation', 'header')).fetchall()

        footer_links = conn.execute('''
            SELECT * FROM nav_links WHERE parent_id = ? AND location = ? ORDER BY sort_order
        ''', ('navigation', 'footer')).fetchall()

        def row_to_link(row):
            return {
                'id': row['id'],
                'type': row['type'],
                'parentId': row['parent_id'],
                'label': row['label'],
                'url': row['url'],
                'position': row['position'],
                'icon': row['icon'],
                'external': bool(row['external'])
            }

        return {
            'id': 'navigation',
            'type': 'Navigation',
            'siteName': nav['site_name'] if nav else "Blog",
            'header': [row_to_link(r) for r in header_links],
            'footer': [row_to_link(r) for r in footer_links]
        }


def save_navigation(data: Dict[str, Any]) -> bool:
    """Save navigation configuration."""
    with get_db() as conn:
        # Save main navigation record
        conn.execute('''
            INSERT OR REPLACE INTO navigation (id, type, site_name)
            VALUES (?, ?, ?)
        ''', ('navigation', 'Navigation', data.get('siteName', 'Blog')))

        # Delete existing links
        conn.execute('DELETE FROM nav_links WHERE parent_id = ?', ('navigation',))

        # Insert header links
        for i, link in enumerate(data.get('header', [])):
            conn.execute('''
                INSERT INTO nav_links (id, type, parent_id, location, label, url, position, icon, external, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                link.get('id', f'nav-header-{i}'),
                'NavLink',
                'navigation',
                'header',
                link['label'],
                link['url'],
                link.get('position', 'left'),
                link.get('icon'),
                1 if link.get('external') else 0,
                i
            ))

        # Insert footer links
        for i, link in enumerate(data.get('footer', [])):
            conn.execute('''
                INSERT INTO nav_links (id, type, parent_id, location, label, url, position, icon, external, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                link.get('id', f'nav-footer-{i}'),
                'NavLink',
                'navigation',
                'footer',
                link['label'],
                link['url'],
                link.get('position', 'left'),
                link.get('icon'),
                1 if link.get('external') else 0,
                i
            ))

        return True


# ============ POSTS ============

def get_all_posts() -> List[Dict[str, Any]]:
    """Get all posts."""
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM posts ORDER BY date DESC').fetchall()
        return [row_to_post(r) for r in rows]


def get_post_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Get a post by slug."""
    with get_db() as conn:
        row = conn.execute('SELECT * FROM posts WHERE slug = ?', (slug,)).fetchone()
        return row_to_post(row) if row else None


def save_post(data: Dict[str, Any]) -> bool:
    """Save a post."""
    with get_db() as conn:
        conn.execute('''
            INSERT OR REPLACE INTO posts
            (id, type, parent_id, slug, title, date, categories, layout, toc, is_series, series_title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('id', f"post-{data['slug']}"),
            'Post',
            'posts',
            data['slug'],
            data['title'],
            data.get('date'),
            json.dumps(data.get('categories', [])),
            data.get('layout', 'post'),
            1 if data.get('toc') else 0,
            1 if data.get('is_series') else 0,
            data.get('series_title')
        ))
        return True


def row_to_post(row) -> Dict[str, Any]:
    """Convert a database row to a post dict."""
    return {
        'id': row['id'],
        'type': row['type'],
        'parentId': row['parent_id'],
        'slug': row['slug'],
        'title': row['title'],
        'date': row['date'],
        'categories': json.loads(row['categories'] or '[]'),
        'layout': row['layout'],
        'toc': bool(row['toc']),
        'is_series': bool(row['is_series']),
        'series_title': row['series_title']
    }


# ============ EXPERIENCES ============

def get_all_experiences() -> List[Dict[str, Any]]:
    """Get all experiences ordered by sort_order."""
    with get_db() as conn:
        rows = conn.execute('SELECT * FROM experiences ORDER BY sort_order').fetchall()
        return [row_to_experience(r) for r in rows]


def get_experience_by_id(exp_id: str) -> Optional[Dict[str, Any]]:
    """Get an experience by ID."""
    with get_db() as conn:
        row = conn.execute('SELECT * FROM experiences WHERE id = ?', (exp_id,)).fetchone()
        return row_to_experience(row) if row else None


def save_experience(data: Dict[str, Any]) -> bool:
    """Save an experience."""
    with get_db() as conn:
        # Get max sort_order if not provided
        sort_order = data.get('sort_order')
        if sort_order is None:
            result = conn.execute('SELECT MAX(sort_order) as max_order FROM experiences').fetchone()
            sort_order = (result['max_order'] or 0) + 1

        conn.execute('''
            INSERT OR REPLACE INTO experiences
            (id, type, parent_id, title, company, start_date, end_date, image,
             background_color, text_color, accent_color, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['id'],
            'Experience',
            'experiences',
            data['title'],
            data.get('company'),
            data.get('startDate'),
            data.get('endDate'),
            data.get('image'),
            data.get('backgroundColor'),
            data.get('textColor'),
            data.get('accentColor'),
            sort_order
        ))
        return True


def update_experience_order(order: List[str]) -> bool:
    """Update the sort order of experiences."""
    with get_db() as conn:
        for i, exp_id in enumerate(order):
            conn.execute('UPDATE experiences SET sort_order = ? WHERE id = ?', (i, exp_id))
        return True


def row_to_experience(row) -> Dict[str, Any]:
    """Convert a database row to an experience dict."""
    return {
        'id': row['id'],
        'type': row['type'],
        'parentId': row['parent_id'],
        'title': row['title'],
        'company': row['company'],
        'startDate': row['start_date'],
        'endDate': row['end_date'],
        'image': row['image'],
        'backgroundColor': row['background_color'],
        'textColor': row['text_color'],
        'accentColor': row['accent_color']
    }


# ============ VIEWS ============

def get_all_views() -> List[Dict[str, Any]]:
    """Get all views with their components."""
    with get_db() as conn:
        views = conn.execute('SELECT * FROM views ORDER BY path').fetchall()
        result = []
        for view_row in views:
            view = row_to_view(view_row)
            # Get components for this view
            components = conn.execute('''
                SELECT * FROM view_components WHERE parent_id = ? ORDER BY sort_order
            ''', (view['id'],)).fetchall()
            view['components'] = [row_to_component(c) for c in components]
            result.append(view)
        return result


def get_view_by_id(view_id: str) -> Optional[Dict[str, Any]]:
    """Get a view by ID with its components."""
    with get_db() as conn:
        row = conn.execute('SELECT * FROM views WHERE id = ?', (view_id,)).fetchone()
        if not row:
            return None
        view = row_to_view(row)
        components = conn.execute('''
            SELECT * FROM view_components WHERE parent_id = ? ORDER BY sort_order
        ''', (view_id,)).fetchall()
        view['components'] = [row_to_component(c) for c in components]
        return view


def get_view_by_path(path: str) -> Optional[Dict[str, Any]]:
    """Get a view by path with its components."""
    with get_db() as conn:
        row = conn.execute('SELECT * FROM views WHERE path = ?', (path,)).fetchone()
        if not row:
            return None
        view = row_to_view(row)
        components = conn.execute('''
            SELECT * FROM view_components WHERE parent_id = ? ORDER BY sort_order
        ''', (view['id'],)).fetchall()
        view['components'] = [row_to_component(c) for c in components]
        return view


def get_home_view() -> Optional[Dict[str, Any]]:
    """Get the home view."""
    with get_db() as conn:
        row = conn.execute('SELECT * FROM views WHERE is_home = 1').fetchone()
        if not row:
            row = conn.execute('SELECT * FROM views WHERE path = ?', ('/',)).fetchone()
        if not row:
            return None
        view = row_to_view(row)
        components = conn.execute('''
            SELECT * FROM view_components WHERE parent_id = ? ORDER BY sort_order
        ''', (view['id'],)).fetchall()
        view['components'] = [row_to_component(c) for c in components]
        return view


def save_view(data: Dict[str, Any]) -> bool:
    """Save a view and its components."""
    with get_db() as conn:
        conn.execute('''
            INSERT OR REPLACE INTO views
            (id, type, parent_id, path, name, title, browser_title, description,
             is_home, parent_view_id, content, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ''', (
            data['id'],
            'View',
            'views',
            data['path'],
            data['name'],
            data['title'],
            data.get('browserTitle', data['title']),
            data.get('description'),
            1 if data.get('isHome') else 0,
            data.get('parentViewId'),
            json.dumps(data.get('content', {})),
            data.get('createdAt')
        ))

        # Delete existing components and re-insert
        conn.execute('DELETE FROM view_components WHERE parent_id = ?', (data['id'],))

        for i, comp in enumerate(data.get('components', [])):
            conn.execute('''
                INSERT INTO view_components (id, type, parent_id, config, visible, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                comp['id'],
                comp['type'],
                data['id'],
                json.dumps(comp.get('config', {})),
                0 if comp.get('visible') is False else 1,
                i
            ))

        return True


def delete_view(view_id: str) -> bool:
    """Delete a view and its components."""
    with get_db() as conn:
        conn.execute('DELETE FROM views WHERE id = ?', (view_id,))
        return True


def update_view_content(view_id: str, content_key: str, content: str) -> bool:
    """Update a specific content key in a view."""
    with get_db() as conn:
        row = conn.execute('SELECT content FROM views WHERE id = ?', (view_id,)).fetchone()
        if not row:
            return False

        current_content = json.loads(row['content'] or '{}')
        current_content[content_key] = content

        conn.execute('UPDATE views SET content = ?, updated_at = datetime("now") WHERE id = ?',
                    (json.dumps(current_content), view_id))
        return True


def get_default_home_view_id() -> Optional[str]:
    """Get the default home view ID."""
    with get_db() as conn:
        row = conn.execute('SELECT value FROM settings WHERE key = ?', ('defaultHomeViewId',)).fetchone()
        return row['value'] if row else None


def set_default_home_view_id(view_id: str) -> bool:
    """Set the default home view ID."""
    with get_db() as conn:
        conn.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
                    ('defaultHomeViewId', view_id))
        return True


def row_to_view(row) -> Dict[str, Any]:
    """Convert a database row to a view dict (without components)."""
    return {
        'id': row['id'],
        'type': row['type'],
        'parentId': row['parent_id'],
        'path': row['path'],
        'name': row['name'],
        'title': row['title'],
        'browserTitle': row['browser_title'],
        'description': row['description'],
        'isHome': bool(row['is_home']),
        'parentViewId': row['parent_view_id'],
        'content': json.loads(row['content'] or '{}'),
        'createdAt': row['created_at'],
        'updatedAt': row['updated_at']
    }


def row_to_component(row) -> Dict[str, Any]:
    """Convert a database row to a component dict."""
    return {
        'id': row['id'],
        'type': row['type'],
        'parentId': row['parent_id'],
        'config': json.loads(row['config'] or '{}'),
        'visible': bool(row['visible'])
    }


# ============ SETTINGS ============

def get_setting(key: str) -> Optional[str]:
    """Get a setting value."""
    with get_db() as conn:
        row = conn.execute('SELECT value FROM settings WHERE key = ?', (key,)).fetchone()
        return row['value'] if row else None


def set_setting(key: str, value: str) -> bool:
    """Set a setting value."""
    with get_db() as conn:
        conn.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, value))
        return True


# ============ EXPORT TO JSON ============

def export_to_metadata_json() -> bool:
    """Export all data from SQLite back to metadata.json for Next.js static build."""
    from pathlib import Path

    # Get all data from database
    themes = get_themes() or {
        'id': 'themes',
        'type': 'Themes',
        'activeThemeId': 'midnight-blue',
        'colorSchemePreference': 'system',
        'customThemes': []
    }

    navigation = get_navigation()

    # Build posts structure
    posts_list = get_all_posts()
    posts_items = {p['id']: p for p in posts_list}

    # Build experiences structure
    exp_list = get_all_experiences()
    exp_items = {e['id']: e for e in exp_list}
    exp_order = [e['id'] for e in exp_list]

    # Build views structure
    views_list = get_all_views()
    default_home_id = get_default_home_view_id()

    # Construct full metadata
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

    # Write to metadata.json
    metadata_path = Path(__file__).parent.parent / 'content' / 'metadata.json'
    metadata_path.write_text(json.dumps(metadata, indent=2))

    return True


# Initialize database on import
init_database()
