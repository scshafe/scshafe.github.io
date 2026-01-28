/**
 * Theme Slice
 *
 * Manages the active theme and color scheme state.
 * Handles light/dark mode preferences and theme colors.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  ThemeConfig,
  ThemePair,
  ColorScheme,
  ColorSchemePreference,
  ThemeColors,
} from '@/lib/content/themes';
import {
  DEFAULT_THEMES,
  getThemeColors,
  resolveColorScheme,
  themeToCssVars,
} from '@/lib/content/themes';

interface ThemeState {
  config: ThemeConfig;
  activeTheme: ThemePair;
  colorScheme: ColorScheme;
  preference: ColorSchemePreference;
  systemPrefersDark: boolean;
  mounted: boolean;
}

const getInitialTheme = (config: ThemeConfig): ThemePair => {
  const allThemes = [...DEFAULT_THEMES, ...config.customThemes];
  return allThemes.find((t) => t.id === config.activeThemeId) || DEFAULT_THEMES[0];
};

const initialState: ThemeState = {
  config: {
    activeThemeId: 'midnight-blue',
    colorSchemePreference: 'system',
    customThemes: [],
  },
  activeTheme: DEFAULT_THEMES[0],
  colorScheme: 'dark',
  preference: 'system',
  systemPrefersDark: false,
  mounted: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Initialize theme from server config
    initializeTheme: (state, action: PayloadAction<ThemeConfig>) => {
      state.config = action.payload;
      state.activeTheme = getInitialTheme(action.payload);
      state.preference = action.payload.colorSchemePreference;
    },

    // Set mounted state (for hydration)
    setMounted: (state, action: PayloadAction<boolean>) => {
      state.mounted = action.payload;
    },

    // Set system preference
    setSystemPrefersDark: (state, action: PayloadAction<boolean>) => {
      state.systemPrefersDark = action.payload;
      state.colorScheme = resolveColorScheme(
        state.preference,
        action.payload,
        state.activeTheme.defaultScheme
      );
    },

    // Set color scheme preference
    setPreference: (state, action: PayloadAction<ColorSchemePreference>) => {
      state.preference = action.payload;
      state.colorScheme = resolveColorScheme(
        action.payload,
        state.systemPrefersDark,
        state.activeTheme.defaultScheme
      );
    },

    // Toggle between light and dark
    toggleColorScheme: (state) => {
      const newScheme: ColorScheme = state.colorScheme === 'dark' ? 'light' : 'dark';
      state.preference = newScheme;
      state.colorScheme = newScheme;
    },

    // Set active theme by ID
    setActiveTheme: (state, action: PayloadAction<string>) => {
      const allThemes = [...DEFAULT_THEMES, ...state.config.customThemes];
      const theme = allThemes.find((t) => t.id === action.payload);
      if (theme) {
        state.activeTheme = theme;
        state.config.activeThemeId = action.payload;
        state.colorScheme = resolveColorScheme(
          state.preference,
          state.systemPrefersDark,
          theme.defaultScheme
        );
      }
    },

    // Add a custom theme
    addCustomTheme: (state, action: PayloadAction<ThemePair>) => {
      state.config.customThemes.push(action.payload);
    },

    // Update a custom theme
    updateCustomTheme: (state, action: PayloadAction<ThemePair>) => {
      const index = state.config.customThemes.findIndex(
        (t) => t.id === action.payload.id
      );
      if (index !== -1) {
        state.config.customThemes[index] = action.payload;
        if (state.activeTheme.id === action.payload.id) {
          state.activeTheme = action.payload;
        }
      }
    },

    // Remove a custom theme
    removeCustomTheme: (state, action: PayloadAction<string>) => {
      state.config.customThemes = state.config.customThemes.filter(
        (t) => t.id !== action.payload
      );
      // If the removed theme was active, switch to default
      if (state.activeTheme.id === action.payload) {
        state.activeTheme = DEFAULT_THEMES[0];
        state.config.activeThemeId = DEFAULT_THEMES[0].id;
      }
    },
  },
});

// Export actions
export const {
  initializeTheme,
  setMounted,
  setSystemPrefersDark,
  setPreference,
  toggleColorScheme,
  setActiveTheme,
  addCustomTheme,
  updateCustomTheme,
  removeCustomTheme,
} = themeSlice.actions;

// Selectors
export const selectTheme = (state: RootState) => state.theme.activeTheme;
export const selectColorScheme = (state: RootState) => state.theme.colorScheme;
export const selectPreference = (state: RootState) => state.theme.preference;
export const selectThemeConfig = (state: RootState) => state.theme.config;
export const selectMounted = (state: RootState) => state.theme.mounted;

// Derived selectors
export const selectCurrentColors = (state: RootState): ThemeColors => {
  return getThemeColors(state.theme.activeTheme, state.theme.colorScheme);
};

export const selectAllThemes = (state: RootState): ThemePair[] => {
  return [...DEFAULT_THEMES, ...state.theme.config.customThemes];
};

// Utility function to apply theme colors to DOM
export function applyThemeColors(colors: ThemeColors) {
  const cssVars = themeToCssVars(colors);
  const root = document.documentElement;
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export default themeSlice.reducer;
