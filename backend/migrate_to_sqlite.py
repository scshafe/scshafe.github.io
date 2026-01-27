#!/usr/bin/env python3
"""
Migration Script: JSON to SQLite

Migrates existing metadata.json data to the new SQLite database.
Run this once to transfer all existing content.
"""

import json
from pathlib import Path
from database import (
    init_database,
    save_themes,
    save_navigation,
    save_post,
    save_experience,
    save_view,
    set_setting,
    get_connection
)

# Paths
ROOT_DIR = Path(__file__).parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
METADATA_PATH = CONTENT_DIR / 'metadata.json'


def load_metadata() -> dict:
    """Load the existing metadata.json file."""
    try:
        return json.loads(METADATA_PATH.read_text())
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading metadata.json: {e}")
        return {}


def migrate_themes(metadata: dict):
    """Migrate themes configuration."""
    themes = metadata.get('themes', {})
    if themes:
        save_themes({
            'activeThemeId': themes.get('activeThemeId', 'midnight-blue'),
            'colorSchemePreference': themes.get('colorSchemePreference', 'system'),
            'customThemes': themes.get('customThemes', [])
        })
        print("✓ Migrated themes")
    else:
        print("- No themes to migrate")


def migrate_navigation(metadata: dict):
    """Migrate navigation configuration."""
    nav = metadata.get('navigation', {})
    if nav:
        # Handle both old and new formats
        header = nav.get('header', [])
        footer = nav.get('footer', [])

        save_navigation({
            'siteName': nav.get('siteName', 'Blog'),
            'header': header,
            'footer': footer
        })
        print(f"✓ Migrated navigation ({len(header)} header links, {len(footer)} footer links)")
    else:
        print("- No navigation to migrate")


def migrate_posts(metadata: dict):
    """Migrate posts."""
    posts_config = metadata.get('posts', {})

    # Handle new format with 'items'
    if 'items' in posts_config:
        posts = posts_config.get('items', {})
        for post_id, post_data in posts.items():
            slug = post_data.get('slug', post_id.replace('post-', ''))
            save_post({
                'id': post_id,
                'slug': slug,
                'title': post_data.get('title', ''),
                'date': post_data.get('date'),
                'categories': post_data.get('categories', []),
                'layout': post_data.get('layout', 'post'),
                'toc': post_data.get('toc', False),
                'is_series': post_data.get('is_series', False),
                'series_title': post_data.get('series_title')
            })
        print(f"✓ Migrated {len(posts)} posts (new format)")
    else:
        # Handle legacy format
        count = 0
        for slug, post_data in posts_config.items():
            if isinstance(post_data, dict) and 'title' in post_data:
                save_post({
                    'id': f'post-{slug}',
                    'slug': slug,
                    'title': post_data.get('title', ''),
                    'date': post_data.get('date'),
                    'categories': post_data.get('categories', []),
                    'layout': post_data.get('layout', 'post'),
                    'toc': post_data.get('toc', False),
                    'is_series': post_data.get('is_series', False),
                    'series_title': post_data.get('series_title')
                })
                count += 1
        print(f"✓ Migrated {count} posts (legacy format)")


def migrate_experiences(metadata: dict):
    """Migrate experiences."""
    exp_config = metadata.get('experiences', {})
    order = exp_config.get('order', [])

    # Handle new format with 'items'
    if 'items' in exp_config:
        experiences = exp_config.get('items', {})
        for i, exp_id in enumerate(order):
            if exp_id in experiences:
                exp_data = experiences[exp_id]
                save_experience({
                    'id': exp_id,
                    'title': exp_data.get('title', ''),
                    'company': exp_data.get('company'),
                    'startDate': exp_data.get('startDate'),
                    'endDate': exp_data.get('endDate'),
                    'image': exp_data.get('image'),
                    'backgroundColor': exp_data.get('backgroundColor'),
                    'textColor': exp_data.get('textColor'),
                    'accentColor': exp_data.get('accentColor'),
                    'sort_order': i
                })
        print(f"✓ Migrated {len(order)} experiences (new format)")
    else:
        # Handle legacy format
        count = 0
        for i, exp_id in enumerate(order):
            if exp_id in exp_config and isinstance(exp_config[exp_id], dict):
                exp_data = exp_config[exp_id]
                save_experience({
                    'id': f'exp-{exp_id}',
                    'title': exp_data.get('title', ''),
                    'company': exp_data.get('company'),
                    'startDate': exp_data.get('startDate'),
                    'endDate': exp_data.get('endDate'),
                    'image': exp_data.get('image'),
                    'backgroundColor': exp_data.get('backgroundColor'),
                    'textColor': exp_data.get('textColor'),
                    'accentColor': exp_data.get('accentColor'),
                    'sort_order': i
                })
                count += 1
        print(f"✓ Migrated {count} experiences (legacy format)")


def migrate_views(metadata: dict):
    """Migrate views."""
    views_config = metadata.get('views', {})

    # Get views array (supports both 'items' and 'views' keys)
    views = views_config.get('items', views_config.get('views', []))

    for view_data in views:
        save_view({
            'id': view_data.get('id'),
            'path': view_data.get('path'),
            'name': view_data.get('name'),
            'title': view_data.get('title'),
            'browserTitle': view_data.get('browserTitle'),
            'description': view_data.get('description'),
            'isHome': view_data.get('isHome', False),
            'parentViewId': view_data.get('parentViewId'),
            'content': view_data.get('content', {}),
            'components': view_data.get('components', []),
            'createdAt': view_data.get('createdAt')
        })

    # Set default home view ID
    default_home = views_config.get('defaultHomeViewId')
    if default_home:
        set_setting('defaultHomeViewId', default_home)

    print(f"✓ Migrated {len(views)} views")


def main():
    """Run the migration."""
    print("=" * 50)
    print("Migrating metadata.json to SQLite")
    print("=" * 50)

    # Initialize the database schema
    print("\nInitializing database schema...")
    init_database()
    print("✓ Database schema created")

    # Load existing metadata
    print("\nLoading metadata.json...")
    metadata = load_metadata()

    if not metadata:
        print("No metadata found. Creating empty database.")
        return

    print(f"✓ Loaded metadata with {len(metadata)} top-level keys")

    # Migrate each section
    print("\nMigrating data...")
    migrate_themes(metadata)
    migrate_navigation(metadata)
    migrate_posts(metadata)
    migrate_experiences(metadata)
    migrate_views(metadata)

    print("\n" + "=" * 50)
    print("Migration complete!")
    print("=" * 50)

    # Verify migration
    print("\nVerifying migration...")
    conn = get_connection()
    cursor = conn.cursor()

    tables = ['themes', 'navigation', 'nav_links', 'posts', 'experiences', 'views', 'view_components']
    for table in tables:
        count = cursor.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
        print(f"  {table}: {count} rows")

    conn.close()

    print("\nThe database is ready at: content/blog.db")
    print("You can now update server.py to use the database module.")


if __name__ == '__main__':
    main()
