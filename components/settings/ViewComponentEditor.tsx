'use client';

/**
 * ViewComponentEditor - Stub for editing view components in settings.
 *
 * This component needs to be rewritten to use the new entity architecture
 * with ResolvedNode and proper API calls.
 *
 * TODO: Implement proper component editing for settings page with:
 * - ResolvedNode type
 * - API calls to update components
 * - Support for all component types
 */

import type { ResolvedNode } from '@/lib/content/types';

interface ViewComponentEditorProps {
  component: ResolvedNode;
  onUpdate: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function ViewComponentEditor({
  component,
  onUpdate,
  onClose,
}: ViewComponentEditorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
            Edit Component
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg">
            <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
              Component type: <strong>{component.type}</strong>
            </p>
            <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)] mt-2">
              Component ID: <code className="text-[var(--foreground)]">{component.comp_id}</code>
            </p>
            <p className="text-amber-400 text-[length:var(--text-sm)] mt-4">
              Component editing is under development.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] border border-[var(--border)] rounded-md hover:bg-[var(--background-secondary)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
