"""
Node entity - tree structure position.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

from .base import Entity, generate_id, current_timestamp

logger = logging.getLogger(__name__)


@dataclass
class Node(Entity):
    """
    Node entity representing a position in the tree structure.

    Nodes form a doubly-linked list within their parent container,
    with each node pointing to a Reference via ref_id.

    Attributes:
        node_id: Primary key - unique identifier for this node.
        ref_id: Foreign key to the Reference this node points to.
        parent_node_id: Foreign key to parent node (null for root nodes).
        previous_node_id: Foreign key to previous sibling in linked list.
        next_node_id: Foreign key to next sibling in linked list.
    """
    node_id: int = field(default_factory=generate_id)
    ref_id: int = 0
    parent_node_id: Optional[int] = None
    previous_node_id: Optional[int] = None
    next_node_id: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert node to dictionary for JSON serialization."""
        result = {
            'node_id': self.node_id,
            'ref_id': self.ref_id,
            'parent_node_id': self.parent_node_id,
            'previous_node_id': self.previous_node_id,
            'next_node_id': self.next_node_id,
            **self._base_dict(),
        }
        logger.debug(f"Node.to_dict: node_id={self.node_id}")
        return result

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Node':
        """Create node from dictionary."""
        node = cls(
            node_id=data['node_id'],
            ref_id=data['ref_id'],
            parent_node_id=data.get('parent_node_id'),
            previous_node_id=data.get('previous_node_id'),
            next_node_id=data.get('next_node_id'),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
        )
        logger.debug(f"Node.from_dict: node_id={node.node_id}, ref_id={node.ref_id}")
        return node

    def __repr__(self) -> str:
        return (
            f"Node(node_id={self.node_id}, ref_id={self.ref_id}, "
            f"parent={self.parent_node_id}, prev={self.previous_node_id}, "
            f"next={self.next_node_id})"
        )
