"""
Container component implementations.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
import logging

from .base import generate_id, current_timestamp
from .component import Container

logger = logging.getLogger(__name__)


@dataclass
class ViewContainer(Container):
    """
    ViewContainer - represents a page/view.

    This is the top-level container that defines a routable page.

    Attributes:
        path: URL path for this view (e.g., "/about").
        name: Internal name for the view.
        title: Display title shown on the page.
        browser_title: Title shown in browser tab.
        description: Optional meta description.
        tag_ids: List of Tag IDs associated with this view.
    """
    type: str = field(default='ViewContainer', init=False)
    path: str = ""
    name: str = ""
    title: str = ""
    browser_title: str = ""
    description: Optional[str] = None
    tag_ids: List[int] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"ViewContainer.to_dict: comp_id={self.comp_id}, path={self.path}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get ViewContainer configuration."""
        return {
            'path': self.path,
            'name': self.name,
            'title': self.title,
            'browser_title': self.browser_title,
            'description': self.description,
            'tag_ids': self.tag_ids,
            'child_node_id': self.child_node_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ViewContainer':
        """Create ViewContainer from dictionary."""
        config = data.get('config', {})
        view = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            path=config.get('path', ''),
            name=config.get('name', ''),
            title=config.get('title', ''),
            browser_title=config.get('browser_title', ''),
            description=config.get('description'),
            tag_ids=config.get('tag_ids', []),
            child_node_id=config.get('child_node_id'),
        )
        logger.debug(f"ViewContainer.from_dict: comp_id={view.comp_id}, path={view.path}")
        return view

    def __repr__(self) -> str:
        return f"ViewContainer(comp_id={self.comp_id}, path={self.path}, title={self.title})"


@dataclass
class ListContainer(Container):
    """
    ListContainer - container for list items.

    Displays children as a list, grid, or cards.

    Attributes:
        list_type: Type of items in the list ('View', 'Tag').
        display_mode: How to display items ('list', 'grid', 'cards').
        name: Optional display name for the list.
        show_name: Whether to show the list name.
    """
    type: str = field(default='ListContainer', init=False)
    list_type: str = "View"
    display_mode: str = "list"
    name: Optional[str] = None
    show_name: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"ListContainer.to_dict: comp_id={self.comp_id}, list_type={self.list_type}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get ListContainer configuration."""
        return {
            'list_type': self.list_type,
            'display_mode': self.display_mode,
            'name': self.name,
            'show_name': self.show_name,
            'child_node_id': self.child_node_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ListContainer':
        """Create ListContainer from dictionary."""
        config = data.get('config', {})
        container = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            list_type=config.get('list_type', 'View'),
            display_mode=config.get('display_mode', 'list'),
            name=config.get('name'),
            show_name=config.get('show_name', True),
            child_node_id=config.get('child_node_id'),
        )
        logger.debug(f"ListContainer.from_dict: comp_id={container.comp_id}, list_type={container.list_type}")
        return container

    def __repr__(self) -> str:
        return f"ListContainer(comp_id={self.comp_id}, list_type={self.list_type}, name={self.name})"


@dataclass
class InlineContainer(Container):
    """
    InlineContainer - inline content wrapper.

    Wraps content that should be displayed inline.
    """
    type: str = field(default='InlineContainer', init=False)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"InlineContainer.to_dict: comp_id={self.comp_id}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get InlineContainer configuration."""
        return {
            'child_node_id': self.child_node_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'InlineContainer':
        """Create InlineContainer from dictionary."""
        config = data.get('config', {})
        container = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            child_node_id=config.get('child_node_id'),
        )
        logger.debug(f"InlineContainer.from_dict: comp_id={container.comp_id}")
        return container

    def __repr__(self) -> str:
        return f"InlineContainer(comp_id={self.comp_id})"


@dataclass
class StyleContainer(Container):
    """
    StyleContainer - styling wrapper.

    Wraps content with styling options.

    Attributes:
        is_transparent: Whether the container background is transparent.
    """
    type: str = field(default='StyleContainer', init=False)
    is_transparent: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"StyleContainer.to_dict: comp_id={self.comp_id}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get StyleContainer configuration."""
        return {
            'is_transparent': self.is_transparent,
            'child_node_id': self.child_node_id,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StyleContainer':
        """Create StyleContainer from dictionary."""
        config = data.get('config', {})
        container = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            is_transparent=config.get('is_transparent', False),
            child_node_id=config.get('child_node_id'),
        )
        logger.debug(f"StyleContainer.from_dict: comp_id={container.comp_id}")
        return container

    def __repr__(self) -> str:
        return f"StyleContainer(comp_id={self.comp_id}, is_transparent={self.is_transparent})"
