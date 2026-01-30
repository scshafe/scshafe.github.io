"""
Nodes routes for the Author Mode Server.

Handles CRUD operations for nodes.
Nodes represent the tree structure and position of components within views.
Each node points to a reference, which points to a component.
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    get_all_nodes,
    load_node,
    save_node,
    delete_node,
    move_node,
    resolve_node,
    load_reference,
    create_reference_to_component,
    load_component,
    load_component_by_id,
    save_component,
    COMPONENT_TYPES,
)
from entities import Node, component_from_dict

logger = logging.getLogger(__name__)

nodes_bp = Blueprint('nodes', __name__)


@nodes_bp.route('/nodes', methods=['GET'])
def list_nodes():
    """List all nodes."""
    logger.info("GET /nodes")
    try:
        nodes = get_all_nodes()
        result = [node.to_dict() for node in nodes]
        logger.info(f"GET /nodes -> {len(result)} nodes")
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error listing nodes: {e}', exc_info=True)
        return jsonify({'error': 'Failed to list nodes'}), 500


@nodes_bp.route('/nodes', methods=['POST'])
def create_node():
    """Create a new node.

    Can either:
    1. Provide ref_id to use existing reference
    2. Provide comp_id + component_type to auto-create a reference
    """
    logger.info("POST /nodes")
    try:
        data = request.get_json()
        logger.debug(f"POST /nodes data: {data}")

        ref_id = data.get('ref_id')

        # If no ref_id, create a new reference from component info
        if not ref_id:
            comp_id = data.get('comp_id')
            comp_type = data.get('component_type')

            if not comp_id or not comp_type:
                return jsonify({
                    'error': 'Either ref_id or (comp_id + component_type) required'
                }), 400

            if comp_type not in COMPONENT_TYPES:
                return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

            # Verify component exists
            comp = load_component(comp_type, comp_id)
            if not comp:
                return jsonify({'error': 'Component not found'}), 404

            # Create reference with optional overrides
            overrides = data.get('overrides')
            ref_id = create_reference_to_component(comp_id, overrides)
        else:
            # Verify reference exists
            ref = load_reference(ref_id)
            if not ref:
                return jsonify({'error': 'Reference not found'}), 404

        logger.debug(f"Creating node with ref_id={ref_id}, parent_node_id={data.get('parent_node_id')}")

        node_data = {
            'ref_id': ref_id,
            'parent_node_id': data.get('parent_node_id'),
            'previous_node_id': data.get('previous_node_id'),
            'next_node_id': data.get('next_node_id'),
        }

        node_id = save_node(node_data)
        node = load_node(node_id)

        logger.info(f"POST /nodes -> created node_id={node_id}")
        return jsonify({
            'success': True,
            'node_id': node_id,
            'ref_id': ref_id,
            'node': node.to_dict() if node else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating node: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create node'}), 500


@nodes_bp.route('/nodes/<int:node_id>', methods=['GET'])
def get_node_endpoint(node_id: int):
    """Get a node by ID."""
    logger.info(f"GET /nodes/{node_id}")
    try:
        resolved = request.args.get('resolved', 'false').lower() == 'true'

        if resolved:
            result = resolve_node(node_id)
            if not result:
                return jsonify({'error': 'Node not found'}), 404
            return jsonify(result)
        else:
            node = load_node(node_id)
            if not node:
                return jsonify({'error': 'Node not found'}), 404
            return jsonify(node.to_dict())

    except Exception as e:
        logger.error(f'Error getting node: {e}', exc_info=True)
        return jsonify({'error': 'Failed to get node'}), 500


@nodes_bp.route('/nodes/<int:node_id>', methods=['PUT'])
def update_node_endpoint(node_id: int):
    """Update a node by ID."""
    logger.info(f"PUT /nodes/{node_id}")
    try:
        data = request.get_json()
        logger.debug(f"PUT /nodes/{node_id} data: {data}")

        existing = load_node(node_id)
        if not existing:
            return jsonify({'error': 'Node not found'}), 404

        # Preserve immutable fields
        existing.ref_id = data.get('ref_id', existing.ref_id)
        existing.parent_node_id = data.get('parent_node_id', existing.parent_node_id)
        existing.previous_node_id = data.get('previous_node_id', existing.previous_node_id)
        existing.next_node_id = data.get('next_node_id', existing.next_node_id)

        save_node(existing)

        logger.info(f"PUT /nodes/{node_id} -> updated")
        return jsonify({'success': True, 'node_id': node_id})

    except Exception as e:
        logger.error(f'Error updating node: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update node'}), 500


@nodes_bp.route('/nodes/<int:node_id>', methods=['DELETE'])
def delete_node_endpoint(node_id: int):
    """Delete a node by ID (also deletes its reference)."""
    logger.info(f"DELETE /nodes/{node_id}")
    try:
        if not delete_node(node_id):
            return jsonify({'error': 'Node not found'}), 404

        logger.info(f"DELETE /nodes/{node_id} -> deleted")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error deleting node: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete node'}), 500


@nodes_bp.route('/nodes/<int:node_id>/move', methods=['PUT'])
def move_node_endpoint(node_id: int):
    """Move a node to a new position."""
    logger.info(f"PUT /nodes/{node_id}/move")
    try:
        data = request.get_json()

        new_parent_id = data.get('new_parent_id')
        after_node_id = data.get('after_node_id')

        logger.debug(f"Moving node_id={node_id} to parent={new_parent_id}, after={after_node_id}")

        if not move_node(node_id, new_parent_id, after_node_id):
            return jsonify({'error': 'Node not found'}), 404

        logger.info(f"PUT /nodes/{node_id}/move -> moved")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error moving node: {e}', exc_info=True)
        return jsonify({'error': 'Failed to move node'}), 500


@nodes_bp.route('/nodes/<int:node_id>/resolved', methods=['GET'])
def get_node_resolved_endpoint(node_id: int):
    """Get a node with its fully resolved component tree."""
    logger.info(f"GET /nodes/{node_id}/resolved")
    try:
        resolved = resolve_node(node_id)
        if not resolved:
            return jsonify({'error': 'Node not found'}), 404

        return jsonify(resolved)
    except Exception as e:
        logger.error(f'Error resolving node: {e}', exc_info=True)
        return jsonify({'error': 'Failed to resolve node'}), 500


@nodes_bp.route('/nodes/<int:node_id>/children', methods=['POST'])
def add_child_to_node(node_id: int):
    """Add a new child component to a node.

    Creates component, reference, and child node in one operation.
    Optionally positions the new node after an existing sibling.
    """
    logger.info(f"POST /nodes/{node_id}/children")
    try:
        parent = load_node(node_id)
        if not parent:
            return jsonify({'error': 'Parent node not found'}), 404

        data = request.get_json()
        comp_type = data.get('component_type')
        config = data.get('config', {})
        after_node_id = data.get('after_node_id')

        if not comp_type:
            return jsonify({'error': 'component_type is required'}), 400

        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        logger.debug(f"Adding child to node_id={node_id}, component_type={comp_type}")

        # 1. Create the component
        comp_data = {
            'type': comp_type,
            'config': config,
        }
        comp_id = save_component(comp_data)

        # 2. Create a reference to the component
        ref_id = create_reference_to_component(comp_id)

        # 3. Get reference to parent's component to check if it's a container
        parent_ref = load_reference(parent.ref_id)
        parent_comp = load_component_by_id(parent_ref.comp_id) if parent_ref else None

        # 4. Find the last child if no after_node_id specified
        from entities import Container
        if isinstance(parent_comp, Container):
            if not after_node_id and parent_comp.child_node_id:
                # Walk the sibling chain to find the last child
                current_id = parent_comp.child_node_id
                while current_id:
                    current = load_node(current_id)
                    if not current or not current.next_node_id:
                        after_node_id = current_id
                        break
                    current_id = current.next_node_id

        # Get sibling pointers
        prev_node_id = after_node_id
        next_node_id = None
        if after_node_id:
            after_node = load_node(after_node_id)
            if after_node:
                next_node_id = after_node.next_node_id

        # 5. Create a node pointing to the reference
        node_data = {
            'ref_id': ref_id,
            'parent_node_id': node_id,
            'previous_node_id': prev_node_id,
            'next_node_id': next_node_id,
        }
        child_node_id = save_node(node_data)

        # 6. Update sibling links
        if prev_node_id:
            prev_node = load_node(prev_node_id)
            if prev_node:
                prev_node.next_node_id = child_node_id
                save_node(prev_node)

        if next_node_id:
            next_node = load_node(next_node_id)
            if next_node:
                next_node.previous_node_id = child_node_id
                save_node(next_node)

        # 7. Update parent's child_node_id if this is the first child
        if isinstance(parent_comp, Container) and not parent_comp.child_node_id:
            parent_comp.child_node_id = child_node_id
            save_component(parent_comp)

        # Load final entities
        component = load_component(comp_type, comp_id)
        reference = load_reference(ref_id)
        node = load_node(child_node_id)

        logger.info(f"POST /nodes/{node_id}/children -> created child node_id={child_node_id}")
        return jsonify({
            'success': True,
            'component': component.to_dict() if component else None,
            'reference': reference.to_dict() if reference else None,
            'node': node.to_dict() if node else None,
        }), 201

    except Exception as e:
        logger.error(f'Error adding child to node: {e}', exc_info=True)
        return jsonify({'error': 'Failed to add child to node'}), 500
