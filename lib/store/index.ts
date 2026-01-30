/**
 * Redux Store Configuration
 *
 * Central state management for the application.
 * Primary state includes:
 * - Theme: active theme and color scheme
 * - Current View: the currently displayed view with its components
 * - Navigation: header/footer nav items and site name
 * - Author Mode: editing state and capabilities
 */

import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import viewReducer from './slices/viewSlice';
import navigationReducer from './slices/navigationSlice';
import authorReducer from './slices/authorSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    view: viewReducer,
    navigation: navigationReducer,
    author: authorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export hooks
export * from './hooks';

// Re-export theme slice
export * from './slices/themeSlice';

// Re-export view slice with renamed clearError to avoid conflict
export {
  setCurrentView,
  setAllViews,
  setEditingComponent,
  setComponentNodeMap,
  clearError as clearViewError,
  // Async thunks
  fetchCurrentView,
  saveView,
  addComponentToCurrentView,
  addChildToListComponent,
  updateComponentConfig,
  deleteComponentFromView,
  moveComponentInView,
  // Selectors
  selectCurrentView,
  selectAllViews,
  selectViewLoading,
  selectViewSaving,
  selectViewError,
  selectEditingComponent,
  selectComponentNodeMap,
  selectViewComponents,
  selectViewByCompId,
  selectViewPathMap,
  selectComponentNodeInfo,
  selectComponentByCompId,
  selectComponentsMap,
  selectComponentsByType,
} from './slices/viewSlice';

// Re-export navigation slice with renamed clearError to avoid conflict
export {
  initializeNavigation,
  setSiteName,
  setHeaderItems,
  setFooterItems,
  addHeaderItem,
  addFooterItem,
  updateHeaderItem,
  updateFooterItem,
  removeHeaderItem,
  removeFooterItem,
  reorderHeaderItems,
  reorderFooterItems,
  clearError as clearNavigationError,
  saveNavigation,
  selectSiteName,
  selectHeaderItems,
  selectFooterItems,
  selectNavigationConfig,
  selectNavigationLoading,
  selectNavigationSaving,
  selectNavigationError,
  selectHasThemeNavItem,
} from './slices/navigationSlice';

// Re-export author slice
export * from './slices/authorSlice';
