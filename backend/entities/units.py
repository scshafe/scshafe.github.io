"""
Unit component implementations - leaf content components.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

from .base import generate_id, current_timestamp
from .component import UnitComponent

logger = logging.getLogger(__name__)


@dataclass
class SectionUnit(UnitComponent):
    """
    SectionUnit - section heading (formerly Title).

    Displays a heading with configurable level.

    Attributes:
        text: The heading text.
        level: Heading level ('h1', 'h2', 'h3').
    """
    type: str = field(default='SectionUnit', init=False)
    text: str = ""
    level: str = "h1"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"SectionUnit.to_dict: comp_id={self.comp_id}, text={self.text[:30] if self.text else ''}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get SectionUnit configuration."""
        return {
            'text': self.text,
            'level': self.level,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SectionUnit':
        """Create SectionUnit from dictionary."""
        config = data.get('config', {})
        unit = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            text=config.get('text', ''),
            level=config.get('level', 'h1'),
        )
        logger.debug(f"SectionUnit.from_dict: comp_id={unit.comp_id}")
        return unit

    def __repr__(self) -> str:
        return f"SectionUnit(comp_id={self.comp_id}, text={self.text[:20] if self.text else ''}...)"


@dataclass
class PlainTextUnit(UnitComponent):
    """
    PlainTextUnit - plain text content (formerly Information).

    Displays plain text without markdown formatting.

    Attributes:
        content: The plain text content.
    """
    type: str = field(default='PlainTextUnit', init=False)
    content: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"PlainTextUnit.to_dict: comp_id={self.comp_id}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get PlainTextUnit configuration."""
        return {
            'content': self.content,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PlainTextUnit':
        """Create PlainTextUnit from dictionary."""
        config = data.get('config', {})
        unit = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            content=config.get('content', ''),
        )
        logger.debug(f"PlainTextUnit.from_dict: comp_id={unit.comp_id}")
        return unit

    def __repr__(self) -> str:
        return f"PlainTextUnit(comp_id={self.comp_id}, content={self.content[:20] if self.content else ''}...)"


@dataclass
class AlertUnit(UnitComponent):
    """
    AlertUnit - alert/notification box (formerly Alert).

    Displays content in a styled alert box.

    Attributes:
        content: The alert content (can include markdown).
        variant: Alert style ('info', 'warning', 'error', 'success').
    """
    type: str = field(default='AlertUnit', init=False)
    content: str = ""
    variant: str = "info"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"AlertUnit.to_dict: comp_id={self.comp_id}, variant={self.variant}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get AlertUnit configuration."""
        return {
            'content': self.content,
            'variant': self.variant,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AlertUnit':
        """Create AlertUnit from dictionary."""
        config = data.get('config', {})
        unit = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            content=config.get('content', ''),
            variant=config.get('variant', 'info'),
        )
        logger.debug(f"AlertUnit.from_dict: comp_id={unit.comp_id}, variant={unit.variant}")
        return unit

    def __repr__(self) -> str:
        return f"AlertUnit(comp_id={self.comp_id}, variant={self.variant})"


@dataclass
class MarkdownUnit(UnitComponent):
    """
    MarkdownUnit - markdown content (formerly MarkdownEditor).

    Displays and optionally edits markdown content.

    Attributes:
        content: The markdown content.
    """
    type: str = field(default='MarkdownUnit', init=False)
    content: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"MarkdownUnit.to_dict: comp_id={self.comp_id}, content_length={len(self.content)}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get MarkdownUnit configuration."""
        return {
            'content': self.content,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MarkdownUnit':
        """Create MarkdownUnit from dictionary."""
        config = data.get('config', {})
        unit = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            content=config.get('content', ''),
        )
        logger.debug(f"MarkdownUnit.from_dict: comp_id={unit.comp_id}, content_length={len(unit.content)}")
        return unit

    def __repr__(self) -> str:
        return f"MarkdownUnit(comp_id={self.comp_id}, content_length={len(self.content)})"


@dataclass
class LinkUnit(UnitComponent):
    """
    LinkUnit - link display (formerly ViewLink).

    Displays a link to another view or external URL.
    The link details are stored in a BasicLink object.

    Attributes:
        basic_link: Embedded link object (InternalLink or ExternalLink).
    """
    type: str = field(default='LinkUnit', init=False)
    basic_link: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"LinkUnit.to_dict: comp_id={self.comp_id}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get LinkUnit configuration."""
        return {
            'basic_link': self.basic_link,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'LinkUnit':
        """Create LinkUnit from dictionary."""
        config = data.get('config', {})
        unit = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            basic_link=config.get('basic_link'),
        )
        logger.debug(f"LinkUnit.from_dict: comp_id={unit.comp_id}")
        return unit

    def __repr__(self) -> str:
        label = self.basic_link.get('label', '') if self.basic_link else ''
        return f"LinkUnit(comp_id={self.comp_id}, label={label})"
