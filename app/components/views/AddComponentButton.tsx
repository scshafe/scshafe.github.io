'use client';

import { useState } from 'react';
import type { ViewComponentType, ViewComponent, NodeId } from '@/lib/content/views';
import { getComponentTypeOptions, createDefaultComponent } from '@/lib/content/views';

interface AddComponentButtonProps {
  existingComponents?: ViewComponent[];
  viewId?: NodeId;
  onAdd: (component: ViewComponent) => void;
  allowedTypes?: ViewComponentType[];
  label?: string;
}

export function AddComponentButton({
  existingComponents = [],
  viewId,
  onAdd,
  allowedTypes,
  label = 'Add Component'
}: AddComponentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const allOptions = getComponentTypeOptions();
  const componentOptions = allowedTypes
    ? allOptions.filter(opt => allowedTypes.includes(opt.type))
    : allOptions;

  const handleSelect = (type: ViewComponentType) => {
    const newComponent = createDefaultComponent(type, existingComponents, viewId ?? null);
    // Add parentId to the new component
    newComponent.parentId = viewId ?? null;
    onAdd(newComponent);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 border-2 border-dashed border-[var(--border)] rounded-md text-[var(--foreground-muted)] hover:border-[var(--link)] hover:text-[var(--link)] transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {label}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 mt-2 z-50 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {componentOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleSelect(option.type)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--background-secondary)] transition-colors border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="font-medium text-[var(--foreground)]">
                    {option.label}
                  </div>
                  <div className="text-[length:var(--text-sm)] text-[var(--foreground-muted)]">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
