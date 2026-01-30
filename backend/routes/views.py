"""
Views routes for the Author Mode Server.

Handles CRUD operations for views (pages).
Views are now ViewContainer components in the new architecture.
View -> root_node_id -> Node -> ref_id -> Reference -> comp_id -> Component
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    get_all_views,
    get_all_views_resolved,
    resolve_node,
    load_site_config,
    save_site_config,
    save_component,
    create_reference_to_component,
    save_reference,
    save_node,
    load_node,
    load_component,
    load_component_by_id,
    load_reference,
    delete_node,
    delete_reference,
    delete_component,
    COMPONENT_TYPES,
)
from entities import ViewContainer, InternalLink, generate_id

logger = logging.getLogger(__name__)

views_bp = Blueprint('views', __name__)


# Reserved paths that cannot be used for views
RESERVED_VIEW_PATHS = ['/settings', '/api']


# ============ VIEWS ENDPOINTS ============

@views_bp.route('/views', methods=['GET'])
def list_views():
    """List all views (ViewContainers)."""
    logger.info("GET /views")
    resolved = request.args.get('resolved', 'false').lower() == 'true'

    if resolved:
        views_list = get_all_views_resolved()
    else:
        views_list = get_all_views()
        views_list = [v.to_dict() for v in views_list]

    # Get default home view ID from site config
    site_config = load_site_config()
    home_node_id = None
    if site_config.default_home_link:
        home_node_id = site_config.default_home_link.view_node_id

    # Mark home view with is_home flag
    if home_node_id:
        for view in views_list:
            root_id = view.get('root_node_id') or view.get('node_id')
            view['is_home'] = (root_id == home_node_id)

    logger.info(f"GET /views -> {len(views_list)} views")
    return jsonify({
        'id': 'views',
        'type': 'Views',
        'default_home_node_id': home_node_id,
        'views': views_list
    })


@views_bp.route('/views', methods=['POST'])
def create_view():
    """Create a new view (ViewContainer).

    This creates:
    1. A ViewContainer component
    2. A reference to the ViewContainer
    3. A root node pointing to the reference
    """
    logger.info("POST /views")
    try:
        data = request.get_json()
        logger.debug(f"POST /views data: {data}")

        path = data.get('path', '')
        name = data.get('name', '')
        title = data.get('title', '')

        if not path or not name or not title:
            return jsonify({'error': 'path, name, and title are required'}), 400

        # Normalize and check for reserved paths
        normalized_path = path if path.startswith('/') else '/' + path
        if normalized_path in RESERVED_VIEW_PATHS:
            return jsonify({'error': f'Path "{normalized_path}" is reserved for system use'}), 400

        # 1. Create the ViewContainer component
        comp_data = {
            'type': 'ViewContainer',
            'config': {
                'path': normalized_path,
                'name': name,
                'title': title,
                'browser_title': data.get('browser_title', title),
                'description': data.get('description'),
            }
        }
        comp_id = save_component(comp_data)

        # 2. Create a reference to the ViewContainer
        ref_id = create_reference_to_component(comp_id)

        # 3. Create root node pointing to the reference
        node_data = {
            'ref_id': ref_id,
            'parent_node_id': None,
            'previous_node_id': None,
            'next_node_id': None,
        }
        node_id = save_node(node_data)

        # 4. Update the reference with the node_id
        ref = load_reference(ref_id)
        if ref:
            ref.node_id = node_id
            save_reference(ref)

        # Load the created entities
        view = load_component('ViewContainer', comp_id)

        logger.info(f"POST /views -> created view comp_id={comp_id}, node_id={node_id}")
        return jsonify({
            'success': True,
            'comp_id': comp_id,
            'ref_id': ref_id,
            'node_id': node_id,
            'view': view.to_dict() if view else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating view: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create view'}), 500


@views_bp.route('/views/<int:comp_id>', methods=['GET'])
def get_view_endpoint(comp_id: int):
    """Get a view (ViewContainer) by component ID."""
    logger.info(f"GET /views/{comp_id}")
    resolved = request.args.get('resolved', 'false').lower() == 'true'

    view = load_component('ViewContainer', comp_id)
    if not view:
        return jsonify({'error': 'View not found'}), 404

    if resolved:
        # Find the node that references this ViewContainer and resolve it
        from database import get_all_references
        for ref in get_all_references():
            if ref.comp_id == comp_id and ref.node_id:
                result = resolve_node(ref.node_id)
                if result:
                    return jsonify(result)
        return jsonify({'error': 'Could not resolve view'}), 404

    return jsonify(view.to_dict())


@views_bp.route('/views/<int:comp_id>', methods=['PUT'])
def update_view_endpoint(comp_id: int):
    """Update a view (ViewContainer) by component ID."""
    logger.info(f"PUT /views/{comp_id}")
    try:
        data = request.get_json()
        logger.debug(f"PUT /views/{comp_id} data: {data}")

        existing = load_component('ViewContainer', comp_id)
        if not existing:
            return jsonify({'error': 'View not found'}), 404

        # Validate path if it's being updated
        if 'path' in data:
            path = data['path']
            normalized_path = path if path.startswith('/') else '/' + path
            if normalized_path in RESERVED_VIEW_PATHS:
                return jsonify({'error': f'Path "{normalized_path}" is reserved for system use'}), 400
            existing.path = normalized_path

        # Update other fields
        if 'name' in data:
            existing.name = data['name']
        if 'title' in data:
            existing.title = data['title']
        if 'browser_title' in data:
            existing.browser_title = data['browser_title']
        if 'description' in data:
            existing.description = data['description']
        if 'child_node_id' in data:
            existing.child_node_id = data['child_node_id']

        save_component(existing)

        logger.info(f"PUT /views/{comp_id} -> updated")
        return jsonify({'success': True, 'comp_id': comp_id})
    except Exception as e:
        logger.error(f'Error updating view: {e}', exc_info=True)
        return jsonify({'error': f'Failed to update view: {str(e)}'}), 500


@views_bp.route('/views/<int:comp_id>', methods=['DELETE'])
def delete_view_endpoint(comp_id: int):
    """Delete a view (ViewContainer) and its associated node tree."""
    logger.info(f"DELETE /views/{comp_id}")
    try:
        view = load_component('ViewContainer', comp_id)
        if not view:
            return jsonify({'error': 'View not found'}), 404

        # Find and delete the node tree for this view
        from database import get_all_references
        for ref in get_all_references():
            if ref.comp_id == comp_id:
                # Delete the node (which will cascade delete the reference)
                if ref.node_id:
                    delete_node(ref.node_id)
                else:
                    delete_reference(ref.ref_id)
                break

        # Delete the ViewContainer component
        delete_component('ViewContainer', comp_id)

        logger.info(f"DELETE /views/{comp_id} -> deleted")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error deleting view: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete view'}), 500


@views_bp.route('/views/<int:comp_id>/resolved', methods=['GET'])
def get_view_resolved_endpoint(comp_id: int):
    """Get a view with fully resolved components."""
    logger.info(f"GET /views/{comp_id}/resolved")

    view = load_component('ViewContainer', comp_id)
    if not view:
        return jsonify({'error': 'View not found'}), 404

    # Find the node that references this ViewContainer
    from database import get_all_references
    root_node_id = None
    for ref in get_all_references():
        if ref.comp_id == comp_id and ref.node_id:
            root_node_id = ref.node_id
            result = resolve_node(ref.node_id)
            if result:
                # Transform resolved node to ResolvedView format
                # The resolved node has 'children', but frontend expects 'components'
                children = result.get('children', [])
                resolved_view = {
                    'comp_id': comp_id,
                    'root_node_id': root_node_id,
                    'path': view.path,
                    'name': view.name,
                    'title': view.title,
                    'browser_title': view.browser_title,
                    'description': view.description,
                    'components': children,
                }
                logger.info(f"GET /views/{comp_id}/resolved -> {len(children)} components")
                for i, child in enumerate(children):
                    logger.debug(f"  component[{i}]: type={child.get('type')}, comp_id={child.get('comp_id')}")
                return jsonify(resolved_view)

    return jsonify({'error': 'Could not resolve view'}), 404


@views_bp.route('/views/<int:comp_id>/components', methods=['POST'])
def add_component_to_view(comp_id: int):
    """Add a new component to a view.

    Creates component, reference, and node in one operation.
    The new component becomes a child of the ViewContainer.
    """
    logger.info(f"POST /views/{comp_id}/components")
    try:
        view = load_component('ViewContainer', comp_id)
        if not view:
            return jsonify({'error': 'View not found'}), 404

        data = request.get_json()
        comp_type = data.get('component_type')
        config = data.get('config', {})
        after_node_id = data.get('after_node_id')

        if not comp_type:
            return jsonify({'error': 'component_type is required'}), 400

        if comp_type not in COMPONENT_TYPES:
            return jsonify({'error': f'Invalid component type. Valid types: {COMPONENT_TYPES}'}), 400

        logger.debug(f"Adding component to view comp_id={comp_id}, component_type={comp_type}")

        # 1. Create the component
        new_comp_data = {
            'type': comp_type,
            'config': config,
        }
        new_comp_id = save_component(new_comp_data)

        # 2. Create a reference to the component
        new_ref_id = create_reference_to_component(new_comp_id)

        # 3. Find position for the new node
        # If view has children, find the last one or position after specified node
        prev_node_id = after_node_id
        next_node_id = None

        if view.child_node_id:
            if not after_node_id:
                # Find the last child
                current_id = view.child_node_id
                while current_id:
                    current = load_node(current_id)
                    if not current or not current.next_node_id:
                        prev_node_id = current_id
                        break
                    current_id = current.next_node_id
            else:
                # Position after specified node
                after_node = load_node(after_node_id)
                if after_node:
                    next_node_id = after_node.next_node_id

        # 4. Create a node pointing to the reference
        # Find the view's node to get parent
        from database import get_all_references
        view_node_id = None
        for ref in get_all_references():
            if ref.comp_id == comp_id and ref.node_id:
                view_node_id = ref.node_id
                break

        node_data = {
            'ref_id': new_ref_id,
            'parent_node_id': view_node_id,
            'previous_node_id': prev_node_id,
            'next_node_id': next_node_id,
        }
        new_node_id = save_node(node_data)

        # 5. Update the reference with the node_id
        new_ref = load_reference(new_ref_id)
        if new_ref:
            new_ref.node_id = new_node_id
            save_reference(new_ref)

        # 6. Update sibling links
        if prev_node_id:
            prev_node = load_node(prev_node_id)
            if prev_node:
                prev_node.next_node_id = new_node_id
                save_node(prev_node)

        if next_node_id:
            next_node = load_node(next_node_id)
            if next_node:
                next_node.previous_node_id = new_node_id
                save_node(next_node)

        # 7. Update view's child_node_id if this is the first child
        if not view.child_node_id:
            view.child_node_id = new_node_id
            save_component(view)

        # Load final entities
        component = load_component(comp_type, new_comp_id)
        reference = load_reference(new_ref_id)
        node = load_node(new_node_id)

        logger.info(f"POST /views/{comp_id}/components -> created node_id={new_node_id}")
        return jsonify({
            'success': True,
            'component': component.to_dict() if component else None,
            'reference': reference.to_dict() if reference else None,
            'node': node.to_dict() if node else None,
        }), 201

    except Exception as e:
        logger.error(f'Error adding component to view: {e}', exc_info=True)
        return jsonify({'error': 'Failed to add component to view'}), 500


# ============ VIEWS CONFIG ENDPOINT ============

@views_bp.route('/views/config', methods=['PUT'])
def save_views_config():
    """Save the views configuration.

    Accepts:
    - default_home_node_id: Node ID of the home view
    """
    logger.info("PUT /views/config")
    try:
        data = request.get_json()
        logger.debug(f"PUT /views/config data: {data}")

        # Update site config with default_home_node_id if provided
        if 'default_home_node_id' in data:
            home_node_id = data['default_home_node_id']

            site_config = load_site_config()

            if home_node_id:
                # Find the view name for the label
                node = load_node(home_node_id)
                ref = load_reference(node.ref_id) if node else None
                view = load_component_by_id(ref.comp_id) if ref else None

                site_config.default_home_link = InternalLink(
                    label=view.name if view and hasattr(view, 'name') else 'Home',
                    view_node_id=home_node_id,
                )
            else:
                site_config.default_home_link = None

            save_site_config(site_config)
            logger.info(f"PUT /views/config -> updated default_home_node_id={home_node_id}")

        return jsonify({'success': True})

    except Exception as e:
        logger.error(f'Error saving views config: {e}', exc_info=True)
        return jsonify({'error': 'Failed to save views config'}), 500


