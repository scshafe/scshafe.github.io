#!/usr/bin/env python3
"""
Author Mode Server

Flask server for editing blog content during local development.
Provides API endpoints for reading and writing posts, about page, and experiences.

Content structure:
- content/data.json - JSON database for views, components, posts, relationships
- content/settings.json - Theme and navigation settings
- content/posts/{slug}-post.md - Post content (no frontmatter)
- content/experiences/{slug}-experience.md - Experience content (no frontmatter)

Note: metadata.json is NOT written during development.
It is only generated at build time via `npm run export:metadata`.
"""

import logging
import time
from flask import Flask, request, g
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
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
    RESET = '\033[0m'
    BOLD = '\033[1m'


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

    if 'posts' in data:
        posts = data['posts']
        if isinstance(posts, dict) and 'items' in posts:
            count = len(posts['items'])
        elif isinstance(posts, (list, dict)):
            count = len(posts)
        else:
            count = 0
        summary_parts.append(f"posts={count}")

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

    if 'defaultHomeViewId' in data:
        home_id = data['defaultHomeViewId']
        if home_id:
            summary_parts.append(f"home={home_id[:8]}...")

    if summary_parts:
        return f" {LogColors.CYAN}({', '.join(summary_parts)}){LogColors.RESET}"
    return ""


# Import database initialization
from database import init_database

# Import route blueprints
from routes import (
    posts_bp,
    experiences_bp,
    views_bp,
    themes_bp,
    navigation_bp,
    content_bp,
    components_bp,
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
    data = None
    if request.method in ['POST', 'PUT'] and request.is_json:
        try:
            data = request.get_json(silent=True)
        except Exception:
            pass
    log_request(request.method, request.path, data)


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
app.register_blueprint(posts_bp)
app.register_blueprint(experiences_bp)
app.register_blueprint(views_bp)
app.register_blueprint(themes_bp)
app.register_blueprint(navigation_bp)
app.register_blueprint(content_bp)
app.register_blueprint(components_bp)
app.register_blueprint(media_bp)
app.register_blueprint(metadata_bp)
app.register_blueprint(debug_bp)


if __name__ == '__main__':
    print('\033[33m[Author Server]\033[0m Flask server running at http://localhost:3001')
    print('\033[33m[Author Server]\033[0m Edit endpoints available for local development')
    print('\033[33m[Author Server]\033[0m Using SQLite database at content/blog.db')
    print('\033[33m[Author Server]\033[0m Note: metadata.json is only generated at build time')
    app.run(host='localhost', port=3001, debug=True)
