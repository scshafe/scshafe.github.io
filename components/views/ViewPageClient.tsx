'use client';

import { useEffect, useCallback } from 'react';
import type { ResolvedView, ResolvedNode, NodeId, CompId, RefId, ComponentType } from '@/lib/content/types';
import { ViewRenderer } from './ViewRenderer';
import { InlineComponentEditor } from './InlineComponentEditor';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import {
  selectCurrentView,
  selectEditingComponent,
  selectComponentNodeMap,
  setCurrentView,
  setEditingComponent,
  // Entity-based thunks
  addComponentToCurrentView,
  addChildToListComponent,
  updateComponentConfig,
  deleteComponentFromView,
  moveComponentInView,
} from '@/lib/store/slices/viewSlice';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';

interface ViewPageClientProps {
  initialView: ResolvedView;
}

export function ViewPageClient({ initialView }: ViewPageClientProps) {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectCurrentView);
  const editingComponent = useAppSelector(selectEditingComponent);
  const isAuthorMode = useAppSelector(selectIsAuthorMode);
  const componentNodeMap = useAppSelector(selectComponentNodeMap);

  // Debug: Log when props change
  useEffect(() => {
    console.log('[ViewPageClient] initialView prop changed:', {
      comp_id: initialView.comp_id,
      name: initialView.name,
      componentsCount: initialView.components.length,
      components: initialView.components.map(c => ({
        comp_id: c.comp_id,
        node_id: c.node_id,
        type: c.type,
      })),
    });
  }, [initialView]);

  // Debug: Log when selectors return new values
  useEffect(() => {
    console.log('[ViewPageClient] view selector changed:', view ? {
      comp_id: view.comp_id,
      name: view.name,
      componentsCount: view.components.length,
    } : null);
  }, [view]);

  useEffect(() => {
    console.log('[ViewPageClient] componentNodeMap selector changed:', componentNodeMap);
  }, [componentNodeMap]);

  useEffect(() => {
    console.log('[ViewPageClient] isAuthorMode selector changed:', isAuthorMode);
  }, [isAuthorMode]);

  useEffect(() => {
    console.log('[ViewPageClient] editingComponent selector changed:', editingComponent);
  }, [editingComponent]);

  // Set the initial view when the component mounts or initialView changes
  useEffect(() => {
    console.log('[ViewPageClient] Dispatching setCurrentView with initialView');
    dispatch(setCurrentView(initialView));
  }, [dispatch, initialView]);

  // Handle component update (for inline edits like PDF uploads)
  const handleComponentUpdate = useCallback(
    async (node: ResolvedNode, config: Record<string, unknown>) => {
      if (!isAuthorMode || !view) return;

      await dispatch(
        updateComponentConfig({
          viewId: view.comp_id,
          comp_id: node.comp_id,
          component_type: node.type,
          ref_id: node.ref_id,
          config,
          useOverrides: false, // Update the component directly
        })
      ).unwrap();
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle component delete
  const handleComponentDelete = useCallback(
    async (node_id: NodeId) => {
      if (!isAuthorMode || !view) return;

      await dispatch(deleteComponentFromView({ viewId: view.comp_id, node_id })).unwrap();
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle component move
  const handleComponentMove = useCallback(
    async (node_id: NodeId, direction: 'up' | 'down') => {
      if (!isAuthorMode || !view) return;

      await dispatch(
        moveComponentInView({
          viewId: view.comp_id,
          node_id,
          direction,
        })
      ).unwrap();
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle component add
  const handleComponentAdd = useCallback(
    async (component_type: ComponentType, config: Record<string, unknown>) => {
      if (!isAuthorMode || !view) return;

      await dispatch(
        addComponentToCurrentView({
          viewId: view.comp_id,
          component_type,
          config,
        })
      ).unwrap();
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle edit component (opens modal)
  const handleEditComponent = useCallback(
    (node: ResolvedNode) => {
      console.log('[ViewPageClient] handleEditComponent called with node:', {
        comp_id: node.comp_id,
        node_id: node.node_id,
        type: node.type,
      });
      dispatch(setEditingComponent(node));
    },
    [dispatch]
  );

  // Handle adding a child component to a ListContainer or StyleContainer
  const handleAddChild = useCallback(
    async (parent_node_id: NodeId, component_type: ComponentType, config: Record<string, unknown>) => {
      console.log('[ViewPageClient] handleAddChild called:', { parent_node_id, component_type, config });
      if (!isAuthorMode || !view) {
        console.log('[ViewPageClient] handleAddChild aborted - isAuthorMode:', isAuthorMode, 'view:', !!view);
        return;
      }

      await dispatch(
        addChildToListComponent({
          viewId: view.comp_id,
          parent_node_id,
          component_type,
          config,
        })
      ).unwrap();
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle deleting a child component from a List
  const handleDeleteChild = useCallback(
    async (node_id: NodeId) => {
      if (!isAuthorMode || !view) return;

      // Same as top-level delete since nodes handle their own positioning
      await dispatch(deleteComponentFromView({ viewId: view.comp_id, node_id })).unwrap();
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle moving a child component within a List
  const handleMoveChild = useCallback(
    async (node_id: NodeId, direction: 'up' | 'down') => {
      if (!isAuthorMode || !view) return;

      // Same as top-level move since nodes handle their own positioning
      await dispatch(
        moveComponentInView({
          viewId: view.comp_id,
          node_id,
          direction,
        })
      ).unwrap();
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle save from editor modal
  const handleEditorSave = useCallback(
    async (node: ResolvedNode, config: Record<string, unknown>) => {
      await handleComponentUpdate(node, config);
      dispatch(setEditingComponent(null));
    },
    [handleComponentUpdate, dispatch]
  );

  // Don't render until we have the view from Redux
  if (!view) {
    return null;
  }

  return (
    <>
      <ViewRenderer
        view={view}
        onComponentUpdate={handleComponentUpdate}
        onComponentDelete={handleComponentDelete}
        onComponentMove={handleComponentMove}
        onComponentAdd={handleComponentAdd}
        onEditComponent={handleEditComponent}
        onAddChild={handleAddChild}
        onDeleteChild={handleDeleteChild}
        onMoveChild={handleMoveChild}
      />

      {/* Component Editor Modal */}
      {editingComponent && (
        <InlineComponentEditor
          component={editingComponent}
          onSave={handleEditorSave}
          onCancel={() => dispatch(setEditingComponent(null))}
        />
      )}
    </>
  );
}
