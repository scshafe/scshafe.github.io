import fs from 'fs';
import path from 'path';
import type { NodeId } from './views';
import { asNodeId } from './types';

const contentDirectory = path.join(process.cwd(), 'content');
const settingsPath = path.join(contentDirectory, 'settings.json');

// New settings paths
const settingsDir = path.join(contentDirectory, 'settings');
const siteConfigPath = path.join(settingsDir, 'site.json');
const navbarDir = path.join(settingsDir, 'navbar');
const footerDir = path.join(settingsDir, 'footer');

export type NavLinkType = 'url' | 'view' | 'theme';

export interface NavItem {
  id: NodeId;
  label: string;
  linkType: NavLinkType; // Type of link: url, view, or theme toggle
  url?: string; // Used when linkType is 'url'
  viewId?: NodeId; // Used when linkType is 'view' - references a view ID
  position?: 'left' | 'right';
  icon?: string | null;
  external?: boolean; // Only applicable for linkType 'url'
  order?: number; // For ordering in new structure
}

export interface NavigationConfig {
  siteName: string;
  header: NavItem[];
  footer: NavItem[];
}

export interface SiteConfig {
  site_name: string;
  default_home_view_id: NodeId | null;
}

interface Settings {
  navigation?: NavigationConfig;
  default_home_view_id?: NodeId | null;
  [key: string]: unknown;
}

function loadSettings(): Settings {
  try {
    const content = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function loadJsonFile<T>(filePath: string): T | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function loadJsonFilesFromDir<T>(dirPath: string): T[] {
  const dirName = dirPath.split('/').slice(-2).join('/');
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`[${dirName}] Directory not found`);
      return [];
    }
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    console.log(`[${dirName}] Found ${files.length} files`);
    const items: T[] = [];
    for (const file of files) {
      const item = loadJsonFile<T>(path.join(dirPath, file));
      if (item) {
        console.log(`[${dirName}] Loaded ${file}:`, JSON.stringify(item).substring(0, 200));
        items.push(item);
      }
    }
    return items;
  } catch (error) {
    console.error(`[${dirName}] Error loading files:`, error);
    return [];
  }
}

/**
 * Get site configuration from new structure, with fallback to legacy.
 */
export function getSiteConfig(): SiteConfig {
  // Try new structure first
  const siteConfig = loadJsonFile<SiteConfig>(siteConfigPath);
  if (siteConfig) {
    return siteConfig;
  }

  // Fall back to legacy settings.json
  const settings = loadSettings();
  return {
    site_name: settings.navigation?.siteName || 'My Blog',
    default_home_view_id: settings.default_home_view_id || null,
  };
}

// Backend storage format
interface BackendNavItem {
  nav_bar_id?: number;
  footer_id?: number;
  position?: 'left' | 'right';
  order?: number;
  internal_link?: {
    label?: string;
    icon?: string | null;
    view_node_id?: number;
    url?: string;
  } | null;
}

/**
 * Transform backend nav item format to frontend format.
 * Backend stores: { nav_bar_id, position, order, internal_link: { label, view_node_id, url, icon } }
 * Frontend expects: { id, label, linkType, viewId, url, position, icon, external }
 */
function transformNavItemToFrontend(item: BackendNavItem): NavItem {
  const id = item.nav_bar_id ?? item.footer_id ?? 0;
  const internal_link = item.internal_link;

  const result: NavItem = {
    id: asNodeId(id),
    position: item.position || 'left',
    order: item.order ?? 0,
    label: '',
    linkType: 'url',
    url: '/',
    icon: null,
    external: false,
  };

  if (internal_link) {
    result.label = internal_link.label || '';
    result.icon = internal_link.icon ?? null;

    if (internal_link.view_node_id) {
      result.linkType = 'view';
      result.viewId = asNodeId(internal_link.view_node_id);
    } else if (internal_link.url === '__theme_toggle__') {
      result.linkType = 'theme';
    } else if (internal_link.url) {
      result.linkType = 'url';
      result.url = internal_link.url;
    }
  }

  console.log(`[navigation] TRANSFORM id=${id} -> label='${result.label}', linkType=${result.linkType}, viewId=${result.viewId}, url=${result.url}`);
  return result;
}

/**
 * Get navigation config from new structure, with fallback to legacy.
 */
export function getNavigationConfig(): NavigationConfig {
  console.log('[navigation] getNavigationConfig() called');

  // Try new structure first
  const siteConfig = loadJsonFile<SiteConfig>(siteConfigPath);

  if (siteConfig) {
    console.log(`[settings/site] Loaded site_name='${siteConfig.site_name}'`);

    // Load from new structure (backend format)
    const rawNavbarItems = loadJsonFilesFromDir<BackendNavItem>(navbarDir);
    const rawFooterItems = loadJsonFilesFromDir<BackendNavItem>(footerDir);

    // Transform to frontend format
    const navbarItems = rawNavbarItems.map(item => transformNavItemToFrontend(item));
    const footerItems = rawFooterItems.map(item => transformNavItemToFrontend(item));

    // Sort by order field
    navbarItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    footerItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    console.log(`[navigation] Result: header=${navbarItems.length}, footer=${footerItems.length}`);

    return {
      siteName: siteConfig.site_name || 'My Blog',
      header: navbarItems,
      footer: footerItems,
    };
  }

  console.log('[navigation] Falling back to legacy settings.json');

  // Fall back to legacy settings.json, or empty navigation if not found
  const settings = loadSettings();
  return settings.navigation || {
    siteName: "My Site",
    header: [],
    footer: [],
  };
}
