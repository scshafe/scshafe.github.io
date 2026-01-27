'use client';

import { useState } from 'react';
import type { NavItem } from '@/lib/content/navigation';

const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'external', label: 'External Link' },
  { value: 'github', label: 'GitHub' },
  { value: 'rss', label: 'RSS' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
];

interface NavItemEditorProps {
  item: NavItem;
  onUpdate: (updates: Partial<NavItem>) => void;
  onRemove: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  saving: boolean;
  showPosition?: boolean;
}

export function NavItemEditor({
  item,
  onUpdate,
  onRemove,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  saving,
  showPosition = false,
}: NavItemEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localLabel, setLocalLabel] = useState(item.label);
  const [localUrl, setLocalUrl] = useState(item.url);

  const inputClass = 'w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]';
  const selectClass = 'px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`
        border border-[var(--border)] rounded-lg bg-[var(--background-secondary)] overflow-hidden transition-all
        ${isDragging ? 'opacity-50 ring-2 ring-[var(--link)]' : ''}
        ${isDragOver ? 'border-[var(--link)] bg-[var(--link)]/5' : ''}
      `}
    >
      {/* Collapsed View */}
      <div className="flex items-center gap-3 p-3">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] touch-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Label Preview */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[var(--foreground)] truncate">
            {item.label}
          </div>
          <div className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] truncate">
            {item.url}
            {item.external && (
              <span className="ml-2 text-amber-400">(external)</span>
            )}
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          title={isExpanded ? 'Collapse' : 'Edit'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          disabled={saving}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--background)]">
          {/* Label */}
          <div>
            <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
              Label
            </label>
            <input
              type="text"
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={() => {
                if (localLabel !== item.label) {
                  onUpdate({ label: localLabel });
                }
              }}
              className={inputClass}
              placeholder="Link label"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
              URL
            </label>
            <input
              type="text"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              onBlur={() => {
                if (localUrl !== item.url) {
                  onUpdate({ url: localUrl });
                }
              }}
              className={inputClass}
              placeholder="/path or https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Position (header only) */}
            {showPosition && (
              <div>
                <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
                  Position
                </label>
                <select
                  value={item.position || 'right'}
                  onChange={(e) => onUpdate({ position: e.target.value as 'left' | 'right' })}
                  className={selectClass}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            )}

            {/* Icon */}
            <div>
              <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground-secondary)] mb-1.5">
                Icon
              </label>
              <select
                value={item.icon || ''}
                onChange={(e) => onUpdate({ icon: e.target.value || null })}
                className={selectClass}
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* External Link Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`external-${item.id}`}
              checked={item.external || false}
              onChange={(e) => onUpdate({ external: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--border)] bg-[var(--background)] text-[var(--link)]"
            />
            <label
              htmlFor={`external-${item.id}`}
              className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)]"
            >
              Open in new tab (external link)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
