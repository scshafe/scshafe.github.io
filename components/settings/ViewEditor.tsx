'use client';

import { useState, useEffect } from 'react';
import type { View, ViewComponent } from '@/lib/content/views';
import {
  validateViewPath,
  generateViewId,
  createDefaultComponent,
  getComponentTypeOptions,
} from '@/lib/content/views';
import { ComponentPicker } from './ComponentPicker';
import { ViewComponentEditor } from './ViewComponentEditor';

interface ViewEditorProps {
  view: View;
  isNew: boolean;
  existingViews: View[];
  onSave: (view: View) => void;
  onCancel: () => void;
}

export function ViewEditor({
  view,
  isNew,
  existingViews,
  onSave,
  onCancel,
}: ViewEditorProps) {
  const [formData, setFormData] = useState<View>(view);
  const [pathError, setPathError] = useState<string | null>(null);
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ViewComponent | null>(null);
  const [draggedComponentId, setDraggedComponentId] = useState<string | null>(null);
  const [dragOverComponentId, setDragOverComponentId] = useState<string | null>(null);

  // Validate path when it changes
  useEffect(() => {
    const result = validateViewPath(
      formData.path,
      existingViews,
      isNew ? undefined : view.id
    );
    setPathError(result.valid ? null : result.error || 'Invalid path');
  }, [formData.path, existingViews, isNew, view.id]);

  // Update ID when name changes for new views
  useEffect(() => {
    if (isNew && formData.name) {
      const newId = generateViewId(formData.name, existingViews);
      setFormData((prev) => ({ ...prev, id: newId }));
    }
  }, [formData.name, isNew, existingViews]);

  const handleAddComponent = (type: ViewComponent['type']) => {
    const newComponent = createDefaultComponent(type, formData.components);
    setFormData((prev) => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));
    setShowComponentPicker(false);
  };

  const handleUpdateComponent = (updatedComponent: ViewComponent) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c
      ),
    }));
    setEditingComponent(null);
  };

  const handleDeleteComponent = (componentId: string) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== componentId),
    }));
  };

  const handleComponentDragStart = (componentId: string) => {
    setDraggedComponentId(componentId);
  };

  const handleComponentDragOver = (e: React.DragEvent, componentId: string) => {
    e.preventDefault();
    if (componentId !== draggedComponentId) {
      setDragOverComponentId(componentId);
    }
  };

  const handleComponentDrop = (targetId: string) => {
    if (!draggedComponentId || draggedComponentId === targetId) {
      setDraggedComponentId(null);
      setDragOverComponentId(null);
      return;
    }

    const components = [...formData.components];
    const draggedIndex = components.findIndex((c) => c.id === draggedComponentId);
    const targetIndex = components.findIndex((c) => c.id === targetId);

    const [draggedComponent] = components.splice(draggedIndex, 1);
    components.splice(targetIndex, 0, draggedComponent);

    setFormData((prev) => ({ ...prev, components }));
    setDraggedComponentId(null);
    setDragOverComponentId(null);
  };

  const handleSave = () => {
    if (pathError) return;
    onSave(formData);
  };

  const componentTypeLabels = Object.fromEntries(
    getComponentTypeOptions().map((opt) => [opt.type, opt.label])
  );

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
                value={formData.browserTitle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    browserTitle: e.target.value,
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHome"
                checked={formData.isHome || false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isHome: e.target.checked,
                    path: e.target.checked ? '/' : prev.path,
                  }))
                }
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--link)] focus:ring-[var(--link)]"
              />
              <label
                htmlFor="isHome"
                className="text-[length:var(--text-sm)] text-[var(--foreground)]"
              >
                Set as home page (root &quot;/&quot; path)
              </label>
            </div>
          </section>

          {/* Components Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[length:var(--text-sm)] font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
                Components
              </h3>
              <button
                onClick={() => setShowComponentPicker(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[length:var(--text-sm)] text-[var(--link)] hover:bg-[var(--link)]/10 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Component
              </button>
            </div>

            {formData.components.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-[var(--border)] rounded-md text-center">
                <p className="text-[var(--foreground-muted)]">No components yet</p>
                <button
                  onClick={() => setShowComponentPicker(true)}
                  className="mt-2 text-[length:var(--text-sm)] text-[var(--link)] hover:underline"
                >
                  Add your first component
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.components.map((component) => (
                  <div
                    key={component.id}
                    draggable
                    onDragStart={() => handleComponentDragStart(component.id)}
                    onDragOver={(e) => handleComponentDragOver(e, component.id)}
                    onDragLeave={() => setDragOverComponentId(null)}
                    onDrop={() => handleComponentDrop(component.id)}
                    onDragEnd={() => {
                      setDraggedComponentId(null);
                      setDragOverComponentId(null);
                    }}
                    className={`
                      flex items-center gap-3 p-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md
                      cursor-grab active:cursor-grabbing transition-all
                      ${draggedComponentId === component.id ? 'opacity-50' : ''}
                      ${dragOverComponentId === component.id ? 'border-[var(--link)] translate-y-1' : ''}
                    `}
                  >
                    <div className="text-[var(--foreground-muted)]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-[var(--foreground)]">
                        {componentTypeLabels[component.type] || component.type}
                      </span>
                      <span className="text-[length:var(--text-sm)] text-[var(--foreground-muted)] ml-2">
                        #{component.id}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingComponent(component)}
                      className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--link)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteComponent(component.id)}
                      className="p-1.5 text-[var(--foreground-muted)] hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
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

      {/* Component Picker Modal */}
      {showComponentPicker && (
        <ComponentPicker
          onSelect={handleAddComponent}
          onCancel={() => setShowComponentPicker(false)}
        />
      )}

      {/* Component Editor Modal */}
      {editingComponent && (
        <ViewComponentEditor
          component={editingComponent}
          onSave={handleUpdateComponent}
          onCancel={() => setEditingComponent(null)}
        />
      )}
    </div>
  );
}
