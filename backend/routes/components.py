"""
Components routes for the Author Mode Server.

Handles CRUD operations for components.
Components are the content/config layer that references point to.
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    get_all_components,
    load_component,
    load_component_by_id,
    save_component,
    delete_component,
    get_component_usages,
    COMPONENT_TYPES,
)

logger = logging.getLogger(__name__)

components_bp = Blueprint('components', __name__)


@components_bp.route('/components', methods=['GET'])
def list_components():
    """List all components, optionally filtered by type."""
    logger.info("GET /components")
    try:
        type_filter = request.args.get('type')
        if type_filter and type_filter not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        components = get_all_components(type_filter)
        result = [comp.to_dict() for comp in components]
        logger.info(f"GET /components -> {len(result)} components")
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error listing components: {e}', exc_info=True)
        return jsonify({'error': 'Failed to list components'}), 500


@components_bp.route('/components/<comp_type>', methods=['GET'])
def list_components_by_type(comp_type: str):
    """List all components of a specific type."""
    logger.info(f"GET /components/{comp_type}")
    try:
        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        components = get_all_components(comp_type)
        result = [comp.to_dict() for comp in components]
        logger.info(f"GET /components/{comp_type} -> {len(result)} components")
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error listing components: {e}', exc_info=True)
        return jsonify({'error': 'Failed to list components'}), 500


@components_bp.route('/components/<comp_type>', methods=['POST'])
def create_component(comp_type: str):
    """Create a new component of a specific type."""
    logger.info(f"POST /components/{comp_type}")
    try:
        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        data = request.get_json()
        data['type'] = comp_type
        logger.debug(f"POST /components/{comp_type} data: {data}")

        comp_id = save_component(data)
        comp = load_component(comp_type, comp_id)

        logger.info(f"POST /components/{comp_type} -> created comp_id={comp_id}")
        return jsonify({
            'success': True,
            'comp_id': comp_id,
            'component': comp.to_dict() if comp else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating component: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create component'}), 500


@components_bp.route('/components/<comp_type>/<int:comp_id>', methods=['GET'])
def get_component_endpoint(comp_type: str, comp_id: int):
    """Get a component by type and ID."""
    logger.info(f"GET /components/{comp_type}/{comp_id}")
    try:
        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        comp = load_component(comp_type, comp_id)
        if not comp:
            return jsonify({'error': 'Component not found'}), 404

        return jsonify(comp.to_dict())
    except Exception as e:
        logger.error(f'Error getting component: {e}', exc_info=True)
        return jsonify({'error': 'Failed to get component'}), 500


@components_bp.route('/components/<comp_type>/<int:comp_id>', methods=['PUT'])
def update_component_endpoint(comp_type: str, comp_id: int):
    """Update a component by type and ID."""
    logger.info(f"PUT /components/{comp_type}/{comp_id}")
    try:
        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        data = request.get_json()
        logger.debug(f"PUT /components/{comp_type}/{comp_id} data: {data}")

        # Preserve existing fields not in request
        existing = load_component(comp_type, comp_id)
        if not existing:
            return jsonify({'error': 'Component not found'}), 404

        # Update config if provided
        if 'config' in data:
            # Set each config field on the component
            config = data['config']
            for key, value in config.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)

        save_component(existing)

        logger.info(f"PUT /components/{comp_type}/{comp_id} -> updated")
        return jsonify({'success': True, 'comp_id': comp_id})

    except Exception as e:
        logger.error(f'Error updating component: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update component'}), 500


@components_bp.route('/components/<comp_type>/<int:comp_id>', methods=['DELETE'])
def delete_component_endpoint(comp_type: str, comp_id: int):
    """Delete a component by type and ID."""
    logger.info(f"DELETE /components/{comp_type}/{comp_id}")
    try:
        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        # Check if component has references
        comp = load_component(comp_type, comp_id)
        if not comp:
            return jsonify({'error': 'Component not found'}), 404

        if comp.reference_count > 0:
            return jsonify({
                'error': 'Cannot delete component with active references',
                'reference_count': comp.reference_count
            }), 400

        if not delete_component(comp_type, comp_id):
            return jsonify({'error': 'Component not found'}), 404

        logger.info(f"DELETE /components/{comp_type}/{comp_id} -> deleted")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error deleting component: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete component'}), 500


@components_bp.route('/components/<comp_type>/<int:comp_id>/usages', methods=['GET'])
def get_component_usages_endpoint(comp_type: str, comp_id: int):
    """Get all usages (references, nodes) of a component."""
    logger.info(f"GET /components/{comp_type}/{comp_id}/usages")
    try:
        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        comp = load_component(comp_type, comp_id)
        if not comp:
            return jsonify({'error': 'Component not found'}), 404

        usages = get_component_usages(comp_id)

        return jsonify({
            'comp_id': comp_id,
            'component_type': comp_type,
            'reference_count': comp.reference_count,
            'usages': usages
        })
    except Exception as e:
        logger.error(f'Error getting component usages: {e}', exc_info=True)
        return jsonify({'error': 'Failed to get component usages'}), 500


# ============ LEGACY ENDPOINTS (by ID only) ============

@components_bp.route('/component/<int:comp_id>', methods=['GET'])
def get_component_by_id_endpoint(comp_id: int):
    """Get a component by ID (searches all types)."""
    logger.info(f"GET /component/{comp_id}")
    try:
        comp = load_component_by_id(comp_id)
        if not comp:
            return jsonify({'error': 'Component not found'}), 404

        return jsonify(comp.to_dict())
    except Exception as e:
        logger.error(f'Error getting component: {e}', exc_info=True)
        return jsonify({'error': 'Failed to get component'}), 500
