"""
Navigation routes for the Author Mode Server.

Handles navigation configuration operations.
"""

import json
from flask import Blueprint, request, jsonify
from pathlib import Path

navigation_bp = Blueprint('navigation', __name__)

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


def get_navigation_from_settings() -> dict:
    """Get navigation configuration from settings.json."""
    settings = load_settings()
    return settings.get('navigation', {
        'siteName': 'My Blog',
        'header': [],
        'footer': []
    })


def save_navigation_to_settings(navigation: dict) -> bool:
    """Save navigation configuration to settings.json."""
    settings = load_settings()
    print("~~ Save Navigation Settings ~~")
    print(json.dumps(settings['navigation'], indent=2))
    print(json.dumps(navigation, indent=2))
    settings['navigation'] = navigation
    return save_settings(settings)


# ============ LEGACY ENDPOINTS ============

@navigation_bp.route('/navigation', methods=['GET'])
def get_navigation_endpoint():
    """Get navigation configuration from settings.json."""
    nav = get_navigation_from_settings()
    return jsonify(nav)


@navigation_bp.route('/navigation', methods=['PUT'])
def update_navigation_endpoint():
    """Update navigation configuration in settings.json."""
    try:
        data = request.get_json()

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'siteName' not in data or 'header' not in data or 'footer' not in data:
            return jsonify({'error': 'Missing required fields: siteName, header, footer'}), 400

        if not save_navigation_to_settings(data):
            return jsonify({'error': 'Failed to save settings'}), 500

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving navigation: {e}')
        return jsonify({'error': 'Failed to save navigation'}), 500


# ============ NEW RESTFUL ENDPOINTS ============

@navigation_bp.route('/navigation/config', methods=['GET'])
def get_navigation_config():
    """Get navigation configuration (new RESTful endpoint)."""
    nav = get_navigation_from_settings()
    if not nav:
        nav = {
            'id': 'navigation',
            'type': 'Navigation',
            'siteName': "scshafe's Blog",
            'header': [],
            'footer': [],
        }
    return jsonify(nav)


@navigation_bp.route('/navigation/config', methods=['PUT'])
def update_navigation_config():
    """Update navigation configuration (new RESTful endpoint)."""
    try:
        data = request.get_json()

        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'siteName' not in data or 'header' not in data or 'footer' not in data:
            return jsonify({'error': 'Missing required fields: siteName, header, footer'}), 400

        print("~~ Update Navigation Config ~~")
        print(json.dumps({'siteName': data.get('siteName'), 'headerCount': len(data.get('header', [])), 'footerCount': len(data.get('footer', []))}, indent=2))

        save_navigation_to_settings(data)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving navigation: {e}')
        return jsonify({'error': 'Failed to save navigation'}), 500
