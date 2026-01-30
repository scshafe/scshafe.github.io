#!/usr/bin/env python3
"""
View Tree Script

Fetches a view's node structure from the API and prints it as a tree.

Usage:
    python3 backend/view_tree.py <view_id>
    python3 backend/view_tree.py 1000001
"""

import sys
import requests
import argparse

API_BASE_URL = 'http://localhost:3001'


def fetch_resolved_view(view_id: int) -> dict | None:
    """Fetch the resolved view from the API."""
    try:
        resp = requests.get(f'{API_BASE_URL}/views/{view_id}/resolved')
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 404:
            print(f'Error: View {view_id} not found')
            return None
        else:
            print(f'Error: API returned {resp.status_code}')
            return None
    except requests.ConnectionError:
        print(f'Error: Could not connect to API at {API_BASE_URL}')
        print('Make sure the backend server is running (npm run author:server)')
        return None


def print_tree(components: list, prefix: str = '', is_last: bool = True, show_ids: bool = False):
    """Print components as a tree structure."""
    for i, comp in enumerate(components):
        is_last_item = (i == len(components) - 1)

        # Determine the connector
        if prefix == '':
            connector = ''
            child_prefix = ''
        else:
            connector = '└── ' if is_last_item else '├── '
            child_prefix = prefix + ('    ' if is_last_item else '│   ')

        # Build the component label
        comp_type = comp.get('type', 'Unknown')
        config = comp.get('config', {})

        # Add relevant config info based on type
        details = []
        if comp_type == 'Title':
            level = config.get('level', 'h1')
            details.append(level)
        elif comp_type == 'MarkdownEditor':
            content_key = config.get('contentKey', '')
            if content_key:
                details.append(f'key="{content_key}"')
        elif comp_type == 'List':
            list_type = config.get('listType', '')
            name = config.get('name', '')
            if name:
                details.append(f'"{name}"')
            if list_type:
                details.append(f'type={list_type}')
        elif comp_type == 'Experience':
            title = config.get('title', '')
            if title:
                details.append(f'"{title}"')
        elif comp_type == 'Alert':
            variant = config.get('variant', 'info')
            details.append(variant)
        elif comp_type == 'Information':
            style = config.get('style', 'default')
            details.append(style)
        elif comp_type == 'View':
            target = config.get('targetViewId', '')
            if target:
                details.append(f'target={target}')
        elif comp_type == 'PDFViewer':
            title = config.get('title', '')
            if title:
                details.append(f'"{title}"')
        elif comp_type == 'TagList':
            source = config.get('sourceType', 'custom')
            details.append(f'source={source}')

        # Build label
        label = comp_type
        if details:
            label += f' ({", ".join(details)})'

        # Add IDs if requested
        if show_ids:
            node_id = comp.get('node_id', '?')
            ref_id = comp.get('ref_id', '?')
            comp_id = comp.get('component_id', '?')
            label += f' [node={node_id}, ref={ref_id}, comp={comp_id}]'

        print(f'{prefix}{connector}{label}')

        # Print children
        children = comp.get('children', [])
        if children:
            for j, child in enumerate(children):
                is_last_child = (j == len(children) - 1)
                child_connector = '└── ' if is_last_child else '├── '

                # Build child label
                child_type = child.get('type', 'Unknown')
                child_config = child.get('config', {})
                child_details = []

                if child_type == 'Experience':
                    title = child_config.get('title', '')
                    if title:
                        child_details.append(f'"{title}"')
                elif child_type == 'View':
                    target = child_config.get('targetViewId', '')
                    if target:
                        child_details.append(f'target={target}')

                child_label = child_type
                if child_details:
                    child_label += f' ({", ".join(child_details)})'

                if show_ids:
                    child_node_id = child.get('node_id', '?')
                    child_ref_id = child.get('ref_id', '?')
                    child_comp_id = child.get('component_id', '?')
                    child_label += f' [node={child_node_id}, ref={child_ref_id}, comp={child_comp_id}]'

                next_prefix = child_prefix + ('    ' if is_last_child else '│   ')
                print(f'{child_prefix}{child_connector}{child_label}')

                # Recursively print nested children
                nested_children = child.get('children', [])
                if nested_children:
                    print_tree(nested_children, next_prefix, is_last_child, show_ids)


def main():
    parser = argparse.ArgumentParser(
        description='Display a view\'s node structure as a tree',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
    python3 backend/view_tree.py 1000001
    python3 backend/view_tree.py 1000001 --ids
    python3 backend/view_tree.py 1000001 -i
        '''
    )
    parser.add_argument('view_id', type=int, help='The view ID to display')
    parser.add_argument('-i', '--ids', action='store_true',
                        help='Show node, reference, and component IDs')

    args = parser.parse_args()

    view = fetch_resolved_view(args.view_id)
    if not view:
        sys.exit(1)

    # Print view header
    name = view.get('name', 'Unknown')
    path = view.get('path', '/')
    title = view.get('title', '')
    view_id = view.get('id', args.view_id)

    print(f'{name} (id={view_id})')
    print(f'├── path: {path}')
    print(f'├── title: "{title}"')

    components = view.get('components', [])
    print(f'└── components: ({len(components)} total)')

    if components:
        print_tree(components, '    ', True, args.ids)
    else:
        print('    (no components)')


if __name__ == '__main__':
    main()
