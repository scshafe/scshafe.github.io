"""
Metadata routes for the Author Mode Server.

Handles full metadata read/write operations and health check.
"""

import json
from flask import Blueprint, request, jsonify
from pathlib import Path

from database import (
    get_all_experiences,
    save_experience,
    get_all_views,
    get_all_views_resolved,
    save_view,
    get_default_home_view_id,
    set_default_home_view_id,
    get_navigation_config,
)

metadata_bp = Blueprint('metadata', __name__)

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
SETTINGS_FILE = CONTENT_DIR / 'settings.json'


def load_settings() -> dict:
    """Load settings from settings.json file."""
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    # Return defaults if file doesn't exist or is invalid
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
        }
    }


def save_settings(settings: dict) -> bool:
    """Save settings to settings.json file."""
    try:
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=2)
        return True
    except IOError as e:
        print(f'Error saving settings: {e}')
        return False


def get_themes_from_settings() -> dict:
    """Get themes configuration from settings.json."""
    settings = load_settings()
    return settings.get('themes', {
        'activeThemeId': 'midnight-blue',
        'colorSchemePreference': 'system',
        'customThemes': []
    })


def get_navigation_from_settings() -> dict:
    """Get navigation configuration from split settings structure.

    Uses get_navigation_config() which reads from:
    - content/settings/site.json (site name)
    - content/settings/navbar/*.json (header items)
    - content/settings/footer/*.json (footer items)

    And transforms backend format to frontend format.
    """
    return get_navigation_config()


def save_themes_to_settings(themes: dict) -> bool:
    """Save themes configuration to settings.json."""
    settings = load_settings()
    settings['themes'] = themes
    return save_settings(settings)


def save_navigation_to_settings(navigation: dict) -> bool:
    """Save navigation configuration to settings.json."""
    settings = load_settings()
    settings['navigation'] = navigation
    return save_settings(settings)


@metadata_bp.route('/metadata', methods=['GET'])
def get_metadata():
    """Get the full metadata (reconstructed from database + settings.json)."""
    themes = get_themes_from_settings()

    navigation = get_navigation_from_settings()

    # Build experiences structure
    exp_list = get_all_experiences()
    exp_items = {e['id']: e for e in exp_list}
    exp_order = [e['id'] for e in exp_list]

    # Build views structure (resolved to include root_node_id)
    views_list = get_all_views_resolved()
    default_home_id = get_default_home_view_id()

    # Mark home view with is_home flag
    if default_home_id:
        for view in views_list:
            root_id = view.get('root_node_id') or view.get('node_id')
            view['is_home'] = (root_id == default_home_id)

    return jsonify({
        'themes': themes,
        'navigation': navigation,
        'experiences': {
            'id': 'experiences',
            'type': 'Experiences',
            'order': exp_order,
            'items': exp_items
        },
        'views': {
            'id': 'views',
            'type': 'Views',
            'default_home_node_id': default_home_id,
            'views': views_list
        }
    })


@metadata_bp.route('/metadata', methods=['PUT'])
def update_metadata():
    """Update the full metadata (writes to database)."""
    try:
        data = request.get_json()

        # Save themes
        if 'themes' in data:
            save_themes_to_settings(data['themes'])

        # Save navigation
        if 'navigation' in data:
            save_navigation_to_settings(data['navigation'])

        # Save experiences
        if 'experiences' in data:
            exp_config = data['experiences']
            items = exp_config.get('items', {})
            order = exp_config.get('order', [])
            for i, exp_id in enumerate(order):
                if exp_id in items:
                    exp_data = items[exp_id]
                    exp_data['sort_order'] = i
                    save_experience(exp_data)

        # Save views
        if 'views' in data:
            views_config = data['views']
            views_list = views_config.get('items', views_config.get('views', []))
            for view_data in views_list:
                save_view(view_data)
            # Accept both field names for compatibility
            home_id = views_config.get('default_home_node_id') or views_config.get('default_home_view_id')
            if home_id is not None:
                set_default_home_view_id(home_id)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving metadata: {e}')
        return jsonify({'error': 'Failed to save metadata'}), 500


@metadata_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'mode': 'author'})
