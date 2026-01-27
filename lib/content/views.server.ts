/**
 * Views Server Utilities
 *
 * Server-side functions for loading and resolving views.
 * - In development: fetches from Flask API (localhost:3001)
 * - In production: reads from metadata.json (generated at build time)
 */

import fs from 'fs';
import path from 'path';
import type { View, ViewsConfig } from './views';

const contentDirectory = path.join(process.cwd(), 'content');
const metadataPath = path.join(contentDirectory, 'metadata.json');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = 'http://localhost:3001';

interface Metadata {
  views?: ViewsConfig;
  [key: string]: unknown;
}

/**
 * Load metadata from JSON file (production only)
 */
function loadMetadataFromFile(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Fetch metadata from Flask API (development only)
 */
async function fetchMetadataFromAPI(): Promise<Metadata> {
  try {
    const response = await fetch(`${API_BASE_URL}/metadata`, {
      cache: 'no-store', // Always get fresh data in dev
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch from API, falling back to file:', error);
    // Fallback to file if API is not available
    return loadMetadataFromFile();
  }
}

/**
 * Load metadata - uses API in dev, file in production
 */
async function loadMetadata(): Promise<Metadata> {
  if (isDevelopment) {
    return fetchMetadataFromAPI();
  }
  return loadMetadataFromFile();
}

/**
 * Helper to get views array from config (supports both 'items' and 'views' keys)
 */
function getViewsArray(config: ViewsConfig): View[] {
  return config.items || config.views || [];
}

/**
 * Get the views configuration
 * - Development: fetches from Flask API
 * - Production: reads from metadata.json
 */
export async function getViewsConfig(): Promise<ViewsConfig> {
  const metadata = await loadMetadata();
  const config = metadata.views || {
    views: [],
    defaultHomeViewId: undefined,
  };
  // Normalize to always have views array for backward compatibility
  if (config.items && !config.views) {
    config.views = config.items;
  }
  return config;
}

/**
 * Resolve a view by its URL path
 */
export function resolveViewByPath(
  urlPath: string,
  viewsConfig: ViewsConfig
): View | null {
  // Normalize path
  const normalizedPath =
    urlPath === '/' ? '/' : urlPath.replace(/\/$/, '');

  // Check for home view first
  if (normalizedPath === '/') {
    // First check for explicit isHome flag
    const homeView = viewsConfig.views.find((v) => v.isHome === true);
    if (homeView) return homeView;

    // Fallback to defaultHomeViewId
    if (viewsConfig.defaultHomeViewId) {
      return (
        viewsConfig.views.find(
          (v) => v.id === viewsConfig.defaultHomeViewId
        ) || null
      );
    }

    // Fallback to view with "/" path
    return viewsConfig.views.find((v) => v.path === '/') || null;
  }

  // Direct path match
  const directMatch = viewsConfig.views.find(
    (v) =>
      v.path === normalizedPath || v.path === normalizedPath + '/'
  );

  return directMatch || null;
}

/**
 * Resolve a view by its ID
 */
export function resolveViewById(
  id: string,
  viewsConfig: ViewsConfig
): View | null {
  return viewsConfig.views.find((v) => v.id === id) || null;
}

/**
 * Get all view paths for static generation
 * Note: This is only called during build, so it reads from the file
 */
export async function getAllViewPaths(): Promise<string[][]> {
  // Always use file for static generation (build time)
  const metadata = loadMetadataFromFile();
  const config = metadata.views || { views: [], items: [] };
  const views = config.items || config.views || [];

  return views.map((view: View) => {
    if (view.path === '/' || view.isHome) {
      return []; // Empty array for root path
    }
    // Split path into segments, removing empty strings
    return view.path.split('/').filter(Boolean);
  });
}

/**
 * View tree node for hierarchical display
 */
export interface ViewTreeNode {
  view: View;
  children: ViewTreeNode[];
}

/**
 * Build a tree structure from views based on parentViewId
 */
export function buildViewTree(viewsConfig: ViewsConfig): ViewTreeNode[] {
  const viewsById = new Map(viewsConfig.views.map((v) => [v.id, v]));
  const rootNodes: ViewTreeNode[] = [];

  // Find root views (no parent or null parent)
  for (const view of viewsConfig.views) {
    if (!view.parentViewId) {
      rootNodes.push(buildTreeNode(view, viewsById, viewsConfig.views));
    }
  }

  return rootNodes;
}

/**
 * Build a single tree node recursively
 */
function buildTreeNode(
  view: View,
  viewsById: Map<string, View>,
  allViews: View[]
): ViewTreeNode {
  const children = allViews
    .filter((v) => v.parentViewId === view.id)
    .map((v) => buildTreeNode(v, viewsById, allViews));

  return { view, children };
}

/**
 * Get child views of a parent view
 */
export function getChildViews(
  parentId: string,
  viewsConfig: ViewsConfig
): View[] {
  return viewsConfig.views.filter((v) => v.parentViewId === parentId);
}

/**
 * Get the parent view of a view
 */
export function getParentView(
  view: View,
  viewsConfig: ViewsConfig
): View | null {
  if (!view.parentViewId) return null;
  return viewsConfig.views.find((v) => v.id === view.parentViewId) || null;
}

/**
 * Get breadcrumb path for a view
 */
export function getViewBreadcrumbs(
  view: View,
  viewsConfig: ViewsConfig
): View[] {
  const breadcrumbs: View[] = [];
  let current: View | null = view;

  while (current) {
    breadcrumbs.unshift(current);
    current = getParentView(current, viewsConfig);
  }

  return breadcrumbs;
}
