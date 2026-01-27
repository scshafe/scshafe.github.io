/**
 * Views System Types
 *
 * Defines the structure for the configurable views system that replaces
 * hardcoded pages with user-defined page structures.
 */

// Component type definitions
export type ViewComponentType =
  | 'Title' // Displays view's title/label
  | 'View' // Link to a sub-view
  | 'Information' // Text/info block
  | 'Alert' // Alert/warning box
  | 'MultiMedia' // Media content (images, video)
  | 'MarkdownEditor' // Editable markdown content
  | 'ExperienceList' // Existing experience list component
  | 'PDFViewer' // PDF display
  | 'TagList' // Tag display/filtering
  | 'BlogPostsList'; // List of blog posts with filtering

// Base component configuration
export interface ViewComponentBase {
  id: string; // Unique identifier
  type: ViewComponentType;
  parentId?: string; // ID of the containing view
  visible?: boolean; // Default: true
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
    targetViewId: string; // ID of the sub-view to link to
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

// ExperienceList component - existing experience list
export interface ExperienceListComponent extends ViewComponentBase {
  type: 'ExperienceList';
  config: {
    name?: string; // Display name/header for the list
    showName?: boolean; // Toggle for displaying the name
    collapsible?: boolean; // In publish mode, allow collapsing with chevron
    defaultExpanded?: boolean; // Default state when collapsible
    showAddButton?: boolean; // In author mode
    maxItems?: number; // Limit display
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

// BlogPostsList component - list of blog posts
export interface BlogPostsListComponent extends ViewComponentBase {
  type: 'BlogPostsList';
  config: {
    showTags?: boolean;
    showSearch?: boolean;
    maxPosts?: number;
    filterByCategory?: string;
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
  | ExperienceListComponent
  | PDFViewerComponent
  | TagListComponent
  | BlogPostsListComponent;

// View definition
export interface View {
  id: string; // Unique identifier (used in paths)
  type?: 'View'; // Type identifier
  parentId?: string; // ID of containing views config
  path: string; // URL path (e.g., "/blog", "/blog/archive")
  name: string; // Config name (internal reference)
  title: string; // Displayed title on page
  browserTitle: string; // Browser tab title
  description?: string; // Meta description
  isHome?: boolean; // If true, serves as root "/" path
  parentViewId?: string | null; // For sub-views (nesting)
  components: ViewComponent[]; // Ordered list of components
  content?: Record<string, string>; // Storage for markdown content keyed by contentKey
  createdAt?: string;
  updatedAt?: string;
}

// Views configuration in metadata.json
export interface ViewsConfig {
  id?: string; // Unique identifier
  type?: 'Views'; // Type identifier
  items?: View[]; // New structure with items array
  views?: View[]; // Legacy support
  defaultHomeViewId?: string; // ID of the view marked as home
}

// Reserved paths that cannot be used for views
export const RESERVED_PATHS = [
  '/settings',
  '/posts',
  '/category',
  '/feed.xml',
  '/api',
];

/**
 * Validate a view path
 */
export function validateViewPath(
  path: string,
  existingViews: View[],
  currentViewId?: string
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
 * Generate a unique ID for a view based on name
 */
export function generateViewId(name: string, existingViews: View[]): string {
  const baseId = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let id = baseId;
  let counter = 1;

  while (existingViews.some((v) => v.id === id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  return id;
}

/**
 * Generate a unique component ID
 */
export function generateComponentId(
  type: ViewComponentType,
  existingComponents: ViewComponent[],
  viewId?: string
): string {
  const prefix = viewId ? `comp-${viewId.replace('view-', '')}-` : 'comp-';
  const baseId = `${prefix}${type.toLowerCase()}`;
  let id = baseId;
  let counter = 1;

  while (existingComponents.some((c) => c.id === id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  return id;
}

/**
 * Create a default view
 */
export function createDefaultView(existingViews: View[]): View {
  const baseId = generateViewId('new-view', existingViews);
  const id = `view-${baseId}`;
  return {
    id,
    type: 'View',
    parentId: 'views',
    path: `/${baseId}`,
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
  existingComponents: ViewComponent[],
  viewId?: string
): ViewComponent {
  const id = generateComponentId(type, existingComponents, viewId);

  switch (type) {
    case 'Title':
      return {
        id,
        type: 'Title',
        config: { showTitle: true, level: 'h1' },
      };
    case 'View':
      return {
        id,
        type: 'View',
        config: { targetViewId: '', displayStyle: 'link', showDescription: true },
      };
    case 'Information':
      return {
        id,
        type: 'Information',
        config: { content: '', style: 'default' },
      };
    case 'Alert':
      return {
        id,
        type: 'Alert',
        config: { content: '', variant: 'info', dismissible: false },
      };
    case 'MultiMedia':
      return {
        id,
        type: 'MultiMedia',
        config: { mediaType: 'image', src: '', alt: '' },
      };
    case 'MarkdownEditor':
      return {
        id,
        type: 'MarkdownEditor',
        config: { contentKey: id, placeholder: 'Add content...' },
      };
    case 'ExperienceList':
      return {
        id,
        type: 'ExperienceList',
        config: {
          name: 'Experience',
          showName: true,
          collapsible: true,
          defaultExpanded: true,
          showAddButton: true,
        },
      };
    case 'PDFViewer':
      return {
        id,
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
        id,
        type: 'TagList',
        config: { sourceType: 'posts', linkToFilter: true },
      };
    case 'BlogPostsList':
      return {
        id,
        type: 'BlogPostsList',
        config: { showTags: true, showSearch: false },
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
      type: 'ExperienceList',
      label: 'Experience List',
      description: 'List of experiences',
    },
    { type: 'PDFViewer', label: 'PDF Viewer', description: 'Display a PDF' },
    { type: 'TagList', label: 'Tag List', description: 'Display tags' },
    {
      type: 'BlogPostsList',
      label: 'Blog Posts',
      description: 'List of blog posts',
    },
  ];
}
