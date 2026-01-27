'use client';

import { useState, useCallback } from 'react';
import type { View, ViewComponent } from '@/lib/content/views';
import { ViewRenderer } from './ViewRenderer';
import { InlineComponentEditor } from './InlineComponentEditor';
import { useAuthorMode } from '@/components/author/DevModeProvider';

interface ViewPageClientProps {
  initialView: View;
}

export function ViewPageClient({ initialView }: ViewPageClientProps) {
  const [view, setView] = useState<View>(initialView);
  const [editingComponent, setEditingComponent] = useState<ViewComponent | null>(null);
  const { isAuthorMode } = useAuthorMode();

  // Save view to backend
  const saveView = useCallback(
    async (updatedView: View) => {
      try {
        const res = await fetch(`http://localhost:3001/views/${updatedView.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedView),
        });

        if (res.ok) {
          setView(updatedView);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to save view:', error);
        return false;
      }
    },
    []
  );

  // Handle content update (for markdown components)
  const handleContentUpdate = useCallback(
    async (contentKey: string, content: string) => {
      if (!isAuthorMode) return;

      try {
        const res = await fetch(`http://localhost:3001/views/${view.id}/content`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentKey, content }),
        });

        if (res.ok) {
          setView((prev) => ({
            ...prev,
            content: {
              ...prev.content,
              [contentKey]: content,
            },
          }));
        }
      } catch (error) {
        console.error('Failed to update content:', error);
      }
    },
    [isAuthorMode, view.id]
  );

  // Handle component update (for inline edits like PDF uploads)
  const handleComponentUpdate = useCallback(
    async (component: ViewComponent) => {
      if (!isAuthorMode) return;

      const updatedView: View = {
        ...view,
        components: view.components.map((c) =>
          c.id === component.id ? component : c
        ),
      };

      await saveView(updatedView);
    },
    [isAuthorMode, view, saveView]
  );

  // Handle component delete
  const handleComponentDelete = useCallback(
    async (componentId: string) => {
      if (!isAuthorMode) return;

      const updatedView: View = {
        ...view,
        components: view.components.filter((c) => c.id !== componentId),
      };

      await saveView(updatedView);
    },
    [isAuthorMode, view, saveView]
  );

  // Handle component move
  const handleComponentMove = useCallback(
    async (componentId: string, direction: 'up' | 'down') => {
      if (!isAuthorMode) return;

      const index = view.components.findIndex((c) => c.id === componentId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= view.components.length) return;

      const newComponents = [...view.components];
      const [moved] = newComponents.splice(index, 1);
      newComponents.splice(newIndex, 0, moved);

      const updatedView: View = {
        ...view,
        components: newComponents,
      };

      await saveView(updatedView);
    },
    [isAuthorMode, view, saveView]
  );

  // Handle component add
  const handleComponentAdd = useCallback(
    async (component: ViewComponent) => {
      if (!isAuthorMode) return;

      const updatedView: View = {
        ...view,
        components: [...view.components, component],
      };

      await saveView(updatedView);
    },
    [isAuthorMode, view, saveView]
  );

  // Handle edit component (opens modal)
  const handleEditComponent = useCallback((component: ViewComponent) => {
    setEditingComponent(component);
  }, []);

  // Handle save from editor modal
  const handleEditorSave = useCallback(
    async (component: ViewComponent) => {
      await handleComponentUpdate(component);
      setEditingComponent(null);
    },
    [handleComponentUpdate]
  );

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
      />

      {/* Component Editor Modal */}
      {editingComponent && (
        <InlineComponentEditor
          component={editingComponent}
          onSave={handleEditorSave}
          onCancel={() => setEditingComponent(null)}
        />
      )}
    </>
  );
}
