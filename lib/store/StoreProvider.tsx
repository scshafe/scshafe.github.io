'use client';

/**
 * Redux Store Provider
 *
 * Wraps the application with Redux Provider and handles:
 * - Store initialization with server-side data
 * - Theme color application on mount
 * - System preference detection for color scheme
 */

import { useRef, useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import themeReducer, {
  initializeTheme,
  setMounted,
  setSystemPrefersDark,
  setPreference,
  applyThemeColors,
  selectCurrentColors,
} from './slices/themeSlice';
import viewReducer, { setCurrentView, setAllViews } from './slices/viewSlice';
import navigationReducer, { initializeNavigation } from './slices/navigationSlice';
import authorReducer, { initializeAuthorMode } from './slices/authorSlice';
import type { ThemeConfig } from '@/lib/content/themes';
import type { NavigationConfig } from '@/lib/content/navigation';
import type { ResolvedView } from '@/lib/content/types';
import { getThemeColors } from '@/lib/content/themes';
import type { ColorSchemePreference } from '@/lib/content/themes';

const STORAGE_KEY = 'color-scheme-preference';

interface StoreProviderProps {
  children: React.ReactNode;
  themeConfig: ThemeConfig;
  navigationConfig: NavigationConfig;
  views: ResolvedView[];
  initialView?: ResolvedView | null;
  isAuthorMode: boolean;
}

interface StoreInitProps {
  themeConfig: ThemeConfig;
  navigationConfig: NavigationConfig;
  views: ResolvedView[];
  initialView?: ResolvedView | null;
  isAuthorMode: boolean;
}

export type AppStore = ReturnType<typeof createInitializedStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

/**
 * Create and initialize a Redux store with the given configuration.
 * This function is called once during the initial render.
 */
function createInitializedStore({
  themeConfig,
  navigationConfig,
  views,
  initialView,
  isAuthorMode,
}: StoreInitProps) {
  const store = configureStore({
    reducer: {
      theme: themeReducer,
      view: viewReducer,
      navigation: navigationReducer,
      author: authorReducer,
    },
  });

  // Initialize state with server data
  store.dispatch(initializeTheme(themeConfig));
  store.dispatch(initializeNavigation(navigationConfig));
  store.dispatch(setAllViews(views));
  store.dispatch(initializeAuthorMode(isAuthorMode));

  // Log navigation initialization
  console.log('%c[StoreProvider] Initializing navigation from server:', 'color: #10b981; font-weight: bold');
  console.log('  siteName:', navigationConfig.siteName);
  console.log('  Header items:', navigationConfig.header.length);
  navigationConfig.header.forEach((item, idx) => {
    console.log(`    [${idx}] id=${item.id}, label="${item.label}", linkType=${item.linkType}, viewId=${item.viewId}, url=${item.url}`);
  });
  console.log('  Footer items:', navigationConfig.footer.length);

  if (initialView) {
    store.dispatch(setCurrentView(initialView));
  }

  return store;
}

export function StoreProvider({
  children,
  themeConfig,
  navigationConfig,
  views,
  initialView,
  isAuthorMode,
}: StoreProviderProps) {
  // Create the store once using useMemo. We intentionally only create the store once
  // on initial render with the server-side props. Subsequent changes to these props
  // should not recreate the store - they would be handled through Redux actions instead.
  const store = useMemo(
    () =>
      createInitializedStore({
        themeConfig,
        navigationConfig,
        views,
        initialView,
        isAuthorMode,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Keep a ref for use in effects
  const storeRef = useRef(store);
  storeRef.current = store;

  // Handle client-side initialization
  useEffect(() => {
    const currentStore = storeRef.current;

    // Mark as mounted
    currentStore.dispatch(setMounted(true));

    // Load preference from localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as ColorSchemePreference | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      currentStore.dispatch(setPreference(saved));
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    currentStore.dispatch(setSystemPrefersDark(mediaQuery.matches));

    // Apply initial theme colors
    const colors = selectCurrentColors(currentStore.getState());
    applyThemeColors(colors);

    // Set color scheme data attribute
    const state = currentStore.getState();
    document.documentElement.setAttribute('data-color-scheme', state.theme.colorScheme);

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      currentStore.dispatch(setSystemPrefersDark(e.matches));
      const colors = selectCurrentColors(currentStore.getState());
      applyThemeColors(colors);
      document.documentElement.setAttribute(
        'data-color-scheme',
        currentStore.getState().theme.colorScheme
      );
    };

    mediaQuery.addEventListener('change', handleChange);

    // Subscribe to theme changes to apply colors
    const unsubscribe = currentStore.subscribe(() => {
      const state = currentStore.getState();
      if (state.theme.mounted) {
        const colors = getThemeColors(state.theme.activeTheme, state.theme.colorScheme);
        applyThemeColors(colors);
        document.documentElement.setAttribute('data-color-scheme', state.theme.colorScheme);
      }
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      unsubscribe();
    };
  }, []);

  // Save preference to localStorage when it changes
  useEffect(() => {
    const currentStore = storeRef.current;
    let prevPreference = currentStore.getState().theme.preference;

    const unsubscribe = currentStore.subscribe(() => {
      const state = currentStore.getState();
      if (state.theme.preference !== prevPreference) {
        prevPreference = state.theme.preference;
        localStorage.setItem(STORAGE_KEY, state.theme.preference);
      }
    });

    return unsubscribe;
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
