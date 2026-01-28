"""
Components routes for the Author Mode Server.

Handles CRUD operations for view components.
"""

import json
from flask import Blueprint, request, jsonify

from database import (
    get_all_rows,
    get_component_by_id,
    save_component,
    delete_component,
)

components_bp = Blueprint('components', __name__)


@components_bp.route('/components', methods=['GET'])
def list_components():
    """List all components, optionally filtered by type."""
    try:
        type_filter = request.args.get('type')
        rows = get_all_rows('components', type_filter)
        return jsonify(rows)
    except Exception as e:
        print(f'Error listing components: {e}')
        return jsonify({'error': 'Failed to list components'}), 500


@components_bp.route('/components/<comp_id>', methods=['GET'])
def get_component_endpoint(comp_id):
    """Get a component by ID with its children."""
    try:
        comp = get_component_by_id(comp_id)
        if not comp:
            return jsonify({'error': 'Component not found'}), 404
        return jsonify(comp)
    except Exception as e:
        print(f'Error getting component: {e}')
        return jsonify({'error': 'Failed to get component'}), 500


@components_bp.route('/components', methods=['POST'])
def create_component():
    """Create a new component."""
    try:
        data = request.get_json()

        if 'component_type' not in data and 'type' not in data:
            return jsonify({'error': 'component_type is required'}), 400

        print("~~ Create Component ~~")
        print(json.dumps({'type': data.get('component_type') or data.get('type')}, indent=2))

        comp_id = save_component(data)

        return jsonify({
            'success': True,
            'id': comp_id
        }), 201

    except Exception as e:
        print(f'Error creating component: {e}')
        return jsonify({'error': 'Failed to create component'}), 500


@components_bp.route('/components/<comp_id>', methods=['PUT'])
def update_component_endpoint(comp_id):
    """Update a component by ID."""
    try:
        data = request.get_json()
        data['id'] = comp_id

        print("~~ Update Component ~~")
        print(json.dumps({'id': comp_id, 'type': data.get('component_type') or data.get('type')}, indent=2))

        save_component(data)

        return jsonify({'success': True, 'id': comp_id})

    except Exception as e:
        print(f'Error updating component: {e}')
        return jsonify({'error': 'Failed to update component'}), 500


@components_bp.route('/components/<comp_id>', methods=['DELETE'])
def delete_component_endpoint(comp_id):
    """Delete a component by ID."""
    try:
        print("~~ Delete Component ~~")
        print(json.dumps({'id': comp_id}, indent=2))

        delete_component(comp_id)
        return jsonify({'success': True})
    except Exception as e:
        print(f'Error deleting component: {e}')
        return jsonify({'error': 'Failed to delete component'}), 500
