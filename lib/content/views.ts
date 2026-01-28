/**
 * Views System Types
 *
 * Defines the structure for the configurable views system that replaces
 * hardcoded pages with user-defined page structures.
 *
 * Architecture:
 * - All entities derive from the Node interface for tree structure
 * - Views have types: 'page', 'settings' (dev-only), 'post'
 * - Components share a common structure with a type discriminator
 * - List component supports nested components via 'children'
 * - Experiences are stored as components with type 'Experience'
 */

// ============ NODE INTERFACE ============

/**
 * Node ID type - immutable, randomly assigned integer < 2^32.
 * IDs are not user-editable and only displayed in logs.
 */
export type NodeId = number;

/**
 * Node is the base interface for all tree-structured entities.
 * It provides the fundamental properties for tree navigation:
 * - id: Unique identifier for the node (integer < 2^32)
 * - parentId: ID of the parent node (null for root nodes)
 * - previousId: ID of the previous sibling (null if first child)
 */
export interface Node {
  id: NodeId;
  parentId: NodeId | null;
  previousId: NodeId | null;
}

/**
 * NodeType discriminator for all node types
 */
export type NodeType = 'View' | ViewComponentType;

// ============ VIEW TYPES ============

/**
 * View type determines visibility and behavior
 * - 'page': Regular content page
 * - 'settings': Only visible in author/dev mode
 * - 'post': Blog post page with additional metadata
 */
export type ViewType = 'page' | 'settings' | 'post';

// ============ COMPONENT TYPES ============

// Component type definitions
export type ViewComponentType =
  | 'Title' // Displays view's title/label
  | 'View' // Link to a sub-view
  | 'Information' // Text/info block
  | 'Alert' // Alert/warning box
  | 'MultiMedia' // Media content (images, video)
  | 'MarkdownEditor' // Editable markdown content
  | 'List' // Generic list container for nested components
  | 'Experience' // Individual experience item
  | 'BlogPost' // Individual blog post reference
  | 'PDFViewer' // PDF display
  | 'TagList'; // Tag display/filtering

// Types that can be contained in a List component
export type ListItemType = 'Experience' | 'Information' | 'View' | 'MultiMedia' | 'BlogPost';

// Base component configuration - extends Node
export interface ViewComponentBase extends Node {
  type: ViewComponentType;
  component_type?: ViewComponentType; // Alias for backend compatibility
  visible?: boolean; // Default: true
  children?: ViewComponent[]; // For nested components (List type)
}

// Title component - displays the view's title
export interface TitleComponent extends ViewComponentBase {
  type: 'Title';
  config: {
    showTitle: boolean; // Toggle for displaying view's label
    level?: 'h1' | 'h2' | 'h3'; // Heading level, default h1
  };
}

// View component - link to a sub-view
export interface ViewLinkComponent extends ViewComponentBase {
  type: 'View';
  config: {
    targetViewId: NodeId | null; // ID of the sub-view to link to
    displayStyle: 'link' | 'card' | 'button';
    showDescription?: boolean;
  };
}

// Information component - text/info block
export interface InformationComponent extends ViewComponentBase {
  type: 'Information';
  config: {
    content: string; // Markdown content
    style?: 'default' | 'callout' | 'card';
  };
}

// Alert component - alert/warning box
export interface AlertComponent extends ViewComponentBase {
  type: 'Alert';
  config: {
    content: string;
    variant: 'info' | 'warning' | 'error' | 'success';
    dismissible?: boolean;
  };
}

// MultiMedia component - media content
export interface MultiMediaComponent extends ViewComponentBase {
  type: 'MultiMedia';
  config: {
    mediaType: 'image' | 'video' | 'embed';
    src: string;
    alt?: string;
    caption?: string;
    aspectRatio?: string; // e.g., "16:9", "4:3"
  };
}

// MarkdownEditor component - editable markdown content
export interface MarkdownEditorComponent extends ViewComponentBase {
  type: 'MarkdownEditor';
  config: {
    contentKey: string; // Key in view's content storage
    placeholder?: string;
  };
}

// List component - generic container for nested components
export interface ListComponent extends ViewComponentBase {
  type: 'List';
  config: {
    listType: ListItemType; // Type of items this list holds
    displayMode: 'list' | 'grid' | 'cards';
    name?: string; // Display name/header for the list
    showName?: boolean; // Toggle for displaying the name
    collapsible?: boolean; // In publish mode, allow collapsing
    defaultExpanded?: boolean; // Default state when collapsible
    showAddButton?: boolean; // In author mode
    maxItems?: number; // Limit display
  };
  children: ViewComponent[]; // Nested components
}

// Experience component - individual experience item
export interface ExperienceComponent extends ViewComponentBase {
  type: 'Experience';
  config: {
    title: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    image?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    sort_order?: number;
  };
}

// PDFViewer component - PDF display
export interface PDFViewerComponent extends ViewComponentBase {
  type: 'PDFViewer';
  config: {
    title: string; // Display title for the PDF
    src: string; // Path to PDF
    height?: string; // e.g., "600px"
    displayTitle: boolean; // Toggle for displaying the title
    downloadButton: boolean; // Toggle for showing download button
    displayPdf: boolean; // Toggle for rendering PDF in browser on page load
  };
}

// TagList component - tag display/filtering
export interface TagListComponent extends ViewComponentBase {
  type: 'TagList';
  config: {
    sourceType: 'posts' | 'custom';
    customTags?: string[]; // If sourceType is 'custom'
    linkToFilter?: boolean; // Link tags to filter posts
  };
}

// BlogPost component - individual blog post reference (used inside List)
export interface BlogPostComponent extends ViewComponentBase {
  type: 'BlogPost';
  config: {
    postSlug: string; // Slug of the blog post to display
    showExcerpt?: boolean;
    showDate?: boolean;
    showTags?: boolean;
  };
}

// Union type for all components
export type ViewComponent =
  | TitleComponent
  | ViewLinkComponent
  | InformationComponent
  | AlertComponent
  | MultiMediaComponent
  | MarkdownEditorComponent
  | ListComponent
  | ExperienceComponent
  | BlogPostComponent
  | PDFViewerComponent
  | TagListComponent;

// ============ VIEW DEFINITION ============

// View definition - extends Node
export interface View extends Node {
  type?: 'View'; // Type identifier for object system
  view_type?: ViewType; // View type: 'page' | 'settings' | 'post'
  viewType?: ViewType; // Alias for frontend compatibility
  url_id?: string; // User-editable URL slug
  urlId?: string; // Alias for frontend compatibility
  path: string; // URL path (e.g., "/blog", "/blog/archive")
  name: string; // Config name (internal reference)
  title: string; // Displayed title on page
  browserTitle: string; // Browser tab title
  description?: string; // Meta description
  isHome?: boolean; // If true, serves as root "/" path
  parentViewId?: NodeId | null; // For sub-views (nesting) - deprecated, use parentId
  components: ViewComponent[]; // Ordered list of components
  content?: Record<string, string>; // Storage for markdown content keyed by contentKey
  createdAt?: string;
  updatedAt?: string;
}

// Views configuration in metadata.json
export interface ViewsConfig {
  id?: NodeId; // Unique identifier
  type?: 'Views'; // Type identifier
  items?: View[]; // New structure with items array
  views?: View[]; // Legacy support
  defaultHomeViewId?: NodeId; // ID of the view marked as home
}

// ============ CONSTANTS ============

// Reserved paths that cannot be used for views
export const RESERVED_PATHS = [
  '/settings',
  '/posts',
  '/category',
  '/feed.xml',
  '/api',
];

// ============ UTILITY FUNCTIONS ============

/**
 * Generate a random ID as an integer < 2^32.
 * IDs are immutable, randomly assigned, not user-editable, and only shown in logs.
 */
export function generateId(): NodeId {
  // Generate a random 32-bit unsigned integer (0 to 2^32 - 1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0];
  }
  // Fallback for older environments
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

/**
 * @deprecated Use generateId() instead. Kept for backward compatibility.
 */
export function generateUUID(): NodeId {
  return generateId();
}

/**
 * Validate a view path
 */
export function validateViewPath(
  path: string,
  existingViews: View[],
  currentViewId?: NodeId
): { valid: boolean; error?: string } {
  // Normalize
  const normalized = path.startsWith('/') ? path : '/' + path;

  // Check reserved paths
  for (const reserved of RESERVED_PATHS) {
    if (
      normalized === reserved ||
      normalized.startsWith(reserved + '/')
    ) {
      return {
        valid: false,
        error: `Path "${reserved}" is reserved for system use`,
      };
    }
  }

  // Check for conflicts with other views
  const conflictingView = existingViews.find(
    (v) =>
      v.id !== currentViewId &&
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

  // Validate format (alphanumeric, hyphens, slashes)
  const pathRegex = /^\/[a-z0-9\-\/]*$/i;
  if (normalized !== '/' && !pathRegex.test(normalized)) {
    return {
      valid: false,
      error:
        'Path can only contain letters, numbers, hyphens, and forward slashes',
    };
  }

  return { valid: true };
}

/**
 * Generate a unique ID for a view.
 * IDs are immutable, randomly assigned, not user-editable, and only shown in logs.
 */
export function generateViewId(_name: string, _existingViews: View[]): NodeId {
  return generateId();
}

/**
 * Generate a unique component ID.
 * IDs are immutable, randomly assigned, not user-editable, and only shown in logs.
 */
export function generateComponentId(
  _type: ViewComponentType,
  _existingComponents: ViewComponent[],
  _viewId?: NodeId
): NodeId {
  return generateId();
}

/**
 * Create a default view
 */
export function createDefaultView(
  _existingViews: View[],
  viewType: ViewType = 'page',
  parentId: NodeId | null = null,
  previousId: NodeId | null = null
): View {
  const id = generateId();
  // Generate a short path segment from the ID
  const pathSlug = `new-view-${id.toString().slice(0, 8)}`;
  return {
    id,
    parentId,
    previousId,
    type: 'View',
    view_type: viewType,
    viewType: viewType,
    path: `/${pathSlug}`,
    name: 'New View',
    title: 'New View',
    browserTitle: 'New View',
    description: '',
    isHome: false,
    parentViewId: null,
    components: [],
    content: {},
  };
}

/**
 * Create a default component of a given type
 */
export function createDefaultComponent(
  type: ViewComponentType,
  _existingComponents: ViewComponent[],
  parentId: NodeId | null = null,
  previousId: NodeId | null = null
): ViewComponent {
  const id = generateId();
  const baseNode = { id, parentId, previousId };

  switch (type) {
    case 'Title':
      return {
        ...baseNode,
        type: 'Title',
        config: { showTitle: true, level: 'h1' },
      };
    case 'View':
      return {
        ...baseNode,
        type: 'View',
        config: { targetViewId: null, displayStyle: 'link', showDescription: true },
      };
    case 'Information':
      return {
        ...baseNode,
        type: 'Information',
        config: { content: '', style: 'default' },
      };
    case 'Alert':
      return {
        ...baseNode,
        type: 'Alert',
        config: { content: '', variant: 'info', dismissible: false },
      };
    case 'MultiMedia':
      return {
        ...baseNode,
        type: 'MultiMedia',
        config: { mediaType: 'image', src: '', alt: '' },
      };
    case 'MarkdownEditor':
      return {
        ...baseNode,
        type: 'MarkdownEditor',
        config: { contentKey: `content-${id}`, placeholder: 'Add content...' },
      };
    case 'List':
      return {
        ...baseNode,
        type: 'List',
        config: {
          listType: 'Experience',
          displayMode: 'list',
          name: 'List',
          showName: true,
          collapsible: false,
          defaultExpanded: true,
          showAddButton: true,
        },
        children: [],
      };
    case 'Experience':
      return {
        ...baseNode,
        type: 'Experience',
        config: {
          title: '',
          company: '',
          startDate: '',
          endDate: '',
          image: '',
          backgroundColor: '',
          textColor: '',
          accentColor: '',
        },
      };
    case 'PDFViewer':
      return {
        ...baseNode,
        type: 'PDFViewer',
        config: {
          title: '',
          src: '',
          height: '600px',
          displayTitle: true,
          downloadButton: true,
          displayPdf: true,
        },
      };
    case 'TagList':
      return {
        ...baseNode,
        type: 'TagList',
        config: { sourceType: 'posts', linkToFilter: true },
      };
    case 'BlogPost':
      return {
        ...baseNode,
        type: 'BlogPost',
        config: { postSlug: '', showExcerpt: true, showDate: true, showTags: true },
      };
  }
}

/**
 * Get all component types with their display names
 */
export function getComponentTypeOptions(): {
  type: ViewComponentType;
  label: string;
  description: string;
}[] {
  return [
    { type: 'Title', label: 'Title', description: "Display the view's title" },
    { type: 'View', label: 'View Link', description: 'Link to another view' },
    {
      type: 'Information',
      label: 'Information',
      description: 'Text or info block',
    },
    { type: 'Alert', label: 'Alert', description: 'Alert or warning box' },
    {
      type: 'MultiMedia',
      label: 'MultiMedia',
      description: 'Image, video, or embed',
    },
    {
      type: 'MarkdownEditor',
      label: 'Markdown Content',
      description: 'Editable markdown content',
    },
    {
      type: 'List',
      label: 'List',
      description: 'List container for Experience, Information, View, or Media items',
    },
    {
      type: 'Experience',
      label: 'Experience',
      description: 'Individual experience item',
    },
    {
      type: 'BlogPost',
      label: 'Blog Post',
      description: 'Individual blog post reference',
    },
    { type: 'PDFViewer', label: 'PDF Viewer', description: 'Display a PDF' },
    { type: 'TagList', label: 'Tag List', description: 'Display tags' },
  ];
}

/**
 * Get list item type options for the List component dropdown
 */
export function getListItemTypeOptions(): {
  type: ListItemType;
  label: string;
  description: string;
}[] {
  return [
    { type: 'Experience', label: 'Experience', description: 'Work experience or role' },
    { type: 'Information', label: 'Information', description: 'Text or info block' },
    { type: 'View', label: 'View Link', description: 'Link to another view' },
    { type: 'MultiMedia', label: 'MultiMedia', description: 'Image, video, or embed' },
    { type: 'BlogPost', label: 'Blog Post', description: 'Blog post reference' },
  ];
}

/**
 * Check if a view is visible based on view_type and mode
 */
export function isViewVisible(view: View, isAuthorMode: boolean): boolean {
  const viewType = view.view_type || view.viewType || 'page';
  if (viewType === 'settings') {
    return isAuthorMode;
  }
  return true;
}

/**
 * Get visible views based on mode
 */
export function getVisibleViews(views: View[], isAuthorMode: boolean): View[] {
  return views.filter((view) => isViewVisible(view, isAuthorMode));
}

// ============ NODE SELECTORS ============

/**
 * Node store type - maps node IDs to nodes
 */
export type NodeStore<T extends Node = Node> = Record<NodeId, T>;

/**
 * Get a node by ID from a store
 */
export function selectNode<T extends Node>(
  store: NodeStore<T>,
  id: NodeId | null | undefined
): T | undefined {
  if (id === null || id === undefined) return undefined;
  return store[id];
}

/**
 * Get children of a node (nodes whose parentId matches the given id)
 * Returns children in order based on previousId chain
 */
export function selectChildren<T extends Node>(
  store: NodeStore<T>,
  parentId: NodeId | null
): T[] {
  const children = Object.values(store).filter(node => node.parentId === parentId);

  // Sort by previousId chain
  const ordered: T[] = [];
  const remaining = [...children];

  // Find first child (previousId is null)
  let current = remaining.find(node => node.previousId === null);

  while (current) {
    ordered.push(current);
    remaining.splice(remaining.indexOf(current), 1);
    // Find next sibling
    const nextId = current.id;
    current = remaining.find(node => node.previousId === nextId);
  }

  // Add any remaining children that weren't in the chain (fallback for malformed data)
  ordered.push(...remaining);

  return ordered;
}

/**
 * Get the next sibling of a node (node whose previousId matches this node's id)
 */
export function selectNextSibling<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId
): T | undefined {
  return Object.values(store).find(node => node.previousId === nodeId);
}

/**
 * Get the previous sibling of a node
 */
export function selectPreviousSibling<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId
): T | undefined {
  const node = store[nodeId];
  if (!node || node.previousId === null) return undefined;
  return store[node.previousId];
}

/**
 * Get all siblings of a node (including the node itself)
 */
export function selectSiblings<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId
): T[] {
  const node = store[nodeId];
  if (!node || node.parentId === null) return [node].filter(Boolean) as T[];
  return selectChildren(store, node.parentId);
}

/**
 * Get the parent of a node
 */
export function selectParent<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId
): T | undefined {
  const node = store[nodeId];
  if (!node || node.parentId === null) return undefined;
  return store[node.parentId];
}

/**
 * Get ancestors of a node (parent, grandparent, etc.)
 */
export function selectAncestors<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId
): T[] {
  const ancestors: T[] = [];
  let current = selectParent(store, nodeId);

  while (current) {
    ancestors.push(current);
    current = current.parentId !== null ? store[current.parentId] : undefined;
  }

  return ancestors;
}

/**
 * Get all descendants of a node (children, grandchildren, etc.)
 */
export function selectDescendants<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId
): T[] {
  const descendants: T[] = [];
  const queue = selectChildren(store, nodeId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    descendants.push(current);
    queue.push(...selectChildren(store, current.id));
  }

  return descendants;
}

/**
 * Convert a flat array of nodes to a NodeStore
 */
export function nodesToStore<T extends Node>(nodes: T[]): NodeStore<T> {
  return nodes.reduce((store, node) => {
    store[node.id] = node;
    return store;
  }, {} as NodeStore<T>);
}

/**
 * Convert a NodeStore back to an ordered array based on parent/previousId chains
 */
export function storeToNodes<T extends Node>(
  store: NodeStore<T>,
  rootParentId: NodeId | null = null
): T[] {
  return selectChildren(store, rootParentId);
}

// ============ NODE MUTATION HELPERS ============

/**
 * Insert a node after a specific sibling
 */
export function insertNodeAfter<T extends Node>(
  store: NodeStore<T>,
  newNode: T,
  afterNodeId: NodeId | null,
  parentId: NodeId | null
): NodeStore<T> {
  const updated = { ...store };

  // Set the new node's position
  updated[newNode.id] = {
    ...newNode,
    parentId,
    previousId: afterNodeId,
  };

  // Update the next sibling's previousId to point to the new node
  const nextSibling = afterNodeId !== null
    ? Object.values(store).find(n => n.previousId === afterNodeId)
    : Object.values(store).find(n => n.parentId === parentId && n.previousId === null);

  if (nextSibling && nextSibling.id !== newNode.id) {
    updated[nextSibling.id] = {
      ...nextSibling,
      previousId: newNode.id,
    };
  }

  return updated;
}

/**
 * Remove a node and update sibling links
 */
export function removeNode<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId
): NodeStore<T> {
  const node = store[nodeId];
  if (!node) return store;

  const updated = { ...store };

  // Find the next sibling and update its previousId
  const nextSibling = Object.values(store).find(n => n.previousId === nodeId);
  if (nextSibling) {
    updated[nextSibling.id] = {
      ...nextSibling,
      previousId: node.previousId,
    };
  }

  // Remove the node
  delete updated[nodeId];

  return updated;
}

/**
 * Move a node to a new position
 */
export function moveNode<T extends Node>(
  store: NodeStore<T>,
  nodeId: NodeId,
  newParentId: NodeId | null,
  afterNodeId: NodeId | null
): NodeStore<T> {
  // First remove from current position
  let updated = removeNode(store, nodeId);

  // Re-add the node
  const node = store[nodeId];
  if (node) {
    updated = insertNodeAfter(updated, node, afterNodeId, newParentId);
  }

  return updated;
}
