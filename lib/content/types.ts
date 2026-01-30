/**
 * Core entity types for the Views system.
 *
 * ID Naming Convention:
 * - All entity IDs use prefixed field names: node_id, ref_id, comp_id, tag_id, etc.
 * - This applies to both primary keys and foreign key references.
 * - IDs are immutable 32-bit unsigned integers, randomly generated.
 */

// ============ BRANDED ID TYPES ============

/**
 * Branded type for Node IDs.
 * Prevents accidental mixing of different ID types.
 */
export type NodeId = number & { readonly __brand: 'NodeId' };

/**
 * Branded type for Reference IDs.
 */
export type RefId = number & { readonly __brand: 'RefId' };

/**
 * Branded type for Component IDs.
 */
export type CompId = number & { readonly __brand: 'CompId' };

/**
 * Branded type for Tag IDs.
 */
export type TagId = number & { readonly __brand: 'TagId' };

/**
 * Branded type for Theme IDs.
 */
export type ThemeId = number & { readonly __brand: 'ThemeId' };

/**
 * Branded type for NavBar IDs.
 */
export type NavBarId = number & { readonly __brand: 'NavBarId' };

/**
 * Branded type for Footer IDs.
 */
export type FooterId = number & { readonly __brand: 'FooterId' };

/**
 * Create a typed NodeId from a number.
 */
export function asNodeId(n: number): NodeId {
  return n as NodeId;
}

/**
 * Create a typed RefId from a number.
 */
export function asRefId(n: number): RefId {
  return n as RefId;
}

/**
 * Create a typed CompId from a number.
 */
export function asCompId(n: number): CompId {
  return n as CompId;
}

/**
 * Create a typed TagId from a number.
 */
export function asTagId(n: number): TagId {
  return n as TagId;
}

// ============ COMPONENT TYPES ============

/**
 * Component type discriminator for all component types.
 * Matches backend entity types.
 */
export type ComponentType =
  // Containers
  | 'ViewContainer'    // Page/view definition
  | 'ListContainer'    // List of child components
  | 'InlineContainer'  // Inline grouping (future)
  | 'StyleContainer'   // Styled wrapper (future)
  // Units
  | 'SectionUnit'      // Section header (formerly Title)
  | 'PlainTextUnit'    // Plain text (formerly Information)
  | 'AlertUnit'        // Alert/warning box
  | 'MarkdownUnit'     // Markdown content (formerly MarkdownEditor)
  | 'LinkUnit'         // Link to view/URL (formerly View)
  // Media
  | 'ImageMedia'       // Image display (formerly MultiMedia for images)
  | 'VideoMedia'       // Video display
  | 'PDFMedia'         // PDF viewer (formerly PDFViewer)
  // Leaf components
  | 'ExperienceComponent'  // Work experience card
  | 'TagListComponent';    // Tag list display

/**
 * Container component types (have child_node_id).
 */
export type ContainerType = 'ViewContainer' | 'ListContainer' | 'InlineContainer' | 'StyleContainer';

/**
 * Unit component types (leaf nodes with content).
 */
export type UnitType = 'SectionUnit' | 'PlainTextUnit' | 'AlertUnit' | 'MarkdownUnit' | 'LinkUnit';

/**
 * Media component types (have src).
 */
export type MediaType = 'ImageMedia' | 'VideoMedia' | 'PDFMedia';

// ============ NODE ENTITY ============

/**
 * Node - represents position in the view tree structure.
 * Points to a reference, which points to a component.
 *
 * Tree navigation via doubly-linked sibling list:
 * - parent_node_id: Parent node (null for root)
 * - previous_node_id: Previous sibling (null if first)
 * - next_node_id: Next sibling (null if last)
 */
export interface Node {
  node_id: NodeId;
  ref_id: RefId;
  parent_node_id: NodeId | null;
  previous_node_id: NodeId | null;
  next_node_id: NodeId | null;
  created_at?: string;
  updated_at?: string;
}

// ============ REFERENCE ENTITY ============

/**
 * Reference - the indirection layer between nodes and components.
 * Allows shared components with per-location config overrides.
 */
export interface Reference {
  ref_id: RefId;
  node_id: NodeId;
  comp_id: CompId;
  overrides?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// ============ COMPONENT BASE ============

/**
 * Base component interface - all components extend this.
 */
export interface ComponentBase {
  comp_id: CompId;
  type: ComponentType;
  reference_count: number;
  created_at?: string;
  updated_at?: string;
}

// ============ CONTAINER COMPONENTS ============

/**
 * ViewContainer - a page/view definition.
 */
export interface ViewContainer extends ComponentBase {
  type: 'ViewContainer';
  path: string;
  name: string;
  title: string;
  browser_title?: string;
  description?: string;
  child_node_id?: NodeId | null;
}

/**
 * ListContainer - a list of child components.
 */
export interface ListContainer extends ComponentBase {
  type: 'ListContainer';
  name?: string;
  display_mode: 'list' | 'grid' | 'cards';
  show_name?: boolean;
  collapsible?: boolean;
  default_expanded?: boolean;
  show_add_button?: boolean;
  max_items?: number;
  child_node_id?: NodeId | null;
}

/**
 * StyleContainer - styling wrapper for child components.
 */
export interface StyleContainer extends ComponentBase {
  type: 'StyleContainer';
  is_transparent?: boolean;
  child_node_id?: NodeId | null;
}

// ============ UNIT COMPONENTS ============

/**
 * SectionUnit - section header (formerly Title).
 */
export interface SectionUnit extends ComponentBase {
  type: 'SectionUnit';
  title: string;
  level: 'h1' | 'h2' | 'h3';
  show_title: boolean;
}

/**
 * PlainTextUnit - plain text content (formerly Information).
 */
export interface PlainTextUnit extends ComponentBase {
  type: 'PlainTextUnit';
  content: string;
  style: 'default' | 'callout' | 'card';
}

/**
 * AlertUnit - alert/warning box.
 */
export interface AlertUnit extends ComponentBase {
  type: 'AlertUnit';
  content: string;
  variant: 'info' | 'warning' | 'error' | 'success';
  dismissible?: boolean;
}

/**
 * MarkdownUnit - markdown content (formerly MarkdownEditor).
 */
export interface MarkdownUnit extends ComponentBase {
  type: 'MarkdownUnit';
  content: string;
  content_key?: string;
  placeholder?: string;
}

/**
 * LinkUnit - link to view or URL (formerly View).
 */
export interface LinkUnit extends ComponentBase {
  type: 'LinkUnit';
  label: string;
  icon?: string;
  target_node_id?: NodeId | null;
  target_url?: string;
  display_style: 'link' | 'card' | 'button';
  show_description?: boolean;
}

// ============ MEDIA COMPONENTS ============

/**
 * ImageMedia - image display.
 */
export interface ImageMedia extends ComponentBase {
  type: 'ImageMedia';
  src: string;
  alt?: string;
  caption?: string;
  aspect_ratio?: string;
}

/**
 * VideoMedia - video display.
 */
export interface VideoMedia extends ComponentBase {
  type: 'VideoMedia';
  src: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/**
 * PDFMedia - PDF viewer.
 */
export interface PDFMedia extends ComponentBase {
  type: 'PDFMedia';
  src: string;
  title?: string;
  height?: string;
  display_title?: boolean;
}

// ============ LEAF COMPONENTS ============

/**
 * ExperienceComponent - work experience card.
 */
export interface ExperienceComponent extends ComponentBase {
  type: 'ExperienceComponent';
  position: string;
  company: string;
  start_date: string;
  end_date: string;
  image?: string;
  content: string;
}

/**
 * TagListComponent - tag list display.
 */
export interface TagListComponent extends ComponentBase {
  type: 'TagListComponent';
  custom_tags?: string[];
}

// ============ COMPONENT UNION ============

/**
 * Union type for all components.
 */
export type Component =
  | ViewContainer
  | ListContainer
  | StyleContainer
  | SectionUnit
  | PlainTextUnit
  | AlertUnit
  | MarkdownUnit
  | LinkUnit
  | ImageMedia
  | VideoMedia
  | PDFMedia
  | ExperienceComponent
  | TagListComponent;

// ============ RESOLVED TYPES ============

/**
 * Resolved Node - a node with its reference and component data merged.
 * This is what the frontend receives after resolution.
 */
export interface ResolvedNode {
  node_id: NodeId;
  ref_id: RefId;
  comp_id: CompId;
  type: ComponentType;
  config: Record<string, unknown>;
  children: ResolvedNode[];
}

/**
 * View with resolved components - ready for rendering.
 */
export interface ResolvedView {
  comp_id: CompId;
  path: string;
  name: string;
  title: string;
  browser_title?: string;
  description?: string;
  is_home?: boolean;
  root_node_id?: NodeId;
  components: ResolvedNode[];
  reference_count?: number;
  created_at?: string;
  updated_at?: string;
}

// ============ SETTINGS TYPES ============

/**
 * Tag entity for content categorization.
 */
export interface Tag {
  tag_id: TagId;
  label: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Theme entity for visual styling.
 */
export interface Theme {
  theme_id: ThemeId;
  name: string;
  color_scheme: 'system' | 'light' | 'dark';
  created_at?: string;
  updated_at?: string;
}

/**
 * Internal link to a view within the site.
 */
export interface InternalLink {
  basic_link_id: number;
  label: string;
  icon?: string;
  view_node_id: NodeId;
  section_node_id?: NodeId;
}

/**
 * External link to a URL outside the site.
 */
export interface ExternalLink {
  basic_link_id: number;
  label: string;
  icon?: string;
  url: string;
}

/**
 * NavBar item for header navigation.
 */
export interface NavBar {
  nav_bar_id: NavBarId;
  position: 'left' | 'right';
  order: number;
  internal_link?: InternalLink;
  created_at?: string;
  updated_at?: string;
}

/**
 * Footer item for footer navigation.
 */
export interface Footer {
  footer_id: FooterId;
  position: 'left' | 'right';
  order: number;
  internal_link?: InternalLink;
  created_at?: string;
  updated_at?: string;
}

/**
 * Site configuration.
 */
export interface SiteConfig {
  site_name: string;
  default_home_link?: InternalLink;
}

