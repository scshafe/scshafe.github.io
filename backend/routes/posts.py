"""
Posts routes for the Author Mode Server.

Handles CRUD operations for blog posts.
"""

import re
import json
from flask import Blueprint, request, jsonify
from pathlib import Path

from database import (
    get_all_posts,
    get_post_by_slug,
    get_post_by_id,
    save_post,
    delete_post as db_delete_post,
    generate_post_id,
)

posts_bp = Blueprint('posts', __name__)

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
POSTS_DIR = CONTENT_DIR / 'posts'


# ============ LEGACY ENDPOINTS ============

@posts_bp.route('/posts', methods=['GET'])
def list_posts():
    """List all posts with their metadata."""
    posts_list = get_all_posts()

    # Return in expected format
    return jsonify({
        'id': 'posts',
        'type': 'Posts',
        'items': {p['id']: p for p in posts_list}
    })


@posts_bp.route('/tags', methods=['GET'])
def list_tags():
    """Get all unique tags from all posts for autocomplete."""
    posts = get_all_posts()

    # Collect all unique tags, preserving original casing from first occurrence
    tag_map = {}  # lowercase -> original casing
    for post in posts:
        categories = post.get('categories', [])
        # Handle both string and array formats
        if isinstance(categories, str):
            cats = [c.strip() for c in re.split(r'[,\s]+', categories) if c.strip()]
        else:
            cats = categories if isinstance(categories, list) else []

        for tag in cats:
            lower = tag.lower()
            if lower not in tag_map:
                tag_map[lower] = tag

    # Sort tags alphabetically
    tags = sorted(tag_map.values(), key=lambda t: t.lower())

    return jsonify({'tags': tags})


# ============ NEW RESTFUL ENDPOINTS ============

@posts_bp.route('/post', methods=['GET'])
def list_posts_new():
    """List all posts (new RESTful endpoint)."""
    posts_list = get_all_posts()
    return jsonify(posts_list)


@posts_bp.route('/post', methods=['POST'])
def create_post():
    """Create a new post."""
    try:
        data = request.get_json()

        title = data.get('title', '')
        if not title:
            return jsonify({'error': 'Title is required'}), 400

        # Generate slug from title
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

        # Generate new ID
        post_id = generate_post_id()

        print("~~ Create Post ~~")
        print(json.dumps({'id': post_id, 'slug': slug, 'title': title}, indent=2))

        # Create post file
        POSTS_DIR.mkdir(parents=True, exist_ok=True)
        file_path = POSTS_DIR / f'{slug}-post.md'
        content = data.get('content', '')
        file_path.write_text(content)

        # Save to database
        saved_id = save_post({
            'id': post_id,
            'slug': slug,
            'title': title,
            'date': data.get('date'),
            'categories': data.get('categories', []),
            'layout': data.get('layout', 'post'),
            'toc': data.get('toc', False),
            'is_series': data.get('is_series', False),
            'series_title': data.get('series_title')
        })

        return jsonify({
            'success': True,
            'id': saved_id,
            'slug': slug
        }), 201

    except Exception as e:
        print(f'Error creating post: {e}')
        return jsonify({'error': 'Failed to create post'}), 500


@posts_bp.route('/post/<post_id>', methods=['GET'])
def get_post_endpoint(post_id):
    """Get a post by ID."""
    post = get_post_by_id(post_id)
    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Get post content from file
    slug = post.get('slug')
    file_path = POSTS_DIR / f'{slug}-post.md'
    content = file_path.read_text() if file_path.exists() else ''

    return jsonify({
        **post,
        'content': content
    })


@posts_bp.route('/post/<post_id>', methods=['PUT'])
def update_post_endpoint(post_id):
    """Update a post by ID."""
    try:
        data = request.get_json()

        # Get existing post to find slug
        existing = get_post_by_id(post_id)
        if not existing:
            return jsonify({'error': 'Post not found'}), 404

        slug = existing.get('slug')

        print("~~ Update Post ~~")
        print(json.dumps({'id': post_id, 'slug': slug, 'title': data.get('title', existing.get('title'))}, indent=2))

        # Update content file if provided
        if 'content' in data:
            file_path = POSTS_DIR / f'{slug}-post.md'
            file_path.write_text(data['content'])

        # Update metadata in database
        save_post({
            'id': post_id,
            'slug': slug,
            'title': data.get('title', existing.get('title')),
            'date': data.get('date', existing.get('date')),
            'categories': data.get('categories', existing.get('categories', [])),
            'layout': data.get('layout', existing.get('layout', 'post')),
            'toc': data.get('toc', existing.get('toc', False)),
            'is_series': data.get('is_series', existing.get('is_series', False)),
            'series_title': data.get('series_title', existing.get('series_title'))
        })

        return jsonify({'success': True, 'id': post_id})

    except Exception as e:
        print(f'Error updating post: {e}')
        return jsonify({'error': 'Failed to update post'}), 500


@posts_bp.route('/post/<post_id>', methods=['DELETE'])
def delete_post_endpoint(post_id):
    """Delete a post by ID."""
    try:
        existing = get_post_by_id(post_id)
        if not existing:
            return jsonify({'error': 'Post not found'}), 404

        # Delete content file
        slug = existing.get('slug')

        print("~~ Delete Post ~~")
        print(json.dumps({'id': post_id, 'slug': slug}, indent=2))

        file_path = POSTS_DIR / f'{slug}-post.md'
        if file_path.exists():
            file_path.unlink()

        # Delete from database
        db_delete_post(post_id)

        return jsonify({'success': True})

    except Exception as e:
        print(f'Error deleting post: {e}')
        return jsonify({'error': 'Failed to delete post'}), 500
