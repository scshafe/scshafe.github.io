'use client';

import { useState } from 'react';
import type { ResolvedView, CompId, NodeId } from '@/lib/content/types';
import { ViewsList } from './ViewsList';
import { ViewEditor } from './ViewEditor';
import { asCompId, asNodeId } from '@/lib/content/types';
import { useAppDispatch } from '@/lib/store/hooks';
import { setAllViews } from '@/lib/store/slices/viewSlice';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface ViewsTabProps {
  initialViews: ResolvedView[];
}

export function ViewsTab({ initialViews }: ViewsTabProps) {
  const dispatch = useAppDispatch();
  const [views, setViews] = useState<ResolvedView[]>(initialViews);
  const [editingView, setEditingView] = useState<ResolvedView | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [homeViewNodeId, setHomeViewNodeId] = useState<NodeId | null>(
    views.find((v) => v.is_home)?.root_node_id || null
  );

  const createDefaultView = (): ResolvedView => {
    // Generate a random comp_id
    const newCompId = asCompId(Math.floor(Math.random() * 0xffffffff));
    // Find unique path
    let pathNum = views.length + 1;
    let path = `/page-${pathNum}`;
    while (views.some((v) => v.path === path)) {
      pathNum++;
      path = `/page-${pathNum}`;
    }

    return {
      comp_id: newCompId,
      path,
      name: `Page ${pathNum}`,
      title: `Page ${pathNum}`,
      browser_title: `Page ${pathNum}`,
      description: '',
      is_home: false,
      components: [],
    };
  };

  const handleCreateView = () => {
    setEditingView(createDefaultView());
    setIsCreating(true);
  };

  const handleEditView = (view: ResolvedView) => {
    setEditingView(view);
    setIsCreating(false);
  };

  const handleSaveView = async (view: ResolvedView) => {
    setSaving(true);
    setError(null);

    try {
      const method = isCreating ? 'POST' : 'PUT';
      const url = isCreating
        ? `${DEV_EDITOR_URL}/views`
        : `${DEV_EDITOR_URL}/views/${view.comp_id}`;

      const res = await fetch(url, {
        method,
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

      const responseData = await res.json();

      let updatedViews: ResolvedView[];
      if (isCreating) {
        // POST returns { success, comp_id, ref_id, node_id, view: {...} }
        // Build a ResolvedView from the response and local data
        const newView: ResolvedView = {
          comp_id: asCompId(responseData.comp_id),
          root_node_id: asNodeId(responseData.node_id),
          path: view.path,
          name: view.name,
          title: view.title,
          browser_title: view.browser_title,
          description: view.description,
          is_home: view.is_home,
          components: [],
        };
        updatedViews = [...views, newView];
      } else {
        // PUT returns { success, comp_id } - use local view data for update
        updatedViews = views.map((v) => (v.comp_id === view.comp_id ? { ...v, ...view } : v));
      }
      setViews(updatedViews);
      // Update Redux store so navigation links reflect changes
      dispatch(setAllViews(updatedViews));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setEditingView(null);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteView = async (viewCompId: CompId) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${DEV_EDITOR_URL}/views/${viewCompId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error(`Failed to delete view: ${res.status}`);
      }

      const deletedView = views.find((v) => v.comp_id === viewCompId);
      const updatedViews = views.filter((v) => v.comp_id !== viewCompId);
      setViews(updatedViews);
      // Update Redux store so navigation links reflect deletion
      dispatch(setAllViews(updatedViews));
      if (deletedView?.root_node_id === homeViewNodeId) {
        setHomeViewNodeId(null);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const handleSetHomeView = async (viewNodeId: NodeId | null) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${DEV_EDITOR_URL}/site/home-view`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_home_node_id: viewNodeId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to set home view: ${res.status}`);
      }

      setHomeViewNodeId(viewNodeId);
      const updatedViews = views.map((v) => ({
        ...v,
        is_home: v.root_node_id === viewNodeId,
      }));
      setViews(updatedViews);
      // Update Redux store so Header reflects the new home view immediately
      dispatch(setAllViews(updatedViews));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set home view');
    } finally {
      setSaving(false);
    }
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
          views={views}
          homeViewNodeId={homeViewNodeId}
          onEdit={handleEditView}
          onDelete={handleDeleteView}
          saving={saving}
        />
      </section>

      {/* Default Home View Section */}
      <section>
        <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)] mb-2">
          Default Home View
        </h2>
        <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] mb-4">
          Select which view the site name in the header should link to.
        </p>

        <select
          value={homeViewNodeId || ''}
          onChange={(e) =>
            handleSetHomeView(e.target.value ? asNodeId(Number(e.target.value)) : null)
          }
          className="w-full max-w-md px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]"
          disabled={saving}
        >
          <option value="">-- Select a home view --</option>
          {views.filter((v) => v.root_node_id).map((view) => (
            <option key={view.root_node_id} value={view.root_node_id}>
              {view.name} ({view.path})
            </option>
          ))}
        </select>

        {homeViewNodeId && (
          <div className="mt-3 p-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md max-w-md">
            <div className="flex items-center gap-2 text-[length:var(--text-sm)]">
              <svg
                className="w-4 h-4 text-[var(--link)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {(() => {
                const homeView = views.find((v) => v.root_node_id === homeViewNodeId);
                return homeView ? (
                  <>
                    <span className="text-[var(--foreground)]">
                      Current: <strong>{homeView.name}</strong>
                    </span>
                    <span className="text-[var(--foreground-muted)]">({homeView.path})</span>
                  </>
                ) : (
                  <span className="text-yellow-400">
                    Warning: Selected view (node_id: {homeViewNodeId}) not found
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </section>

      {/* View Editor Modal */}
      {editingView && (
        <ViewEditor
          view={editingView}
          isNew={isCreating}
          existingViews={views}
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
