#!/usr/bin/env python3
"""
Author Mode Server

Flask server for editing blog content during local development.
Provides API endpoints for reading and writing posts, about page, and experiences.

Content structure:
- content/blog.db - SQLite database for all metadata
- content/posts/{slug}-post.md - Post content (no frontmatter)
- content/experiences/{slug}-experience.md - Experience content (no frontmatter)

Note: metadata.json is NOT written during development.
It is only generated at build time via `npm run export:metadata`.
"""

import re
import base64
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import database functions
from database import (
    init_database,
    get_themes,
    save_themes,
    get_navigation,
    save_navigation,
    get_all_posts,
    get_post_by_slug,
    save_post,
    get_all_experiences,
    get_experience_by_id,
    save_experience,
    update_experience_order,
    get_all_views,
    save_view,
    delete_view as db_delete_view,
    update_view_content,
    get_default_home_view_id,
    set_default_home_view_id,
    get_setting,
    set_setting,
)

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
POSTS_DIR = CONTENT_DIR / 'posts'
EXPERIENCES_DIR = CONTENT_DIR / 'experiences'
IMAGES_DIR = ROOT_DIR / 'public' / 'images' / 'experiences'
PDFS_DIR = ROOT_DIR / 'public' / 'pdfs'

# Initialize database
init_database()


@app.route('/metadata', methods=['GET'])
def get_metadata():
    """Get the full metadata (reconstructed from database)."""
    themes = get_themes() or {
        'id': 'themes',
        'type': 'Themes',
        'activeThemeId': 'midnight-blue',
        'colorSchemePreference': 'system',
        'customThemes': []
    }

    navigation = get_navigation()

    # Build posts structure
    posts_list = get_all_posts()
    posts_items = {p['id']: p for p in posts_list}

    # Build experiences structure
    exp_list = get_all_experiences()
    exp_items = {e['id']: e for e in exp_list}
    exp_order = [e['id'] for e in exp_list]

    # Build views structure
    views_list = get_all_views()
    default_home_id = get_default_home_view_id()

    return jsonify({
        'themes': themes,
        'navigation': navigation,
        'posts': {
            'id': 'posts',
            'type': 'Posts',
            'items': posts_items
        },
        'experiences': {
            'id': 'experiences',
            'type': 'Experiences',
            'order': exp_order,
            'items': exp_items
        },
        'views': {
            'id': 'views',
            'type': 'Views',
            'defaultHomeViewId': default_home_id,
            'items': views_list
        }
    })


@app.route('/metadata', methods=['PUT'])
def update_metadata():
    """Update the full metadata (writes to database)."""
    try:
        data = request.get_json()

        # Save themes
        if 'themes' in data:
            save_themes(data['themes'])

        # Save navigation
        if 'navigation' in data:
            save_navigation(data['navigation'])

        # Save posts
        if 'posts' in data:
            posts_config = data['posts']
            items = posts_config.get('items', {})
            for post_id, post_data in items.items():
                save_post(post_data)

        # Save experiences
        if 'experiences' in data:
            exp_config = data['experiences']
            items = exp_config.get('items', {})
            order = exp_config.get('order', [])
            for i, exp_id in enumerate(order):
                if exp_id in items:
                    exp_data = items[exp_id]
                    exp_data['sort_order'] = i
                    save_experience(exp_data)

        # Save views
        if 'views' in data:
            views_config = data['views']
            views_list = views_config.get('items', views_config.get('views', []))
            for view_data in views_list:
                save_view(view_data)
            if 'defaultHomeViewId' in views_config:
                set_default_home_view_id(views_config['defaultHomeViewId'])

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving metadata: {e}')
        return jsonify({'error': 'Failed to save metadata'}), 500


@app.route('/content', methods=['GET'])
def get_content():
    """Get content for editing."""
    content_type = request.args.get('type')
    slug = request.args.get('slug')

    try:
        if content_type == 'about':
            file_path = CONTENT_DIR / 'about.md'
            content = file_path.read_text() if file_path.exists() else ''
            about_metadata = {
                'title': get_setting('about_title') or 'About',
                'description': get_setting('about_description') or ''
            }

            return jsonify({
                'metadata': about_metadata,
                'content': content,
                'slug': 'about'
            })

        elif content_type == 'home':
            file_path = CONTENT_DIR / 'home.md'
            content = file_path.read_text() if file_path.exists() else ''
            home_metadata = {
                'title': get_setting('home_title') or 'Home',
                'description': get_setting('home_description') or ''
            }

            return jsonify({
                'metadata': home_metadata,
                'content': content,
                'slug': 'home'
            })

        elif content_type == 'blog':
            # Blog page only has metadata (title, description), no markdown content
            blog_metadata = {
                'title': get_setting('blog_title') or 'Blog',
                'description': get_setting('blog_description') or ''
            }
            return jsonify({
                'metadata': blog_metadata,
                'content': '',
                'slug': 'blog'
            })

        elif content_type == 'post' and slug:
            file_path = POSTS_DIR / f'{slug}-post.md'
            if not file_path.exists():
                return jsonify({'error': 'Post not found'}), 404

            content = file_path.read_text()
            post_metadata = get_post_by_slug(slug)

            return jsonify({
                'metadata': post_metadata or {},
                'content': content,
                'slug': slug
            })

        elif content_type == 'experience' and slug:
            # For new experiences, return empty template
            if slug == '__new__':
                return jsonify({
                    'metadata': {
                        'title': '',
                        'company': '',
                        'startDate': '',
                        'endDate': '',
                        'image': '',
                        'backgroundColor': '',
                        'textColor': '',
                        'accentColor': '',
                    },
                    'content': '',
                    'slug': '',
                    'isNew': True,
                })

            file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
            if not file_path.exists():
                return jsonify({'error': 'Experience not found'}), 404

            content = file_path.read_text()
            exp_metadata = get_experience_by_id(slug)

            return jsonify({
                'metadata': exp_metadata or {},
                'content': content,
                'slug': slug
            })

        else:
            return jsonify({'error': 'Invalid request'}), 400

    except Exception as e:
        print(f'Error reading content: {e}')
        return jsonify({'error': 'Failed to read content'}), 500


@app.route('/content', methods=['PUT'])
def save_content():
    """Save edited content."""
    try:
        data = request.get_json()
        content_type = data.get('type')
        slug = data.get('slug')
        content_metadata = data.get('metadata', {})
        content = data.get('content', '')
        is_new = data.get('isNew', False)

        if content_type == 'about':
            file_path = CONTENT_DIR / 'about.md'
            set_setting('about_title', content_metadata.get('title', 'About'))
            set_setting('about_description', content_metadata.get('description', ''))
            file_path.write_text(content)

        elif content_type == 'home':
            file_path = CONTENT_DIR / 'home.md'
            set_setting('home_title', content_metadata.get('title', 'Home'))
            set_setting('home_description', content_metadata.get('description', ''))
            file_path.write_text(content)

        elif content_type == 'blog':
            # Blog page only has metadata (title, description), no markdown content
            set_setting('blog_title', content_metadata.get('title', 'Blog'))
            set_setting('blog_description', content_metadata.get('description', ''))

        elif content_type == 'post':
            # For new posts, generate slug from title
            if is_new or not slug:
                title = content_metadata.get('title', '')
                if not title:
                    return jsonify({'error': 'Title is required'}), 400
                slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

            file_path = POSTS_DIR / f'{slug}-post.md'
            post_id = f'post-{slug}'

            # Save to database
            save_post({
                'id': post_id,
                'slug': slug,
                'title': content_metadata.get('title', ''),
                'date': content_metadata.get('date'),
                'categories': content_metadata.get('categories', []),
                'layout': content_metadata.get('layout', 'post'),
                'toc': content_metadata.get('toc', False),
                'is_series': content_metadata.get('is_series', False),
                'series_title': content_metadata.get('series_title')
            })

            file_path.write_text(content)

        elif content_type == 'experience':
            # For new experiences, generate slug from title
            if is_new or slug == '__new__':
                title = content_metadata.get('title', '')
                if not title:
                    return jsonify({'error': 'Title is required'}), 400
                slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

            # Ensure experiences directory exists
            EXPERIENCES_DIR.mkdir(parents=True, exist_ok=True)

            file_path = EXPERIENCES_DIR / f'{slug}-experience.md'
            exp_id = f'exp-{slug}'

            # Save to database
            save_experience({
                'id': exp_id,
                'title': content_metadata.get('title', ''),
                'company': content_metadata.get('company'),
                'startDate': content_metadata.get('startDate'),
                'endDate': content_metadata.get('endDate'),
                'image': content_metadata.get('image'),
                'backgroundColor': content_metadata.get('backgroundColor'),
                'textColor': content_metadata.get('textColor'),
                'accentColor': content_metadata.get('accentColor')
            })

            file_path.write_text(content)

        else:
            return jsonify({'error': 'Invalid request'}), 400

        return jsonify({'success': True, 'slug': slug})

    except Exception as e:
        print(f'Error saving content: {e}')
        return jsonify({'error': 'Failed to save content'}), 500


@app.route('/experiences/order', methods=['PUT'])
def update_exp_order():
    """Update the order of experiences."""
    try:
        data = request.get_json()
        order = data.get('order')

        if not isinstance(order, list):
            return jsonify({'error': 'Order must be an array'}), 400

        update_experience_order(order)

        return jsonify({'success': True})

    except Exception as e:
        print(f'Error saving order: {e}')
        return jsonify({'error': 'Failed to save order'}), 500


@app.route('/navigation', methods=['GET'])
def get_navigation_endpoint():
    """Get navigation configuration."""
    nav = get_navigation()
    if not nav:
        nav = {
            'id': 'navigation',
            'type': 'Navigation',
            'siteName': "scshafe's Blog",
            'header': [
                {'id': 'nav-header-blog', 'type': 'NavLink', 'parentId': 'navigation',
                 'label': 'Blog', 'url': '/blog/', 'position': 'right', 'icon': None, 'external': False},
            ],
            'footer': [
                {'id': 'nav-footer-rss', 'type': 'NavLink', 'parentId': 'navigation',
                 'label': 'RSS Feed', 'url': '/feed.xml', 'icon': 'rss', 'external': False},
            ],
        }
    return jsonify(nav)


@app.route('/navigation', methods=['PUT'])
def update_navigation_endpoint():
    """Update navigation configuration."""
    try:
        data = request.get_json()

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'siteName' not in data or 'header' not in data or 'footer' not in data:
            return jsonify({'error': 'Missing required fields: siteName, header, footer'}), 400

        save_navigation(data)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving navigation: {e}')
        return jsonify({'error': 'Failed to save navigation'}), 500


@app.route('/themes', methods=['GET'])
def get_themes_endpoint():
    """Get theme configuration."""
    themes = get_themes()
    if not themes:
        themes = {
            'id': 'themes',
            'type': 'Themes',
            'activeThemeId': 'midnight-blue',
            'colorSchemePreference': 'system',
            'customThemes': [],
        }
    return jsonify(themes)


@app.route('/themes', methods=['PUT'])
def update_themes_endpoint():
    """Update theme configuration."""
    try:
        data = request.get_json()

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'activeThemeId' not in data:
            return jsonify({'error': 'Missing required field: activeThemeId'}), 400

        save_themes(data)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving themes: {e}')
        return jsonify({'error': 'Failed to save themes'}), 500


@app.route('/posts', methods=['GET'])
def list_posts():
    """List all posts with their metadata."""
    posts_list = get_all_posts()

    # Return in expected format
    return jsonify({
        'id': 'posts',
        'type': 'Posts',
        'items': {p['id']: p for p in posts_list}
    })


@app.route('/tags', methods=['GET'])
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


@app.route('/experiences', methods=['GET'])
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


@app.route('/fetch-image', methods=['POST'])
def fetch_image():
    """Fetch an image from a URL and return it as base64."""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()

        if not url:
            return jsonify({'error': 'URL is required'}), 400

        # Validate URL
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return jsonify({'error': 'Invalid URL scheme'}), 400

        # Fetch the image
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10, stream=True)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            return jsonify({'error': 'URL does not point to an image'}), 400

        # Read image data
        image_data = response.content

        # Determine file extension
        ext = mimetypes.guess_extension(content_type.split(';')[0])
        if not ext:
            ext = '.png'

        # Convert to base64
        base64_data = base64.b64encode(image_data).decode('utf-8')

        return jsonify({
            'success': True,
            'base64': base64_data,
            'contentType': content_type,
            'extension': ext,
            'size': len(image_data),
        })

    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timed out'}), 408
    except requests.exceptions.RequestException as e:
        print(f'Error fetching image: {e}')
        return jsonify({'error': f'Failed to fetch image: {str(e)}'}), 500
    except Exception as e:
        print(f'Error processing image: {e}')
        return jsonify({'error': 'Failed to process image'}), 500


@app.route('/save-image', methods=['POST'])
def save_image():
    """Save a base64 image to the public directory."""
    try:
        data = request.get_json()
        base64_data = data.get('base64', '')
        extension = data.get('extension', '.png')
        experience_id = data.get('experienceId', '')

        if not base64_data:
            return jsonify({'error': 'Image data is required'}), 400

        if not experience_id:
            return jsonify({'error': 'Experience ID is required'}), 400

        # Sanitize experience ID
        safe_id = re.sub(r'[^a-z0-9-]', '', experience_id.lower())
        if not safe_id:
            return jsonify({'error': 'Invalid experience ID'}), 400

        # Ensure images directory exists
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)

        # Decode and save image
        image_data = base64.b64decode(base64_data)
        filename = f'{safe_id}{extension}'
        file_path = IMAGES_DIR / filename

        file_path.write_bytes(image_data)

        # Return the public path
        public_path = f'/images/experiences/{filename}'

        return jsonify({
            'success': True,
            'path': public_path,
        })

    except Exception as e:
        print(f'Error saving image: {e}')
        return jsonify({'error': 'Failed to save image'}), 500


@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    """Upload a PDF file and save it to the public directory."""
    try:
        data = request.get_json()
        base64_data = data.get('base64', '')
        filename = data.get('filename', 'document.pdf')
        component_id = data.get('componentId', '')

        if not base64_data:
            return jsonify({'error': 'PDF data is required'}), 400

        if not component_id:
            return jsonify({'error': 'Component ID is required'}), 400

        # Sanitize filename
        safe_filename = re.sub(r'[^a-z0-9._-]', '', filename.lower())
        if not safe_filename.endswith('.pdf'):
            safe_filename += '.pdf'

        # Add component ID prefix to avoid conflicts
        safe_component_id = re.sub(r'[^a-z0-9-]', '', component_id.lower())
        final_filename = f'{safe_component_id}-{safe_filename}'

        # Ensure PDFs directory exists
        PDFS_DIR.mkdir(parents=True, exist_ok=True)

        # Decode and save PDF
        pdf_data = base64.b64decode(base64_data)
        file_path = PDFS_DIR / final_filename

        file_path.write_bytes(pdf_data)

        # Return the public path
        public_path = f'/pdfs/{final_filename}'

        return jsonify({
            'success': True,
            'path': public_path,
            'filename': final_filename,
            'size': len(pdf_data),
        })

    except Exception as e:
        print(f'Error uploading PDF: {e}')
        return jsonify({'error': 'Failed to upload PDF'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'mode': 'author'})


# Views endpoints

@app.route('/views', methods=['GET'])
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


@app.route('/views', methods=['PUT'])
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


@app.route('/views/<view_id>', methods=['PUT'])
def update_view_endpoint(view_id):
    """Update a single view."""
    try:
        data = request.get_json()

        # Ensure the view has proper type and parentId
        data['type'] = 'View'
        data['parentId'] = 'views'
        data['id'] = view_id

        save_view(data)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error updating view: {e}')
        return jsonify({'error': 'Failed to update view'}), 500


@app.route('/views/<view_id>', methods=['DELETE'])
def delete_view_endpoint(view_id):
    """Delete a view."""
    try:
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


@app.route('/views/<view_id>/content', methods=['PUT'])
def update_view_content_endpoint(view_id):
    """Update a view's content field."""
    try:
        data = request.get_json()
        content_key = data.get('contentKey')
        content = data.get('content', '')

        if not content_key:
            return jsonify({'error': 'contentKey is required'}), 400

        success = update_view_content(view_id, content_key, content)

        if not success:
            return jsonify({'error': 'View not found'}), 404

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error updating view content: {e}')
        return jsonify({'error': 'Failed to update view content'}), 500


if __name__ == '__main__':
    print('\033[33m[Author Server]\033[0m Flask server running at http://localhost:3001')
    print('\033[33m[Author Server]\033[0m Edit endpoints available for local development')
    print('\033[33m[Author Server]\033[0m Using SQLite database at content/blog.db')
    print('\033[33m[Author Server]\033[0m Note: metadata.json is only generated at build time')
    app.run(host='localhost', port=3001, debug=True)
