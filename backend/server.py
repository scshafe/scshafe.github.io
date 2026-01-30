#!/usr/bin/env python3
"""
Author Mode Server

Flask server for editing content during local development.
Provides API endpoints for managing views, components, and settings.

Content structure:
- content/nodes/ - Tree structure nodes
- content/references/ - References with overrides
- content/components/ - Component content and config
- content/settings/ - Theme and navigation settings
- content/experiences/{slug}-experience.md - Experience content

Note: metadata.json is NOT written during development.
It is only generated at build time via `npm run export:metadata`.
"""

import json
import logging
import time
from flask import Flask, request, g
from flask_cors import CORS

# Define custom VERBOSE logging level (between DEBUG=10 and INFO=20)
VERBOSE = 15
logging.addLevelName(VERBOSE, 'VERBOSE')

def verbose(self, message, *args, **kwargs):
    """Log at VERBOSE level."""
    if self.isEnabledFor(VERBOSE):
        self._log(VERBOSE, message, args, **kwargs)

# Add verbose method to Logger class
logging.Logger.verbose = verbose

# Configure logging - VERBOSE is default
logging.basicConfig(
    level=VERBOSE,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


# Color codes for terminal output
class LogColors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    MAGENTA = '\033[95m'
    BLUE = '\033[94m'
    GRAY = '\033[90m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def log_verbose_request_details(path: str, url_params: dict, json_data: dict):
    """Log detailed request information at VERBOSE level."""
    if not logger.isEnabledFor(VERBOSE):
        return

    details = []

    # Log URL parameters (from path and query string)
    if url_params:
        params_str = json.dumps(url_params, indent=2, default=str)
        details.append(f"{LogColors.BLUE}URL Params:{LogColors.RESET}\n{params_str}")

    # Log JSON body data
    if json_data:
        json_str = json.dumps(json_data, indent=2, default=str)
        details.append(f"{LogColors.BLUE}JSON Data:{LogColors.RESET}\n{json_str}")

    if details:
        separator = f"{LogColors.GRAY}{'─' * 50}{LogColors.RESET}"
        msg = f"\n{separator}\n" + "\n".join(details) + f"\n{separator}"
        logger.verbose(msg)


def log_request(method: str, path: str, data=None):
    """Log incoming API request."""
    color = {
        'GET': LogColors.CYAN,
        'POST': LogColors.GREEN,
        'PUT': LogColors.YELLOW,
        'DELETE': LogColors.RED,
    }.get(method, LogColors.MAGENTA)

    msg = f"{color}{LogColors.BOLD}→ {method}{LogColors.RESET} {path}"
    if data and method in ['POST', 'PUT']:
        # Truncate large data for readability
        data_str = str(data)
        if len(data_str) > 200:
            data_str = data_str[:200] + '...'
        msg += f" {LogColors.MAGENTA}{data_str}{LogColors.RESET}"
    logger.info(msg)


def log_response(method: str, path: str, status: int, data=None, duration_ms: float = None):
    """Log outgoing API response."""
    color = LogColors.GREEN if status < 400 else LogColors.RED

    duration_str = f" ({duration_ms:.1f}ms)" if duration_ms else ""
    msg = f"{color}{LogColors.BOLD}← {status}{LogColors.RESET} {method} {path}{duration_str}"

    if data:
        # Log key info from response
        if isinstance(data, dict):
            if 'error' in data:
                msg += f" {LogColors.RED}error={data['error']}{LogColors.RESET}"
            elif 'success' in data:
                msg += f" {LogColors.GREEN}success={data['success']}{LogColors.RESET}"
                if 'id' in data:
                    msg += f" id={data['id']}"
            elif 'id' in data:
                msg += f" id={data['id']}"

            # Log data summary for GET responses
            if method == 'GET':
                msg += log_data_summary(data)
        elif isinstance(data, list):
            msg += f" {LogColors.CYAN}[{len(data)} items]{LogColors.RESET}"

    logger.info(msg)


def log_data_summary(data: dict) -> str:
    """Generate a summary string for response data."""
    summary_parts = []

    # Count items in common response structures
    if 'views' in data:
        views = data['views']
        count = len(views) if isinstance(views, (list, dict)) else 0
        summary_parts.append(f"views={count}")

    if 'items' in data:
        items = data['items']
        count = len(items) if isinstance(items, (list, dict)) else 0
        summary_parts.append(f"items={count}")

    if 'components' in data:
        comps = data['components']
        count = len(comps) if isinstance(comps, (list, dict)) else 0
        summary_parts.append(f"components={count}")

    if 'header' in data:
        summary_parts.append(f"header={len(data['header'])}")

    if 'footer' in data:
        summary_parts.append(f"footer={len(data['footer'])}")

    if 'themes' in data or 'activeThemeId' in data:
        theme_id = data.get('activeThemeId', data.get('themes', {}).get('activeThemeId', 'unknown'))
        summary_parts.append(f"theme={theme_id}")

    if 'siteName' in data:
        summary_parts.append(f"site={data['siteName'][:20]}")

    if 'default_home_view_id' in data:
        home_id = data['default_home_view_id']
        if home_id:
            summary_parts.append(f"home={str(home_id)[:8]}...")

    # Entity IDs for CRUD operations
    if 'id' in data and 'success' not in data:
        summary_parts.append(f"id={data['id']}")

    if 'node_id' in data:
        summary_parts.append(f"node_id={data['node_id']}")

    if 'ref_id' in data:
        summary_parts.append(f"ref_id={data['ref_id']}")

    if 'component_id' in data:
        summary_parts.append(f"component_id={data['component_id']}")

    # Type information
    if 'type' in data and data['type'] not in ['Views', 'Themes']:
        summary_parts.append(f"type={data['type']}")

    # Children count for resolved views
    if 'children' in data:
        summary_parts.append(f"children={len(data['children'])}")

    if summary_parts:
        return f" {LogColors.CYAN}({', '.join(summary_parts)}){LogColors.RESET}"
    return ""


def log_verbose_operation(operation: str, entity_type: str, entity_id=None, details: dict = None):
    """Log detailed operation information at VERBOSE level."""
    if not logger.isEnabledFor(VERBOSE):
        return

    id_str = f" id={entity_id}" if entity_id else ""
    msg = f"{LogColors.MAGENTA}[{operation}]{LogColors.RESET} {entity_type}{id_str}"

    if details:
        details_str = json.dumps(details, indent=2, default=str)
        msg += f"\n{LogColors.GRAY}{details_str}{LogColors.RESET}"

    logger.verbose(msg)


# Import database initialization
from database import init_database

# Import route blueprints
from routes import (
    experiences_bp,
    views_bp,
    themes_bp,
    navigation_bp,
    site_bp,
    content_bp,
    components_bp,
    references_bp,
    nodes_bp,
    tags_bp,
    media_bp,
    metadata_bp,
    debug_bp,
)

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])


# ============ REQUEST/RESPONSE LOGGING MIDDLEWARE ============

@app.before_request
def before_request_logging():
    """Log incoming requests and store start time."""
    g.start_time = time.time()

    # Get JSON data for POST/PUT requests
    json_data = None
    if request.method in ['POST', 'PUT'] and request.is_json:
        try:
            json_data = request.get_json(silent=True)
        except Exception:
            pass

    # Log basic request info
    log_request(request.method, request.path, json_data)

    # Collect URL parameters for verbose logging
    url_params = {}

    # Path parameters (from URL rules like /views/<id>)
    if request.view_args:
        url_params['path_params'] = dict(request.view_args)

    # Query string parameters (from ?key=value)
    if request.args:
        url_params['query_params'] = request.args.to_dict(flat=False)
        # Flatten single-value lists
        url_params['query_params'] = {
            k: v[0] if len(v) == 1 else v
            for k, v in url_params['query_params'].items()
        }

    # Log verbose details (URL params and full JSON data)
    log_verbose_request_details(request.path, url_params, json_data)


@app.after_request
def after_request_logging(response):
    """Log outgoing responses with duration."""
    duration_ms = None
    if hasattr(g, 'start_time'):
        duration_ms = (time.time() - g.start_time) * 1000

    data = None
    if response.is_json:
        try:
            data = response.get_json(silent=True)
        except Exception:
            pass

    log_response(request.method, request.path, response.status_code, data, duration_ms)
    return response


# Initialize database
init_database()

# Register blueprints
app.register_blueprint(experiences_bp)
app.register_blueprint(views_bp)
app.register_blueprint(themes_bp)
app.register_blueprint(navigation_bp)
app.register_blueprint(site_bp)
app.register_blueprint(content_bp)
app.register_blueprint(components_bp)
app.register_blueprint(references_bp)
app.register_blueprint(nodes_bp)
app.register_blueprint(tags_bp)
app.register_blueprint(media_bp)
app.register_blueprint(metadata_bp)
app.register_blueprint(debug_bp)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Author Mode Server')
    parser.add_argument('--debug', action='store_true',
                        help='Enable DEBUG level logging (more verbose than default)')
    parser.add_argument('--port', type=int, default=3001,
                        help='Port to run on (default: 3001)')
    args = parser.parse_args()

    # Set logging level based on --debug flag
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        # Also set database module to DEBUG
        logging.getLogger('database').setLevel(logging.DEBUG)
        log_level_str = 'DEBUG (all file operations visible)'
    else:
        log_level_str = 'VERBOSE (shows URL params & JSON data)'

    print('\033[33m[Author Server]\033[0m Flask server running at http://localhost:' + str(args.port))
    print('\033[33m[Author Server]\033[0m Edit endpoints available for local development')
    print('\033[33m[Author Server]\033[0m Using JSON file storage in content/')
    print('\033[33m[Author Server]\033[0m Note: metadata.json is only generated at build time')
    print(f'\033[33m[Author Server]\033[0m Logging level: {log_level_str}')
    if args.debug:
        print('\033[33m[Author Server]\033[0m Content directories: nodes, references, components, settings')
    app.run(host='localhost', port=args.port, debug=True)
