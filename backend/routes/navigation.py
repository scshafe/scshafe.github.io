"""
Navigation routes for the Author Mode Server.

Handles navigation configuration operations using the new entity structure.
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    get_navigation_config,
    get_all_navbar_items,
    get_all_footer_items,
    load_navbar_item,
    save_navbar_item,
    delete_navbar_item,
    load_footer_item,
    save_footer_item,
    delete_footer_item,
    load_site_config,
    save_site_config,
)
from entities import NavBar, Footer, InternalLink

logger = logging.getLogger(__name__)

navigation_bp = Blueprint('navigation', __name__)


# ============ AGGREGATED NAVIGATION ENDPOINTS ============

@navigation_bp.route('/navigation', methods=['GET'])
def get_navigation_endpoint():
    """Get navigation configuration (aggregated)."""
    logger.info("GET /navigation")
    nav = get_navigation_config()
    return jsonify(nav)


def transform_nav_item_to_backend(item_data: dict) -> dict:
    """Transform frontend NavItem format to backend NavBar/Footer format.

    Frontend sends: { id, label, linkType, viewId, url, position, icon, external }
    Backend expects: { nav_bar_id, position, order, internal_link: { label, view_node_id, url, icon } }
    """
    link_type = item_data.get('linkType', 'url')
    link_data = {
        'label': item_data.get('label', ''),
        'icon': item_data.get('icon'),
    }

    if link_type == 'view' and item_data.get('viewId'):
        link_data['view_node_id'] = item_data['viewId']
    elif link_type == 'url':
        link_data['url'] = item_data.get('url', '/')
    elif link_type == 'theme':
        # Theme toggle - store as special URL marker
        link_data['url'] = '__theme_toggle__'

    result = {
        'nav_bar_id': item_data.get('id'),
        'position': item_data.get('position', 'left'),
        'order': item_data.get('order', 0),
        'internal_link': link_data,
    }

    logger.debug(f"[settings/navbar] TRANSFORM_TO_BACKEND: label='{link_data['label']}', linkType={link_type}, viewId={link_data.get('view_node_id')}, url={link_data.get('url')}")
    return result


@navigation_bp.route('/navigation', methods=['PUT'])
def update_navigation_endpoint():
    """Update navigation configuration (writes to split structure)."""
    logger.info("PUT /navigation")
    try:
        data = request.get_json()
        logger.debug(f"PUT /navigation data: siteName={data.get('siteName')}, " +
                     f"header_count={len(data.get('header', []))}, " +
                     f"footer_count={len(data.get('footer', []))}")

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'siteName' not in data or 'header' not in data or 'footer' not in data:
            return jsonify({'error': 'Missing required fields: siteName, header, footer'}), 400

        # Update site name
        site_config = load_site_config()
        site_config.site_name = data['siteName']
        save_site_config(site_config)

        # Delete existing navbar items
        for item in get_all_navbar_items():
            delete_navbar_item(item.nav_bar_id)

        # Delete existing footer items
        for item in get_all_footer_items():
            delete_footer_item(item.footer_id)

        # Save new navbar items (transform from frontend format)
        for idx, item_data in enumerate(data.get('header', [])):
            backend_data = transform_nav_item_to_backend(item_data)
            backend_data['order'] = idx
            save_navbar_item(backend_data)

        # Save new footer items (transform from frontend format)
        for idx, item_data in enumerate(data.get('footer', [])):
            backend_data = transform_nav_item_to_backend(item_data)
            backend_data['order'] = idx
            save_footer_item(backend_data)

        logger.info("PUT /navigation -> updated")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error saving navigation: {e}', exc_info=True)
        return jsonify({'error': 'Failed to save navigation'}), 500


@navigation_bp.route('/navigation/config', methods=['GET'])
def get_navigation_config_endpoint():
    """Get navigation configuration (new RESTful endpoint)."""
    logger.info("GET /navigation/config")
    nav = get_navigation_config()
    nav['id'] = 'navigation'
    nav['type'] = 'Navigation'
    return jsonify(nav)


@navigation_bp.route('/navigation/config', methods=['PUT'])
def update_navigation_config():
    """Update navigation configuration (new RESTful endpoint)."""
    logger.info("PUT /navigation/config")
    # Delegate to the main PUT handler
    return update_navigation_endpoint()


# ============ NAVBAR ENDPOINTS ============

@navigation_bp.route('/navbar', methods=['GET'])
def get_navbar_items():
    """Get all navbar items."""
    logger.info("GET /navbar")
    items = get_all_navbar_items()
    result = [item.to_dict() for item in items]
    logger.info(f"GET /navbar -> {len(result)} items")
    return jsonify(result)


@navigation_bp.route('/navbar', methods=['POST'])
def create_navbar_item():
    """Create a new navbar item."""
    logger.info("POST /navbar")
    try:
        data = request.get_json()
        logger.debug(f"POST /navbar data: {data}")

        # Validate required fields
        internal_link = data.get('internal_link', {})
        if not internal_link.get('label'):
            return jsonify({'error': 'internal_link.label is required'}), 400

        # Get current items to determine order
        existing = get_all_navbar_items()
        data['order'] = len(existing)
        data['position'] = data.get('position', 'left')

        nav_bar_id = save_navbar_item(data)
        item = load_navbar_item(nav_bar_id)

        logger.info(f"POST /navbar -> created nav_bar_id={nav_bar_id}")
        return jsonify({
            'success': True,
            'nav_bar_id': nav_bar_id,
            'item': item.to_dict() if item else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating navbar item: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create navbar item'}), 500


@navigation_bp.route('/navbar/<int:nav_bar_id>', methods=['GET'])
def get_navbar_item_endpoint(nav_bar_id: int):
    """Get a navbar item by ID."""
    logger.info(f"GET /navbar/{nav_bar_id}")
    item = load_navbar_item(nav_bar_id)
    if not item:
        return jsonify({'error': 'Navbar item not found'}), 404
    return jsonify(item.to_dict())


@navigation_bp.route('/navbar/<int:nav_bar_id>', methods=['PUT'])
def update_navbar_item(nav_bar_id: int):
    """Update a navbar item."""
    logger.info(f"PUT /navbar/{nav_bar_id}")
    try:
        data = request.get_json()
        logger.debug(f"PUT /navbar/{nav_bar_id} data: {data}")

        existing = load_navbar_item(nav_bar_id)
        if not existing:
            return jsonify({'error': 'Navbar item not found'}), 404

        # Update fields
        if 'position' in data:
            existing.position = data['position']
        if 'order' in data:
            existing.order = data['order']
        if 'internal_link' in data:
            existing.internal_link = InternalLink.from_dict(data['internal_link'])

        save_navbar_item(existing)

        logger.info(f"PUT /navbar/{nav_bar_id} -> updated")
        return jsonify({'success': True, 'nav_bar_id': nav_bar_id})

    except Exception as e:
        logger.error(f'Error updating navbar item: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update navbar item'}), 500


@navigation_bp.route('/navbar/<int:nav_bar_id>', methods=['DELETE'])
def delete_navbar_item_endpoint(nav_bar_id: int):
    """Delete a navbar item."""
    logger.info(f"DELETE /navbar/{nav_bar_id}")
    try:
        if not delete_navbar_item(nav_bar_id):
            return jsonify({'error': 'Navbar item not found'}), 404

        logger.info(f"DELETE /navbar/{nav_bar_id} -> deleted")
        return jsonify({'success': True})

    except Exception as e:
        logger.error(f'Error deleting navbar item: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete navbar item'}), 500


@navigation_bp.route('/navbar/order', methods=['PUT'])
def reorder_navbar_items():
    """Reorder navbar items."""
    logger.info("PUT /navbar/order")
    try:
        data = request.get_json()
        ordered_ids = data.get('order', [])
        logger.debug(f"PUT /navbar/order ordered_ids: {ordered_ids}")

        for idx, nav_bar_id in enumerate(ordered_ids):
            item = load_navbar_item(nav_bar_id)
            if item:
                item.order = idx
                save_navbar_item(item)

        logger.info("PUT /navbar/order -> reordered")
        return jsonify({'success': True})

    except Exception as e:
        logger.error(f'Error reordering navbar items: {e}', exc_info=True)
        return jsonify({'error': 'Failed to reorder navbar items'}), 500


# ============ FOOTER ENDPOINTS ============

@navigation_bp.route('/footer', methods=['GET'])
def get_footer_items():
    """Get all footer items."""
    logger.info("GET /footer")
    items = get_all_footer_items()
    result = [item.to_dict() for item in items]
    logger.info(f"GET /footer -> {len(result)} items")
    return jsonify(result)


@navigation_bp.route('/footer', methods=['POST'])
def create_footer_item():
    """Create a new footer item."""
    logger.info("POST /footer")
    try:
        data = request.get_json()
        logger.debug(f"POST /footer data: {data}")

        # Validate required fields
        internal_link = data.get('internal_link', {})
        if not internal_link.get('label'):
            return jsonify({'error': 'internal_link.label is required'}), 400

        # Get current items to determine order
        existing = get_all_footer_items()
        data['order'] = len(existing)
        data['position'] = data.get('position', 'left')

        footer_id = save_footer_item(data)
        item = load_footer_item(footer_id)

        logger.info(f"POST /footer -> created footer_id={footer_id}")
        return jsonify({
            'success': True,
            'footer_id': footer_id,
            'item': item.to_dict() if item else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating footer item: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create footer item'}), 500


@navigation_bp.route('/footer/<int:footer_id>', methods=['GET'])
def get_footer_item_endpoint(footer_id: int):
    """Get a footer item by ID."""
    logger.info(f"GET /footer/{footer_id}")
    item = load_footer_item(footer_id)
    if not item:
        return jsonify({'error': 'Footer item not found'}), 404
    return jsonify(item.to_dict())


@navigation_bp.route('/footer/<int:footer_id>', methods=['PUT'])
def update_footer_item(footer_id: int):
    """Update a footer item."""
    logger.info(f"PUT /footer/{footer_id}")
    try:
        data = request.get_json()
        logger.debug(f"PUT /footer/{footer_id} data: {data}")

        existing = load_footer_item(footer_id)
        if not existing:
            return jsonify({'error': 'Footer item not found'}), 404

        # Update fields
        if 'position' in data:
            existing.position = data['position']
        if 'order' in data:
            existing.order = data['order']
        if 'internal_link' in data:
            existing.internal_link = InternalLink.from_dict(data['internal_link'])

        save_footer_item(existing)

        logger.info(f"PUT /footer/{footer_id} -> updated")
        return jsonify({'success': True, 'footer_id': footer_id})

    except Exception as e:
        logger.error(f'Error updating footer item: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update footer item'}), 500


@navigation_bp.route('/footer/<int:footer_id>', methods=['DELETE'])
def delete_footer_item_endpoint(footer_id: int):
    """Delete a footer item."""
    logger.info(f"DELETE /footer/{footer_id}")
    try:
        if not delete_footer_item(footer_id):
            return jsonify({'error': 'Footer item not found'}), 404

        logger.info(f"DELETE /footer/{footer_id} -> deleted")
        return jsonify({'success': True})

    except Exception as e:
        logger.error(f'Error deleting footer item: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete footer item'}), 500


@navigation_bp.route('/footer/order', methods=['PUT'])
def reorder_footer_items():
    """Reorder footer items."""
    logger.info("PUT /footer/order")
    try:
        data = request.get_json()
        ordered_ids = data.get('order', [])
        logger.debug(f"PUT /footer/order ordered_ids: {ordered_ids}")

        for idx, footer_id in enumerate(ordered_ids):
            item = load_footer_item(footer_id)
            if item:
                item.order = idx
                save_footer_item(item)

        logger.info("PUT /footer/order -> reordered")
        return jsonify({'success': True})

    except Exception as e:
        logger.error(f'Error reordering footer items: {e}', exc_info=True)
        return jsonify({'error': 'Failed to reorder footer items'}), 500
