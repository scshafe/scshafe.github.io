"""
Media routes for the Author Mode Server.

Handles image and PDF upload/fetch operations.
"""

import re
import json
import base64
import mimetypes
from urllib.parse import urlparse
import requests
from flask import Blueprint, request, jsonify
from pathlib import Path

media_bp = Blueprint('media', __name__)

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent.parent
IMAGES_DIR = ROOT_DIR / 'public' / 'images' / 'experiences'
PDFS_DIR = ROOT_DIR / 'public' / 'pdfs'


@media_bp.route('/fetch-image', methods=['POST'])
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


@media_bp.route('/save-image', methods=['POST'])
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

        print("~~ Save Image ~~")
        print(json.dumps({'filename': filename, 'path': f'/images/experiences/{filename}', 'size': len(image_data)}, indent=2))

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


@media_bp.route('/upload-pdf', methods=['POST'])
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

        print("~~ Upload PDF ~~")
        print(json.dumps({'filename': final_filename, 'path': f'/pdfs/{final_filename}', 'size': len(pdf_data)}, indent=2))

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
