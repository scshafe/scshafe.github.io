import fs from 'fs';
import path from 'path';

const contentDirectory = path.join(process.cwd(), 'content');
const metadataPath = path.join(contentDirectory, 'metadata.json');

export interface NavItem {
  id: string;
  label: string;
  url: string;
  position?: 'left' | 'right';
  icon?: string | null;
  external?: boolean;
}

export interface NavigationConfig {
  siteName: string;
  header: NavItem[];
  footer: NavItem[];
}

interface Metadata {
  navigation?: NavigationConfig;
  [key: string]: unknown;
}

function loadMetadata(): Metadata {
  try {
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function getNavigationConfig(): NavigationConfig {
  const metadata = loadMetadata();
  return metadata.navigation || {
    siteName: "scshafe's Blog",
    header: [
      { id: 'blog', label: 'Blog', url: '/blog/', position: 'right', external: false },
      { id: 'about', label: 'About', url: '/about/', position: 'right', external: false },
    ],
    footer: [
      { id: 'rss', label: 'RSS Feed', url: '/feed.xml', icon: 'rss', external: false },
    ],
  };
}
