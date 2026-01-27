'use client';

import { useState } from 'react';
import type { View, ViewsConfig } from '@/lib/content/views';
import { ViewsList } from './ViewsList';
import { ViewEditor } from './ViewEditor';
import { createDefaultView } from '@/lib/content/views';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface ViewsTabProps {
  initialConfig: ViewsConfig;
}

export function ViewsTab({ initialConfig }: ViewsTabProps) {
  const [config, setConfig] = useState(initialConfig);
  const [editingView, setEditingView] = useState<View | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const saveConfig = async (newConfig: ViewsConfig) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${DEV_EDITOR_URL}/views`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (!res.ok) {
        throw new Error('Failed to save views');
      }

      setConfig(newConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateView = () => {
    setEditingView(createDefaultView(config.views));
    setIsCreating(true);
  };

  const handleEditView = (view: View) => {
    setEditingView(view);
    setIsCreating(false);
  };

  const handleSaveView = async (view: View) => {
    let newViews: View[];

    if (isCreating) {
      newViews = [...config.views, view];
    } else {
      newViews = config.views.map((v) => (v.id === view.id ? view : v));
    }

    // If this view is marked as home, unmark others
    if (view.isHome) {
      newViews = newViews.map((v) => ({
        ...v,
        isHome: v.id === view.id,
      }));
    }

    const newConfig: ViewsConfig = {
      ...config,
      views: newViews,
      defaultHomeViewId: view.isHome ? view.id : config.defaultHomeViewId,
    };

    await saveConfig(newConfig);
    setEditingView(null);
    setIsCreating(false);
  };

  const handleDeleteView = async (viewId: string) => {
    const newViews = config.views.filter((v) => v.id !== viewId);
    const newConfig: ViewsConfig = {
      ...config,
      views: newViews,
      defaultHomeViewId:
        config.defaultHomeViewId === viewId
          ? newViews[0]?.id
          : config.defaultHomeViewId,
    };

    await saveConfig(newConfig);
  };

  const handleSetHome = async (viewId: string) => {
    const newViews = config.views.map((v) => ({
      ...v,
      isHome: v.id === viewId,
      path: v.id === viewId ? '/' : v.path === '/' ? `/${v.id}` : v.path,
    }));

    const newConfig: ViewsConfig = {
      ...config,
      views: newViews,
      defaultHomeViewId: viewId,
    };

    await saveConfig(newConfig);
  };

  const handleReorder = async (orderedIds: string[]) => {
    const viewsById = new Map(config.views.map((v) => [v.id, v]));
    const newViews = orderedIds
      .map((id) => viewsById.get(id))
      .filter((v): v is View => v !== undefined);

    const newConfig: ViewsConfig = {
      ...config,
      views: newViews,
    };

    await saveConfig(newConfig);
  };

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[length:var(--text-sm)]">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-md text-green-400">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[length:var(--text-sm)]">Changes saved!</span>
        </div>
      )}

      {/* Views Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
              Views
            </h2>
            <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
              Configure the pages and their content
            </p>
          </div>
          <button
            onClick={handleCreateView}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--link)] text-white text-[length:var(--text-sm)] rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create View
          </button>
        </div>

        <ViewsList
          views={config.views}
          onEdit={handleEditView}
          onDelete={handleDeleteView}
          onReorder={handleReorder}
          onSetHome={handleSetHome}
          saving={saving}
        />
      </section>

      {/* View Editor Modal */}
      {editingView && (
        <ViewEditor
          view={editingView}
          isNew={isCreating}
          existingViews={config.views}
          onSave={handleSaveView}
          onCancel={() => {
            setEditingView(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}
