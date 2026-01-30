#!/usr/bin/env python3
"""
Reset Script

Resets the content directory to an empty state with only default theme configuration.
No views, components, nodes, references, navbar items, or footer items are created.

Usage:
    python3 backend/reset_and_seed.py                    # Reset to empty state
    python3 backend/reset_and_seed.py --data-only        # Reset only views/nodes/references/components
    python3 backend/reset_and_seed.py --settings-only    # Reset only settings
"""

import sys
import shutil
import json
from pathlib import Path

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent
CONTENT_DIR = ROOT_DIR / 'content'

# Content subdirectories
VIEWS_DIR = CONTENT_DIR / 'views'
COMPONENTS_DIR = CONTENT_DIR / 'components'
REFERENCES_DIR = CONTENT_DIR / 'references'
NODES_DIR = CONTENT_DIR / 'nodes'
EXPERIENCES_DIR = CONTENT_DIR / 'experiences'

# Settings structure
SETTINGS_DIR = CONTENT_DIR / 'settings'
NAVBAR_DIR = SETTINGS_DIR / 'navbar'
FOOTER_DIR = SETTINGS_DIR / 'footer'
THEMES_DIR = SETTINGS_DIR / 'themes'
CUSTOM_THEMES_DIR = THEMES_DIR / 'custom'

# Component types (new architecture names)
COMPONENT_TYPES = [
    'SectionUnit', 'MarkdownUnit', 'PlainTextUnit', 'AlertUnit',
    'ImageMedia', 'VideoMedia', 'PDFMedia',
    'ListContainer', 'InlineContainer', 'StyleContainer',
    'ExperienceComponent', 'TagListComponent', 'LinkUnit', 'ViewContainer'
]


# Color codes for terminal output
class Colors:
    YELLOW = '\033[33m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    BLUE = '\033[34m'
    CYAN = '\033[36m'
    MAGENTA = '\033[35m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_step(msg: str):
    """Print a step message with formatting."""
    print(f"{Colors.YELLOW}[Reset]{Colors.RESET} {msg}")


def print_success(msg: str):
    """Print a success message with formatting."""
    print(f"{Colors.GREEN}[Reset]{Colors.RESET} {msg}")


def print_error(msg: str):
    """Print an error message with formatting."""
    print(f"{Colors.RED}[Reset]{Colors.RESET} {msg}")


def print_info(msg: str):
    """Print an info message with formatting."""
    print(f"{Colors.CYAN}[Info]{Colors.RESET} {msg}")


def remove_directory_contents(dir_path: Path):
    """Remove all contents of a directory but keep the directory itself."""
    if dir_path.exists():
        for item in dir_path.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        print_step(f"Cleared {dir_path}")


def ensure_directories():
    """Ensure all required directories exist."""
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    VIEWS_DIR.mkdir(parents=True, exist_ok=True)
    REFERENCES_DIR.mkdir(parents=True, exist_ok=True)
    NODES_DIR.mkdir(parents=True, exist_ok=True)
    EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)

    # Create component type directories
    for comp_type in COMPONENT_TYPES:
        (COMPONENTS_DIR / comp_type).mkdir(parents=True, exist_ok=True)

    # Settings directories
    SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
    NAVBAR_DIR.mkdir(parents=True, exist_ok=True)
    FOOTER_DIR.mkdir(parents=True, exist_ok=True)
    THEMES_DIR.mkdir(parents=True, exist_ok=True)
    CUSTOM_THEMES_DIR.mkdir(parents=True, exist_ok=True)


def reset_settings():
    """Reset settings to empty state with only default theme config.

    Creates:
    - site.json with empty/null values
    - themes/config.json with default theme
    - Empty navbar/ directory
    - Empty footer/ directory
    - Empty themes/custom/ directory

    Also removes:
    - Legacy settings.json file (if exists)
    """
    print_step("Resetting settings to empty state...")

    # Remove legacy settings.json if it exists
    legacy_settings = CONTENT_DIR / 'settings.json'
    if legacy_settings.exists():
        legacy_settings.unlink()
        print_step("Removed legacy settings.json")

    # Clear existing settings directory
    remove_directory_contents(SETTINGS_DIR)
    ensure_directories()

    # Create empty site.json
    site_config = {
        'site_name': 'My Site',
        'default_home_view_id': None
    }
    site_path = SETTINGS_DIR / 'site.json'
    with open(site_path, 'w') as f:
        json.dump(site_config, f, indent=2)
    print_step(f"Created {site_path}")

    # Create default theme config (uses built-in themes only)
    theme_config = {
        'active_theme_id': 'midnight-blue',
        'color_scheme_preference': 'system'
    }
    theme_config_path = THEMES_DIR / 'config.json'
    with open(theme_config_path, 'w') as f:
        json.dump(theme_config, f, indent=2)
    print_step(f"Created {theme_config_path}")

    # No navbar items created (empty directory)
    print_step("Created empty navbar/ directory")

    # No footer items created (empty directory)
    print_step("Created empty footer/ directory")

    # No custom themes created (empty directory)
    print_step("Created empty themes/custom/ directory")

    print_step("Reset settings complete (empty state)")
    return True


def reset_views():
    """Reset views directory to empty state."""
    remove_directory_contents(VIEWS_DIR)
    VIEWS_DIR.mkdir(parents=True, exist_ok=True)
    print_step("Cleared views/ directory")
    return 0


def reset_components():
    """Reset components directory to empty state."""
    # Clear all component type directories
    for comp_type in COMPONENT_TYPES:
        comp_dir = COMPONENTS_DIR / comp_type
        remove_directory_contents(comp_dir)
        comp_dir.mkdir(parents=True, exist_ok=True)
    print_step("Cleared components/ directory")
    return 0


def reset_references():
    """Reset references directory to empty state."""
    remove_directory_contents(REFERENCES_DIR)
    REFERENCES_DIR.mkdir(parents=True, exist_ok=True)
    print_step("Cleared references/ directory")
    return 0


def reset_nodes():
    """Reset nodes directory to empty state."""
    remove_directory_contents(NODES_DIR)
    NODES_DIR.mkdir(parents=True, exist_ok=True)
    print_step("Cleared nodes/ directory")
    return 0


def reset_experiences():
    """Reset experiences directory to empty state."""
    remove_directory_contents(EXPERIENCES_DIR)
    EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)
    print_step("Cleared experiences/ directory")
    return 0


def reset_data():
    """Reset all data (views, components, references, nodes) but not settings."""
    print_step("Resetting data files to empty state...")

    ensure_directories()

    reset_views()
    reset_components()
    reset_references()
    reset_nodes()
    reset_experiences()

    print_success("Data reset complete (empty state)!")


def reset_all():
    """Reset everything to empty state."""
    print_step("Resetting all content to empty state...")

    ensure_directories()

    reset_settings()
    reset_views()
    reset_components()
    reset_references()
    reset_nodes()
    reset_experiences()

    print_success("Full reset complete (empty state)!")


def show_summary():
    """Show a summary of the content structure."""
    print(f"\n{Colors.BOLD}Content Structure:{Colors.RESET}")
    print(f"  {Colors.CYAN}Views:{Colors.RESET}      content/views/*.json")
    print(f"  {Colors.CYAN}Components:{Colors.RESET} content/components/{{Type}}/*.json")
    print(f"  {Colors.CYAN}References:{Colors.RESET} content/references/*.json")
    print(f"  {Colors.CYAN}Nodes:{Colors.RESET}      content/nodes/*.json")
    print(f"  {Colors.CYAN}Settings:{Colors.RESET}   content/settings/")
    print(f"    {Colors.CYAN}├─ site.json:{Colors.RESET}        Site name, home view")
    print(f"    {Colors.CYAN}├─ navbar/*.json:{Colors.RESET}    Header nav items (empty after reset)")
    print(f"    {Colors.CYAN}├─ footer/*.json:{Colors.RESET}    Footer nav items (empty after reset)")
    print(f"    {Colors.CYAN}└─ themes/:{Colors.RESET}          Theme configuration")
    print()

    # Count current files
    view_count = len(list(VIEWS_DIR.glob('*.json'))) if VIEWS_DIR.exists() else 0
    ref_count = len(list(REFERENCES_DIR.glob('*.json'))) if REFERENCES_DIR.exists() else 0
    node_count = len(list(NODES_DIR.glob('*.json'))) if NODES_DIR.exists() else 0
    navbar_count = len(list(NAVBAR_DIR.glob('*.json'))) if NAVBAR_DIR.exists() else 0
    footer_count = len(list(FOOTER_DIR.glob('*.json'))) if FOOTER_DIR.exists() else 0

    comp_count = 0
    for comp_type in COMPONENT_TYPES:
        comp_dir = COMPONENTS_DIR / comp_type
        if comp_dir.exists():
            comp_count += len(list(comp_dir.glob('*.json')))

    print(f"{Colors.BOLD}Current Data:{Colors.RESET}")
    print(f"  Views:      {view_count}")
    print(f"  Components: {comp_count}")
    print(f"  References: {ref_count}")
    print(f"  Nodes:      {node_count}")
    print(f"  Navbar:     {navbar_count}")
    print(f"  Footer:     {footer_count}")
    print()

    print(f"{Colors.BOLD}After Reset:{Colors.RESET}")
    print(f"  All directories will be {Colors.YELLOW}empty{Colors.RESET}")
    print(f"  Only {Colors.GREEN}default theme config{Colors.RESET} will remain")
    print()


def main():
    # Parse command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == '--data-only':
            reset_data()
        elif arg == '--settings-only':
            reset_settings()
            print_success("Settings reset complete!")
        elif arg == '--summary':
            show_summary()
        elif arg == '--help' or arg == '-h':
            print(__doc__)
            show_summary()
        else:
            print_error(f"Unknown argument: {arg}")
            print(__doc__)
            sys.exit(1)
    else:
        show_summary()
        print_info("Running full reset to empty state...")
        reset_all()


if __name__ == '__main__':
    main()
