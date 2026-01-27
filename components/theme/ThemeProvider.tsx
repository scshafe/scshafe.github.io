'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ThemeConfig, ThemePair, ColorScheme, ColorSchemePreference, ThemeColors } from '@/lib/content/themes';
import { DEFAULT_THEMES, themeToCssVars, getThemeColors, resolveColorScheme } from '@/lib/content/themes';

interface ThemeContextType {
  theme: ThemePair;
  colorScheme: ColorScheme;
  preference: ColorSchemePreference;
  setPreference: (pref: ColorSchemePreference) => void;
  toggleColorScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  config: ThemeConfig;
  children: React.ReactNode;
}

const STORAGE_KEY = 'color-scheme-preference';

function applyColors(colors: ThemeColors) {
  const cssVars = themeToCssVars(colors);
  const root = document.documentElement;
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function ThemeProvider({ config, children }: ThemeProviderProps) {
  // Find the active theme
  const allThemes = [...DEFAULT_THEMES, ...config.customThemes];
  const activeTheme = allThemes.find(t => t.id === config.activeThemeId) || DEFAULT_THEMES[0];

  // Initialize preference from localStorage or config
  const [preference, setPreferenceState] = useState<ColorSchemePreference>(config.colorSchemePreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Calculate the actual color scheme
  const colorScheme = resolveColorScheme(preference, systemPrefersDark, activeTheme.defaultScheme);

  // Load preference from localStorage on mount
  useEffect(() => {
    setMounted(true);

    // Check localStorage for saved preference
    const saved = localStorage.getItem(STORAGE_KEY) as ColorSchemePreference | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setPreferenceState(saved);
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mediaQuery.matches);

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme colors when scheme changes
  useEffect(() => {
    if (!mounted) return;

    const colors = getThemeColors(activeTheme, colorScheme);
    applyColors(colors);

    // Also set a data attribute for CSS selectors if needed
    document.documentElement.setAttribute('data-color-scheme', colorScheme);
  }, [activeTheme, colorScheme, mounted]);

  // Wrapper to save preference to localStorage
  const setPreference = useCallback((pref: ColorSchemePreference) => {
    setPreferenceState(pref);
    localStorage.setItem(STORAGE_KEY, pref);
  }, []);

  // Toggle between light and dark (sets explicit preference, not system)
  const toggleColorScheme = useCallback(() => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setPreference(newScheme);
  }, [colorScheme, setPreference]);

  // Prevent flash of wrong colors on initial render
  // Apply immediately on server/initial render based on default
  useEffect(() => {
    if (!mounted) {
      const colors = getThemeColors(activeTheme, activeTheme.defaultScheme);
      applyColors(colors);
    }
  }, [activeTheme, mounted]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        colorScheme,
        preference,
        setPreference,
        toggleColorScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Export utility for applying theme colors directly
export function applyThemeColors(colors: ThemeColors) {
  applyColors(colors);
}
