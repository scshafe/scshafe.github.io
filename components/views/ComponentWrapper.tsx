'use client';

import { useState } from 'react';
import type { ResolvedNode } from '@/lib/content/types';
import { getComponentTypeOptions } from '@/lib/content/views';

interface ComponentWrapperProps {
  node: ResolvedNode;
  children: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ComponentWrapper({
  node,
  children,
  isFirst = false,
  isLast = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ComponentWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const componentTypeLabels = Object.fromEntries(
    getComponentTypeOptions().map((opt) => [opt.type, opt.label])
  );

  const handleDelete = () => {
    if (!onDelete) return;
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDeleteConfirm(false);
      }}
    >
      {/* Invisible hover extension area above the component */}
      {isHovered && (
        <div className="absolute -top-10 left-0 right-0 h-10 pointer-events-none" />
      )}

      {/* Component Controls Toolbar */}
      {isHovered && (
        <div className="absolute -top-8 left-0 right-0 flex items-center justify-between z-50 pointer-events-auto">
          {/* Component Type Label and IDs */}
          <span className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
            {componentTypeLabels[node.type] || node.type}
            <span className="opacity-60 ml-2">
              comp:{node.comp_id} • node:{node.node_id} • ref:{node.ref_id}
            </span>
          </span>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md px-1 py-0.5 pointer-events-auto">
            {/* Move Up */}
            {onMoveUp && (
              <button
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {/* Move Down */}
            {onMoveDown && (
              <button
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {(onMoveUp || onMoveDown) && <div className="w-px h-4 bg-[var(--border)] mx-0.5" />}

            {/* Edit */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[ComponentWrapper] Edit button clicked for node:', node.comp_id);
                  onEdit();
                }}
                className="p-1 text-[var(--foreground-muted)] hover:text-[var(--link)] transition-colors"
                title="Edit component"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className={`p-1 transition-colors ${
                  showDeleteConfirm
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-[var(--foreground-muted)] hover:text-red-500'
                }`}
                title={showDeleteConfirm ? 'Click again to confirm' : 'Delete component'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Highlight Border */}
      <div
        className={`transition-all duration-150 ${
          isHovered
            ? 'ring-2 ring-[var(--link)] ring-opacity-50 rounded-md -m-2 p-2'
            : ''
        }`}
      >
        {children}
      </div>

      {/* Delete Confirmation Tooltip */}
      {showDeleteConfirm && (
        <div className="absolute -top-16 right-0 z-20 bg-red-500 text-white text-[length:var(--text-xs)] px-2 py-1 rounded shadow-lg">
          Click delete again to confirm
        </div>
      )}
    </div>
  );
}
