"""
References routes for the Author Mode Server.

Handles CRUD operations for references.
References are the indirection layer between nodes and components,
allowing shared components with per-location config overrides.
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    get_all_references,
    load_reference,
    save_reference,
    delete_reference,
    create_reference_to_component,
    load_component,
    load_component_by_id,
    COMPONENT_TYPES,
)
from entities import Reference

logger = logging.getLogger(__name__)

references_bp = Blueprint('references', __name__)


@references_bp.route('/references', methods=['GET'])
def list_references():
    """List all references."""
    logger.info("GET /references")
    try:
        references = get_all_references()
        result = [ref.to_dict() for ref in references]
        logger.info(f"GET /references -> {len(result)} references")
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error listing references: {e}', exc_info=True)
        return jsonify({'error': 'Failed to list references'}), 500


@references_bp.route('/references', methods=['POST'])
def create_reference():
    """Create a new reference to a component."""
    logger.info("POST /references")
    try:
        data = request.get_json()
        logger.debug(f"POST /references data: {data}")

        comp_id = data.get('comp_id')
        comp_type = data.get('component_type')

        if not comp_id:
            return jsonify({'error': 'comp_id is required'}), 400

        # Verify component exists
        if comp_type:
            if comp_type not in COMPONENT_TYPES:
                return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400
            comp = load_component(comp_type, comp_id)
        else:
            comp = load_component_by_id(comp_id)

        if not comp:
            return jsonify({'error': 'Component not found'}), 404

        overrides = data.get('overrides')
        node_id = data.get('node_id', 0)
        ref_id = create_reference_to_component(comp_id, overrides, node_id)

        ref = load_reference(ref_id)

        logger.info(f"POST /references -> created ref_id={ref_id}")
        return jsonify({
            'success': True,
            'ref_id': ref_id,
            'reference': ref.to_dict() if ref else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating reference: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create reference'}), 500


@references_bp.route('/references/<int:ref_id>', methods=['GET'])
def get_reference_endpoint(ref_id: int):
    """Get a reference by ID."""
    logger.info(f"GET /references/{ref_id}")
    try:
        ref = load_reference(ref_id)
        if not ref:
            return jsonify({'error': 'Reference not found'}), 404

        return jsonify(ref.to_dict())
    except Exception as e:
        logger.error(f'Error getting reference: {e}', exc_info=True)
        return jsonify({'error': 'Failed to get reference'}), 500


@references_bp.route('/references/<int:ref_id>', methods=['PUT'])
def update_reference_endpoint(ref_id: int):
    """Update a reference by ID (typically to modify overrides)."""
    logger.info(f"PUT /references/{ref_id}")
    try:
        data = request.get_json()
        logger.debug(f"PUT /references/{ref_id} data: {data}")

        existing = load_reference(ref_id)
        if not existing:
            return jsonify({'error': 'Reference not found'}), 404

        # Only allow updating overrides and node_id
        if 'overrides' in data:
            existing.overrides = data['overrides']
        if 'node_id' in data:
            existing.node_id = data['node_id']

        save_reference(existing)

        logger.info(f"PUT /references/{ref_id} -> updated")
        return jsonify({'success': True, 'ref_id': ref_id})

    except Exception as e:
        logger.error(f'Error updating reference: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update reference'}), 500


@references_bp.route('/references/<int:ref_id>', methods=['DELETE'])
def delete_reference_endpoint(ref_id: int):
    """Delete a reference by ID (decrements component ref count)."""
    logger.info(f"DELETE /references/{ref_id}")
    try:
        if not delete_reference(ref_id):
            return jsonify({'error': 'Reference not found'}), 404

        logger.info(f"DELETE /references/{ref_id} -> deleted")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error deleting reference: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete reference'}), 500


@references_bp.route('/references/<int:ref_id>/resolved', methods=['GET'])
def get_reference_resolved_endpoint(ref_id: int):
    """Get a reference with its resolved component (config merged with overrides)."""
    logger.info(f"GET /references/{ref_id}/resolved")
    try:
        ref = load_reference(ref_id)
        if not ref:
            return jsonify({'error': 'Reference not found'}), 404

        comp = load_component_by_id(ref.comp_id)
        if not comp:
            return jsonify({'error': 'Referenced component not found'}), 404

        # Merge config with overrides
        base_config = comp.get_config()
        final_config = ref.merge_config(base_config)

        return jsonify({
            'ref_id': ref.ref_id,
            'comp_id': comp.comp_id,
            'type': comp.type,
            'config': final_config,
            'overrides': ref.overrides or {},
        })
    except Exception as e:
        logger.error(f'Error resolving reference: {e}', exc_info=True)
        return jsonify({'error': 'Failed to resolve reference'}), 500
