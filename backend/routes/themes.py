"""
Themes routes for the Author Mode Server.

Handles theme configuration operations using the new entity structure.
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    load_theme_config,
    save_theme_config,
    get_all_themes,
    load_theme,
    save_theme,
    delete_theme,
)
from entities import Theme

logger = logging.getLogger(__name__)

themes_bp = Blueprint('themes', __name__)


# ============ THEME CONFIG ENDPOINTS ============

@themes_bp.route('/themes', methods=['GET'])
def get_themes_endpoint():
    """Get theme configuration (aggregated)."""
    logger.info("GET /themes")
    config = load_theme_config()
    custom_themes = get_all_themes()

    return jsonify({
        'activeThemeId': config.get('active_theme_id'),
        'colorSchemePreference': config.get('color_scheme_preference', 'system'),
        'customThemes': [t.to_dict() for t in custom_themes]
    })


@themes_bp.route('/themes', methods=['PUT'])
def update_themes_endpoint():
    """Update theme configuration."""
    logger.info("PUT /themes")
    try:
        data = request.get_json()
        logger.debug(f"PUT /themes data: activeThemeId={data.get('activeThemeId')}, " +
                     f"colorScheme={data.get('colorSchemePreference')}")

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        # Save theme config
        config = {
            'active_theme_id': data.get('activeThemeId'),
            'color_scheme_preference': data.get('colorSchemePreference', 'system')
        }
        save_theme_config(config)

        # Handle custom themes if provided
        if 'customThemes' in data:
            for theme_data in data['customThemes']:
                save_theme(theme_data)

        logger.info("PUT /themes -> updated")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error saving themes: {e}', exc_info=True)
        return jsonify({'error': 'Failed to save themes'}), 500


@themes_bp.route('/theme/config', methods=['GET'])
def get_theme_config():
    """Get theme configuration (new RESTful endpoint)."""
    logger.info("GET /theme/config")
    config = load_theme_config()
    custom_themes = get_all_themes()

    return jsonify({
        'id': 'themes',
        'type': 'Themes',
        'activeThemeId': config.get('active_theme_id'),
        'colorSchemePreference': config.get('color_scheme_preference', 'system'),
        'customThemes': [t.to_dict() for t in custom_themes],
    })


@themes_bp.route('/theme/config', methods=['PUT'])
def update_theme_config():
    """Update theme configuration (new RESTful endpoint)."""
    logger.info("PUT /theme/config")
    # Delegate to the main PUT handler
    return update_themes_endpoint()


# ============ CUSTOM THEMES ENDPOINTS ============

@themes_bp.route('/themes/custom', methods=['GET'])
def get_custom_themes():
    """Get all custom themes."""
    logger.info("GET /themes/custom")
    themes = get_all_themes()
    result = [t.to_dict() for t in themes]
    logger.info(f"GET /themes/custom -> {len(result)} themes")
    return jsonify(result)


@themes_bp.route('/themes/custom', methods=['POST'])
def create_custom_theme():
    """Create a new custom theme."""
    logger.info("POST /themes/custom")
    try:
        data = request.get_json()
        logger.debug(f"POST /themes/custom data: {data}")

        # Validate required fields
        if 'name' not in data:
            return jsonify({'error': 'name is required'}), 400

        theme_id = save_theme(data)
        theme = load_theme(theme_id)

        logger.info(f"POST /themes/custom -> created theme_id={theme_id}")
        return jsonify({
            'success': True,
            'theme_id': theme_id,
            'theme': theme.to_dict() if theme else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating custom theme: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create custom theme'}), 500


@themes_bp.route('/themes/custom/<int:theme_id>', methods=['GET'])
def get_custom_theme(theme_id: int):
    """Get a custom theme by ID."""
    logger.info(f"GET /themes/custom/{theme_id}")
    theme = load_theme(theme_id)
    if not theme:
        return jsonify({'error': 'Custom theme not found'}), 404
    return jsonify(theme.to_dict())


@themes_bp.route('/themes/custom/<int:theme_id>', methods=['PUT'])
def update_custom_theme(theme_id: int):
    """Update a custom theme."""
    logger.info(f"PUT /themes/custom/{theme_id}")
    try:
        data = request.get_json()
        logger.debug(f"PUT /themes/custom/{theme_id} data: {data}")

        existing = load_theme(theme_id)
        if not existing:
            return jsonify({'error': 'Custom theme not found'}), 404

        # Update fields
        if 'name' in data:
            existing.name = data['name']
        if 'color_scheme' in data:
            existing.color_scheme = data['color_scheme']

        save_theme(existing)

        logger.info(f"PUT /themes/custom/{theme_id} -> updated")
        return jsonify({'success': True, 'theme_id': theme_id})

    except Exception as e:
        logger.error(f'Error updating custom theme: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update custom theme'}), 500


@themes_bp.route('/themes/custom/<int:theme_id>', methods=['DELETE'])
def delete_custom_theme_endpoint(theme_id: int):
    """Delete a custom theme."""
    logger.info(f"DELETE /themes/custom/{theme_id}")
    try:
        if not delete_theme(theme_id):
            return jsonify({'error': 'Custom theme not found'}), 404

        logger.info(f"DELETE /themes/custom/{theme_id} -> deleted")
        return jsonify({'success': True})

    except Exception as e:
        logger.error(f'Error deleting custom theme: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete custom theme'}), 500
