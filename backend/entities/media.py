"""
Media component implementations.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
import logging

from .base import current_timestamp
from .component import MediaUnit

logger = logging.getLogger(__name__)


@dataclass
class ImageMedia(MediaUnit):
    """
    ImageMedia - image display (formerly MultiMedia for images).

    Displays an image with optional alt text and caption.

    Attributes:
        src: Path to the image file.
        alt: Alternative text for accessibility.
        caption: Optional caption displayed below the image.
    """
    type: str = field(default='ImageMedia', init=False)
    alt: Optional[str] = None
    caption: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"ImageMedia.to_dict: comp_id={self.comp_id}, src={self.src}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get ImageMedia configuration."""
        return {
            **self._media_config(),
            'alt': self.alt,
            'caption': self.caption,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ImageMedia':
        """Create ImageMedia from dictionary."""
        config = data.get('config', {})
        media = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            src=config.get('src', ''),
            alt=config.get('alt'),
            caption=config.get('caption'),
        )
        logger.debug(f"ImageMedia.from_dict: comp_id={media.comp_id}, src={media.src}")
        return media

    def __repr__(self) -> str:
        return f"ImageMedia(comp_id={self.comp_id}, src={self.src})"


@dataclass
class VideoMedia(MediaUnit):
    """
    VideoMedia - video display.

    Displays a video with optional autoplay.

    Attributes:
        src: Path to the video file or embed URL.
        autoplay: Whether to autoplay the video.
        muted: Whether to mute the video (often required for autoplay).
        controls: Whether to show video controls.
    """
    type: str = field(default='VideoMedia', init=False)
    autoplay: bool = False
    muted: bool = False
    controls: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"VideoMedia.to_dict: comp_id={self.comp_id}, src={self.src}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get VideoMedia configuration."""
        return {
            **self._media_config(),
            'autoplay': self.autoplay,
            'muted': self.muted,
            'controls': self.controls,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VideoMedia':
        """Create VideoMedia from dictionary."""
        config = data.get('config', {})
        media = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            src=config.get('src', ''),
            autoplay=config.get('autoplay', False),
            muted=config.get('muted', False),
            controls=config.get('controls', True),
        )
        logger.debug(f"VideoMedia.from_dict: comp_id={media.comp_id}, src={media.src}")
        return media

    def __repr__(self) -> str:
        return f"VideoMedia(comp_id={self.comp_id}, src={self.src})"


@dataclass
class PDFMedia(MediaUnit):
    """
    PDFMedia - PDF viewer (formerly PDFViewer).

    Displays an embedded PDF document.

    Attributes:
        src: Path to the PDF file.
        title: Optional title displayed above the PDF.
        height: Height of the PDF viewer.
        display_title: Whether to display the title.
    """
    type: str = field(default='PDFMedia', init=False)
    title: Optional[str] = None
    height: str = "600px"
    display_title: bool = True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            **self._component_base_dict(),
            'config': self.get_config(),
        }
        logger.debug(f"PDFMedia.to_dict: comp_id={self.comp_id}, src={self.src}")
        return result

    def get_config(self) -> Dict[str, Any]:
        """Get PDFMedia configuration."""
        return {
            **self._media_config(),
            'title': self.title,
            'height': self.height,
            'display_title': self.display_title,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PDFMedia':
        """Create PDFMedia from dictionary."""
        config = data.get('config', {})
        media = cls(
            comp_id=data['comp_id'],
            reference_count=data.get('reference_count', 0),
            created_at=data.get('created_at', current_timestamp()),
            updated_at=data.get('updated_at', current_timestamp()),
            src=config.get('src', ''),
            title=config.get('title'),
            height=config.get('height', '600px'),
            display_title=config.get('display_title', True),
        )
        logger.debug(f"PDFMedia.from_dict: comp_id={media.comp_id}, src={media.src}")
        return media

    def __repr__(self) -> str:
        return f"PDFMedia(comp_id={self.comp_id}, src={self.src}, title={self.title})"
