"""
Views routes for the Author Mode Server.

Handles CRUD operations for views (pages).
"""

import json
from flask import Blueprint, request, jsonify

from database import (
    get_all_views,
    get_view_by_id,
    save_view,
    delete_view as db_delete_view,
    update_view_content,
    get_default_home_view_id,
    set_default_home_view_id,
    set_setting,
)

views_bp = Blueprint('views', __name__)


# ============ LEGACY ENDPOINTS ============

@views_bp.route('/views', methods=['GET'])
def get_views_endpoint():
    """Get the views configuration."""
    views_list = get_all_views()
    default_home_id = get_default_home_view_id()

    return jsonify({
        'id': 'views',
        'type': 'Views',
        'defaultHomeViewId': default_home_id,
        'views': views_list
    })


@views_bp.route('/views', methods=['PUT'])
def update_views_endpoint():
    """Update the entire views configuration."""
    try:
        data = request.get_json()

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        views_list = data.get('views') or data.get('items')
        if not isinstance(views_list, list):
            return jsonify({'error': 'Missing or invalid views array'}), 400

        print("~~ Save Views Configuration ~~")
        print(json.dumps({'viewCount': len(views_list), 'defaultHomeViewId': data.get('defaultHomeViewId')}, indent=2))

        # Save each view
        for view_data in views_list:
            save_view(view_data)

        # Update default home view ID
        if 'defaultHomeViewId' in data:
            set_default_home_view_id(data['defaultHomeViewId'])

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving views: {e}')
        return jsonify({'error': 'Failed to save views'}), 500


@views_bp.route('/views/<view_id>', methods=['PUT'])
def update_view_endpoint(view_id):
    """Update a single view."""
    try:
        data = request.get_json()

        # Ensure the view has proper type and parentId
        data['type'] = 'View'
        data['parentId'] = 'views'
        data['id'] = view_id

        print("~~ Save View ~~")
        print(json.dumps({'id': view_id, 'path': data.get('path'), 'name': data.get('name')}, indent=2))

        save_view(data)

        return jsonify({'success': True})
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f'Error updating view: {e}')
        return jsonify({'error': f'Failed to update view: {str(e)}'}), 500


@views_bp.route('/views/<view_id>', methods=['DELETE'])
def delete_view_endpoint(view_id):
    """Delete a view."""
    try:
        print("~~ Delete View ~~")
        print(json.dumps({'id': view_id}, indent=2))

        db_delete_view(view_id)

        # Update defaultHomeViewId if needed
        default_home = get_default_home_view_id()
        if default_home == view_id:
            views = get_all_views()
            if views:
                set_default_home_view_id(views[0]['id'])
            else:
                set_setting('defaultHomeViewId', '')

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error deleting view: {e}')
        return jsonify({'error': 'Failed to delete view'}), 500


@views_bp.route('/views/<view_id>/content', methods=['PUT'])
def update_view_content_endpoint(view_id):
    """Update a view's content field."""
    try:
        data = request.get_json()
        content_key = data.get('contentKey')
        content = data.get('content', '')

        if not content_key:
            return jsonify({'error': 'contentKey is required'}), 400

        print("~~ Save View Content ~~")
        print(json.dumps({'viewId': view_id, 'contentKey': content_key, 'contentLength': len(content)}, indent=2))

        success = update_view_content(view_id, content_key, content)

        if not success:
            return jsonify({'error': 'View not found'}), 404

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error updating view content: {e}')
        return jsonify({'error': 'Failed to update view content'}), 500


# ============ NEW RESTFUL ENDPOINTS ============

@views_bp.route('/view', methods=['GET'])
def list_views_new():
    """List all views (new RESTful endpoint)."""
    views_list = get_all_views()
    return jsonify(views_list)


@views_bp.route('/view', methods=['POST'])
def create_view():
    """Create a new view."""
    try:
        data = request.get_json()

        path = data.get('path', '')
        name = data.get('name', '')
        title = data.get('title', '')

        if not path or not name or not title:
            return jsonify({'error': 'path, name, and title are required'}), 400

        print("~~ Create View ~~")
        print(json.dumps({'path': path, 'name': name, 'title': title}, indent=2))

        # Save view (ID is generated in save_view if not provided)
        view_id = save_view({
            'path': path,
            'name': name,
            'title': title,
            'browserTitle': data.get('browserTitle', title),
            'description': data.get('description'),
            'isHome': data.get('isHome', False),
            'parentViewId': data.get('parentViewId'),
            'content': data.get('content', {}),
            'components': data.get('components', [])
        })

        return jsonify({
            'success': True,
            'id': view_id
        }), 201

    except Exception as e:
        print(f'Error creating view: {e}')
        return jsonify({'error': 'Failed to create view'}), 500


@views_bp.route('/view/<view_id>', methods=['GET'])
def get_view_endpoint(view_id):
    """Get a view by ID."""
    view = get_view_by_id(view_id)
    if not view:
        return jsonify({'error': 'View not found'}), 404

    return jsonify(view)


@views_bp.route('/view/<view_id>', methods=['PUT'])
def update_view_new_endpoint(view_id):
    """Update a view by ID (new RESTful endpoint)."""
    try:
        data = request.get_json()

        # Ensure the view has proper type and parentId
        data['type'] = 'View'
        data['parentId'] = 'views'
        data['id'] = view_id

        print("~~ Update View ~~")
        print(json.dumps({'id': view_id, 'path': data.get('path'), 'name': data.get('name')}, indent=2))

        save_view(data)

        return jsonify({'success': True, 'id': view_id})
    except Exception as e:
        print(f'Error updating view: {e}')
        return jsonify({'error': 'Failed to update view'}), 500


@views_bp.route('/view/<view_id>', methods=['DELETE'])
def delete_view_new_endpoint(view_id):
    """Delete a view by ID (new RESTful endpoint)."""
    try:
        print("~~ Delete View (REST) ~~")
        print(json.dumps({'id': view_id}, indent=2))

        db_delete_view(view_id)

        # Update defaultHomeViewId if needed
        default_home = get_default_home_view_id()
        if default_home == view_id:
            views = get_all_views()
            if views:
                set_default_home_view_id(views[0]['id'])
            else:
                set_setting('defaultHomeViewId', '')

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error deleting view: {e}')
        return jsonify({'error': 'Failed to delete view'}), 500


@views_bp.route('/view/<view_id>/content', methods=['PUT'])
def update_view_content_new_endpoint(view_id):
    """Update a view's content field (new RESTful endpoint)."""
    try:
        data = request.get_json()
        content_key = data.get('contentKey')
        content = data.get('content', '')

        if not content_key:
            return jsonify({'error': 'contentKey is required'}), 400

        print("~~ Update View Content (REST) ~~")
        print(json.dumps({'viewId': view_id, 'contentKey': content_key, 'contentLength': len(content)}, indent=2))

        success = update_view_content(view_id, content_key, content)

        if not success:
            return jsonify({'error': 'View not found'}), 404

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error updating view content: {e}')
        return jsonify({'error': 'Failed to update view content'}), 500
