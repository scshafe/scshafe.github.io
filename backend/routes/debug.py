"""
Debug routes for the Author Mode Server.

Provides raw database access for development debugging.
"""

from flask import Blueprint, request, jsonify

from database import (
    get_row,
    get_all_rows,
    ALLOWED_TABLES,
)

debug_bp = Blueprint('debug', __name__)


@debug_bp.route('/raw/<table>/<row_id>', methods=['GET'])
def get_raw_row(table, row_id):
    """
    Get a raw database row as JSON (dev mode debug endpoint).

    Examples:
        GET /raw/views/view_abc123
        GET /raw/components/comp_def456
        GET /raw/posts/post_ghi789
        GET /raw/relationships/rel_jkl012
    """
    try:
        if table not in ALLOWED_TABLES:
            return jsonify({'error': f"Table '{table}' is not allowed"}), 400

        row = get_row(table, row_id)
        if not row:
            return jsonify({'error': f"Row '{row_id}' not found in table '{table}'"}), 404

        return jsonify(row)

    except Exception as e:
        print(f'Error getting raw row: {e}')
        return jsonify({'error': 'Failed to get raw row'}), 500


@debug_bp.route('/raw/<table>', methods=['GET'])
def get_raw_table(table):
    """
    Get all rows from a table as JSON (dev mode debug endpoint).

    Optional query params:
        ?type=<type> - Filter by type (view_type for views, component_type for components)

    Examples:
        GET /raw/views
        GET /raw/views?type=page
        GET /raw/components?type=experience
        GET /raw/relationships
    """
    try:
        if table not in ALLOWED_TABLES:
            return jsonify({'error': f"Table '{table}' is not allowed"}), 400

        type_filter = request.args.get('type')
        rows = get_all_rows(table, type_filter)

        return jsonify({
            'table': table,
            'count': len(rows),
            'rows': rows
        })

    except Exception as e:
        print(f'Error getting raw table: {e}')
        return jsonify({'error': 'Failed to get raw table'}), 500
