"""
Settings entities - site configuration, navigation, themes, and tags.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

from .base import Entity, generate_id, current_timestamp
from .links import InternalLink, BasicLink

logger = logging.getLogger(__name__)


@dataclass
class Tag(Entity):
    """
    Tag entity for content categorization.

    Attributes:
        tag_id: Primary key - unique identifier for this tag.
        label: Display label for the tag.
    """
    tag_id: int = field(default_factory=generate_id)
    label: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            'tag_id': self.tag_id,
            'label': self.label,
            **self._base_dict(),
        }
        logger.debug(f"Tag.to_dict: tag_id={self.tag_id}, label={self.label}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Tag':
        """Create Tag from dictionary."""
        tag = cls(
            tag_id=data['tag_id'],
            label=data.get('label', ''),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
        )
        logger.debug(f"Tag.from_dict: tag_id={tag.tag_id}, label={tag.label}")
        return tag

    def __repr__(self) -> str:
        return f"Tag(tag_id={self.tag_id}, label={self.label})"


@dataclass
class Theme(Entity):
    """
    Theme entity for visual styling.

    Attributes:
        theme_id: Primary key - unique identifier for this theme.
        name: Display name for the theme.
        color_scheme: Preferred color scheme ('system', 'light', 'dark').
    """
    theme_id: int = field(default_factory=generate_id)
    name: str = ""
    color_scheme: str = "system"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            'theme_id': self.theme_id,
            'name': self.name,
            'color_scheme': self.color_scheme,
            **self._base_dict(),
        }
        logger.debug(f"Theme.to_dict: theme_id={self.theme_id}, name={self.name}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Theme':
        """Create Theme from dictionary."""
        theme = cls(
            theme_id=data['theme_id'],
            name=data.get('name', ''),
            color_scheme=data.get('color_scheme', 'system'),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
        )
        logger.debug(f"Theme.from_dict: theme_id={theme.theme_id}, name={theme.name}")
        return theme

    def __repr__(self) -> str:
        return f"Theme(theme_id={self.theme_id}, name={self.name})"


@dataclass
class NavBar(Entity):
    """
    NavBar entity for header navigation items.

    Attributes:
        nav_bar_id: Primary key - unique identifier for this nav item.
        position: Position in header ('left' or 'right').
        order: Sort order within position.
        internal_link: Embedded InternalLink object.
    """
    nav_bar_id: int = field(default_factory=generate_id)
    position: str = "left"
    order: int = 0
    internal_link: Optional[InternalLink] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            'nav_bar_id': self.nav_bar_id,
            'position': self.position,
            'order': self.order,
            'internal_link': self.internal_link.to_dict() if self.internal_link else None,
            **self._base_dict(),
        }
        logger.debug(f"NavBar.to_dict: nav_bar_id={self.nav_bar_id}, position={self.position}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'NavBar':
        """Create NavBar from dictionary."""
        internal_link_data = data.get('internal_link')
        # Use BasicLink.from_dict to handle both internal and external links
        internal_link = BasicLink.from_dict(internal_link_data) if internal_link_data else None

        nav = cls(
            nav_bar_id=data['nav_bar_id'],
            position=data.get('position', 'left'),
            order=data.get('order', 0),
            internal_link=internal_link,
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
        )
        logger.debug(f"NavBar.from_dict: nav_bar_id={nav.nav_bar_id}, position={nav.position}")
        return nav

    def __repr__(self) -> str:
        label = self.internal_link.label if self.internal_link else 'None'
        return f"NavBar(nav_bar_id={self.nav_bar_id}, position={self.position}, label={label})"


@dataclass
class Footer(Entity):
    """
    Footer entity for footer navigation items.

    Attributes:
        footer_id: Primary key - unique identifier for this footer item.
        position: Position in footer ('left' or 'right').
        order: Sort order within position.
        internal_link: Embedded InternalLink object.
    """
    footer_id: int = field(default_factory=generate_id)
    position: str = "left"
    order: int = 0
    internal_link: Optional[InternalLink] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            'footer_id': self.footer_id,
            'position': self.position,
            'order': self.order,
            'internal_link': self.internal_link.to_dict() if self.internal_link else None,
            **self._base_dict(),
        }
        logger.debug(f"Footer.to_dict: footer_id={self.footer_id}, position={self.position}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Footer':
        """Create Footer from dictionary."""
        internal_link_data = data.get('internal_link')
        # Use BasicLink.from_dict to handle both internal and external links
        internal_link = BasicLink.from_dict(internal_link_data) if internal_link_data else None

        footer = cls(
            footer_id=data['footer_id'],
            position=data.get('position', 'left'),
            order=data.get('order', 0),
            internal_link=internal_link,
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
        )
        logger.debug(f"Footer.from_dict: footer_id={footer.footer_id}, position={footer.position}")
        return footer

    def __repr__(self) -> str:
        label = self.internal_link.label if self.internal_link else 'None'
        return f"Footer(footer_id={self.footer_id}, position={self.position}, label={label})"


@dataclass
class SiteConfig:
    """
    SiteConfig - singleton configuration for the site.

    This is stored as a single file, not with an ID.

    Attributes:
        site_name: Name of the site.
        default_home_link: Internal link to the default home view.
    """
    site_name: str = "My Blog"
    default_home_link: Optional[InternalLink] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            'site_name': self.site_name,
            'default_home_link': self.default_home_link.to_dict() if self.default_home_link else None,
        }
        logger.debug(f"SiteConfig.to_dict: site_name={self.site_name}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SiteConfig':
        """Create SiteConfig from dictionary."""
        home_link_data = data.get('default_home_link')
        default_home_link = InternalLink.from_dict(home_link_data) if home_link_data else None

        config = cls(
            site_name=data.get('site_name', 'My Blog'),
            default_home_link=default_home_link,
        )
        logger.debug(f"SiteConfig.from_dict: site_name={config.site_name}")
        return config

    def __repr__(self) -> str:
        return f"SiteConfig(site_name={self.site_name})"
