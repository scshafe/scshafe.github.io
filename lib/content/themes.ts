// Shared types and data for themes - safe for both client and server

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  backgroundCode: string;
  foreground: string;
  foregroundSecondary: string;
  foregroundMuted: string;
  link: string;
  linkHover: string;
  border: string;
  accent: string;
  accentHover: string;
}

export type ColorScheme = 'light' | 'dark';
export type ColorSchemePreference = 'light' | 'dark' | 'system';

export interface ThemePair {
  id: string;
  name: string;
  light: ThemeColors;
  dark: ThemeColors;
  defaultScheme: ColorScheme; // Which to use when system preference is unavailable
  isDefault?: boolean;
}

export interface ThemeConfig {
  activeThemeId: string;
  colorSchemePreference: ColorSchemePreference; // 'light', 'dark', or 'system'
  customThemes: ThemePair[];
}

// Default theme pairs with light and dark variants
export const DEFAULT_THEMES: ThemePair[] = [
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    isDefault: true,
    defaultScheme: 'dark',
    dark: {
      background: '#1a1a2e',
      backgroundSecondary: '#16213e',
      backgroundCode: '#0f0f1a',
      foreground: '#eaeaea',
      foregroundSecondary: '#b0b0b0',
      foregroundMuted: '#6c6c8a',
      link: '#4da6ff',
      linkHover: '#7fc1ff',
      border: '#2a2a4a',
      accent: '#ff6b6b',
      accentHover: '#ff8585',
    },
    light: {
      background: '#f0f4ff',
      backgroundSecondary: '#e0e8f5',
      backgroundCode: '#d8e2f0',
      foreground: '#1a1a2e',
      foregroundSecondary: '#3a3a5e',
      foregroundMuted: '#6c6c8a',
      link: '#2563eb',
      linkHover: '#1d4ed8',
      border: '#c5d0e6',
      accent: '#dc2626',
      accentHover: '#b91c1c',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    isDefault: true,
    defaultScheme: 'dark',
    dark: {
      background: '#1a2e1a',
      backgroundSecondary: '#162e1c',
      backgroundCode: '#0f1a0f',
      foreground: '#e8f5e9',
      foregroundSecondary: '#a5d6a7',
      foregroundMuted: '#6b8e6b',
      link: '#81c784',
      linkHover: '#a5d6a7',
      border: '#2e4a2e',
      accent: '#ffb74d',
      accentHover: '#ffc97d',
    },
    light: {
      background: '#f1f8f1',
      backgroundSecondary: '#e8f5e9',
      backgroundCode: '#dcedc8',
      foreground: '#1a2e1a',
      foregroundSecondary: '#2e5a2e',
      foregroundMuted: '#5a8a5a',
      link: '#2e7d32',
      linkHover: '#1b5e20',
      border: '#c8e6c9',
      accent: '#e65100',
      accentHover: '#bf360c',
    },
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    isDefault: true,
    defaultScheme: 'dark',
    dark: {
      background: '#2d1b1b',
      backgroundSecondary: '#3d2525',
      backgroundCode: '#1a0f0f',
      foreground: '#ffeedd',
      foregroundSecondary: '#d4b8a8',
      foregroundMuted: '#8a7060',
      link: '#ffa07a',
      linkHover: '#ffb899',
      border: '#4a3030',
      accent: '#ff7043',
      accentHover: '#ff8a65',
    },
    light: {
      background: '#fff8f5',
      backgroundSecondary: '#ffede5',
      backgroundCode: '#ffe0d5',
      foreground: '#2d1b1b',
      foregroundSecondary: '#5a3a3a',
      foregroundMuted: '#8a6a5a',
      link: '#d84315',
      linkHover: '#bf360c',
      border: '#f5d0c5',
      accent: '#e64a19',
      accentHover: '#d84315',
    },
  },
  {
    id: 'ocean-depths',
    name: 'Ocean Depths',
    isDefault: true,
    defaultScheme: 'dark',
    dark: {
      background: '#0d1b2a',
      backgroundSecondary: '#1b263b',
      backgroundCode: '#080f18',
      foreground: '#e0e1dd',
      foregroundSecondary: '#a8b2c0',
      foregroundMuted: '#5c6b7a',
      link: '#00b4d8',
      linkHover: '#48cae4',
      border: '#2a3f5a',
      accent: '#f77f00',
      accentHover: '#f99a35',
    },
    light: {
      background: '#f0f9ff',
      backgroundSecondary: '#e0f2fe',
      backgroundCode: '#cce8f5',
      foreground: '#0d1b2a',
      foregroundSecondary: '#1e3a5f',
      foregroundMuted: '#4a6a8a',
      link: '#0077b6',
      linkHover: '#005f92',
      border: '#bae6fd',
      accent: '#c45f00',
      accentHover: '#a85000',
    },
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    isDefault: true,
    defaultScheme: 'dark',
    dark: {
      background: '#1a1625',
      backgroundSecondary: '#252030',
      backgroundCode: '#0f0c18',
      foreground: '#e8e0f0',
      foregroundSecondary: '#b8a8d0',
      foregroundMuted: '#7a6890',
      link: '#b388ff',
      linkHover: '#c9a8ff',
      border: '#3a2a50',
      accent: '#ff80ab',
      accentHover: '#ff9ec4',
    },
    light: {
      background: '#faf5ff',
      backgroundSecondary: '#f3e8ff',
      backgroundCode: '#e9d5ff',
      foreground: '#1a1625',
      foregroundSecondary: '#4a3a6a',
      foregroundMuted: '#7a6890',
      link: '#7c3aed',
      linkHover: '#6d28d9',
      border: '#ddd6fe',
      accent: '#db2777',
      accentHover: '#be185d',
    },
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    isDefault: true,
    defaultScheme: 'light',
    light: {
      background: '#ffffff',
      backgroundSecondary: '#f5f5f5',
      backgroundCode: '#f0f0f0',
      foreground: '#1a1a1a',
      foregroundSecondary: '#4a4a4a',
      foregroundMuted: '#8a8a8a',
      link: '#0066cc',
      linkHover: '#0052a3',
      border: '#e0e0e0',
      accent: '#d93025',
      accentHover: '#c62828',
    },
    dark: {
      background: '#121212',
      backgroundSecondary: '#1e1e1e',
      backgroundCode: '#0a0a0a',
      foreground: '#e5e5e5',
      foregroundSecondary: '#a0a0a0',
      foregroundMuted: '#6a6a6a',
      link: '#60a5fa',
      linkHover: '#93c5fd',
      border: '#333333',
      accent: '#f87171',
      accentHover: '#fca5a5',
    },
  },
];

// Get the colors for a theme based on the color scheme
export function getThemeColors(theme: ThemePair, scheme: ColorScheme): ThemeColors {
  return theme[scheme];
}

// Convert theme colors to CSS variable format
export function themeToCssVars(colors: ThemeColors): Record<string, string> {
  return {
    '--background': colors.background,
    '--background-secondary': colors.backgroundSecondary,
    '--background-code': colors.backgroundCode,
    '--foreground': colors.foreground,
    '--foreground-secondary': colors.foregroundSecondary,
    '--foreground-muted': colors.foregroundMuted,
    '--link': colors.link,
    '--link-hover': colors.linkHover,
    '--border': colors.border,
    '--accent': colors.accent,
    '--accent-hover': colors.accentHover,
  };
}

// Color variable labels for the UI
export const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  background: 'Background',
  backgroundSecondary: 'Secondary Background',
  backgroundCode: 'Code Background',
  foreground: 'Text',
  foregroundSecondary: 'Secondary Text',
  foregroundMuted: 'Muted Text',
  link: 'Link',
  linkHover: 'Link Hover',
  border: 'Border',
  accent: 'Accent',
  accentHover: 'Accent Hover',
};

// Resolve the actual color scheme based on preference and system setting
export function resolveColorScheme(
  preference: ColorSchemePreference,
  systemPrefersDark: boolean,
  defaultScheme: ColorScheme
): ColorScheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
}
