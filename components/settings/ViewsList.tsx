'use client';

import { useState } from 'react';
import type { ResolvedView, CompId, NodeId } from '@/lib/content/types';

interface ViewsListProps {
  views: ResolvedView[];
  homeViewNodeId: NodeId | null;
  onEdit: (view: ResolvedView) => void;
  onDelete: (viewCompId: CompId) => void;
  saving: boolean;
}

export function ViewsList({
  views,
  homeViewNodeId,
  onEdit,
  onDelete,
  saving,
}: ViewsListProps) {
  if (views.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-[var(--border)] rounded-md text-center">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-[var(--foreground-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-[var(--foreground-muted)]">No views yet</p>
        <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] mt-1">
          Create your first view to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {views.map((view) => (
        <div
          key={view.comp_id}
          className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md"
        >
          {/* View Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-[var(--foreground)] truncate">
                {view.name}
              </h3>
              <span className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] opacity-60">
                id:{view.comp_id}
              </span>
              {homeViewNodeId === view.root_node_id && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[length:var(--text-xs)] rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Home
                </span>
              )}
            </div>
            <p className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] truncate">
              {view.path}
              {view.root_node_id && (
                <span className="opacity-60 ml-2">• root_node:{view.root_node_id}</span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(view)}
              disabled={saving}
              className="p-2 text-[var(--foreground-muted)] hover:text-[var(--link)] hover:bg-[var(--link)]/10 rounded transition-colors disabled:opacity-50"
              title="Edit view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete "${view.name}"?`
                  )
                ) {
                  onDelete(view.comp_id);
                }
              }}
              disabled={saving}
              className="p-2 text-[var(--foreground-muted)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
              title="Delete view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
