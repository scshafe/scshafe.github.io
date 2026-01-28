'use client';

import { useState } from 'react';
import type { ThemePair, ThemeColors, ColorScheme } from '@/lib/content/themes';
import { DEFAULT_THEMES, getThemeColors } from '@/lib/content/themes';

// Generate a slug ID for themes
function generateThemeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `theme-${Date.now()}`;
}

interface CreateThemeModalProps {
  customThemes: ThemePair[];
  onClose: () => void;
  onCreate: (theme: ThemePair) => void;
}

const DEFAULT_DARK_COLORS: ThemeColors = {
  background: '#1a1a2e',
  backgroundSecondary: '#16213e',
  backgroundCode: '#0f0f1a',
  foreground: '#eaeaea',
  foregroundSecondary: '#b0b0b0',
  foregroundMuted: '#6c6c8a',
  link: '#4da6ff',
  linkHover: '#7fc1ff',
  border: '#2a2a4a',
  accent: '#ff6b6b',
  accentHover: '#ff8585',
};

const DEFAULT_LIGHT_COLORS: ThemeColors = {
  background: '#ffffff',
  backgroundSecondary: '#f5f5f5',
  backgroundCode: '#f0f0f0',
  foreground: '#1a1a1a',
  foregroundSecondary: '#4a4a4a',
  foregroundMuted: '#8a8a8a',
  link: '#0066cc',
  linkHover: '#0052a3',
  border: '#e0e0e0',
  accent: '#d93025',
  accentHover: '#c62828',
};

export function CreateThemeModal({ customThemes, onClose, onCreate }: CreateThemeModalProps) {
  const [mode, setMode] = useState<'choose' | 'name'>('choose');
  const [selectedBaseTheme, setSelectedBaseTheme] = useState<ThemePair | null>(null);
  const [themeName, setThemeName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const allThemes = [...DEFAULT_THEMES, ...customThemes];

  const handleSelectBase = (theme: ThemePair | null) => {
    setSelectedBaseTheme(theme);
    setMode('name');
    if (theme) {
      setThemeName(`${theme.name} Copy`);
    } else {
      setThemeName('New Theme');
    }
  };

  const handleCreate = () => {
    if (!themeName.trim()) {
      setNameError('Theme name is required');
      return;
    }

    const baseLightColors: ThemeColors = selectedBaseTheme?.light || DEFAULT_LIGHT_COLORS;
    const baseDarkColors: ThemeColors = selectedBaseTheme?.dark || DEFAULT_DARK_COLORS;
    const baseDefaultScheme: ColorScheme = selectedBaseTheme?.defaultScheme || 'dark';

    const newTheme: ThemePair = {
      id: generateThemeId(themeName.trim()),
      name: themeName.trim(),
      light: { ...baseLightColors },
      dark: { ...baseDarkColors },
      defaultScheme: baseDefaultScheme,
      isDefault: false,
    };

    onCreate(newTheme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
            Create New Theme
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {mode === 'choose' ? (
            <>
              <p className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)] mb-4">
                Choose a starting point for your new theme:
              </p>

              {/* Start from scratch option */}
              <button
                onClick={() => handleSelectBase(null)}
                className="w-full p-4 mb-4 border-2 border-dashed border-[var(--border)] rounded-lg hover:border-[var(--link)] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[length:var(--text-sm)] font-medium text-[var(--foreground)]">
                      Start from scratch
                    </p>
                    <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
                      Begin with default light and dark colors
                    </p>
                  </div>
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
                  or duplicate from
                </span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Theme list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allThemes.map((theme) => {
                  const darkColors = getThemeColors(theme, 'dark');
                  const lightColors = getThemeColors(theme, 'light');
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectBase(theme)}
                      className="w-full p-3 border border-[var(--border)] rounded-lg hover:border-[var(--link)] transition-colors text-left flex items-center gap-3"
                    >
                      {/* Color preview - show both light and dark */}
                      <div className="flex gap-1">
                        {/* Dark variant preview */}
                        <div className="flex flex-col gap-0.5">
                          <div
                            className="w-3 h-3 rounded-tl"
                            style={{ backgroundColor: darkColors.background }}
                          />
                          <div
                            className="w-3 h-3 rounded-bl"
                            style={{ backgroundColor: darkColors.link }}
                          />
                        </div>
                        {/* Light variant preview */}
                        <div className="flex flex-col gap-0.5">
                          <div
                            className="w-3 h-3 rounded-tr"
                            style={{ backgroundColor: lightColors.background }}
                          />
                          <div
                            className="w-3 h-3 rounded-br"
                            style={{ backgroundColor: lightColors.link }}
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[length:var(--text-sm)] font-medium text-[var(--foreground)] truncate">
                          {theme.name}
                        </p>
                        <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
                          {theme.isDefault ? 'Default theme' : 'Custom theme'} · Default: {theme.defaultScheme}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)] mb-4">
                {selectedBaseTheme
                  ? `Creating a copy of "${selectedBaseTheme.name}" with both light and dark variants`
                  : 'Starting with default light and dark colors'
                }
              </p>

              <div className="mb-4">
                <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-2">
                  Theme Name
                </label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => {
                    setThemeName(e.target.value);
                    setNameError(null);
                  }}
                  autoFocus
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]"
                  placeholder="My Custom Theme"
                />
                {nameError && (
                  <p className="mt-1 text-[length:var(--text-xs)] text-red-400">{nameError}</p>
                )}
              </div>

              <button
                onClick={() => setMode('choose')}
                className="text-[length:var(--text-sm)] text-[var(--link)] hover:text-[var(--link-hover)] transition-colors"
              >
                &larr; Choose a different base
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          {mode === 'name' && (
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
            >
              Create Theme
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
