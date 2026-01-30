"""
Content routes for the Author Mode Server.

Handles generic content read/write operations for about, home, and experiences.
"""

import re
import json
from flask import Blueprint, request, jsonify
from pathlib import Path

from database import (
    get_experience_by_id,
    save_experience,
    get_setting,
    set_setting,
)

content_bp = Blueprint('content', __name__)

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
EXPERIENCES_DIR = CONTENT_DIR / 'experiences'


@content_bp.route('/content', methods=['GET'])
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


@content_bp.route('/content', methods=['PUT'])
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
            print("~~ Save About Content ~~")
            print(json.dumps({'title': content_metadata.get('title'), 'description': content_metadata.get('description')}, indent=2))
            set_setting('about_title', content_metadata.get('title', 'About'))
            set_setting('about_description', content_metadata.get('description', ''))
            file_path.write_text(content)

        elif content_type == 'home':
            file_path = CONTENT_DIR / 'home.md'
            print("~~ Save Home Content ~~")
            print(json.dumps({'title': content_metadata.get('title'), 'description': content_metadata.get('description')}, indent=2))
            set_setting('home_title', content_metadata.get('title', 'Home'))
            set_setting('home_description', content_metadata.get('description', ''))
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

            print("~~ Save Experience Content ~~")
            print(json.dumps({'id': exp_id, 'slug': slug, 'title': content_metadata.get('title'), 'company': content_metadata.get('company'), 'isNew': is_new}, indent=2))

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
