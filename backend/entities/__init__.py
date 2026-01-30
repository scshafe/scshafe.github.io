"""
Entity classes for the Views system.

This module exports all entity classes used throughout the backend.
"""

from .base import Entity, generate_id
from .node import Node
from .reference import Reference
from .component import Component, Container, UnitComponent, MediaUnit
from .containers import ViewContainer, ListContainer, InlineContainer, StyleContainer
from .units import SectionUnit, PlainTextUnit, AlertUnit, MarkdownUnit, LinkUnit
from .media import ImageMedia, VideoMedia, PDFMedia
from .leaf import ExperienceComponent, TagListComponent
from .settings import Tag, Theme, NavBar, Footer, SiteConfig
from .links import BasicLink, InternalLink, ExternalLink

__all__ = [
    # Base
    'Entity',
    'generate_id',

    # Core entities
    'Node',
    'Reference',

    # Component hierarchy
    'Component',
    'Container',
    'UnitComponent',
    'MediaUnit',

    # Containers
    'ViewContainer',
    'ListContainer',
    'InlineContainer',
    'StyleContainer',

    # Units
    'SectionUnit',
    'PlainTextUnit',
    'AlertUnit',
    'MarkdownUnit',
    'LinkUnit',

    # Media
    'ImageMedia',
    'VideoMedia',
    'PDFMedia',

    # Leaf components
    'ExperienceComponent',
    'TagListComponent',

    # Settings
    'Tag',
    'Theme',
    'NavBar',
    'Footer',
    'SiteConfig',

    # Links (embedded)
    'BasicLink',
    'InternalLink',
    'ExternalLink',
]

# Component type registry for deserialization
COMPONENT_TYPES = {
    'ViewContainer': ViewContainer,
    'ListContainer': ListContainer,
    'InlineContainer': InlineContainer,
    'StyleContainer': StyleContainer,
    'SectionUnit': SectionUnit,
    'PlainTextUnit': PlainTextUnit,
    'AlertUnit': AlertUnit,
    'MarkdownUnit': MarkdownUnit,
    'LinkUnit': LinkUnit,
    'ImageMedia': ImageMedia,
    'VideoMedia': VideoMedia,
    'PDFMedia': PDFMedia,
    'ExperienceComponent': ExperienceComponent,
    'TagListComponent': TagListComponent,
}

def component_from_dict(data: dict) -> Component:
    """
    Deserialize a component from a dictionary.

    Uses the 'type' field to determine which class to instantiate.
    """
    comp_type = data.get('type')
    if comp_type not in COMPONENT_TYPES:
        raise ValueError(f"Unknown component type: {comp_type}")

    return COMPONENT_TYPES[comp_type].from_dict(data)
