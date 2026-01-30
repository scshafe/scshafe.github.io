/**
 * Views Server Utilities
 *
 * Server-side functions for loading and resolving views.
 * - In development: fetches from Flask API (localhost:3001)
 * - In production: reads from metadata.json (generated at build time)
 *
 * New Architecture:
 * - Views reference root_node_id which points to a node tree
 * - Nodes reference References which point to Components
 * - Resolution merges component configs with reference overrides
 */

import fs from 'fs';
import path from 'path';
import type { ResolvedView, NodeId } from './types';

const contentDirectory = path.join(process.cwd(), 'content');
const metadataPath = path.join(contentDirectory, 'metadata.json');

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = 'http://localhost:3001';

interface ViewsResponse {
  id: string;
  type: string;
  default_home_node_id?: NodeId;
  views: ResolvedView[];
}

interface Metadata {
  views?: ViewsResponse;
  [key: string]: unknown;
}

/**
 * Load metadata from JSON file (production only)
 */
function loadMetadataFromFile(): Metadata {
  console.log('[content/metadata.json] Loading from file');
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    const data = JSON.parse(content);
    console.log(`[content/metadata.json] Loaded: views=${data.views?.views?.length || 0}`);
    return data;
  } catch (error) {
    console.error('[content/metadata.json] Failed to load:', error);
    return {};
  }
}

/**
 * Fetch metadata from Flask API (development only)
 */
async function fetchMetadataFromAPI(): Promise<Metadata> {
  console.log('[API] Fetching /metadata from Flask');
  try {
    const response = await fetch(`${API_BASE_URL}/metadata`, {
      cache: 'no-store', // Always get fresh data in dev
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    console.log(`[API] /metadata response: views=${data.views?.views?.length || 0}, navigation.header=${data.navigation?.header?.length || 0}`);
    return data;
  } catch (error) {
    console.warn('[API] Failed to fetch /metadata, falling back to file:', error);
    // Fallback to file if API is not available
    return loadMetadataFromFile();
  }
}

/**
 * Load metadata - uses API in dev, file in production
 */
async function loadMetadata(): Promise<Metadata> {
  console.log(`[views.server] loadMetadata() isDevelopment=${isDevelopment}`);
  if (isDevelopment) {
    return fetchMetadataFromAPI();
  }
  return loadMetadataFromFile();
}

/**
 * Get all resolved views
 * - Development: fetches from Flask API
 * - Production: reads from metadata.json
 */
export async function getAllViews(): Promise<ResolvedView[]> {
  const metadata = await loadMetadata();
  const viewsData = metadata.views || { views: [] };
  const views = viewsData.views || [];
  console.log(`[views.server] getAllViews() returned ${views.length} views:`);
  views.forEach((v: ResolvedView, i: number) => {
    console.log(`  [${i}] comp_id=${v.comp_id}, root_node_id=${v.root_node_id}, path='${v.path}', name='${v.name}'`);
  });
  return views;
}

/**
 * Get views list synchronously (from file only)
 * Use this in layout.tsx and other places where async is not supported
 */
export function getViewsSync(): ResolvedView[] {
  const metadata = loadMetadataFromFile();
  const viewsData = metadata.views || { views: [] };
  return viewsData.views || [];
}

/**
 * Get the default home node ID
 */
export async function getDefaultHomeNodeId(): Promise<NodeId | undefined> {
  const metadata = await loadMetadata();
  const viewsData = metadata.views || { default_home_node_id: undefined };
  return viewsData.default_home_node_id;
}

/**
 * Resolve a view by its URL path
 */
export function resolveViewByPath(
  urlPath: string,
  views: ResolvedView[]
): ResolvedView | null {
  // Normalize path
  const normalizedPath =
    urlPath === '/' ? '/' : urlPath.replace(/\/$/, '');

  // Check for home view first
  if (normalizedPath === '/') {
    // First check for explicit is_home flag
    const homeView = views.find((v) => v.is_home === true);
    if (homeView) return homeView;

    // Fallback to view with "/" path
    return views.find((v) => v.path === '/') || null;
  }

  // Direct path match
  const directMatch = views.find(
    (v) =>
      v.path === normalizedPath || v.path === normalizedPath + '/'
  );

  return directMatch || null;
}

/**
 * Resolve a view by its component ID
 */
export function resolveViewById(
  compId: number,
  views: ResolvedView[]
): ResolvedView | null {
  return views.find((v) => v.comp_id === compId) || null;
}

/**
 * Get all view paths for static generation
 */
export async function getAllViewPaths(): Promise<string[][]> {
  const views = await getAllViews();
  const hasHomeView = views.some((v: ResolvedView) => v.is_home === true);

  const paths = views.map((view: ResolvedView) => {
    if (view.path === '/' || view.is_home) {
      return []; // Empty array for root path
    }
    // Split path into segments, removing empty strings
    return view.path.split('/').filter(Boolean);
  });

  // Only include root path if a home view is configured
  // Filter out empty arrays if no home view exists
  if (!hasHomeView) {
    return paths.filter((p) => p.length > 0);
  }

  return paths;
}

// ============ NEW ARCHITECTURE FUNCTIONS ============

/**
 * Fetch a resolved view by ID from the API (development only)
 * The API handles the resolution of nodes -> references -> components
 */
export async function fetchResolvedViewById(viewId: number): Promise<ResolvedView | null> {
  if (!isDevelopment) {
    // In production, use metadata.json which should already have resolved views
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/views/${viewId}/resolved`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch all resolved views from the API (development only)
 */
export async function fetchAllResolvedViews(): Promise<ResolvedView[]> {
  if (!isDevelopment) {
    // In production, use metadata.json
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/views?resolved=true`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.views || [];
  } catch {
    return [];
  }
}

/**
 * Get a resolved view by path
 * - Development: fetches from Flask API
 * - Production: reads from metadata.json
 */
export async function getResolvedViewByPath(urlPath: string): Promise<ResolvedView | null> {
  const views = await getAllViews();
  return resolveViewByPath(urlPath, views);
}
