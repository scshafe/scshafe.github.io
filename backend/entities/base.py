"""
Base entity class and ID generation utilities.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any
import random
import logging

logger = logging.getLogger(__name__)


def generate_id() -> int:
    """
    Generate a random 32-bit unsigned integer ID.

    Returns:
        A random integer between 0 and 2^32 - 1.
    """
    new_id = random.randint(0, 0xFFFFFFFF)
    logger.debug(f"Generated new ID: {new_id}")
    return new_id


def current_timestamp() -> str:
    """Get current ISO timestamp."""
    return datetime.now().isoformat()


@dataclass
class Entity(ABC):
    """
    Abstract base class for all entities with timestamps.

    All entities have created_at and updated_at timestamps that are
    automatically set on creation and updated on modification.
    """
    created_at: str = field(default_factory=current_timestamp)
    updated_at: str = field(default_factory=current_timestamp)

    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert entity to dictionary for JSON serialization.

        Returns:
            Dictionary representation of the entity.
        """
        pass

    @classmethod
    @abstractmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Entity':
        """
        Create entity from dictionary.

        Args:
            data: Dictionary containing entity data.

        Returns:
            New entity instance.
        """
        pass

    def update_timestamp(self) -> None:
        """Update the updated_at timestamp to current time."""
        self.updated_at = current_timestamp()
        logger.debug(f"Updated timestamp for {self.__class__.__name__}: {self.updated_at}")

    def _base_dict(self) -> Dict[str, Any]:
        """
        Get base dictionary with timestamps.

        Returns:
            Dictionary with created_at and updated_at fields.
        """
        return {
            'created_at': self.created_at,
            'updated_at': self.updated_at,
        }
