"""
Component base classes - abstract hierarchy for all components.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

from .base import Entity, generate_id, current_timestamp

logger = logging.getLogger(__name__)


@dataclass
class Component(Entity, ABC):
    """
    Abstract base class for all components.

    Components hold content and configuration. They are typed and reusable
    across multiple locations via References.

    Attributes:
        comp_id: Primary key - unique identifier for this component.
        type: Discriminator field indicating the component type.
        reference_count: Number of References pointing to this component.
    """
    comp_id: int = field(default_factory=generate_id)
    type: str = ""
    reference_count: int = 0

    def _component_base_dict(self) -> Dict[str, Any]:
        """Get base dictionary for all components."""
        return {
            'comp_id': self.comp_id,
            'type': self.type,
            'reference_count': self.reference_count,
            **self._base_dict(),
        }

    def increment_reference_count(self) -> None:
        """Increment the reference count."""
        self.reference_count += 1
        self.update_timestamp()
        logger.debug(f"Component {self.comp_id} reference_count incremented to {self.reference_count}")

    def decrement_reference_count(self) -> None:
        """Decrement the reference count."""
        if self.reference_count > 0:
            self.reference_count -= 1
            self.update_timestamp()
            logger.debug(f"Component {self.comp_id} reference_count decremented to {self.reference_count}")
        else:
            logger.warning(f"Component {self.comp_id} reference_count already 0, cannot decrement")

    @abstractmethod
    def get_config(self) -> Dict[str, Any]:
        """
        Get the component's configuration.

        Returns:
            Dictionary of component-specific configuration.
        """
        pass


@dataclass
class Container(Component, ABC):
    """
    Abstract base class for container components.

    Containers can have child nodes, forming the tree structure.
    The child_node_id points to the first child in a linked list.

    Attributes:
        child_node_id: Foreign key to first child Node (null if no children).
    """
    child_node_id: Optional[int] = None

    def _container_base_dict(self) -> Dict[str, Any]:
        """Get base dictionary for containers."""
        base = self._component_base_dict()
        # child_node_id is part of config, not top-level
        return base

    def has_children(self) -> bool:
        """Check if this container has children."""
        return self.child_node_id is not None


@dataclass
class UnitComponent(Component, ABC):
    """
    Abstract base class for unit (leaf) components.

    Unit components don't have children - they represent content.
    """
    pass


@dataclass
class MediaUnit(UnitComponent, ABC):
    """
    Abstract base class for media components.

    Media components display external content like images, videos, or PDFs.

    Attributes:
        src: Path to the media resource (internal or external).
    """
    src: str = ""

    def _media_config(self) -> Dict[str, Any]:
        """Get base media configuration."""
        return {
            'src': self.src,
        }
