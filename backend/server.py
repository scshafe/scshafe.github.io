#!/usr/bin/env python3
"""
Author Mode Server

Flask server for editing blog content during local development.
Provides API endpoints for reading and writing posts, about page, and experiences.

Content structure:
- content/metadata.json - All metadata for posts, experiences, about, home
- content/about.md - About page content (no frontmatter)
- content/home.md - Home page content (no frontmatter)
- content/posts/{slug}-post.md - Post content (no frontmatter)
- content/experiences/{slug}-experience.md - Experience content (no frontmatter)
"""

import re
import json
import base64
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
POSTS_DIR = CONTENT_DIR / 'posts'
EXPERIENCES_DIR = CONTENT_DIR / 'experiences'
IMAGES_DIR = ROOT_DIR / 'public' / 'images' / 'experiences'
METADATA_PATH = CONTENT_DIR / 'metadata.json'


def load_metadata() -> dict:
    """Load the metadata.json file."""
    try:
        return json.loads(METADATA_PATH.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            'posts': {},
            'experiences': {'order': []},
            'about': {'title': 'About', 'description': ''},
            'home': {'title': 'Home', 'description': ''}
        }


def save_metadata(metadata: dict) -> None:
    """Save the metadata.json file."""
    METADATA_PATH.write_text(json.dumps(metadata, indent=2))


@app.route('/metadata', methods=['GET'])
def get_metadata():
    """Get the full metadata.json."""
    return jsonify(load_metadata())


@app.route('/metadata', methods=['PUT'])
def update_metadata():
    """Update the full metadata.json."""
    try:
        data = request.get_json()
        save_metadata(data)
        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving metadata: {e}')
        return jsonify({'error': 'Failed to save metadata'}), 500


@app.route('/content', methods=['GET'])
def get_content():
    """Get content for editing."""
    content_type = request.args.get('type')
    slug = request.args.get('slug')
    metadata = load_metadata()

    try:
        if content_type == 'about':
            file_path = CONTENT_DIR / 'about.md'
            content = file_path.read_text() if file_path.exists() else ''

            return jsonify({
                'metadata': metadata.get('about', {}),
                'content': content,
                'slug': 'about'
            })

        elif content_type == 'home':
            file_path = CONTENT_DIR / 'home.md'
            content = file_path.read_text() if file_path.exists() else ''

            return jsonify({
                'metadata': metadata.get('home', {}),
                'content': content,
                'slug': 'home'
            })

        elif content_type == 'post' and slug:
            file_path = POSTS_DIR / f'{slug}-post.md'
            if not file_path.exists():
                return jsonify({'error': 'Post not found'}), 404

            content = file_path.read_text()
            post_metadata = metadata.get('posts', {}).get(slug, {})

            return jsonify({
                'metadata': post_metadata,
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
                        'role': '',
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
            exp_metadata = metadata.get('experiences', {}).get(slug, {})

            return jsonify({
                'metadata': exp_metadata,
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

        metadata = load_metadata()

        if content_type == 'about':
            file_path = CONTENT_DIR / 'about.md'
            metadata['about'] = content_metadata
            file_path.write_text(content)
            save_metadata(metadata)

        elif content_type == 'home':
            file_path = CONTENT_DIR / 'home.md'
            metadata['home'] = content_metadata
            file_path.write_text(content)
            save_metadata(metadata)

        elif content_type == 'post':
            # For new posts, generate slug from title
            if is_new or not slug:
                title = content_metadata.get('title', '')
                if not title:
                    return jsonify({'error': 'Title is required'}), 400
                slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

            file_path = POSTS_DIR / f'{slug}-post.md'

            # Update metadata
            if 'posts' not in metadata:
                metadata['posts'] = {}
            metadata['posts'][slug] = content_metadata

            file_path.write_text(content)
            save_metadata(metadata)

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

            # Update metadata
            if 'experiences' not in metadata:
                metadata['experiences'] = {'order': []}
            if slug not in metadata['experiences']:
                metadata['experiences'][slug] = {}
            metadata['experiences'][slug] = content_metadata

            # Add to order if new
            if is_new or slug == '__new__':
                if 'order' not in metadata['experiences']:
                    metadata['experiences']['order'] = []
                if slug not in metadata['experiences']['order']:
                    metadata['experiences']['order'].append(slug)

            file_path.write_text(content)
            save_metadata(metadata)

        else:
            return jsonify({'error': 'Invalid request'}), 400

        return jsonify({'success': True, 'slug': slug})

    except Exception as e:
        print(f'Error saving content: {e}')
        return jsonify({'error': 'Failed to save content'}), 500


@app.route('/experiences/order', methods=['PUT'])
def update_experience_order():
    """Update the order of experiences."""
    try:
        data = request.get_json()
        order = data.get('order')

        if not isinstance(order, list):
            return jsonify({'error': 'Order must be an array'}), 400

        metadata = load_metadata()
        if 'experiences' not in metadata:
            metadata['experiences'] = {}
        metadata['experiences']['order'] = order
        save_metadata(metadata)

        return jsonify({'success': True})

    except Exception as e:
        print(f'Error saving order: {e}')
        return jsonify({'error': 'Failed to save order'}), 500


@app.route('/navigation', methods=['GET'])
def get_navigation():
    """Get navigation configuration."""
    metadata = load_metadata()
    default_config = {
        'siteName': "scshafe's Blog",
        'header': [
            {'id': 'blog', 'label': 'Blog', 'url': '/blog/', 'position': 'right', 'icon': None, 'external': False},
            {'id': 'about', 'label': 'About', 'url': '/about/', 'position': 'right', 'icon': None, 'external': False},
        ],
        'footer': [
            {'id': 'rss', 'label': 'RSS Feed', 'url': '/feed.xml', 'icon': 'rss', 'external': False},
        ],
    }
    return jsonify(metadata.get('navigation', default_config))


@app.route('/navigation', methods=['PUT'])
def update_navigation():
    """Update navigation configuration."""
    try:
        data = request.get_json()

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'siteName' not in data or 'header' not in data or 'footer' not in data:
            return jsonify({'error': 'Missing required fields: siteName, header, footer'}), 400

        metadata = load_metadata()
        metadata['navigation'] = data
        save_metadata(metadata)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving navigation: {e}')
        return jsonify({'error': 'Failed to save navigation'}), 500


@app.route('/themes', methods=['GET'])
def get_themes():
    """Get theme configuration."""
    metadata = load_metadata()
    default_config = {
        'activeThemeId': 'midnight-blue',
        'customThemes': [],
    }
    return jsonify(metadata.get('themes', default_config))


@app.route('/themes', methods=['PUT'])
def update_themes():
    """Update theme configuration."""
    try:
        data = request.get_json()

        # Validate required fields
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid data format'}), 400

        if 'activeThemeId' not in data or 'customThemes' not in data:
            return jsonify({'error': 'Missing required fields: activeThemeId, customThemes'}), 400

        if not isinstance(data['customThemes'], list):
            return jsonify({'error': 'customThemes must be an array'}), 400

        metadata = load_metadata()
        metadata['themes'] = data
        save_metadata(metadata)

        return jsonify({'success': True})
    except Exception as e:
        print(f'Error saving themes: {e}')
        return jsonify({'error': 'Failed to save themes'}), 500


@app.route('/posts', methods=['GET'])
def list_posts():
    """List all posts with their metadata."""
    metadata = load_metadata()
    posts = metadata.get('posts', {})
    return jsonify(posts)


@app.route('/experiences', methods=['GET'])
def list_experiences():
    """List all experiences with their metadata."""
    metadata = load_metadata()
    experiences = metadata.get('experiences', {})
    return jsonify(experiences)


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


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'mode': 'author'})


if __name__ == '__main__':
    print('\033[33m[Author Server]\033[0m Flask server running at http://localhost:3001')
    print('\033[33m[Author Server]\033[0m Edit endpoints available for local development')
    app.run(host='localhost', port=3001, debug=True)
