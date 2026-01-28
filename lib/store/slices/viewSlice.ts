/**
 * View Slice
 *
 * Manages the current view state.
 * Views contain their metadata and a list of their immediate children (components).
 * List components also contain their own children.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { View, ViewComponent, NodeId } from '@/lib/content/views';

// API base URL
const API_BASE_URL = 'http://localhost:3001';

interface ViewState {
  // Current view being displayed
  currentView: View | null;
  // All available views (for navigation/linking)
  allViews: View[];
  // Loading states
  loading: boolean;
  saving: boolean;
  error: string | null;
  // Component being edited
  editingComponent: ViewComponent | null;
}

const initialState: ViewState = {
  currentView: null,
  allViews: [],
  loading: false,
  saving: false,
  error: null,
  editingComponent: null,
};

// Async thunks for API operations
export const saveView = createAsyncThunk(
  'view/saveView',
  async (view: View, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/views/${view.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(view),
      });

      if (!res.ok) {
        throw new Error(`Failed to save view: ${res.status}`);
      }

      return view;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save view'
      );
    }
  }
);

export const updateViewContent = createAsyncThunk(
  'view/updateContent',
  async (
    { viewId, contentKey, content }: { viewId: NodeId; contentKey: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/views/${viewId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentKey, content }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update content: ${res.status}`);
      }

      return { contentKey, content };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update content'
      );
    }
  }
);

const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    // Set the current view
    setCurrentView: (state, action: PayloadAction<View>) => {
      state.currentView = action.payload;
      state.error = null;
    },

    // Set all available views
    setAllViews: (state, action: PayloadAction<View[]>) => {
      state.allViews = action.payload;
    },

    // Update content locally (optimistic update)
    updateContent: (
      state,
      action: PayloadAction<{ contentKey: string; content: string }>
    ) => {
      if (state.currentView) {
        state.currentView = {
          ...state.currentView,
          content: {
            ...state.currentView.content,
            [action.payload.contentKey]: action.payload.content,
          },
        };
      }
    },

    // Update a component in the current view
    updateComponent: (state, action: PayloadAction<ViewComponent>) => {
      if (state.currentView) {
        state.currentView = {
          ...state.currentView,
          components: state.currentView.components.map((c) =>
            c.id === action.payload.id ? action.payload : c
          ),
        };
      }
    },

    // Delete a component from the current view
    deleteComponent: (state, action: PayloadAction<NodeId>) => {
      if (state.currentView) {
        state.currentView = {
          ...state.currentView,
          components: state.currentView.components.filter(
            (c) => c.id !== action.payload
          ),
        };
      }
    },

    // Move a component up or down
    moveComponent: (
      state,
      action: PayloadAction<{ componentId: NodeId; direction: 'up' | 'down' }>
    ) => {
      if (!state.currentView) return;

      const { componentId, direction } = action.payload;
      const components = [...state.currentView.components];
      const index = components.findIndex((c) => c.id === componentId);

      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= components.length) return;

      const [moved] = components.splice(index, 1);
      components.splice(newIndex, 0, moved);

      state.currentView = {
        ...state.currentView,
        components,
      };
    },

    // Add a component to the current view
    addComponent: (state, action: PayloadAction<ViewComponent>) => {
      if (state.currentView) {
        state.currentView = {
          ...state.currentView,
          components: [...state.currentView.components, action.payload],
        };
      }
    },

    // Set the component being edited
    setEditingComponent: (state, action: PayloadAction<ViewComponent | null>) => {
      state.editingComponent = action.payload;
    },

    // Update a child component within a list component
    updateChildComponent: (
      state,
      action: PayloadAction<{ parentId: NodeId; component: ViewComponent }>
    ) => {
      if (!state.currentView) return;

      const { parentId, component } = action.payload;
      state.currentView = {
        ...state.currentView,
        components: state.currentView.components.map((c) => {
          if (c.id === parentId && 'children' in c && c.children) {
            return {
              ...c,
              children: c.children.map((child) =>
                child.id === component.id ? component : child
              ),
            };
          }
          return c;
        }),
      };
    },

    // Add a child component to a list
    addChildComponent: (
      state,
      action: PayloadAction<{ parentId: NodeId; component: ViewComponent }>
    ) => {
      if (!state.currentView) return;

      const { parentId, component } = action.payload;
      state.currentView = {
        ...state.currentView,
        components: state.currentView.components.map((c) => {
          if (c.id === parentId && 'children' in c) {
            return {
              ...c,
              children: [...(c.children || []), component],
            };
          }
          return c;
        }),
      };
    },

    // Delete a child component from a list
    deleteChildComponent: (
      state,
      action: PayloadAction<{ parentId: NodeId; componentId: NodeId }>
    ) => {
      if (!state.currentView) return;

      const { parentId, componentId } = action.payload;
      state.currentView = {
        ...state.currentView,
        components: state.currentView.components.map((c) => {
          if (c.id === parentId && 'children' in c && c.children) {
            return {
              ...c,
              children: c.children.filter((child) => child.id !== componentId),
            };
          }
          return c;
        }),
      };
    },

    // Move a child component within a list
    moveChildComponent: (
      state,
      action: PayloadAction<{
        parentId: NodeId;
        componentId: NodeId;
        direction: 'up' | 'down';
      }>
    ) => {
      if (!state.currentView) return;

      const { parentId, componentId, direction } = action.payload;
      state.currentView = {
        ...state.currentView,
        components: state.currentView.components.map((c) => {
          if (c.id === parentId && 'children' in c && c.children) {
            const children = [...c.children];
            const index = children.findIndex((child) => child.id === componentId);

            if (index === -1) return c;

            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= children.length) return c;

            const [moved] = children.splice(index, 1);
            children.splice(newIndex, 0, moved);

            return { ...c, children };
          }
          return c;
        }),
      };
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Save view
      .addCase(saveView.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveView.fulfilled, (state, action) => {
        state.saving = false;
        state.currentView = action.payload;
      })
      .addCase(saveView.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Update content
      .addCase(updateViewContent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateViewContent.fulfilled, (state, action) => {
        state.saving = false;
        if (state.currentView) {
          state.currentView = {
            ...state.currentView,
            content: {
              ...state.currentView.content,
              [action.payload.contentKey]: action.payload.content,
            },
          };
        }
      })
      .addCase(updateViewContent.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setCurrentView,
  setAllViews,
  updateContent,
  updateComponent,
  deleteComponent,
  moveComponent,
  addComponent,
  setEditingComponent,
  updateChildComponent,
  addChildComponent,
  deleteChildComponent,
  moveChildComponent,
  clearError,
} = viewSlice.actions;

// Selectors
export const selectCurrentView = (state: RootState) => state.view.currentView;
export const selectAllViews = (state: RootState) => state.view.allViews;
export const selectViewLoading = (state: RootState) => state.view.loading;
export const selectViewSaving = (state: RootState) => state.view.saving;
export const selectViewError = (state: RootState) => state.view.error;
export const selectEditingComponent = (state: RootState) => state.view.editingComponent;

// Derived selectors
export const selectViewComponents = (state: RootState) =>
  state.view.currentView?.components ?? [];

export const selectViewContent = (state: RootState) =>
  state.view.currentView?.content ?? {};

export const selectViewById = (state: RootState, viewId: NodeId) =>
  state.view.allViews.find((v) => v.id === viewId);

export const selectViewPathMap = (state: RootState): Map<NodeId, string> => {
  const map = new Map<NodeId, string>();
  state.view.allViews.forEach((view) => {
    map.set(view.id, view.path);
  });
  return map;
};

// ============ NODE-BASED SELECTORS ============

/**
 * Get a component by ID from the current view
 */
export const selectComponentById = (state: RootState, componentId: NodeId): ViewComponent | undefined => {
  const components = state.view.currentView?.components ?? [];

  // Search top-level components
  for (const component of components) {
    if (component.id === componentId) return component;

    // Search children if it's a list component
    if ('children' in component && component.children) {
      const child = component.children.find((c) => c.id === componentId);
      if (child) return child;
    }
  }

  return undefined;
};

/**
 * Get children of a component (for List components)
 */
export const selectComponentChildren = (state: RootState, componentId: NodeId): ViewComponent[] => {
  const component = selectComponentById(state, componentId);
  if (!component || !('children' in component)) return [];
  return component.children ?? [];
};

/**
 * Get the parent component of a given component
 */
export const selectComponentParent = (state: RootState, componentId: NodeId): ViewComponent | null => {
  const components = state.view.currentView?.components ?? [];

  for (const component of components) {
    if ('children' in component && component.children) {
      if (component.children.some((c) => c.id === componentId)) {
        return component;
      }
    }
  }

  return null;
};

/**
 * Get all components as a flat map by ID
 */
export const selectComponentsMap = (state: RootState): Record<NodeId, ViewComponent> => {
  const map: Record<NodeId, ViewComponent> = {};
  const components = state.view.currentView?.components ?? [];

  function addToMap(component: ViewComponent) {
    map[component.id] = component;
    if ('children' in component && component.children) {
      component.children.forEach(addToMap);
    }
  }

  components.forEach(addToMap);
  return map;
};

/**
 * Get the next sibling of a component
 */
export const selectNextComponent = (state: RootState, componentId: NodeId): ViewComponent | undefined => {
  const components = state.view.currentView?.components ?? [];

  // Check top-level components
  const topLevelIndex = components.findIndex((c) => c.id === componentId);
  if (topLevelIndex !== -1 && topLevelIndex < components.length - 1) {
    return components[topLevelIndex + 1];
  }

  // Check nested components
  for (const component of components) {
    if ('children' in component && component.children) {
      const childIndex = component.children.findIndex((c) => c.id === componentId);
      if (childIndex !== -1 && childIndex < component.children.length - 1) {
        return component.children[childIndex + 1];
      }
    }
  }

  return undefined;
};

/**
 * Get the previous sibling of a component
 */
export const selectPreviousComponent = (state: RootState, componentId: NodeId): ViewComponent | undefined => {
  const components = state.view.currentView?.components ?? [];

  // Check top-level components
  const topLevelIndex = components.findIndex((c) => c.id === componentId);
  if (topLevelIndex > 0) {
    return components[topLevelIndex - 1];
  }

  // Check nested components
  for (const component of components) {
    if ('children' in component && component.children) {
      const childIndex = component.children.findIndex((c) => c.id === componentId);
      if (childIndex > 0) {
        return component.children[childIndex - 1];
      }
    }
  }

  return undefined;
};

// ============ TYPE-SPECIFIC COMPONENT SELECTORS ============

/**
 * Select all components of a specific type from the current view
 */
export const selectComponentsByType = <T extends ViewComponent>(
  state: RootState,
  type: ViewComponent['type']
): T[] => {
  const components: T[] = [];
  const allComponents = state.view.currentView?.components ?? [];

  function findByType(component: ViewComponent) {
    if (component.type === type) {
      components.push(component as T);
    }
    if ('children' in component && component.children) {
      component.children.forEach(findByType);
    }
  }

  allComponents.forEach(findByType);
  return components;
};

export default viewSlice.reducer;
