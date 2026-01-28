// Server-only theme functions that use fs - DO NOT import in client components
import fs from 'fs';
import path from 'path';
import type { ThemeConfig, ThemePair } from './themes';
import { DEFAULT_THEMES } from './themes';

const contentDirectory = path.join(process.cwd(), 'content');
const settingsPath = path.join(contentDirectory, 'settings.json');

interface Settings {
  themes?: ThemeConfig;
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

export function getThemeConfig(): ThemeConfig {
  const settings = loadSettings();
  return settings.themes || {
    activeThemeId: 'midnight-blue',
    colorSchemePreference: 'system',
    customThemes: [],
  };
}

export function getActiveTheme(): ThemePair {
  const config = getThemeConfig();
  const allThemes = [...DEFAULT_THEMES, ...config.customThemes];
  return allThemes.find(t => t.id === config.activeThemeId) || DEFAULT_THEMES[0];
}

export function getAllThemes(): ThemePair[] {
  const config = getThemeConfig();
  return [...DEFAULT_THEMES, ...config.customThemes];
}
