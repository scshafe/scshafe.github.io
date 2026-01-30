"""
Link entities - embedded objects for navigation and references.

These are embedded objects (no separate table/directory) used within
NavBar, Footer, SiteConfig, and LinkUnit components.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

from .base import generate_id

logger = logging.getLogger(__name__)


@dataclass
class BasicLink:
    """
    Abstract base for link objects.

    BasicLink is embedded within other entities and has no separate storage.

    Attributes:
        basic_link_id: Unique identifier for this link instance.
        label: Display text for the link.
        icon: Optional icon identifier.
    """
    basic_link_id: int = field(default_factory=generate_id)
    label: str = ""
    icon: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'basic_link_id': self.basic_link_id,
            'label': self.label,
            'icon': self.icon,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BasicLink':
        """Create from dictionary - returns appropriate subclass."""
        if data is None:
            return None

        # Determine link type by presence of fields
        if 'view_node_id' in data:
            return InternalLink.from_dict(data)
        elif 'url' in data:
            return ExternalLink.from_dict(data)
        else:
            # Plain BasicLink
            return cls(
                basic_link_id=data.get('basic_link_id', generate_id()),
                label=data.get('label', ''),
                icon=data.get('icon'),
            )


@dataclass
class InternalLink(BasicLink):
    """
    Internal link to a view within the site.

    Attributes:
        view_node_id: Node ID of the target ViewContainer.
        section_node_id: Optional Node ID for deep linking to a section.
    """
    view_node_id: int = 0
    section_node_id: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        result = super().to_dict()
        result.update({
            'view_node_id': self.view_node_id,
            'section_node_id': self.section_node_id,
        })
        logger.debug(f"InternalLink.to_dict: view_node_id={self.view_node_id}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'InternalLink':
        """Create InternalLink from dictionary."""
        if data is None:
            return None

        link = cls(
            basic_link_id=data.get('basic_link_id', generate_id()),
            label=data.get('label', ''),
            icon=data.get('icon'),
            view_node_id=data.get('view_node_id', 0),
            section_node_id=data.get('section_node_id'),
        )
        logger.debug(f"InternalLink.from_dict: view_node_id={link.view_node_id}, label={link.label}")
        return link

    def __repr__(self) -> str:
        return f"InternalLink(label={self.label}, view_node_id={self.view_node_id})"


@dataclass
class ExternalLink(BasicLink):
    """
    External link to a URL outside the site.

    Attributes:
        url: The external URL.
    """
    url: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        result = super().to_dict()
        result.update({
            'url': self.url,
        })
        logger.debug(f"ExternalLink.to_dict: url={self.url}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ExternalLink':
        """Create ExternalLink from dictionary."""
        if data is None:
            return None

        link = cls(
            basic_link_id=data.get('basic_link_id', generate_id()),
            label=data.get('label', ''),
            icon=data.get('icon'),
            url=data.get('url', ''),
        )
        logger.debug(f"ExternalLink.from_dict: url={link.url}, label={link.label}")
        return link

    def __repr__(self) -> str:
        return f"ExternalLink(label={self.label}, url={self.url})"
