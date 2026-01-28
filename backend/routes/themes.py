"""
Themes routes for the Author Mode Server.

Handles theme configuration operations.
"""

import json
from flask import Blueprint, request, jsonify
from pathlib import Path

themes_bp = Blueprint('themes', __name__)

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


def save_themes_to_settings(themes: dict) -> bool:
    """Save themes configuration to settings.json."""
    settings = load_settings()
    print("~~ Save Theme Settings ~~")
    print(json.dumps(settings['themes'], indent=2))
    print(json.dumps(themes, indent=2))
    settings['themes'] = themes
    return save_settings(settings)


# ============ LEGACY ENDPOINTS ============

@themes_bp.route('/themes', methods=['GET'])
def get_themes_endpoint():
    """Get theme configuration from settings.json."""
    themes = get_themes_from_settings()
    return jsonify(themes)


@themes_bp.route('/themes', methods=['PUT'])
def update_themes_endpoint():
    """Update theme configuration in settings.json."""
    try:
        data = request.get_json()

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'activeThemeId' not in data:
            return jsonify({'error': 'Missing required field: activeThemeId'}), 400

        if not save_themes_to_settings(data):
            return jsonify({'error': 'Failed to save settings'}), 500

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving themes: {e}')
        return jsonify({'error': 'Failed to save themes'}), 500


# ============ NEW RESTFUL ENDPOINTS ============

@themes_bp.route('/theme/config', methods=['GET'])
def get_theme_config():
    """Get theme configuration (new RESTful endpoint)."""
    themes = get_themes_from_settings()
    if not themes:
        themes = {
            'id': 'themes',
            'type': 'Themes',
            'activeThemeId': 'midnight-blue',
            'colorSchemePreference': 'system',
            'customThemes': [],
        }
    return jsonify(themes)


@themes_bp.route('/theme/config', methods=['PUT'])
def update_theme_config():
    """Update theme configuration (new RESTful endpoint)."""
    try:
        data = request.get_json()

        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'activeThemeId' not in data:
            return jsonify({'error': 'Missing required field: activeThemeId'}), 400

        print("~~ Update Theme Config ~~")
        print(json.dumps({'activeThemeId': data.get('activeThemeId'), 'colorSchemePreference': data.get('colorSchemePreference')}, indent=2))

        save_themes_to_settings(data)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving themes: {e}')
        return jsonify({'error': 'Failed to save themes'}), 500
