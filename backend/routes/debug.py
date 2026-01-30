"""
Debug routes for the Author Mode Server.

Provides raw data access for development debugging.
New architecture: JSON file-based storage.
"""

from flask import Blueprint, request, jsonify

from database import (
    get_all_views,
    get_all_components,
    get_all_references,
    get_all_nodes,
    get_all_experiences,
    load_view,
    load_component,
    load_reference,
    load_node,
    load_settings,
    COMPONENT_TYPES,
)

debug_bp = Blueprint('debug', __name__)

# Allowed entity types
ENTITY_TYPES = ['views', 'components', 'references', 'nodes', 'experiences', 'settings']


@debug_bp.route('/raw/<entity_type>/<entity_id>', methods=['GET'])
def get_raw_entity(entity_type, entity_id):
    """
    Get a raw entity as JSON (dev mode debug endpoint).

    Examples:
        GET /raw/views/1000001
        GET /raw/components/Title/2000001
        GET /raw/references/3000001
        GET /raw/nodes/4000001
    """
    try:
        if entity_type not in ENTITY_TYPES:
            return jsonify({'error': f"Entity type '{entity_type}' is not allowed"}), 400

        entity = None

        if entity_type == 'views':
            entity = load_view(int(entity_id))
        elif entity_type == 'components':
            # Components need a type, get from query or try all types
            comp_type = request.args.get('type')
            if comp_type:
                entity = load_component(comp_type, int(entity_id))
            else:
                # Try all component types
                for ct in COMPONENT_TYPES:
                    entity = load_component(ct, int(entity_id))
                    if entity:
                        break
        elif entity_type == 'references':
            entity = load_reference(int(entity_id))
        elif entity_type == 'nodes':
            entity = load_node(int(entity_id))
        elif entity_type == 'settings':
            entity = load_settings()

        if not entity:
            return jsonify({'error': f"Entity '{entity_id}' not found in '{entity_type}'"}), 404

        return jsonify(entity)

    except Exception as e:
        print(f'Error getting raw entity: {e}')
        return jsonify({'error': 'Failed to get raw entity'}), 500


@debug_bp.route('/raw/<entity_type>', methods=['GET'])
def get_raw_entities(entity_type):
    """
    Get all entities of a type as JSON (dev mode debug endpoint).

    Optional query params:
        ?type=<type> - Filter components by type (Title, MarkdownEditor, etc.)

    Examples:
        GET /raw/views
        GET /raw/components
        GET /raw/components?type=Title
        GET /raw/references
        GET /raw/nodes
    """
    try:
        if entity_type not in ENTITY_TYPES:
            return jsonify({'error': f"Entity type '{entity_type}' is not allowed"}), 400

        entities = []
        type_filter = request.args.get('type')

        if entity_type == 'views':
            entities = get_all_views()
        elif entity_type == 'components':
            entities = get_all_components(type_filter)
        elif entity_type == 'references':
            entities = get_all_references()
        elif entity_type == 'nodes':
            entities = get_all_nodes()
        elif entity_type == 'experiences':
            entities = get_all_experiences()
        elif entity_type == 'settings':
            entities = [load_settings()]

        return jsonify({
            'entityType': entity_type,
            'count': len(entities),
            'entities': entities
        })

    except Exception as e:
        print(f'Error getting raw entities: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get raw entities'}), 500
