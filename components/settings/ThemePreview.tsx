'use client';

import type { ThemePair, ColorScheme } from '@/lib/content/themes';
import { getThemeColors } from '@/lib/content/themes';

interface ThemePreviewProps {
  theme: ThemePair;
  colorScheme: ColorScheme;
  isActive: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function ThemePreview({
  theme,
  colorScheme,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  showActions = true
}: ThemePreviewProps) {
  const colors = getThemeColors(theme, colorScheme);

  return (
    <div
      className={`
        relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden
        ${isActive
          ? 'border-[var(--link)] ring-2 ring-[var(--link)]/30'
          : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
        }
      `}
      onClick={onSelect}
    >
      {/* Mini preview */}
      <div
        className="p-3 space-y-2"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header preview */}
        <div
          className="h-3 rounded-sm"
          style={{ backgroundColor: colors.backgroundSecondary }}
        />

        {/* Content preview */}
        <div className="space-y-1.5">
          <div
            className="h-2 w-3/4 rounded-sm"
            style={{ backgroundColor: colors.foreground }}
          />
          <div
            className="h-2 w-1/2 rounded-sm"
            style={{ backgroundColor: colors.foregroundSecondary }}
          />
          <div
            className="h-2 w-1/3 rounded-sm"
            style={{ backgroundColor: colors.link }}
          />
        </div>

        {/* Code block preview */}
        <div
          className="h-6 rounded-sm p-1"
          style={{
            backgroundColor: colors.backgroundCode,
            border: `1px solid ${colors.border}`
          }}
        >
          <div
            className="h-1.5 w-2/3 rounded-sm"
            style={{ backgroundColor: colors.foregroundMuted }}
          />
        </div>

        {/* Accent preview */}
        <div className="flex gap-1">
          <div
            className="h-2 w-8 rounded-sm"
            style={{ backgroundColor: colors.accent }}
          />
          <div
            className="h-2 w-6 rounded-sm"
            style={{ backgroundColor: colors.link }}
          />
        </div>
      </div>

      {/* Theme name and actions */}
      <div
        className="px-3 py-2 flex items-center justify-between gap-2"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[length:var(--text-sm)] font-medium truncate"
            style={{ color: colors.foreground }}
          >
            {theme.name}
          </span>
          {theme.isDefault && (
            <span
              className="text-[length:var(--text-xs)] px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: colors.border,
                color: colors.foregroundMuted
              }}
            >
              Default
            </span>
          )}
        </div>

        {showActions && !theme.isDefault && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 rounded hover:bg-black/20 transition-colors"
                title="Edit theme"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke={colors.foregroundSecondary}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 rounded hover:bg-black/20 transition-colors"
                title="Delete theme"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke={colors.accent}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-[var(--link)] flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
