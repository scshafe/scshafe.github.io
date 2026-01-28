import fs from 'fs';
import path from 'path';
import type { NodeId } from './views';

const contentDirectory = path.join(process.cwd(), 'content');
const settingsPath = path.join(contentDirectory, 'settings.json');

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
}

export interface NavigationConfig {
  siteName: string;
  header: NavItem[];
  footer: NavItem[];
}

interface Settings {
  navigation?: NavigationConfig;
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

export function getNavigationConfig(): NavigationConfig {
  const settings = loadSettings();
  return settings.navigation || {
    siteName: "My Blog",
    header: [
      { id: 9000000010, label: 'Home', linkType: 'url', url: '/', position: 'left', external: false },
      { id: 9000000011, label: 'Blog', linkType: 'url', url: '/blog', position: 'right', external: false },
      { id: 9000000012, label: 'About', linkType: 'url', url: '/about', position: 'right', external: false },
    ],
    footer: [
      { id: 9000000013, label: 'RSS Feed', linkType: 'url', url: '/feed.xml', icon: 'rss', external: false },
    ],
  };
}
