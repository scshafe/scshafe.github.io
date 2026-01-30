/**
 * View Slice
 *
 * Manages the current view state with the new entity architecture.
 *
 * Architecture:
 * - Views are ViewContainer components with comp_id
 * - Views contain root_node_id pointing to a node tree
 * - Nodes point to References which point to Components
 * - Frontend works with "resolved" views (ResolvedView, ResolvedNode)
 * - Mutations go through entity APIs (components, references, nodes)
 * - After mutations, re-fetch resolved view to update state
 *
 * ID Naming Convention:
 * - All IDs use prefixed field names: node_id, ref_id, comp_id
 * - CompId for component identifiers
 * - RefId for reference identifiers
 * - NodeId for node identifiers
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type {
  NodeId,
  RefId,
  CompId,
  ComponentType,
  ResolvedNode,
  ResolvedView,
} from '@/lib/content/types';
import {
  fetchResolvedView,
  addComponentToView,
  addChildToNode,
  updateReference,
  updateComponent as apiUpdateComponent,
  deleteNode,
  moveNode,
} from '@/lib/api/client';

// API base URL for direct calls not covered by client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ViewState {
  // Current view being displayed (with resolved components)
  currentView: ResolvedView | null;
  // All available views (for navigation/linking)
  allViews: ResolvedView[];
  // Loading states
  loading: boolean;
  saving: boolean;
  error: string | null;
  // Component being edited
  editingComponent: ResolvedNode | null;
  // Track node_id and ref_id for each component (keyed by comp_id)
  componentNodeMap: Record<CompId, { node_id: NodeId; ref_id: RefId }>;
}

const initialState: ViewState = {
  currentView: null,
  allViews: [],
  loading: false,
  saving: false,
  error: null,
  editingComponent: null,
  componentNodeMap: {},
};

/**
 * Build componentNodeMap from resolved components
 * Maps comp_id -> { node_id, ref_id } for mutation operations
 */
function buildComponentNodeMap(
  components: ResolvedNode[]
): Record<CompId, { node_id: NodeId; ref_id: RefId }> {
  const map: Record<CompId, { node_id: NodeId; ref_id: RefId }> = {};

  function traverse(node: ResolvedNode) {
    console.log('[buildComponentNodeMap] Mapping component:', {
      comp_id: node.comp_id,
      node_id: node.node_id,
      ref_id: node.ref_id,
      type: node.type,
    });
    map[node.comp_id] = {
      node_id: node.node_id,
      ref_id: node.ref_id,
    };
    node.children?.forEach(traverse);
  }

  components.forEach(traverse);
  console.log('[buildComponentNodeMap] Built map with', Object.keys(map).length, 'entries');
  return map;
}

// ============ ASYNC THUNKS ============

/**
 * Fetch and set the current view (resolved)
 */
export const fetchCurrentView = createAsyncThunk(
  'view/fetchCurrentView',
  async (viewId: CompId, { rejectWithValue }) => {
    const result = await fetchResolvedView(viewId as unknown as NodeId);
    if (result.error) {
      return rejectWithValue(result.error);
    }
    return result.data!;
  }
);

/**
 * Save view metadata (title, description, etc.)
 */
export const saveView = createAsyncThunk(
  'view/saveView',
  async (view: ResolvedView, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/views/${view.comp_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: view.path,
          name: view.name,
          title: view.title,
          browser_title: view.browser_title,
          description: view.description,
          is_home: view.is_home,
        }),
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

/**
 * Add a component to the current view
 */
export const addComponentToCurrentView = createAsyncThunk(
  'view/addComponent',
  async (
    {
      viewId,
      component_type,
      config,
      after_node_id,
    }: {
      viewId: CompId;
      component_type: ComponentType;
      config: Record<string, unknown>;
      after_node_id?: NodeId | null;
    },
    { rejectWithValue }
  ) => {
    console.log('[addComponentToCurrentView] Starting, viewId:', viewId, 'type:', component_type);

    const result = await addComponentToView(
      viewId as unknown as NodeId,
      component_type,
      config,
      after_node_id
    );
    if (result.error) {
      console.log('[addComponentToCurrentView] addComponentToView failed:', result.error);
      return rejectWithValue(result.error);
    }
    console.log('[addComponentToCurrentView] addComponentToView succeeded:', result.data);

    // Re-fetch the resolved view to get updated state
    console.log('[addComponentToCurrentView] Fetching resolved view...');
    const viewResult = await fetchResolvedView(viewId as unknown as NodeId);
    if (viewResult.error) {
      console.log('[addComponentToCurrentView] fetchResolvedView failed:', viewResult.error);
      return rejectWithValue(viewResult.error);
    }
    console.log('[addComponentToCurrentView] fetchResolvedView succeeded, components:', viewResult.data?.components?.length);

    return viewResult.data!;
  }
);

/**
 * Add a child component to a ListContainer or StyleContainer
 */
export const addChildToListComponent = createAsyncThunk(
  'view/addChildComponent',
  async (
    {
      viewId,
      parent_node_id,
      component_type,
      config,
      after_node_id,
    }: {
      viewId: CompId;
      parent_node_id: NodeId;
      component_type: ComponentType;
      config: Record<string, unknown>;
      after_node_id?: NodeId | null;
    },
    { rejectWithValue }
  ) => {
    console.log('[addChildToListComponent] Starting, parent_node_id:', parent_node_id, 'type:', component_type);
    const result = await addChildToNode(parent_node_id, component_type, config, after_node_id);
    if (result.error) {
      console.log('[addChildToListComponent] addChildToNode failed:', result.error);
      return rejectWithValue(result.error);
    }
    console.log('[addChildToListComponent] addChildToNode succeeded:', result.data);

    // Re-fetch the resolved view to get updated state
    console.log('[addChildToListComponent] Fetching resolved view...');
    const viewResult = await fetchResolvedView(viewId as unknown as NodeId);
    if (viewResult.error) {
      console.log('[addChildToListComponent] fetchResolvedView failed:', viewResult.error);
      return rejectWithValue(viewResult.error);
    }
    console.log('[addChildToListComponent] fetchResolvedView succeeded, components:', viewResult.data?.components?.length);

    return viewResult.data!;
  }
);

/**
 * Update a component's config (via reference overrides or component directly)
 */
export const updateComponentConfig = createAsyncThunk(
  'view/updateComponentConfig',
  async (
    {
      viewId,
      comp_id,
      component_type,
      ref_id,
      config,
      useOverrides = false,
    }: {
      viewId: CompId;
      comp_id: CompId;
      component_type: ComponentType;
      ref_id: RefId;
      config: Record<string, unknown>;
      useOverrides?: boolean;
    },
    { rejectWithValue }
  ) => {
    console.log('[updateComponentConfig] Starting:', {
      viewId,
      comp_id,
      component_type,
      ref_id,
      useOverrides,
      configKeys: Object.keys(config),
    });

    let result;

    if (useOverrides) {
      // Update via reference overrides (location-specific)
      result = await updateReference(ref_id as unknown as NodeId, config);
    } else {
      // Update the component directly (affects all usages)
      result = await apiUpdateComponent(component_type, comp_id as unknown as NodeId, config);
    }

    if (result.error) {
      console.log('[updateComponentConfig] Error:', result.error);
      return rejectWithValue(result.error);
    }

    // Re-fetch the resolved view to get updated state
    const viewResult = await fetchResolvedView(viewId as unknown as NodeId);
    if (viewResult.error) {
      return rejectWithValue(viewResult.error);
    }

    console.log('[updateComponentConfig] Success, refetched view');
    return viewResult.data!;
  }
);

/**
 * Delete a component (deletes the node, which cascades to reference)
 */
export const deleteComponentFromView = createAsyncThunk(
  'view/deleteComponent',
  async (
    { viewId, node_id }: { viewId: CompId; node_id: NodeId },
    { rejectWithValue }
  ) => {
    const result = await deleteNode(node_id);
    if (result.error) {
      return rejectWithValue(result.error);
    }

    // Re-fetch the resolved view to get updated state
    const viewResult = await fetchResolvedView(viewId as unknown as NodeId);
    if (viewResult.error) {
      return rejectWithValue(viewResult.error);
    }

    return viewResult.data!;
  }
);

/**
 * Move a component up or down
 */
export const moveComponentInView = createAsyncThunk(
  'view/moveComponent',
  async (
    {
      viewId,
      node_id,
      direction,
    }: {
      viewId: CompId;
      node_id: NodeId;
      direction: 'up' | 'down';
    },
    { rejectWithValue }
  ) => {
    // Get current node to find siblings
    const nodeRes = await fetch(`${API_BASE_URL}/nodes/${node_id}`);
    if (!nodeRes.ok) {
      return rejectWithValue('Failed to fetch node');
    }
    const node = await nodeRes.json();

    let after_node_id: NodeId | null = null;

    if (direction === 'up') {
      // Move before previous sibling (after the one before previous)
      if (node.previous_node_id) {
        const prevRes = await fetch(`${API_BASE_URL}/nodes/${node.previous_node_id}`);
        if (prevRes.ok) {
          const prevNode = await prevRes.json();
          after_node_id = prevNode.previous_node_id;
        }
      }
    } else {
      // Move after next sibling
      after_node_id = node.next_node_id;
    }

    // If we can't move (already at edge), just return current state
    if (direction === 'up' && !node.previous_node_id) {
      const viewResult = await fetchResolvedView(viewId as unknown as NodeId);
      return viewResult.data!;
    }
    if (direction === 'down' && !node.next_node_id) {
      const viewResult = await fetchResolvedView(viewId as unknown as NodeId);
      return viewResult.data!;
    }

    const result = await moveNode(node_id, node.parent_node_id, after_node_id);
    if (result.error) {
      return rejectWithValue(result.error);
    }

    // Re-fetch the resolved view to get updated state
    const viewResult = await fetchResolvedView(viewId as unknown as NodeId);
    if (viewResult.error) {
      return rejectWithValue(viewResult.error);
    }

    return viewResult.data!;
  }
);

// ============ SLICE ============

const viewSlice = createSlice({
  name: 'view',
  initialState,
  reducers: {
    // Set the current view
    setCurrentView: (state, action: PayloadAction<ResolvedView>) => {
      console.log('[viewSlice] setCurrentView:', {
        comp_id: action.payload.comp_id,
        name: action.payload.name,
        componentsCount: action.payload.components.length,
      });
      state.currentView = action.payload;
      state.error = null;
      state.componentNodeMap = buildComponentNodeMap(action.payload.components);
    },

    // Set all available views
    setAllViews: (state, action: PayloadAction<ResolvedView[]>) => {
      console.log('[viewSlice] setAllViews:', action.payload.length, 'views');
      action.payload.forEach((view, idx) => {
        console.log(`  [${idx}] comp_id=${view.comp_id}, name='${view.name}', path='${view.path}', root_node_id=${view.root_node_id}`);
      });
      state.allViews = action.payload;
    },

    // Set the component being edited
    setEditingComponent: (state, action: PayloadAction<ResolvedNode | null>) => {
      console.log('[viewSlice] setEditingComponent:', action.payload?.comp_id ?? null);
      state.editingComponent = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set component node map
    setComponentNodeMap: (
      state,
      action: PayloadAction<Record<CompId, { node_id: NodeId; ref_id: RefId }>>
    ) => {
      state.componentNodeMap = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current view
      .addCase(fetchCurrentView.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentView.fulfilled, (state, action) => {
        state.loading = false;
        state.currentView = action.payload;
        state.componentNodeMap = buildComponentNodeMap(action.payload.components);
      })
      .addCase(fetchCurrentView.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
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
      // Add component to view
      .addCase(addComponentToCurrentView.pending, (state) => {
        console.log('[viewSlice] addComponentToCurrentView.pending');
        state.saving = true;
        state.error = null;
      })
      .addCase(addComponentToCurrentView.fulfilled, (state, action) => {
        console.log('[viewSlice] addComponentToCurrentView.fulfilled, components:', action.payload.components.length);
        state.saving = false;
        state.currentView = action.payload;
        state.componentNodeMap = buildComponentNodeMap(action.payload.components);
      })
      .addCase(addComponentToCurrentView.rejected, (state, action) => {
        console.log('[viewSlice] addComponentToCurrentView.rejected:', action.payload);
        state.saving = false;
        state.error = action.payload as string;
      })
      // Add child to list
      .addCase(addChildToListComponent.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addChildToListComponent.fulfilled, (state, action) => {
        state.saving = false;
        state.currentView = action.payload;
        state.componentNodeMap = buildComponentNodeMap(action.payload.components);
      })
      .addCase(addChildToListComponent.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Update component config
      .addCase(updateComponentConfig.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateComponentConfig.fulfilled, (state, action) => {
        state.saving = false;
        state.currentView = action.payload;
        state.componentNodeMap = buildComponentNodeMap(action.payload.components);
      })
      .addCase(updateComponentConfig.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Delete component
      .addCase(deleteComponentFromView.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteComponentFromView.fulfilled, (state, action) => {
        state.saving = false;
        state.currentView = action.payload;
        state.componentNodeMap = buildComponentNodeMap(action.payload.components);
      })
      .addCase(deleteComponentFromView.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Move component
      .addCase(moveComponentInView.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(moveComponentInView.fulfilled, (state, action) => {
        state.saving = false;
        state.currentView = action.payload;
        state.componentNodeMap = buildComponentNodeMap(action.payload.components);
      })
      .addCase(moveComponentInView.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setCurrentView,
  setAllViews,
  setEditingComponent,
  clearError,
  setComponentNodeMap,
} = viewSlice.actions;

// Selectors
export const selectCurrentView = (state: RootState) => state.view.currentView;
export const selectAllViews = (state: RootState) => state.view.allViews;
export const selectViewLoading = (state: RootState) => state.view.loading;
export const selectViewSaving = (state: RootState) => state.view.saving;
export const selectViewError = (state: RootState) => state.view.error;
export const selectEditingComponent = (state: RootState) => state.view.editingComponent;
export const selectComponentNodeMap = (state: RootState) => state.view.componentNodeMap;

// Derived selectors
export const selectViewComponents = (state: RootState) =>
  state.view.currentView?.components ?? [];

export const selectViewByCompId = (state: RootState, compId: CompId) =>
  state.view.allViews.find((v) => v.comp_id === compId);

export const selectViewPathMap = (state: RootState): Map<CompId, string> => {
  const map = new Map<CompId, string>();
  state.view.allViews.forEach((view) => {
    map.set(view.comp_id, view.path);
  });
  return map;
};

/**
 * Check if a home view is configured
 */
export const selectHasHomeView = (state: RootState): boolean => {
  return state.view.allViews.some((v) => v.is_home === true);
};

/**
 * Get the home view if configured
 */
export const selectHomeView = (state: RootState): ResolvedView | undefined => {
  return state.view.allViews.find((v) => v.is_home === true);
};

/**
 * Get node info for a component (for mutations)
 * Uses comp_id to look up the associated node_id and ref_id
 */
export const selectComponentNodeInfo = (
  state: RootState,
  comp_id: CompId
): { node_id: NodeId; ref_id: RefId } | undefined => {
  return state.view.componentNodeMap[comp_id];
};

/**
 * Get a component by comp_id from the current view
 */
export const selectComponentByCompId = (
  state: RootState,
  comp_id: CompId
): ResolvedNode | undefined => {
  const components = state.view.currentView?.components ?? [];

  function findComponent(nodes: ResolvedNode[]): ResolvedNode | undefined {
    for (const node of nodes) {
      if (node.comp_id === comp_id) return node;
      if (node.children) {
        const found = findComponent(node.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  return findComponent(components);
};

/**
 * Get all components as a flat map by comp_id
 */
export const selectComponentsMap = (state: RootState): Record<CompId, ResolvedNode> => {
  const map: Record<CompId, ResolvedNode> = {};
  const components = state.view.currentView?.components ?? [];

  function addToMap(node: ResolvedNode) {
    map[node.comp_id] = node;
    node.children?.forEach(addToMap);
  }

  components.forEach(addToMap);
  return map;
};

/**
 * Select all components of a specific type from the current view
 */
export const selectComponentsByType = (
  state: RootState,
  type: ComponentType
): ResolvedNode[] => {
  const components: ResolvedNode[] = [];
  const allComponents = state.view.currentView?.components ?? [];

  function findByType(node: ResolvedNode) {
    if (node.type === type) {
      components.push(node);
    }
    node.children?.forEach(findByType);
  }

  allComponents.forEach(findByType);
  return components;
};

export default viewSlice.reducer;
