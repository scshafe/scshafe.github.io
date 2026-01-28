'use client';

import { useState } from 'react';
import type { ThemePair, ThemeColors, ColorScheme } from '@/lib/content/themes';
import { COLOR_LABELS } from '@/lib/content/themes';
import { ColorPicker } from './ColorPicker';

interface ThemeEditorProps {
  theme: ThemePair;
  isNew: boolean;
  onSave: (theme: ThemePair) => void;
  onCancel: () => void;
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

export function ThemeEditor({ theme, isNew, onSave, onCancel }: ThemeEditorProps) {
  const [name, setName] = useState(theme.name);
  const [defaultScheme, setDefaultScheme] = useState<ColorScheme>(theme.defaultScheme);
  const [lightColors, setLightColors] = useState<ThemeColors>(theme.light);
  const [darkColors, setDarkColors] = useState<ThemeColors>(theme.dark);
  const [activeTab, setActiveTab] = useState<ColorScheme>(theme.defaultScheme);
  const [nameError, setNameError] = useState<string | null>(null);

  const currentColors = activeTab === 'light' ? lightColors : darkColors;
  const setCurrentColors = activeTab === 'light' ? setLightColors : setDarkColors;

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setCurrentColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError('Theme name is required');
      return;
    }

    onSave({
      id: theme.id,
      name: name.trim(),
      light: lightColors,
      dark: darkColors,
      defaultScheme,
      isDefault: false,
    });
  };

  const colorKeys = Object.keys(COLOR_LABELS) as (keyof ThemeColors)[];

  return (
    <div className="bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
          {isNew ? 'Create New Theme' : `Edit: ${theme.name}`}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Theme Name */}
      <div className="mb-6">
        <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-2">
          Theme Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-[var(--foreground)] text-[length:var(--text-sm)] focus:outline-none focus:border-[var(--link)]"
          placeholder="My Custom Theme"
        />
        {nameError && (
          <p className="mt-1 text-[length:var(--text-xs)] text-red-400">{nameError}</p>
        )}
      </div>

      {/* Default Scheme Selection */}
      <div className="mb-6">
        <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-2">
          Default Mode
        </label>
        <p className="text-[length:var(--text-xs)] text-[var(--foreground-muted)] mb-2">
          Used when system preference is not available
        </p>
        <div className="flex gap-2">
          {(['light', 'dark'] as ColorScheme[]).map((scheme) => (
            <button
              key={scheme}
              onClick={() => setDefaultScheme(scheme)}
              className={`
                px-3 py-1.5 rounded-md text-[length:var(--text-sm)] font-medium transition-colors
                ${defaultScheme === scheme
                  ? 'bg-[var(--link)] text-white'
                  : 'bg-[var(--background)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]'
                }
              `}
            >
              {scheme === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </div>

      {/* Light/Dark Tab Selection */}
      <div className="mb-4">
        <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-2">
          Edit Colors
        </label>
        <div className="flex gap-1 p-1 bg-[var(--background)] rounded-lg border border-[var(--border)]">
          {(['light', 'dark'] as ColorScheme[]).map((scheme) => (
            <button
              key={scheme}
              onClick={() => setActiveTab(scheme)}
              className={`
                flex-1 px-4 py-2 rounded-md text-[length:var(--text-sm)] font-medium transition-colors flex items-center justify-center gap-2
                ${activeTab === scheme
                  ? 'bg-[var(--link)] text-white'
                  : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                }
              `}
            >
              {scheme === 'light' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="mb-6">
        <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-2">
          Live Preview ({activeTab === 'light' ? 'Light' : 'Dark'})
        </label>
        <div
          className="rounded-lg p-4 space-y-3 border"
          style={{
            backgroundColor: currentColors.background,
            borderColor: currentColors.border
          }}
        >
          <div
            className="rounded p-2"
            style={{ backgroundColor: currentColors.backgroundSecondary }}
          >
            <span style={{ color: currentColors.foreground }} className="text-[length:var(--text-sm)] font-medium">
              Header Text
            </span>
          </div>
          <p style={{ color: currentColors.foreground }} className="text-[length:var(--text-sm)]">
            This is primary text content.
          </p>
          <p style={{ color: currentColors.foregroundSecondary }} className="text-[length:var(--text-sm)]">
            This is secondary text content.
          </p>
          <p style={{ color: currentColors.foregroundMuted }} className="text-[length:var(--text-xs)]">
            This is muted text content.
          </p>
          <div className="flex gap-2">
            <span style={{ color: currentColors.link }} className="text-[length:var(--text-sm)]">Link text</span>
            <span style={{ color: currentColors.accent }} className="text-[length:var(--text-sm)]">Accent text</span>
          </div>
          <div
            className="rounded p-2 text-[length:var(--text-xs)] font-mono"
            style={{
              backgroundColor: currentColors.backgroundCode,
              color: currentColors.foregroundMuted,
              border: `1px solid ${currentColors.border}`
            }}
          >
            const code = &quot;example&quot;;
          </div>
        </div>
      </div>

      {/* Color Editors */}
      <div className="mb-6">
        <label className="block text-[length:var(--text-sm)] font-medium text-[var(--foreground)] mb-3">
          {activeTab === 'light' ? 'Light Mode' : 'Dark Mode'} Colors
        </label>
        <div className="grid gap-3">
          {colorKeys.map((key) => (
            <ColorPicker
              key={key}
              label={COLOR_LABELS[key]}
              value={currentColors[key]}
              onChange={(value) => updateColor(key, value)}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors"
        >
          {isNew ? 'Create Theme' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
