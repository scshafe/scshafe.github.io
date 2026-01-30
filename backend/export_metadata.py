#!/usr/bin/env python3
"""
Export Metadata Script

Generates metadata.json from the JSON file database.
Run this before building the Next.js static site.

New Architecture:
- Reads from content/views/*.json, content/components/{Type}/*.json,
  content/references/*.json, content/nodes/*.json
- Resolves the entity tree (views -> nodes -> references -> components)
- Outputs flattened metadata.json for static site generation

Usage:
    python3 backend/export_metadata.py
"""

import sys
from pathlib import Path

# Add backend directory to path for imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import export_to_metadata_json, init_database, validate_integrity


def main():
    print("=" * 60)
    print("Export Metadata to metadata.json")
    print("=" * 60)
    print()

    # Ensure database is initialized
    print("Initializing database...")
    init_database()

    # Validate data integrity before export
    print("Validating data integrity...")
    errors = validate_integrity()

    if errors:
        print("\n⚠️  Data integrity issues found:")
        for error in errors[:10]:  # Show first 10 errors
            print(f"  - {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")
        print()

        response = input("Continue with export anyway? (y/N): ").strip().lower()
        if response != 'y':
            print("Export cancelled.")
            sys.exit(1)
    else:
        print("✓ Data integrity validated")

    # Export to JSON
    print("\nExporting metadata...")
    success = export_to_metadata_json()

    if not success:
        print("✗ Export failed")
        sys.exit(1)

    # Verify the export
    metadata_path = Path(__file__).parent.parent / 'content' / 'metadata.json'
    if metadata_path.exists():
        # Get file size
        size_kb = metadata_path.stat().st_size / 1024
        print(f"\n✓ Successfully exported to {metadata_path}")
        print(f"  File size: {size_kb:.1f} KB")
    else:
        print(f"\n✗ Failed to create {metadata_path}")
        sys.exit(1)


if __name__ == '__main__':
    main()
