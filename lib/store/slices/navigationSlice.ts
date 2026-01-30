/**
 * Navigation Slice
 *
 * Manages site navigation configuration including:
 * - Site name
 * - Header navigation items
 * - Footer navigation items
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { NavItem, NavigationConfig } from '@/lib/content/navigation';
import type { NodeId } from '@/lib/content/views';

// API base URL
const API_BASE_URL = 'http://localhost:3001';

interface NavigationState {
  siteName: string;
  header: NavItem[];
  footer: NavItem[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: NavigationState = {
  siteName: "My Blog",
  header: [],
  footer: [],
  loading: false,
  saving: false,
  error: null,
};

// Async thunks
export const saveNavigation = createAsyncThunk(
  'navigation/save',
  async (config: NavigationConfig, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/navigation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error(`Failed to save navigation: ${res.status}`);
      }

      return config;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save navigation'
      );
    }
  }
);

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    // Initialize navigation from server config
    initializeNavigation: (state, action: PayloadAction<NavigationConfig>) => {
      console.log('[navigationSlice] initializeNavigation:', {
        siteName: action.payload.siteName,
        headerCount: action.payload.header.length,
        footerCount: action.payload.footer.length,
      });
      action.payload.header.forEach((item, idx) => {
        console.log(`  header[${idx}] id=${item.id}, label='${item.label}', linkType=${item.linkType}, viewId=${item.viewId}, url=${item.url}`);
      });
      state.siteName = action.payload.siteName;
      state.header = action.payload.header;
      state.footer = action.payload.footer;
    },

    // Set site name
    setSiteName: (state, action: PayloadAction<string>) => {
      state.siteName = action.payload;
    },

    // Set header items
    setHeaderItems: (state, action: PayloadAction<NavItem[]>) => {
      state.header = action.payload;
    },

    // Set footer items
    setFooterItems: (state, action: PayloadAction<NavItem[]>) => {
      state.footer = action.payload;
    },

    // Add a header item
    addHeaderItem: (state, action: PayloadAction<NavItem>) => {
      state.header.push(action.payload);
    },

    // Add a footer item
    addFooterItem: (state, action: PayloadAction<NavItem>) => {
      state.footer.push(action.payload);
    },

    // Update a header item
    updateHeaderItem: (state, action: PayloadAction<NavItem>) => {
      const index = state.header.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.header[index] = action.payload;
      }
    },

    // Update a footer item
    updateFooterItem: (state, action: PayloadAction<NavItem>) => {
      const index = state.footer.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.footer[index] = action.payload;
      }
    },

    // Remove a header item
    removeHeaderItem: (state, action: PayloadAction<NodeId>) => {
      state.header = state.header.filter((item) => item.id !== action.payload);
    },

    // Remove a footer item
    removeFooterItem: (state, action: PayloadAction<NodeId>) => {
      state.footer = state.footer.filter((item) => item.id !== action.payload);
    },

    // Reorder header items
    reorderHeaderItems: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const { fromIndex, toIndex } = action.payload;
      const items = [...state.header];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      state.header = items;
    },

    // Reorder footer items
    reorderFooterItems: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const { fromIndex, toIndex } = action.payload;
      const items = [...state.footer];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      state.footer = items;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveNavigation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveNavigation.fulfilled, (state, action) => {
        state.saving = false;
        state.siteName = action.payload.siteName;
        state.header = action.payload.header;
        state.footer = action.payload.footer;
      })
      .addCase(saveNavigation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
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
  clearError,
} = navigationSlice.actions;

// Selectors
export const selectSiteName = (state: RootState) => state.navigation.siteName;
export const selectHeaderItems = (state: RootState) => state.navigation.header;
export const selectFooterItems = (state: RootState) => state.navigation.footer;
export const selectNavigationConfig = (state: RootState): NavigationConfig => ({
  siteName: state.navigation.siteName,
  header: state.navigation.header,
  footer: state.navigation.footer,
});
export const selectNavigationLoading = (state: RootState) => state.navigation.loading;
export const selectNavigationSaving = (state: RootState) => state.navigation.saving;
export const selectNavigationError = (state: RootState) => state.navigation.error;

// Check if any nav item has theme type
export const selectHasThemeNavItem = (state: RootState): boolean => {
  return (
    state.navigation.header.some((item) => item.linkType === 'theme') ||
    state.navigation.footer.some((item) => item.linkType === 'theme')
  );
};

export default navigationSlice.reducer;
