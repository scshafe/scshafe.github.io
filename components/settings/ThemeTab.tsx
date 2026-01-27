'use client';

import { useState, useCallback } from 'react';
import type { ThemePair, ThemeConfig, ColorSchemePreference, ThemeColors } from '@/lib/content/themes';
import { DEFAULT_THEMES, getThemeColors } from '@/lib/content/themes';
import { useTheme, applyThemeColors } from '@/components/theme';
import { ThemePreview } from './ThemePreview';
import { ThemeEditor } from './ThemeEditor';
import { CreateThemeModal } from './CreateThemeModal';

const DEV_EDITOR_URL = 'http://localhost:3001';

interface ThemeTabProps {
  initialConfig: ThemeConfig;
  onThemeChange: (colors: ThemeColors) => void;
}

export function ThemeTab({ initialConfig, onThemeChange }: ThemeTabProps) {
  const { colorScheme, preference, setPreference } = useTheme();
  const [config, setConfig] = useState<ThemeConfig>(initialConfig);
  const [editingTheme, setEditingTheme] = useState<ThemePair | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allThemes = [...DEFAULT_THEMES, ...config.customThemes];
  const activeTheme = allThemes.find(t => t.id === config.activeThemeId) || DEFAULT_THEMES[0];

  const saveConfig = useCallback(async (newConfig: ThemeConfig) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${DEV_EDITOR_URL}/themes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setConfig(newConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

      // Apply the active theme colors
      const newActiveTheme = [...DEFAULT_THEMES, ...newConfig.customThemes].find(
        t => t.id === newConfig.activeThemeId
      ) || DEFAULT_THEMES[0];
      const colors = getThemeColors(newActiveTheme, colorScheme);
      onThemeChange(colors);
      applyThemeColors(colors);
    } catch {
      setError('Failed to save theme configuration');
    } finally {
      setSaving(false);
    }
  }, [colorScheme, onThemeChange]);

  const handleSelectTheme = useCallback((themeId: string) => {
    const newConfig = { ...config, activeThemeId: themeId };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  const handlePreferenceChange = useCallback((pref: ColorSchemePreference) => {
    setPreference(pref);
    // Also save to config
    const newConfig = { ...config, colorSchemePreference: pref };
    saveConfig(newConfig);
  }, [config, setPreference, saveConfig]);

  const handleCreateTheme = useCallback((newTheme: ThemePair) => {
    setShowCreateModal(false);
    setEditingTheme(newTheme);
    setIsCreating(true);
  }, []);

  const handleSaveTheme = useCallback((theme: ThemePair) => {
    const newCustomThemes = isCreating
      ? [...config.customThemes, theme]
      : config.customThemes.map(t => t.id === theme.id ? theme : t);

    const newConfig: ThemeConfig = {
      activeThemeId: config.activeThemeId,
      colorSchemePreference: config.colorSchemePreference,
      customThemes: newCustomThemes,
    };

    saveConfig(newConfig);
    setEditingTheme(null);
    setIsCreating(false);
  }, [config, isCreating, saveConfig]);

  const handleDeleteTheme = useCallback((themeId: string) => {
    if (!confirm('Are you sure you want to delete this theme?')) {
      return;
    }

    const newCustomThemes = config.customThemes.filter(t => t.id !== themeId);
    const newActiveThemeId = config.activeThemeId === themeId
      ? DEFAULT_THEMES[0].id
      : config.activeThemeId;

    const newConfig: ThemeConfig = {
      activeThemeId: newActiveThemeId,
      colorSchemePreference: config.colorSchemePreference,
      customThemes: newCustomThemes,
    };

    saveConfig(newConfig);
  }, [config, saveConfig]);

  const handleCancelEdit = useCallback(() => {
    setEditingTheme(null);
    setIsCreating(false);
  }, []);

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-[length:var(--text-sm)]">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md text-green-400 text-[length:var(--text-sm)]">
          Changes saved successfully!
        </div>
      )}

      {/* Theme Editor (shown when editing) */}
      {editingTheme && (
        <ThemeEditor
          theme={editingTheme}
          isNew={isCreating}
          onSave={handleSaveTheme}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Theme Selection (hidden when editing) */}
      {!editingTheme && (
        <>
          {/* Color Scheme Preference */}
          <section>
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)] mb-2">
              Color Scheme
            </h2>
            <p className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)] mb-4">
              Choose how the theme adapts to your system settings.
            </p>
            <div className="flex gap-2">
              {(['system', 'light', 'dark'] as ColorSchemePreference[]).map((pref) => (
                <button
                  key={pref}
                  onClick={() => handlePreferenceChange(pref)}
                  className={`
                    px-4 py-2 rounded-md text-[length:var(--text-sm)] font-medium transition-colors
                    ${preference === pref
                      ? 'bg-[var(--link)] text-white'
                      : 'bg-[var(--background)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] border border-[var(--border)]'
                    }
                  `}
                >
                  {pref === 'system' && (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      System
                    </span>
                  )}
                  {pref === 'light' && (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Light
                    </span>
                  )}
                  {pref === 'dark' && (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Dark
                    </span>
                  )}
                </button>
              ))}
            </div>
            {preference === 'system' && (
              <p className="mt-2 text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
                Currently using: {colorScheme} mode (based on system preference)
              </p>
            )}
          </section>

          {/* Current Theme Info */}
          <section>
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)] mb-2">
              Current Theme
            </h2>
            <p className="text-[length:var(--text-sm)] text-[var(--foreground-secondary)] mb-4">
              Active: <span className="font-medium text-[var(--foreground)]">{activeTheme.name}</span>
              {activeTheme.isDefault && (
                <span className="ml-2 text-[length:var(--text-xs)] text-[var(--foreground-muted)]">(Default)</span>
              )}
              <span className="ml-2 text-[length:var(--text-xs)] text-[var(--foreground-muted)]">
                Default mode: {activeTheme.defaultScheme}
              </span>
            </p>
          </section>

          {/* Default Themes */}
          <section>
            <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)] mb-4">
              Default Themes
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DEFAULT_THEMES.map((theme) => (
                <ThemePreview
                  key={theme.id}
                  theme={theme}
                  colorScheme={colorScheme}
                  isActive={config.activeThemeId === theme.id}
                  onSelect={() => handleSelectTheme(theme.id)}
                  showActions={false}
                />
              ))}
            </div>
          </section>

          {/* Custom Themes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[length:var(--text-lg)] font-semibold text-[var(--foreground)]">
                Custom Themes
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[length:var(--text-sm)] bg-[var(--link)] text-white rounded-md hover:bg-[var(--link-hover)] transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Theme
              </button>
            </div>

            {config.customThemes.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[var(--border)] rounded-lg">
                <svg className="w-12 h-12 mx-auto text-[var(--foreground-muted)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <p className="text-[var(--foreground-muted)] text-[length:var(--text-sm)]">
                  No custom themes yet
                </p>
                <p className="text-[var(--foreground-muted)] text-[length:var(--text-xs)] mt-1">
                  Click &quot;Create Theme&quot; to make your own
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {config.customThemes.map((theme) => (
                  <ThemePreview
                    key={theme.id}
                    theme={theme}
                    colorScheme={colorScheme}
                    isActive={config.activeThemeId === theme.id}
                    onSelect={() => handleSelectTheme(theme.id)}
                    onEdit={() => {
                      setEditingTheme(theme);
                      setIsCreating(false);
                    }}
                    onDelete={() => handleDeleteTheme(theme.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Create Theme Modal */}
      {showCreateModal && (
        <CreateThemeModal
          customThemes={config.customThemes}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTheme}
        />
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-md px-4 py-2 shadow-lg flex items-center gap-2 text-[length:var(--text-sm)]">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Saving...
        </div>
      )}
    </div>
  );
}
