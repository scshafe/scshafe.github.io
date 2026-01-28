'use client';

/**
 * ThemeProvider - Legacy compatibility wrapper
 *
 * This module provides backwards compatibility for components that
 * still use the old useTheme hook. It now reads from Redux state
 * instead of maintaining its own context.
 *
 * The actual theme management is now handled by the Redux store
 * and StoreProvider.
 */

import { ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import {
  selectTheme,
  selectColorScheme,
  selectPreference,
  setPreference as setPreferenceAction,
  toggleColorScheme as toggleColorSchemeAction,
} from '@/lib/store/slices/themeSlice';
import type { ThemeConfig, ThemePair, ColorScheme, ColorSchemePreference, ThemeColors } from '@/lib/content/themes';
import { themeToCssVars } from '@/lib/content/themes';

interface ThemeContextType {
  theme: ThemePair;
  colorScheme: ColorScheme;
  preference: ColorSchemePreference;
  setPreference: (pref: ColorSchemePreference) => void;
  toggleColorScheme: () => void;
}

interface ThemeProviderProps {
  config?: ThemeConfig;
  children: ReactNode;
}

/**
 * ThemeProvider - No longer needed as state is in Redux
 * Kept for backwards compatibility - just renders children
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}

/**
 * useTheme - Hook that reads from Redux state
 * Provides backwards compatibility for components using the old API
 */
export function useTheme(): ThemeContextType {
  const theme = useAppSelector(selectTheme);
  const colorScheme = useAppSelector(selectColorScheme);
  const preference = useAppSelector(selectPreference);
  const dispatch = useAppDispatch();

  const setPreference = (pref: ColorSchemePreference) => {
    dispatch(setPreferenceAction(pref));
  };

  const toggleColorScheme = () => {
    dispatch(toggleColorSchemeAction());
  };

  return {
    theme,
    colorScheme,
    preference,
    setPreference,
    toggleColorScheme,
  };
}

/**
 * Apply theme colors to the DOM
 * Exported for use in components that need direct access
 */
export function applyThemeColors(colors: ThemeColors) {
  const cssVars = themeToCssVars(colors);
  const root = document.documentElement;
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
