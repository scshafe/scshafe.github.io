'use client';

import { useEffect, useCallback } from 'react';
import type { View, ViewComponent, NodeId } from '@/lib/content/views';
import { ViewRenderer } from './ViewRenderer';
import { InlineComponentEditor } from './InlineComponentEditor';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import {
  selectCurrentView,
  selectEditingComponent,
  setCurrentView,
  setEditingComponent,
  updateComponent,
  deleteComponent,
  moveComponent,
  addComponent,
  updateContent,
  saveView,
  updateViewContent,
  addChildComponent,
  deleteChildComponent,
  moveChildComponent,
} from '@/lib/store/slices/viewSlice';
import { selectIsAuthorMode } from '@/lib/store/slices/authorSlice';

interface ViewPageClientProps {
  initialView: View;
}

export function ViewPageClient({ initialView }: ViewPageClientProps) {
  const dispatch = useAppDispatch();
  const view = useAppSelector(selectCurrentView);
  const editingComponent = useAppSelector(selectEditingComponent);
  const isAuthorMode = useAppSelector(selectIsAuthorMode);

  // Set the initial view when the component mounts or initialView changes
  useEffect(() => {
    dispatch(setCurrentView(initialView));
  }, [dispatch, initialView]);

  // Handle content update (for markdown components)
  const handleContentUpdate = useCallback(
    async (contentKey: string, content: string) => {
      if (!isAuthorMode || !view) return;

      // Optimistic update
      dispatch(updateContent({ contentKey, content }));

      // Save to backend
      dispatch(updateViewContent({ viewId: view.id, contentKey, content }));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle component update (for inline edits like PDF uploads)
  const handleComponentUpdate = useCallback(
    async (component: ViewComponent) => {
      if (!isAuthorMode || !view) return;

      // Optimistic update
      dispatch(updateComponent(component));

      // Save the entire view to backend
      const updatedView: View = {
        ...view,
        components: view.components.map((c) =>
          c.id === component.id ? component : c
        ),
      };

      dispatch(saveView(updatedView));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle component delete
  const handleComponentDelete = useCallback(
    async (componentId: NodeId) => {
      if (!isAuthorMode || !view) return;

      // Optimistic update
      dispatch(deleteComponent(componentId));

      // Save the entire view to backend
      const updatedView: View = {
        ...view,
        components: view.components.filter((c) => c.id !== componentId),
      };

      dispatch(saveView(updatedView));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle component move
  const handleComponentMove = useCallback(
    async (componentId: NodeId, direction: 'up' | 'down') => {
      if (!isAuthorMode || !view) return;

      const index = view.components.findIndex((c) => c.id === componentId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= view.components.length) return;

      // Optimistic update
      dispatch(moveComponent({ componentId, direction }));

      // Build the new components array for saving
      const newComponents = [...view.components];
      const [moved] = newComponents.splice(index, 1);
      newComponents.splice(newIndex, 0, moved);

      const updatedView: View = {
        ...view,
        components: newComponents,
      };

      dispatch(saveView(updatedView));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle component add
  const handleComponentAdd = useCallback(
    async (component: ViewComponent) => {
      if (!isAuthorMode || !view) return;

      // Optimistic update
      dispatch(addComponent(component));

      // Save the entire view to backend
      const updatedView: View = {
        ...view,
        components: [...view.components, component],
      };

      dispatch(saveView(updatedView));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle edit component (opens modal)
  const handleEditComponent = useCallback(
    (component: ViewComponent) => {
      dispatch(setEditingComponent(component));
    },
    [dispatch]
  );

  // Handle adding a child component to a List
  const handleAddChild = useCallback(
    async (parentId: NodeId, child: ViewComponent) => {
      if (!isAuthorMode || !view) return;

      // Optimistic update
      dispatch(addChildComponent({ parentId, component: child }));

      // Build updated view for saving
      const updatedView: View = {
        ...view,
        components: view.components.map((c) => {
          if (c.id === parentId && 'children' in c) {
            return {
              ...c,
              children: [...(c.children || []), child],
            };
          }
          return c;
        }),
      };

      dispatch(saveView(updatedView));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle deleting a child component from a List
  const handleDeleteChild = useCallback(
    async (childId: NodeId) => {
      if (!isAuthorMode || !view) return;

      // Find the parent that contains this child
      let parentId: NodeId | null = null;
      for (const c of view.components) {
        if ('children' in c && c.children?.some((child) => child.id === childId)) {
          parentId = c.id;
          break;
        }
      }

      if (!parentId) return;

      // Optimistic update
      dispatch(deleteChildComponent({ parentId, componentId: childId }));

      // Build updated view for saving
      const updatedView: View = {
        ...view,
        components: view.components.map((c) => {
          if (c.id === parentId && 'children' in c && c.children) {
            return {
              ...c,
              children: c.children.filter((child) => child.id !== childId),
            };
          }
          return c;
        }),
      };

      dispatch(saveView(updatedView));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle moving a child component within a List
  const handleMoveChild = useCallback(
    async (childId: NodeId, direction: 'up' | 'down') => {
      if (!isAuthorMode || !view) return;

      // Find the parent that contains this child
      let parentId: NodeId | null = null;
      for (const c of view.components) {
        if ('children' in c && c.children?.some((child) => child.id === childId)) {
          parentId = c.id;
          break;
        }
      }

      if (!parentId) return;

      // Optimistic update
      dispatch(moveChildComponent({ parentId, componentId: childId, direction }));

      // Build updated view for saving
      const updatedView: View = {
        ...view,
        components: view.components.map((c) => {
          if (c.id === parentId && 'children' in c && c.children) {
            const children = [...c.children];
            const index = children.findIndex((child) => child.id === childId);
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

      dispatch(saveView(updatedView));
    },
    [isAuthorMode, view, dispatch]
  );

  // Handle save from editor modal
  const handleEditorSave = useCallback(
    async (component: ViewComponent) => {
      await handleComponentUpdate(component);
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
        onContentUpdate={handleContentUpdate}
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
