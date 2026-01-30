#!/usr/bin/env python3
"""
Settings Migration Script

Migrates settings from the monolithic content/settings.json to the new
split structure under content/settings/.

Old structure:
  content/settings.json
    - themes: { activeThemeId, colorSchemePreference, customThemes }
    - navigation: { siteName, header, footer }
    - default_home_view_id

New structure:
  content/settings/
    - site.json: { site_name, default_home_view_id }
    - navbar/{id}.json: Individual navbar items
    - footer/{id}.json: Individual footer items
    - themes/config.json: { active_theme_id, color_scheme_preference }
    - themes/custom/{id}.json: Individual custom themes

Usage:
  python backend/migrate_settings.py
  python backend/migrate_settings.py --dry-run  # Preview without changes
  python backend/migrate_settings.py --backup   # Create backup before migrating
"""

import json
import shutil
import argparse
from pathlib import Path
from datetime import datetime


# Paths
CONTENT_DIR = Path(__file__).parent.parent / 'content'
OLD_SETTINGS_PATH = CONTENT_DIR / 'settings.json'
SETTINGS_DIR = CONTENT_DIR / 'settings'
SITE_CONFIG_PATH = SETTINGS_DIR / 'site.json'
NAVBAR_DIR = SETTINGS_DIR / 'navbar'
FOOTER_DIR = SETTINGS_DIR / 'footer'
THEMES_DIR = SETTINGS_DIR / 'themes'
THEME_CONFIG_PATH = THEMES_DIR / 'config.json'
CUSTOM_THEMES_DIR = THEMES_DIR / 'custom'


def load_old_settings() -> dict:
    """Load the old settings.json file."""
    if not OLD_SETTINGS_PATH.exists():
        print(f"Error: {OLD_SETTINGS_PATH} not found")
        return None

    try:
        with open(OLD_SETTINGS_PATH, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {OLD_SETTINGS_PATH}: {e}")
        return None


def create_directories(dry_run: bool = False):
    """Create the new directory structure."""
    dirs = [SETTINGS_DIR, NAVBAR_DIR, FOOTER_DIR, THEMES_DIR, CUSTOM_THEMES_DIR]

    for dir_path in dirs:
        if dry_run:
            print(f"  [DRY RUN] Would create directory: {dir_path}")
        else:
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"  Created directory: {dir_path}")


def save_json(path: Path, data: dict, dry_run: bool = False):
    """Save JSON to a file."""
    if dry_run:
        print(f"  [DRY RUN] Would write to: {path}")
        print(f"    Content: {json.dumps(data, indent=2)[:200]}...")
    else:
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"  Wrote: {path}")


def migrate_site_config(settings: dict, dry_run: bool = False):
    """Migrate site name and default home view ID."""
    print("\n1. Migrating site config...")

    navigation = settings.get('navigation', {})

    site_config = {
        'site_name': navigation.get('siteName', 'My Blog'),
        'default_home_view_id': settings.get('default_home_view_id')
    }

    save_json(SITE_CONFIG_PATH, site_config, dry_run)


def migrate_navbar_items(settings: dict, dry_run: bool = False):
    """Migrate header navigation items to individual files."""
    print("\n2. Migrating navbar items...")

    navigation = settings.get('navigation', {})
    header_items = navigation.get('header', [])

    if not header_items:
        print("  No navbar items to migrate")
        return

    for idx, item in enumerate(header_items):
        item_id = item.get('id')
        if not item_id:
            print(f"  Warning: Navbar item at index {idx} has no ID, skipping")
            continue

        # Add order field
        item['order'] = idx

        item_path = NAVBAR_DIR / f"{item_id}.json"
        save_json(item_path, item, dry_run)

    print(f"  Migrated {len(header_items)} navbar items")


def migrate_footer_items(settings: dict, dry_run: bool = False):
    """Migrate footer navigation items to individual files."""
    print("\n3. Migrating footer items...")

    navigation = settings.get('navigation', {})
    footer_items = navigation.get('footer', [])

    if not footer_items:
        print("  No footer items to migrate")
        return

    for idx, item in enumerate(footer_items):
        item_id = item.get('id')
        if not item_id:
            print(f"  Warning: Footer item at index {idx} has no ID, skipping")
            continue

        # Add order field
        item['order'] = idx

        item_path = FOOTER_DIR / f"{item_id}.json"
        save_json(item_path, item, dry_run)

    print(f"  Migrated {len(footer_items)} footer items")


def migrate_theme_config(settings: dict, dry_run: bool = False):
    """Migrate theme configuration."""
    print("\n4. Migrating theme config...")

    themes = settings.get('themes', {})

    theme_config = {
        'active_theme_id': themes.get('activeThemeId', 'midnight-blue'),
        'color_scheme_preference': themes.get('colorSchemePreference', 'system')
    }

    save_json(THEME_CONFIG_PATH, theme_config, dry_run)


def migrate_custom_themes(settings: dict, dry_run: bool = False):
    """Migrate custom themes to individual files."""
    print("\n5. Migrating custom themes...")

    themes = settings.get('themes', {})
    custom_themes = themes.get('customThemes', [])

    if not custom_themes:
        print("  No custom themes to migrate")
        return

    for theme in custom_themes:
        theme_id = theme.get('id')
        if not theme_id:
            print(f"  Warning: Custom theme has no ID, skipping")
            continue

        theme_path = CUSTOM_THEMES_DIR / f"{theme_id}.json"
        save_json(theme_path, theme, dry_run)

    print(f"  Migrated {len(custom_themes)} custom themes")


def backup_old_settings():
    """Create a backup of the old settings.json."""
    if not OLD_SETTINGS_PATH.exists():
        return

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = OLD_SETTINGS_PATH.with_suffix(f'.json.backup_{timestamp}')

    shutil.copy(OLD_SETTINGS_PATH, backup_path)
    print(f"Created backup: {backup_path}")


def check_migration_status() -> bool:
    """Check if migration has already been done."""
    # If new structure exists with data, migration may have been done
    if SITE_CONFIG_PATH.exists():
        return True
    return False


def main():
    parser = argparse.ArgumentParser(
        description='Migrate settings.json to new split structure'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview changes without making them'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        help='Create backup before migrating'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force migration even if already done'
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Settings Migration Script")
    print("=" * 60)

    # Check if migration already done
    if check_migration_status() and not args.force:
        print("\nMigration appears to have been done already.")
        print("Use --force to run again.")
        return

    # Load old settings
    print(f"\nLoading old settings from: {OLD_SETTINGS_PATH}")
    settings = load_old_settings()
    if not settings:
        return

    print(f"Loaded settings with keys: {list(settings.keys())}")

    # Dry run mode
    if args.dry_run:
        print("\n[DRY RUN MODE - No changes will be made]\n")

    # Create backup if requested
    if args.backup and not args.dry_run:
        print("\nCreating backup...")
        backup_old_settings()

    # Create directory structure
    print("\nCreating directory structure...")
    create_directories(args.dry_run)

    # Migrate each section
    migrate_site_config(settings, args.dry_run)
    migrate_navbar_items(settings, args.dry_run)
    migrate_footer_items(settings, args.dry_run)
    migrate_theme_config(settings, args.dry_run)
    migrate_custom_themes(settings, args.dry_run)

    print("\n" + "=" * 60)
    if args.dry_run:
        print("DRY RUN COMPLETE - No changes were made")
    else:
        print("MIGRATION COMPLETE")
        print("\nThe old settings.json file has been preserved.")
        print("You can safely delete it after verifying the migration.")
    print("=" * 60)


if __name__ == '__main__':
    main()
