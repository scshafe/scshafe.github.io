'use client';

import type { ViewComponentType } from '@/lib/content/views';
import { getComponentTypeOptions } from '@/lib/content/views';

interface ComponentPickerProps {
  onSelect: (type: ViewComponentType) => void;
  onCancel: () => void;
}

export function ComponentPicker({ onSelect, onCancel }: ComponentPickerProps) {
  const options = getComponentTypeOptions();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--foreground)]">
            Add Component
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => (
              <button
                key={option.type}
                onClick={() => onSelect(option.type)}
                className="p-3 text-left border border-[var(--border)] rounded-md hover:border-[var(--link)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                <div className="font-medium text-[var(--foreground)]">
                  {option.label}
                </div>
                <div className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mt-0.5">
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
