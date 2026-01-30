/**
 * Views System Types and Utilities
 *
 * Defines the structure for the configurable views system.
 *
 * Architecture:
 * - View -> root_node_id -> Node -> ref_id -> Reference -> comp_id -> Component
 * - All IDs use prefixed field names (node_id, ref_id, comp_id, etc.)
 */

import {
  NodeId,
  RefId,
  CompId,
  ComponentType,
  asNodeId,
  asCompId,
  Node,
  Reference,
  Component,
  ComponentBase,
  ViewContainer,
  ListContainer,
  StyleContainer,
  SectionUnit,
  PlainTextUnit,
  AlertUnit,
  MarkdownUnit,
  LinkUnit,
  ImageMedia,
  VideoMedia,
  PDFMedia,
  ExperienceComponent,
  TagListComponent,
  ResolvedNode,
  ResolvedView,
} from './types';

// Re-export types from types.ts
export * from './types';

// ============ VIEW TYPES ============

/**
 * View type determines visibility and behavior
 */
export type ViewType = 'page' | 'settings';

/**
 * Types that can be contained in a ListContainer
 */
export type ListItemType =
  | 'ExperienceComponent'
  | 'PlainTextUnit'
  | 'LinkUnit'
  | 'ImageMedia';

// ============ CONSTANTS ============

/**
 * Reserved paths that cannot be used for views
 */
export const RESERVED_PATHS = [
  '/settings',
  '/api',
];

// ============ ID GENERATION ============

/**
 * Generate a random ID as an integer < 2^32.
 */
export function generateId(): NodeId {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return asNodeId(array[0]);
  }
  return asNodeId(Math.floor(Math.random() * 0xFFFFFFFF));
}

/**
 * Generate a CompId
 */
export function generateCompId(): CompId {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return asCompId(array[0]);
  }
  return asCompId(Math.floor(Math.random() * 0xFFFFFFFF));
}

// ============ VALIDATION ============

/**
 * Validate a view path
 */
export function validateViewPath(
  path: string,
  existingViews: ResolvedView[],
  currentCompId?: CompId
): { valid: boolean; error?: string } {
  const normalized = path.startsWith('/') ? path : '/' + path;

  for (const reserved of RESERVED_PATHS) {
    if (normalized === reserved || normalized.startsWith(reserved + '/')) {
      return {
        valid: false,
        error: `Path "${reserved}" is reserved for system use`,
      };
    }
  }

  const conflictingView = existingViews.find(
    (v) =>
      v.comp_id !== currentCompId &&
      (v.path === normalized ||
        v.path === normalized + '/' ||
        normalized === v.path + '/')
  );

  if (conflictingView) {
    return {
      valid: false,
      error: `Path conflicts with existing view "${conflictingView.name}"`,
    };
  }

  const pathRegex = /^\/[a-z0-9\-\/]*$/i;
  if (normalized !== '/' && !pathRegex.test(normalized)) {
    return {
      valid: false,
      error: 'Path can only contain letters, numbers, hyphens, and forward slashes',
    };
  }

  return { valid: true };
}

// ============ COMPONENT TYPE OPTIONS ============

/**
 * Get all component types with their display names
 */
export function getComponentTypeOptions(): {
  type: ComponentType;
  label: string;
  description: string;
}[] {
  return [
    { type: 'SectionUnit', label: 'Section', description: "Display a section header" },
    { type: 'LinkUnit', label: 'Link', description: 'Link to another view or URL' },
    { type: 'PlainTextUnit', label: 'Text', description: 'Plain text content' },
    { type: 'AlertUnit', label: 'Alert', description: 'Alert or warning box' },
    { type: 'ImageMedia', label: 'Image', description: 'Display an image' },
    { type: 'VideoMedia', label: 'Video', description: 'Display a video' },
    { type: 'MarkdownUnit', label: 'Markdown', description: 'Editable markdown content' },
    { type: 'ListContainer', label: 'List', description: 'List container for child components' },
    { type: 'StyleContainer', label: 'Style', description: 'Styling wrapper for content' },
    { type: 'ExperienceComponent', label: 'Experience', description: 'Work experience card' },
    { type: 'PDFMedia', label: 'PDF Viewer', description: 'Display a PDF' },
    { type: 'TagListComponent', label: 'Tag List', description: 'Display tags' },
  ];
}

// ============ COMPONENT HIERARCHY ============

export interface ComponentHierarchyNode {
  id: string;
  label: string;
  description: string;
  type?: ComponentType; // Only leaf nodes have a type
  children?: ComponentHierarchyNode[];
}

/**
 * Get the component type hierarchy for hierarchical selection
 */
export function getComponentHierarchy(): ComponentHierarchyNode[] {
  return [
    {
      id: 'container',
      label: 'Container',
      description: 'Components that contain other components',
      children: [
        { id: 'ListContainer', type: 'ListContainer', label: 'List', description: 'Container for a list of items' },
        { id: 'StyleContainer', type: 'StyleContainer', label: 'Style', description: 'Styling wrapper for content' },
        // ViewContainer, InlineContainer are typically not user-added
      ],
    },
    {
      id: 'unit',
      label: 'Content',
      description: 'Content components (text, media, etc.)',
      children: [
        { id: 'SectionUnit', type: 'SectionUnit', label: 'Section', description: 'Section heading/title' },
        { id: 'PlainTextUnit', type: 'PlainTextUnit', label: 'Plain Text', description: 'Plain text content' },
        { id: 'AlertUnit', type: 'AlertUnit', label: 'Alert', description: 'Alert or warning box' },
        { id: 'MarkdownUnit', type: 'MarkdownUnit', label: 'Markdown', description: 'Rich markdown content' },
        { id: 'LinkUnit', type: 'LinkUnit', label: 'Link', description: 'Link to another view or URL' },
        {
          id: 'media',
          label: 'Media',
          description: 'Images, videos, and documents',
          children: [
            { id: 'ImageMedia', type: 'ImageMedia', label: 'Image', description: 'Display an image' },
            { id: 'VideoMedia', type: 'VideoMedia', label: 'Video', description: 'Embed a video' },
            { id: 'PDFMedia', type: 'PDFMedia', label: 'PDF', description: 'Embed a PDF document' },
          ],
        },
      ],
    },
    {
      id: 'specialized',
      label: 'Specialized',
      description: 'Specialized components for specific use cases',
      children: [
        { id: 'ExperienceComponent', type: 'ExperienceComponent', label: 'Experience', description: 'Work experience card' },
        { id: 'TagListComponent', type: 'TagListComponent', label: 'Tag List', description: 'Display content tags' },
      ],
    },
  ];
}

/**
 * Get list item type options for the ListContainer dropdown
 */
export function getListItemTypeOptions(): {
  type: ListItemType;
  label: string;
  description: string;
}[] {
  return [
    { type: 'ExperienceComponent', label: 'Experience', description: 'Work experience card' },
    { type: 'PlainTextUnit', label: 'Text', description: 'Plain text content' },
    { type: 'LinkUnit', label: 'Link', description: 'Link to another view' },
    { type: 'ImageMedia', label: 'Image', description: 'Display an image' },
  ];
}

// ============ VISIBILITY HELPERS ============

/**
 * Check if a view is visible based on view_type and mode
 */
export function isViewVisible(view: ResolvedView & { view_type?: ViewType }, isAuthorMode: boolean): boolean {
  const viewType = view.view_type || 'page';
  if (viewType === 'settings') {
    return isAuthorMode;
  }
  return true;
}

/**
 * Get visible views based on mode
 */
export function getVisibleViews(views: (ResolvedView & { view_type?: ViewType })[], isAuthorMode: boolean): (ResolvedView & { view_type?: ViewType })[] {
  return views.filter((view) => isViewVisible(view, isAuthorMode));
}
