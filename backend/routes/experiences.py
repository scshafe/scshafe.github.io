"""
Experiences routes for the Author Mode Server.

Handles CRUD operations for work experiences.
"""

import re
import json
from flask import Blueprint, request, jsonify
from pathlib import Path

from database import (
    get_all_experiences,
    get_experience_by_id,
    save_experience,
    delete_experience as db_delete_experience,
    update_experience_order,
    generate_experience_id,
)

experiences_bp = Blueprint('experiences', __name__)

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
EXPERIENCES_DIR = CONTENT_DIR / 'experiences'


# ============ LEGACY ENDPOINTS ============

@experiences_bp.route('/experiences', methods=['GET'])
def list_experiences():
    """List all experiences with their metadata."""
    exp_list = get_all_experiences()

    # Return in a normalized format for frontend
    result = {
        'id': 'experiences',
        'type': 'Experiences',
        'order': [e['id'] for e in exp_list],
        'items': {e['id']: e for e in exp_list}
    }

    return jsonify(result)


@experiences_bp.route('/experiences/order', methods=['PUT'])
def update_exp_order():
    """Update the order of experiences."""
    try:
        data = request.get_json()
        order = data.get('order')

        if not isinstance(order, list):
            return jsonify({'error': 'Order must be an array'}), 400

        print("~~ Save Experience Order ~~")
        print(json.dumps({'order': order}, indent=2))

        update_experience_order(order)

        return jsonify({'success': True})

    except Exception as e:
        print(f'Error saving order: {e}')
        return jsonify({'error': 'Failed to save order'}), 500


# ============ NEW RESTFUL ENDPOINTS ============

@experiences_bp.route('/experience', methods=['GET'])
def list_experiences_new():
    """List all experiences (new RESTful endpoint)."""
    exp_list = get_all_experiences()
    return jsonify(exp_list)


@experiences_bp.route('/experience', methods=['POST'])
def create_experience():
    """Create a new experience."""
    try:
        data = request.get_json()

        title = data.get('title', '')
        if not title:
            return jsonify({'error': 'Title is required'}), 400

        # Generate slug from title
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

        # Generate new ID
        exp_id = generate_experience_id()

        print("~~ Create Experience ~~")
        print(json.dumps({'id': exp_id, 'slug': slug, 'title': title, 'company': data.get('company')}, indent=2))

        # Create experience file
        EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)
        file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
        content = data.get('content', '')
        file_path.write_text(content)

        # Save to database
        saved_id = save_experience({
            'id': exp_id,
            'title': title,
            'company': data.get('company'),
            'startDate': data.get('startDate'),
            'endDate': data.get('endDate'),
            'image': data.get('image'),
            'backgroundColor': data.get('backgroundColor'),
            'textColor': data.get('textColor'),
            'accentColor': data.get('accentColor')
        })

        return jsonify({
            'success': True,
            'id': saved_id,
            'slug': slug
        }), 201

    except Exception as e:
        print(f'Error creating experience: {e}')
        return jsonify({'error': 'Failed to create experience'}), 500


@experiences_bp.route('/experience/<exp_id>', methods=['GET'])
def get_experience_endpoint(exp_id):
    """Get an experience by ID."""
    exp = get_experience_by_id(exp_id)
    if not exp:
        return jsonify({'error': 'Experience not found'}), 404

    # Get experience content from file (derive slug from title)
    title = exp.get('title', '')
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
    content = file_path.read_text() if file_path.exists() else ''

    return jsonify({
        **exp,
        'content': content
    })


@experiences_bp.route('/experience/<exp_id>', methods=['PUT'])
def update_experience_endpoint(exp_id):
    """Update an experience by ID."""
    try:
        data = request.get_json()

        # Get existing experience
        existing = get_experience_by_id(exp_id)
        if not existing:
            return jsonify({'error': 'Experience not found'}), 404

        # Derive slug from title for file operations
        title = data.get('title', existing.get('title', ''))
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

        print("~~ Update Experience ~~")
        print(json.dumps({'id': exp_id, 'slug': slug, 'title': title, 'company': data.get('company', existing.get('company'))}, indent=2))

        # Update content file if provided
        if 'content' in data:
            EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)
            file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
            file_path.write_text(data['content'])

        # Update metadata in database
        save_experience({
            'id': exp_id,
            'title': title,
            'company': data.get('company', existing.get('company')),
            'startDate': data.get('startDate', existing.get('startDate')),
            'endDate': data.get('endDate', existing.get('endDate')),
            'image': data.get('image', existing.get('image')),
            'backgroundColor': data.get('backgroundColor', existing.get('backgroundColor')),
            'textColor': data.get('textColor', existing.get('textColor')),
            'accentColor': data.get('accentColor', existing.get('accentColor')),
            'sort_order': existing.get('sort_order', 0)
        })

        return jsonify({'success': True, 'id': exp_id})

    except Exception as e:
        print(f'Error updating experience: {e}')
        return jsonify({'error': 'Failed to update experience'}), 500


@experiences_bp.route('/experience/<exp_id>', methods=['DELETE'])
def delete_experience_endpoint(exp_id):
    """Delete an experience by ID."""
    try:
        existing = get_experience_by_id(exp_id)
        if not existing:
            return jsonify({'error': 'Experience not found'}), 404

        # Delete content file
        title = existing.get('title', '')
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

        print("~~ Delete Experience ~~")
        print(json.dumps({'id': exp_id, 'slug': slug, 'title': title}, indent=2))

        file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
        if file_path.exists():
            file_path.unlink()

        # Delete from database
        db_delete_experience(exp_id)

        return jsonify({'success': True})

    except Exception as e:
        print(f'Error deleting experience: {e}')
        return jsonify({'error': 'Failed to delete experience'}), 500


@experiences_bp.route('/experience/order', methods=['PUT'])
def update_experience_order_endpoint():
    """Update the order of experiences (new endpoint)."""
    try:
        data = request.get_json()
        order = data.get('order')

        if not isinstance(order, list):
            return jsonify({'error': 'Order must be an array'}), 400

        print("~~ Update Experience Order ~~")
        print(json.dumps({'order': order}, indent=2))

        update_experience_order(order)

        return jsonify({'success': True})

    except Exception as e:
        print(f'Error saving order: {e}')
        return jsonify({'error': 'Failed to save order'}), 500
