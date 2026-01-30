"""
Reference entity - indirection layer between nodes and components.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

from .base import Entity, generate_id, current_timestamp

logger = logging.getLogger(__name__)


@dataclass
class Reference(Entity):
    """
    Reference entity providing indirection between nodes and components.

    References enable component sharing (multiple nodes can reference the same
    component) and location-specific overrides.

    Attributes:
        ref_id: Primary key - unique identifier for this reference.
        node_id: Foreign key back to the owning Node (1:1 relationship).
        comp_id: Foreign key to the Component this reference points to.
        overrides: Optional dict of config overrides for this location.
    """
    ref_id: int = field(default_factory=generate_id)
    node_id: int = 0
    comp_id: int = 0
    overrides: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert reference to dictionary for JSON serialization."""
        result = {
            'ref_id': self.ref_id,
            'node_id': self.node_id,
            'comp_id': self.comp_id,
            'overrides': self.overrides,
            **self._base_dict(),
        }
        logger.debug(f"Reference.to_dict: ref_id={self.ref_id}, comp_id={self.comp_id}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Reference':
        """Create reference from dictionary."""
        ref = cls(
            ref_id=data['ref_id'],
            node_id=data['node_id'],
            comp_id=data['comp_id'],
            overrides=data.get('overrides'),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
        )
        logger.debug(f"Reference.from_dict: ref_id={ref.ref_id}, node_id={ref.node_id}, comp_id={ref.comp_id}")
        return ref

    def merge_config(self, base_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge base component config with this reference's overrides.

        Args:
            base_config: The component's base configuration.

        Returns:
            Merged configuration with overrides applied.
        """
        if not self.overrides:
            return base_config.copy()

        merged = base_config.copy()
        merged.update(self.overrides)
        logger.debug(f"Reference.merge_config: ref_id={self.ref_id}, overrides={self.overrides}")
        return merged

    def __repr__(self) -> str:
        return (
            f"Reference(ref_id={self.ref_id}, node_id={self.node_id}, "
            f"comp_id={self.comp_id}, overrides={self.overrides is not None})"
        )
