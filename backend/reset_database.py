#!/usr/bin/env python3
"""
Reset Database Script

Clears all data from the SQLite database and sets up minimal defaults.
Use this to start fresh with a clean slate.

Usage:
    python3 backend/reset_database.py
"""

import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / 'content' / 'blog.db'


def reset_database():
    """Reset the database to a clean state with minimal defaults."""
    print("Resetting database...")

    # Delete the existing database file
    if DB_PATH.exists():
        DB_PATH.unlink()
        print(f"  Deleted existing database: {DB_PATH}")

    # Create fresh database with schema
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create tables
    cursor.executescript('''
        -- Themes configuration
        CREATE TABLE IF NOT EXISTS themes (
            id TEXT PRIMARY KEY DEFAULT 'themes',
            data TEXT NOT NULL
        );

        -- Navigation configuration
        CREATE TABLE IF NOT EXISTS navigation (
            id TEXT PRIMARY KEY DEFAULT 'navigation',
            site_name TEXT NOT NULL,
            data TEXT NOT NULL
        );

        -- Navigation links
        CREATE TABLE IF NOT EXISTS nav_links (
            id TEXT PRIMARY KEY,
            parent_id TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'NavLink',
            label TEXT NOT NULL,
            url TEXT NOT NULL,
            position TEXT NOT NULL,
            icon TEXT,
            external INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0
        );

        -- Blog posts metadata
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            date TEXT,
            categories TEXT,
            layout TEXT DEFAULT 'post',
            toc INTEGER DEFAULT 0,
            is_series INTEGER DEFAULT 0,
            series_title TEXT
        );

        -- Work experiences
        CREATE TABLE IF NOT EXISTS experiences (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT,
            start_date TEXT,
            end_date TEXT,
            image TEXT,
            background_color TEXT,
            text_color TEXT,
            accent_color TEXT,
            sort_order INTEGER DEFAULT 0
        );

        -- Views (pages)
        CREATE TABLE IF NOT EXISTS views (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            name TEXT NOT NULL,
            title TEXT NOT NULL,
            browser_title TEXT,
            description TEXT,
            is_home INTEGER DEFAULT 0,
            parent_view_id TEXT,
            sort_order INTEGER DEFAULT 0
        );

        -- View components
        CREATE TABLE IF NOT EXISTS view_components (
            id TEXT PRIMARY KEY,
            view_id TEXT NOT NULL,
            type TEXT NOT NULL,
            config TEXT,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
        );

        -- View content storage
        CREATE TABLE IF NOT EXISTS view_content (
            view_id TEXT NOT NULL,
            content_key TEXT NOT NULL,
            content TEXT,
            PRIMARY KEY (view_id, content_key),
            FOREIGN KEY (view_id) REFERENCES views(id) ON DELETE CASCADE
        );

        -- General settings
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    ''')

    # Generate timestamp for site name: "MMM d hh:mm"
    now = datetime.now()
    site_name = now.strftime("%b %-d %H:%M")

    # Insert minimal defaults
    import json

    # Default themes
    themes_data = {
        'id': 'themes',
        'type': 'Themes',
        'activeThemeId': 'midnight-blue',
        'colorSchemePreference': 'system',
        'customThemes': []
    }
    cursor.execute(
        'INSERT INTO themes (id, data) VALUES (?, ?)',
        ('themes', json.dumps(themes_data))
    )

    # Default navigation - just site name, no links
    nav_data = {
        'id': 'navigation',
        'type': 'Navigation',
        'siteName': site_name,
        'header': [],
        'footer': []
    }
    cursor.execute(
        'INSERT INTO navigation (id, site_name, data) VALUES (?, ?, ?)',
        ('navigation', site_name, json.dumps(nav_data))
    )

    # Set default home view ID (empty since no views)
    cursor.execute(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        ('defaultHomeViewId', '')
    )

    conn.commit()
    conn.close()

    print(f"  Created fresh database: {DB_PATH}")
    print(f"  Site name set to: {site_name}")
    print("  No views or navigation links included")
    print("✓ Database reset complete")


if __name__ == '__main__':
    reset_database()
