#!/usr/bin/env python3
"""
Export Metadata Script

Generates metadata.json from the SQLite database.
Run this before building the Next.js static site.

Usage:
    python3 backend/export_metadata.py
"""

import sys
from pathlib import Path

# Add backend directory to path for imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import export_to_metadata_json, init_database

def main():
    print("Exporting metadata from SQLite database...")

    # Ensure database is initialized
    init_database()

    # Export to JSON
    export_to_metadata_json()

    # Verify the export
    metadata_path = Path(__file__).parent.parent / 'content' / 'metadata.json'
    if metadata_path.exists():
        print(f"✓ Successfully exported to {metadata_path}")
    else:
        print(f"✗ Failed to create {metadata_path}")
        sys.exit(1)


if __name__ == '__main__':
    main()
