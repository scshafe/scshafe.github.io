"""
Site configuration routes for the Author Mode Server.

Handles site-level settings like site name and default home view.
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    load_site_config,
    save_site_config,
    get_all_views,
    get_all_references,
    load_node,
    load_reference,
    load_component_by_id,
)
from entities import SiteConfig, InternalLink

logger = logging.getLogger(__name__)

site_bp = Blueprint('site', __name__)


@site_bp.route('/site', methods=['GET'])
def get_site_config():
    """Get site configuration."""
    logger.info("GET /site")
    config = load_site_config()
    return jsonify(config.to_dict())


@site_bp.route('/site', methods=['PUT'])
def update_site_config():
    """Update site configuration."""
    logger.info("PUT /site")
    try:
        data = request.get_json()
        logger.debug(f"PUT /site data: {data}")

        # Load existing config and merge
        config = load_site_config()

        if 'site_name' in data:
            config.site_name = data['site_name']

        if 'default_home_link' in data:
            link_data = data['default_home_link']
            if link_data:
                # Validate view_node_id exists
                view_node_id = link_data.get('view_node_id')
                if view_node_id:
                    node = load_node(view_node_id)
                    if not node:
                        return jsonify({'error': f'Node with ID {view_node_id} not found'}), 400

                config.default_home_link = InternalLink.from_dict(link_data)
            else:
                config.default_home_link = None

        save_site_config(config)

        logger.info(f"PUT /site -> updated site_name={config.site_name}")
        return jsonify({
            'success': True,
            'config': config.to_dict()
        })

    except Exception as e:
        logger.error(f'Error updating site config: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update site config'}), 500


@site_bp.route('/site/home-view', methods=['GET'])
def get_home_view():
    """Get the current default home view."""
    logger.info("GET /site/home-view")
    config = load_site_config()

    if config.default_home_link and config.default_home_link.view_node_id:
        node_id = config.default_home_link.view_node_id
        node = load_node(node_id)
        if node:
            ref = load_reference(node.ref_id)
            if ref:
                view = load_component_by_id(ref.comp_id)
                if view:
                    return jsonify({
                        'default_home_node_id': node_id,
                        'view': view.to_dict()
                    })

    return jsonify({
        'default_home_node_id': None,
        'view': None
    })


@site_bp.route('/site/home-view', methods=['PUT'])
def set_home_view():
    """Set the default home view."""
    logger.info("PUT /site/home-view")
    try:
        data = request.get_json()
        logger.debug(f"PUT /site/home-view data: {data}")

        node_id = data.get('default_home_node_id')

        # Validate node_id exists
        if node_id is not None:
            node = load_node(node_id)
            if not node:
                return jsonify({'error': f'Node with ID {node_id} not found'}), 400

            # Get the view name for the label
            ref = load_reference(node.ref_id) if node else None
            view = load_component_by_id(ref.comp_id) if ref else None

        config = load_site_config()

        if node_id:
            config.default_home_link = InternalLink(
                label=view.name if view and hasattr(view, 'name') else 'Home',
                view_node_id=node_id,
            )
        else:
            config.default_home_link = None

        save_site_config(config)

        logger.info(f"PUT /site/home-view -> updated default_home_node_id={node_id}")
        return jsonify({
            'success': True,
            'default_home_node_id': node_id
        })

    except Exception as e:
        logger.error(f'Error setting home view: {e}', exc_info=True)
        return jsonify({'error': 'Failed to set home view'}), 500
