"""
Routes package for the Author Mode Server.

Each module contains Flask Blueprints for a specific type of endpoint.
"""

from .experiences import experiences_bp
from .views import views_bp
from .themes import themes_bp
from .navigation import navigation_bp
from .site import site_bp
from .content import content_bp
from .components import components_bp
from .references import references_bp
from .nodes import nodes_bp
from .tags import tags_bp
from .media import media_bp
from .metadata import metadata_bp
from .debug import debug_bp

__all__ = [
    'experiences_bp',
    'views_bp',
    'themes_bp',
    'navigation_bp',
    'site_bp',
    'content_bp',
    'components_bp',
    'references_bp',
    'nodes_bp',
    'tags_bp',
    'media_bp',
    'metadata_bp',
    'debug_bp',
]
