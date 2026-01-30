"""
Leaf component implementations - special-purpose components.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
import logging

from .base import current_timestamp
from .component import Component

logger = logging.getLogger(__name__)


@dataclass
class ExperienceComponent(Component):
    """
    ExperienceComponent - work experience card.

    Displays work experience with position, company, dates, and description.

    Attributes:
        position: Job title/position.
        company: Company name.
        start_date: Start date string.
        end_date: End date string (or "Present").
        image: Optional image path (e.g., company logo).
        content: Markdown description of the experience.
    """
    type: str = field(default='ExperienceComponent', init=False)
    position: str = ""
    company: str = ""
    start_date: str = ""
    end_date: str = ""
    image: Optional[str] = None
    content: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"ExperienceComponent.to_dict: comp_id={self.comp_id}, position={self.position}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get ExperienceComponent configuration."""
        return {
            'position': self.position,
            'company': self.company,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'image': self.image,
            'content': self.content,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ExperienceComponent':
        """Create ExperienceComponent from dictionary."""
        config = data.get('config', {})
        exp = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            position=config.get('position', ''),
            company=config.get('company', ''),
            start_date=config.get('start_date', ''),
            end_date=config.get('end_date', ''),
            image=config.get('image'),
            content=config.get('content', ''),
        )
        logger.debug(f"ExperienceComponent.from_dict: comp_id={exp.comp_id}, position={exp.position}")
        return exp

    def __repr__(self) -> str:
        return f"ExperienceComponent(comp_id={self.comp_id}, position={self.position}, company={self.company})"


@dataclass
class TagListComponent(Component):
    """
    TagListComponent - tag/category listing.

    Displays a list of custom tags.

    Attributes:
        custom_tags: List of custom tag strings.
    """
    type: str = field(default='TagListComponent', init=False)
    custom_tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"TagListComponent.to_dict: comp_id={self.comp_id}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get TagListComponent configuration."""
        return {
            'custom_tags': self.custom_tags,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TagListComponent':
        """Create TagListComponent from dictionary."""
        config = data.get('config', {})
        tag_list = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            custom_tags=config.get('custom_tags', []),
        )
        logger.debug(f"TagListComponent.from_dict: comp_id={tag_list.comp_id}")
        return tag_list

    def __repr__(self) -> str:
        return f"TagListComponent(comp_id={self.comp_id}, tags={len(self.custom_tags)})"
