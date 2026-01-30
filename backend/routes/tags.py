"""
Tags routes for the Author Mode Server.

Handles CRUD operations for tags.
Tags are used for content categorization and filtering.
"""

import logging
from flask import Blueprint, request, jsonify

from database import (
    get_all_tags,
    load_tag,
    save_tag,
    delete_tag,
)
from entities import Tag

logger = logging.getLogger(__name__)

tags_bp = Blueprint('tags', __name__)


@tags_bp.route('/tags', methods=['GET'])
def list_tags():
    """List all tags."""
    logger.info("GET /tags")
    try:
        tags = get_all_tags()
        result = [tag.to_dict() for tag in tags]
        logger.info(f"GET /tags -> {len(result)} tags")
        return jsonify(result)
    except Exception as e:
        logger.error(f'Error listing tags: {e}', exc_info=True)
        return jsonify({'error': 'Failed to list tags'}), 500


@tags_bp.route('/tags', methods=['POST'])
def create_tag():
    """Create a new tag."""
    logger.info("POST /tags")
    try:
        data = request.get_json()
        logger.debug(f"POST /tags data: {data}")

        # Validate required fields
        if 'label' not in data:
            return jsonify({'error': 'label is required'}), 400

        # Check for duplicate label
        existing_tags = get_all_tags()
        for existing in existing_tags:
            if existing.label.lower() == data['label'].lower():
                return jsonify({'error': f'Tag with label "{data["label"]}" already exists'}), 400

        tag_id = save_tag(data)
        tag = load_tag(tag_id)

        logger.info(f"POST /tags -> created tag_id={tag_id}, label={data['label']}")
        return jsonify({
            'success': True,
            'tag_id': tag_id,
            'tag': tag.to_dict() if tag else None,
        }), 201

    except Exception as e:
        logger.error(f'Error creating tag: {e}', exc_info=True)
        return jsonify({'error': 'Failed to create tag'}), 500


@tags_bp.route('/tags/<int:tag_id>', methods=['GET'])
def get_tag_endpoint(tag_id: int):
    """Get a tag by ID."""
    logger.info(f"GET /tags/{tag_id}")
    try:
        tag = load_tag(tag_id)
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404

        return jsonify(tag.to_dict())
    except Exception as e:
        logger.error(f'Error getting tag: {e}', exc_info=True)
        return jsonify({'error': 'Failed to get tag'}), 500


@tags_bp.route('/tags/<int:tag_id>', methods=['PUT'])
def update_tag_endpoint(tag_id: int):
    """Update a tag by ID."""
    logger.info(f"PUT /tags/{tag_id}")
    try:
        data = request.get_json()
        logger.debug(f"PUT /tags/{tag_id} data: {data}")

        existing = load_tag(tag_id)
        if not existing:
            return jsonify({'error': 'Tag not found'}), 404

        # Check for duplicate label (if changing)
        if 'label' in data and data['label'].lower() != existing.label.lower():
            all_tags = get_all_tags()
            for tag in all_tags:
                if tag.tag_id != tag_id and tag.label.lower() == data['label'].lower():
                    return jsonify({'error': f'Tag with label "{data["label"]}" already exists'}), 400

        # Update fields
        if 'label' in data:
            existing.label = data['label']

        save_tag(existing)

        logger.info(f"PUT /tags/{tag_id} -> updated")
        return jsonify({'success': True, 'tag_id': tag_id})

    except Exception as e:
        logger.error(f'Error updating tag: {e}', exc_info=True)
        return jsonify({'error': 'Failed to update tag'}), 500


@tags_bp.route('/tags/<int:tag_id>', methods=['DELETE'])
def delete_tag_endpoint(tag_id: int):
    """Delete a tag by ID."""
    logger.info(f"DELETE /tags/{tag_id}")
    try:
        tag = load_tag(tag_id)
        if not tag:
            return jsonify({'error': 'Tag not found'}), 404

        if not delete_tag(tag_id):
            return jsonify({'error': 'Failed to delete tag'}), 500

        logger.info(f"DELETE /tags/{tag_id} -> deleted")
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f'Error deleting tag: {e}', exc_info=True)
        return jsonify({'error': 'Failed to delete tag'}), 500


@tags_bp.route('/tags/by-label/<label>', methods=['GET'])
def get_tag_by_label(label: str):
    """Get a tag by its label."""
    logger.info(f"GET /tags/by-label/{label}")
    try:
        tags = get_all_tags()
        for tag in tags:
            if tag.label.lower() == label.lower():
                return jsonify(tag.to_dict())

        return jsonify({'error': 'Tag not found'}), 404
    except Exception as e:
        logger.error(f'Error getting tag by label: {e}', exc_info=True)
        return jsonify({'error': 'Failed to get tag'}), 500
