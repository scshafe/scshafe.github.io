'use client';

import { useState, useEffect } from 'react';
import type { ResolvedView, CompId } from '@/lib/content/types';
import { validateViewPath } from '@/lib/content/views';

interface ViewEditorProps {
  view: ResolvedView;
  isNew: boolean;
  existingViews: ResolvedView[];
  onSave: (view: ResolvedView) => void;
  onCancel: () => void;
}

export function ViewEditor({
  view,
  isNew,
  existingViews,
  onSave,
  onCancel,
}: ViewEditorProps) {
  const [formData, setFormData] = useState<ResolvedView>(view);
  const [pathError, setPathError] = useState<string | null>(null);

  // Validate path when it changes
  useEffect(() => {
    const result = validateViewPath(
      formData.path,
      existingViews.map((v) => ({
        ...v,
        id: v.comp_id,
      })),
      isNew ? undefined : view.comp_id
    );
    setPathError(result.valid ? null : result.error || 'Invalid path');
  }, [formData.path, existingViews, isNew, view.comp_id]);

  const handleSave = () => {
    if (pathError) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
            {isNew ? 'Create View' : 'Edit View'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-[length:var(--text-sm)] font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
              View Settings
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-1">
                  Name (internal)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:border-[var(--link)]"
                  placeholder="e.g., blog"
                />
              </div>

              <div>
                <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-1">
                  Path
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, path: e.target.value }))
                  }
                  className={`w-full px-3 py-2 bg-[var(--background-secondary)] border rounded-md text-[var(--foreground)] focus:outline-none ${
                    pathError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[var(--border)] focus:border-[var(--link)]'
                  }`}
                  placeholder="e.g., /blog"
                />
                {pathError && (
                  <p className="text-[length:var(--text-xs)] text-red-400 mt-1">
                    {pathError}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-1">
                Title (displayed on page)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:border-[var(--link)]"
                placeholder="e.g., Blog"
              />
            </div>

            <div>
              <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-1">
                Browser Title (tab title)
              </label>
              <input
                type="text"
                value={formData.browser_title || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    browser_title: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:border-[var(--link)]"
                placeholder="e.g., Blog - My Site"
              />
            </div>

            <div>
              <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-1">
                Description (for SEO)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none focus:border-[var(--link)] resize-none"
                rows={2}
                placeholder="A brief description of this page..."
              />
            </div>

          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] border border-[var(--border)] rounded-md hover:bg-[var(--background-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!!pathError || !formData.name}
            className="px-4 py-2 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isNew ? 'Create View' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
