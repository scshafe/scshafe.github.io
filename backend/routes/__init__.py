"""
Routes package for the Author Mode Server.

Each module contains Flask Blueprints for a specific type of endpoint.
"""

from .posts import posts_bp
from .experiences import experiences_bp
from .views import views_bp
from .themes import themes_bp
from .navigation import navigation_bp
from .content import content_bp
from .components import components_bp
from .media import media_bp
from .metadata import metadata_bp
from .debug import debug_bp

__all__ = [
    'posts_bp',
    'experiences_bp',
    'views_bp',
    'themes_bp',
    'navigation_bp',
    'content_bp',
    'components_bp',
    'media_bp',
    'metadata_bp',
    'debug_bp',
]
